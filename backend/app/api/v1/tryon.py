import uuid
import asyncio
import io
import httpx
import logging
import traceback
from PIL import Image

logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.generation import Generation, GenerationStatus
from app.models.batch_job import BatchJob, BatchJobStatus
from app.models.model_asset import ModelAsset
from app.schemas.tryon import (
    TryOnResponse, TryOnStatusResponse,
    BatchTryOnResponse, BatchJobStatusResponse
)
from app.services import replicate_service
from app.services.fashn_service import fashn_service
from app.services.garment_analysis_service import (
    analyze_garment, select_best_image,
    analyze_trend_styling,
    check_generation_quality,
)
from app.services.fal_service import run_catvton, run_fashn_tryon
from app.services.garment_preprocess_service import clean_garment_image, clean_output_image
from app.services.modal_service import run_catvton_modal
from app.services.replicate_service import run_tryon_async as replicate_run_tryon
from app.services.cloudinary_service import cloudinary_service
from app.services.credit_service import credit_service
from app.core.config import settings


async def upload_to_cloudinary(file_bytes: bytes, folder: str = "tryon/garments") -> str:
    """Dosyayı Cloudinary'e yükle, public URL döndür."""
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None, lambda: cloudinary_service.upload_file(file_bytes, folder=folder)
    )
    return result["secure_url"]


async def upload_url_to_cloudinary(image_url: str, folder: str = "tryon/models") -> str:
    """URL'den görseli indir ve Cloudinary'e yükle (FASHN erişimi için)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(image_url)
        resp.raise_for_status()
    return await upload_to_cloudinary(resp.content, folder=folder)


async def ensure_public_url(url: str) -> str:
    """
    Verilen URL localhost ise görseli indirip Cloudinary'e yükler
    ve dışarıdan erişilebilen public URL döndürür.
    Harici URL'lerde (Unsplash, Cloudinary vb.) doğrudan döndürür.
    """
    if "localhost" not in url and "127.0.0.1" not in url:
        return url

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return await upload_to_cloudinary(resp.content, folder="tryon/models")


FASHN_TARGET_W = 768
FASHN_TARGET_H = 1024


def _resize_to_fashn(raw: bytes) -> bytes:
    """Görseli FASHN'ın standart 768x1024 boyutuna indirir (aspect ratio korunur, beyaz pad)."""
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    img.thumbnail((FASHN_TARGET_W, FASHN_TARGET_H), Image.LANCZOS)
    canvas = Image.new("RGB", (FASHN_TARGET_W, FASHN_TARGET_H), (255, 255, 255))
    x = (FASHN_TARGET_W - img.width) // 2
    y = (FASHN_TARGET_H - img.height) // 2
    canvas.paste(img, (x, y))
    buf = io.BytesIO()
    canvas.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


async def _crop_tryon_output(output_url: str, crop_ratio: float) -> str:
    """
    FASHN çıktısını belirtilen oranda kırpar ve Cloudinary'e yükler.
    Kısa elbiseler için bacak artefaktını gizler — profesyonel moda karesi.
    crop_ratio=0.68 → imajın üst %68'ini al (mini elbise)
    crop_ratio=0.88 → imajın üst %88'ini al (midi elbise)
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(output_url)
        resp.raise_for_status()
        raw = resp.content
    loop = asyncio.get_running_loop()

    def _do_crop(data: bytes) -> bytes:
        img = Image.open(io.BytesIO(data)).convert("RGB")
        w, h = img.size
        crop_h = int(h * crop_ratio)
        cropped = img.crop((0, 0, w, crop_h))
        buf = io.BytesIO()
        cropped.save(buf, format="JPEG", quality=95)
        return buf.getvalue()

    cropped = await loop.run_in_executor(None, _do_crop, raw)
    return await upload_to_cloudinary(cropped, folder="tryon/outputs")


async def prepare_for_fashn(image_url: str, folder: str = "tryon/garments") -> str:
    """Görseli indir, 768x1024'e resize et, Cloudinary'e yükle."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(image_url)
        resp.raise_for_status()
        raw = resp.content
    loop = asyncio.get_running_loop()
    resized = await loop.run_in_executor(None, _resize_to_fashn, raw)
    return await upload_to_cloudinary(resized, folder=folder)


# Tops için pozlar — kıyafet detayları ön planda, yarı dinamik
POSE_PROMPTS_TOPS: dict[str, str] = {
    "front":         "standing facing camera, weight slightly shifted to one leg, one hand loosely at side and other hand resting on hip, relaxed confident fashion pose",
    "three_quarter": "three-quarter angle toward camera, one shoulder forward, chin slightly down, one hand near waist, editorial fashion stance",
    "hand_on_hip":   "both hands on hips, slight body angle, elbows back to open up the garment silhouette, strong commercial fashion pose",
    "crossed_arms":  "arms loosely crossed just below chest level, slight chin lift, confident editorial pose, garment front fully visible",
    "side":          "side profile, standing tall, one arm slightly forward, looking ahead",
}

