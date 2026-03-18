import uuid
import logging
import traceback

import httpx
from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.generation import Generation, GenerationStatus, GarmentCategory
from app.models.model_asset import ModelAsset
from app.schemas.tryon import TryOnResponse, TryOnStatusResponse
from app.services.eyewear_service import eyewear_service
from app.services.credit_service import credit_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/eyewear", tags=["eyewear"])


async def process_eyewear_background(
    generation_id: uuid.UUID,
    model_image_url: str,
    glasses_url: str,
):
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                mann_resp = await client.get(model_image_url)
                mann_resp.raise_for_status()
                mannequin_bytes = mann_resp.content

                glass_resp = await client.get(glasses_url)
                glass_resp.raise_for_status()
                glasses_bytes = glass_resp.content

            logger.info("[eyewear/%s] Servis çağrısı başlıyor", generation_id)
            output_url = await eyewear_service.try_on(mannequin_bytes, glasses_bytes)
            logger.info("[eyewear/%s] Tamamlandı: %s", generation_id, output_url)

            result = await db.execute(
                select(Generation).where(Generation.id == generation_id)
            )
            gen = result.scalar_one_or_none()
            if gen:
                gen.output_urls = [output_url]
                gen.status = GenerationStatus.completed
                await db.commit()

        except Exception as e:
            tb = traceback.format_exc()
            logger.error("[eyewear/%s] Başarısız: %s\n%s", generation_id, e, tb)

            result = await db.execute(
                select(Generation).where(Generation.id == generation_id)
            )
            gen = result.scalar_one_or_none()
            if gen:
                gen.status = GenerationStatus.failed
                gen.error_message = f"{type(e).__name__}: {e}\n{tb}"
                try:
                    from app.models.credit_transaction import TransactionType
                    await credit_service.add_credits(
                        db, gen.user_id, gen.credits_used,
                        transaction_type=TransactionType.admin,
                        description=f"Başarısız gözlük try-on iadesi (generation {generation_id})",
                    )
                    logger.info("[eyewear/%s] Kredi iadesi yapıldı", generation_id)
                except Exception as refund_err:
                    logger.error("[eyewear/%s] Kredi iadesi başarısız: %s", generation_id, refund_err)
                await db.commit()


@router.post("/run", response_model=TryOnResponse)
async def run_eyewear(
    background_tasks: BackgroundTasks,
    glasses_url: str = Form(...),
    model_asset_id: uuid.UUID = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    credits_cost = 1
    if not await credit_service.check_credits(current_user, credits_cost):
        raise HTTPException(status_code=402, detail="Insufficient credits")

    model_result = await db.execute(
        select(ModelAsset).where(
            ModelAsset.id == model_asset_id,
            ModelAsset.is_active == True,
        )
    )
    model = model_result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    await credit_service.deduct_credits(
        db, current_user.id, credits_cost,
        description="Eyewear try-on generation",
    )

    generation = Generation(
        user_id=current_user.id,
        model_asset_id=model_asset_id,
        garment_url=glasses_url,
        status=GenerationStatus.processing,
        category=GarmentCategory.eyewear,
        credits_used=credits_cost,
    )
    db.add(generation)
    await db.flush()

    background_tasks.add_task(
        process_eyewear_background,
        generation.id,
        model.image_url,
        glasses_url,
    )

    return TryOnResponse(generation_id=generation.id, status=generation.status)


@router.get("/{generation_id}/status", response_model=TryOnStatusResponse)
async def get_eyewear_status(
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
