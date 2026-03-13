import json
import base64
import httpx
import anthropic
from dataclasses import dataclass
from app.core.config import settings


_async_client: anthropic.AsyncAnthropic | None = None
_sync_client: anthropic.Anthropic | None = None


def _get_async_client() -> anthropic.AsyncAnthropic:
    global _async_client
    if _async_client is None:
        _async_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _async_client


def _get_sync_client() -> anthropic.Anthropic:
    global _sync_client
    if _sync_client is None:
        _sync_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _sync_client


@dataclass
class GarmentAnalysis:
    garment_type: str        # "winter coat", "denim jacket", "crew-neck t-shirt" ...
    category: str            # "tops" | "bottoms" | "one-pieces"
    description: str         # Tam detaylı açıklama
    texture_prompt: str      # FASHN prompt'una geçilecek kısa materyal/doku/renk/aksesuar özeti
    proportion_hint: str     # Orantı ipucu: "knee-length hem, full-length sleeves" gibi
    footwear: str            # Kıyafete uygun ayakkabı: "knee-high leather boots" gibi
    is_long_top: bool = False
    is_closed_front: bool = False  # True: ürün fotoğrafında tüm düğmeler/fermuar kapalı
    photo_type: str = "auto"


ANALYSIS_PROMPT = """You are analyzing a garment image for a high-end virtual try-on AI system.
Examine EVERY visible detail with precision. Be faithful — do NOT invent details not visible in the image.

Respond ONLY with a raw JSON object (no markdown, no code fences):
{
  "garment_type": "exact English garment name (e.g. wool overcoat, leather biker jacket, silk slip dress, cable-knit sweater, raw-hem denim jeans, pleated midi skirt)",
  "category": "tops or bottoms or one-pieces",
  "description": "4-5 sentences covering: (1) exact color(s) with shade precision — 'camel', 'burgundy', 'slate blue', 'off-white', NOT generic 'brown/red/blue/white'; (2) fabric/material — wool, leather, denim, silk, cotton, linen, synthetic, knit, woven, tweed, velvet, etc.; (3) texture surface — smooth, matte, glossy, heathered, melange, quilted, ribbed, cable-knit, twill, herringbone, etc.; (4) garment length — cropped/waist/hip/thigh/knee/midi/maxi/ankle; (5) fit — slim/regular/relaxed/oversized/boxy; (6) collar/neckline; (7) sleeve; (8) every closure — zippers (length, pull color), buttons (count, color, material), snaps; (9) all pockets; (10) all hardware/accessories — buckles, belts, chains, fur trim, patches, embroidery, logo; (11) stitching — topstitching, quilting lines, seam placement",
  "texture_prompt": "A concise 2-3 sentence string optimized for an image generation AI, describing material, texture, color accuracy, ALL accessories, and CRITICAL absence/length flags. POCKET RULE: only describe pockets if they are clearly and unambiguously visible in the product image — if no pockets are visible, write 'no pockets'. Do NOT invent or assume pockets. (1) Describe material, texture, color. (2) Include ALL hardware/closures/trim. BUTTON COUNT IS CRITICAL: count every visible button precisely and write 'EXACTLY [N] buttons — do NOT add or remove buttons, do NOT change button count'. If you see 3 buttons, write 'EXACTLY 3 buttons'; if 4, write 'EXACTLY 4 buttons'; etc. Never write 'several' or 'multiple'. Infer belts/ties for garment types that always have them (robes, trench coats, wrap dresses, kimonos). (3) ALWAYS add explicit flags to lock proportions and prevent hallucination — SLEEVE LENGTH is critical: if sleeves are SHORT (end above elbow), write 'SHORT [mid-bicep or elbow]-length sleeves — do NOT extend to wrist'; if sleeves are 3/4 length (end at mid-forearm), write '3/4-length sleeves ending at mid-forearm — do NOT extend to wrist'; if sleeves are FULL length (reach wrist), write 'full-length sleeves to wrist — do NOT shorten'; if sleeve ends are plain, write 'clean-cut sleeve hem with no cuff or elastic'; PANT HEM is critical: if pants have a plain straight hem (no elastic, no ribbing visible at ankle), write 'straight-cut ankle hem with NO elastic cuff, NO ribbing, NO ankle band — plain open hem only'; if pants have a ribbed/elastic ankle cuff (jogger style), write 'ribbed elastic ankle cuffs — jogger style hem'; if pants/skirt hem is straight (no ankle elastic, no ribbed cuff), write 'straight-cut ankle hem with no elastic cuff or ribbing'; SIDE SLIT/SPLIT RULE is critical: examine the outer leg seam and hem area carefully for vertical cuts/slits. If NO side slits are visible anywhere on the pants or skirt: write 'NO side slits, NO leg splits, NO hem cuts — completely closed seam and plain hem all around'. If side slits ARE clearly present: write 'side slits at outer leg seam, [height] — reproduce exact slit position and height, do NOT add slits elsewhere'; PIPING is critical: if the garment has piping/trim along seams, describe its exact path — 'CURVED wavy white piping along side seams' or 'straight white piping along raglan seams' — never omit the shape; if garment has no contrasting stripes/panels beyond the described piping, write 'no additional stripes or decorative panels beyond described piping'; if logos/graphic prints are present, describe them precisely: exact text content, font style (serif/sans-serif/script/bold), color, size (small/medium/large patch), exact position on garment (e.g. 'left chest', 'center chest', 'right sleeve', 'back center'), then write 'small white sans-serif POLO text logo on left chest — reproduce in exact position, do NOT alter text or swap for different brand'. (4) For BOTTOMS (pants, jeans, skirts): if the product image shows the FRONT of the garment, explicitly write 'product image shows FRONT of garment — front pockets and fly/zipper facing forward, no back pockets visible in this view, do NOT show interior waistband label on front'. Examples: 'camel wool overcoat, EXACTLY 4 buttons — do NOT add or remove buttons, full-length sleeves to wrist, clean-cut sleeve hem with no cuff, straight-cut ankle hem' / 'heathered grey fleece tracksuit, CURVED wavy white piping along side seams only — do NOT straighten into vertical stripe, SHORT 3/4-length sleeves ending at mid-forearm — do NOT extend to wrist, clean-cut sleeve hem with no cuff, straight ankle hem with NO elastic cuff or ribbing, POLO chest logo — preserve exact logo without alteration, no added stripes or panels' / 'glossy burgundy patent leather with silver zipper hardware, quilted sleeve panels, leather waist belt with gold buckle' / 'jet black satin robe with ivory piping trim and matching self-tie sash belt'",
  "proportion_hint": "Exact body length AND sleeve length AND leg/skirt width — all must be stated precisely so the AI does not invent proportions. SLEEVE LENGTH: use one of: 'full-length sleeves to wrist', '3/4-length sleeves to mid-forearm', 'elbow-length sleeves', 'SHORT mid-bicep sleeves', 'cap sleeves', 'sleeveless'. BODY LENGTH: state where hem falls on the body (waist/hip/thigh/knee/midi/ankle). LEG/SKIRT WIDTH for bottoms and sets: ALWAYS state the leg silhouette explicitly — 'wide-leg / palazzo (very full, draping leg opening)', 'straight leg', 'slim/tapered leg', 'flared leg', 'skinny leg', 'culotte/wide cropped'. If pants are wide-leg or palazzo style, write 'WIDE-LEG palazzo silhouette — do NOT narrow or taper the leg'. CRITICAL for two-piece matching sets: describe BOTH pieces — e.g. 'SHORT mid-bicep sleeves, hip-length relaxed top; WIDE-LEG palazzo pants to full ankle with plain straight hem — do NOT taper the leg'. Single-garment examples: 'full-length sleeves to wrist, hip-length body with plain straight hem' / 'SHORT elbow-length sleeves, midi-length body reaching knee' / 'sleeveless, ankle-length maxi hem'. Always use the actual visible measurements from the product image — do NOT guess.",
  "footwear": "The single most appropriate footwear for this garment's style, occasion, silhouette AND fabric weight/season. CRITICAL SEASON RULE: lightweight fabrics (gauze, crinkle, linen, cotton voile, chiffon, broderie anglaise, seersucker) are warm-weather garments — choose open or minimal footwear: strappy sandals, slides, mules, espadrilles, white sneakers. NEVER choose boots or closed booties for lightweight summer fabrics. Heavy/warm fabrics (wool, tweed, velvet, corduroy, fleece, thick knit, leather) → boots, loafers, or closed shoes appropriate. Denim → versatile, match the wash and style. Be specific: 'tan leather slide sandals with thin strap' / 'white leather chunky-sole sneakers' / 'nude pointed-toe stiletto pumps' / 'tan suede ankle boots with low heel' / 'black strappy heeled sandals' / 'beige woven espadrille mules'. Match formality and color palette of the garment.",
  "is_long_top": true if garment hem reaches below the hip bone (long coats, trench coats, maxi cardigans, longline blazers) else false,
  "is_closed_front": true if the garment's front closure is VISIBLY FASTENED/CLOSED in the product image — all buttons buttoned, zipper fully zipped, coat/jacket front panels completely meeting and overlapping with NO gap; false if the garment is open-front by design (cardigan, open blazer, kimono, vest with no closures) OR if the closure is open/unfastened in the product photo,
  "photo_type": "flat-lay" if on a flat surface, "model" if worn by a visible person, "auto" if ghost/mannequin shot or unclear
}

Category rules:
- tops: single upper-body garment only — t-shirts, shirts, jackets, coats, sweaters, hoodies, blazers, vests
- bottoms: single lower-body garment only — pants, jeans, shorts, skirts, leggings
- one-pieces: anything covering the full body as a UNIT — dresses, jumpsuits, overalls, rompers, AND matching two-piece sets shown together (tracksuits, co-ord sets, pajama sets, suit sets) — if top and bottom are shown as a coordinated set in the SAME image, use one-pieces

CRITICAL RULES:
- Colors: always use precise shade names. Never say 'brown' when you can say 'cognac', 'chestnut', 'caramel', or 'chocolate'.
- texture_prompt must be generation-ready: short, dense with visual keywords, no filler words.
- Never skip hardware (zippers, buttons, buckles) — they define the garment's character.
- If the image shows BOTH a top and bottom garment as a coordinated matching set (tracksuit, co-ord, suit set, pajama set), ALWAYS use category "one-pieces" so the full outfit is shown from head to toe.
- CRITICAL — SEPARATE HANGERS / SIDE-BY-SIDE PHOTOS: If the image shows two garment pieces photographed separately (e.g. a top on one hanger and pants/skirt on another hanger, hanging side by side or on a door/wall), AND the two pieces share the same fabric, color, and clearly form a matching set — treat them as a SINGLE "one-pieces" coordinated set. Describe BOTH pieces together as a complete outfit. Do NOT analyze only the top piece.
- In proportion_hint for two-piece sets, describe BOTH the top length AND the pants/skirt length explicitly.
- ALWAYS describe sleeve length relative to the arm: full-length (wrist), 3/4 (mid-forearm), elbow, short (mid-bicep), cap. Never omit this — it anchors arm-to-body ratio in generation."""


