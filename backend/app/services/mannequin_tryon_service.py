"""
MannequinTryonService — Yüz referansı + Ürün analizi → E-ticaret katalog görseli
Garment analysis (Claude) → Gemini image generation
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


def _build_prompt(critical_detail: str, is_sleepwear: bool) -> str:
    detail_line = f"\nReproduce EXACTLY: {critical_detail}" if critical_detail else ""
    footwear_line = "\nThe model must be barefoot with no shoes." if is_sleepwear else ""

    return f"""IMAGE 1: Fashion model face reference.
IMAGE 2: Fashion garment.

Produce a professional e-commerce fashion photo of the model from IMAGE 1 wearing the garment from IMAGE 2.
Match every detail of the garment in IMAGE 2 exactly: color, fabric, pattern, neckline, sleeve length, buttons, and trim. Do not add, remove, or change any detail.{detail_line}{footwear_line}
White background, soft studio lighting, full body, attractive e-commerce pose.
Output one fashion photo."""


def _run_sync(
    face_bytes: bytes,
    face_mime: str,
    garment_bytes: bytes,
    garment_mime: str,
    prompt: str,
) -> bytes:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    logger.info("[mannequin-tryon] Gemini isteği gönderiliyor")
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[
            types.Part.from_bytes(data=face_bytes, mime_type=face_mime),
            types.Part.from_bytes(data=garment_bytes, mime_type=garment_mime),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )

    if not response.candidates:
        raise RuntimeError("Görsel üretilemedi")

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
    async def run(
        self,
        mannequin_id: int,
        garment_url: str,
        critical_detail: str,
        is_sleepwear: bool,
    ) -> str:
        # Yüz fotoğrafı — PNG varsa 1024px JPEG'e çevir (RGBA→RGB dahil)
        png_path = MANNEQUIN_DIR / f"{mannequin_id}.png"
        jpg_path = MANNEQUIN_DIR / f"{mannequin_id}.jpg"

        if png_path.exists():
            from PIL import Image as PILImage
            img = PILImage.open(png_path).convert("RGB")
            w, h = img.size
            new_h = int(h * 1024 / w)
            img = img.resize((1024, new_h), PILImage.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=95)
            face_bytes = buf.getvalue()
            logger.info("[mannequin-tryon] face 1024px JPEG: %dKB", len(face_bytes) // 1024)
        elif jpg_path.exists():
            face_bytes = jpg_path.read_bytes()
            logger.info("[mannequin-tryon] face thumbnail JPG: %dKB", len(face_bytes) // 1024)
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

        logger.info("[mannequin-tryon] manken=%d garment=%s", mannequin_id, garment_url)

        prompt = _build_prompt(critical_detail=critical_detail, is_sleepwear=is_sleepwear)
        logger.info("[mannequin-tryon] Prompt:\n%s", prompt)

        loop = asyncio.get_event_loop()

        # 3 deneme (Nano Banana gibi)
        last_err: Exception | None = None
        for attempt in range(1, 4):
            try:
                img_bytes = await asyncio.wait_for(
                    loop.run_in_executor(None, _run_sync, face_bytes, face_mime, garment_bytes, garment_mime, prompt),
                    timeout=180,
                )
                break
            except Exception as e:
                last_err = e
                logger.warning("[mannequin-tryon] Deneme %d başarısız: %s", attempt, e)
                if attempt < 3:
                    await asyncio.sleep(2)
        else:
            raise last_err

        # 4x upscale → PNG
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            w, h = img.size
            img = img.resize((w * 4, h * 4), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            img_bytes = buf.getvalue()
            logger.info("[mannequin-tryon] Upscale: %dx%d → %dx%d PNG, %dKB", w, h, w * 4, h * 4, len(img_bytes) // 1024)
        except Exception as e:
            logger.warning("[mannequin-tryon] Upscale başarısız: %s", e)

        # Cloudinary'e yükle
        result = await loop.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(img_bytes, folder="tryon/mannequin/output"),
        )
        return result["secure_url"]


mannequin_tryon_service = MannequinTryonService()
