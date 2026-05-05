"""Public background listing endpoint — no auth required."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.background import Background

router = APIRouter(prefix="/backgrounds", tags=["backgrounds"])


@router.get("")
async def list_backgrounds(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Background)
        .where(Background.is_active == True)
        .order_by(Background.sort_order.asc(), Background.created_at.asc())
    )
    bgs = result.scalars().all()
    return [
        {
            "id": str(b.id),
            "key": b.key,
            "label": b.label,
            "image_url": b.image_url,
            "description": b.description,
        }
        for b in bgs
    ]
