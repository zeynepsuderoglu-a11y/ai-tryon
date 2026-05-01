"""
upscale_service — Real-ESRGAN 4x upscale yardımcısı.
realesrgan-ncnn-vulkan binary kullanır; binary yoksa LANCZOS fallback.
"""
from __future__ import annotations

import logging
import os
import subprocess
import tempfile

logger = logging.getLogger(__name__)

_BIN = "/usr/local/realesrgan/realesrgan-ncnn-vulkan"
_MODELS = "/usr/local/realesrgan/models"


def upscale_pil(img: "PIL.Image.Image") -> "PIL.Image.Image":
    """
    PIL Image → 4x Real-ESRGAN upscale edilmiş PIL Image.
    Binary bulunamazsa veya hata olursa LANCZOS ile fallback yapar.
    """
    from PIL import Image

    if not os.path.exists(_BIN):
        logger.warning("[upscale] realesrgan binary bulunamadı, LANCZOS fallback")
        return _lanczos(img)

    in_path = tempfile.mktemp(suffix=".png")
    out_path = tempfile.mktemp(suffix=".png")
    try:
        img.save(in_path, format="PNG")

        result = subprocess.run(
            [_BIN, "-i", in_path, "-o", out_path,
             "-n", "realesrgan-x4plus", "-s", "4", "-m", _MODELS],
            capture_output=True,
            timeout=180,
        )

        if result.returncode != 0:
            logger.warning(
                "[upscale] realesrgan rc=%d stderr=%s, LANCZOS fallback",
                result.returncode, result.stderr[:300].decode(errors="replace"),
            )
            return _lanczos(img)

        result_img = Image.open(out_path).copy()
        logger.info("[upscale] Real-ESRGAN 4x tamamlandı (%dx%d → %dx%d)",
                    img.width, img.height, result_img.width, result_img.height)
        return result_img

    except Exception as exc:
        logger.warning("[upscale] exception=%s, LANCZOS fallback", exc)
        return _lanczos(img)

    finally:
        for p in (in_path, out_path):
            try:
                os.unlink(p)
            except OSError:
                pass


def _lanczos(img: "PIL.Image.Image") -> "PIL.Image.Image":
    from PIL import Image
    w, h = img.size
    return img.resize((w * 4, h * 4), Image.LANCZOS)