_CATEGORY_FALLBACKS = {
    "tops": GarmentAnalysis(
        garment_type="top garment",
        category="tops",
        description="A top garment with defined neckline, visible fabric texture, and finished seams.",
        texture_prompt="fabric top with visible texture and finished seams",
        proportion_hint="hip-length hem, full-length sleeves",
        footwear="white leather sneakers",
    ),
    "bottoms": GarmentAnalysis(
        garment_type="bottom garment",
        category="bottoms",
        description="A bottom garment with waistband, defined silhouette, and finished hem.",
        texture_prompt="fabric bottom with visible texture and finished hem",
        proportion_hint="ankle-length hem",
        footwear="white leather sneakers",
    ),
    "one-pieces": GarmentAnalysis(
        garment_type="one-piece garment",
        category="one-pieces",
        description="A one-piece garment with continuous fabric and defined waistline.",
        texture_prompt="one-piece garment with visible fabric texture",
        proportion_hint="midi-length hem, full-length sleeves",
        footwear="nude pointed-toe pumps",
    ),
}


def _parse_response(text: str, fallback_category: str) -> GarmentAnalysis:
    """Claude'un JSON yanıtını parse eder, hata durumunda fallback döndürür."""
    try:
        # Bazen Claude ```json ... ``` içinde döndürüyor, temizle
        clean = text.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        data = json.loads(clean.strip())
        garment_type = str(data.get("garment_type", "garment")).strip()
        category = str(data.get("category", fallback_category)).strip()
        if category not in ("tops", "bottoms", "one-pieces"):
            category = fallback_category
        description = str(data.get("description", "")).strip()
        if not description:
            description = f"A {garment_type}."
        texture_prompt = str(data.get("texture_prompt", "")).strip()
        if not texture_prompt:
            texture_prompt = f"realistic {garment_type} with visible fabric texture"
        proportion_hint = str(data.get("proportion_hint", "")).strip()
        if not proportion_hint:
            proportion_hint = "full-length garment"
        footwear = str(data.get("footwear", "")).strip()
        if not footwear:
            footwear = "simple neutral footwear"
        is_long_top = bool(data.get("is_long_top", False))
        is_closed_front = bool(data.get("is_closed_front", False))
        photo_type = str(data.get("photo_type", "auto")).strip()
        if photo_type not in ("flat-lay", "model", "auto"):
            photo_type = "auto"
        return GarmentAnalysis(
            garment_type=garment_type,
            category=category,
            description=description,
            texture_prompt=texture_prompt,
            proportion_hint=proportion_hint,
            footwear=footwear,
            is_long_top=is_long_top,
            is_closed_front=is_closed_front,
            photo_type=photo_type,
        )
    except Exception:
        return _CATEGORY_FALLBACKS.get(fallback_category, _CATEGORY_FALLBACKS["tops"])