# Bottoms ve one-pieces için pozlar — tam boy, aktif
POSE_PROMPTS_FULL: dict[str, str] = {
    "front":         "standing facing camera, weight on one leg, one hand on hip, opposite arm relaxed at side, feet slightly apart, full body commercial fashion pose",
    "three_quarter": "three-quarter angle, one foot slightly forward, one hand on hip, chin slightly down, dynamic editorial stance, full body visible",
    "walking":       "mid-stride walking pose, natural arm movement, looking directly at camera, confident fashion walk, both legs and feet fully visible",
    "hand_on_hip":   "one hand on hip, one hand lightly touching thigh, weight shifted, slight body twist showing silhouette, full body editorial pose",
    "side":          "side profile, standing tall, one leg slightly forward, arms relaxed, looking straight ahead, full body visible",
}


BACKGROUND_PROMPTS: dict[str, str] = {
    "white_studio":  "pure white seamless studio background, clean professional photography",
    "grey_studio":   "neutral medium grey seamless studio background, soft diffused professional lighting",
    "cream":         "warm cream beige seamless studio background, soft warm ambient lighting",
    "black_studio":  "deep black seamless studio background, dramatic high-contrast lighting",
    "outdoor_city":  "blurred modern urban city street background, natural daylight, shallow depth of field, bokeh",
    "outdoor_nature":"blurred lush green nature park background, soft natural sunlight, bokeh",
    "cafe":          "blurred elegant modern cafe interior background, warm ambient lighting, bokeh",
    "minimal_room":  "minimal bright modern white interior room, natural window light, clean Scandinavian aesthetic",
    "pink_studio":   "soft pastel pink seamless studio background, even diffused lighting, feminine aesthetic",
    "beige_outdoor": "warm sandy beige outdoor terrace background, golden hour soft sunlight, bokeh",
}

BODY_TYPE_PROMPTS: dict[str, str] = {
    "standard": "slim fashion model with standard proportions",
    "plus":     "plus-size curvy model, size 16-18, naturally full hips and bust, "
                "soft rounded shoulders, fuller arms and thighs, beautiful full-figured body — "
                "do NOT slim down or alter body proportions, keep natural plus-size silhouette",
}


