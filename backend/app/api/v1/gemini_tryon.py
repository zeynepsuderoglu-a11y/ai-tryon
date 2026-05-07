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
from app.models.model_asset import ModelAsset
from app.schemas.tryon import TryOnResponse, TryOnStatusResponse
from app.services.gemini_tryon_service import gemini_tryon_service
from app.services.garment_analysis_service import analyze_garment
from app.services.credit_service import credit_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-pro", tags=["ai-pro"])

CREDITS_COST = 2


def _compute_locks(proportion_hint: str, garment_type: str, category: str) -> tuple[str, str]:
    """proportion_hint'ten sleeve ve bottom kilidini hesaplar."""
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


async def process_gemini_tryon_background(
    generation_id: uuid.UUID,
    model_image_url: str,
    garment_url: str,
    background: str,
    crop_type: str,
):
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            logger.info("[gemini-tryon/%s] Garment analizi başlıyor", generation_id)
            analysis = await analyze_garment(garment_url, "auto", [])
            logger.info("[gemini-tryon/%s] Garment: %s | category=%s", generation_id, analysis.garment_type, analysis.category)

            sleeve_lock, bottom_lock = _compute_locks(
                analysis.proportion_hint, analysis.garment_type, analysis.category
            )
            logger.info("[gemini-tryon/%s] Locks: sleeve=%r bottom=%r", generation_id, sleeve_lock or "none", bottom_lock or "none")

            crop_frame = (
                "upper body shot from head to mid-thigh, model centered in frame"
                if crop_type == "half_body"
                else "full body shot, complete figure from head to feet, both feet fully visible, model centered"
            )

            output_url = await gemini_tryon_service.run(
                model_image_url=model_image_url,
                garment_url=garment_url,
                garment_type=analysis.garment_type,
                texture_prompt=analysis.texture_prompt,
                proportion_hint=analysis.proportion_hint,
                critical_detail=analysis.critical_detail,
                sleeve_lock=sleeve_lock,
                bottom_lock=bottom_lock,
                background=background,
                crop_frame=crop_frame,
            )

            logger.info("[gemini-tryon/%s] Tamamlandı: %s", generation_id, output_url)

            result = await db.execute(select(Generation).where(Generation.id == generation_id))
            gen = result.scalar_one_or_none()
            if gen:
                gen.output_urls = [output_url]
                gen.status = GenerationStatus.completed
                await db.commit()

        except Exception as e:
            tb = traceback.format_exc()
            logger.error("[gemini-tryon/%s] Başarısız: %s\n%s", generation_id, e, tb)

            result = await db.execute(select(Generation).where(Generation.id == generation_id))
            gen = result.scalar_one_or_none()
            if gen:
                gen.status = GenerationStatus.failed
                gen.error_message = "İşlem tamamlanamadı. Lütfen tekrar deneyin."
                try:
                    from app.models.credit_transaction import TransactionType
                    await credit_service.add_credits(
                        db, gen.user_id, gen.credits_used,
                        transaction_type=TransactionType.admin,
                        description=f"Başarısız Gemini try-on iadesi (generation {generation_id})",
                    )
                    logger.info("[gemini-tryon/%s] Kredi iadesi yapıldı", generation_id)
                except Exception as refund_err:
                    logger.error("[gemini-tryon/%s] Kredi iadesi başarısız: %s", generation_id, refund_err)
                await db.commit()


@router.post("/run", response_model=TryOnResponse)
async def run_gemini_tryon(
    background_tasks: BackgroundTasks,
    garment_url: str = Form(...),
    model_asset_id: uuid.UUID = Form(...),
    background: str = Form("white_studio"),
    crop_type: str = Form("full_body"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await credit_service.check_credits(current_user, CREDITS_COST):
        raise HTTPException(status_code=402, detail="Insufficient credits")

    model_result = await db.execute(
        select(ModelAsset).where(ModelAsset.id == model_asset_id, ModelAsset.is_active == True)
    )
    model = model_result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    await credit_service.deduct_credits(
        db, current_user.id, CREDITS_COST,
        description="Gemini Nano Banana try-on generation",
    )

    generation = Generation(
        user_id=current_user.id,
        model_asset_id=model_asset_id,
        garment_url=garment_url,
        status=GenerationStatus.processing,
        category=GarmentCategory.tops,  # analiz sonrası güncellenmez, sadece kayıt için
        credits_used=CREDITS_COST,
    )
    db.add(generation)
    await db.flush()

    crop_type_val = "half_body" if model.crop_type and model.crop_type.value == "half_body" else "full_body"

    background_tasks.add_task(
        process_gemini_tryon_background,
        generation.id,
        model.image_url,
        garment_url,
        background,
        crop_type_val,
    )

    await db.commit()
    return TryOnResponse(generation_id=generation.id, status=generation.status)


@router.get("/{generation_id}/status", response_model=TryOnStatusResponse)
async def get_gemini_tryon_status(
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
