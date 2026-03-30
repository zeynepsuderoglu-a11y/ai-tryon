"""
GhostMannequinService — Model fotoğrafından ghost mannequin üretir.
  1. rembg → arka plan kaldırılır, kişi+kıyafet izole edilir
  2. FaceMesh → yüz + saç + boyun maskesi
  3. Pose → kol ve bacak maskeleri (görünür deri alanları)
  4. Skin HSV → landmark'ların ötesindeki deri pikselleri
  5. FLUX Fill Pro → maskelenen alanları beyaz arka planla doldur
  6. Cloudinary → çıktı URL döndürülür
"""

from __future__ import annotations

import asyncio
import io
import logging
import os

import numpy as np
from PIL import Image, ImageFilter

from app.core.config import settings
from app.services.cloudinary_service import cloudinary_service

logger = logging.getLogger(__name__)

FLUX_FILL_MODEL = "black-forest-labs/flux-fill-pro"

GHOST_PROMPT = (
    "professional ghost mannequin product photography, "
    "garment only on pure white studio background, "
    "no person, no model, no skin, no hair, no face, no legs, "
    "hollow collar interior visible, floating garment, "
    "e-commerce product photo, clean white background"
)


# ── Mask oluşturma ────────────────────────────────────────────────────────────

def _build_person_mask(img_np: np.ndarray, w: int, h: int) -> np.ndarray:
    """
    Model fotoğrafındaki kişi alanlarını (yüz, saç, kol, bacak, deri) maskeler.
    Kıyafet alanları mümkün olduğunca korunur.
    Döndürür: uint8 (h, w) — 255 = inpaint edilecek, 0 = koru
    """
    import cv2
    import mediapipe as mp

    mask = np.zeros((h, w), dtype=np.uint8)

    # ── 1. FaceMesh → yüz + saç + boyun ──────────────────────────────────────
    mesh = mp.solutions.face_mesh.FaceMesh(
        static_image_mode=True, max_num_faces=1,
        refine_landmarks=True, min_detection_confidence=0.1,
    )
    mesh_res = mesh.process(img_np)
    mesh.close()

    if mesh_res.multi_face_landmarks:
        lms = mesh_res.multi_face_landmarks[0].landmark
        face_oval_ids = [
            10, 338, 297, 332, 284, 251, 389, 356, 454,
            323, 361, 288, 397, 365, 379, 378, 400, 377,
            152, 148, 176, 149, 150, 136, 172, 58, 132,
            93, 234, 127, 162, 21, 54, 103, 67, 109,
        ]
        pts = np.array(
            [[int(lms[i].x * w), int(lms[i].y * h)] for i in face_oval_ids],
            dtype=np.int32,
        )
        min_x, max_x = int(pts[:, 0].min()), int(pts[:, 0].max())
        min_y, max_y = int(pts[:, 1].min()), int(pts[:, 1].max())
        fh = max_y - min_y
        fw = max_x - min_x
        cx = (min_x + max_x) // 2

        # Yüz oval
        cv2.fillPoly(mask, [pts], 255)
        # Saç (yukarıya genişlet)
        cv2.rectangle(mask,
                      (max(0, min_x - int(fw * 0.4)), max(0, min_y - int(fh * 1.0))),
                      (min(w, max_x + int(fw * 0.4)), min_y + 10), 255, -1)
        # Boyun
        cv2.rectangle(mask,
                      (max(0, cx - int(fw * 0.4)), max_y - 5),
                      (min(w, cx + int(fw * 0.4)), min(h, max_y + int(fh * 0.8))), 255, -1)
        logger.info("[ghost] FaceMesh: yüz tespiti başarılı")
    else:
        logger.info("[ghost] FaceMesh: yüz bulunamadı")

    # ── 2. Pose → kol + bacak çizgileri ──────────────────────────────────────
    pose = mp.solutions.pose.Pose(
        static_image_mode=True, model_complexity=1,
        min_detection_confidence=0.3,
    )
    pose_res = pose.process(img_np)
    pose.close()

    if pose_res.pose_landmarks:
        pl = pose_res.pose_landmarks.landmark

        def pt(idx: int):
            lm = pl[idx]
            return (int(lm.x * w), int(lm.y * h)), lm.visibility

        # Kol kalınlığı: görselin ~%5'i
        arm_thick = max(20, int(w * 0.055))
        # Bacak kalınlığı: görselin ~%6'sı
        leg_thick = max(24, int(w * 0.065))

        # Sol kol: 11(omuz)→13(dirsek)→15(bilek)→17/19(parmaklar)
        arm_left = [(11, 13), (13, 15), (15, 17), (15, 19)]
        for a, b in arm_left:
            pa, va = pt(a); pb, vb = pt(b)
            if va > 0.3 and vb > 0.3:
                cv2.line(mask, pa, pb, 255, arm_thick)

        # Sağ kol: 12→14→16→18/20
        arm_right = [(12, 14), (14, 16), (16, 18), (16, 20)]
        for a, b in arm_right:
            pa, va = pt(a); pb, vb = pt(b)
            if va > 0.3 and vb > 0.3:
                cv2.line(mask, pa, pb, 255, arm_thick)

        # Sol bacak: 23(kalça)→25(diz)→27(ayak bileği)→29(topuk)
        leg_left = [(23, 25), (25, 27), (27, 29), (27, 31)]
        for a, b in leg_left:
            pa, va = pt(a); pb, vb = pt(b)
            if va > 0.3 and vb > 0.3:
                cv2.line(mask, pa, pb, 255, leg_thick)

        # Sağ bacak: 24→26→28→30
        leg_right = [(24, 26), (26, 28), (28, 30), (28, 32)]
        for a, b in leg_right:
            pa, va = pt(a); pb, vb = pt(b)
            if va > 0.3 and vb > 0.3:
                cv2.line(mask, pa, pb, 255, leg_thick)

        logger.info("[ghost] Pose: kol/bacak maskeleri çizildi")
    else:
        logger.info("[ghost] Pose: poz bulunamadı")

    # ── 3. Deri rengi tespiti (HSV) ───────────────────────────────────────────
    # Maske dışında kalan deri piksellerini de yakala
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

    # Deri tonu aralığı (geniş spektrum)
    lower1 = np.array([0,  20,  60], dtype=np.uint8)
    upper1 = np.array([25, 255, 255], dtype=np.uint8)
    lower2 = np.array([160, 20, 60], dtype=np.uint8)
    upper2 = np.array([180, 255, 255], dtype=np.uint8)
    skin_hsv = cv2.bitwise_or(
        cv2.inRange(img_hsv, lower1, upper1),
        cv2.inRange(img_hsv, lower2, upper2),
    )

    # Gürültüyü temizle: küçük parçaları kaldır
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (8, 8))
    skin_hsv = cv2.morphologyEx(skin_hsv, cv2.MORPH_OPEN, kernel_open)
    # Boşlukları kapat
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (20, 20))
    skin_hsv = cv2.morphologyEx(skin_hsv, cv2.MORPH_CLOSE, kernel_close)

    skin_pixels = int(np.sum(skin_hsv > 0))
    logger.info("[ghost] Deri tespiti: %d piksel", skin_pixels)

    # ── 4. Birleştir ──────────────────────────────────────────────────────────
    combined = cv2.bitwise_or(mask, skin_hsv)

    # Boşlukları doldur ve genişlet
    kernel_d = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (20, 20))
    combined = cv2.dilate(combined, kernel_d, iterations=1)
    kernel_c = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel_c)

    # Kenarları yumuşat
    final_mask = Image.fromarray(combined).filter(ImageFilter.GaussianBlur(radius=10))
    return np.array(final_mask)


