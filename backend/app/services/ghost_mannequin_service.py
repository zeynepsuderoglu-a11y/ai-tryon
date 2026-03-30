"""
GhostMannequinService — Herhangi bir ürün fotoğrafından ghost mannequin üretir.
  1. rembg → arka plan kaldırılır, kıyafet izole edilir
  2. İç delikler (yaka/kol açıklıkları) flood-fill ile tespit edilir
  3. FLUX Fill Pro → iç açıklıklara hollow interior efekti
  4. Cloudinary → çıktı URL döndürülür
"""

from __future__ import annotations

import asyncio
import io
import logging
import os
import tempfile

import numpy as np
from PIL import Image, ImageFilter

from app.core.config import settings
from app.services.cloudinary_service import cloudinary_service

logger = logging.getLogger(__name__)

FLUX_FILL_MODEL = "black-forest-labs/flux-fill-pro"

GHOST_PROMPT = (
    "ghost mannequin photography, hollow garment interior visible at collar opening and sleeves, "
    "dark fabric interior lining, professional e-commerce product photography, "
    "pure white studio background, floating garment, no person, no mannequin visible"
)


# ── Sync helpers ──────────────────────────────────────────────────────────────

def _remove_background(image_bytes: bytes) -> Image.Image:
    """rembg ile arka planı kaldır → RGBA görsel döndür."""
    from rembg import remove
    nobg_bytes = remove(image_bytes)
    return Image.open(io.BytesIO(nobg_bytes)).convert("RGBA")


def _find_interior_holes(nobg_pil: Image.Image) -> np.ndarray:
    """
    rembg çıktısındaki şeffaf iç alanları (yaka/kol delikleri) bulur.
    Döndürür: uint8 mask (255 = iç delik, 0 = diğer)
    """
    import cv2

    alpha = np.array(nobg_pil.split()[3])
    h, w = alpha.shape

    # Şeffaf alanlar = 255, kıyafet = 0
    transparent = (alpha < 128).astype(np.uint8) * 255

    # Köşelerden flood-fill → dış arka planı işaretle
    exterior = transparent.copy()
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for cx, cy in corners:
        if exterior[cy, cx] == 255:
            seed_mask = np.zeros((h + 2, w + 2), np.uint8)
            cv2.floodFill(exterior, seed_mask, (cx, cy), 128)

    # Dış arka plan = 128 ile işaretlenmiş bölgeler
    exterior_mask = (exterior == 128).astype(np.uint8) * 255

    # İç delikler = şeffaf FAKAT dış arka plana bağlı değil
    interior_holes = cv2.bitwise_and(transparent, cv2.bitwise_not(exterior_mask))

    return interior_holes


def _ghost_mannequin_sync(image_bytes: bytes) -> bytes:
    """
    Blocking implementation — run_in_executor içinde çalışır.
    Herhangi bir ürün fotoğrafı → ghost mannequin JPEG bytes
    """
    import cv2
    import urllib.request

    os.environ["REPLICATE_API_TOKEN"] = settings.REPLICATE_API_TOKEN
    import replicate as replicate_lib

    client = replicate_lib.Client(api_token=settings.REPLICATE_API_TOKEN)

    # ── Adım 1: Arka plan kaldır ──────────────────────────────────────────────
    logger.info("[ghost] rembg başlıyor...")
    nobg_pil = _remove_background(image_bytes)
    w, h = nobg_pil.size
    logger.info("[ghost] rembg tamamlandı: %dx%d", w, h)

    # ── Adım 2: Beyaz arka plana yerleştir ───────────────────────────────────
    white_bg = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    white_bg.paste(nobg_pil, mask=nobg_pil.split()[3])
    garment_on_white = white_bg.convert("RGB")

    # ── Adım 3: İç delikleri tespit et ───────────────────────────────────────
    interior_holes = _find_interior_holes(nobg_pil)
    hole_pixels = int(np.sum(interior_holes > 0))
    logger.info("[ghost] İç delik pikseli: %d", hole_pixels)

    if hole_pixels < 200:
        # Tespit edilebilen iç delik yok → temiz rembg çıktısını döndür
        logger.info("[ghost] İç delik yok — temiz rembg çıktısı kullanılıyor")
        buf = io.BytesIO()
        garment_on_white.save(buf, "JPEG", quality=97, subsampling=0)
        return buf.getvalue()

    # ── Adım 4: Maskeyi yumuşat ───────────────────────────────────────────────
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (12, 12))
    holes_dilated = cv2.dilate(interior_holes, kernel, iterations=1)
    mask_pil = Image.fromarray(holes_dilated).filter(ImageFilter.GaussianBlur(radius=6))

    # ── Adım 5: Cloudinary'ye yükle (geçici) ─────────────────────────────────
    img_buf = io.BytesIO()
    garment_on_white.save(img_buf, "JPEG", quality=97)
    img_buf.seek(0)

    mask_buf = io.BytesIO()
    mask_pil.save(mask_buf, "PNG")
    mask_buf.seek(0)

    img_cld  = cloudinary_service.upload_file(img_buf.getvalue(),  folder="tryon/ghost/tmp")
    mask_cld = cloudinary_service.upload_file(mask_buf.getvalue(), folder="tryon/ghost/tmp")
    logger.info("[ghost] Cloudinary tmp yüklendi")

    # ── Adım 6: FLUX Fill Pro ─────────────────────────────────────────────────
    output = client.run(
        FLUX_FILL_MODEL,
        input={
            "image":            img_cld["secure_url"],
            "mask":             mask_cld["secure_url"],
            "prompt":           GHOST_PROMPT,
            "steps":            28,
            "guidance":         30,
            "safety_tolerance": 5,
            "output_format":    "jpg",
        },
    )

    out_url = str(output.url) if hasattr(output, "url") else str(output)
    logger.info("[ghost] FLUX Fill Pro tamamlandı: %s", out_url)

    with urllib.request.urlopen(out_url) as resp:
        return resp.read()


# ── Async service ─────────────────────────────────────────────────────────────

class GhostMannequinService:

    async def run(self, input_image_url: str) -> str:
        """
        Ürün fotoğrafı URL → ghost mannequin Cloudinary URL
        """
        import httpx

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.get(input_image_url)
            resp.raise_for_status()
            image_bytes = resp.content

        loop = asyncio.get_running_loop()

        result_bytes = await loop.run_in_executor(
            None, _ghost_mannequin_sync, image_bytes
        )

        url_result = await loop.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(
                result_bytes, folder="tryon/ghost/output"
            ),
        )
        return url_result["secure_url"]


ghost_mannequin_service = GhostMannequinService()