def _build_message_content(image_data: str, content_type: str) -> list:
    return [
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": content_type,
                "data": image_data,
            },
        },
        {
            "type": "text",
            "text": ANALYSIS_PROMPT,
        },
    ]


TREND_AESTHETICS: dict[str, dict] = {
    "quiet_luxury": {
        "name": "Quiet Luxury",
        "desc": "Elevated minimalism — The Row, Loro Piana, Max Mara. Understated sophistication, premium fabrics, tonal dressing.",
        "palette": "camel, ivory, oatmeal, warm beige, navy, slate grey, chocolate brown — no logos, no bold prints",
        "pants": "tailored wide-leg wool trousers in complementary neutral tone",
        "skirt": "A-line midi skirt in cashmere or crepe",
        "default_bottom": "tailored wide-leg trousers in complementary neutral",
        "footwear": "pointed-toe ballet flats or kitten-heel mules in nude or tan leather",
        "accessories": "structured leather tote bag, minimal gold jewelry, no visible logo",
        "styling": "clean tailored lines, monochrome or tonal, effortless quiet confidence",
    },
    "parisian_chic": {
        "name": "Parisian Chic",
        "desc": "Effortless French elegance. Classic, timeless, slightly undone.",
        "palette": "classic black, white, navy, ecru, beige, burgundy — simple and precise",
        "pants": "straight-leg dark cigarette trousers or slim-fit dark jeans",
        "skirt": "fitted A-line mini or midi pencil skirt",
        "default_bottom": "straight-leg dark jeans or slim cigarette trousers",
        "footwear": "pointed-toe leather loafers or simple ballet flats",
        "accessories": "silk neck scarf, minimal gold hoops, small structured leather bag",
        "styling": "effortless, slightly undone, confident and classic without trying too hard",
    },
    "corporate_siren": {
        "name": "Corporate Siren",
        "desc": "Power dressing 2026 — structured, commanding, polished.",
        "palette": "monochrome black, dove grey, camel, ivory, cobalt blue, chocolate brown",
        "pants": "wide-leg high-waisted tailored trousers",
        "skirt": "fitted knee-length pencil skirt",
        "default_bottom": "wide-leg high-waisted tailored trousers",
        "footwear": "pointed-toe stiletto pumps or square-toe block heels",
        "accessories": "structured top-handle handbag, minimal statement earrings, thin belt",
        "styling": "polished, powerful, sharp tailoring, strong confident silhouette",
    },
    "coastal_cool": {
        "name": "Coastal Cool",
        "desc": "Relaxed resort-inspired elegance. Natural fabrics, breezy, easy.",
        "palette": "sandy beige, ivory white, sky blue, terracotta, sage green, natural linen tones",
        "pants": "wide-leg linen trousers in natural white or sand",
        "skirt": "flowing midi skirt in linen or cotton",
        "default_bottom": "wide-leg linen trousers in natural white or sand",
        "footwear": "woven espadrille wedges or leather slide sandals",
        "accessories": "woven straw tote, simple gold chain, tortoiseshell sunglasses",
        "styling": "relaxed, natural, sun-kissed ease — effortless coastal elegance",
    },
    "street_luxe": {
        "name": "Street Luxe",
        "desc": "High-low mix — luxury pieces with streetwear energy.",
        "palette": "neutral base (black, grey, white) with one bold accent or monochrome",
        "pants": "straight-leg dark denim or wide-leg cargo trousers",
        "skirt": "midi skirt paired with clean sneakers",
        "default_bottom": "straight-leg dark denim or wide-leg cargo trousers",
        "footwear": "chunky white leather sneakers or low-profile clean trainers",
        "accessories": "minimal silver jewelry, crossbody bag",
        "styling": "relaxed confidence, oversized energy meets luxe fabric, streetwear elevated",
    },
    "romantic_feminine": {
        "name": "Romantik Feminen",
        "desc": "Soft, dreamy, ballet-core inspired. Feminine without being fussy.",
        "palette": "blush pink, ivory, lilac, sky blue, soft mint, warm cream — soft and delicate",
        "pants": "flowy wide-leg satin or chiffon trousers",
        "skirt": "layered tulle midi skirt or flowing chiffon skirt",
        "default_bottom": "flowy wide-leg trousers in soft satin or silk-like fabric",
        "footwear": "satin ballet flats or strappy kitten-heel sandals",
        "accessories": "delicate pearl jewelry, small embellished bag, satin ribbon detail",
        "styling": "soft, layered, ethereal, ballet-inspired grace — delicate and dreamy",
    },
}

