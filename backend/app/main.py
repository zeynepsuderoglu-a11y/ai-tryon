import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
from app.core.database import create_tables, apply_migrations
from app.core.config import settings
from app.api.v1 import auth, tryon, models, generations, admin, eyewear, payments, video, contact, ghost_mannequin, gemini_tryon, background_replace, mannequin_tryon, mannequins, backgrounds

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s:%(message)s",
)


_INITIAL_BACKGROUNDS = [
    {"key": "white_studio",     "label": "Beyaz",        "desc": "pure white seamless studio background, no shadows",                        "order": 1},
    {"key": "grey_studio",      "label": "Gri",          "desc": "neutral light grey seamless studio background",                             "order": 2},
    {"key": "cream",            "label": "Krem",         "desc": "warm cream/ivory seamless studio background",                              "order": 3},
    {"key": "black_studio",     "label": "Siyah",        "desc": "deep black seamless studio background",                                    "order": 4},
    {"key": "pink_studio",      "label": "Pembe",        "desc": "soft pastel pink seamless studio background",                              "order": 5},
    {"key": "outdoor_city",     "label": "Şehir",        "desc": "modern city street background, natural daylight",                          "order": 6},
    {"key": "outdoor_nature",   "label": "Doğa",         "desc": "lush green nature/park background, soft sunlight",                         "order": 7},
    {"key": "cafe",             "label": "Kafe",         "desc": "warm cozy café interior background",                                       "order": 8},
    {"key": "minimal_room",     "label": "Oda",          "desc": "minimal clean modern room interior background",                             "order": 9},
    {"key": "beige_outdoor",    "label": "Plaj",         "desc": "warm sandy beach/outdoor background",                                      "order": 10},
    {"key": "istanbul_terrace", "label": "İstanbul",     "desc": "Istanbul Bosphorus terrace view background, golden hour",                  "order": 11},
    {"key": "boho_room",        "label": "Boho",         "desc": "bohemian style room interior background, warm earth tones",                "order": 12},
    {"key": "wood_studio",      "label": "Ahşap",        "desc": "warm wooden floor studio background",                                      "order": 13},
    {"key": "luxury_marble",    "label": "Mermer",       "desc": "luxury white marble surface background",                                   "order": 14},
    {"key": "warm_studio",      "label": "Sıcak",        "desc": "warm tone seamless studio background",                                     "order": 15},
    {"key": "ottoman_cafe",     "label": "Osmanlı",      "desc": "classic Ottoman/Turkish café interior background",                         "order": 16},
    {"key": "industrial_room",  "label": "Endüstriyel",  "desc": "industrial loft interior background, exposed brick",                       "order": 17},
    {"key": "garden",           "label": "Bahçe",        "desc": "lush green garden background, natural light",                              "order": 18},
    {"key": "concrete_loft",    "label": "Loft",         "desc": "concrete loft studio background, modern minimal",                          "order": 19},
    {"key": "rose_studio",      "label": "Gül",          "desc": "soft rose/blush seamless studio background",                               "order": 20},
    {"key": "arch_room",        "label": "Kemerli",      "desc": "elegant arched room interior background, Mediterranean style",             "order": 21},
]


async def _seed_backgrounds():
    from app.core.database import AsyncSessionLocal
    from app.models.background import Background
    from sqlalchemy import select, func

    async with AsyncSessionLocal() as db:
        count = (await db.execute(select(func.count(Background.id)))).scalar()
        if count and count > 0:
            return
        for b in _INITIAL_BACKGROUNDS:
            bg = Background(
                key=b["key"],
                label=b["label"],
                image_url=f"{settings.FRONTEND_URL}/backgrounds/{b['key']}.jpg",
                description=b["desc"],
                sort_order=b["order"],
            )
            db.add(bg)
        await db.commit()
        logging.getLogger(__name__).info("Backgrounds seeded: %d kayıt", len(_INITIAL_BACKGROUNDS))


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    await apply_migrations()
    await _seed_backgrounds()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend:3000",
        "http://81.17.103.222",
        "https://studyoima.com",
        "https://www.studyoima.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = Path(__file__).parent.parent / "static"
static_dir.mkdir(exist_ok=True)
(static_dir / "models").mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(tryon.router, prefix="/api/v1")
app.include_router(models.router, prefix="/api/v1")
app.include_router(generations.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(eyewear.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(video.router, prefix="/api/v1")
app.include_router(contact.router, prefix="/api/v1")
app.include_router(ghost_mannequin.router, prefix="/api/v1")
app.include_router(gemini_tryon.router, prefix="/api/v1")
app.include_router(background_replace.router, prefix="/api/v1")
app.include_router(mannequin_tryon.router, prefix="/api/v1")
app.include_router(mannequins.router, prefix="/api/v1")
app.include_router(backgrounds.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
