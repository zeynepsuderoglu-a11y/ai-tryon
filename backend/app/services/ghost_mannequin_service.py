"""
GhostMannequinService — Gemini 2.0 Flash ile ghost mannequin üretir.
  Herhangi bir ürün fotoğrafı (askı, model, düz zemin) →
  profesyonel ghost mannequin e-ticaret görseli
"""

from __future__ import annotations

import asyncio
import io
import logging

from app.core.config import settings
from app.services.cloudinary_service import cloudinary_service

logger = logging.getLogger(__name__)

_GHOST_BASE = """Transform this clothing product photo into a professional ghost mannequin (hollow man / invisible mannequin) product photo for an e-commerce fashion store.

Instructions:
- CRITICAL — PRESERVE GARMENT: Keep every garment detail exactly as-is: color, texture, button count, button placement, stitching, patterns, zippers, pockets, lapels, silhouette. Do NOT redesign, alter or recreate any part of the garment.
- Remove the hanger, any background, and any visible mannequin or person completely
- Background must be pure solid white (#FFFFFF) — absolutely flat, zero shadows, zero gradients, zero texture, no drop shadows under the garment
- CRITICAL — VOLUME & SHAPE: The featured garment(s) MUST look naturally filled and volumetric, as if an invisible person is actively wearing them right now. The fabric should have natural 3D body, natural folds, natural drape — NOT flat, NOT deflated, NOT lying on the floor
- Make the mannequin fully invisible. At the collar/neckline, reveal only the garment's own inner lining as a natural hollow opening — do NOT show any mannequin neck or body form
- Sleeves MUST look like invisible arms are inside them — slight natural bend at elbow, fabric has gentle tension as if arms fill the sleeves completely. Cuffs sit naturally at wrist level. Do NOT let sleeves hang limp, flat or empty.
{garment_instruction}

Output: a clean, professional ghost mannequin product photo on pure white background — garments filled with natural volume, no shadows."""

_GARMENT_INSTRUCTIONS = {
    "top": (
        "FEATURED PRODUCT — UPPER BODY ONLY: The product being sold is the upper body garment "
        "(top, blouse, shirt, jacket, sweatshirt, etc.). Show ONLY this garment as ghost mannequin. "
        "Completely remove all other clothing items worn by the model — pants, jeans, skirts, shoes, "
        "and any other bottom garments. Crop the output naturally just below the hip line."
    ),
    "bottom": (
        "FEATURED PRODUCT — LOWER BODY ONLY: The product being sold is the lower body garment "
        "(pants, skirt, shorts, etc.). Show ONLY this garment as ghost mannequin. "
        "Completely remove all other clothing items — tops, shirts, jackets, shoes. "
        "Start the output naturally from the waist/hip line."
    ),
    "dress": (
        "FEATURED PRODUCT — FULL LENGTH: The product being sold is a dress, jumpsuit, romper, "
        "or other full-body garment. Show the complete garment as ghost mannequin from shoulders to hem. "
        "Remove any separate items that are not part of this garment (e.g. separate jacket, shoes)."
    ),
    "set": (
        "FEATURED PRODUCT — COMPLETE SET: The product is a matching set (top + bottom sold together). "
        "Assemble both pieces vertically as one complete outfit worn by an invisible standing person — "
        "top aligned on upper body, bottom on lower body. Do NOT place side by side."
    ),
}


def _build_ghost_prompt(garment_type: str) -> str:
    instruction = _GARMENT_INSTRUCTIONS.get(garment_type, _GARMENT_INSTRUCTIONS["set"])
    return _GHOST_BASE.format(garment_instruction=instruction)


def _ghost_mannequin_sync(image_bytes: bytes, mime_type: str = "image/jpeg", garment_type: str = "set") -> bytes:
    """
    Blocking — run_in_executor içinde çalışır.
    image_bytes → ghost mannequin JPEG bytes
    """
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = _build_ghost_prompt(garment_type)
    logger.info("[ghost] Gemini isteği gönderiliyor (garment_type=%s)", garment_type)

    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )

    # Görseli yanıttan çıkar
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            logger.info("[ghost] Gemini görsel çıktısı alındı")
            return part.inline_data.data

    raise RuntimeError("Gemini görsel üretemedi: " + str(response.text if hasattr(response, "text") else ""))


class GhostMannequinService:

    async def run(self, input_image_url: str, garment_type: str = "set") -> str:
        """
        Ürün/model fotoğrafı URL → ghost mannequin Cloudinary URL
        garment_type: "top" | "bottom" | "dress" | "set"
        """
        import httpx

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.get(input_image_url)
            resp.raise_for_status()
            image_bytes = resp.content
            content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0]

        loop = asyncio.get_running_loop()

        result_bytes = await loop.run_in_executor(
            None, _ghost_mannequin_sync, image_bytes, content_type, garment_type
        )

        url_result = await loop.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(
                result_bytes, folder="tryon/ghost/output"
            ),
        )
        return url_result["secure_url"]


ghost_mannequin_service = GhostMannequinService()
