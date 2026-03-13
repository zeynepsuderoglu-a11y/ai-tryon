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
