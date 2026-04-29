import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package, Glasses, Eye, Users, Zap, ShieldCheck, Instagram, Facebook, Video, Coins, UserX, ImageIcon } from "lucide-react";
import DecorativeBg from "@/components/DecorativeBg";
import HeroDemoSlider from "@/components/HeroDemoSlider";
import DemoExamplesSection from "@/components/DemoExamplesSection";

const clothingSteps = [
  { num: "01", title: "Ürün Fotoğrafı Yükle", desc: "Kıyafetin herhangi bir açıdan fotoğrafını yükleyin." },
  { num: "02", title: "Manken Seç", desc: "Standart veya büyük beden, kadın veya erkek modellerimizden seçin." },
  { num: "03", title: "Görsel Oluştur", desc: "Yapay zeka birkaç saniyede profesyonel görsel oluşturur." },
];

const eyewearSteps = [
  { num: "01", title: "Gözlük Fotoğrafı Yükle", desc: "Gözlüğün ürün fotoğrafını yükleyin, arka plan otomatik kaldırılır." },
  { num: "02", title: "Manken Seç", desc: "Gözlüğün takılacağı manken görselini seçin." },
  { num: "03", title: "AI Render", desc: "Gözlük yüze hizalanır, gerçekçilik katmanı uygulanır." },
];

const videoSteps = [
  { num: "01", title: "Görsel Yükle", desc: "1-3 adet ürün veya manken fotoğrafı yükleyin." },
  { num: "02", title: "Mod Seç", desc: "Hızlı üretim veya referanslı mod seçeneğini belirleyin." },
  { num: "03", title: "Video Oluştur", desc: "Yapay zeka birkaç dakikada yayına hazır video üretir." },
];

const ghostSteps = [
  { num: "01", title: "Ürün Fotoğrafı Yükle", desc: "Kıyafetin askıda, modelde veya düz zemin fotoğrafını yükleyin." },
  { num: "02", title: "AI Dönüştürür", desc: "Yapay zeka arka planı, askıyı ve figürü otomatik kaldırır." },
  { num: "03", title: "Ghost Görsel Hazır", desc: "3D hacimli, içi dolu profesyonel e-ticaret ghost mannequin görseli." },
];

const backgroundSteps = [
  { num: "01", title: "Fotoğraf Yükle", desc: "Arka planını değiştirmek istediğiniz kişi veya ürün fotoğrafını yükleyin." },
  { num: "02", title: "Arka Plan Seç", desc: "21 hazır arka plan seçeneğinden birini seçin ya da kendi görselinizi yükleyin." },
  { num: "03", title: "Görsel Hazır", desc: "Yapay zeka arka planı değiştirir; kişi, kıyafet ve aksesuarlar korunur." },
];

const plans = [
  { name: "Başlangıç", credits: 5,   price: 0,    unitPrice: 0,     discount: 0,  free: true },
  { name: "Temel",     credits: 10,  price: 150,  unitPrice: 15,    discount: 0  },
  { name: "Orta",      credits: 50,  price: 712,  unitPrice: 14.25, discount: 5  },
  { name: "Pro",       credits: 100, price: 1350, unitPrice: 13.50, discount: 10, popular: true },
  { name: "İşletme",  credits: 500, price: 6000, unitPrice: 12,    discount: 20 },
];

export const metadata: Metadata = {
  title: "StudyoİMA AI — Kıyafet, Ghost Manken, Gözlük, Arka Plan & Video Üretimi",
  description:
    "Ürün fotoğrafından saniyeler içinde profesyonel manken görseli, ghost mannequin çekimi, arka plan değiştirme ve video. Yapay zeka kıyafet, ghost manken, gözlük, arka plan ve AI video üretimi. E-ticaret kataloğunuzu hızlandırın.",
  alternates: {
    canonical: "https://www.studyoima.com",
  },
  openGraph: {
    title: "StudyoİMA AI — Kıyafet, Ghost Manken, Gözlük, Arka Plan & Video Üretimi",
    description:
      "Ürün fotoğrafından saniyeler içinde profesyonel manken görseli, ghost mannequin çekimi, arka plan değiştirme ve video. Yapay zeka kıyafet, ghost manken, gözlük, arka plan ve AI video üretimi.",
    url: "https://www.studyoima.com",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "StudyoİMA AI" }],
  },
};

