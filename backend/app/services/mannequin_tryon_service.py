"""
MannequinTryonService — Yüz referansı + Ürün fotoğrafı → Tam boy katalog görseli
Mevcut sisteme bağımlılığı yok, tamamen bağımsız servis.
"""
from __future__ import annotations

import asyncio
import io
import logging
from pathlib import Path

import httpx

from app.core.config import settings
from app.services.cloudinary_service import cloudinary_service

logger = logging.getLogger(__name__)

MANNEQUIN_DIR = Path(__file__).parent.parent.parent / "static" / "mannequins"

PROMPT_OUTFIT = """IMAGE 1: Model face and body reference.
IMAGE 2: Exact product garment.

Generate a full body fashion catalog photo of the person from IMAGE 1 wearing the garment from IMAGE 2.

GARMENT — COPY EXACTLY FROM IMAGE 2 (most important rule):
- Color: must be identical — same exact shade, do NOT lighten or darken
- Pattern/print: must be identical — copy every detail of the print, texture, graphic
- Style and cut: must be identical — same neckline, sleeves, hem length, buttons, collar, pockets
- Do NOT reinterpret or approximate the garment in any way

FOOTWEAR:
- Pajamas / nightwear / sleepwear / loungewear → barefoot, absolutely NO shoes
- Top only (shirt, blouse, t-shirt, jacket) → add complementary bottom + appropriate shoes
- Full outfit (dress, suit, tracksuit, co-ord set) → add shoes only

PHOTO: white background, soft studio lighting, confident standing pose, photorealistic, high resolution."""


def _run_sync(face_bytes: bytes, face_mime: str, garment_bytes: bytes, garment_mime: str) -> bytes:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[
            types.Part.from_bytes(data=face_bytes, mime_type=face_mime),
            types.Part.from_bytes(data=garment_bytes, mime_type=garment_mime),
            PROMPT_OUTFIT,
        ],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )

    if not response.candidates:
        raise RuntimeError("Görsel üretilemedi, lütfen tekrar deneyin")

    candidate = response.candidates[0]
    finish_reason = getattr(candidate, "finish_reason", "UNKNOWN")
    logger.info("[mannequin-tryon] finish_reason=%s", finish_reason)

    if candidate.content is None:
        raise RuntimeError("Görsel içeriği boş")

    for part in candidate.content.parts:
        if part.inline_data:
            return part.inline_data.data

    raise RuntimeError("Görsel verisi bulunamadı")


class MannequinTryonService:
    async def run(self, mannequin_id: int, garment_url: str) -> str:
        # Yüz fotoğrafını oku — JPG (thumbnail) daha hızlı, PNG yoksa JPG kullan
        jpg_path = MANNEQUIN_DIR / f"{mannequin_id}.jpg"
        png_path = MANNEQUIN_DIR / f"{mannequin_id}.png"
        face_path = jpg_path if jpg_path.exists() else png_path
        if not face_path.exists():
            raise FileNotFoundError(f"Manken {mannequin_id} bulunamadı")
        face_bytes = face_path.read_bytes()
        face_mime = "image/jpeg" if face_path.suffix == ".jpg" else "image/png"

        # Ürün fotoğrafını indir
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(garment_url)
            resp.raise_for_status()
            garment_bytes = resp.content
            ct = resp.headers.get("content-type", "image/jpeg")
            garment_mime = ct.split(";")[0].strip() or "image/jpeg"

        logger.info("[mannequin-tryon] manken=%d face_size=%d garment=%s", mannequin_id, len(face_bytes), garment_url)

        loop = asyncio.get_event_loop()
        img_bytes = await asyncio.wait_for(
            loop.run_in_executor(None, _run_sync, face_bytes, face_mime, garment_bytes, garment_mime),
            timeout=180,
        )

        # 4x upscale
        try:
            from PIL import Image

            img = Image.open(io.BytesIO(img_bytes))
            w, h = img.size
            img = img.resize((w * 4, h * 4), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=97)
            img_bytes = buf.getvalue()
            logger.info("[mannequin-tryon] Upscale: %dx%d → %dx%d, %dKB", w, h, w*4, h*4, len(img_bytes)//1024)
        except Exception as e:
            logger.warning("[mannequin-tryon] Upscale başarısız: %s", e)

        # Cloudinary'e yükle
        loop2 = asyncio.get_event_loop()
        result = await loop2.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(img_bytes, folder="tryon/mannequin/output"),
        )
        output_url = result["secure_url"]

        return output_url


mannequin_tryon_service = MannequinTryonService()