TREND_SELECTION_PROMPT = """You are a 2026 fashion trend expert. Analyze this garment and select the single best matching trend aesthetic.

Aesthetics:
- quiet_luxury: Elevated minimalism, The Row / Max Mara style, neutral tones, premium fabrics, no logos
- parisian_chic: Effortless French elegance, classic black/navy/beige, timeless and slightly undone
- corporate_siren: Power dressing, structured tailoring, wide-leg trousers, pumps, commanding
- coastal_cool: Relaxed resort style, linen, natural tones, breezy and easy
- street_luxe: High-low mix, luxury + streetwear energy, sneakers, relaxed denim
- romantic_feminine: Ballet-core, soft pastels, satin, tulle, delicate and dreamy

Consider: formality level, fabric weight, color palette, silhouette, and occasion.
A wool coat → quiet_luxury or corporate_siren. A linen blazer → coastal_cool. A sequin dress → romantic_feminine or corporate_siren.

Respond ONLY with raw JSON (no markdown):
{"aesthetic": "one_of_the_six_keys", "reason": "one sentence"}"""


async def analyze_trend_styling(garment_url: str, aesthetic_override: str | None = None) -> dict:
    """
    Kıyafete uygun 2026 trend estetiğini belirler.
    aesthetic_override verilirse Claude seçimi yapmaz.
    Returns: {"aesthetic": str, "data": dict, "reason": str}
    """
    if aesthetic_override and aesthetic_override in TREND_AESTHETICS:
        return {
            "aesthetic": aesthetic_override,
            "data": TREND_AESTHETICS[aesthetic_override],
            "reason": "Kullanıcı seçimi",
        }

    if not settings.ANTHROPIC_API_KEY:
        return {"aesthetic": "quiet_luxury", "data": TREND_AESTHETICS["quiet_luxury"], "reason": "Default"}

    try:
        async with httpx.AsyncClient(timeout=20.0) as http:
            resp = await http.get(garment_url)
            resp.raise_for_status()
            ct = resp.headers.get("content-type", "image/jpeg").split(";")[0]
            img = base64.standard_b64encode(resp.content).decode("utf-8")

        msg = await _get_async_client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=128,
            messages=[{"role": "user", "content": [
                {"type": "image", "source": {"type": "base64", "media_type": ct, "data": img}},
                {"type": "text", "text": TREND_SELECTION_PROMPT},
            ]}],
        )
        text = msg.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        key = result.get("aesthetic", "quiet_luxury")
        if key not in TREND_AESTHETICS:
            key = "quiet_luxury"
        return {"aesthetic": key, "data": TREND_AESTHETICS[key], "reason": result.get("reason", "")}
    except Exception:
        return {"aesthetic": "quiet_luxury", "data": TREND_AESTHETICS["quiet_luxury"], "reason": "Default"}


