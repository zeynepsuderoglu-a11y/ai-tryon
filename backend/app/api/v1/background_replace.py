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
from app.services.background_replace_service import background_replace_service
from app.services.credit_service import credit_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/background-replace", tags=["background-replace"])


async def process_background_replace_background(
    new_generation_id: uuid.UUID,
    input_image_url: str,
    background: str = "white_studio",
    custom_bg_url: str = "",
):
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            logger.info("[bg-replace/%s] Servis çağrısı başlıyor (background=%s)", new_generation_id, background)
            output_url = await background_replace_service.run(input_image_url, background, custom_bg_url)
            logger.info("[bg-replace/%s] Tamamlandı: %s", new_generation_id, output_url)

            result = await db.execute(
                select(Generation).where(Generation.id == new_generation_id)
            )
            gen = result.scalar_one_or_none()
            if gen:
                gen.output_urls = [output_url]
                gen.status = GenerationStatus.completed
                await db.commit()

        except Exception as e:
            tb = traceback.format_exc()
            logger.error("[bg-replace/%s] Başarısız: %s\n%s", new_generation_id, e, tb)

            result = await db.execute(
                select(Generation).where(Generation.id == new_generation_id)
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
                        description=f"Başarısız arka plan değiştirme iadesi (generation {new_generation_id})",
                    )
                    logger.info("[bg-replace/%s] Kredi iadesi yapıldı", new_generation_id)
                except Exception as refund_err:
                    logger.error("[bg-replace/%s] Kredi iadesi başarısız: %s", new_generation_id, refund_err)
                await db.commit()


@router.post("/run", response_model=TryOnResponse)
async def run_background_replace(
    background_tasks: BackgroundTasks,
    image_url: str = Form(...),
    background: str = Form("white_studio"),
    custom_bg_url: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    image_url: değiştirilecek fotoğrafın URL'si
    background: hazır arka plan key'i veya "custom"
    custom_bg_url: özel arka plan Cloudinary URL'si (background=="custom" ise)
    """
    credits_cost = 1

    if not await credit_service.check_credits(current_user, credits_cost):
        raise HTTPException(status_code=402, detail="Insufficient credits")

    await credit_service.deduct_credits(
        db, current_user.id, credits_cost,
        description="Background replace generation",
    )

    new_gen = Generation(
        user_id=current_user.id,
        garment_url=image_url,
        status=GenerationStatus.processing,
        category=GarmentCategory.background_replace,
        credits_used=credits_cost,
    )
    db.add(new_gen)
    await db.flush()

    background_tasks.add_task(
        process_background_replace_background,
        new_gen.id,
        image_url,
        background,
        custom_bg_url,
    )

    return TryOnResponse(generation_id=new_gen.id, status=new_gen.status)


@router.get("/{generation_id}/status", response_model=TryOnStatusResponse)
async def get_background_replace_status(
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
