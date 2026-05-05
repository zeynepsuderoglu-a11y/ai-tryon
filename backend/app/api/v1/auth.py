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
    ChangePasswordRequest, BillingUpdateRequest, VerifyEmailRequest,
)
from app.api.deps import get_current_user
from app.core.config import settings
from app.core.email import send_password_reset_email, send_verification_email
import redis.asyncio as aioredis
import random
import json

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=200)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Kayıt isteği — hesabı hemen oluşturmaz, e-posta doğrulama kodu gönderir."""
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")

    code = f"{random.randint(0, 999999):06d}"
    payload = json.dumps({
        "email": data.email,
        "password_hash": get_password_hash(data.password),
        "full_name": data.full_name,
        "code": code,
    })
    r = aioredis.from_url(settings.REDIS_URL)
    await r.setex(f"email_verify:{data.email}", 600, payload)  # 10 dakika
    await r.aclose()

    await send_verification_email(data.email, code)
    return {"message": "Doğrulama kodu gönderildi", "email": data.email}


@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    """Kodu doğrula → hesabı oluştur → token döndür."""
    r = aioredis.from_url(settings.REDIS_URL)
    raw = await r.get(f"email_verify:{data.email}")
    if not raw:
        await r.aclose()
        raise HTTPException(status_code=400, detail="Kod geçersiz veya süresi dolmuş. Lütfen tekrar kaydolun.")

    payload = json.loads(raw)
    if payload["code"] != data.code.strip():
        await r.aclose()
        raise HTTPException(status_code=400, detail="Doğrulama kodu hatalı")

    await r.delete(f"email_verify:{data.email}")
    await r.aclose()

    # Son kontrol: başka biri aynı anda kayıt olmuş olabilir
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")

    user = User(
        email=payload["email"],
        password_hash=payload["password_hash"],
        full_name=payload["full_name"],
        credits_remaining=settings.INITIAL_CREDITS,
    )
    db.add(user)
    await db.flush()
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/resend-verification", status_code=200)
async def resend_verification(data: ForgotPasswordRequest):
    """Doğrulama kodunu yeniden gönder (her zaman 200 döner)."""
    r = aioredis.from_url(settings.REDIS_URL)
    raw = await r.get(f"email_verify:{data.email}")
    if raw:
        payload = json.loads(raw)
        code = f"{random.randint(0, 999999):06d}"
        payload["code"] = code
        await r.setex(f"email_verify:{data.email}", 600, json.dumps(payload))
        await r.aclose()
        await send_verification_email(data.email, code)
    else:
        await r.aclose()
    return {"message": "Doğrulama kodu gönderildi"}


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
