import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, DateTime, Enum as SAEnum, ForeignKey, ARRAY, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base
import enum


class GenerationStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class GarmentCategory(str, enum.Enum):
    tops = "tops"
    bottoms = "bottoms"
    one_pieces = "one-pieces"
    eyewear = "eyewear"
    ghost_mannequin = "ghost_mannequin"
    background_replace = "background_replace"
    mannequin_tryon = "mannequin_tryon"


class Generation(Base):
    __tablename__ = "generations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    model_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("model_assets.id"), nullable=True
    )
    garment_url: Mapped[str] = mapped_column(String(500), nullable=False)
    output_urls: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    prediction_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[GenerationStatus] = mapped_column(
        SAEnum(GenerationStatus), default=GenerationStatus.pending, nullable=False
    )
    category: Mapped[GarmentCategory] = mapped_column(
        SAEnum(GarmentCategory), default=GarmentCategory.tops, nullable=False
    )
    credits_used: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    generation_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    batch_job_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("batch_jobs.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="generations")
    model_asset = relationship("ModelAsset", back_populates="generations")
    batch_job = relationship("BatchJob", back_populates="generations")
