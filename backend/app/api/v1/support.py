from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/support", tags=["support"])

# ---------------------------------------------------------------------------
# Yanıt veritabanı — (keywords_tr, keywords_en, answer_tr, answer_en)
# ---------------------------------------------------------------------------
_RULES = [
    (
        ["kredi", "coin", "bakiye", "puan", "jeton"],
        ["credit", "credits", "balance", "token", "coin"],
        "Kredi sistemi: Her üretim 1–5 kredi harcar. Kredi satın almak için Kredi Yükle sayfasını kullanabilirsiniz. Üretim başarısız olursa krediler iade edilir.",
        "Credit system: Each generation costs 1–5 credits. You can buy credits on the Add Credits page. Credits are refunded if a generation fails.",
    ),
    (
        ["kaç kredi", "ne kadar", "fiyat", "ücret", "maliyet", "pahalı", "para"],
        ["how much", "price", "cost", "fee", "expensive"],
        "Özellik fiyatları: AI Stil Oluştur 2 kredi, Model Seç & Giydir 2 kredi, AI Giydir Pro 2 kredi, Ghost Manken 1 kredi, Arka Plan 1 kredi, Gözlük 1 kredi, Video 5 kredi.",
        "Feature prices: AI Styling 2 credits, Model Dress 2 credits, AI Pro Dress 2 credits, Ghost Mannequin 1 credit, Background 1 credit, Eyewear 1 credit, Video 5 credits.",
    ),
    (
        ["stil", "manken", "ai stil", "stil oluştur"],
        ["mannequin", "ai style", "styling", "style"],
        "AI Stil Oluştur: Ürün fotoğrafınızdan otomatik olarak profesyonel manken görseli oluşturur. 2 kredi harcar. Stüdyo sayfasından erişebilirsiniz.",
        "AI Styling: Automatically creates a professional mannequin image from your product photo. Costs 2 credits. Accessible from the Studio page.",
    ),
    (
        ["model", "giydir", "model seç", "kıyafet"],
        ["model dress", "dress model", "wear", "outfit"],
        "Model Seç & Giydir: Kendi seçtiğiniz model üzerine ürünü giydirir. 2 kredi harcar. Stüdyo sayfasından model seçip ürün görselinizi yükleyebilirsiniz.",
        "Model Dress: Dresses the product on a model of your choice. Costs 2 credits. Select a model and upload your product image from the Studio page.",
    ),
    (
        ["pro", "gelişmiş", "ai giydir pro", "giydir pro"],
        ["pro", "advanced", "ai pro"],
        "AI Giydir Pro: Gelişmiş yapay zeka ile daha detaylı ve gerçekçi sonuçlar üretir. 2 kredi harcar. Stüdyo sayfasındaki 'AI Giydir Pro' sekmesinden kullanabilirsiniz.",
        "AI Pro Dress: Produces more detailed and realistic results with advanced AI. Costs 2 credits. Use from the 'AI Pro' tab on the Studio page.",
    ),
    (
        ["arka plan", "arkaplan", "background", "zemin"],
        ["background", "backdrop", "scene"],
        "Arka Plan Değiştir: Ürün veya model görselinin arka planını istediğiniz sahneyle değiştirir. 1 kredi harcar. Stüdyo'daki Arka Plan sekmesinden kullanabilirsiniz.",
        "Background Replace: Replaces the background of your product or model image with a chosen scene. Costs 1 credit. Use from the Background tab in Studio.",
    ),
    (
        ["ghost", "hayalet", "ghost manken", "iç giyim"],
        ["ghost", "ghost mannequin", "hollow"],
        "Ghost Manken: Ürünün içini boşaltarak profesyonel katalog görseli oluşturur. 1 kredi harcar. Stüdyo'daki Ghost sekmesinden kullanabilirsiniz.",
        "Ghost Mannequin: Creates a professional catalog image by hollowing out the mannequin. Costs 1 credit. Use from the Ghost tab in Studio.",
    ),
    (
        ["gözlük", "gözlük dene", "aksesuar"],
        ["eyewear", "glasses", "sunglasses", "accessory"],
        "Gözlük: Model görseline sanal gözlük giydirme özelliği. 1 kredi harcar. Stüdyo'daki Gözlük sekmesinden kullanabilirsiniz.",
        "Eyewear: Virtual eyewear try-on feature on model images. Costs 1 credit. Use from the Eyewear tab in Studio.",
    ),
    (
        ["video", "film", "animasyon", "hareketli"],
        ["video", "animation", "motion"],
        "Video: Ürün görselinizden yapay zeka ile kısa video üretir. 5 kredi harcar. Stüdyo'daki Video sekmesinden kullanabilirsiniz.",
        "Video: Generates a short AI video from your product image. Costs 5 credits. Use from the Video tab in Studio.",
    ),
    (
        ["resim yükle", "fotoğraf", "görsel", "ürün resmi", "dikkat", "yükleme", "format", "boyut"],
        ["upload", "photo", "image", "picture", "format", "size"],
        "Görsel yükleme: Ürün fotoğrafı net ve düz zemin üzerinde olmalıdır. Desteklenen formatlar: JPG, PNG, WEBP. Yüksek çözünürlüklü ve iyi aydınlatılmış görseller daha iyi sonuç verir.",
        "Image upload: Product photos should be clear and on a plain background. Supported formats: JPG, PNG, WEBP. High-resolution, well-lit images produce better results.",
    ),
    (
        ["kayıt", "hesap", "üye", "üyelik", "giriş", "şifre", "login", "register", "signup"],
        ["register", "account", "sign up", "login", "password", "membership"],
        "Kayıt & Giriş: studyoima.com/register adresinden ücretsiz kayıt olabilirsiniz. Şifrenizi unutursanız giriş sayfasındaki 'Şifremi Unuttum' bağlantısını kullanın.",
        "Register & Login: You can sign up for free at studyoima.com/register. If you forget your password, use the 'Forgot Password' link on the login page.",
    ),
    (
        ["ödeme", "satın al", "paket", "kart", "kredi kartı", "ödeme yöntemi"],
        ["payment", "purchase", "buy", "card", "credit card", "package"],
        "Ödeme: Kredi kartı ile güvenli ödeme yapabilirsiniz. Kredi Yükle sayfasından istediğiniz paketi seçebilirsiniz. Ödeme altyapımız 256-bit SSL ile korunmaktadır.",
        "Payment: You can make secure payments by credit card. Choose your package from the Add Credits page. Our payment infrastructure is protected with 256-bit SSL.",
    ),
    (
        ["iletişim", "destek", "yardım", "mail", "e-posta", "email", "şikayet", "sorun"],
        ["contact", "support", "help", "email", "complaint", "problem", "issue"],
        "Destek için bize yazabilirsiniz: ilgi@ilet.in — Instagram: @studyoimaai — Adres: Merkez Mh. Merter Sk. No:42/1 Güngören / İSTANBUL",
        "For support, contact us: ilgi@ilet.in — Instagram: @studyoimaai — Address: Merkez Mh. Merter Sk. No:42/1 Güngören / ISTANBUL",
    ),
]

_FALLBACK_TR = "Sorunuzu anlayamadım. Daha fazla yardım için bize yazabilirsiniz: ilgi@ilet.in"
_FALLBACK_EN = "I couldn't understand your question. For more help, contact us: ilgi@ilet.in"

_TR_CHARS = set("çğışöüÇĞİŞÖÜ")


def _is_turkish(text: str) -> bool:
    return any(c in _TR_CHARS for c in text)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    matched: bool


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    msg = req.message.lower().strip()
    turkish = _is_turkish(req.message)

    for kw_tr, kw_en, ans_tr, ans_en in _RULES:
        keywords = kw_tr if turkish else kw_en
        if any(kw in msg for kw in keywords):
            return ChatResponse(answer=ans_tr if turkish else ans_en, matched=True)

    # İkinci geçiş: diğer dil keyword setini de dene
    for kw_tr, kw_en, ans_tr, ans_en in _RULES:
        keywords = kw_en if turkish else kw_tr
        if any(kw in msg for kw in keywords):
            return ChatResponse(answer=ans_tr if turkish else ans_en, matched=True)

    fallback = _FALLBACK_TR if turkish else _FALLBACK_EN
    return ChatResponse(answer=fallback, matched=False)
