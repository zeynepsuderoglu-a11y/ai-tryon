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
from app.services.credit_service import credit_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mannequin-tryon", tags=["mannequin-tryon"])

CREDITS_COST = 2


async def _process_background(generation_id: uuid.UUID, mannequin_id: int, garment_url: str):
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            output_url = await mannequin_tryon_service.run(mannequin_id, garment_url)
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
