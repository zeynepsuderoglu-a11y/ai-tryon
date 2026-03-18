import uuid
import logging
import traceback

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.video_generation import VideoGeneration, VideoGenerationStatus, VideoGenerationMode
from app.services.credit_service import credit_service
from app.services import video_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/video", tags=["video"])

CREDITS_PER_VIDEO = 5


class VideoRunRequest(BaseModel):
    image_urls: list[str]
    prompt: str = "A fashion model walking gracefully, smooth natural motion, cinematic lighting"
    mode: str = "image_to_video"


class VideoResponse(BaseModel):
    generation_id: uuid.UUID
    status: str

    model_config = {"from_attributes": True}


class VideoStatusResponse(BaseModel):
    generation_id: uuid.UUID
    status: str
    output_url: str | None = None
    error_message: str | None = None

    model_config = {"from_attributes": True}


async def process_video_background(generation_id: uuid.UUID, image_urls: list[str], prompt: str, mode: str):
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            task_id = await video_service.generate_video(image_urls, prompt, mode)

            result = await db.execute(select(VideoGeneration).where(VideoGeneration.id == generation_id))
            gen = result.scalar_one_or_none()
            if gen:
                gen.kie_task_id = task_id
                await db.commit()

            output_url = await video_service.poll_video_status(task_id)

            async with AsyncSessionLocal() as db2:
                result2 = await db2.execute(select(VideoGeneration).where(VideoGeneration.id == generation_id))
                gen2 = result2.scalar_one_or_none()
                if gen2:
                    gen2.output_url = output_url
                    gen2.status = VideoGenerationStatus.completed
                    await db2.commit()

            logger.info("[video/%s] Tamamlandı", generation_id)

        except Exception as e:
            tb = traceback.format_exc()
            logger.error("[video/%s] Hata: %s\n%s", generation_id, e, tb)

            async with AsyncSessionLocal() as db3:
                result3 = await db3.execute(select(VideoGeneration).where(VideoGeneration.id == generation_id))
                gen3 = result3.scalar_one_or_none()
                if gen3:
                    gen3.status = VideoGenerationStatus.failed
                    gen3.error_message = f"{type(e).__name__}: {e}"
                    await db3.commit()

                # Kredi iadesi
                try:
                    from app.models.credit_transaction import TransactionType
                    await credit_service.add_credits(
                        db3, gen3.user_id, CREDITS_PER_VIDEO,
                        transaction_type=TransactionType.admin,
                        description=f"Başarısız video üretim iadesi ({generation_id})",
                    )
                    await db3.commit()
                except Exception as refund_err:
                    logger.error("[video/%s] Kredi iadesi başarısız: %s", generation_id, refund_err)


@router.post("/run", response_model=VideoResponse)
async def run_video(
    background_tasks: BackgroundTasks,
    request: VideoRunRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not request.image_urls or len(request.image_urls) == 0:
        raise HTTPException(status_code=400, detail="En az 1 görsel URL gerekli")

    if len(request.image_urls) > 3:
        raise HTTPException(status_code=400, detail="Maksimum 3 görsel URL")

    if request.mode not in ("image_to_video", "reference_to_video"):
        raise HTTPException(status_code=400, detail="Geçersiz mod")

    if not await credit_service.check_credits(current_user, CREDITS_PER_VIDEO):
        raise HTTPException(status_code=402, detail="Yetersiz kredi")

    await credit_service.deduct_credits(
        db, current_user.id, CREDITS_PER_VIDEO,
        description="Video generation",
    )

    gen = VideoGeneration(
        user_id=current_user.id,
        generation_mode=VideoGenerationMode(request.mode),
        source_urls=request.image_urls,
        prompt=request.prompt,
        status=VideoGenerationStatus.processing,
        credits_used=CREDITS_PER_VIDEO,
    )
    db.add(gen)
    await db.flush()

    background_tasks.add_task(
        process_video_background,
        gen.id,
        request.image_urls,
        request.prompt,
        request.mode,
    )

    return VideoResponse(generation_id=gen.id, status=gen.status)


@router.get("/{generation_id}/status", response_model=VideoStatusResponse)
async def get_video_status(
    generation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VideoGeneration).where(
            VideoGeneration.id == generation_id,
            VideoGeneration.user_id == current_user.id,
        )
    )
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(status_code=404, detail="Video üretimi bulunamadı")

    return VideoStatusResponse(
        generation_id=gen.id,
        status=gen.status,
        output_url=gen.output_url,
        error_message=gen.error_message,
    )
