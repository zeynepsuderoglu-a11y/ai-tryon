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

PROMPT_OUTFIT = """IMAGE 1 is the model. IMAGE 2 is the clothing item.

Show the model from IMAGE 1 wearing the exact clothing from IMAGE 2. Reproduce the clothing exactly as it appears in IMAGE 2 — same colors, same pattern, same fabric, same cut, same details. Do not change anything about the clothing.

If the clothing is pajamas or sleepwear, the model should be barefoot with no shoes.
If the clothing is only a top, add matching pants or a skirt and appropriate shoes.
If the clothing is a complete outfit, add only shoes.

White background, soft studio lighting, full body, professional fashion photo."""


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
        # Yüz fotoğrafını oku — PNG varsa 1024px'e resize edip JPEG olarak gönder
        # (5MB ham PNG çok yavaş, 500px JPG thumbnail çok küçük — 1024px optimum)
        png_path = MANNEQUIN_DIR / f"{mannequin_id}.png"
        jpg_path = MANNEQUIN_DIR / f"{mannequin_id}.jpg"

        if png_path.exists():
            from PIL import Image as PILImage
            img = PILImage.open(png_path).convert("RGB")  # RGBA→RGB (JPEG uyumu)
            w, h = img.size
            new_w = 1024
            new_h = int(h * new_w / w)
            img = img.resize((new_w, new_h), PILImage.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=95)
            face_bytes = buf.getvalue()
            logger.info("[mannequin-tryon] face PNG→JPEG 1024px: %dKB", len(face_bytes)//1024)
        elif jpg_path.exists():
            face_bytes = jpg_path.read_bytes()
            logger.info("[mannequin-tryon] face JPG thumbnail: %dKB", len(face_bytes)//1024)
        else:
            raise FileNotFoundError(f"Manken {mannequin_id} bulunamadı")
        face_mime = "image/jpeg"

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

        # 4x upscale → PNG (kayıpsız, yüksek kalite)
        try:
            from PIL import Image

            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            w, h = img.size
            img = img.resize((w * 4, h * 4), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            img_bytes = buf.getvalue()
            logger.info("[mannequin-tryon] Upscale: %dx%d → %dx%d PNG, %dKB", w, h, w*4, h*4, len(img_bytes)//1024)
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
