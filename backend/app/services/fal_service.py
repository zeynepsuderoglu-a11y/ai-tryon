import asyncio
import os
import fal_client
from app.core.config import settings

# CatVTON kategori eşlemesi
CATEGORY_MAP = {
    "tops":       "upper",
    "bottoms":    "lower",
    "one-pieces": "overall",
}


def _set_fal_key():
    """FAL_KEY ortam değişkenini ayarla."""
    if settings.FAL_KEY:
        os.environ["FAL_KEY"] = settings.FAL_KEY


async def run_fashn_tryon(
    model_image_url: str,
    garment_image_url: str,
    category: str = "tops",
    mode: str = "balanced",
) -> str:
    """
    fal.ai üzerindeki FASHN VTON v1.5 ile sanal giydirme (FASHN.ai fallback).
    FASHN.ai ile aynı model, daha kararlı altyapı.
    Sonuç görselinin URL'ini döndürür.
    """
    _set_fal_key()
    loop = asyncio.get_running_loop()

    def _submit():
        handler = fal_client.submit(
            "fal-ai/fashn/tryon/v1.5",
            arguments={
                "model_image": model_image_url,
                "garment_image": garment_image_url,
                "category": category,
                "mode": mode,
                "garment_photo_type": "auto",
                "segmentation_free": True,
            },
        )
        return handler.get()

    result = await loop.run_in_executor(None, _submit)

    # fal.ai çıktı formatı: {"images": [{"url": "..."}]}
    images = result.get("images") or []
    if images:
        first = images[0]
        url = first.get("url") if isinstance(first, dict) else str(first)
    else:
        image = result.get("image") or {}
        url = image.get("url") if isinstance(image, dict) else None

    if not url:
        raise RuntimeError(f"fal.ai FASHN VTON sonuç URL'i bulunamadı: {result}")
    return url


async def run_catvton(
    model_image_url: str,
    garment_image_url: str,
    category: str = "tops",
) -> str:
    """
    FAL.ai CatVTON ile sanal giydirme yapar.
    Sonuç görselinin URL'ini döndürür.
    """
    _set_fal_key()

    cloth_type = CATEGORY_MAP.get(category, "upper")

    loop = asyncio.get_running_loop()

    def _submit():
        handler = fal_client.submit(
            "fal-ai/cat-vton",
            arguments={
                "human_image_url":    model_image_url,
                "garment_image_url":  garment_image_url,
                "cloth_type":         cloth_type,
                "num_inference_steps": 30,
            },
        )
        return handler.get()

    result = await loop.run_in_executor(None, _submit)

    # Çıktı: {"image": {"url": "..."}, ...}
    image = result.get("image") or {}
    url = image.get("url") if isinstance(image, dict) else None
    if not url:
        raise RuntimeError(f"FAL.ai CatVTON sonuç URL'i bulunamadı: {result}")
    return url
