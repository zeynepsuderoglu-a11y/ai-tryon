"""
Sahil & kıyı kasabası arka plan görselleri üretir.
Gemini 2.5 Flash Image → 4x upscale → Cloudinary

Kullanım (container içinde):
    python /app/scripts/generate_coastal_backgrounds.py
"""
import io
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
except ImportError:
    pass

GEMINI_API_KEY   = os.environ["GEMINI_API_KEY"]
CLOUDINARY_CLOUD = os.environ["CLOUDINARY_CLOUD_NAME"]
CLOUDINARY_KEY   = os.environ["CLOUDINARY_API_KEY"]
CLOUDINARY_SEC   = os.environ["CLOUDINARY_API_SECRET"]

import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD,
    api_key=CLOUDINARY_KEY,
    api_secret=CLOUDINARY_SEC,
)

# ─────────────────────────────────────────────────────────────────────────────
COASTAL_BACKGROUNDS = [
    # ── Alaçatı serisi ──────────────────────────────────────────────────────
    {
        "key": "alacati_sokak",
        "label": "Alaçatı Sokağı",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Alaçatı İzmir Turkey, authentic Aegean stone-paved narrow alley, "
            "old whitewashed stone houses with traditional wooden shutters painted in soft blue and terracotta, "
            "walls completely covered with cascading bougainvillea in vivid magenta and coral pink, "
            "hanging lanterns and handmade shop signs swaying gently, "
            "warm golden afternoon Aegean sunlight creating dappled shadow patterns on the stone floor, "
            "background naturally filled with blurred leisurely tourists and local couples strolling — "
            "people intentionally out of focus creating authentic holiday atmosphere and depth, "
            "foreground stone pavement completely empty and clean — fashion subject will be composited here, "
            "shot with 85mm portrait lens at f/1.8, creamy background bokeh separating subject perfectly, "
            "warm Mediterranean color palette — amber, terracotta, magenta bougainvillea, "
            "editorial fashion photography quality, Vogue Turkey aesthetic, "
            "no text, no sharp faces in foreground, 4K ultra detailed photorealistic"
        ),
    },
    {
        "key": "alacati_kafesokaği",
        "label": "Alaçatı Kafe",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Alaçatı İzmir charming outdoor café terrace on cobblestone street, "
            "rattan wicker chairs and round marble-top tables under large white canvas parasols, "
            "old stone walls draped with heavy bougainvillea curtains in deep fuchsia and white, "
            "potted herbs and colorful ceramic pots lining the low stone walls, "
            "gentle Aegean afternoon light filtering through the bougainvillea creating golden dappled patches, "
            "background filled with blurred seated café guests sipping drinks, soft chatter atmosphere, "
            "foreground terrace area clean and empty for fashion subject placement, "
            "shot at f/1.8 85mm, warm soft background bokeh, "
            "Turkish Riviera editorial lifestyle fashion photography, "
            "warm amber and fuchsia tones, no sharp faces, no text, 4K ultra detailed"
        ),
    },
    {
        "key": "alacati_degirmen",
        "label": "Alaçatı Değirmen",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Alaçatı windmill district, iconic traditional stone windmills on gentle hilltop, "
            "wild lavender and yellow wildflowers covering the rolling Aegean hillside, "
            "panoramic view of the Aegean sea shimmering turquoise blue in the far background, "
            "rustic stone terrace wall in foreground at golden hour late afternoon, "
            "background with blurred silhouettes of tourists exploring the windmills, "
            "foreground completely clean open terrace for fashion model, "
            "shot at f/2.0 85mm, soft bokeh on distant sea and windmills, "
            "wide cinematic fashion editorial, warm golden Aegean tones, "
            "no sharp faces, no text, 4K ultra detailed photorealistic"
        ),
    },
    # ── Sahil serisi ─────────────────────────────────────────────────────────
    {
        "key": "ege_sahil_promenad",
        "label": "Ege Sahil Yolu",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Aegean coast Turkey, elevated seaside promenade walkway above crystal turquoise water, "
            "white stone balustrade railing overlooking the sparkling blue-green Aegean sea, "
            "lush bougainvillea tumbling over the white walls in vibrant orange and pink, "
            "traditional whitewashed fishermen houses and blue-shuttered buildings visible in mid-ground, "
            "late afternoon golden sun casting long warm shadows across the promenade, "
            "background naturally filled with blurred strolling couples and holiday walkers, "
            "foreground promenade completely open and clean for fashion subject, "
            "shot at f/1.8 85mm, dreamy bokeh on sea and background figures, "
            "luxury Turkish Riviera editorial fashion photography, warm turquoise and gold palette, "
            "no text, no sharp faces, 4K ultra detailed"
        ),
    },
    {
        "key": "sahil_kasabasi_liman",
        "label": "Sahil Kasabası",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Authentic small Aegean fishing harbor village Turkey, colorful wooden fishing boats "
            "moored in calm turquoise harbor water reflecting the morning light, "
            "traditional whitewashed and pastel-painted fishermen houses stacked up the hillside, "
            "charming waterfront café terraces with tables right at the water edge, "
            "fishing nets and ropes adding authentic texture, "
            "background filled with blurred local fishermen mending nets, tourists at café tables, "
            "foreground wooden dock or harbor promenade clean and empty for fashion subject, "
            "shot at f/1.8 85mm, creamy bokeh on harbor and boats, "
            "authentic Mediterranean coastal editorial fashion, warm teal and terracotta palette, "
            "no text, no sharp faces, 4K ultra detailed photorealistic"
        ),
    },
    {
        "key": "plaj_altin_saat",
        "label": "Plaj Altın Saat",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Pristine Aegean beach at golden hour sunset, fine white sand beach with gentle wave lapping, "
            "turquoise water transitioning to deep sapphire near the horizon, "
            "sun low on the horizon casting long dramatic warm golden and orange reflections on wet sand, "
            "background populated with blurred beachgoers under colorful sun umbrellas, "
            "silhouettes of people at the water's edge, children playing in distant surf, "
            "foreground wide open clean dry sand area for fashion subject, "
            "shot at f/2.0 85mm, extreme golden bokeh glow on background figures and water, "
            "cinematic beach fashion editorial, warm coral gold and turquoise palette, "
            "Sports Illustrated meets Vogue aesthetic, no text, no sharp faces, 4K ultra detailed"
        ),
    },
    {
        "key": "bodrum_beyaz",
        "label": "Bodrum Beyazı",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Bodrum Turkey iconic whitewashed architecture, brilliant white cubic houses "
            "cascading down the hillside toward the deep blue Aegean sea, "
            "vivid cobalt blue shutters, doors, and flower pots contrasting the white walls, "
            "bougainvillea in bright fuchsia and red spilling over white courtyard walls, "
            "background featuring the Bodrum castle silhouette above the marina with sailing yachts, "
            "blurred leisurely tourists and local residents adding authentic life to the scene, "
            "foreground whitewashed terrace or narrow alley clean and open for fashion subject, "
            "shot at f/1.8 85mm, soft dreamy bokeh on sea, castle, and background figures, "
            "luxury Bodrum editorial fashion photography, white and cobalt blue palette, "
            "no text, no sharp faces, 4K ultra detailed"
        ),
    },
    {
        "key": "cesme_sahili",
        "label": "Çeşme Sahili",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Çeşme İzmir waterfront, crystal clear shallow turquoise Aegean water over white sand, "
            "colorful beach clubs with white daybeds and blue parasols lining the shore, "
            "historic Çeşme castle stone fortress visible in the misty background, "
            "sailing boats anchored in the bay, windsurfers in the distance, "
            "background naturally filled with blurred sunbathing holidaymakers and beachgoers, "
            "foreground clean white sand or beach promenade open for fashion model, "
            "shot at f/1.8 85mm, dreamy bokeh on water and background crowd, "
            "Aegean luxury beach fashion editorial, aquamarine and white palette, "
            "no text, no sharp faces, 4K ultra detailed photorealistic"
        ),
    },
    {
        "key": "santorini_manzara",
        "label": "Santorini",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Santorini Greece Oia village, iconic white Cycladic cubic architecture "
            "with famous cobalt blue domed church roof under clear azure sky, "
            "dramatic volcanic caldera cliff dropping to deep indigo Aegean sea far below, "
            "warm late afternoon light painting the white buildings in golden peach glow, "
            "narrow white stone alley with wooden blue doors and bougainvillea, "
            "background with blurred tourists and honeymooners exploring the famous viewpoint, "
            "foreground alley or terrace completely clean and open for fashion subject, "
            "shot at f/1.8 85mm, cinematic bokeh on sea, caldera, and background figures, "
            "luxury Vogue Greece editorial fashion photography, white cobalt and gold palette, "
            "no text, no sharp faces, 4K ultra detailed photorealistic"
        ),
    },
    {
        "key": "mavi_tekne_yolu",
        "label": "Mavi Yolculuk",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Turkish blue voyage gulet wooden boat deck scene, traditional wooden gulet yacht "
            "anchored in a secluded Aegean turquoise cove, dramatic rocky pine-clad cliffs surrounding, "
            "crystal clear green-blue water visible over the wooden boat railing, "
            "white sun awning casting soft shadow on polished teak deck, "
            "other classic wooden gulets visible in background on the calm cove, "
            "background with blurred holidaymakers relaxing on deck and swimming in cove, "
            "foreground clean open teak deck area for fashion subject, "
            "shot at f/2.0 85mm, dreamy bokeh on water, cliffs, and background boats, "
            "luxury Aegean sailing lifestyle fashion editorial, teal and warm wood palette, "
            "no text, no sharp faces, 4K ultra detailed photorealistic"
        ),
    },
]

