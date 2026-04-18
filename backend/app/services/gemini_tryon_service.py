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
    lines = [
        "IMAGE 1: Garment product photo — the clothing item to transfer.",
        "IMAGE 2: Fashion model — the person to dress. PRESERVE THIS PERSON EXACTLY.",
        "",
        f"TASK: Replace ONLY the clothing on the model in IMAGE 2 with the {garment_type} from IMAGE 1.",
        "Everything else in IMAGE 2 must remain IDENTICAL.",
        "",
        "══════════════════════════════════════════",
        " ABSOLUTE PRESERVATION RULES — IMAGE 2",
        "══════════════════════════════════════════",
        "These elements must NEVER change under any circumstances:",
        "",
        "FACE & IDENTITY:",
        "- Preserve the model's face pixel-perfect: facial features, expression, makeup, skin tone, eye color.",
        "- Do NOT alter, smooth, reshape, or regenerate the face in any way.",
        "- The face in the output must be indistinguishable from IMAGE 2.",
        "",
        "HAIR:",
        "- Preserve exact hairstyle, color, length, and volume from IMAGE 2.",
        "- Do NOT restyle, recolor, move, or add/remove hair.",
        "",
        "SHOES & FOOTWEAR:",
        "- Preserve the EXACT shoes from IMAGE 2 — style, color, material, sole, and heel height.",
        "- Do NOT remove, replace, modify, or add footwear under any circumstances.",
        "- If the model is barefoot in IMAGE 2, keep barefoot.",
        "",
        "ACCESSORIES:",
        "- Preserve ALL jewelry, bags, belts, hats, and accessories from IMAGE 2 exactly as shown.",
        "- Do NOT add, remove, or modify any accessory.",
        "",
        "POSE & BODY:",
        "- Preserve exact standing pose, hand positions, arm angles, and body orientation from IMAGE 2.",
        "- Do NOT change the model's posture or position.",
        "",
        "SKIN TONE & BODY:",
        "- Preserve exact skin tone, body shape, and proportions from IMAGE 2.",
        "",
        "══════════════════════════════════════════",
        " GARMENT TRANSFER — FROM IMAGE 1 ONLY",
        "══════════════════════════════════════════",
        f"Transfer ONLY the {garment_type} from IMAGE 1 onto the model's body.",
        "",
        "GARMENT FIDELITY RULES (STRICT):",
        "- Do NOT redesign, reinterpret, or modify the garment in any way.",
        "- Preserve ALL of the following exactly from IMAGE 1:",
        "  • Neckline shape and construction (CRITICAL — must match perfectly, no smoothing)",
        "  • Collar structure and stitching details",
        "  • Fabric texture, weight, and lighting behavior",
        "  • Button/bow/closure type, count, and placement",
        "  • Sleeve cut, length, and cuff edges",
        "  • Seam positions and stitching lines",
        "  • Hem edges and any trim/piping at cuffs or bottom",
        "  • Pattern, print, and color accuracy",
    ]
    if critical_detail:
        lines.append(f"- CRITICAL DETAIL: {critical_detail}")
    if sleeve_lock:
        lines.append(f"- SLEEVE LOCK: {sleeve_lock}")
    if bottom_lock:
        lines.append(f"- BOTTOM LOCK: {bottom_lock}")
    lines += [
        "",
        f"SILHOUETTE: {proportion_hint}",
        f"FABRIC & COLOR: {texture_prompt}",
        "",
        "══════════════════════════════════════════",
        " COMPOSITION & QUALITY",
        "══════════════════════════════════════════",
        f"- {crop_frame}",
        f"- Background: {background_desc}",
        "- Centered framing, clothing as the visual priority.",
        "- Ultra realistic, DSLR photo quality — 85mm lens, f/2.8, soft natural lighting.",
        "- Sharp focus on garment details.",
        "- No AI artifacts, no blur, no texture loss.",
        "",
        "NEGATIVE (strictly forbidden):",
        "- Do NOT change face, hair, shoes, accessories, or pose from IMAGE 2.",
        "- Do NOT add or remove any clothing layer not present in the original images.",
        "- Do NOT generate AI-looking skin, face, or fabric.",
        "- Do NOT alter garment design, color, pattern, neckline, or sleeve length.",
    ]
    return "\n".join(lines)


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
        result_bytes = await loop.run_in_executor(
            None,
            _gemini_tryon_sync,
            model_bytes, model_mime,
            garment_bytes, garment_mime,
            prompt,
        )

        url_result = await loop.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(
                result_bytes, folder="tryon/gemini/output"
            ),
        )
        return url_result["secure_url"]


gemini_tryon_service = GeminiTryonService()
