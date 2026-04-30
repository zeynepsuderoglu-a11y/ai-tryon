"""
GeminiTryonService — Gemini 2.5 Flash Image (Nano Banana) ile virtual try-on üretir.
  Manken fotoğrafı + Ürün fotoğrafı → Manneken üzerinde kıyafet
"""
from __future__ import annotations

import asyncio
import io
import logging

from app.core.config import settings
from app.services.cloudinary_service import cloudinary_service

logger = logging.getLogger(__name__)

BACKGROUND_DESCS = {
    "original":       "keep the original background from the model reference photo",
    "white_studio":   "pure white seamless studio background, no shadows",
    "grey_studio":    "neutral light grey seamless studio background",
    "cream":          "warm cream/ivory seamless studio background",
    "black_studio":   "deep black seamless studio background",
    "pink_studio":    "soft pastel pink seamless studio background",
    "outdoor_city":   "modern city street background, natural daylight",
    "outdoor_nature": "lush green nature/park background, soft sunlight",
    "cafe":           "warm cozy café interior background",
    "minimal_room":   "minimal clean modern room interior background",
    "beige_outdoor":  "warm sandy beach/outdoor background",
}


def _build_tryon_prompt(
    garment_type: str,
    texture_prompt: str,
    proportion_hint: str,
    critical_detail: str,
    sleeve_lock: str,
    bottom_lock: str,
    background_desc: str,
    crop_frame: str,
) -> str:
    detail_line = f"\nReproduce EXACTLY: {critical_detail}" if critical_detail else ""
    if background_desc.startswith("keep the original"):
        bg_line = "Keep the setting, background, lighting, and environment from IMAGE 2 exactly as is."
    else:
        bg_line = f"Background: {background_desc}"
    return f"""IMAGE 1: Fashion garment.
IMAGE 2: Fashion model.

Produce a fashion editorial photo of the model from IMAGE 2 styled in the garment from IMAGE 1.
Match every detail of the garment in IMAGE 1 exactly: color, fabric, pattern, neckline, sleeve length, buttons, and trim.{detail_line}
Preserve the model's styling, pose, hair, and footwear from IMAGE 2.
{bg_line}
Output one fashion editorial photo."""


def _gemini_tryon_sync(
    model_image_bytes: bytes,
    model_mime: str,
    garment_image_bytes: bytes,
    garment_mime: str,
    prompt: str,
) -> bytes:
    """Blocking — run_in_executor içinde çalışır."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    logger.info("[gemini-tryon] Gemini isteği gönderiliyor")

    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[
            types.Part.from_bytes(data=garment_image_bytes, mime_type=garment_mime),
            types.Part.from_bytes(data=model_image_bytes, mime_type=model_mime),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )

    if not response.candidates:
        raise RuntimeError("Gemini yanıt vermedi: candidates boş")

    candidate = response.candidates[0]
    finish_reason = getattr(candidate, "finish_reason", "UNKNOWN")
    logger.info("[gemini-tryon] finish_reason=%s", finish_reason)

    if candidate.content is None:
        raise RuntimeError(f"Gemini içerik üretemedi (finish_reason={finish_reason})")

    for part in candidate.content.parts:
        if part.inline_data is not None:
            logger.info("[gemini-tryon] Gemini görsel çıktısı alındı, 4x upscale başlıyor")
            from PIL import Image as PILImage
            img = PILImage.open(io.BytesIO(part.inline_data.data)).convert("RGB")
            w, h = img.size
            img_up = img.resize((w * 4, h * 4), PILImage.LANCZOS)
            out = io.BytesIO()
            img_up.save(out, format="JPEG", quality=97)
            logger.info("[gemini-tryon] Upscale tamamlandı: %dx%d → %dx%d", w, h, w * 4, h * 4)
            return out.getvalue()

    raise RuntimeError(f"Gemini görsel üretemedi (finish_reason={finish_reason}): " + str(getattr(response, "text", "")))


class GeminiTryonService:

    async def run(
        self,
        model_image_url: str,
        garment_url: str,
        garment_type: str,
        texture_prompt: str,
        proportion_hint: str,
        critical_detail: str,
        sleeve_lock: str,
        bottom_lock: str,
        background: str,
        crop_frame: str,
    ) -> str:
        """
        Manken URL + Ürün URL → try-on Cloudinary URL
        """
        import httpx

        background_desc = BACKGROUND_DESCS.get(background, BACKGROUND_DESCS["white_studio"])

        async with httpx.AsyncClient(timeout=60.0) as client:
            model_resp, garment_resp = await asyncio.gather(
                client.get(model_image_url),
                client.get(garment_url),
            )
            model_resp.raise_for_status()
            garment_resp.raise_for_status()
            model_bytes = model_resp.content
            garment_bytes = garment_resp.content
            model_mime = model_resp.headers.get("content-type", "image/jpeg").split(";")[0]
            garment_mime = garment_resp.headers.get("content-type", "image/jpeg").split(";")[0]

        prompt = _build_tryon_prompt(
            garment_type=garment_type,
            texture_prompt=texture_prompt,
            proportion_hint=proportion_hint,
            critical_detail=critical_detail,
            sleeve_lock=sleeve_lock,
            bottom_lock=bottom_lock,
            background_desc=background_desc,
            crop_frame=crop_frame,
        )

        logger.info("[gemini-tryon] Prompt:\n%s", prompt)

        loop = asyncio.get_running_loop()
        last_err: Exception | None = None
        for attempt in range(1, 4):
            try:
                result_bytes = await loop.run_in_executor(
                    None,
                    _gemini_tryon_sync,
                    model_bytes, model_mime,
                    garment_bytes, garment_mime,
                    prompt,
                )
                break
            except RuntimeError as e:
                last_err = e
                logger.warning("[gemini-tryon] Deneme %d başarısız: %s", attempt, e)
                if attempt < 3:
                    await asyncio.sleep(2)
        else:
            raise last_err

        url_result = await loop.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(
                result_bytes, folder="tryon/gemini/output"
            ),
        )
        return url_result["secure_url"]


gemini_tryon_service = GeminiTryonService()