def _build_fashn_prompt(analysis, pose: str = "front", body_type: str = "standard", background: str = "white_studio") -> str:
    """
    Kategori + uzunluk + poz bilgisine göre FASHN product-to-model için
    tutarlı sonuç üreten prompt oluşturur.
    - Tops: yarım çekim (head to mid-thigh), Instagram 4:5
    - Bottoms / one-pieces: tam boy, Instagram 4:5
    """
    if analysis.category == "one-pieces":
        hint_lower = analysis.proportion_hint.lower()
        garment_type_lower = analysis.garment_type.lower()
        is_dress = any(k in garment_type_lower for k in ("dress", "gown", "sundress", "frock", "romper", "jumpsuit"))

        is_short_dress = any(k in hint_lower for k in (
            "mini", "micro", "thigh", "above knee", "above-knee", "above the knee",
            "short hem", "short dress",
        ))
        is_midi_dress = any(k in hint_lower for k in (
            "midi", "below knee", "below-knee", "calf", "tea length",
        ))
        is_long_dress = is_dress and any(k in hint_lower for k in (
            "maxi", "ankle", "floor", "full-length", "full length",
        ))

        # Fallback: dress ama kısa/midi/uzun olduğu tespit edilemedi → kısa muamele
        if is_dress and not is_short_dress and not is_midi_dress and not is_long_dress:
            is_short_dress = True

        if is_short_dress:
            frame_instruction = "upper-body fashion editorial photo, head to mid-thigh crop"
            length_instruction = (
                f"short dress hem ending at {analysis.proportion_hint} — do NOT lengthen the dress, "
                "entire garment completely visible from neckline to hem, "
                "model shown from head to just below the dress hem — DO NOT extend dress length, "
                "CRITICAL: preserve EXACT dress length from product — if mini/short, keep it short, do NOT make it longer, "
                "CRITICAL: model wears ONLY this dress — absolutely NO pants, jeans, leggings, shorts, tights or any lower body garment underneath the dress"
            )
            pose_instruction = POSE_PROMPTS_TOPS.get(pose, POSE_PROMPTS_TOPS["front"])
        elif is_midi_dress:
            frame_instruction = "full body fashion editorial photo"
            length_instruction = (
                f"midi-length dress hem ending below the knee ({analysis.proportion_hint}), "
                "entire garment completely visible without any cropping, feet in frame, "
                "CRITICAL: preserve EXACT dress length from product — midi hem, do NOT shorten or lengthen, "
                "CRITICAL: model wears ONLY this dress — absolutely NO pants, jeans, leggings or any lower body garment underneath"
            )
            pose_instruction = POSE_PROMPTS_FULL.get(pose, POSE_PROMPTS_FULL["front"])
        elif is_long_dress:
            # Uzun/maxi elbise — tam boy, kesinlikle pantolon yok
            frame_instruction = "full body fashion editorial photo"
            length_instruction = (
                f"floor-length dress hem ({analysis.proportion_hint}), "
                "entire garment completely visible without any cropping, feet in frame, "
                "CRITICAL: model wears ONLY this dress — absolutely NO pants, jeans, leggings or any lower body garment underneath the dress"
            )
            pose_instruction = POSE_PROMPTS_FULL.get(pose, POSE_PROMPTS_FULL["front"])

        else:
            # İki parça matching set (eşofman, co-ord, pijama seti, takım elbise)
            frame_instruction = "full body fashion editorial photo"
            length_instruction = (
                f"garment at its EXACT length: {analysis.proportion_hint} — do NOT alter the hem length, "
                "entire garment completely visible without any cropping, "
                "top garment hem fully covers pants waistband with zero bare midriff or gap between pieces, "
                "pants shown at full natural length reaching ankles — do NOT crop or shorten the pants, "
                "preserve exact leg width from product: if wide-leg/palazzo keep full draping leg width, do NOT taper"
            )
            pose_instruction = POSE_PROMPTS_FULL.get(pose, POSE_PROMPTS_FULL["front"])

    elif analysis.category == "bottoms":
        frame_instruction = "full body fashion editorial photo"
        length_instruction = (
            "full length bottom garment from waistband to ankles and feet, "
            "entire garment completely visible without cropping, "
            "FRONT side of garment facing camera — front pockets and button fly or zipper facing forward, "
            "NO back pockets, NO interior waistband label, NO back seam visible from this front view"
        )
        pose_instruction = POSE_PROMPTS_FULL.get(pose, POSE_PROMPTS_FULL["front"])

    elif analysis.is_long_top:
        frame_instruction = "full body fashion editorial photo"
        length_instruction = (
            "full length long coat/jacket from collar to hem below the knee, "
            "entire garment completely visible without any cropping, feet in frame, "
            "paired with simple neutral slim trousers as lower body, "
            "no additional inner shirt or blouse unless it is explicitly part of the described outer garment"
        )
        pose_instruction = POSE_PROMPTS_FULL.get(pose, POSE_PROMPTS_FULL["front"])

    else:
        # Kısa tops — yarım çekim, head to mid-thigh
        frame_instruction = "upper-body fashion editorial photo, head to mid-thigh crop"
        length_instruction = (
            "complete top garment fully visible from neckline to hem, "
            "model shown from head to mid-thigh — DO NOT show feet, "
            "paired with simple neutral slim trousers or plain skirt as lower body, "
            "NO additional inner shirt, blouse, or undershirt unless explicitly part of the described garment — "
            "only the product garment on top"
        )
        pose_instruction = POSE_PROMPTS_TOPS.get(pose, POSE_PROMPTS_TOPS["front"])
    body_instruction = BODY_TYPE_PROMPTS.get(body_type, BODY_TYPE_PROMPTS["standard"])
    background_instruction = BACKGROUND_PROMPTS.get(background, BACKGROUND_PROMPTS["white_studio"])

    return (
        # ── Garment first: FASHN product image ile eşleşmeli ─────────────────
        f"EXACT GARMENT: {analysis.garment_type}. "
        f"FABRIC & DETAILS: {analysis.texture_prompt}. "
        f"SILHOUETTE & PROPORTIONS: {analysis.proportion_hint} — reproduce this exact silhouette, do NOT alter the skirt shape, hem length, or sleeve length. "
        # ── Model & sahne ────────────────────────────────────────────────────
        f"{frame_instruction}, {pose_instruction}, {body_instruction}, "
        f"{length_instruction}, "
        f"wearing {analysis.footwear}, "
        f"{background_instruction}, absolutely no studio equipment, no softbox panels, no flash stands, no reflectors, no umbrellas, no lights visible anywhere in frame, "
        f"soft diffused even lighting, natural balanced exposure — "
        f"no blown highlights, no overexposed areas, no washed-out fabric, retained texture detail in all tonal ranges, "
        f"no harsh shadows, gentle wrap lighting from front, "
        f"true-to-product color accuracy — exact garment color with no color cast, no desaturation, no brightness shift, "
        f"sharp focus on fabric texture and garment details, high detail, commercial fashion photography, "
        # ── Fidelity kuralları ───────────────────────────────────────────────
        f"CRITICAL FIDELITY: reproduce ONLY the exact original garment design — "
        f"preserve exact sleeve length from product image (do NOT lengthen short sleeves or shorten long sleeves); "
        f"do NOT add sleeve stripes, ribbed cuffs, elastic ankle bands, contrast panels, "
        f"extra piping, or any decorative element not visible in the product image; "
        f"do NOT add drawstrings, waist ties, belts, or cinching at the waist unless explicitly described; "
        f"do NOT convert a two-piece set into a jumpsuit or one-piece — keep top and bottom as visually separate garments; "
        f"if the neckline has a bow, scarf-tie, or fabric tie, reproduce it exactly — do NOT replace with cowl, drape, or plain neckline; "
        f"PIPING RULE: if the garment has curved or wavy piping trim along seams, reproduce the CURVED shape exactly — do NOT straighten piping into a vertical stripe or side panel; "
        f"SLEEVE RULE: reproduce EXACT sleeve length — if sleeves are 3/4 length (mid-forearm), do NOT extend to wrist; if sleeves are SHORT, do NOT lengthen; "
        f"SLEEVE FIT RULE: sleeves must drape naturally on the model's arms as if worn — do NOT copy the hanger-distorted or flat-lay sleeve shape from the product photo; reproduce natural worn sleeve silhouette with smooth fabric; "
        f"PANT HEM RULE: if pant hem is described as straight/plain, reproduce a clean straight hem — do NOT add elastic cuffs, ribbing, or ankle bands unless explicitly stated; "
        f"SKIRT RULE: if the skirt is A-line or fit-and-flare, reproduce the FULL voluminous skirt — do NOT slim it into a pencil or slip silhouette; "
        f"LABEL RULE: do NOT reproduce any inner garment labels, care tags, brand tags, size labels, or manufacturer tags that are visible inside the collar or neckline in the product photo — these are internal manufacturing details NOT part of the garment exterior; the collar and neckline area must be clean fabric only; "
        f"reproduce any exterior logo/text or embroidery exactly as described — correct text, correct position, correct color, do NOT swap brand or invent new graphics"
    )


