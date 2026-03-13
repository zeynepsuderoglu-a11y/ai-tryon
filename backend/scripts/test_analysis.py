"""
Kıyafet analiz kalitesi test scripti.
Verilen görsel URL'si üzerinde tüm analiz geçişlerini çalıştırır
ve tam sonucu gösterir — FASHN çağrısı yapılmaz, kredi harcanmaz.

Kullanım:
  cd backend
  venv/bin/python3 scripts/test_analysis.py <gorsel_url_veya_dosya_yolu>
"""
import sys
import asyncio
import json
import base64
import os
from pathlib import Path

# Backend app'i import edebilmek için path ayarla
sys.path.insert(0, str(Path(__file__).parent.parent))

# .env'i yükle
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from app.services.garment_analysis_service import (
    analyze_garment,
    verify_garment_details,
    build_verification_note,
    analyze_trend_styling,
    build_trend_outfit_prompt,
)


def _sep(title: str):
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print('─' * 60)


async def run_test(image_source: str):
    # Dosya yolu ise önce Cloudinary'e yükle (ya da direkt base64 test)
    if image_source.startswith("http"):
        url = image_source
    else:
        # Yerel dosyadan Cloudinary'e yükle
        from app.services.cloudinary_service import cloudinary_service
        with open(image_source, "rb") as f:
            raw = f.read()
        result = cloudinary_service.upload_file(raw, folder="tryon/test")
        url = result["secure_url"]
        print(f"✓ Cloudinary'e yüklendi: {url}")

    print(f"\n🔍 Test görseli: {url[:80]}...")

    # ── 1. Ana garment analizi (Sonnet) ──────────────────────────────────────
    _sep("1 / 4 — ANA TANIM  (Claude Sonnet)")
    analysis = await analyze_garment(url, "auto")
    print(f"  garment_type    : {analysis.garment_type}")
    print(f"  category        : {analysis.category}")
    print(f"  is_long_top     : {analysis.is_long_top}")
    print(f"  is_closed_front : {analysis.is_closed_front}")
    print(f"  photo_type      : {analysis.photo_type}")
    print(f"\n  proportion_hint :\n    {analysis.proportion_hint}")
    print(f"\n  texture_prompt  :\n    {analysis.texture_prompt}")
    print(f"\n  footwear        : {analysis.footwear}")
    print(f"\n  description     :\n    {analysis.description}")

    # ── 2. Doğrulama geçişi (Haiku) ──────────────────────────────────────────
    _sep("2 / 4 — DOĞRULAMA DETAYLARI  (Claude Haiku)")
    verification = await verify_garment_details(url)
    print(json.dumps(verification, indent=2, ensure_ascii=False))

    # ── 3. Verification notu ──────────────────────────────────────────────────
    _sep("3 / 4 — FASHN PROMPT'UNA GÖNDERILEN DOĞRULAMA NOTU")
    note = build_verification_note(verification)
    if note:
        # Okunabilirlik için bölümlere ayır
        for part in note.split(" | "):
            print(f"\n  {part}")
    else:
        print("  (boş — verification sonuç üretmedi)")

    # ── 4. Trend + kombin ─────────────────────────────────────────────────────
    _sep("4 / 4 — TREND ESTETİĞİ + KOMBİN PROMPTU")
    trend = await analyze_trend_styling(url)
    print(f"  Seçilen estetik : {trend['aesthetic']}  ({trend['reason']})")
    outfit = build_trend_outfit_prompt(analysis, trend, analysis.is_closed_front, "full_body")
    print(f"\n  Outfit prompt   :\n    {outfit}")

    _sep("ÖZET")
    print(f"  ✓ Kıyafet tipi   : {analysis.garment_type}")
    print(f"  ✓ Kategori       : {analysis.category}")
    print(f"  ✓ Trend          : {trend['aesthetic']}")
    v_score = sum([
        1 if verification.get("side_slits") else 0,
        1 if verification.get("hem_type") else 0,
        1 if verification.get("logo_details") else 0,
        1 if verification.get("piping_details") else 0,
        1 if verification.get("fabric_pattern") else 0,
    ])
    print(f"  ✓ Yakalanan detay sayısı (5 kritik alan): {v_score}/5")
    print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Kullanım: venv/bin/python3 scripts/test_analysis.py <url_veya_dosya_yolu>")
        sys.exit(1)
    asyncio.run(run_test(sys.argv[1]))