def build_trend_outfit_prompt(analysis, trend: dict, is_closed_front: bool = False, crop_type: str = "full_body") -> str:
    """
    Trend estetiği + garment kategorisine göre kombin promptu oluşturur.
    crop_type="full_body" → ayaklar + ayakkabı görünür
    crop_type="half_body" → bel/kalçaya kadar, ayaklar yok
    """
    data = trend["data"]
    name = data["name"]
    garment = analysis.garment_type.lower()

    if crop_type == "half_body":
        frame = (
            "UPPER BODY shot from head to mid-thigh — "
            "DO NOT show feet or shoes, model cropped at mid-thigh level"
        )
    else:
        frame = (
            "FULL BODY shot from head to feet — entire outfit combination visible, "
            "feet and shoes clearly in frame, NO cropping at bottom"
        )

    # Bottom
    if analysis.category == "one-pieces":
        # Matching set mi (top+pants/skirt), yoksa elbise/tulum mu?
        gt = garment
        hint = analysis.proportion_hint.lower()
        is_matching_set = (
            any(k in gt for k in ("set", "suit", "tracksuit", "co-ord", "co ord", "pajama", "pyjama", "matching")) or
            any(k in hint for k in ("pants", "trousers", "wide-leg", "palazzo", "culotte"))
        )
        if is_matching_set:
            bottom_line = (
                "wearing the featured matching set as the complete outfit — "
                "top garment worn OUTSIDE the pants/skirt waistband exactly as shown in product image, NOT tucked in"
            )
        else:
            bottom_line = "wearing the featured dress/jumpsuit as the complete outfit"
    elif analysis.category == "bottoms":
        bottom_line = "the featured garment as the bottom piece"
    else:
        if any(k in garment for k in ("skirt",)):
            bottom = data["skirt"]
        else:
            bottom = data["pants"]
        bottom_line = f"{bottom} on the bottom"

    closure = (
        " FULLY BUTTONED AND CLOSED — all buttons fastened, front panels completely overlapping, NO gap"
        if is_closed_front else ""
    )

    # Garment proportion lock — pantolon + üst boy + kol uzunluğu hepsini kilitle
    proportion_lock = (
        f"CRITICAL GARMENT LENGTH LOCK — garment lengths are ABSOLUTE, not relative to model height or body size: "
        f"PANTS LENGTH: pants that reach the ankle in the product image MUST reach the ankle on the model — "
        f"do NOT shorten or crop pants legs for any body size; plus-size or full-figure models must also show full ankle-length pants; "
        f"TOP HEM: reproduce the exact hem position from the product — a cropped hoodie ending at the waist must NOT ride up further to expose the midriff or bare belly; "
        f"SLEEVE LENGTH: exact sleeve length from product — 3/4 stays 3/4, short stays short, do NOT shorten or lengthen; "
        f"PANTS ANKLE HEM: if product pants have a plain straight-cut ankle hem with NO elastic or ribbing, reproduce a plain straight open hem — "
        f"do NOT add elastic gathering, ribbing, ankle bands, or any cuffing at the pants ankle — ONLY the SLEEVE may have ribbed cuffs if described; "
        f"SIDE SLIT RULE: do NOT add side slits, leg splits, or vertical hem cuts — completely closed seams; "
        f"STYLING: garment worn EXACTLY as shown in product image — same drape, same layering, same positioning. "
        f"SIZE-INDEPENDENT: all proportions must be preserved identically regardless of model body size"
    )

    return (
        f"2026 {name} TREND AESTHETIC. {data['desc']} "
        f"Color palette: {data['palette']}. "
        f"Complete head-to-toe outfit: featured outer garment{closure}, {bottom_line}, "
        f"{data['footwear']} on feet, {data['accessories']}. "
        f"Styling mood: {data['styling']}. "
        f"{proportion_lock}. "
        f"{frame}"
    )


VERIFICATION_PROMPT = """You are a garment detail verification specialist for an AI virtual try-on system.
Your job: PREVENT hallucinations by explicitly cataloguing BOTH what IS present AND what is NOT present.
Study the garment image with extreme precision. Answer ONLY what you can clearly see — NEVER invent or guess.

Respond ONLY with a raw JSON object (no markdown, no code fences):
{
  "collar_type": "exact collar/neckline — e.g. 'notch lapel', 'stand collar', 'crew neck', 'V-neck', 'turtleneck', 'tie-neck', 'collarless'",
  "collar_color": "Write EXACTLY: 'same as body — [precise shade]' OR 'different — [precise color of collar]'",
  "button_count": "integer — count every visible button precisely. Write 0 if no buttons.",
  "button_color": "exact color and material — e.g. 'ivory resin', 'black plastic', 'gold metal', 'none'",
  "primary_color": "dominant color with precise shade — e.g. 'warm camel', 'ivory white', 'slate grey', 'deep burgundy'",
  "secondary_color": "second color if present — e.g. 'cream trim', 'none'",
  "lining_color": "visible lining/inner fabric — e.g. 'ivory satin lining', 'none visible'",
  "contrasting_elements": "elements in a DIFFERENT color from main body — e.g. 'black contrast collar', 'white piping along seams'. Write 'none' if garment is completely uniform color.",
  "fabric_pattern": "Write EXACTLY: 'solid / plain [color]' if no pattern. OR describe pattern precisely: 'vertical navy stripes on white', 'houndstooth black and white', 'floral print on ivory'.",
  "surface_details": "Any surface embellishments? — e.g. 'none / plain surface', 'chest embroidery [describe]', 'metal studs along collar', 'quilted diamond pattern', 'patch pockets with visible stitching'",
  "side_slits": "Examine outer leg seams and hem edges for any vertical slits or splits. Write EXACTLY: 'none — completely closed seams and hem' OR 'present — [location and approximate height e.g. outer leg seam, 15cm from hem]'",
  "hem_type": "Exact finish at the bottom hem edge — e.g. 'plain straight cut', 'ribbed knit cuff band', 'elastic gathered ankle', 'raw frayed hem', 'flared hem', 'scalloped trim', 'banded hem'",
  "pocket_details": "Describe ONLY clearly visible pockets — e.g. 'two side seam pockets', 'single chest patch pocket', 'four-pocket blazer style', 'none visible'. Do NOT guess hidden pockets.",
  "waist_details": "What is at the waist? — e.g. 'plain sewn waistband', 'exposed elastic waistband', 'concealed elastic waist', 'drawstring', 'self-tie belt', 'belt loops only', 'no visible waist seam'",
  "sleeve_termination": "How do sleeves end? — e.g. 'plain cut edge', 'ribbed knit cuff', 'elastic gathered cuff', 'buttoned cuff', 'lace trim edge', 'raw hem', 'not applicable — sleeveless'",
  "logo_details": "List ALL logos, text prints, and brand markings visible anywhere on the garment. For EACH logo write: EXACT text content (copy letter by letter), exact position on garment (e.g. 'right chest', 'left thigh along outer seam', 'back center', 'left sleeve'), color, size (small/medium/large), style (embroidered/printed/patch/woven label). Example: 'POLO text with polo player icon — right chest, white embroidery, small' AND 'Ralph Lauren script — left outer leg seam running vertically, white print, medium'. Write 'none' if no logos or text are visible.",
  "piping_details": "Describe any piping, trim strips, or contrast stitching lines on the garment. Write EXACTLY: 'none' if no piping. If present: color, path shape (curved/wavy/straight), and exact location — e.g. 'white curved piping along front zipper seam and side body seams', 'straight white piping along outer leg seam from hip to ankle'. Specify if the path is CURVED/WAVY or STRAIGHT — this is critical."
}"""


