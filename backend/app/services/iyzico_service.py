import base64
import hashlib
import hmac
import json
import random
import string
import time

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


def _random_string(size: int = 8) -> str:
    return "".join(random.SystemRandom().choice(string.ascii_letters + string.digits) for _ in range(size))


def _auth_header_v2(url_path: str, body_str: str) -> tuple[str, str]:
    """iyzico IYZWSv2 Authorization header üretir."""
    rnd = _random_string(8)
    msg = (rnd + url_path + body_str).encode("utf-8")
    signature = hmac.new(
        settings.IYZICO_SECRET_KEY.encode("utf-8"),
        digestmod=hashlib.sha256,
    )
    signature.update(msg)
    sig_hex = signature.hexdigest()

    auth_params = f"apiKey:{settings.IYZICO_API_KEY}&randomKey:{rnd}&signature:{sig_hex}"
    auth = "IYZWSv2 " + base64.b64encode(auth_params.encode()).decode()
    return auth, rnd


def _base_url_host() -> str:
    """https://api.iyzipay.com → api.iyzipay.com (httpx için tam URL döner)"""
    return settings.IYZICO_BASE_URL


async def create_checkout_form(
    order_id: str,
    email: str,
    user_id: str,
    full_name: str,
    amount_tl: int,
    package_name: str,
    package_description: str,
    user_ip: str,
    billing_profile: dict | None = None,
) -> dict:
    """iyzico Checkout Form başlatır. token ve paymentPageUrl döndürür."""
    price_str = f"{amount_tl}.0"

    name_parts = full_name.strip().split(" ", 1)
    buyer_name = name_parts[0]
    buyer_surname = name_parts[1] if len(name_parts) > 1 else "-"

    # billing_profile'dan değerleri çıkar
    bp = billing_profile or {}
    bp_type = bp.get("type", "individual")
    bp_city = bp.get("city", "Istanbul")
    bp_district = bp.get("district", "")
    bp_tc = bp.get("tc_no") or ""
    bp_address_raw = bp.get("address", "")

    # Kimlik numarası: TC (11 hane) → kullan, aksi hâlde fallback
    identity_number = bp_tc if (bp_tc and len(bp_tc) == 11 and bp_tc.isdigit()) else "11111111111"

    # iletişim adı: kurumsal → firma adı, bireysel → ad soyad
    if bp_type == "corporate":
        contact_name = bp.get("company_name") or full_name
    else:
        contact_name = bp.get("full_name") or full_name

    # Adres birleştir
    address_parts = [p for p in [bp_address_raw, bp_district, bp_city] if p]
    address = ", ".join(address_parts) if address_parts else "Türkiye"

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
            "identityNumber": identity_number,
            "registrationAddress": address,
            "ip": user_ip,
            "city": bp_city,
            "country": "Turkey",
        },
        "shippingAddress": {
            "contactName": contact_name,
            "city": bp_city,
            "country": "Turkey",
            "address": address,
            "zipCode": "34000",
        },
        "billingAddress": {
            "contactName": contact_name,
            "city": bp_city,
            "country": "Turkey",
            "address": address,
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

    url_path = "/payment/iyzipos/checkoutform/initialize/ecom"
    body_str = json.dumps(body, ensure_ascii=False, separators=(",", ":"))
    auth, rnd = _auth_header_v2(url_path, body_str)

    headers = {
        "Authorization": auth,
        "x-iyzi-rnd": rnd,
        "x-iyzi-client-version": "iyzipay-python-1.0.46",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{settings.IYZICO_BASE_URL}{url_path}",
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
        "token": token,
    }

    url_path = "/payment/iyzipos/checkoutform/auth/ecom/detail"
    body_str = json.dumps(body, separators=(",", ":"))
    auth, rnd = _auth_header_v2(url_path, body_str)

    headers = {
        "Authorization": auth,
        "x-iyzi-rnd": rnd,
        "x-iyzi-client-version": "iyzipay-python-1.0.46",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{settings.IYZICO_BASE_URL}{url_path}",
            content=body_str.encode("utf-8"),
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json()
