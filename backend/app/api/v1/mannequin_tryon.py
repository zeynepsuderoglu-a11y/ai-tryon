import uuid
import logging
import traceback

from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.generation import Generation, GenerationStatus, GarmentCategory
from app.schemas.tryon import TryOnResponse, TryOnStatusResponse
from app.services.mannequin_tryon_service import mannequin_tryon_service
from app.services.garment_analysis_service import analyze_garment
from app.services.credit_service import credit_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mannequin-tryon", tags=["mannequin-tryon"])

CREDITS_COST = 2

SLEEPWEAR_KEYWORDS = (
    "pajama", "pyjama", "pijama", "nightwear", "sleepwear", "nightgown",
    "gecelik", "loungewear", "robe", "sleep", "lounge",
)


def _is_sleepwear(garment_type: str, texture_prompt: str) -> bool:
    combined = (garment_type + " " + texture_prompt).lower()
    return any(kw in combined for kw in SLEEPWEAR_KEYWORDS)


def _compute_locks(proportion_hint: str, garment_type: str, category: str) -> tuple[str, str]:
    _ph = proportion_hint.lower()
    _gt = garment_type.lower()

    sleeve_lock = ""
    if "spaghetti" in _gt or ("sleeveless" in _ph and ("strap" in _gt or "tank" in _gt)):
        sleeve_lock = "sleeveless spaghetti-strap — NO sleeves"
    elif "sleeveless" in _ph or "sleeveless" in _gt:
        sleeve_lock = "sleeveless — do NOT add sleeves"
    elif "short sleeve" in _ph or "short-sleeve" in _ph or "mid-bicep" in _ph or "elbow-length" in _ph or "short sleeve" in _gt or "short-sleeve" in _gt:
        sleeve_lock = "SHORT sleeves — do NOT extend to wrist"
    elif "3/4" in _ph or "mid-forearm" in _ph:
        sleeve_lock = "3/4-length sleeves to mid-forearm — do NOT extend to wrist"

    bottom_lock = ""
    if category in ("one-pieces", "bottoms"):
        if "short" in _ph or "shorts" in _gt or "hot pants" in _ph:
            bottom_lock = "SHORT shorts ending at mid-thigh — NOT long pants"
        elif any(k in _ph for k in ("palazzo", "wide-leg", "wide leg", "culotte")):
            bottom_lock = "WIDE-LEG palazzo pants — do NOT narrow or taper the leg"
        elif "maxi" in _ph or ("floor" in _ph and "length" in _ph):
            bottom_lock = "maxi-length to floor — do NOT shorten"
        elif "midi" in _ph:
            bottom_lock = "midi-length — do NOT shorten to mini"
        elif "ankle" in _ph or ("full" in _ph and "length" in _ph and "pant" in _ph):
            bottom_lock = "full-length pants to ankle — do NOT shorten"

    return sleeve_lock, bottom_lock


async def _process_background(
    generation_id: uuid.UUID,
    mannequin_id: int,
    garment_url: str,
):
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            # 1. Kıyafet analizi
            logger.info("[mannequin-tryon/%s] Garment analizi başlıyor", generation_id)
            analysis = await analyze_garment(garment_url, "auto", [])
            logger.info(
                "[mannequin-tryon/%s] Garment: %s | category=%s",
                generation_id, analysis.garment_type, analysis.category,
            )

            sleeve_lock, bottom_lock = _compute_locks(
                analysis.proportion_hint, analysis.garment_type, analysis.category
            )
            sleepwear = _is_sleepwear(analysis.garment_type, analysis.texture_prompt)
            logger.info(
                "[mannequin-tryon/%s] sleeve=%r bottom=%r sleepwear=%s",
                generation_id, sleeve_lock or "none", bottom_lock or "none", sleepwear,
            )

            # 2. Görsel üretimi
            output_url = await mannequin_tryon_service.run(
                mannequin_id=mannequin_id,
                garment_url=garment_url,
                texture_prompt=analysis.texture_prompt,
                proportion_hint=analysis.proportion_hint,
                critical_detail=analysis.critical_detail,
                sleeve_lock=sleeve_lock,
                bottom_lock=bottom_lock,
                is_sleepwear=sleepwear,
            )
            logger.info("[mannequin-tryon/%s] Tamamlandı: %s", generation_id, output_url)

            result = await db.execute(select(Generation).where(Generation.id == generation_id))
            gen = result.scalar_one_or_none()
            if gen:
                gen.output_urls = [output_url]
                gen.status = GenerationStatus.completed
                await db.commit()

        except Exception as e:
            tb = traceback.format_exc()
            logger.error("[mannequin-tryon/%s] Başarısız: %s\n%s", generation_id, e, tb)

            result = await db.execute(select(Generation).where(Generation.id == generation_id))
            gen = result.scalar_one_or_none()
            if gen:
                gen.status = GenerationStatus.failed
                gen.error_message = f"{type(e).__name__}: {e}"
                try:
                    from app.models.credit_transaction import TransactionType
                    await credit_service.add_credits(
                        db, gen.user_id, gen.credits_used,
                        transaction_type=TransactionType.admin,
                        description=f"Başarısız manken try-on iadesi ({generation_id})",
                    )
                except Exception as refund_err:
                    logger.error("[mannequin-tryon/%s] Kredi iadesi başarısız: %s", generation_id, refund_err)
                await db.commit()


@router.post("/run", response_model=TryOnResponse)
async def run_mannequin_tryon(
    background_tasks: BackgroundTasks,
    garment_url: str = Form(...),
    mannequin_id: int = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if mannequin_id < 1 or mannequin_id > 7:
        raise HTTPException(status_code=400, detail="Geçersiz manken ID (1-7)")

    if not await credit_service.check_credits(current_user, CREDITS_COST):
        raise HTTPException(status_code=402, detail="Insufficient credits")

    await credit_service.deduct_credits(
        db, current_user.id, CREDITS_COST,
        description="Manken try-on generation",
    )

    generation = Generation(
        user_id=current_user.id,
        garment_url=garment_url,
        status=GenerationStatus.processing,
        category=GarmentCategory.mannequin_tryon,
        credits_used=CREDITS_COST,
    )
    db.add(generation)
    await db.flush()

    background_tasks.add_task(_process_background, generation.id, mannequin_id, garment_url)

    await db.commit()
    return TryOnResponse(generation_id=generation.id, status=generation.status)


@router.get("/{generation_id}/status", response_model=TryOnStatusResponse)
async def get_status(
    generation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Generation).where(
            Generation.id == generation_id,
            Generation.user_id == current_user.id,
        )
    )
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
    return gen