async def verify_garment_details(garment_url: str) -> dict:
    """
    İkinci geçiş: Yaka rengi, düğme sayısı ve kritik renk detaylarını doğrula.
    Hata durumunda boş dict döner (birinci analiz yeterli).
    """
    if not settings.ANTHROPIC_API_KEY:
        return {}
    try:
        async with httpx.AsyncClient(timeout=20.0) as http:
            resp = await http.get(garment_url)
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0]
            image_data = base64.standard_b64encode(resp.content).decode("utf-8")

        client = _get_async_client()
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": content_type, "data": image_data},
                    },
                    {"type": "text", "text": VERIFICATION_PROMPT},
                ],
            }],
        )
        text = message.content[0].text.strip()
        clean = text
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        return json.loads(clean.strip())
    except Exception:
        return {}


def build_verification_note(verification: dict) -> str:
    """
    Doğrulama sonucundan FASHN prompt'una eklenecek kesin garment fidelity talimatı üretir.
    İki bölüm: MUST REPRODUCE (var olanlar) + DO NOT ADD (olmayan ama AI'ın ekleyebileceği şeyler).
    """
    if not verification:
        return ""

    must = []   # Kesinlikle üretilmesi gerekenler
    forbid = [] # Kesinlikle eklenmemesi gerekenler

    # ── Renk ─────────────────────────────────────────────────────────────────
    primary_color = verification.get("primary_color", "")
    if primary_color:
        must.append(f"exact {primary_color} color — no color shift, no desaturation, no brightness change")

    secondary_color = verification.get("secondary_color", "")
    if secondary_color and secondary_color.lower() != "none":
        must.append(f"secondary color: {secondary_color}")

    # ── Yaka ─────────────────────────────────────────────────────────────────
    collar_type = verification.get("collar_type", "")
    collar_color = verification.get("collar_color", "")
    if collar_color:
        if "same as body" in collar_color.lower():
            color_val = collar_color.split("—")[-1].strip() if "—" in collar_color else primary_color
            must.append(f"{collar_type} is SAME color as body ({color_val})")
            forbid.append("different-colored collar, contrasting lapel facing, or dark collar trim")
        elif "different" in collar_color.lower():
            color_val = collar_color.split("—")[-1].strip() if "—" in collar_color else ""
            must.append(f"{collar_type} in {color_val} — reproduce this exact collar color")

    # ── Düğmeler ─────────────────────────────────────────────────────────────
    button_count = verification.get("button_count")
    button_color = verification.get("button_color", "none")
    if button_count is not None:
        bc = str(button_count)
        if bc == "0":
            forbid.append("any buttons — product has NO buttons")
        else:
            must.append(f"EXACTLY {bc} {button_color} buttons — do NOT add or remove any button")

    # ── Kontrast unsurlar ─────────────────────────────────────────────────────
    contrasting = verification.get("contrasting_elements", "")
    if contrasting:
        if contrasting.lower() == "none":
            must.append("completely uniform single-color garment")
            forbid.append("contrasting panels, piping, trim, or any different-colored element — garment is solid uniform color")
        else:
            must.append(f"contrasting elements exactly as in product: {contrasting}")

    # ── Desen / Kumaş paterni ────────────────────────────────────────────────
    fabric_pattern = verification.get("fabric_pattern", "")
    if fabric_pattern:
        if "solid" in fabric_pattern.lower() or "plain" in fabric_pattern.lower():
            must.append(f"solid plain fabric — no pattern, no print")
            forbid.append("stripes, checks, floral, geometric, or any printed pattern — fabric is SOLID")
        else:
            must.append(f"fabric pattern: {fabric_pattern} — reproduce EXACTLY, do NOT alter scale, color, or orientation")

    # ── Yüzey detayları ──────────────────────────────────────────────────────
    surface = verification.get("surface_details", "")
    if surface:
        if "none" in surface.lower() or "plain" in surface.lower():
            forbid.append("embroidery, studs, patches, quilting lines, or any surface embellishment — fabric surface is plain")
        else:
            must.append(f"surface details: {surface}")

    # ── Yan yırtmaç / slit ───────────────────────────────────────────────────
    side_slits = verification.get("side_slits", "")
    if side_slits:
        if "none" in side_slits.lower():
            forbid.append("side slits, leg splits, or any vertical cuts along seams or hem — completely CLOSED seams all around")
        else:
            must.append(f"side slits exactly as in product: {side_slits}")

    # ── Paça / Etek hem tipi ─────────────────────────────────────────────────
    hem_type = verification.get("hem_type", "")
    if hem_type:
        must.append(f"hem finish: {hem_type}")
        hem_lower = hem_type.lower()
        if "plain" in hem_lower or "straight" in hem_lower or "cut" in hem_lower:
            forbid.append("elastic cuffs, ribbed ankle bands, or any banding at hem — plain straight cut only")
        elif "ribbed" in hem_lower or "knit cuff" in hem_lower:
            must.append("ribbed knit cuff band at ankle — do NOT remove")
        elif "elastic" in hem_lower:
            must.append("elastic gathered cuff at ankle — do NOT remove")

    # ── Cep ──────────────────────────────────────────────────────────────────
    pocket_details = verification.get("pocket_details", "")
    if pocket_details:
        if "none" in pocket_details.lower():
            forbid.append("pockets of any kind — product has NO visible pockets")
        else:
            must.append(f"pockets exactly as visible: {pocket_details}")

    # ── Bel detayı ───────────────────────────────────────────────────────────
    waist_details = verification.get("waist_details", "")
    if waist_details:
        must.append(f"waist: {waist_details}")
        waist_lower = waist_details.lower()
        if "drawstring" not in waist_lower and "tie" not in waist_lower and "belt" not in waist_lower:
            forbid.append("drawstring, tie belt, visible belt, or any added waist cinching not in product")

    # ── Kol ucu ──────────────────────────────────────────────────────────────
    sleeve_end = verification.get("sleeve_termination", "")
    if sleeve_end and "not applicable" not in sleeve_end.lower():
        must.append(f"sleeve termination: {sleeve_end}")
        sleeve_lower = sleeve_end.lower()
        if "plain" in sleeve_lower or "cut" in sleeve_lower:
            forbid.append("ribbed cuffs, elastic cuffs, or buttons at sleeve end — plain cut sleeve only")
        elif "ribbed" in sleeve_lower:
            must.append("ribbed knit cuff at sleeve end — do NOT remove")

    # ── Logo / Marka yazısı ──────────────────────────────────────────────────
    logo_details = verification.get("logo_details", "")
    if logo_details:
        if logo_details.lower() == "none":
            forbid.append("any logos, brand text, or graphic prints — product has NO logos")
        else:
            # Her logo için ayrı MUST REPRODUCE + yasaklama kuralı
            must.append(
                f"logos/text EXACTLY as in product: {logo_details} — "
                f"reproduce EVERY logo at its exact position, exact text, exact color; "
                f"do NOT swap brand names, do NOT move logos to different positions, "
                f"do NOT add logos not listed above"
            )
            forbid.append(
                "any logo or text not explicitly listed above — "
                "only reproduce the exact logos described, no invented graphics"
            )

    # ── Piping / Biye ────────────────────────────────────────────────────────
    piping_details = verification.get("piping_details", "")
    if piping_details:
        if piping_details.lower() == "none":
            forbid.append("piping, trim strips, or contrast stitching lines — product has NO piping")
        else:
            piping_lower = piping_details.lower()
            must.append(f"piping/trim: {piping_details}")
            if "curved" in piping_lower or "wavy" in piping_lower:
                must.append(
                    "piping follows a CURVED/WAVY path — do NOT straighten into a vertical line or flat stripe"
                )
                forbid.append("straight vertical piping stripe — piping is curved/wavy, not straight")
            elif "straight" in piping_lower:
                must.append("piping is a STRAIGHT line — do NOT make it curved or wavy")
                forbid.append("curved or wavy piping — piping is straight")

    # ── Astar ────────────────────────────────────────────────────────────────
    lining = verification.get("lining_color", "")
    if lining and lining.lower() != "none visible":
        must.append(f"lining: {lining}")

    # ── Birleştir ────────────────────────────────────────────────────────────
    if not must and not forbid:
        return ""

    sections = []
    if must:
        sections.append("MUST REPRODUCE — " + "; ".join(must))
    if forbid:
        sections.append("DO NOT ADD — " + "; ".join(forbid))

    return "CRITICAL GARMENT VERIFICATION: " + " | ".join(sections) + "."


