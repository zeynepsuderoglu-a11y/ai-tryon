import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Enum as SAEnum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class VideoGenerationMode(str, enum.Enum):
    image_to_video = "image_to_video"
    reference_to_video = "reference_to_video"


class VideoGenerationStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class VideoGeneration(Base):
    __tablename__ = "video_generations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    generation_mode: Mapped[VideoGenerationMode] = mapped_column(
        SAEnum(VideoGenerationMode), nullable=False, default=VideoGenerationMode.image_to_video
    )
    source_urls: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    prompt: Mapped[str] = mapped_column(Text, nullable=False, default="")
    kie_task_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[VideoGenerationStatus] = mapped_column(
        SAEnum(VideoGenerationStatus), default=VideoGenerationStatus.processing, nullable=False
    )
    output_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    credits_used: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", foreign_keys=[user_id])
