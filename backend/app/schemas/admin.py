from pydantic import BaseModel
import uuid


class AdminStatsResponse(BaseModel):
    total_users: int
    total_generations: int
    total_credits_used: int
    active_users_today: int
    total_batch_jobs: int


class AdminCreditAdjust(BaseModel):
    amount: int
    credit_type: str = "unified"
    description: str = ""


class AdminUserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    credits_remaining: int
    is_active: bool
    total_generations: int

    model_config = {"from_attributes": True}
