from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from app.models.generation import GenerationStatus, GarmentCategory
from app.models.batch_job import BatchJobStatus


class TryOnRequest(BaseModel):
    model_asset_id: uuid.UUID
    category: GarmentCategory = GarmentCategory.tops
    mode: str = "balanced"
    num_samples: int = 1


class TryOnResponse(BaseModel):
    generation_id: uuid.UUID
    status: GenerationStatus


class TryOnStatusResponse(BaseModel):
    id: uuid.UUID
    status: GenerationStatus
    output_urls: Optional[list[str]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BatchTryOnRequest(BaseModel):
    model_ids: list[uuid.UUID]
    category: GarmentCategory = GarmentCategory.tops
    mode: str = "balanced"


class BatchTryOnResponse(BaseModel):
    batch_job_id: uuid.UUID
    status: BatchJobStatus
    total: int


class BatchJobStatusResponse(BaseModel):
    id: uuid.UUID
    status: BatchJobStatus
    total: int
    completed: int
    failed: int
    progress: float
    results: Optional[list[dict]] = None

    model_config = {"from_attributes": True}
