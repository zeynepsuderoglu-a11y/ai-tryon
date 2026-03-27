import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Form, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.database import get_db
from app.core.config import settings
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.payment import Payment
from app.schemas.auth import BillingProfile
from app.services import iyzico_service
from app.services.iyzico_service import IYZICO_PACKAGES, get_package, make_order_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])


# ──────────────────────────────────────────────
# Paket listesi
# ──────────────────────────────────────────────

@router.get("/packages")
async def list_packages():
    """Mevcut paketleri döndürür."""
    return {
        pkg_id: {
            "id": pkg_id,
            "credits": pkg["credits"],
            "price": pkg["price"],
            "name": pkg["name"],
            "description": pkg.get("description", ""),
        }
        for pkg_id, pkg in IYZICO_PACKAGES.items()
    }


# ──────────────────────────────────────────────
# iyzico Checkout oluştur
# ──────────────────────────────────────────────

class CreateCheckoutRequest(BaseModel):
    package_id: str
    billing_profile: Optional[BillingProfile] = None


@router.post("/create-checkout")
async def create_checkout(
    body: CreateCheckoutRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """iyzico ödeme formu başlatır ve ödeme sayfası URL'sini döndürür."""
    pkg = get_package(body.package_id)

    user_ip = (
        request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        or request.headers.get("X-Real-IP", "")
        or (request.client.host if request.client else "127.0.0.1")
    )

    order_id = make_order_id(str(current_user.id))

    # billing_profile: isteğe bağlı — gelirse user'a kaydet
    effective_billing: dict | None = None
    if body.billing_profile:
        current_user.billing_profile = body.billing_profile.model_dump()
        await db.flush()
        effective_billing = current_user.billing_profile
    elif current_user.billing_profile:
        effective_billing = current_user.billing_profile

    # Ödeme kaydını önceden oluştur (pending)
    payment = Payment(
        user_id=current_user.id,
        merchant_oid=order_id,
        package_id=body.package_id,
        package_name=pkg["name"],
        credits=pkg["credits"],
        amount=pkg["price"] * 100,  # kuruş
        status="pending",
    )
    db.add(payment)
    await db.flush()

    try:
        result = await iyzico_service.create_checkout_form(
            order_id=order_id,
            email=current_user.email,
            user_id=str(current_user.id),
            full_name=current_user.full_name,
            amount_tl=pkg["price"],
            package_name=pkg["name"],
            package_description=pkg["description"],
            user_ip=user_ip,
            billing_profile=effective_billing,
        )
    except Exception as e:
        logger.error(f"iyzico checkout hatası: {e}")
        raise HTTPException(status_code=502, detail=f"Ödeme başlatılamadı: {str(e)}")

    await db.commit()

    return {
        "paymentPageUrl": result["paymentPageUrl"],
        "token": result["token"],
        "package": pkg,
    }


# ──────────────────────────────────────────────
# iyzico Callback (browser form POST)
# ──────────────────────────────────────────────

@router.post("/callback")
async def payment_callback(
    token: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """
    iyzico ödeme sonuç callback'i.
    Kullanıcının tarayıcısı bu endpoint'e form POST yapar,
    biz de başarı/hata sayfasına yönlendiririz.
    """
    try:
        data = await iyzico_service.retrieve_checkout_result(token)
    except Exception as e:
        logger.error(f"iyzico callback sorgu hatası: {e}")
        return RedirectResponse(f"{settings.FRONTEND_URL}/credits/fail", status_code=303)

    # basketId = sipariş oluştururken gönderdiğimiz order_id (conversationId token'ı yansıtabilir)
    conversation_id = data.get("basketId") or data.get("conversationId", "")

    result = await db.execute(
        select(Payment).where(Payment.merchant_oid == conversation_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        logger.warning(f"iyzico bilinmeyen sipariş: {conversation_id} (token: {token})")
        return RedirectResponse(f"{settings.FRONTEND_URL}/credits/fail", status_code=303)

    # Tekrar işleme alma (idempotent)
    if payment.status != "pending":
        redirect_url = "/credits/success" if payment.status == "success" else "/credits/fail"
        return RedirectResponse(f"{settings.FRONTEND_URL}{redirect_url}", status_code=303)

    payment_status = data.get("paymentStatus", "")

    if payment_status == "SUCCESS":
        await db.execute(
            update(Payment)
            .where(Payment.merchant_oid == conversation_id)
            .values(status="success")
        )
        await db.execute(
            update(User)
            .where(User.id == payment.user_id)
            .values(credits_remaining=User.credits_remaining + payment.credits)
        )
        logger.info(
            f"iyzico ödeme başarılı: {conversation_id} | "
            f"{payment.credits} üretim hakkı → kullanıcı {payment.user_id}"
        )
        await db.commit()
        return RedirectResponse(f"{settings.FRONTEND_URL}/credits/success", status_code=303)
    else:
        await db.execute(
            update(Payment)
            .where(Payment.merchant_oid == conversation_id)
            .values(status="failed")
        )
        logger.info(
            f"iyzico ödeme başarısız: {conversation_id} | "
            f"{data.get('errorMessage', '')} (kod: {data.get('errorCode', '')})"
        )
        await db.commit()
        return RedirectResponse(f"{settings.FRONTEND_URL}/credits/fail", status_code=303)


# ──────────────────────────────────────────────
# Ödeme geçmişi
# ──────────────────────────────────────────────

@router.get("/history")
async def payment_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .limit(50)
    )
    payments = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "package_name": p.package_name,
            "credits": p.credits,
            "amount_tl": p.amount / 100,
            "status": p.status,
            "created_at": p.created_at.isoformat(),
        }
        for p in payments
    ]
