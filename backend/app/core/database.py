from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    # Tüm modellerin import edildiğinden emin ol
    from app.models import user, generation, batch_job, credit_transaction, model_asset, payment, video_generation  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def apply_migrations():
    """Mevcut tablolara yeni kolonları ekler (ALTER TABLE IF NOT EXISTS)."""
    migrations = [
        "ALTER TABLE generations ADD COLUMN IF NOT EXISTS quality_score FLOAT",
        "ALTER TABLE generations ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE generations ADD COLUMN IF NOT EXISTS generation_metadata JSONB",
        "ALTER TYPE garmentcategory ADD VALUE IF NOT EXISTS 'eyewear'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS clothing_credits INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS eyewear_credits INTEGER NOT NULL DEFAULT 0",
        "UPDATE users SET clothing_credits = credits_remaining WHERE clothing_credits = 0 AND credits_remaining > 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS video_credits INTEGER NOT NULL DEFAULT 0",
        # Tek havuz migrasyonu: tüm ayrı kredileri credits_remaining'e topla
        "UPDATE users SET credits_remaining = clothing_credits + eyewear_credits + video_credits WHERE clothing_credits + eyewear_credits + video_credits > credits_remaining",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_profile JSONB",
    ]
    async with engine.begin() as conn:
        for sql in migrations:
            try:
                await conn.execute(__import__("sqlalchemy").text(sql))
            except Exception:
                pass
