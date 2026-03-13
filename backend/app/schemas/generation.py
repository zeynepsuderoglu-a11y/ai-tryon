from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from app.models.generation import GenerationStatus, GarmentCategory
from app.schemas.model_asset import ModelAssetOut


class GenerationOut(BaseModel):
    id: uuid.UUID
    garment_url: str
    output_urls: Optional[list[str]] = None
    status: GenerationStatus
    category: GarmentCategory
    credits_used: int
    error_message: Optional[str] = None
    model_asset: Optional[ModelAssetOut] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GenerationListResponse(BaseModel):
    items: list[GenerationOut]
    total: int
    page: int
    page_size: int