def _build_outfit_styling(analysis) -> str:
    """
    Kıyafetin kategorisi ve türüne göre tamamlayıcı kombin promptu döndürür.
    Mevsime uygun iç kat (open-front ürünler için), alt giyim ve ayakkabı önerir.
    """
    footwear = analysis.footwear
    texture = analysis.texture_prompt.lower()
    garment = analysis.garment_type.lower()

    is_winter = any(k in texture for k in ("wool", "cashmere", "heavy", "tweed", "camel", "fleece", "thick", "coat", "overcoat", "kaban", "palto"))
    is_summer = any(k in texture for k in ("linen", "cotton", "light", "sheer", "chiffon", "thin", "floral", "summer"))
    is_open_front = any(k in garment for k in ("coat", "jacket", "blazer", "cardigan", "vest", "kaban", "ceket", "blazer", "hırka", "yelek", "kimono", "overshirt"))
    is_closed_front = getattr(analysis, "is_closed_front", False)

    # İç kat: açık önlü kıyafetlerde her zaman iç kat ekle (is_closed_front fark etmeksizin)
    # Blazer/ceket kapalı görünse bile yakanın üstünde iç giysi görünmesi doğaldır
    # ve ürün fotoğrafındaki yaka etiketi sorununu da engeller
    if is_open_front:
        if is_winter:
            inner_layer = "fitted ribbed turtleneck knit sweater underneath — body fully covered, no bare skin visible"
        elif is_summer:
            inner_layer = "simple fitted light blouse or cotton shirt underneath — body fully covered, no bare skin visible"
        else:
            inner_layer = "fitted mock-neck knit top or simple blouse underneath — body fully covered, no bare skin visible"
    else:
        inner_layer = None

    if analysis.category == "tops":
        # Uzun üst (kaban, trençkot, maxi hırka) → tam boy; kısa üst → yarım boy
        if analysis.is_long_top:
            frame = "full body visible from head to feet, no cropping, feet in frame"
            if is_winter:
                bottom = "slim straight dark wool trousers"
            elif is_summer:
                bottom = "slim chino trousers or straight-cut cotton pants"
            else:
                bottom = "slim straight dark trousers"
        else:
            frame = "upper body shot from head to mid-thigh — DO NOT show feet or full legs"
            if any(k in garment for k in ("blazer", "jacket", "cardigan", "vest")):
                bottom = "tailored slim trousers or dark straight-cut jeans"
            elif is_summer:
                bottom = "high-waisted linen wide-leg trousers or slim straight jeans"
            else:
                bottom = "slim straight jeans or tailored trousers"

        if is_closed_front:
            closure_note = (
                " — CRITICAL: FULLY BUTTONED AND CLOSED, all buttons fastened, "
                "front panels completely overlapping with ZERO gap, "
                "NO inner garment or skin visible through the front"
            )
        else:
            closure_note = ""
        inner_part = f", {inner_layer}" if inner_layer else ""
        return (
            f"GARMENT CLOSURE: {'CLOSED FRONT — keep all buttons fastened and front panels overlapping' if is_closed_front else 'as shown in product image'}. "
            f"complete outfit: the featured outer garment{closure_note}{inner_part}, "
            f"{bottom} on the bottom — "
            f"{frame}"
        )

    elif analysis.category == "bottoms":
        if any(k in garment for k in ("skirt", "mini", "midi", "maxi")):
            top = "simple fitted tucked-in blouse or fitted crop top"
        elif is_summer:
            top = "simple fitted light blouse or relaxed linen top"
        else:
            top = "simple fitted blouse or tucked-in shirt"
        return (
            f"complete head-to-toe outfit: {top} on top, "
            f"the featured garment on the bottom, {footwear} on feet — "
            f"full body visible from head to feet, no cropping"
        )

    elif analysis.category == "one-pieces":
        return (
            f"complete head-to-toe outfit: wearing the featured dress/jumpsuit, "
            f"{footwear} on feet — full body visible from head to feet, no cropping"
        )

    return (
        f"complete head-to-toe fashion look with {footwear} — "
        f"full body visible from head to feet, no cropping"
    )


