"""
upscale_service — 4x LANCZOS + UnsharpMask keskinleştirme.
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def upscale_pil(img: "PIL.Image.Image") -> "PIL.Image.Image":
    """PIL Image → 4x upscale + UnsharpMask keskinleştirme."""
    from PIL import Image, ImageFilter
    w, h = img.size
    img_up = img.resize((w * 4, h * 4), Image.LANCZOS)
    return img_up.filter(ImageFilter.UnsharpMask(radius=1.5, percent=150, threshold=3))
