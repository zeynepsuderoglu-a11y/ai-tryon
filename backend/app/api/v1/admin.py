import uuid
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct, delete
from datetime import datetime, timezone
from app.core.database import get_db
from app.api.deps import get_current_admin
from app.models.user import User
from app.models.generation import Generation
from app.models.batch_job import BatchJob
from app.models.model_asset import ModelAsset, Gender, BodyType, SkinTone, CropType
from app.models.credit_transaction import CreditTransaction, TransactionType
from app.schemas.admin import AdminStatsResponse, AdminCreditAdjust, AdminUserOut
from app.schemas.model_asset import ModelAssetCreate, ModelAssetUpdate, ModelAssetOut, ModelAssetListResponse
from app.services.credit_service import credit_service

STATIC_DIR = Path(__file__).parent.parent.parent.parent / "static" / "models"

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_generations = (await db.execute(select(func.count(Generation.id)))).scalar()
    total_credits_used_result = await db.execute(
        select(func.sum(CreditTransaction.amount))
        .where(CreditTransaction.type == TransactionType.use)
    )
    total_credits_used = abs(total_credits_used_result.scalar() or 0)
    total_batch_jobs = (await db.execute(select(func.count(BatchJob.id)))).scalar()

    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    active_today_result = await db.execute(
        select(func.count(distinct(Generation.user_id)))
        .where(Generation.created_at >= today)
    )
    active_users_today = active_today_result.scalar() or 0

    return AdminStatsResponse(
        total_users=total_users,
        total_generations=total_generations,
        total_credits_used=total_credits_used,
        active_users_today=active_users_today,
        total_batch_jobs=total_batch_jobs,
    )


@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(User.id)))).scalar()
    users_result = await db.execute(
        select(User)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .order_by(User.created_at.desc())
    )
    users = users_result.scalars().all()

    user_list = []
    for u in users:
        gen_count_result = await db.execute(
            select(func.count(Generation.id)).where(Generation.user_id == u.id)
        )
        gen_count = gen_count_result.scalar() or 0
        user_list.append(AdminUserOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            credits_remaining=u.credits_remaining,
            is_active=u.is_active,
            total_generations=gen_count,
            created_at=u.created_at,
        ))

    return {"items": user_list, "total": total, "page": page, "page_size": page_size}


@router.post("/users/{user_id}/credits")
async def adjust_user_credits(
    user_id: uuid.UUID,
    data: AdminCreditAdjust,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await credit_service.add_credits(
        db, user_id, data.amount,
        credit_type=data.credit_type,
        transaction_type=TransactionType.admin,
        description=data.description or "Admin credit adjustment",
    )
    return {
        "user_id": str(user_id),
        "credits_remaining": user.credits_remaining,
    }


@router.put("/users/{user_id}/status")
async def toggle_user_status(
    user_id: uuid.UUID,
    is_active: bool,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    return {"user_id": str(user_id), "is_active": is_active}


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Kendi hesabınızı silemezsiniz")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Admin hesabı silinemez")

    # İlişkili kayıtları sırayla sil (cascade yok)
    await db.execute(delete(Generation).where(Generation.user_id == user_id))
    await db.execute(delete(CreditTransaction).where(CreditTransaction.user_id == user_id))
    await db.execute(delete(BatchJob).where(BatchJob.user_id == user_id))
    await db.delete(user)
    await db.commit()


# Model management
@router.get("/models", response_model=ModelAssetListResponse)
async def admin_list_models(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    include_inactive: bool = False,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(ModelAsset)
    if not include_inactive:
        query = query.where(ModelAsset.is_active == True)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    models_result = await db.execute(
        query.offset((page - 1) * page_size).limit(page_size).order_by(ModelAsset.created_at.desc())
    )
    models = models_result.scalars().all()
    return ModelAssetListResponse(items=models, total=total, page=page, page_size=page_size)


@router.post("/models", response_model=ModelAssetOut, status_code=201)
async def admin_create_model(
    data: ModelAssetCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    model = ModelAsset(**data.model_dump())
    db.add(model)
    await db.flush()
    return model


@router.post("/models/upload", response_model=ModelAssetOut, status_code=201)
async def admin_upload_model(
    request: Request,
    name: str = Form(...),
    gender: Gender = Form(...),
    body_type: BodyType = Form(BodyType.average),
    skin_tone: SkinTone = Form(SkinTone.medium),
    crop_type: CropType = Form(CropType.full_body),
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    import asyncio
    from app.services.cloudinary_service import cloudinary_service

    contents = await file.read()

    # Cloudinary'e yükle — HTTPS URL, tarayıcı bloklamaz, kalıcı depolama
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None, lambda: cloudinary_service.upload_file(contents, folder="tryon/models")
    )
    image_url = result["secure_url"]

    model = ModelAsset(
        name=name, gender=gender, body_type=body_type,
        skin_tone=skin_tone, crop_type=crop_type,
        image_url=image_url, thumbnail_url=image_url
    )
    db.add(model)
    await db.flush()
    return model


class ModelUploadFromUrl(BaseModel):
    name: str
    gender: Gender = Gender.female
    body_type: BodyType = BodyType.average
    skin_tone: SkinTone = SkinTone.medium
    crop_type: CropType = CropType.full_body
    image_url: str


@router.post("/models/upload-url", response_model=ModelAssetOut, status_code=201)
async def admin_upload_model_from_url(
    data: ModelUploadFromUrl,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """URL'den resim indir, Cloudinary'e yükle, model olarak kaydet.
    Google Fotoğraflar paylaşım linklerini de destekler (og:image çıkarımı).
    """
    import asyncio
    import re
    import httpx
    from app.services.cloudinary_service import cloudinary_service

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    }

    async def fetch_url(url: str):
        async with httpx.AsyncClient(follow_redirects=True, timeout=30, headers=headers) as client:
            r = await client.get(url)
            r.raise_for_status()
            return r

    try:
        response = await fetch_url(data.image_url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"URL'den resim alınamadı: {e}")

    content_type = response.headers.get("content-type", "")

    # HTML sayfası geldi — Google Fotoğraflar ve benzeri servisler için og:image çıkar
    if "text/html" in content_type:
        html = response.text
        # og:image meta etiketi
        match = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html)
        if not match:
            match = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html)
        if not match:
            raise HTTPException(
                status_code=400,
                detail="Bu link doğrudan bir resim değil. Google Fotoğraflar'da resme sağ tıklayıp 'Resim adresini kopyala' seçin."
            )
        real_image_url = match.group(1)
        try:
            response = await fetch_url(real_image_url)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Resim indirilemedi: {e}")
        content_type = response.headers.get("content-type", "")

    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"Resim formatı tanınamadı ({content_type}). Doğrudan resim URL'i kullanın.")

    contents = response.content

    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None, lambda: cloudinary_service.upload_file(contents, folder="tryon/models")
    )
    image_url = result["secure_url"]

    model = ModelAsset(
        name=data.name, gender=data.gender, body_type=data.body_type,
        skin_tone=data.skin_tone, crop_type=data.crop_type,
        image_url=image_url, thumbnail_url=image_url
    )
    db.add(model)
    await db.flush()
    return model


@router.put("/models/{model_id}", response_model=ModelAssetOut)
async def admin_update_model(
    model_id: uuid.UUID,
    data: ModelAssetUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ModelAsset).where(ModelAsset.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(model, field, value)
    await db.flush()
    return model


@router.delete("/models/{model_id}", status_code=204)
async def admin_delete_model(
    model_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ModelAsset).where(ModelAsset.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    await db.delete(model)
