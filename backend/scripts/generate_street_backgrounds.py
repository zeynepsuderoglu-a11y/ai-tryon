"""
Profesyonel katalog çekimi için sokak arka planı görselleri üretir.
Gemini 2.5 Flash Image → 4x upscale → Cloudinary

Kullanım:
    cd backend
    python scripts/generate_street_backgrounds.py
"""
import io
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

GEMINI_API_KEY       = os.environ["GEMINI_API_KEY"]
CLOUDINARY_CLOUD     = os.environ["CLOUDINARY_CLOUD_NAME"]
CLOUDINARY_API_KEY   = os.environ["CLOUDINARY_API_KEY"]
CLOUDINARY_SECRET    = os.environ["CLOUDINARY_API_SECRET"]

# ─── Cloudinary ───────────────────────────────────────────────────────────────
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_SECRET,
)

# ─── Sokak arka planı tanımları ───────────────────────────────────────────────
STREET_BACKGROUNDS = [
    {
        "key": "istanbul_istiklal",
        "label": "İstanbul İstiklal",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "İstiklal Avenue Istanbul, historic red nostalgic tram tracks on cobblestone street, "
            "European-style ornate building facades with warm stone textures, "
            "soft golden afternoon light filtering through the street, "
            "background filled with elegant blurred pedestrians creating depth and life, "
            "foreground completely empty and clean — subject will be composited here, "
            "shot with 85mm portrait lens at f/1.8, extreme shallow depth of field, "
            "background intentionally soft bokeh so clothing subject pops in sharp focus, "
            "cinematic color grading, warm amber tones, editorial fashion magazine quality, "
            "no text, no watermark, no people in sharp focus foreground, "
            "4K ultra detailed, professional studio-grade photography"
        ),
    },
    {
        "key": "paris_cobblestone",
        "label": "Paris Sokağı",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Iconic narrow Parisian cobblestone side street, classic Haussmann limestone buildings, "
            "iron balconies with flowers, warm café awnings, soft diffused morning light, "
            "blurred pedestrians and cyclists in background adding authentic urban life, "
            "foreground completely empty and neutral — subject will be placed here, "
            "shot at f/2.0 85mm lens, creamy bokeh background melting into soft focus, "
            "subject area left clean with natural stone pavement, "
            "editorial Vogue Paris fashion photography aesthetic, "
            "soft warm pastel tones, romantic atmosphere, "
            "no sharp faces, no text, 4K ultra detailed"
        ),
    },
    {
        "key": "soho_ny",
        "label": "New York SoHo",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "SoHo New York cast-iron architecture district, wide cobblestone street, "
            "industrial loft buildings with large windows, fire escape ladders on facades, "
            "golden hour sunlight creating long dramatic shadows across the street, "
            "background filled with blurred yellow taxis and fashionable pedestrians, "
            "foreground clean and open for model compositing, "
            "shot at f/1.4 85mm prime lens, extreme bokeh separation, "
            "cool urban editorial tones, high contrast cinematic look, "
            "Harper's Bazaar editorial fashion photography quality, "
            "no text, no sharp people in foreground, 4K ultra detailed"
        ),
    },
    {
        "key": "milan_galleria",
        "label": "Milano Galerisi",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Galleria Vittorio Emanuele II Milan, magnificent glass-domed arcade interior, "
            "ornate mosaic floor patterns, grand arching iron and glass ceiling, "
            "luxury boutique storefronts with elegant window displays on sides, "
            "warm golden light flooding through the glass dome from above, "
            "blurred fashionable shoppers creating depth in background, "
            "foreground completely empty and clean for fashion subject, "
            "shot at f/2.0 85mm, soft bokeh background, "
            "luxury editorial fashion photography, warm golden sophisticated tones, "
            "Vogue Italia aesthetic, no sharp faces, no text, 4K ultra detailed"
        ),
    },
    {
        "key": "tokyo_shibuya_neon",
        "label": "Tokyo Gece Sokağı",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Tokyo Shibuya or Harajuku back alley at blue hour dusk, "
            "neon signs in Japanese reflecting on wet rain-slicked street pavement, "
            "colorful glowing lanterns and shop signs creating vibrant bokeh light orbs, "
            "background filled with blurred umbrella-holding pedestrians in motion, "
            "foreground clean empty wet pavement for fashion model compositing, "
            "shot at f/1.4 85mm, extreme neon bokeh orbs floating in background, "
            "cinematic fashion film aesthetic, cool cyan and magenta tones, "
            "W Magazine editorial quality, no sharp faces, no text, 4K ultra detailed"
        ),
    },
    {
        "key": "london_notting_hill",
        "label": "Londra Notting Hill",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Notting Hill London, pastel-painted terraced townhouses in pink blue yellow cream, "
            "classic black iron railings and window boxes with flowers, "
            "overcast soft British daylight creating perfect diffused shadowless illumination, "
            "background with blurred pedestrians and parked vintage vehicles, "
            "foreground empty clean for fashion subject placement, "
            "shot at f/2.0 85mm portrait lens, soft dreamy background separation, "
            "pastel editorial fashion photography, soft natural tones, "
            "British Vogue aesthetic, no sharp faces, no text, 4K ultra detailed"
        ),
    },
    {
        "key": "beyoglu_gece",
        "label": "Beyoğlu Gece",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Beyoğlu Istanbul at night, historic Galata tower glowing in background, "
            "narrow atmospheric cobblestone street with warm orange street lamps, "
            "traditional Ottoman-era stone buildings with illuminated café and restaurant windows, "
            "background filled with blurred couples and fashionable pedestrians, "
            "wet cobblestones reflecting golden lamplight creating magical glow, "
            "foreground completely clean empty for fashion model, "
            "shot at f/1.4 85mm, extreme warm bokeh orbs floating in background, "
            "romantic cinematic fashion editorial, warm amber and gold tones, "
            "no sharp faces, no text, 4K ultra detailed"
        ),
    },
    {
        "key": "barcelona_gothic",
        "label": "Barselona Gotik",
        "prompt": (
            "Professional fashion catalog background photograph. "
            "Gothic Quarter Barcelona, ancient stone archways and narrow medieval lanes, "
            "warm Mediterranean afternoon sunlight casting dappled shadows on stone walls, "
            "bougainvillea flowers cascading over old stone walls in vibrant pink, "
            "blurred tourists and locals creating authentic European street life in background, "
            "foreground clean open cobblestone for fashion subject, "
            "shot at f/2.0 85mm, warm bokeh background separation, "
            "vibrant warm Mediterranean editorial fashion tones, "
            "editorial fashion magazine quality, no sharp faces, no text, 4K"
        ),
    },
]