router = APIRouter(prefix="/tryon", tags=["tryon"])


async def run_quality_check_background(generation_id: uuid.UUID, garment_url: str, output_url: str):
    """FASHN tamamlandıktan sonra arka planda kalite kontrolü yapar ve DB'yi günceller."""
    from app.core.database import AsyncSessionLocal
    try:
        quality = await check_generation_quality(garment_url, output_url)
        score = float(quality.get("overall_score", 3))
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Generation).where(Generation.id == generation_id))
            gen = result.scalar_one_or_none()
            if gen:
                gen.quality_score = score
                existing_meta = gen.generation_metadata or {}
                gen.generation_metadata = {
                    **existing_meta,
                    "quality": {
                        "overall_score": score,
                        "color_match": quality.get("color_match"),
                        "silhouette_match": quality.get("silhouette_match"),
                        "detail_accuracy": quality.get("detail_accuracy"),
                        "color_shift": quality.get("color_shift"),
                        "hallucinations": quality.get("hallucinations", []),
                        "missing_details": quality.get("missing_details", []),
                    },
                }
                await db.commit()
                logger.info("[%s] Arka plan kalite kontrolü tamamlandı: score=%.1f", generation_id, score)
    except Exception as e:
        logger.error("[%s] Arka plan kalite kontrolü başarısız: %s", generation_id, e)


