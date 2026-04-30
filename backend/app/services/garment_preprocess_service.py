"""
Garment image preprocessing: iç yaka etiketlerini (care label, brand tag) tespit edip maskeler.
FASHN'a temizlenmiş görsel gönderilir — etiketin çıktıda görünmesi önlenir.
"""
import io
import json
import base64
import hashlib
import logging
import asyncio
import statistics

import httpx
from PIL import Image, ImageDraw, ImageFilter

import anthropic
from app.core.config import settings
from app.services.cloudinary_service import cloudinary_service

logger = logging.getLogger(__name__)

# Aynı URL için tekrar işlem yapmamak adına bellek içi cache
_label_cache: dict[str, str] = {}


def _sample_surrounding_color(img: Image.Image, x1: int, y1: int, x2: int, y2: int) -> tuple:
    """
    Etiket bölgesinin dışındaki çevre piksellerden ortanca rengi örnekler.
    Tek piksel yerine ortanca kullanmak daha sağlam bir fill rengi verir.
    """
    w, h = img.size
    samples = []
    pad = max(12, int(min(w, h) * 0.015))

    # Etiketin altından örnek al (kumaş)
    for dx in range(x1, x2, max(1, (x2 - x1) // 5)):
        sy = min(h - 1, y2 + pad)
        samples.append(img.getpixel((max(0, min(w-1, dx)), sy)))

    # Etiketin sol yanından örnek al
    sx = max(0, x1 - pad)
    for dy in range(y1, y2, max(1, (y2 - y1) // 3)):
        samples.append(img.getpixel((sx, max(0, min(h-1, dy)))))

    # Etiketin sağ yanından örnek al
    sx = min(w - 1, x2 + pad)
    for dy in range(y1, y2, max(1, (y2 - y1) // 3)):
        samples.append(img.getpixel((sx, max(0, min(h-1, dy)))))

    if not samples:
        return (128, 128, 128)

    r = int(statistics.median(s[0] for s in samples))
    g = int(statistics.median(s[1] for s in samples))
    b = int(statistics.median(s[2] for s in samples))
    return (r, g, b)


async def clean_garment_image(image_url: str) -> str:
    """
    Ürün fotoğrafındaki iç yaka etiketini tespit edip kumaş rengiyle maskeler.
    - Etiket bulunamazsa → orijinal URL döner
    - Etiket bulunursa → temizlenmiş Cloudinary URL döner
    - Hata oluşursa → orijinal URL döner (üretimi engellemez)
    """
    cache_key = hashlib.md5(image_url.encode()).hexdigest()
    if cache_key in _label_cache:
        logger.info("[preprocess] Cache hit: %s", cache_key[:8])
        return _label_cache[cache_key]

    try:
        # 1. Görseli indir
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(image_url)
            resp.raise_for_status()
            img_bytes = resp.content

        # Medya tipini belirle
        content_type = resp.headers.get("content-type", "image/jpeg").lower()
        if "png" in content_type or image_url.lower().endswith(".png"):
            media_type = "image/png"
        elif "webp" in content_type:
            media_type = "image/webp"
        else:
            media_type = "image/jpeg"

        img_b64 = base64.standard_b64encode(img_bytes).decode()

        # 2. Claude Sonnet ile etiket tespiti (hassas koordinat için)
        anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = await anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": img_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Examine this garment image carefully. Identify the ENTIRE inner collar/neckline area — "
                            "this includes: inner labels/tags (brand, care, size), AND any visible inner lining fabric, "
                            "inner neck band, or any inner construction visible at the back-neck or inside the collar fold.\n\n"
                            "For open-front garments (blazers, coats, jackets) with a V-shaped neckline opening: "
                            "the bbox must cover the FULL visible inner area between the lapels at the top — "
                            "from the tip of the V-opening up to the collar fold, spanning the full width of "
                            "any visible inner fabric/lining/label between the two lapels.\n\n"
                            "Image coordinates: (0,0) = top-left corner, (100,100) = bottom-right corner.\n\n"
                            "If you see any inner collar area (label OR inner lining/construction):\n"
                            "- Return a bbox covering the ENTIRE visible inner collar zone\n"
                            "- Include all visible inner lining between the lapels, not just the label\n"
                            "- Be generous: include 4-5% extra margin on all sides\n"
                            "- Respond ONLY with: {\"has_label\": true, \"bbox\": [x1, y1, x2, y2]}\n\n"
                            "If NO inner collar area is visible at all:\n"
                            "- Respond ONLY with: {\"has_label\": false}\n\n"
                            "JSON only, no explanation."
                        ),
                    },
                ],
            }],
        )

        raw = message.content[0].text.strip()
        logger.info("[preprocess] Claude yanıtı: %s", raw[:120])

        try:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            data = json.loads(raw[start:end])
        except Exception:
            logger.warning("[preprocess] JSON parse hatası: %s", raw[:100])
            _label_cache[cache_key] = image_url
            return image_url

        if not data.get("has_label"):
            logger.info("[preprocess] Etiket bulunamadı, orijinal URL kullanılıyor")
            _label_cache[cache_key] = image_url
            return image_url

        bbox = data.get("bbox", [])
        if len(bbox) != 4:
            logger.warning("[preprocess] Geçersiz bbox: %s", bbox)
            _label_cache[cache_key] = image_url
            return image_url

        x1_pct, y1_pct, x2_pct, y2_pct = [float(v) for v in bbox]
        logger.info("[preprocess] Etiket tespit edildi: bbox=[%.1f, %.1f, %.1f, %.1f]",
                    x1_pct, y1_pct, x2_pct, y2_pct)

        # 3. PIL ile etiketi maskele
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        w, h = img.size

        # Yüzde → piksel (geniş padding: her yönde %6 ekstra — iç astar alanı için)
        extra_pct = 6.0
        x1 = max(0, int((x1_pct - extra_pct) / 100 * w))
        y1 = max(0, int((y1_pct - extra_pct) / 100 * h))
        x2 = min(w, int((x2_pct + extra_pct) / 100 * w))
        y2 = min(h, int((y2_pct + extra_pct) / 100 * h))

        logger.info("[preprocess] Maskeleme alanı (piksel): [%d, %d, %d, %d] — görsel %dx%d",
                    x1, y1, x2, y2, w, h)

        # Çevre piksellerden ortanca rengi örnekle
        fill_color = _sample_surrounding_color(img, x1, y1, x2, y2)
        logger.info("[preprocess] Fill rengi: %s", fill_color)

        # Etiket bölgesini doldur
        draw = ImageDraw.Draw(img)
        draw.rectangle([x1, y1, x2, y2], fill=fill_color)

        # Kenarları blend et (3 kez blur uygula — daha yumuşak geçiş)
        blur_pad = 6
        region_box = (
            max(0, x1 - blur_pad), max(0, y1 - blur_pad),
            min(w, x2 + blur_pad), min(h, y2 + blur_pad)
        )
        region = img.crop(region_box)
        region = region.filter(ImageFilter.GaussianBlur(radius=3))
        img.paste(region, (region_box[0], region_box[1]))

        # 4. Cloudinary'ye yükle
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=95)
        buf.seek(0)

        loop = asyncio.get_event_loop()
        upload_result = await loop.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(
                buf.read(),
                folder="tryon/garments_clean",
            ),
        )
        clean_url = upload_result["secure_url"]
        logger.info("[preprocess] Temizlenmiş görsel: %s", clean_url)

        _label_cache[cache_key] = clean_url
        return clean_url

    except Exception as exc:
        logger.warning("[preprocess] Preprocessing hatası, orijinal kullanılıyor: %s", exc)
        _label_cache[cache_key] = image_url
        return image_url


