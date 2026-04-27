"""
BackgroundReplaceService — Gemini 2.5 Flash Image ile arka plan değiştirir.
  Herhangi bir fotoğraf (ürün/model/kişi) →
  arka planı değiştirilmiş profesyonel görsel
"""
from __future__ import annotations

import asyncio
import io
import logging

from app.core.config import settings
from app.services.cloudinary_service import cloudinary_service

logger = logging.getLogger(__name__)

BACKGROUND_DESCS = {
    "white_studio":     "pure white seamless studio background, no shadows",
    "grey_studio":      "neutral light grey seamless studio background",
    "cream":            "warm cream/ivory seamless studio background",
    "black_studio":     "deep black seamless studio background",
    "pink_studio":      "soft pastel pink seamless studio background",
    "outdoor_city":     "modern city street background, natural daylight",
    "outdoor_nature":   "lush green nature/park background, soft sunlight",
    "cafe":             "warm cozy café interior background",
    "minimal_room":     "minimal clean modern room interior background",
    "beige_outdoor":    "warm sandy beach/outdoor background",
    "istanbul_terrace": "Istanbul Bosphorus terrace view background, golden hour",
    "boho_room":        "bohemian style room interior background, warm earth tones",
    "wood_studio":      "warm wooden floor studio background",
    "luxury_marble":    "luxury white marble surface background",
    "warm_studio":      "warm tone seamless studio background",
    "ottoman_cafe":     "classic Ottoman/Turkish café interior background",
    "industrial_room":  "industrial loft interior background, exposed brick",
    "garden":           "lush green garden background, natural light",
    "concrete_loft":    "concrete loft studio background, modern minimal",
    "rose_studio":      "soft rose/blush seamless studio background",
    "arch_room":        "elegant arched room interior background, Mediterranean style",
}

_PRESET_PROMPT = """Generate a professional product/fashion photograph based on this reference image.

Setting: {bg_desc}

Requirements:
- The main subject (garment, product, or person) from the reference must appear IDENTICAL — same colors, details, texture, proportions
- Place the subject naturally in the setting with realistic lighting and shadows
- Professional studio/editorial quality output

Output: single photorealistic image, same framing and composition as the reference."""

_CUSTOM_PROMPT = """IMAGE 1: Subject reference photo.
IMAGE 2: Background scene reference.

Generate a professional photograph where the subject from IMAGE 1 is placed naturally in the scene from IMAGE 2.

Requirements:
- The subject from IMAGE 1 must appear IDENTICAL — same colors, details, texture, proportions
- Use the environment and lighting from IMAGE 2 as the setting
- Professional photographic quality, seamless integration

Output: single photorealistic image."""


def _background_replace_sync(
    image_bytes: bytes,
    mime_type: str,
    bg_desc: str | None,
    custom_bg_bytes: bytes | None,
    custom_bg_mime: str | None,
) -> bytes:
    """Blocking — run_in_executor içinde çalışır."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    if custom_bg_bytes:
        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            types.Part.from_bytes(data=custom_bg_bytes, mime_type=custom_bg_mime),
            _CUSTOM_PROMPT,
        ]
    else:
        prompt = _PRESET_PROMPT.format(bg_desc=bg_desc)
        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt,
        ]

    logger.info("[bg-replace] Gemini isteği gönderiliyor (custom=%s)", custom_bg_bytes is not None)

    for attempt in range(2):
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )

        if not response.candidates:
            logger.warning("[bg-replace] attempt=%d candidates boş, tekrar deneniyor", attempt)
            continue

        candidate = response.candidates[0]
        finish_reason = getattr(candidate, "finish_reason", "UNKNOWN")
        logger.info("[bg-replace] attempt=%d finish_reason=%s", attempt, finish_reason)

        if candidate.content is None:
            logger.warning("[bg-replace] attempt=%d content=None (finish_reason=%s), tekrar deneniyor", attempt, finish_reason)
            continue

        for part in candidate.content.parts:
            if part.inline_data is not None:
                logger.info("[bg-replace] Gemini görsel çıktısı alındı, 4x upscale başlıyor")
                from PIL import Image
                img = Image.open(io.BytesIO(part.inline_data.data)).convert("RGB")
                w, h = img.size
                img_up = img.resize((w * 4, h * 4), Image.LANCZOS)
                out = io.BytesIO()
                img_up.save(out, format="JPEG", quality=95)
                logger.info("[bg-replace] Upscale tamamlandı: %dx%d → %dx%d", w, h, w * 4, h * 4)
                return out.getvalue()

        logger.warning("[bg-replace] attempt=%d görsel part bulunamadı", attempt)

    raise RuntimeError("Gemini görsel üretemedi — lütfen farklı bir fotoğraf ile tekrar deneyin")


class BackgroundReplaceService:

    async def run(
        self,
        input_image_url: str,
        background: str = "white_studio",
        custom_bg_url: str = "",
    ) -> str:
        """
        Fotoğraf URL → arka planı değiştirilmiş Cloudinary URL
        background: preset key veya "custom" (custom_bg_url gerektirir)
        Preset'lerde thumbnail görselini Gemini'ye reference olarak gönderir.
        """
        import httpx

        # Preset için thumbnail görseli reference olarak al
        if custom_bg_url:
            bg_ref_url = custom_bg_url
        else:
            bg_ref_url = f"{settings.FRONTEND_URL}/backgrounds/{background}.jpg"

        async with httpx.AsyncClient(timeout=60.0) as client:
            subject_resp, bg_resp = await asyncio.gather(
                client.get(input_image_url),
                client.get(bg_ref_url),
            )

        subject_resp.raise_for_status()

        image_bytes = subject_resp.content
        mime_type = subject_resp.headers.get("content-type", "image/jpeg").split(";")[0]

        # Background image — başarılı ise görsel reference, aksi hâlde text fallback
        if bg_resp.status_code == 200:
            custom_bg_bytes = bg_resp.content
            custom_bg_mime = bg_resp.headers.get("content-type", "image/jpeg").split(";")[0]
            bg_desc = None
            logger.info("[bg-replace] Arka plan görseli alındı (%s)", bg_ref_url)
        else:
            custom_bg_bytes = None
            custom_bg_mime = None
            bg_desc = BACKGROUND_DESCS.get(background, BACKGROUND_DESCS["white_studio"])
            logger.warning("[bg-replace] Arka plan görseli alınamadı (%d), text fallback", bg_resp.status_code)

        loop = asyncio.get_running_loop()
        result_bytes = await loop.run_in_executor(
            None,
            _background_replace_sync,
            image_bytes, mime_type, bg_desc, custom_bg_bytes, custom_bg_mime,
        )

        url_result = await loop.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(
                result_bytes, folder="tryon/background/output"
            ),
        )
        return url_result["secure_url"]


background_replace_service = BackgroundReplaceService()
