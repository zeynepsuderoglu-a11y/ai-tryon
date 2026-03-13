"""
Modal.com üzerinde çalışan CatVTON servisine istek atar.
Endpoint: POST https://zeynepsuderoglu-a11y--ai-tryon-catvton-catvton-tryon.modal.run

Modal web endpoint'i uzun süren işler için 303 redirect + polling kullanır:
  POST /endpoint → 303 → /?__modal_function_call_id=xxx
  GET  /?__modal_function_call_id=xxx → 303 (hâlâ çalışıyor) | 200 (tamamlandı)
"""
import asyncio
import base64
import httpx
import logging

logger = logging.getLogger(__name__)

MODAL_ENDPOINT = (
    "https://zeynepsuderoglu-a11y--ai-tryon-catvton-catvton-tryon.modal.run"
)

# Cold start (ilk çalıştırma): model dosyaları HF'den indirilir → 5-10 dk
# Sonraki çalıştırmalar: ~30-60 saniye
TOTAL_TIMEOUT = 600.0   # 10 dakika maksimum
POLL_INTERVAL = 3.0     # 3 saniyede bir kontrol


async def run_catvton_modal(
    model_image_url: str,
    garment_image_url: str,
    category: str = "tops",
) -> bytes:
    """
    CatVTON Modal endpoint'ine istek atar, sonuç hazır olana kadar polling yapar.
    Döner: JPEG bytes (Cloudinary'e upload edilmeye hazır)
    """
    cloth_type_map = {
        "tops": "upper",
        "bottoms": "lower",
        "one-pieces": "overall",
    }
    cloth_type = cloth_type_map.get(category, "upper")

    payload = {
        "model_image_url": model_image_url,
        "garment_image_url": garment_image_url,
        "cloth_type": cloth_type,
    }

    logger.info("CatVTON Modal isteği başlatıldı | cloth_type=%s", cloth_type)

    async with httpx.AsyncClient(timeout=300.0, follow_redirects=False) as client:
        # 1. POST isteği — Modal 303 ile polling URL döndürür
        # Cold start sırasında container hazır olana kadar bekleyebilir → 300s
        resp = await client.post(MODAL_ENDPOINT, json=payload)

        if resp.status_code not in (200, 303):
            resp.raise_for_status()

        # 2. Polling URL'ini al
        if resp.status_code == 303:
            poll_url = resp.headers.get("location")
            if not poll_url:
                raise RuntimeError("Modal 303 döndürdü ama Location header yok")
            # Relative URL ise absolute yap
            if poll_url.startswith("/"):
                poll_url = MODAL_ENDPOINT.rstrip("/") + poll_url
            logger.info("Modal polling URL: %s", poll_url)
        else:
            # Anında 200 — direkt sonuç
            return _parse_result(resp.json())

    # 3. Polling döngüsü
    elapsed = 0.0
    async with httpx.AsyncClient(timeout=300.0, follow_redirects=False) as client:
        while elapsed < TOTAL_TIMEOUT:
            await asyncio.sleep(POLL_INTERVAL)
            elapsed += POLL_INTERVAL

            poll_resp = await client.get(poll_url)
            logger.info("Modal poll [%.0fs] → %d", elapsed, poll_resp.status_code)

            if poll_resp.status_code == 200:
                # Tamamlandı
                return _parse_result(poll_resp.json())
            elif poll_resp.status_code == 303:
                # Hâlâ çalışıyor, yeni location varsa güncelle
                new_loc = poll_resp.headers.get("location")
                if new_loc:
                    if new_loc.startswith("/"):
                        new_loc = MODAL_ENDPOINT.rstrip("/") + new_loc
                    poll_url = new_loc
                # Devam et
            else:
                poll_resp.raise_for_status()

    raise RuntimeError(f"CatVTON Modal zaman aşımı ({TOTAL_TIMEOUT}s)")


def _parse_result(data: dict) -> bytes:
    if data.get("status") != "success":
        raise RuntimeError(f"CatVTON Modal hata: {data}")
    image_bytes = base64.b64decode(data["image_b64"])
    logger.info("CatVTON Modal tamamlandı | boyut=%d bytes", len(image_bytes))
    return image_bytes