# ─────────────────────────────────────────────────────────────────────────────

def generate_one(entry: dict) -> str | None:
    from google import genai
    from google.genai import types
    from PIL import Image as PILImage
    from app.services.upscale_service import upscale_pil

    client = genai.Client(api_key=GEMINI_API_KEY)
    print(f"\n[{entry['key']}] Üretiliyor: {entry['label']}")

    for attempt in range(1, 4):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=[entry["prompt"]],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                    temperature=1.0,
                    safety_settings=[
                        types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_ONLY_HIGH"),
                        types.SafetySetting(category="HARM_CATEGORY_HARASSMENT",         threshold="BLOCK_ONLY_HIGH"),
                        types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH",        threshold="BLOCK_ONLY_HIGH"),
                        types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT",  threshold="BLOCK_ONLY_HIGH"),
                    ],
                ),
            )

            if not response.candidates:
                print(f"  [attempt {attempt}] candidate yok")
                time.sleep(4)
                continue

            candidate = response.candidates[0]
            if candidate.content is None:
                print(f"  [attempt {attempt}] content=None (finish={getattr(candidate,'finish_reason','?')})")
                time.sleep(4)
                continue

            for part in candidate.content.parts:
                if part.inline_data is not None:
                    img = PILImage.open(io.BytesIO(part.inline_data.data)).convert("RGB")
                    w, h = img.size
                    print(f"  Gemini: {w}x{h}px → upscale başlıyor")
                    img_up = upscale_pil(img)
                    w2, h2 = img_up.size
                    buf = io.BytesIO()
                    img_up.save(buf, format="JPEG", quality=95)

                    result = cloudinary.uploader.upload(
                        buf.getvalue(),
                        folder="backgrounds/coastal",
                        public_id=entry["key"],
                        overwrite=True,
                        resource_type="image",
                    )
                    url = result["secure_url"]
                    print(f"  ✓ {w2}x{h2}px → {url}")
                    return url

            print(f"  [attempt {attempt}] görsel part yok")
            time.sleep(4)

        except Exception as exc:
            print(f"  [attempt {attempt}] hata: {exc}")
            time.sleep(6)

    print(f"  ✗ {entry['key']} üretilemedi")
    return None


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--keys", nargs="*")
    args = parser.parse_args()

    targets = COASTAL_BACKGROUNDS
    if args.keys:
        targets = [b for b in COASTAL_BACKGROUNDS if b["key"] in args.keys]

    print(f"Toplam {len(targets)} sahil/kıyı arka planı üretilecek\n")
    results: dict[str, str | None] = {}

    for entry in targets:
        results[entry["key"]] = generate_one(entry)
        time.sleep(4)

    print("\n" + "=" * 60)
    print("SONUÇLAR:")
    print("=" * 60)
    for key, url in results.items():
        label = next(b["label"] for b in COASTAL_BACKGROUNDS if b["key"] == key)
        mark  = "✓" if url else "✗"
        print(f"  {mark}  {key:30s}  {label}")
        if url:
            print(f"      {url}")

    ok = sum(1 for u in results.values() if u)
    print(f"\n{ok}/{len(targets)} başarıyla üretildi.")

    print("\n--- DB seed snippet ---")
    for entry in targets:
        url = results.get(entry["key"])
        if url:
            print(f'("{entry["key"]}", "{entry["label"]}", "{url}"),')
