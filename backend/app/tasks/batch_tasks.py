import uuid
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "tryon_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
)


@celery_app.task(name="tasks.process_batch_item", bind=True, max_retries=3)
def process_batch_item(
    self,
    batch_job_id: str,
    user_id: str,
    garment_url: str,
    model_id: str,
    category: str = "tops",
):
    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import sessionmaker

    sync_db_url = settings.DATABASE_URL.replace("+asyncpg", "+psycopg2")
    engine = create_engine(sync_db_url)
    SessionLocal = sessionmaker(engine)

    from app.models.generation import Generation, GenerationStatus
    from app.models.model_asset import ModelAsset
    from app.models.batch_job import BatchJob, BatchJobStatus
    from app.services.replicate_service import run_tryon_sync, ensure_public_url_sync, prepare_garment_sync
    from app.services.garment_analysis_service import analyze_garment_sync

    with SessionLocal() as db:
        try:
            model = db.execute(
                select(ModelAsset).where(ModelAsset.id == uuid.UUID(model_id))
            ).scalar_one_or_none()
            if not model:
                raise ValueError(f"Model {model_id} not found")

            generation = Generation(
                user_id=uuid.UUID(user_id),
                model_asset_id=uuid.UUID(model_id),
                garment_url=garment_url,
                status=GenerationStatus.processing,
                category=category,
                batch_job_id=uuid.UUID(batch_job_id),
                credits_used=settings.CREDITS_PER_GENERATION,
            )
            db.add(generation)
            db.commit()
            db.refresh(generation)
            gen_id = generation.id

            # Localhost URL'leri Cloudinary'e yükle
            model_image_url = ensure_public_url_sync(model.image_url)

            # Kıyafet: arka planı kaldır + beyaz arka plan
            clean_garment_url = prepare_garment_sync(garment_url)

            # Kıyafeti Claude Vision ile analiz et (garment tipi + category + açıklama)
            analysis = analyze_garment_sync(clean_garment_url, category)
            effective_category = analysis.category or category

            # Replicate sync çağrısı (blocking — Celery worker'da OK)
            output_urls = run_tryon_sync(
                model_image_url=model_image_url,
                garment_image_url=clean_garment_url,
                category=effective_category,
                garment_description=analysis.description,
            )

            saved_urls = output_urls

            gen = db.execute(select(Generation).where(Generation.id == gen_id)).scalar_one()
            gen.output_urls = saved_urls
            gen.status = GenerationStatus.completed

            batch = db.execute(
                select(BatchJob).where(BatchJob.id == uuid.UUID(batch_job_id))
            ).scalar_one()
            batch.completed += 1
            if batch.completed + batch.failed >= batch.total:
                batch.status = (
                    BatchJobStatus.completed if batch.failed == 0 else BatchJobStatus.partial
                )
            db.commit()
            return {"status": "completed", "generation_id": str(gen_id)}

        except Exception as exc:
            db.rollback()
            try:
                gen = db.execute(
                    select(Generation).where(
                        Generation.user_id == uuid.UUID(user_id),
                        Generation.model_asset_id == uuid.UUID(model_id),
                        Generation.batch_job_id == uuid.UUID(batch_job_id),
                        Generation.status == GenerationStatus.processing,
                    )
                ).scalar_one_or_none()
                if gen:
                    gen.status = GenerationStatus.failed
                    gen.error_message = str(exc)

                batch = db.execute(
                    select(BatchJob).where(BatchJob.id == uuid.UUID(batch_job_id))
                ).scalar_one_or_none()
                if batch:
                    batch.failed += 1
                    if batch.completed + batch.failed >= batch.total:
                        batch.status = (
                            BatchJobStatus.partial if batch.completed > 0 else BatchJobStatus.failed
                        )
                db.commit()
            except Exception:
                pass
            raise self.retry(exc=exc, countdown=10)