# ── Ana sync fonksiyon ────────────────────────────────────────────────────────

def _ghost_mannequin_sync(image_bytes: bytes) -> bytes:
    """
    Herhangi bir ürün/model fotoğrafı → ghost mannequin JPEG bytes
    """
    import cv2
    import urllib.request
    from rembg import remove

    os.environ["REPLICATE_API_TOKEN"] = settings.REPLICATE_API_TOKEN
    import replicate as replicate_lib

    client = replicate_lib.Client(api_token=settings.REPLICATE_API_TOKEN)

    # ── Adım 1: Arka plan kaldır → kişi+kıyafet beyaz zeminde ───────────────
    logger.info("[ghost] rembg başlıyor...")
    nobg_bytes = remove(image_bytes)
    nobg_pil   = Image.open(io.BytesIO(nobg_bytes)).convert("RGBA")
    w, h       = nobg_pil.size

    white_bg = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    white_bg.paste(nobg_pil, mask=nobg_pil.split()[3])
    garment_on_white = white_bg.convert("RGB")
    logger.info("[ghost] rembg tamamlandı: %dx%d", w, h)

    img_np = np.array(garment_on_white)

    # ── Adım 2: Kişi maskesi oluştur ─────────────────────────────────────────
    person_mask = _build_person_mask(img_np, w, h)
    mask_pixels = int(np.sum(person_mask > 0))
    logger.info("[ghost] Kişi maskesi: %d piksel", mask_pixels)

    if mask_pixels < 500:
        # Kişi tespit edilemedi → sadece rembg çıktısını döndür
        logger.info("[ghost] Kişi bulunamadı — rembg çıktısı döndürülüyor")
        buf = io.BytesIO()
        garment_on_white.save(buf, "JPEG", quality=97, subsampling=0)
        return buf.getvalue()

    # ── Adım 3: Cloudinary'ye yükle ──────────────────────────────────────────
    img_buf = io.BytesIO()
    garment_on_white.save(img_buf, "JPEG", quality=97)

    mask_pil = Image.fromarray(person_mask)
    mask_buf = io.BytesIO()
    mask_pil.save(mask_buf, "PNG")

    img_cld  = cloudinary_service.upload_file(img_buf.getvalue(),  folder="tryon/ghost/tmp")
    mask_cld = cloudinary_service.upload_file(mask_buf.getvalue(), folder="tryon/ghost/tmp")
    logger.info("[ghost] Cloudinary tmp yüklendi")

    # ── Adım 4: FLUX Fill Pro ─────────────────────────────────────────────────
    output = client.run(
        FLUX_FILL_MODEL,
        input={
            "image":            img_cld["secure_url"],
            "mask":             mask_cld["secure_url"],
            "prompt":           GHOST_PROMPT,
            "steps":            30,
            "guidance":         35,
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
        Ürün/model fotoğrafı URL → ghost mannequin Cloudinary URL
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
