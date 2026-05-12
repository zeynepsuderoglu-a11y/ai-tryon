"""
MannequinTryonService — Yüz referansı (Cloudinary URL) + Ürün → E-ticaret katalog görseli
Garment analysis (Claude) → Gemini image generation
"""
from __future__ import annotations

import asyncio
import io
import logging

import httpx

from app.core.config import settings
from app.services.cloudinary_service import cloudinary_service

logger = logging.getLogger(__name__)


def _build_prompt(critical_detail: str, is_sleepwear: bool, background_desc: str, crop_type: str = "full_body", footwear: str = "", has_bg_image: bool = False) -> str:
    detail_block = f"CRITICAL GARMENT DETAIL — reproduce this exactly: {critical_detail}\n\n" if critical_detail else ""
    if is_sleepwear:
        footwear_line = "\nThe model must be barefoot with no shoes."
    elif footwear:
        footwear_line = f"\nThe model wears {footwear}."
    else:
        footwear_line = ""
    crop_line = (
        "The complete figure from head to feet must be fully visible — do not crop."
        if crop_type == "full_body"
        else "Frame as a three-quarter shot from head to just above the knees — do not show feet."
    )

    if has_bg_image:
        image_refs = "IMAGE 1: Fashion model face reference.\nIMAGE 2: Fashion garment.\nIMAGE 3: Background scene."
        bg_line = "BACKGROUND: Use the exact scene from IMAGE 3 as the background — reproduce it faithfully, do NOT replace with plain white studio."
    else:
        image_refs = "IMAGE 1: Fashion model face reference.\nIMAGE 2: Fashion garment."
        bg_line = f"BACKGROUND: {background_desc} — render this background exactly, do NOT default to plain white studio."

    return f"""{image_refs}

{detail_block}Produce a professional e-commerce fashion photo of the model from IMAGE 1 wearing the garment from IMAGE 2.
Copy the garment from IMAGE 2 exactly as it is — same color, fabric, pattern, neckline, sleeve length, every button, every trim detail. Do not change, add, or remove anything.{footwear_line}
The model's exposed skin (face, neck, hands, arms) must remain its exact natural tone — no color cast, tint, or bleed from the garment color onto skin.
{crop_line}
{bg_line}
Soft studio lighting, attractive e-commerce pose.
Output one fashion photo."""


def _run_sync(
    face_bytes: bytes,
    face_mime: str,
    garment_bytes: bytes,
    garment_mime: str,
    prompt: str,
    bg_bytes: bytes | None = None,
    bg_mime: str = "image/jpeg",
) -> bytes:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    contents = [
        types.Part.from_bytes(data=face_bytes, mime_type=face_mime),
        types.Part.from_bytes(data=garment_bytes, mime_type=garment_mime),
    ]
    if bg_bytes:
        contents.append(types.Part.from_bytes(data=bg_bytes, mime_type=bg_mime))
    contents.append(prompt)

    logger.info("[mannequin-tryon] Gemini isteği gönderiliyor (bg_image=%s)", bg_bytes is not None)
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=contents,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
            temperature=0.5,
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
        face_url: str,
        garment_url: str,
        critical_detail: str,
        is_sleepwear: bool,
        background_desc: str = "pure white seamless studio background, no shadows",
        crop_type: str = "full_body",
        footwear: str = "",
        background_image_url: str = "",
    ) -> str:
        # Yüz fotoğrafını URL'den indir
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(face_url)
            resp.raise_for_status()
            face_bytes = resp.content
            ct = resp.headers.get("content-type", "image/jpeg")
            face_mime = ct.split(";")[0].strip() or "image/jpeg"
        logger.info("[mannequin-tryon] face=%s (%dKB)", face_url, len(face_bytes) // 1024)

        # Ürün fotoğrafını indir
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(garment_url)
            resp.raise_for_status()
            garment_bytes = resp.content
            ct = resp.headers.get("content-type", "image/jpeg")
            garment_mime = ct.split(";")[0].strip() or "image/jpeg"
        logger.info("[mannequin-tryon] garment=%s", garment_url)

        # Arka plan görselini indir (varsa)
        bg_bytes: bytes | None = None
        bg_mime = "image/jpeg"
        if background_image_url:
            try:
                async with httpx.AsyncClient(timeout=20) as client:
                    resp = await client.get(background_image_url)
                    resp.raise_for_status()
                    bg_bytes = resp.content
                    ct = resp.headers.get("content-type", "image/jpeg")
                    bg_mime = ct.split(";")[0].strip() or "image/jpeg"
                logger.info("[mannequin-tryon] bg_image=%s (%dKB)", background_image_url, len(bg_bytes) // 1024)
            except Exception as e:
                logger.warning("[mannequin-tryon] Arka plan görseli indirilemedi: %s", e)
                bg_bytes = None

        prompt = _build_prompt(
            critical_detail=critical_detail,
            is_sleepwear=is_sleepwear,
            background_desc=background_desc,
            crop_type=crop_type,
            footwear=footwear,
            has_bg_image=bg_bytes is not None,
        )
        logger.info("[mannequin-tryon] Prompt:\n%s", prompt)

        loop = asyncio.get_event_loop()

        # 3 deneme
        last_err: Exception | None = None
        for attempt in range(1, 4):
            try:
                img_bytes = await asyncio.wait_for(
                    loop.run_in_executor(None, _run_sync, face_bytes, face_mime, garment_bytes, garment_mime, prompt, bg_bytes, bg_mime),
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