async def process_tryon_background(generation_id: uuid.UUID, model_image_url: str,
                                   garment_url: str, category: str = "tops", pose: str = "front",
                                   body_type: str = "standard", provider: str = "fashn",
                                   background: str = "white_studio", quality: str = "high",
                                   aesthetic: str = "auto", crop_type: str = "full_body"):
    """FASHN.ai ile try-on işlemi yap, sonucu kaydet."""
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        try:
            _generation_metadata: dict | None = None
            logger.info("[%s] Step 1: ensure_public_url", generation_id)
            model_image_url = await ensure_public_url(model_image_url)

            if provider == "replicate":
                # ── Replicate IDM-VTON yolu ───────────────────────────────────
                logger.info("[%s] Replicate IDM-VTON | category=%s", generation_id, category)
                resized_garment_url = await prepare_for_fashn(garment_url)
                output_urls = await replicate_run_tryon(
                    model_image_url=model_image_url,
                    garment_image_url=resized_garment_url,
                    category=category,
                )
                if not output_urls:
                    raise RuntimeError("Replicate IDM-VTON sonuç döndürmedi")
                logger.info("[%s] Replicate tamamlandı: %s", generation_id, output_urls)

            elif provider == "fal":
                # ── FAL.ai CatVTON yolu ──────────────────────────────────────
                logger.info("[%s] FAL.ai CatVTON | category=%s", generation_id, category)
                resized_garment_url = await prepare_for_fashn(garment_url)
                public_model_url = await ensure_public_url(model_image_url)
                output_url = await run_catvton(
                    model_image_url=public_model_url,
                    garment_image_url=resized_garment_url,
                    category=category,
                )
                logger.info("[%s] FAL.ai tamamlandı: %s", generation_id, output_url)
                output_urls = [output_url]

            elif provider == "catvton":
                # ── Modal.com CatVTON yolu ───────────────────────────────────
                logger.info("[%s] Modal CatVTON | category=%s", generation_id, category)
                analysis = await analyze_garment(garment_url, category)
                logger.info("[%s] Garment: %s | %s", generation_id, analysis.garment_type, analysis.category)
                image_bytes = await run_catvton_modal(
                    model_image_url=model_image_url,
                    garment_image_url=garment_url,
                    category=analysis.category,
                )
                output_url = await upload_to_cloudinary(image_bytes, folder="tryon/outputs")
                logger.info("[%s] Modal CatVTON tamamlandı: %s", generation_id, output_url)
                output_urls = [output_url]

            else:
                # ── FASHN product-to-model + background-removed garment ───────
                logger.info("[%s] FASHN product-to-model | background=%s body_type=%s",
                            generation_id, background, body_type)

                # Kıyafet analizi — 2 geçiş paralel (garment + trend)
                logger.info("[%s] Garment analysis (2 geçiş paralel) başlıyor", generation_id)
                aesthetic_override = None if aesthetic == "auto" else aesthetic
                analysis, trend = await asyncio.gather(
                    analyze_garment(garment_url, "auto"),
                    analyze_trend_styling(garment_url, aesthetic_override),
                )
                logger.info("[%s] Garment: %s | category=%s | is_closed=%s",
                            generation_id, analysis.garment_type, analysis.category,
                            analysis.is_closed_front)
                logger.info("[%s] Trend: %s (%s)", generation_id, trend["aesthetic"], trend["reason"])

                background_desc = BACKGROUND_PROMPTS.get(background, BACKGROUND_PROMPTS["white_studio"])

                # Çerçeve — tam boy veya yarım boy
                crop_frame = (
                    "upper body shot from head to mid-thigh"
                    if crop_type == "half_body"
                    else "full body shot from head to feet, shoes visible"
                )

                # Açık/kapalı durum — ürün fotoğrafındaki haliyle eşleş
                closure_rule = (
                    "jacket/blazer FULLY CLOSED — all buttons fastened, front panels overlapping with NO gap"
                    if analysis.is_closed_front
                    else "jacket/blazer worn OPEN — front panels apart exactly as shown in product photo"
                )

                # Sadece düğme sayısı kuralı — garment şekli FASHN'a bırakılıyor
                button_rule = "reproduce EXACT button count from the product image — do NOT add extra buttons, do NOT remove buttons"

                # Kombin tamamlama — sadece tamamlayıcı parçalar (ana kıyafet FASHN tarafından fotoğraftan okunuyor)
                _gt = analysis.garment_type.lower()
                _is_jacket = any(k in _gt for k in ("blazer", "jacket", "coat", "ceket", "kaban", "palto", "cardigan", "vest", "yelek"))

                if analysis.category == "tops":
                    if _is_jacket and not analysis.is_closed_front:
                        # Açık ceket/blazer → içinde beyaz crop/gömlek + altında pantolon + ayakkabı
                        outfit_completion = (
                            "FULL OUTFIT: the model MUST wear slim-fit tailored trousers (NOT leggings, NOT shorts) "
                            "in a complementary dark color on the bottom — REPLACE any existing pants with tailored trousers; "
                            "CRITICAL: a white or beige fitted spaghetti-strap crop top fabric MUST be clearly visible "
                            "BETWEEN THE JACKET LAPELS at the chest and neckline area — "
                            "show the solid fabric of the inner top between the two lapels, NOT bare skin, NOT décolletage — "
                            "the inner garment fabric must fill the V-opening between the lapels; "
                            f"on the feet: {analysis.footwear}"
                        )
                    elif _is_jacket and analysis.is_closed_front:
                        # Kapalı ceket → sadece altında pantolon + ayakkabı
                        outfit_completion = (
                            "FULL OUTFIT: the model MUST wear slim-fit tailored trousers (NOT leggings, NOT shorts) "
                            "in a complementary color on the bottom — REPLACE any existing pants with tailored trousers; "
                            f"on the feet: {analysis.footwear}"
                        )
                    else:
                        # Tişört, gömlek, kazak vb. → altında pantolon/etek + ayakkabı
                        outfit_completion = (
                            "FULL OUTFIT: the model MUST wear well-fitted trousers or a skirt "
                            "in a complementary color on the bottom — REPLACE any existing pants; "
                            f"on the feet: {analysis.footwear}"
                        )
                elif analysis.category == "bottoms":
                    # Pantolon, etek vb. → üstte uygun bir top + ayakkabı
                    outfit_completion = (
                        "FULL OUTFIT: the model MUST wear a fitted blouse, shirt, or top "
                        "in a complementary color on the upper body — REPLACE any existing top; "
                        f"on the feet: {analysis.footwear}"
                    )
                else:
                    # Elbise, tulum, takım — sadece ayakkabı
                    outfit_completion = f"on the feet: {analysis.footwear}"

                accessories_note = (
                    "minimal accessories — small handbag and delicate jewelry"
                    if trend["aesthetic"] == "with_accessories"
                    else "no accessories"
                )

                base_prompt = (
                    f"{closure_rule}, {button_rule}, "
                    + (f"{outfit_completion}, " if outfit_completion else "")
                    + f"{accessories_note}, "
                    f"preserve the model's original pose and body posture, "
                    f"{crop_frame}, model fully centered in frame, {background_desc}, "
                    f"photorealistic face with natural features, sharp facial details, no face distortion"
                )

                # ── Ürün fotoğrafı ön işleme: iç yaka etiketi temizleme ─────
                logger.info("[%s] Garment preprocessing başlıyor", generation_id)
                garment_url_clean = await clean_garment_image(garment_url)
                if garment_url_clean != garment_url:
                    logger.info("[%s] Etiket temizlendi, temiz URL kullanılıyor", generation_id)

                # ── FASHN.ai → fallback: fal.ai FASHN VTON ──────────────────
                logger.info("[%s] FASHN çağrısı yapılıyor", generation_id)
                logger.info("[%s] Prompt[:200]: %s", generation_id, base_prompt[:200])

                try:
                    run_result = await fashn_service.run_product_to_model(
                        product_image_url=garment_url_clean,
                        model_image_url=model_image_url,
                        prompt=base_prompt,
                        resolution="4k",
                        aspect_ratio="3:4",
                        num_images=1,
                    )
                    prediction_id = run_result.get("id")
                    if not prediction_id:
                        raise RuntimeError(f"FASHN product-to-model prediction id gelmedi: {run_result}")

                    final = await fashn_service.poll_until_complete(prediction_id)
                    raw_output = final.get("output", [])
                    output_urls = [raw_output] if isinstance(raw_output, str) else list(raw_output)
                    output_urls = output_urls[:1]

                    if not output_urls:
                        raise RuntimeError("FASHN product-to-model boş çıktı döndürdü")

                    logger.info("[%s] FASHN.ai tamamlandı", generation_id)

                    # Çıktıdaki iç yaka etiketini temizle
                    logger.info("[%s] Output cleaning başlıyor", generation_id)
                    output_urls = [await clean_output_image(u) for u in output_urls]

                except Exception as fashn_err:
                    logger.warning(
                        "[%s] FASHN.ai başarısız (%s) — fal.ai FASHN VTON fallback başlatılıyor",
                        generation_id, fashn_err
                    )
                    fallback_url = await run_fashn_tryon(
                        model_image_url=model_image_url,
                        garment_image_url=garment_url_clean,
                        category=analysis.category,
                        mode="quality",
                    )
                    fallback_url = await clean_output_image(fallback_url)
                    output_urls = [fallback_url]
                    logger.info("[%s] fal.ai FASHN VTON fallback tamamlandı: %s", generation_id, fallback_url)

                logger.info("[%s] FASHN tamamlandı, kullanıcıya gösterilecek", generation_id)

                # Hafıza verisi — üretim metadatası DB'ye kaydedilecek
                _generation_metadata = {
                    "garment_type": analysis.garment_type,
                    "category": analysis.category,
                    "trend": trend.get("aesthetic"),
                    "is_closed_front": analysis.is_closed_front,
                }


            gen_result = await db.execute(
                select(Generation).where(Generation.id == generation_id)
            )
            gen = gen_result.scalar_one_or_none()
            if gen:
                gen.output_urls = output_urls
                gen.status = GenerationStatus.completed
                if _generation_metadata is not None:
                    gen.generation_metadata = _generation_metadata
                await db.commit()

                # FASHN için kalite kontrolü arka planda — kullanıcı sonucu görürken çalışır
                if provider == "fashn" and output_urls:
                    asyncio.create_task(
                        run_quality_check_background(generation_id, garment_url, output_urls[0])
                    )

        except Exception as e:
            tb = traceback.format_exc()
            logger.error("process_tryon_background failed: %s\n%s", e, tb)
            gen_result = await db.execute(
                select(Generation).where(Generation.id == generation_id)
            )
            gen = gen_result.scalar_one_or_none()
            if gen:
                gen.status = GenerationStatus.failed
                gen.error_message = f"{type(e).__name__}: {e}\n{tb}"
                # Kredi iadesi — başarısız işlemde kullanıcıya geri ver
                try:
                    from app.models.credit_transaction import TransactionType
                    await credit_service.add_credits(
                        db, gen.user_id, gen.credits_used,
                        transaction_type=TransactionType.admin,
                        description=f"Başarısız işlem iadesi (generation {generation_id})",
                    )
                    logger.info("[%s] Kredi iadesi yapıldı: %d kredi", generation_id, gen.credits_used)
                except Exception as refund_err:
                    logger.error("[%s] Kredi iadesi başarısız: %s", generation_id, refund_err)
                await db.commit()


