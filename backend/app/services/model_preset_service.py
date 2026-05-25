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


# ── Poz tanımları — Türkiye pazarı, anatomik hassas ─────────────────────────
PRESET_POSES: dict[str, dict] = {
    "power_stance": {
        "label": "Güç Duruşu",
        "desc": (
            "EXACT BODY POSITION: "
            "Standing fully upright with commanding authority. "
            "Right foot planted forward and slightly to the right, pointing at 2 o'clock. "
            "Left foot back and to the left, creating a wide powerful base. "
            "RIGHT HAND: placed firmly on right hip, elbow pointing sharply outward to the right — "
            "this creates a bold, strong geometric line. "
            "LEFT ARM: straight, hanging close at the side, fingers relaxed and together. "
            "TORSO: chest fully open, shoulders pulled back and down — absolutely no hunching. "
            "Body faces camera at a very slight 10-degree angle, barely any turn. "
            "HEAD: perfectly level, chin parallel to the floor — not tilted up or down. "
            "GAZE: eyes looking DIRECTLY and intensely into the camera lens. "
            "EXPRESSION: strong, composed, determined — lips naturally closed, jaw set with confidence. "
            "This is a high-impact power pose — magazine cover energy, commanding and aspirational."
        ),
    },
    "dynamic_stride": {
        "label": "Dinamik Yürüyüş",
        "desc": (
            "EXACT BODY POSITION: "
            "Caught confidently mid-stride, walking directly toward the camera. "
            "LEFT FOOT: planted firmly forward, heel down, toe pointing at 12 o'clock. "
            "RIGHT FOOT: behind and to the right, only the ball of the foot touching the ground, "
            "creating a natural push-off motion. "
            "LEFT ARM: swinging slightly forward and across the body. "
            "RIGHT ARM: swinging back behind the hip, relaxed and natural. "
            "TORSO: slight natural rotation from the hips due to the stride — dynamic energy. "
            "Clothing and hair showing subtle natural movement from the walking motion. "
            "HEAD: level, chin parallel to ground, slight forward lean from the stride energy. "
            "GAZE: eyes locked directly on the camera with a powerful, purposeful expression. "
            "EXPRESSION: confident smize — intensity in the eyes, lips naturally relaxed. "
            "This is a dynamic editorial walk — runway energy translated to e-commerce, "
            "full body in frame from head to feet."
        ),
    },
    "elegant_hip": {
        "label": "Zarif Kalça",
        "desc": (
            "EXACT BODY POSITION: "
            "Classic high-fashion S-curve silhouette. "
            "ALL BODY WEIGHT on the right leg — right hip pushed out noticeably to the right, "
            "creating a strong, elegant S-shape along the body. "
            "LEFT LEG: completely relaxed, knee slightly bent, left foot pointed slightly to the left. "
            "RIGHT HAND: resting lightly on the right hip with the wrist bent gracefully, "
            "elbow pointing gently outward and slightly backward. "
            "LEFT ARM: straight, hanging naturally at the side, very slightly away from the body, "
            "fingers long and relaxed. "
            "TORSO: body turned at a 30-degree angle to the right of the camera. "
            "HEAD: turned to face the camera directly from the angled body position. "
            "GAZE: eyes looking straight into the camera, warm but powerful. "
            "EXPRESSION: sophisticated and alluring — a knowing, confident expression "
            "with naturally parted lips or composed neutral smile. "
            "This pose creates maximum garment silhouette visibility — "
            "perfect for showing dress flow, waistlines, and fabric drape."
        ),
    },
    "editorial_touch": {
        "label": "Editöryal Dokunuş",
        "desc": (
            "EXACT BODY POSITION: "
            "Standing elegantly upright with a sophisticated editorial gesture. "
            "Feet together or very slightly apart, body facing the camera at a 20-degree angle. "
            "RIGHT HAND: gracefully raised to touch the right side of the neck or collar area, "
            "fingers long and elegant, wrist slightly bent — "
            "this creates a beautiful leading line from hand to face. "
            "LEFT ARM: hanging straight down at the side, slightly away from the body, "
            "fingers naturally relaxed and long. "
            "TORSO: chest open, posture impeccable — long neck, elongated spine. "
            "HEAD: slightly tilted down at a 10-degree angle, creating a subtle downward gaze "
            "that still connects with the camera — introspective yet powerful. "
            "GAZE: eyes looking slightly upward toward the camera from the tilted head position, "
            "creating a smouldering, editorial gaze. "
            "EXPRESSION: sophisticated, mysterious, high-fashion — composed neutral lips. "
            "This is a luxury editorial pose — Vogue-level fashion photography energy."
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

Generate a STUNNING, HIGH-IMPACT professional Turkish fashion e-commerce photo.
This image will be used to sell clothing — it must be visually arresting and aspirational.

FACE — CRITICAL: Reproduce the face from IMAGE 1 faithfully. Same skin tone, bone structure, eye shape, nose, lips. Do NOT alter or idealize the face.

{pose_desc}

OUTFIT (placeholder — simple and minimal, it will be digitally replaced):
Choose ONE of these neutral placeholder options that best suits the pose:
Option A: Fitted plain white/cream blouse + slim straight dark navy trousers + minimal nude heels
Option B: Simple fitted light beige blazer (open) + cream fitted top underneath + dark slim trousers + white sneakers
Option C: Clean plain white fitted dress (midi length, no pattern, no details) + minimal nude or white heels
Choose whichever looks most natural and elegant for the pose. Colors: white, cream, beige, navy, charcoal ONLY. NO patterns, NO logos, NO textures, NO accessories.

{crop_line}

BACKGROUND: {background_desc}

PHOTOGRAPHY STYLE — THIS IS CRITICAL:
- Professional high-end fashion photography — the kind seen in Vogue Türkiye or Elle Türkiye
- Cinematic, editorial quality — NOT a basic catalog photo
- Soft, directional, flattering light — slight shadow on one side of the face for depth and drama
- Rich, detailed, sharp image — the model should look like a real human being, not AI-generated
- The overall image should make a viewer STOP SCROLLING — aspirational, powerful, beautiful
- Türkiye pazarı: sophisticated, modern, warm — NOT cold or clinical

OUTPUT: One perfect, photorealistic, high-impact professional fashion photo."""


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
