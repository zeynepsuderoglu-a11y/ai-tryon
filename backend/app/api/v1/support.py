from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/support", tags=["support"])

# ---------------------------------------------------------------------------
# Yanıt veritabanı — (keywords, answer)
# ---------------------------------------------------------------------------
_RULES = [
    (
        ["kredi kartı", "banka kartı", "ödeme", "satın al", "paket", "üretim hakkı", "ödeme yöntemi"],
        "Evet, kredi kartı ile güvenli ödeme yaparak üretim hakkı (kredi paketi) satın alabilirsiniz. "
        "Kredi Yükle sayfasından istediğiniz paketi seçin, kart bilgilerinizi girin, işlem tamamlanınca krediler anında hesabınıza eklenir. "
        "Ödeme altyapımız 256-bit SSL ile korunmaktadır.",
    ),
    (
        ["nasıl çalışır", "nasıl kullanılır", "nasıl yapılır", "ne işe yarar", "nedir bu", "ne yapıyor"],
        "StudyoİMA AI, ürün fotoğrafınızdan saniyeler içinde profesyonel görsel üretir. "
        "Stüdyo sayfasına gidip bir özellik seçin, ürün fotoğrafınızı yükleyin ve AI'ın üretmesini bekleyin. "
        "Her özellik 1–5 kredi harcar.",
    ),
    (
        ["kredi", "coin", "bakiye", "puan", "jeton"],
        "Kredi sistemi: Her üretim 1–5 kredi harcar. Kredi satın almak için Kredi Yükle sayfasını kullanabilirsiniz. Üretim başarısız olursa krediler iade edilir.",
    ),
    (
        ["kaç kredi", "ne kadar", "fiyat", "ücret", "maliyet", "pahalı", "para"],
        "Özellik fiyatları: AI Stil Oluştur 2 kredi, Model Seç & Giydir 2 kredi, AI Giydir Pro 2 kredi, Ghost Manken 1 kredi, Arka Plan 1 kredi, Gözlük 1 kredi, Video 5 kredi.",
    ),
    (
        ["stil", "manken", "ai stil", "stil oluştur"],
        "AI Stil Oluştur: Ürün fotoğrafınızdan otomatik olarak profesyonel manken görseli oluşturur. 2 kredi harcar. Stüdyo sayfasından erişebilirsiniz.",
    ),
    (
        ["model seç", "giydir", "kıyafet giydirme"],
        "Model Seç & Giydir: Kendi seçtiğiniz model üzerine ürünü giydirir. 2 kredi harcar. Stüdyo sayfasından model seçip ürün görselinizi yükleyebilirsiniz.",
    ),
    (
        ["pro", "gelişmiş", "ai giydir pro", "giydir pro"],
        "AI Giydir Pro: Gelişmiş yapay zeka ile daha detaylı ve gerçekçi sonuçlar üretir. 2 kredi harcar. Stüdyo sayfasındaki 'AI Giydir Pro' sekmesinden kullanabilirsiniz.",
    ),
    (
        ["arka plan", "arkaplan", "zemin", "sahne"],
        "Arka Plan Değiştir: Ürün veya model görselinin arka planını istediğiniz sahneyle değiştirir. 1 kredi harcar. Stüdyo'daki Arka Plan sekmesinden kullanabilirsiniz.",
    ),
    (
        ["ghost", "hayalet", "ghost manken"],
        "Ghost Manken: Ürünün içini boşaltarak profesyonel katalog görseli oluşturur. 1 kredi harcar. Stüdyo'daki Ghost sekmesinden kullanabilirsiniz.",
    ),
    (
        ["gözlük", "aksesuar"],
        "Gözlük: Model görseline sanal gözlük giydirme özelliği. 1 kredi harcar. Stüdyo'daki Gözlük sekmesinden kullanabilirsiniz.",
    ),
    (
        ["video", "film", "animasyon", "hareketli"],
        "Video: Ürün görselinizden yapay zeka ile kısa video üretir. 5 kredi harcar. Stüdyo'daki Video sekmesinden kullanabilirsiniz.",
    ),
    (
        ["resim yükle", "fotoğraf", "görsel yükle", "ürün resmi", "yükleme", "format", "boyut"],
        "Görsel yükleme: Ürün fotoğrafı net ve düz zemin üzerinde olmalıdır. Desteklenen formatlar: JPG, PNG, WEBP. Yüksek çözünürlüklü ve iyi aydınlatılmış görseller daha iyi sonuç verir.",
    ),
    (
        ["kayıt", "hesap aç", "üye ol", "üyelik", "giriş yap", "nasıl kayıt", "nasıl üye", "nasıl giriş", "şifre"],
        "Kayıt & Giriş: studyoima.com/register adresinden ücretsiz kayıt olabilirsiniz. Şifrenizi unutursanız giriş sayfasındaki 'Şifremi Unuttum' bağlantısını kullanın.",
    ),
    (
        ["iletişim", "destek", "yardım", "mail", "e-posta", "şikayet", "sorun"],
        "Destek için bize yazabilirsiniz: ilgi@ilet.in — Instagram: @studyoimaai — Adres: Merkez Mh. Merter Sk. No:42/1 Güngören / İSTANBUL",
    ),
]

_FALLBACK = "Sorunuzu anlayamadım. Daha fazla yardım için bize yazabilirsiniz: ilgi@ilet.in"


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    matched: bool


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    msg = req.message.lower().strip()

    for keywords, answer in _RULES:
        if any(kw in msg for kw in keywords):
            return ChatResponse(answer=answer, matched=True)

    return ChatResponse(answer=_FALLBACK, matched=False)
