"""
ModelPresetService — Manken yüzü + arka plan → FASHN referans fotoğrafı
Türkiye e-ticaret pazarı için etkileyici poz ve sahne kombinasyonları üretir.
Üretilen görseller model_assets'e has_background=True ile kaydedilir.
"""
from __future__ import annotations

import asyncio
import io
import logging

import httpx

from app.core.config import settings
from app.services.cloudinary_service import cloudinary_service

logger = logging.getLogger(__name__)


# ── Poz tanımları — Türkiye pazarı ──────────────────────────────────────────
PRESET_POSES: dict[str, dict] = {
    "confident_hip": {
        "label": "Güvenli Duruş",
        "desc": (
            "confident standing pose, weight shifted to left leg, right hand lightly on hip, "
            "left arm relaxed at side, body at slight 3/4 angle toward camera, "
            "chin slightly lifted, natural warm expression — "
            "classic Turkish fashion editorial, approachable and stylish"
        ),
    },
    "editorial_arms": {
        "label": "Editöryal Duruş",
        "desc": (
            "elegant editorial standing pose, feet shoulder-width apart, "
            "both arms relaxed slightly away from body, one elbow slightly bent, "
            "face turned 3/4 toward camera, poised sophisticated commercial pose — "
            "high-end Turkish women's fashion editorial"
        ),
    },
    "natural_walk": {
        "label": "Doğal Yürüyüş",
        "desc": (
            "natural confident mid-stride walking pose toward camera, "
            "left foot forward, natural arm movement, looking directly at camera "
            "with relaxed confident expression, dynamic yet elegant — "
            "Turkish fashion week editorial energy"
        ),
    },
    "relaxed_cross": {
        "label": "Rahat Çapraz",
        "desc": (
            "relaxed fashion pose, ankles lightly crossed, both hands loosely "
            "clasped in front at hip level, slight body tilt, "
            "warm approachable expression looking directly at camera — "
            "casual elegant Turkish e-commerce editorial"
        ),
    },
}

PRESET_POSES_LABELS = {k: v["label"] for k, v in PRESET_POSES.items()}


def _build_preset_prompt(background_desc: str, pose_key: str, crop_type: str = "full_body") -> str:
    pose = PRESET_POSES.get(pose_key, PRESET_POSES["confident_hip"])
    pose_desc = pose["desc"]

    crop_line = (
        "FRAMING: Full body shot — head to feet fully visible, model centered. "
        "Both feet completely in frame, no cropping at any edge."
        if crop_type == "full_body"
        else "FRAMING: Three-quarter shot — head to just below the knee. Lower legs and feet NOT visible."
    )

    return f"""IMAGE 1: Fashion model face reference.

Generate a professional Turkish e-commerce fashion model photo.

FACE RULE — CRITICAL: Reproduce the face from IMAGE 1 exactly. Same skin tone, facial features, eye shape, nose, lips, and facial structure. Do NOT alter, idealize, or replace the face.

POSE: {pose_desc}

OUTFIT (neutral placeholder — will be replaced by the product garment):
- Simple plain white fitted crew-neck t-shirt or light cream fitted blouse — no patterns, no logos, no prints
- Slim straight dark charcoal or navy trousers — clean, minimal, no distinctive details
- Simple white or nude low-heel shoes or minimal ballet flats
- No accessories, no jewelry, no belt
- The outfit must be completely forgettable and neutral — it is NOT the subject

{crop_line}

BACKGROUND: {background_desc}

LIGHTING & STYLE:
- Soft, even, flattering studio or natural light — no harsh shadows, no overexposed areas
- Commercial Turkish fashion photography — sophisticated, modern, welcoming
- Photorealistic, high detail, sharp focus on face and overall figure
- The image must feel like a real professional fashion photo shoot
- Türkiye pazarı estetiği: zarif, sıcak, güvenilir, satışa odaklı

OUTPUT: One photorealistic professional fashion photo. No text, no watermarks, no logos."""


def _run_sync(face_bytes: bytes, face_mime: str, prompt: str) -> bytes:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    contents = [
        types.Part.from_bytes(data=face_bytes, mime_type=face_mime),
        prompt,
    ]

    logger.info("[model-preset] Gemini isteği gönderiliyor")
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=contents,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
            temperature=0.5,
            safety_settings=[
                types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_ONLY_HIGH"),
                types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_ONLY_HIGH"),
                types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_ONLY_HIGH"),
                types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_ONLY_HIGH"),
            ],
        ),
    )

    if not response.candidates:
        raise RuntimeError("Görsel üretilemedi")

    candidate = response.candidates[0]
    finish_reason = getattr(candidate, "finish_reason", "UNKNOWN")
    logger.info("[model-preset] finish_reason=%s", finish_reason)

    if candidate.content is None:
        raise RuntimeError("Görsel içeriği boş")

    for part in candidate.content.parts:
        if part.inline_data:
            return part.inline_data.data

    raise RuntimeError("Görsel verisi bulunamadı")


class ModelPresetService:
    async def generate(
        self,
        face_url: str,
        background_desc: str,
        pose_key: str = "confident_hip",
        crop_type: str = "full_body",
    ) -> str:
        """Manken yüzü + arka plan açıklaması → Cloudinary URL döndürür."""

        # Yüz fotoğrafını indir
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(face_url)
            resp.raise_for_status()
            face_bytes = resp.content
            ct = resp.headers.get("content-type", "image/jpeg")
            face_mime = ct.split(";")[0].strip() or "image/jpeg"
        logger.info("[model-preset] face=%s (%dKB)", face_url, len(face_bytes) // 1024)

        prompt = _build_preset_prompt(
            background_desc=background_desc,
            pose_key=pose_key,
            crop_type=crop_type,
        )
        logger.info("[model-preset] pose=%s | crop=%s", pose_key, crop_type)

        loop = asyncio.get_event_loop()

        # 3 deneme
        last_err: Exception | None = None
        for attempt in range(1, 4):
            try:
                img_bytes = await asyncio.wait_for(
                    loop.run_in_executor(None, _run_sync, face_bytes, face_mime, prompt),
                    timeout=180,
                )
                break
            except Exception as e:
                last_err = e
                logger.warning("[model-preset] Deneme %d başarısız: %s", attempt, e)
                if attempt < 3:
                    await asyncio.sleep(2)
        else:
            raise last_err

        # 4x upscale → PNG
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            w, h = img.size
            img = img.resize((w * 4, h * 4), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            img_bytes = buf.getvalue()
            logger.info("[model-preset] Upscale: %dx%d → %dx%d PNG, %dKB", w, h, w * 4, h * 4, len(img_bytes) // 1024)
        except Exception as e:
            logger.warning("[model-preset] Upscale başarısız: %s", e)

        # Cloudinary'e yükle
        result = await loop.run_in_executor(
            None,
            lambda: cloudinary_service.upload_file(img_bytes, folder="tryon/model-presets"),
        )
        url = result["secure_url"]
        logger.info("[model-preset] Tamamlandı: %s", url)
        return url


model_preset_service = ModelPresetService()