@router.post("/upload-garment")
async def upload_garment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 10MB")
    result = await upload_to_cloudinary(contents, folder="tryon/garments")
    return {"url": result, "public_id": file.filename or "garment.jpg"}


@router.post("/run", response_model=TryOnResponse)
async def run_tryon(
    background_tasks: BackgroundTasks,
    garment_url: str = Form(...),
    model_asset_id: uuid.UUID = Form(...),
    model_image_url: str = Form(None),
    body_type: str = Form("standard"),
    provider: str = Form("fashn"),
    background: str = Form("white_studio"),
    aesthetic: str = Form("auto"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    credits_cost = 2
    if not await credit_service.check_credits(current_user, credits_cost):
        raise HTTPException(status_code=402, detail="Insufficient credits")

    model_result = await db.execute(
        select(ModelAsset).where(ModelAsset.id == model_asset_id, ModelAsset.is_active == True)
    )
    model = model_result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # model_image_url verilmişse (takım ikinci adımı), onu kullan; yoksa modelin orijinal görselini kullan
    effective_model_image_url = model_image_url if model_image_url else model.image_url

    # Krediyi düş
    await credit_service.deduct_credits(
        db, current_user.id, credits_cost,
        description="Try-on generation (product-to-model)"
    )

    # Generation kaydı oluştur
    generation = Generation(
        user_id=current_user.id,
        model_asset_id=model_asset_id,
        garment_url=garment_url,
        status=GenerationStatus.processing,
        category="tops",
        credits_used=credits_cost,
    )
    db.add(generation)
    await db.flush()

    background_tasks.add_task(
        process_tryon_background,
        generation.id, effective_model_image_url, garment_url, "tops", "front", body_type, provider,
        background, "high", aesthetic, model.crop_type.value if model.crop_type else "full_body",
    )

    return TryOnResponse(generation_id=generation.id, status=generation.status)


@router.get("/{generation_id}/status", response_model=TryOnStatusResponse)
async def get_tryon_status(
    generation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Generation).where(
            Generation.id == generation_id,
            Generation.user_id == current_user.id,
        )
    )
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
    return gen


@router.post("/batch", response_model=BatchTryOnResponse)
async def run_batch_tryon(
    garment_url: str = Form(...),
    model_ids: str = Form(...),
    category: str = Form("tops"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import json
    try:
        parsed_ids = json.loads(model_ids)
        model_uuid_list = [uuid.UUID(str(m)) for m in parsed_ids]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid model_ids format")

    if len(model_uuid_list) > 10:
        raise HTTPException(status_code=400, detail="Max 10 models per batch")

    required_credits = len(model_uuid_list) * settings.CREDITS_PER_GENERATION
    if not await credit_service.check_credits(current_user, required_credits):
        raise HTTPException(status_code=402, detail="Insufficient credits")

    batch_job = BatchJob(
        user_id=current_user.id,
        garment_url=garment_url,
        model_ids=[str(m) for m in model_uuid_list],
        status=BatchJobStatus.processing,
        total=len(model_uuid_list),
    )
    db.add(batch_job)
    await db.flush()

    from app.tasks.batch_tasks import process_batch_item
    for model_id in model_uuid_list:
        process_batch_item.delay(
            str(batch_job.id), str(current_user.id),
            garment_url, str(model_id), category
        )

    return BatchTryOnResponse(
        batch_job_id=batch_job.id,
        status=batch_job.status,
        total=batch_job.total,
    )


@router.get("/batch/{batch_job_id}", response_model=BatchJobStatusResponse)
async def get_batch_status(
    batch_job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BatchJob).where(
            BatchJob.id == batch_job_id,
            BatchJob.user_id == current_user.id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Batch job not found")

    gen_result = await db.execute(
        select(Generation).where(Generation.batch_job_id == batch_job_id)
    )
    generations = gen_result.scalars().all()

    progress = (job.completed / job.total * 100) if job.total > 0 else 0
    results = [
        {
            "id": str(g.id),
            "model_asset_id": str(g.model_asset_id),
            "status": g.status,
            "output_urls": g.output_urls,
        }
        for g in generations
    ]

    return BatchJobStatusResponse(
        id=job.id,
        status=job.status,
        total=job.total,
        completed=job.completed,
        failed=job.failed,
        progress=progress,
        results=results,
    )
