import secrets
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token, decode_token
)
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshRequest, UserOut, ForgotPasswordRequest, ResetPasswordRequest,
    ChangePasswordRequest, BillingUpdateRequest,
)
from app.api.deps import get_current_user
from app.core.config import settings
from app.core.email import send_password_reset_email
import redis.asyncio as aioredis

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        full_name=data.full_name,
        credits_remaining=5,
    )
    db.add(user)
    await db.flush()
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password", status_code=200)
async def forgot_password(data: ForgotPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    # Always return 200 to avoid email enumeration
    if not user or not user.is_active:
        return {"message": "Eğer bu e-posta kayıtlıysa sıfırlama linki gönderildi."}

    token = secrets.token_urlsafe(32)
    r = aioredis.from_url(settings.REDIS_URL)
    await r.setex(f"pwd_reset:{token}", 3600, str(user.id))
    await r.aclose()

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    await send_password_reset_email(user.email, reset_url)

    return {"message": "Eğer bu e-posta kayıtlıysa sıfırlama linki gönderildi."}


@router.post("/change-password", status_code=200)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı.")
    current_user.password_hash = get_password_hash(data.new_password)
    await db.flush()
    return {"message": "Şifreniz başarıyla güncellendi."}


@router.put("/billing", response_model=UserOut)
async def update_billing(
    data: BillingUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.billing_profile = data.billing_profile.model_dump()
    await db.flush()
    return current_user


@router.post("/reset-password", status_code=200)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    r = aioredis.from_url(settings.REDIS_URL)
    user_id = await r.get(f"pwd_reset:{data.token}")
    if not user_id:
        await r.aclose()
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş link.")

    await r.delete(f"pwd_reset:{data.token}")
    await r.aclose()

    result = await db.execute(select(User).where(User.id == user_id.decode()))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    user.password_hash = get_password_hash(data.new_password)
    await db.flush()
    return {"message": "Şifreniz başarıyla güncellendi."}