_SELECT_PROMPT = """You are a fashion photography quality evaluator. You will receive two try-on images (Image 1 and Image 2).
Choose the BETTER image based on these criteria in order of importance:
1. Full garment visible — no cropping at top, bottom, or sides. Feet must be in frame.
2. Correct garment proportions — garment length and sleeve length match a realistic body.
3. Color accuracy — garment color matches a real product photo (no color cast or major shift).
4. Lighting quality — soft even lighting, no harsh shadows obscuring garment details.

Respond ONLY with a raw JSON object:
{"best": 1}  or  {"best": 2}
No explanation. Just the JSON."""


async def select_best_image(url1: str, url2: str) -> int:
    """
    İki try-on görselini Claude Vision ile değerlendirip
    daha iyi olanın index'ini (1 veya 2) döndürür.
    Hata durumunda 1 döner.
    """
    if not settings.ANTHROPIC_API_KEY:
        return 1
    try:
        async with httpx.AsyncClient(timeout=30.0) as http:
            raw1 = (await http.get(url1)).content
            raw2 = (await http.get(url2)).content

        def _encode(raw: bytes) -> tuple[str, str]:
            ct = "image/png" if raw[:4] == b"\x89PNG" else "image/jpeg"
            return base64.standard_b64encode(raw).decode(), ct

        d1, ct1 = _encode(raw1)
        d2, ct2 = _encode(raw2)

        client = _get_async_client()
        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=32,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "Image 1:"},
                    {"type": "image", "source": {"type": "base64", "media_type": ct1, "data": d1}},
                    {"type": "text", "text": "Image 2:"},
                    {"type": "image", "source": {"type": "base64", "media_type": ct2, "data": d2}},
                    {"type": "text", "text": _SELECT_PROMPT},
                ],
            }],
        )
        data = json.loads(msg.content[0].text.strip())
        return int(data.get("best", 1))
    except Exception:
        return 1


