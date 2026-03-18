"""
EyewearService — imatryon/eyewear_engine.py'nin FastAPI adaptasyonu.
  1. rembg → gözlük arka planı kaldırılır
  2. MediaPipe FaceMesh → göz landmark'ları
  3. PIL + NumPy → gözlük yüze yapıştırılır (kenar yumuşatma + gölge)
  4. Qwen (Replicate) → gerçekçilik
  5. Cloudinary → çıktı URL döndürülür
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

GLASSES_SCALE = 1.4
OUTPUT_LONG_EDGE = 3840
QWEN_MODEL = "qwen/qwen-image-edit-plus"


# ── Sync helpers (run_in_executor'da çalışır) ────────────────────────────────

def _prepare_glasses(glasses_path: str) -> str:
    """rembg ile arka planı kaldır. Başarısız olursa orijinal yolu döndür."""
    try:
        from rembg import remove
        with open(glasses_path, "rb") as f:
            raw = f.read()
        cleaned = remove(raw)
        tmp = tempfile.NamedTemporaryFile(suffix="_glasses_nobg.png", delete=False)
        tmp.write(cleaned)
        tmp.close()
        return tmp.name
    except Exception as e:
        logger.warning("[eyewear] rembg başarısız: %s — orijinal kullanılıyor", e)
        return glasses_path


def _precomposite(mannequin_path: str, glasses_path: str) -> str:
    """
    MediaPipe ile göz konumunu tespit eder,
    gözlüğü matematiksel olarak doğru boyut + açıda yüze yapıştırır.
    """
    import mediapipe as mp

    mann_pil = Image.open(mannequin_path).convert("RGBA")
    w, h = mann_pil.size
    mann_np = np.array(mann_pil.convert("RGB"))

    mesh = mp.solutions.face_mesh.FaceMesh(
        static_image_mode=True, max_num_faces=1,
        refine_landmarks=True, min_detection_confidence=0.1,
    )
    res = mesh.process(mann_np)

    if res.multi_face_landmarks:
        lms = res.multi_face_landmarks[0].landmark
        elo  = np.array([lms[33].x  * w, lms[33].y  * h])
        ero  = np.array([lms[263].x * w, lms[263].y * h])
        nose = np.array([lms[6].x   * w, lms[6].y   * h])
        eye_span = float(np.linalg.norm(ero - elo))
        eye_mid  = (elo + ero) / 2.0
        cx = float(eye_mid[0])
        cy = float(eye_mid[1] * 0.8 + nose[1] * 0.2)
        angle = float(np.degrees(np.arctan2(ero[1] - elo[1], ero[0] - elo[0])))
    else:
        cx, cy   = w / 2.0, h * 0.33
        eye_span = w * 0.28
        angle    = 0.0

    glasses_pil = Image.open(glasses_path).convert("RGBA")
    gw, gh = glasses_pil.size

    alpha_arr = np.array(glasses_pil.split()[3])
    rows = np.any(alpha_arr > 10, axis=1)
    cols = np.any(alpha_arr > 10, axis=0)
    if rows.any() and cols.any():
        rmin, rmax = np.where(rows)[0][[0, -1]]
        cmin, cmax = np.where(cols)[0][[0, -1]]
        obj_cx = (cmin + cmax) / 2.0
        obj_cy = (rmin + rmax) / 2.0
        obj_w  = cmax - cmin
    else:
        obj_cx, obj_cy = gw / 2.0, gh / 2.0
        obj_w = gw

    target_w = max(int(eye_span * GLASSES_SCALE), 50)
    scale = target_w / max(obj_w, 1)
    target_h = max(int(gh * scale), 10)
    glasses_scaled = glasses_pil.resize(
        (max(int(gw * scale), 1), target_h), Image.LANCZOS,
    )

    obj_cx_scaled = obj_cx * scale
    obj_cy_scaled = obj_cy * scale

    if abs(angle) > 0.5:
        glasses_scaled = glasses_scaled.rotate(-angle, expand=True, resample=Image.BICUBIC)
        gw2, gh2 = glasses_scaled.size
        obj_cx_scaled = gw2 / 2.0
        obj_cy_scaled = gh2 / 2.0

    gw2, gh2 = glasses_scaled.size
    px = int(cx - obj_cx_scaled)
    py = int(cy - obj_cy_scaled)

    composite = mann_pil.copy()

    r, g, b, a = glasses_scaled.split()
    a_arr = np.array(a, dtype=np.float32)
    r_arr = np.array(r, dtype=np.float32)
    g_arr = np.array(g, dtype=np.float32)
    b_arr = np.array(b, dtype=np.float32)

    brightness = (r_arr + g_arr + b_arr) / 3.0
    lens_mask = (brightness >= 60) & (a_arr > 128)
    a_arr[lens_mask] = a_arr[lens_mask] * 0.80
    a_soft = Image.fromarray(a_arr.astype(np.uint8), mode="L")
    a_soft = a_soft.filter(ImageFilter.GaussianBlur(radius=2))
    glasses_soft = Image.merge("RGBA", (r, g, b, a_soft))

    shadow_offset = max(4, int(gw2 * 0.015))
    shadow = Image.new("RGBA", composite.size, (0, 0, 0, 0))
    shadow_mask = Image.new("L", glasses_scaled.size, 0)
    shadow_mask.paste(a_soft, (0, 0))
    shadow_mask_blurred = shadow_mask.filter(ImageFilter.GaussianBlur(radius=shadow_offset * 2))
    shadow_layer = Image.new("RGBA", glasses_scaled.size, (0, 0, 0, 90))
    shadow_layer.putalpha(shadow_mask_blurred)
    shadow.paste(shadow_layer, (px + shadow_offset, py + shadow_offset), shadow_layer)
    composite = Image.alpha_composite(composite, shadow)

    composite.paste(glasses_soft, (px, py), glasses_soft)

    tmp = tempfile.NamedTemporaryFile(suffix="_precomp.png", delete=False)
    composite.convert("RGB").save(tmp.name, "PNG")
    tmp.close()
    return tmp.name


def _run_qwen(composited_path: str, glasses_path: str, seed: int, replicate_client) -> Image.Image:
    prompt = (
        "Image 1 is a try-on composite: a person wearing eyeglasses at the correct position and size. "
        "Image 2 is the reference eyeglasses product. "
        "Make the glasses in image 1 look exactly like the glasses in image 2 — "
        "same frame shape, color, material, and lens tint. "
        "The glasses must sit naturally on both eyes, following the face angle. "
        "CRITICAL — preserve everything exactly as shown in image 1: "
        "the person's face, skin tone, facial features, makeup, hair, clothing, pose, "
        "hand position, head angle, background, and lighting must remain 100% pixel-identical. "
        "Do not zoom in, do not crop, do not change the image size or composition in any way — "
        "output must be the exact same framing as image 1. "
        "Only improve the glasses appearance and blending at the frame edges. "
        "Output: photorealistic professional photo, identical composition to image 1."
    )
    with open(composited_path, "rb") as comp, open(glasses_path, "rb") as glass:
        output = replicate_client.run(
            QWEN_MODEL,
            input={
                "image":          [comp, glass],
                "prompt":         prompt,
                "aspect_ratio":   "match_input_image",
                "output_format":  "png",
                "output_quality": 100,
                "go_fast":        False,
                "seed":           seed,
            },
        )
    return _output_to_pil(output)


def _output_to_pil(output) -> Image.Image:
    import urllib.request
    if isinstance(output, (list, tuple)):
        output = output[0]
    if hasattr(output, "url"):
        output = str(output.url)
    if isinstance(output, str) and output.startswith("http"):
        with urllib.request.urlopen(output) as resp:
            raw = resp.read()
        return Image.open(io.BytesIO(raw)).convert("RGB")
    if hasattr(output, "read"):
        raw = output.read()
        return Image.open(io.BytesIO(raw)).convert("RGB")
    raise RuntimeError(f"Tanımlanamayan Replicate çıktısı: {type(output)}")


def _upscale_4k(pil: Image.Image) -> Image.Image:
    rw, rh = pil.size
    le = max(rw, rh)
    if le < OUTPUT_LONG_EDGE:
        sc = OUTPUT_LONG_EDGE / le
        pil = pil.resize((int(rw * sc), int(rh * sc)), Image.LANCZOS)
    return pil


def _upscale_before_qwen(image_path: str) -> str:
    """
    Qwen'e göndermeden önce mannequin'i 4K'ya yükselt.
    Böylece Qwen aspect_ratio='match_input_image' ile 4K çıktı üretir.
    """
    pil = Image.open(image_path).convert("RGB")
    rw, rh = pil.size
    le = max(rw, rh)
    if le < OUTPUT_LONG_EDGE:
        sc = OUTPUT_LONG_EDGE / le
        pil = pil.resize((int(rw * sc), int(rh * sc)), Image.LANCZOS)
        tmp = tempfile.NamedTemporaryFile(suffix="_4k.jpg", delete=False)
        pil.save(tmp.name, "JPEG", quality=97)
        tmp.close()
        logger.info("[eyewear] Mannequin %dx%d → %dx%d (4K pre-upscale)", rw, rh, int(rw * sc), int(rh * sc))
        return tmp.name
    return image_path


def _try_on_sync(mannequin_bytes: bytes, glasses_bytes: bytes) -> bytes:
    """
    Blocking implementation — run_in_executor içinde çağrılır.
    mannequin_bytes + glasses_bytes → sonuç JPEG bytes
    """
    os.environ["REPLICATE_API_TOKEN"] = settings.REPLICATE_API_TOKEN
    import replicate as replicate_lib

    client = replicate_lib.Client(api_token=settings.REPLICATE_API_TOKEN)

    tmp_files: list[str] = []
    try:
        tmp_mann = tempfile.NamedTemporaryFile(suffix="_mannequin.jpg", delete=False)
        tmp_mann.write(mannequin_bytes)
        tmp_mann.close()
        tmp_files.append(tmp_mann.name)

        tmp_glass = tempfile.NamedTemporaryFile(suffix="_glasses.jpg", delete=False)
        tmp_glass.write(glasses_bytes)
        tmp_glass.close()
        tmp_files.append(tmp_glass.name)

        glasses_png = _prepare_glasses(tmp_glass.name)
        if glasses_png != tmp_glass.name:
            tmp_files.append(glasses_png)

        # Qwen'e göndermeden önce mannequin'i 4K'ya yükselt
        mann_4k = _upscale_before_qwen(tmp_mann.name)
        if mann_4k != tmp_mann.name:
            tmp_files.append(mann_4k)

        composite_path = _precomposite(mann_4k, glasses_png)
        tmp_files.append(composite_path)

        try:
            result_pil = _run_qwen(composite_path, glasses_png, 42, client)
            logger.info("[eyewear] Qwen gerçekçilik tamamlandı, boyut: %dx%d", *result_pil.size)
        except Exception as e:
            logger.warning("[eyewear] Qwen başarısız: %s — composite kullanılıyor", e)
            result_pil = Image.open(composite_path).convert("RGB")
            result_pil = _upscale_4k(result_pil)

        buf = io.BytesIO()
        result_pil.save(buf, format="JPEG", quality=97, subsampling=0)
        size_kb = len(buf.getvalue()) // 1024
        logger.info("[eyewear] Çıktı boyutu: %d KB", size_kb)
        return buf.getvalue()

    finally:
        for path in tmp_files:
            try:
                os.unlink(path)
            except Exception:
                pass


# ── Async service ─────────────────────────────────────────────────────────────

class EyewearService:

    async def try_on(self, mannequin_bytes: bytes, glasses_bytes: bytes) -> str:
        """
        mannequin_bytes + glasses_bytes → Cloudinary URL (str)
        Tüm blocking işlemler executor'da çalışır.
        """
        loop = asyncio.get_running_loop()

        result_bytes = await loop.run_in_executor(
            None, _try_on_sync, mannequin_bytes, glasses_bytes
        )

        url_result = await loop.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(result_bytes, folder="tryon/eyewear_outputs"),
        )
        return url_result["secure_url"]


eyewear_service = EyewearService()