# ─── Üretim fonksiyonu ────────────────────────────────────────────────────────

def generate_background(entry: dict) -> str | None:
    """Tek bir arka plan görseli üretir, Cloudinary'e yükler, URL döner."""
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
                        types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_ONLY_HIGH"),
                        types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_ONLY_HIGH"),
                        types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_ONLY_HIGH"),
                    ],
                ),
            )

            if not response.candidates:
                print(f"  [attempt {attempt}] Candidate yok, tekrar deneniyor")
                time.sleep(3)
                continue

            candidate = response.candidates[0]
            if candidate.content is None:
                print(f"  [attempt {attempt}] Content None (finish_reason={getattr(candidate,'finish_reason','?')})")
                time.sleep(3)
                continue

            for part in candidate.content.parts:
                if part.inline_data is not None:
                    # 4x upscale
                    img = PILImage.open(io.BytesIO(part.inline_data.data)).convert("RGB")
                    w, h = img.size
                    print(f"  Gemini çıktısı: {w}x{h}px — upscale başlıyor")
                    img_up = upscale_pil(img)
                    w2, h2 = img_up.size
                    print(f"  Upscale tamamlandı: {w2}x{h2}px")

                    buf = io.BytesIO()
                    img_up.save(buf, format="JPEG", quality=95)
                    img_bytes = buf.getvalue()

                    # Cloudinary yükle
                    result = cloudinary.uploader.upload(
                        img_bytes,
                        folder="backgrounds/street",
                        public_id=entry["key"],
                        overwrite=True,
                        resource_type="image",
                    )
                    url = result["secure_url"]
                    print(f"  ✓ Cloudinary: {url}")
                    return url

            print(f"  [attempt {attempt}] Görsel part bulunamadı")
            time.sleep(3)

        except Exception as e:
            print(f"  [attempt {attempt}] Hata: {e}")
            time.sleep(5)

    print(f"  ✗ {entry['key']} üretilemedi")
    return None


# ─── Ana akış ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Sokak arka planları üret")
    parser.add_argument("--keys", nargs="*", help="Sadece bu key'leri üret (boşsa hepsi)")
    args = parser.parse_args()

    targets = STREET_BACKGROUNDS
    if args.keys:
        targets = [b for b in STREET_BACKGROUNDS if b["key"] in args.keys]
        print(f"Seçili: {[b['key'] for b in targets]}")

    print(f"Toplam {len(targets)} arka plan üretilecek\n")
    results = {}

    for entry in targets:
        url = generate_background(entry)
        results[entry["key"]] = url
        # Rate limit için kısa bekleme
        time.sleep(4)

    # ─── Özet ─────────────────────────────────────────────────────────────────
    print("\n" + "="*60)
    print("SONUÇLAR:")
    print("="*60)
    for key, url in results.items():
        status = "✓" if url else "✗"
        label = next(b["label"] for b in STREET_BACKGROUNDS if b["key"] == key)
        print(f"  {status}  {key:30s}  {label}")
        if url:
            print(f"      {url}")

    success = sum(1 for u in results.values() if u)
    print(f"\n{success}/{len(targets)} başarıyla üretildi.")

    # ─── DB seed için hazır snippet ───────────────────────────────────────────
    print("\n--- Veritabanı seed için URL'ler ---")
    for entry in targets:
        url = results.get(entry["key"])
        if url:
            print(f'("{entry["key"]}", "{entry["label"]}", "{url}"),')
