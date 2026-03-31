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

GHOST_PROMPT = """Transform this clothing product photo into a professional ghost mannequin (hollow man) product photo for an e-commerce fashion store.

Instructions:
- Remove the hanger, any background, and any visible mannequin or person completely
- Background must be pure solid white (#FFFFFF) — absolutely flat, zero shadows, zero gradients, zero texture, no drop shadows under the garment
- Keep the garment EXACTLY as photographed — preserve every detail: color, texture, buttons, stitching, patterns, zippers, pockets
- Make the garment look naturally shaped and 3D, as if worn by an invisible mannequin standing upright
- Show the hollow interior at the collar/neckline opening (the inside lining should be visible)
- Sleeves naturally positioned and shaped
- If the product is a SET (top + bottom, suit, tracksuit etc.): show the complete outfit assembled vertically as worn together by an invisible person — top piece on upper half, bottom piece on lower half, properly aligned as a single ghost mannequin figure. Do NOT place pieces side by side.

Output: a clean, professional ghost mannequin product photo on a pure white background with no shadows."""


def _ghost_mannequin_sync(image_bytes: bytes, mime_type: str = "image/jpeg") -> bytes:
    """
    Blocking — run_in_executor içinde çalışır.
    image_bytes → ghost mannequin JPEG bytes
    """
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    logger.info("[ghost] Gemini 2.0 Flash isteği gönderiliyor...")

    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            GHOST_PROMPT,
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

    async def run(self, input_image_url: str) -> str:
        """
        Ürün/model fotoğrafı URL → ghost mannequin Cloudinary URL
        """
        import httpx

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.get(input_image_url)
            resp.raise_for_status()
            image_bytes = resp.content
            content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0]

        loop = asyncio.get_running_loop()

        result_bytes = await loop.run_in_executor(
            None, _ghost_mannequin_sync, image_bytes, content_type
        )

        url_result = await loop.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(
                result_bytes, folder="tryon/ghost/output"
            ),
        )
        return url_result["secure_url"]


ghost_mannequin_service = GhostMannequinService()
