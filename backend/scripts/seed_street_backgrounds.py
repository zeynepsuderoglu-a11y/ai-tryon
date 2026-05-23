"""
Üretilen sokak arka plan görsellerini veritabanına ekler.
Mevcut key varsa günceller (upsert), yoksa ekler.

Kullanım (container içinde):
    python /app/scripts/seed_street_backgrounds.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

STREET_BACKGROUNDS = [
    {
        "key": "istanbul_istiklal",
        "label": "İstiklal Caddesi",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779535846/backgrounds/street/istanbul_istiklal.jpg",
        "description": "İstanbul İstiklal Caddesi, nostaljik tramvay ve tarihi binalar, altın öğle ışığı",
        "sort_order": 22,
    },
    {
        "key": "paris_cobblestone",
        "label": "Paris Sokağı",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779535861/backgrounds/street/paris_cobblestone.jpg",
        "description": "Paris dar arnavutkaldırımlı sokak, Haussmann binaları, çiçekli balkonlar",
        "sort_order": 23,
    },
    {
        "key": "soho_ny",
        "label": "New York SoHo",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779535876/backgrounds/street/soho_ny.jpg",
        "description": "SoHo New York, dökme demir mimari, altın saat gün batımı, kentsel editorial",
        "sort_order": 24,
    },
    {
        "key": "milan_galleria",
        "label": "Milano Galerisi",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779535890/backgrounds/street/milan_galleria.jpg",
        "description": "Galleria Vittorio Emanuele II Milano, cam kubbe, lüks butikler, altın ışık",
        "sort_order": 25,
    },
    {
        "key": "tokyo_shibuya_neon",
        "label": "Tokyo Neon",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779535904/backgrounds/street/tokyo_shibuya_neon.jpg",
        "description": "Tokyo gece sokağı, neon ışıkları, yağmur yansımaları, Shibuya editorial",
        "sort_order": 26,
    },
    {
        "key": "london_notting_hill",
        "label": "Londra Notting Hill",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779535918/backgrounds/street/london_notting_hill.jpg",
        "description": "Notting Hill renkli evler, pastel cephe, İngiliz gün ışığı, British Vogue",
        "sort_order": 27,
    },
    {
        "key": "beyoglu_gece",
        "label": "Beyoğlu Gece",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779535931/backgrounds/street/beyoglu_gece.jpg",
        "description": "Beyoğlu gece, Galata Kulesi fonu, ıslak arnavutkaldırım, sokak lambaları",
        "sort_order": 28,
    },
    {
        "key": "barcelona_gothic",
        "label": "Barselona Gotik",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779535945/backgrounds/street/barcelona_gothic.jpg",
        "description": "Barselona Gotik Çeyrek, ortaçağ taş kemerler, pembe bougainvillea, Akdeniz ışığı",
        "sort_order": 29,
    },
]


async def seed():
    from app.core.database import AsyncSessionLocal
    from app.models.background import Background
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        added = 0
        updated = 0
        for b in STREET_BACKGROUNDS:
            existing = (await db.execute(
                select(Background).where(Background.key == b["key"])
            )).scalar_one_or_none()

            if existing:
                existing.label = b["label"]
                existing.image_url = b["image_url"]
                existing.description = b["description"]
                existing.sort_order = b["sort_order"]
                updated += 1
                print(f"  ~ güncellendi: {b['key']}")
            else:
                db.add(Background(
                    key=b["key"],
                    label=b["label"],
                    image_url=b["image_url"],
                    description=b["description"],
                    sort_order=b["sort_order"],
                    is_active=True,
                ))
                added += 1
                print(f"  + eklendi: {b['key']}")

        await db.commit()
        print(f"\nTamamlandı: {added} yeni, {updated} güncellendi.")


if __name__ == "__main__":
    asyncio.run(seed())