async def analyze_garment(garment_url: str, category: str = "tops") -> GarmentAnalysis:
    """
    Kıyafet görselini Claude Vision ile analiz eder.
    Garment tipini, kategoriyi ve detaylı açıklamayı döndürür.
    """
    if not settings.ANTHROPIC_API_KEY:
        return _CATEGORY_FALLBACKS.get(category, _CATEGORY_FALLBACKS["tops"])

    try:
        async with httpx.AsyncClient(timeout=20.0) as http:
            resp = await http.get(garment_url)
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0]
            image_data = base64.standard_b64encode(resp.content).decode("utf-8")

        client = _get_async_client()
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": _build_message_content(image_data, content_type),
                }
            ],
        )
        return _parse_response(message.content[0].text, category)

    except Exception:
        return _CATEGORY_FALLBACKS.get(category, _CATEGORY_FALLBACKS["tops"])


def analyze_garment_sync(garment_url: str, category: str = "tops") -> GarmentAnalysis:
    """Celery worker için sync versiyon."""
    if not settings.ANTHROPIC_API_KEY:
        return _CATEGORY_FALLBACKS.get(category, _CATEGORY_FALLBACKS["tops"])

    try:
        with httpx.Client(timeout=20.0) as http:
            resp = http.get(garment_url)
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0]
            image_data = base64.standard_b64encode(resp.content).decode("utf-8")

        client = _get_sync_client()
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": _build_message_content(image_data, content_type),
                }
            ],
        )
        return _parse_response(message.content[0].text, category)

    except Exception:
        return _CATEGORY_FALLBACKS.get(category, _CATEGORY_FALLBACKS["tops"])


# ─────────────────────────────────────────────────────────────────────────────
# Post-generation kalite kontrolü
# ─────────────────────────────────────────────────────────────────────────────

QUALITY_CHECK_PROMPT = """You are a quality control specialist for an AI virtual try-on fashion system.

Compare the two images carefully:
- Image 1: PRODUCT IMAGE — the original garment photo (reference, ground truth)
- Image 2: RESULT IMAGE — the AI-generated try-on output

Your job: detect any discrepancy between what the product looks like and what was generated.
Be strict — this is commercial fashion content.

Respond ONLY with raw JSON (no markdown):
{
  "color_match": 1-5,
  "silhouette_match": 1-5,
  "detail_accuracy": 1-5,
  "overall_score": 1-5,
  "color_shift": "Describe the garment color in Image 1 (product) and Image 2 (result). If there is a significant shift — e.g. grey-brown becoming pink/mauve, beige becoming pink, navy becoming grey — describe it precisely. Write 'none' if color is accurate.",
  "hallucinations": ["list every detail ADDED in result but NOT present in product — e.g. 'side slits added', 'wrong logo text', 'extra buttons', 'stripes on solid fabric', 'elastic ankle cuffs on plain-hem pants', 'garment shortened exposing midriff'. Empty list if none."],
  "missing_details": ["list every detail visible in product but MISSING in result — e.g. 'logo missing', 'piping not shown', 'pocket absent'. Empty list if none."],
  "should_retry": true if overall_score <= 2 OR color_shift is not 'none' OR hallucinations list is non-empty OR garment is noticeably shorter than product, false only if overall_score >= 4 AND color_shift is 'none' AND no hallucinations,
  "retry_emphasis": "One precise instruction for the next attempt. If color shifted, write: 'COLOR FIX: garment color in product is [exact color] — do NOT shift to [wrong color], reproduce exact [correct color] with zero pink/mauve cast'. If length wrong: 'LENGTH FIX: pants must reach ankle — do NOT crop'. If detail wrong: describe exact fix."
}

Scoring guide:
5 = Excellent, commercial ready
4 = Good, minor issues only
3 = Acceptable, some noticeable errors
2 = Poor, major errors present
1 = Failed, completely wrong garment"""


async def check_generation_quality(product_url: str, result_url: str) -> dict:
    """
    Ürün görseli ile üretim sonucunu Claude Sonnet ile karşılaştırır.
    Kalite skoru, halüsinasyon listesi ve retry kararı döndürür.
    Hata durumunda varsayılan "acceptable" sonuç döner (üretimi bloke etmez).
    """
    _default = {
        "color_match": 3, "silhouette_match": 3, "detail_accuracy": 3,
        "overall_score": 3, "hallucinations": [], "missing_details": [],
        "should_retry": False, "retry_emphasis": "",
    }
    if not settings.ANTHROPIC_API_KEY:
        return _default
    try:
        client = _get_async_client()
        msg = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "Image 1 — PRODUCT (reference):"},
                    {"type": "image", "source": {"type": "url", "url": product_url}},
                    {"type": "text", "text": "Image 2 — RESULT (generated try-on):"},
                    {"type": "image", "source": {"type": "url", "url": result_url}},
                    {"type": "text", "text": QUALITY_CHECK_PROMPT},
                ],
            }],
        )
        text = msg.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        for k, v in _default.items():
            result.setdefault(k, v)
        return result
    except Exception:
        return _default
