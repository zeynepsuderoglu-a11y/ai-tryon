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

_PRESET_PROMPT = """Replace the background of this photo completely with: {bg_desc}.

Rules:
- Keep the subject (person/product/object) EXACTLY as-is — same position, same size, same details
- Only replace what is BEHIND the subject
- Blend naturally so the subject looks like they were photographed in the new background
- Maintain natural lighting and shadows on the subject

Output: photorealistic result."""

_CUSTOM_PROMPT = """IMAGE 1: Subject photo.
IMAGE 2: Desired background scene.

Replace the background in IMAGE 1 completely with the scene from IMAGE 2.

Rules:
- Keep the subject from IMAGE 1 EXACTLY as-is — same position, same size, same pose
- Only replace what is BEHIND the subject
- Blend naturally so the subject looks like they were photographed in the IMAGE 2 environment
- Maintain natural lighting and shadows on the subject

Output: photorealistic result."""


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

    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=contents,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )

    for part in response.candidates[0].content.parts:
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

    raise RuntimeError("Gemini görsel üretemedi: " + str(getattr(response, "text", "")))


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
        """
        import httpx

        urls_to_fetch = [input_image_url]
        if custom_bg_url:
            urls_to_fetch.append(custom_bg_url)

        async with httpx.AsyncClient(timeout=60.0) as client:
            responses = await asyncio.gather(*[client.get(u) for u in urls_to_fetch])

        for r in responses:
            r.raise_for_status()

        image_bytes = responses[0].content
        mime_type = responses[0].headers.get("content-type", "image/jpeg").split(";")[0]

        custom_bg_bytes = None
        custom_bg_mime = None
        if custom_bg_url and len(responses) > 1:
            custom_bg_bytes = responses[1].content
            custom_bg_mime = responses[1].headers.get("content-type", "image/jpeg").split(";")[0]

        bg_desc = None if custom_bg_bytes else BACKGROUND_DESCS.get(background, BACKGROUND_DESCS["white_studio"])

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
