import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum


class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    unisex = "unisex"


class BodyType(str, enum.Enum):
    slim = "slim"
    average = "average"
    plus_size = "plus_size"


class SkinTone(str, enum.Enum):
    light = "light"
    medium = "medium"
    dark = "dark"


class CropType(str, enum.Enum):
    full_body = "full_body"   # Ayaklar görünüyor
    half_body = "half_body"   # Bel/kalça hizasında kesiyor


class ModelAsset(Base):
    __tablename__ = "model_assets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    gender: Mapped[Gender] = mapped_column(SAEnum(Gender), nullable=False)
    body_type: Mapped[BodyType] = mapped_column(
        SAEnum(BodyType), default=BodyType.average, nullable=False
    )
    skin_tone: Mapped[SkinTone] = mapped_column(
        SAEnum(SkinTone), default=SkinTone.medium, nullable=False
    )
    crop_type: Mapped[CropType] = mapped_column(
        SAEnum(CropType), default=CropType.full_body, nullable=False
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    generations = relationship("Generation", back_populates="model_asset", lazy="dynamic")
