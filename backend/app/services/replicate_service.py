import asyncio
import io
import os
import httpx
import replicate
from PIL import Image
from app.core.config import settings

# Replicate kategori eşlemesi
CATEGORY_MAP = {
    "tops": "upper_body",
    "bottoms": "lower_body",
    "one-pieces": "dresses",
}


def _get_client() -> replicate.Client:
    return replicate.Client(api_token=settings.REPLICATE_API_TOKEN)


def _upload_bytes_to_cloudinary(data: bytes, folder: str) -> str:
    """Bytes verisini Cloudinary'e yükler, public URL döndürür."""
    import cloudinary
    import cloudinary.uploader
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    result = cloudinary.uploader.upload(data, folder=folder, resource_type="image")
    return result["secure_url"]


def _rembg_and_white_bg(garment_url: str) -> str:
    """
    Kıyafet görselinin arka planını yerel rembg kütüphanesi ile kaldırır,
    beyaz arka plana yapıştırır ve Cloudinary'e yükler (public URL).
    Hata durumunda orijinal URL'i döndürür.
    """
    try:
        from rembg import remove as rembg_remove

        # 1) Görseli indir
        with httpx.Client(timeout=30.0) as http:
            resp = http.get(garment_url)
            resp.raise_for_status()
            raw = resp.content

        # 2) Arka planı kaldır
        removed = rembg_remove(raw)

        # 3) Beyaz arka plana yapıştır
        img = Image.open(io.BytesIO(removed)).convert("RGBA")
        white = Image.new("RGB", img.size, (255, 255, 255))
        white.paste(img, mask=img.split()[3])

        # 4) JPEG encode → Cloudinary'e yükle (herkese açık URL)
        buf = io.BytesIO()
        white.save(buf, format="JPEG", quality=95)
        return _upload_bytes_to_cloudinary(buf.getvalue(), "tryon/garments")

    except Exception:
        return garment_url


async def prepare_garment_async(garment_url: str) -> str:
    """Async wrapper — FastAPI background task için."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _rembg_and_white_bg, garment_url)


def prepare_garment_sync(garment_url: str) -> str:
    """Sync wrapper — Celery worker için."""
    return _rembg_and_white_bg(garment_url)


def ensure_public_url_sync(url: str) -> str:
    """
    Verilen URL localhost ise görseli indirip Cloudinary'e yükler.
    Celery (sync) worker için.
    """
    if "localhost" not in url and "127.0.0.1" not in url:
        return url
    with httpx.Client(timeout=30.0) as client:
        resp = client.get(url)
        resp.raise_for_status()
        result = _upload_bytes_to_cloudinary(resp.content, "tryon/models")
        return result


async def run_tryon_async(
    model_image_url: str,
    garment_image_url: str,
    category: str = "tops",
    garment_description: str = "A clothing item",
    denoise_steps: int = 40,
    seed: int = 42,
) -> list[str]:
    """
    Replicate IDM-VTON ile async try-on çalıştırır.
    Döndürür: çıktı görsel URL listesi
    """
    replicate_category = CATEGORY_MAP.get(category, "upper_body")
    client = _get_client()

    output = await client.async_run(
        settings.REPLICATE_TRYON_MODEL,
        input={
            "human_img": model_image_url,
            "garm_img": garment_image_url,
            "garment_des": garment_description,
            "category": replicate_category,
            "crop": False,
            "steps": denoise_steps,
            "seed": seed,
        },
    )

    # output: FileOutput nesnesi veya liste — .url attribute'undan URL al
    urls = []
    if output:
        items = output if isinstance(output, (list, tuple)) else [output]
        for item in items:
            if hasattr(item, "url"):
                urls.append(str(item.url))
            elif isinstance(item, str) and item.startswith("http"):
                urls.append(item)
    return urls


def run_tryon_sync(
    model_image_url: str,
    garment_image_url: str,
    category: str = "tops",
    garment_description: str = "A clothing item",
    denoise_steps: int = 40,
    seed: int = 42,
) -> list[str]:
    """
    Replicate IDM-VTON ile sync try-on çalıştırır (Celery worker için).
    Döndürür: çıktı görsel URL listesi
    """
    replicate_category = CATEGORY_MAP.get(category, "upper_body")

    os.environ["REPLICATE_API_TOKEN"] = settings.REPLICATE_API_TOKEN

    output = replicate.run(
        settings.REPLICATE_TRYON_MODEL,
        input={
            "human_img": model_image_url,
            "garm_img": garment_image_url,
            "garment_des": garment_description,
            "category": replicate_category,
            "crop": False,
            "steps": denoise_steps,
            "seed": seed,
        },
    )

    urls = []
    if output:
        items = output if isinstance(output, (list, tuple)) else [output]
        for item in items:
            if hasattr(item, "url"):
                urls.append(str(item.url))
            elif isinstance(item, str) and item.startswith("http"):
                urls.append(item)
    return urls