export default function LandingPage() {
  const clothingFeatures = [
    {
      icon: <Package className="w-5 h-5 text-[#c9a96e]" />,
      title: "Ürün Fotoğrafından Manken Görseli",
      desc: "Sadece ürün fotoğrafı yükleyin. Yapay zeka saniyeler içinde profesyonel manken üzerinde görselleştirir.",
    },
    {
      icon: <Users className="w-5 h-5 text-[#c9a96e]" />,
      title: "Toplu İşlem",
      desc: "Tek kıyafeti 10 farklı manken üzerinde aynı anda görün. Katalog hazırlama artık dakikalar içinde.",
    },
    {
      icon: <Zap className="w-5 h-5 text-[#c9a96e]" />,
      title: "Stüdyo Fotoğraf Kalitesi",
      desc: "10 yıllık stüdyo deneyimimizle eğitilmiş modeller. Gerçek çekim kalitesinde yapay zeka görseli.",
    },
  ];

  const eyewearFeatures = [
    {
      icon: <Eye className="w-5 h-5 text-[#c9a96e]" />,
      title: "Yüze Matematiksel Hizalama",
      desc: "MediaPipe ile 468 yüz noktası tespit edilir. Gözlük tam göz eksenine, doğru açıda ve orantılı yerleştirilir.",
    },
    {
      icon: <Glasses className="w-5 h-5 text-[#c9a96e]" />,
      title: "AI Gerçekçilik Katmanı",
      desc: "Matematiksel yerleştirme sonrası yapay zeka çerçeve kenarlarını, cam yansımalarını ve gölgeleri gerçekçi yapar.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#c9a96e]" />,
      title: "Tüm Çerçeve Tipleri",
      desc: "Güneş gözlüğü, optik çerçeve, spor gözlük — arka plan otomatik temizlenir, doğal görünümde yapıştırılır.",
    },
  ];

  const videoFeatures = [
    {
      icon: <Video className="w-5 h-5 text-[#c9a96e]" />,
      title: "Fotoğraftan Video Üretimi",
      desc: "1-3 ürün veya manken fotoğrafı yükleyin, yapay zeka saniyeler içinde akıcı bir video üretir.",
    },
    {
      icon: <Zap className="w-5 h-5 text-[#c9a96e]" />,
      title: "Veo 3.1 Fast Teknolojisi",
      desc: "Google'ın en gelişmiş video üretim modeliyle güçlendirilmiş altyapı. Yüksek kaliteli, gerçekçi video çıktısı.",
    },
    {
      icon: <Package className="w-5 h-5 text-[#c9a96e]" />,
      title: "Hızlı ve Referanslı Mod",
      desc: "Standart hızlı üretim veya referans görsellerle yönlendirilmiş üretim — ihtiyacınıza göre seçin.",
    },
  ];

  const ghostFeatures = [
    {
      icon: <UserX className="w-5 h-5 text-[#c9a96e]" />,
      title: "Tek Fotoğraftan Ghost Çekim",
      desc: "Askıda, modelde veya düz zemindeki ürün fotoğrafını profesyonel ghost mannequin görseline dönüştürün.",
    },
    {
      icon: <Zap className="w-5 h-5 text-[#c9a96e]" />,
      title: "Saniyeler İçinde Sonuç",
      desc: "Karmaşık Photoshop işlemleri yerine tek tıkla ghost mannequin efekti. Dakikalar değil, saniyeler.",
    },
    {
      icon: <Package className="w-5 h-5 text-[#c9a96e]" />,
      title: "Tüm Kıyafet Türleri",
      desc: "Ceket, elbise, gömlek, pantolon — her kategoride profesyonel e-ticaret ghost mannequin çekimi.",
    },
  ];

  const creditUsage = [
    { icon: <Glasses   className="w-4 h-4 text-[#c9a96e]" />, label: "Gözlük",           cost: "1 üretim" },
    { icon: <UserX     className="w-4 h-4 text-[#c9a96e]" />, label: "Ghost Manken",      cost: "1 üretim" },
    { icon: <ImageIcon className="w-4 h-4 text-[#c9a96e]" />, label: "Arka Plan",         cost: "1 üretim" },
    { icon: <Package   className="w-4 h-4 text-[#c9a96e]" />, label: "Kıyafet",           cost: "2 üretim" },
    { icon: <Video     className="w-4 h-4 text-[#c9a96e]" />, label: "Video Üretimi",     cost: "5 üretim" },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0f0f0f]">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="StudyoİMA AI — Yapay Zeka Görsel Üretim Platformu" width={32} height={32} className="rounded-full" />
            <span className="text-base font-semibold tracking-tight">StudyoİMA AI</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-sm text-[#737373] hover:text-[#0f0f0f] transition-colors">
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="bg-[#0f0f0f] text-white text-sm px-5 py-2.5 rounded-full hover:bg-[#2a2a2a] transition-colors"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center pt-16 relative overflow-hidden">
        <DecorativeBg />
        <div className="max-w-7xl mx-auto px-8 w-full py-24 relative">
          <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_500px] gap-16 items-center">

            {/* Sol: Metin */}
            <div>
              <p className="text-xs font-medium text-[#c9a96e] uppercase tracking-[0.25em] mb-8">
                Yapay Zeka · Görsel Üretim
              </p>
              <h1 className="text-5xl sm:text-7xl xl:text-8xl font-bold tracking-[-0.03em] leading-[0.93] mb-10">
                Yapay Zeka ile<br />
                Kıyafet, Gözlük,<br />
                Ghost, Arka Plan<br />
                <span className="text-[#c9a96e] opacity-80">&amp; Video Üretimi</span>
              </h1>
              <p className="text-lg text-[#737373] mb-12 max-w-lg leading-relaxed">
                Katalog çekimi olmadan saniyeler içinde profesyonel manken görseli, ghost mannequin, arka plan değiştirme ve video.
                Kıyafet, gözlük, ghost manken, arka plan ve video üretimi — tek platformda.
              </p>
              <div className="flex items-center gap-5 flex-wrap">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 bg-[#0f0f0f] text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                >
                  Ücretsiz Deneyin <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="text-sm text-[#737373] hover:text-[#0f0f0f] transition-colors underline underline-offset-4 decoration-[#e0e0e0]"
                >
                  Zaten hesabım var
                </Link>
              </div>
              <p className="text-xs text-[#b0b0b0] mt-7">5 ücretsiz üretim hakkı · Kredi kartı gerekmez</p>
            </div>

            {/* Sağ: Demo Slider */}
            <HeroDemoSlider />

          </div>
        </div>
      </section>

      {/* İki Çözüm — Koyu Şerit */}
      <section className="bg-[#0f0f0f] py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-medium text-[#c9a96e] uppercase tracking-[0.25em] mb-3">Çözümlerimiz</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-white">Beş ürün, tek platform</h2>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">

            {/* Kıyafet */}
            <div className="border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#c9a96e]/15 border border-[#c9a96e]/25 flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#c9a96e]" />
                </div>
                <h3 className="text-white font-semibold text-base">Kıyafet</h3>
              </div>
              <p className="text-white/50 text-xs leading-relaxed mb-4">
                Ürün fotoğrafından yapay zeka ile profesyonel manken görseli. Tişörtten elbiseye, monttan pantolona her kategori.
              </p>
              <div className="space-y-3">
                {clothingFeatures.map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] mt-[5px] flex-shrink-0" />
                    <div>
                      <p className="text-white text-xs font-medium mb-0.5">{f.title}</p>
                      <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gözlük */}
            <div className="border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#c9a96e]/15 border border-[#c9a96e]/25 flex items-center justify-center">
                  <Glasses className="w-4 h-4 text-[#c9a96e]" />
                </div>
                <h3 className="text-white font-semibold text-base">Gözlük</h3>
              </div>
              <p className="text-white/50 text-xs leading-relaxed mb-4">
                Gözlük ürün fotoğrafından gerçekçi manken görseli. 468 yüz noktası ile matematiksel hizalama, AI gerçekçilik katmanı.
              </p>
              <div className="space-y-3">
                {eyewearFeatures.map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] mt-[5px] flex-shrink-0" />
                    <div>
                      <p className="text-white text-xs font-medium mb-0.5">{f.title}</p>
                      <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Video */}
            <div className="border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#c9a96e]/15 border border-[#c9a96e]/25 flex items-center justify-center">
                  <Video className="w-4 h-4 text-[#c9a96e]" />
                </div>
                <h3 className="text-white font-semibold text-base">Video Üretimi</h3>
              </div>
              <p className="text-white/50 text-xs leading-relaxed mb-4">
                Ürün fotoğraflarından yapay zeka ile kısa video üretimi. Sosyal medya ve katalog için dakikalar içinde yayına hazır içerik.
              </p>
              <div className="space-y-3">
                {videoFeatures.map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] mt-[5px] flex-shrink-0" />
                    <div>
                      <p className="text-white text-xs font-medium mb-0.5">{f.title}</p>
                      <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ghost Manken */}
            <div className="border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#c9a96e]/15 border border-[#c9a96e]/25 flex items-center justify-center">
                  <UserX className="w-4 h-4 text-[#c9a96e]" />
                </div>
                <h3 className="text-white font-semibold text-base">Ghost Manken</h3>
              </div>
              <p className="text-white/50 text-xs leading-relaxed mb-4">
                Ürün fotoğrafından profesyonel ghost mannequin çekimi. Askıdaki, modeldeki veya düz zemindeki kıyafeti e-ticaret standardına taşıyın.
              </p>
              <div className="space-y-3">
                {ghostFeatures.map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] mt-[5px] flex-shrink-0" />
                    <div>
                      <p className="text-white text-xs font-medium mb-0.5">{f.title}</p>
                      <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arka Plan Değiştirme */}
            <div className="border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#c9a96e]/15 border border-[#c9a96e]/25 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-[#c9a96e]" />
                </div>
                <h3 className="text-white font-semibold text-base">Arka Plan</h3>
              </div>
              <p className="text-white/50 text-xs leading-relaxed mb-4">
                Herhangi bir fotoğrafın arka planını değiştirin. Stüdyo, dış mekan, şehir veya özel görsel — kişi ve kıyafet olduğu gibi korunur.
              </p>
              <div className="space-y-3">
                {[
                  { title: "21 Hazır Arka Plan", desc: "Beyaz stüdyo, kafe, İstanbul, doğa ve daha fazlası — anında seçin ve uygulayın." },
                  { title: "Özel Görsel Desteği", desc: "Kendi arka plan görselinizi yükleyin, yapay zeka sahneye entegre eder." },
                  { title: "Yüz & Kıyafet Koruması", desc: "Arka plan değişirken kişi, kıyafet, aksesuar ve ifade birebir korunur." },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] mt-[5px] flex-shrink-0" />
                    <div>
                      <p className="text-white text-xs font-medium mb-0.5">{f.title}</p>
                      <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Nasıl Çalışır */}
      <section className="py-16 px-8 relative overflow-hidden">
        <DecorativeBg rings={false} />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-8">
            <p className="text-xs font-medium text-[#c9a96e] uppercase tracking-[0.25em] mb-3">Nasıl Çalışır?</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em]">3 adımda görsel, video, ghost & arka plan</h2>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Kıyafet Adımları */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Package className="w-4 h-4 text-[#c9a96e]" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#0f0f0f]">Kıyafet</p>
              </div>
              <div className="space-y-6">
                {clothingSteps.map((s) => (
                  <div key={s.num} className="flex gap-4 items-start">
                    <span className="text-3xl font-bold tracking-tighter text-[#efefef] flex-shrink-0 leading-none select-none">
                      {s.num}
                    </span>
                    <div>
                      <h4 className="font-semibold text-[#0f0f0f] mb-1 text-sm">{s.title}</h4>
                      <p className="text-[#737373] text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gözlük Adımları */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Glasses className="w-4 h-4 text-[#c9a96e]" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#0f0f0f]">Gözlük</p>
              </div>
              <div className="space-y-6">
                {eyewearSteps.map((s) => (
                  <div key={s.num} className="flex gap-4 items-start">
                    <span className="text-3xl font-bold tracking-tighter text-[#efefef] flex-shrink-0 leading-none select-none">
                      {s.num}
                    </span>
                    <div>
                      <h4 className="font-semibold text-[#0f0f0f] mb-1 text-sm">{s.title}</h4>
                      <p className="text-[#737373] text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Adımları */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Video className="w-4 h-4 text-[#c9a96e]" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#0f0f0f]">Video</p>
              </div>
              <div className="space-y-6">
                {videoSteps.map((s) => (
                  <div key={s.num} className="flex gap-4 items-start">
                    <span className="text-3xl font-bold tracking-tighter text-[#efefef] flex-shrink-0 leading-none select-none">
                      {s.num}
                    </span>
                    <div>
                      <h4 className="font-semibold text-[#0f0f0f] mb-1 text-sm">{s.title}</h4>
                      <p className="text-[#737373] text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ghost Manken Adımları */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <UserX className="w-4 h-4 text-[#c9a96e]" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#0f0f0f]">Ghost Manken</p>
              </div>
              <div className="space-y-6">
                {ghostSteps.map((s) => (
                  <div key={s.num} className="flex gap-4 items-start">
                    <span className="text-3xl font-bold tracking-tighter text-[#efefef] flex-shrink-0 leading-none select-none">
                      {s.num}
                    </span>
                    <div>
                      <h4 className="font-semibold text-[#0f0f0f] mb-1 text-sm">{s.title}</h4>
                      <p className="text-[#737373] text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arka Plan Adımları */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <ImageIcon className="w-4 h-4 text-[#c9a96e]" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#0f0f0f]">Arka Plan</p>
              </div>
              <div className="space-y-6">
                {backgroundSteps.map((s) => (
                  <div key={s.num} className="flex gap-4 items-start">
                    <span className="text-3xl font-bold tracking-tighter text-[#efefef] flex-shrink-0 leading-none select-none">
                      {s.num}
                    </span>
                    <div>
                      <h4 className="font-semibold text-[#0f0f0f] mb-1 text-sm">{s.title}</h4>
                      <p className="text-[#737373] text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <DemoExamplesSection />

      {/* Fiyatlandırma */}
      <section className="py-32 px-8 bg-white relative overflow-hidden">
        <DecorativeBg />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-10">
            <p className="text-xs font-medium text-[#c9a96e] uppercase tracking-[0.25em] mb-4">Fiyatlandırma</p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.03em]">Sade fiyatlandırma</h2>
            <p className="text-sm text-[#a3a3a3] mt-4">Tüm işlem türlerinde ortak kullanılır · Ücretsiz başlayın</p>
          </div>

          {/* Kredi kullanım tablosu */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-10">
            {creditUsage.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2 py-5 bg-[#f8f8f8] rounded-2xl border border-[#e8e8e8]">
                {item.icon}
                <span className="text-xs text-[#737373] text-center leading-tight">{item.label}</span>
                <span className="text-sm font-bold text-[#0f0f0f]">{item.cost}</span>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-[#e8e8e8] overflow-hidden">
            {/* Tablo başlığı */}
            <div className="grid grid-cols-3 sm:grid-cols-5 bg-[#f8f8f8] border-b border-[#e8e8e8] px-4 sm:px-6 py-3.5">
              <div className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider">Paket</div>
              <div className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider text-center">Üretim</div>
              <div className="hidden sm:block text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider text-center">İndirim</div>
              <div className="hidden sm:block text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider text-center">Birim</div>
              <div className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider text-right">Fiyat</div>
            </div>

            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`grid grid-cols-3 sm:grid-cols-5 items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-[#f0f0f0] last:border-0 transition-colors ${
                  plan.popular ? "bg-[#0f0f0f]" : "hover:bg-[#fafafa]"
                }`}
              >
                {/* Col 1: Paket adı */}
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-sm font-semibold ${plan.popular ? "text-white" : "text-[#0f0f0f]"}`}>
                      {plan.name}
                    </span>
                    {plan.popular && (
                      <span className="text-[9px] bg-[#c9a96e] text-white px-2 py-0.5 rounded-full font-medium uppercase tracking-wider flex-shrink-0">
                        Popüler
                      </span>
                    )}
                  </div>
                  {plan.discount > 0 && (
                    <span className={`sm:hidden text-[10px] font-medium px-2 py-0.5 rounded-full w-fit ${
                      plan.popular ? "bg-[#c9a96e] text-white" : "bg-[#faf5ee] text-[#c9a96e] border border-[#e8dcc8]"
                    }`}>
                      %{plan.discount} indirim
                    </span>
                  )}
                </div>

                {/* Col 2: Kredi */}
                <div className={`text-sm text-center ${plan.popular ? "text-white/70" : "text-[#737373]"}`}>
                  {plan.free
                    ? <span className="text-xs leading-tight">5<br/><span className="text-[#c9a96e] font-medium">ücretsiz</span></span>
                    : plan.credits}
                </div>

                {/* Col 3: İndirim */}
                <div className="hidden sm:block text-center">
                  {plan.discount > 0 ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      plan.popular ? "bg-[#c9a96e] text-white" : "bg-[#faf5ee] text-[#c9a96e] border border-[#e8dcc8]"
                    }`}>
                      %{plan.discount}
                    </span>
                  ) : (
                    <span className={`text-xs ${plan.popular ? "text-white/30" : "text-[#d4d4d4]"}`}>—</span>
                  )}
                </div>

                {/* Col 4: Birim */}
                <div className={`hidden sm:block text-sm text-center ${plan.popular ? "text-white/70" : "text-[#737373]"}`}>
                  {plan.free ? "—" : `₺${plan.unitPrice}`}
                </div>

                {/* Col 5: Fiyat + Başla */}
                <div className="flex items-center justify-end gap-2">
                  <span className={`text-sm font-bold ${plan.popular ? "text-white" : "text-[#0f0f0f]"}`}>
                    {plan.free ? "Ücretsiz" : `₺${plan.price.toLocaleString("tr-TR")}`}
                  </span>
                  <Link
                    href="/register"
                    className={`text-xs px-3 sm:px-3.5 py-1.5 rounded-full font-medium transition-colors flex-shrink-0 ${
                      plan.popular
                        ? "bg-white text-[#0f0f0f] hover:bg-[#f0f0f0]"
                        : "bg-[#0f0f0f] text-white hover:bg-[#2a2a2a]"
                    }`}
                  >
                    Başla
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Koyu */}
      <section className="bg-[#0f0f0f] py-32 px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-white mb-6">
            Hemen deneyin
          </h2>
          <p className="text-white/50 text-lg mb-12 leading-relaxed">
            5 ücretsiz üretim hakkı ile başlayın. Kredi kartı gerekmez.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2.5 bg-white text-[#0f0f0f] px-10 py-4 rounded-full text-base font-medium hover:bg-[#f0f0f0] transition-colors"
          >
            Ücretsiz Başla <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e8e8e8] py-10 px-8 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="StudyoİMA AI — Yapay Zeka Görsel Üretim Platformu" width={28} height={28} className="rounded-full" />
            <span className="text-sm font-semibold text-[#0f0f0f]">StudyoİMA AI</span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#a3a3a3]">
            <Link href="/hakkimizda" className="hover:text-[#0f0f0f] transition-colors">Hakkımızda</Link>
            <Link href="/iletisim" className="hover:text-[#0f0f0f] transition-colors">İletişim</Link>
            <Link href="/gizlilik" className="hover:text-[#0f0f0f] transition-colors">Gizlilik Politikası</Link>
            <Link href="/satis-sozlesmesi" className="hover:text-[#0f0f0f] transition-colors">Satış Sözleşmesi</Link>
            <Link href="/login" className="hover:text-[#0f0f0f] transition-colors">Giriş Yap</Link>
            <Link href="/register" className="hover:text-[#0f0f0f] transition-colors">Kayıt Ol</Link>
            <a href="https://www.instagram.com/studyoimaai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#0f0f0f] transition-colors">
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
            <a href="https://www.facebook.com/studyoimaai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#0f0f0f] transition-colors">
              <Facebook className="w-3.5 h-3.5" /> Facebook
            </a>
          </div>
          <p className="text-xs text-[#c0c0c0]">© {new Date().getFullYear()} StudyoİMA AI</p>
        </div>

        {/* Güvenli Ödeme */}
        <div className="max-w-7xl mx-auto mt-6 pt-5 border-t border-[#f0f0f0] flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="text-[11px] text-[#b0b0b0] tracking-wide">GÜVENLİ ÖDEME</span>
          <div className="flex items-center gap-2">
            <div className="h-8 px-3 flex items-center justify-center border border-[#e0e0e0] rounded-md bg-white shadow-sm">
              <Image src="/visa.svg" alt="Visa" width={46} height={15} className="object-contain" />
            </div>
            <div className="h-8 px-3 flex items-center justify-center border border-[#e0e0e0] rounded-md bg-white shadow-sm">
              <Image src="/mastercard.svg" alt="Mastercard" width={38} height={24} className="object-contain" />
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
