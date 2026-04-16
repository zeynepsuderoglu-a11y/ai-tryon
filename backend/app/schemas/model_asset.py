from pydantic import BaseModel, HttpUrl
from typing import Optional
import uuid
from datetime import datetime
from app.models.model_asset import Gender, BodyType, SkinTone, CropType


class ModelAssetCreate(BaseModel):
    name: str
    gender: Gender
    body_type: BodyType = BodyType.average
    skin_tone: SkinTone = SkinTone.medium
    crop_type: CropType = CropType.full_body
    image_url: str
    thumbnail_url: Optional[str] = None
    tags: Optional[str] = None


class ModelAssetUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[Gender] = None
    body_type: Optional[BodyType] = None
    skin_tone: Optional[SkinTone] = None
    crop_type: Optional[CropType] = None
    image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_active: Optional[bool] = None
    tags: Optional[str] = None


class ModelAssetOut(BaseModel):
    id: uuid.UUID
    name: str
    gender: Gender
    body_type: BodyType
    skin_tone: SkinTone
    crop_type: CropType
    image_url: str
    thumbnail_url: Optional[str] = None
    tags: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ModelAssetListResponse(BaseModel):
    items: list[ModelAssetOut]
    total: int
    page: int
    page_size: int
