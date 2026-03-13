import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.model_asset import ModelAsset, Gender, BodyType, SkinTone
from app.schemas.model_asset import ModelAssetOut, ModelAssetListResponse

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=ModelAssetListResponse)
async def list_models(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    gender: Gender | None = None,
    body_type: BodyType | None = None,
    skin_tone: SkinTone | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(ModelAsset).where(ModelAsset.is_active == True)
    if gender:
        query = query.where(ModelAsset.gender == gender)
    if body_type:
        query = query.where(ModelAsset.body_type == body_type)
    if skin_tone:
        query = query.where(ModelAsset.skin_tone == skin_tone)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    models = result.scalars().all()

    return ModelAssetListResponse(
        items=models,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{model_id}", response_model=ModelAssetOut)
async def get_model(
    model_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ModelAsset).where(ModelAsset.id == model_id, ModelAsset.is_active == True)
    )
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model
