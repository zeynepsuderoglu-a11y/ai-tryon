import base64
import hashlib
import hmac
import json
import time

import httpx

from app.core.config import settings

PAYTR_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token"

# Satın alınabilir kredi paketleri
# price: TL cinsinden (PayTR'a kuruş × 100 gönderiyoruz)
CREDIT_PACKAGES: dict[str, dict] = {
    # 1 kredi = 15 TL sabit; 50'de %5, 100'de %10, 500'de %20 indirim
    "kredi_10":  {"credits": 10,  "price": 150,   "name": "10 Kredi"},
    "kredi_50":  {"credits": 50,  "price": 712,   "name": "50 Kredi"},   # %5 indirim
    "kredi_100": {"credits": 100, "price": 1350,  "name": "100 Kredi"},  # %10 indirim
    "kredi_500": {"credits": 500, "price": 6000,  "name": "500 Kredi"},  # %20 indirim
}


def get_package(package_id: str) -> dict:
    pkg = CREDIT_PACKAGES.get(package_id)
    if not pkg:
        raise ValueError(f"Geçersiz paket: {package_id}")
    return pkg


def make_merchant_oid(user_id: str) -> str:
    """Eşsiz sipariş ID üretir — maks 64 karakter, alfanümerik."""
    ts = int(time.time())
    short_uid = str(user_id).replace("-", "")[:12]
    return f"IMA{short_uid}{ts}"


async def get_iframe_token(
    merchant_oid: str,
    email: str,
    payment_amount_tl: int,   # TL cinsinden (örn: 250)
    user_ip: str,
    package_name: str,
) -> str:
    """PayTR'dan iframe token alır. Token'ı döndürür."""
    # PayTR kuruş × 100 ister (250 TL → 25000)
    payment_amount = payment_amount_tl * 100

    # Sepet: [[ürün adı, birim fiyat TL, adet]]
    basket = [[package_name, str(payment_amount_tl), 1]]
    user_basket = base64.b64encode(json.dumps(basket, ensure_ascii=False).encode()).decode()

    test_mode = "1" if settings.PAYTR_TEST_MODE else "0"
    no_installment = "1"
    max_installment = "0"
    currency = "TL"

    # Hash hesaplama: belirtilen sıra önemli
    hash_str = (
        settings.PAYTR_MERCHANT_ID
        + user_ip
        + merchant_oid
        + email
        + str(payment_amount)
        + user_basket
        + no_installment
        + max_installment
        + currency
        + test_mode
        + settings.PAYTR_MERCHANT_SALT
    )
    paytr_token = base64.b64encode(
        hmac.new(
            settings.PAYTR_MERCHANT_KEY.encode("utf-8"),
            hash_str.encode("utf-8"),
            hashlib.sha256,
        ).digest()
    ).decode()

    payload = {
        "merchant_id":    settings.PAYTR_MERCHANT_ID,
        "user_ip":        user_ip,
        "merchant_oid":   merchant_oid,
        "email":          email,
        "payment_amount": str(payment_amount),
        "user_basket":    user_basket,
        "paytr_token":    paytr_token,
        "currency":       currency,
        "no_installment": no_installment,
        "max_installment": max_installment,
        "test_mode":      test_mode,
        "debug_on":       "1" if settings.PAYTR_TEST_MODE else "0",
        "lang":           "tr",
        "merchant_ok_url":     settings.FRONTEND_URL + "/credits/success",
        "merchant_fail_url":   settings.FRONTEND_URL + "/credits/fail",
        "merchant_notify_url": settings.BACKEND_URL + "/api/v1/payments/notification",
        "user_name":    "",
        "user_address": "Türkiye",
        "user_phone":   "05000000000",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(PAYTR_TOKEN_URL, data=payload)
        resp.raise_for_status()
        data = resp.json()

    if data.get("status") != "success":
        raise RuntimeError(f"PayTR token hatası: {data.get('reason', 'Bilinmeyen hata')}")

    return data["token"]


def verify_notification(
    merchant_oid: str,
    status: str,
    total_amount: str,
    received_hash: str,
) -> bool:
    """PayTR bildirim hash'ini doğrular."""
    hash_str = merchant_oid + settings.PAYTR_MERCHANT_SALT + status + total_amount
    expected = base64.b64encode(
        hmac.new(
            settings.PAYTR_MERCHANT_KEY.encode("utf-8"),
            hash_str.encode("utf-8"),
            hashlib.sha256,
        ).digest()
    ).decode()
    return expected == received_hash
