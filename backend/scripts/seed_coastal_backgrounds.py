"""
Sahil & kıyı kasabası arka planlarını veritabanına ekler (upsert).
"""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

COASTAL_BACKGROUNDS = [
    {
        "key": "alacati_sokak",
        "label": "Alaçatı Sokağı",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779536457/backgrounds/coastal/alacati_sokak.jpg",
        "description": "Alaçatı İzmir, tarihi taş sokak, bougainvillea, Ege öğle ışığı, bulanık yayalar",
        "sort_order": 30,
    },
    {
        "key": "alacati_kafe",
        "label": "Alaçatı Kafe",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779536471/backgrounds/coastal/alacati_kafesoka%C4%9Fi.jpg",
        "description": "Alaçatı açık hava kafe terası, hasır sandalyeler, bougainvillea, Ege ışığı",
        "sort_order": 31,
    },
    {
        "key": "alacati_degirmen",
        "label": "Alaçatı Değirmen",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779536484/backgrounds/coastal/alacati_degirmen.jpg",
        "description": "Alaçatı taş yel değirmenleri, lavanta tarlası, uzakta Ege mavisi",
        "sort_order": 32,
    },
    {
        "key": "ege_sahil_promenad",
        "label": "Ege Sahil Yolu",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779536498/backgrounds/coastal/ege_sahil_promenad.jpg",
        "description": "Ege kıyı promenadı, beyaz taş korkuluk, turkuaz deniz, bougainvillea",
        "sort_order": 33,
    },
    {
        "key": "sahil_kasabasi_liman",
        "label": "Sahil Kasabası",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779536514/backgrounds/coastal/sahil_kasabasi_liman.jpg",
        "description": "Otantik Ege balıkçı limanı, renkli tekneler, iskele kahveleri, yerel yaşam",
        "sort_order": 34,
    },
    {
        "key": "plaj_altin_saat",
        "label": "Plaj Altın Saat",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779536528/backgrounds/coastal/plaj_altin_saat.jpg",
        "description": "Ege plajı altın saat, ince beyaz kum, turkuaz su, güneş şemsiyeleri, bulanık insanlar",
        "sort_order": 35,
    },
    {
        "key": "bodrum_beyaz",
        "label": "Bodrum Beyazı",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779536540/backgrounds/coastal/bodrum_beyaz.jpg",
        "description": "Bodrum beyaz küpte evler, kobalt mavi kepenkler, kale silueti, marina",
        "sort_order": 36,
    },
    {
        "key": "cesme_sahili",
        "label": "Çeşme Sahili",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779536554/backgrounds/coastal/cesme_sahili.jpg",
        "description": "Çeşme kristal turkuaz su, plaj kulüpleri, tarihi kale, yelken tekneleri",
        "sort_order": 37,
    },
    {
        "key": "santorini_manzara",
        "label": "Santorini",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779536568/backgrounds/coastal/santorini_manzara.jpg",
        "description": "Santorini Oia, beyaz Kiklad mimarisi, kobalt kubbe, kaldera, altın ışık",
        "sort_order": 38,
    },
    {
        "key": "mavi_tekne_yolu",
        "label": "Mavi Yolculuk",
        "image_url": "https://res.cloudinary.com/dbmv26smg/image/upload/v1779536581/backgrounds/coastal/mavi_tekne_yolu.jpg",
        "description": "Türk gulet teknesi güvertesi, turkuaz koy, çam ormanlı kayalıklar, mavi yolculuk",
        "sort_order": 39,
    },
]


async def seed():
    from app.core.database import AsyncSessionLocal
    from app.models.background import Background
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        added = updated = 0
        for b in COASTAL_BACKGROUNDS:
            existing = (await db.execute(
                select(Background).where(Background.key == b["key"])
            )).scalar_one_or_none()

            if existing:
                existing.label     = b["label"]
                existing.image_url = b["image_url"]
                existing.description = b["description"]
                existing.sort_order  = b["sort_order"]
                updated += 1
                print(f"  ~ güncellendi: {b['key']}")
            else:
                db.add(Background(
                    key=b["key"], label=b["label"],
                    image_url=b["image_url"], description=b["description"],
                    sort_order=b["sort_order"], is_active=True,
                ))
                added += 1
                print(f"  + eklendi: {b['key']}")

        await db.commit()
        print(f"\nTamamlandı: {added} yeni, {updated} güncellendi.")


if __name__ == "__main__":
    asyncio.run(seed())
