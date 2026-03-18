import base64
import hashlib
import hmac
import json
import time
import uuid

import httpx

from app.core.config import settings

# Satın alınabilir paketler
# price: TL cinsinden | 50'de %5, 100'de %10, 500'de %20 indirim
IYZICO_PACKAGES: dict[str, dict] = {
    "kredi_10":  {"credits": 10,  "price": 150,  "name": "Başlangıç Paketi",  "description": "10 AI Görsel Üretimi"},
    "kredi_50":  {"credits": 50,  "price": 712,  "name": "Standart Paket",    "description": "50 AI Görsel Üretimi"},
    "kredi_100": {"credits": 100, "price": 1350, "name": "Profesyonel Paket", "description": "100 AI Görsel Üretimi"},
    "kredi_500": {"credits": 500, "price": 6000, "name": "Kurumsal Paket",    "description": "500 AI Görsel Üretimi"},
}


def get_package(package_id: str) -> dict:
    pkg = IYZICO_PACKAGES.get(package_id)
    if not pkg:
        raise ValueError(f"Geçersiz paket: {package_id}")
    return pkg


def make_order_id(user_id: str) -> str:
    """Eşsiz sipariş ID üretir — maks 64 karakter, alfanümerik."""
    ts = int(time.time())
    short_uid = str(user_id).replace("-", "")[:12]
    return f"IMA{short_uid}{ts}"


def _auth_header(body_str: str) -> tuple[str, str]:
    """iyzico Authorization header ve x-iyzi-rnd değerini üretir."""
    rnd = str(uuid.uuid4()).replace("-", "")[:16]
    msg = settings.IYZICO_API_KEY + rnd + body_str
    digest = hmac.new(
        settings.IYZICO_SECRET_KEY.encode("utf-8"),
        msg.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    auth = f"IYZWS {settings.IYZICO_API_KEY}:{base64.b64encode(digest).decode()}"
    return auth, rnd


async def create_checkout_form(
    order_id: str,
    email: str,
    user_id: str,
    full_name: str,
    amount_tl: int,
    package_name: str,
    package_description: str,
    user_ip: str,
) -> dict:
    """iyzico Checkout Form başlatır. token ve paymentPageUrl döndürür."""
    price_str = f"{amount_tl}.0"

    name_parts = full_name.strip().split(" ", 1)
    buyer_name = name_parts[0]
    buyer_surname = name_parts[1] if len(name_parts) > 1 else "-"

    body = {
        "locale": "tr",
        "conversationId": order_id,
        "price": price_str,
        "paidPrice": price_str,
        "currency": "TRY",
        "basketId": order_id,
        "paymentGroup": "PRODUCT",
        "callbackUrl": f"{settings.BACKEND_URL}/api/v1/payments/callback",
        "enabledInstallments": [1, 2, 3, 6, 9, 12],
        "buyer": {
            "id": str(user_id),
            "name": buyer_name,
            "surname": buyer_surname,
            "email": email,
            "identityNumber": "11111111111",
            "registrationAddress": "Türkiye",
            "ip": user_ip,
            "city": "Istanbul",
            "country": "Turkey",
        },
        "shippingAddress": {
            "contactName": full_name,
            "city": "Istanbul",
            "country": "Turkey",
            "address": "Türkiye",
            "zipCode": "34000",
        },
        "billingAddress": {
            "contactName": full_name,
            "city": "Istanbul",
            "country": "Turkey",
            "address": "Türkiye",
            "zipCode": "34000",
        },
        "basketItems": [
            {
                "id": order_id,
                "name": f"{package_name} - {package_description}",
                "category1": "Dijital Hizmet",
                "itemType": "VIRTUAL",
                "price": price_str,
            }
        ],
    }

    body_str = json.dumps(body, ensure_ascii=False, separators=(",", ":"))
    auth, rnd = _auth_header(body_str)

    headers = {
        "Authorization": auth,
        "x-iyzi-rnd": rnd,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{settings.IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom",
            content=body_str.encode("utf-8"),
            headers=headers,
        )
        resp.raise_for_status()
        data = resp.json()

    if data.get("status") != "success":
        raise RuntimeError(
            f"iyzico hata: {data.get('errorMessage', 'Bilinmeyen hata')} "
            f"(kod: {data.get('errorCode', '')})"
        )

    return {
        "token": data["token"],
        "paymentPageUrl": data.get("paymentPageUrl", ""),
    }


async def retrieve_checkout_result(token: str) -> dict:
    """Ödeme sonucunu iyzico'dan alır ve doğrular."""
    body = {
        "locale": "tr",
        "conversationId": token,
        "token": token,
    }
    body_str = json.dumps(body, separators=(",", ":"))
    auth, rnd = _auth_header(body_str)

    headers = {
        "Authorization": auth,
        "x-iyzi-rnd": rnd,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{settings.IYZICO_BASE_URL}/payment/iyzipos/checkoutform/auth/ecom/detail",
            content=body_str.encode("utf-8"),
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json()
