"""
VideoService — kie.ai Veo 3.1 Fast API entegrasyonu.
  - Image to Video: 1 fotoğraf → 9:16 dikey video
  - Reference to Video: 1-3 fotoğraf → daha tutarlı video
  - Polling: 30s aralıklarla durum kontrolü
"""

import asyncio
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

KIE_GENERATE_URL = f"{settings.KIE_API_URL}/veo/generate"
KIE_STATUS_URL = f"{settings.KIE_API_URL}/veo/record-info"
POLL_INTERVAL = 30   # saniye
MAX_POLLS = 40       # maksimum 20 dakika


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.KIE_API_KEY}",
        "Content-Type": "application/json",
    }


async def generate_video(
    image_urls: list[str],
    prompt: str,
    mode: str = "image_to_video",
) -> str:
    """
    kie.ai'ye video üretim isteği gönderir.
    Döner: task_id (string)
    """
    if mode == "reference_to_video":
        generation_type = "REFERENCE_2_VIDEO"
    else:
        generation_type = "FIRST_AND_LAST_FRAMES_2_VIDEO"

    payload = {
        "model": "veo3_fast",
        "generationType": generation_type,
        "imageUrls": image_urls,
        "prompt": prompt,
        "aspectRatio": "9:16",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(KIE_GENERATE_URL, json=payload, headers=_headers())
        resp.raise_for_status()
        data = resp.json()

    if data.get("code") != 200:
        raise RuntimeError("Video üretimi başlatılamadı")

    task_id = data["data"]["taskId"]
    logger.info("[video] Task oluşturuldu: %s", task_id)
    return task_id


async def poll_video_status(task_id: str) -> str:
    """
    Video hazır olana kadar polling yapar.
    Döner: video URL (string)
    Raises: RuntimeError başarısız olursa
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(MAX_POLLS):
            await asyncio.sleep(POLL_INTERVAL)

            resp = await client.get(
                KIE_STATUS_URL,
                params={"taskId": task_id},
                headers=_headers(),
            )
            resp.raise_for_status()
            data = resp.json()

            if data.get("code") != 200:
                raise RuntimeError("Video durum sorgusu başarısız")

            info = data.get("data", {})
            flag = info.get("successFlag", 0)

            if flag == 1:
                import json
                # Önce data['response']['resultUrls'], yoksa data['resultUrls']
                response_obj = info.get("response") or {}
                urls_raw = response_obj.get("resultUrls") or info.get("resultUrls", "[]")
                if isinstance(urls_raw, str):
                    urls = json.loads(urls_raw)
                else:
                    urls = urls_raw or []
                if urls:
                    logger.info("[video] Tamamlandı: %s", urls[0])
                    return urls[0]
                raise RuntimeError("Video URL boş döndü")

            elif flag in (2, 3):
                raise RuntimeError("Video üretimi başarısız oldu")

            logger.info("[video/%s] Bekleniyor... deneme %d/%d", task_id, attempt + 1, MAX_POLLS)

    raise RuntimeError("Video üretimi zaman aşımına uğradı")
