"""Public mannequin listing endpoint — no auth required."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.mannequin import Mannequin

router = APIRouter(prefix="/mannequins", tags=["mannequins"])


@router.get("")
async def list_mannequins(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Mannequin)
        .where(Mannequin.is_active == True)
        .order_by(Mannequin.created_at.asc())
    )
    mannequins = result.scalars().all()
    return [{"id": str(m.id), "name": m.name, "image_url": m.image_url} for m in mannequins]
