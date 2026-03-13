import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.generation import Generation
from app.schemas.generation import GenerationOut, GenerationListResponse

router = APIRouter(prefix="/generations", tags=["generations"])


@router.get("", response_model=GenerationListResponse)
async def list_generations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base_query = select(Generation).where(
        Generation.user_id == current_user.id,
        Generation.batch_job_id == None,
    )
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar()

    query = (
        base_query
        .options(selectinload(Generation.model_asset))
        .order_by(Generation.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    gens = result.scalars().all()

    return GenerationListResponse(
        items=gens,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{generation_id}", response_model=GenerationOut)
async def get_generation(
    generation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Generation)
        .options(selectinload(Generation.model_asset))
        .where(Generation.id == generation_id, Generation.user_id == current_user.id)
    )
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
    return gen


@router.delete("/{generation_id}", status_code=204)
async def delete_generation(
    generation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Generation).where(
            Generation.id == generation_id,
            Generation.user_id == current_user.id,
        )
    )
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
    await db.delete(gen)
