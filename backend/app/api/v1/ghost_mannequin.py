import uuid
import logging
import traceback

from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select  # noqa: F401 (status endpoint için gerekli)

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.generation import Generation, GenerationStatus, GarmentCategory
from app.schemas.tryon import TryOnResponse, TryOnStatusResponse
from app.services.ghost_mannequin_service import ghost_mannequin_service
from app.services.credit_service import credit_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ghost-mannequin", tags=["ghost-mannequin"])


async def process_ghost_mannequin_background(
    new_generation_id: uuid.UUID,
    input_image_url: str,
):
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            logger.info("[ghost/%s] Servis çağrısı başlıyor", new_generation_id)
            output_url = await ghost_mannequin_service.run(input_image_url)
            logger.info("[ghost/%s] Tamamlandı: %s", new_generation_id, output_url)

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
            logger.error("[ghost/%s] Başarısız: %s\n%s", new_generation_id, e, tb)

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
                        description=f"Başarısız ghost mannequin iadesi (generation {new_generation_id})",
                    )
                    logger.info("[ghost/%s] Kredi iadesi yapıldı", new_generation_id)
                except Exception as refund_err:
                    logger.error("[ghost/%s] Kredi iadesi başarısız: %s", new_generation_id, refund_err)
                await db.commit()


@router.post("/run", response_model=TryOnResponse)
async def run_ghost_mannequin(
    background_tasks: BackgroundTasks,
    image_url: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    image_url: kıyafetin manken üzerinde gösterildiği fotoğraf URL'si
    (try-on çıktısı, Cloudinary URL veya herhangi bir görsel URL)
    """
    credits_cost = 1

    if not await credit_service.check_credits(current_user, credits_cost):
        raise HTTPException(status_code=402, detail="Insufficient credits")

    await credit_service.deduct_credits(
        db, current_user.id, credits_cost,
        description="Ghost mannequin generation",
    )

    new_gen = Generation(
        user_id=current_user.id,
        garment_url=image_url,
        status=GenerationStatus.processing,
        category=GarmentCategory.ghost_mannequin,
        credits_used=credits_cost,
    )
    db.add(new_gen)
    await db.flush()

    background_tasks.add_task(
        process_ghost_mannequin_background,
        new_gen.id,
        image_url,
    )

    return TryOnResponse(generation_id=new_gen.id, status=new_gen.status)


@router.get("/{generation_id}/status", response_model=TryOnStatusResponse)
async def get_ghost_mannequin_status(
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