# FASHN çıktısı için cache
_output_cache: dict[str, str] = {}


async def split_composite_if_needed(image_url: str) -> str:
    """
    FASHN bazen 2 görseli yan yana birleştirmiş composite bir URL döndürür.
    FASHN'dan 3:4 portrait istiyoruz (w/h=0.75). Eğer dönen görsel 3:4'ten belirgin
    geniş ise (w > h * 0.85) composite kabul edip sol yarıyı crop eder.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(image_url)
            resp.raise_for_status()
            img_bytes = resp.content

        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        w, h = img.size
        logger.info("[composite] Görsel boyutu: %dx%d (w/h=%.2f)", w, h, w / h if h else 0)

        # Gerçek composite (yan yana 2 görsel) ≈ 2:1 oranındadır.
        # 1.6'dan geniş değilse (kare, portrait, landscape) doğrudan döndür.
        if w <= h * 1.6:
            return image_url  # normal görsel, composite değil

        logger.info("[composite] Geniş çıktı tespit edildi (%dx%d, w/h=%.2f) — sol yarı crop ediliyor", w, h, w / h)
        half_w = w // 2
        img = img.crop((0, 0, half_w, h))

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=95)
        buf.seek(0)

        loop = asyncio.get_event_loop()
        upload_result = await loop.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(buf.read(), folder="tryon/outputs"),
        )
        cropped_url = upload_result["secure_url"]
        logger.info("[composite] Crop tamamlandı: %s", cropped_url)
        return cropped_url

    except Exception as exc:
        logger.warning("[composite] Crop hatası, orijinal kullanılıyor: %s", exc)
        return image_url


async def clean_output_image(output_url: str) -> str:
    """
    FASHN çıktı görselindeki iç yaka etiketini tespit edip temizler.
    - Etiket bulunamazsa → orijinal URL döner
    - Etiket bulunursa → temizlenmiş Cloudinary URL döner
    - Hata oluşursa → orijinal URL döner
    """
    cache_key = hashlib.md5(output_url.encode()).hexdigest()
    if cache_key in _output_cache:
        return _output_cache[cache_key]

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(output_url)
            resp.raise_for_status()
            img_bytes = resp.content

        content_type = resp.headers.get("content-type", "image/jpeg").lower()
        if "png" in content_type or output_url.lower().endswith(".png"):
            media_type = "image/png"
        elif "webp" in content_type:
            media_type = "image/webp"
        else:
            media_type = "image/jpeg"

        img_b64 = base64.standard_b64encode(img_bytes).decode()

        anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = await anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": img_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "This is a fashion try-on image of a model wearing a garment. "
                            "Look carefully for a visible INNER LABEL (brand tag, care label, size label) "
                            "inside the collar or neckline area of the garment — a small rectangle with printed text "
                            "visible in the V-opening between the lapels or at the inner back-neck.\n\n"
                            "Image coordinates: (0,0) = top-left corner, (100,100) = bottom-right corner.\n\n"
                            "If you see such a label on the GARMENT (not on the model's skin):\n"
                            "- Give the COMPLETE bounding box covering the label\n"
                            "- Include 2-3% margin on all sides\n"
                            "- Respond ONLY with: {\"has_label\": true, \"bbox\": [x1, y1, x2, y2]}\n\n"
                            "If no label is visible:\n"
                            "- Respond ONLY with: {\"has_label\": false}\n\n"
                            "JSON only, no explanation."
                        ),
                    },
                ],
            }],
        )

        raw = message.content[0].text.strip()
        logger.info("[output-clean] Claude yanıtı: %s", raw[:120])

        try:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            data = json.loads(raw[start:end])
        except Exception:
            _output_cache[cache_key] = output_url
            return output_url

        if not data.get("has_label"):
            logger.info("[output-clean] Çıktıda etiket bulunamadı")
            _output_cache[cache_key] = output_url
            return output_url

        bbox = data.get("bbox", [])
        if len(bbox) != 4:
            _output_cache[cache_key] = output_url
            return output_url

        x1_pct, y1_pct, x2_pct, y2_pct = [float(v) for v in bbox]
        logger.info("[output-clean] Etiket tespit edildi: bbox=[%.1f, %.1f, %.1f, %.1f]",
                    x1_pct, y1_pct, x2_pct, y2_pct)

        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        w, h = img.size

        extra_pct = 3.0
        x1 = max(0, int((x1_pct - extra_pct) / 100 * w))
        y1 = max(0, int((y1_pct - extra_pct) / 100 * h))
        x2 = min(w, int((x2_pct + extra_pct) / 100 * w))
        y2 = min(h, int((y2_pct + extra_pct) / 100 * h))

        logger.info("[output-clean] Maskeleme (piksel): [%d, %d, %d, %d] — %dx%d", x1, y1, x2, y2, w, h)

        fill_color = _sample_surrounding_color(img, x1, y1, x2, y2)
        logger.info("[output-clean] Fill rengi: %s", fill_color)

        draw = ImageDraw.Draw(img)
        draw.rectangle([x1, y1, x2, y2], fill=fill_color)

        blur_pad = 4
        region_box = (
            max(0, x1 - blur_pad), max(0, y1 - blur_pad),
            min(w, x2 + blur_pad), min(h, y2 + blur_pad)
        )
        region = img.crop(region_box)
        region = region.filter(ImageFilter.GaussianBlur(radius=2))
        img.paste(region, (region_box[0], region_box[1]))

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=95)
        buf.seek(0)

        loop = asyncio.get_event_loop()
        upload_result = await loop.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(
                buf.read(),
                folder="tryon/outputs_clean",
            ),
        )
        clean_url = upload_result["secure_url"]
        logger.info("[output-clean] Temizlenmiş çıktı: %s", clean_url)

        _output_cache[cache_key] = clean_url
        return clean_url

    except Exception as exc:
        logger.warning("[output-clean] Output cleaning hatası, orijinal kullanılıyor: %s", exc)
        _output_cache[cache_key] = output_url
        return output_url
