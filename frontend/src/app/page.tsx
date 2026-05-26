import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Play, Package, Glasses, Video, UserX, ImageIcon, Camera, Sparkles, Layout, Heart } from "lucide-react";
import DemoExamplesSection from "@/components/DemoExamplesSection";
import SiteFooter from "@/components/SiteFooter";
import LandingNav from "@/components/LandingNav";
import LandingHowItWorks from "@/components/LandingHowItWorks";
import LandingTestimonials from "@/components/LandingTestimonials";
import LandingPricing from "@/components/LandingPricing";
import LandingFaq from "@/components/LandingFaq";
import LandingBeforeAfter from "@/components/LandingBeforeAfter";

export const metadata: Metadata = {
  title: "StudyoİMA AI — Kıyafet, Ghost Manken, Gözlük, Arka Plan & Video Üretimi",
  description:
    "Ürün fotoğrafından saniyeler içinde profesyonel manken görseli, ghost mannequin çekimi, arka plan değiştirme ve video. Yapay zeka kıyafet, ghost manken, gözlük, arka plan ve AI video üretimi.",
  alternates: { canonical: "https://www.studyoima.com" },
  openGraph: {
    title: "StudyoİMA AI — Kıyafet, Ghost Manken, Gözlük, Arka Plan & Video Üretimi",
    description: "Ürün fotoğrafından saniyeler içinde profesyonel manken görseli, ghost mannequin çekimi, arka plan değiştirme ve video.",
    url: "https://www.studyoima.com",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "StudyoİMA AI" }],
  },
};

const SERVICES = [
  {
    icon: <Package className="w-6 h-6 text-white" />,
    iconBg: "#1d4ed8",
    tag: "Manken Görseli",
    title: "Kıyafet",
    desc: "Ürün fotoğrafından AI ile profesyonel manken görseli oluşturun. Tişört, elbise, mont ve pantolon kategorilerinde...",
    features: ["10 farklı manken seçeneği", "Otomatik arka plan", "Profesyonel ışıklandırma", "Toplu işlem desteği"],
  },
  {
    icon: <Glasses className="w-6 h-6 text-white" />,
    iconBg: "#7c3aed",
    tag: "Sanal Deneme",
    title: "Gözlük",
    desc: "Yüze matematiksel hizalama ile gerçekçi gözlük sanal deneme deneyimi. 468 yüz noktası tespiti ile mükemmel uyum.",
    features: ["Tüm çerçeve tipleri", "AI gerçekçilik katmanı", "Cam yansıması efekti", "Otomatik arka plan temizleme"],
  },
  {
    icon: <Video className="w-6 h-6 text-white" />,
    iconBg: "#be185d",
    tag: "Üretimi",
    title: "Video",
    desc: "1-3 fotoğraftan kısa video üretimi. Google Veo 3.1 Fast teknolojisi ile profesyonel içerikler oluşturun.",
    features: ["6-10 saniyelik videolar", "Sosyal medya optimize", "Referanslı mod seçeneği", "HD çözünürlük"],
  },
  {
    icon: <UserX className="w-6 h-6 text-white" />,
    iconBg: "#065f46",
    tag: "Manken",
    title: "Ghost",
    desc: "Askıda, modelde veya düz zemindeki kıyafetlerden ghost mannequin efekti. Dakikalık Photoshop işlemini saniyeye...",
    features: ["3D hacimli efekt", "Profesyonel standart", "Hızlı işlem", "Çoklu açı desteği"],
  },
  {
    icon: <ImageIcon className="w-6 h-6 text-white" />,
    iconBg: "#92400e",
    tag: "Değişimi",
    title: "Arka Plan",
    desc: "21 hazır arka plan seçeneği ile ürünlerinizi farklı ortamlarda gösterin. Özel görsel yükleme desteği de mevcut.",
    features: ["21+ hazır arka plan", "Özel görsel yükleme", "Yüz koruma teknolojisi", "Kıyafet koruma"],
  },
];

const STATS = [
  { icon: <Camera className="w-5 h-5" />,   val: "10K+",  label: "Üretilen Görsel" },
  { icon: <Sparkles className="w-5 h-5" />, val: "5",     label: "AI Modeli" },
  { icon: <Layout className="w-5 h-5" />,   val: "21+",   label: "Arka Plan" },
  { icon: <Heart className="w-5 h-5" />,    val: "100%",  label: "Müşteri Memnuniyeti" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#080808" }}>

      <LandingNav activePage="home" />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-16 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-15 blur-[120px]" style={{ background: "radial-gradient(circle, #C9A84C 0%, #8B6914 60%, transparent 100%)" }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "#D4AF37" }}>
            <Sparkles className="w-3.5 h-3.5" />
            Yapay Zeka Destekli E-Ticaret Çözümü
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-4 leading-tight">
            Katalog Çekimi Olmadan<br />
            <span style={{ background: "linear-gradient(135deg, #F0D060 0%, #D4AF37 50%, #C9A84C 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Profesyonel Görseller
            </span>
          </h1>

          <p className="text-lg text-[#9ca3af] mb-4">Saniyeler içinde AI manken görseli</p>

          <p className="text-base text-[#6b7280] max-w-2xl mx-auto mb-10 leading-relaxed">
            StudyoiMA AI ile ürün fotoğraflarınızdan saniyeler içinde profesyonel manken görselleri,
            ghost mannequin efektleri ve etkileyici arka plan değişimleri oluşturun.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #C9A84C 0%, #8B6914 100%)" }}
            >
              Ücretsiz Başla <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#nasil-calisir"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <Play className="w-4 h-4" /> Nasıl Çalışır
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="text-[#9ca3af]">{s.icon}</span>
                <span className="text-xl font-bold text-white">{s.val}</span>
                <span className="text-xs text-[#6b7280]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Önce / Sonra Slider ─────────────────────────────────────── */}
      <LandingBeforeAfter />

      {/* ── Hizmetler ───────────────────────────────────────────────── */}
      <section id="hizmetler" className="py-24 px-6" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-7xl mx-auto">

          <div className="flex justify-center mb-5">
            <span className="text-xs font-medium px-4 py-1.5 rounded-full border" style={{ color: "#D4AF37", borderColor: "rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.08)" }}>
              AI-powered Solutions
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-3 tracking-tight">
            Kapsamlı <span style={{ background: "linear-gradient(135deg, #F0D060, #D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Çözümleri</span>
          </h2>
          <p className="text-center text-[#9ca3af] mb-14 max-w-xl mx-auto">E-ticaret görsel ihtiyaçlarınız için yapay zeka destekli tüm çözümlerimiz tek çatı altında</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl p-6 hover:border-white/15 transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.iconBg }}>
                    {s.icon}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-medium mb-0.5" style={{ color: "#9ca3af" }}>
                    {s.title} <span className="mx-1 opacity-40">/</span> <span style={{ color: "#D4AF37" }}>{s.tag}</span>
                  </p>
                  <p className="text-[13px] text-[#9ca3af] leading-relaxed mb-4">{s.desc}</p>
                  <ul className="space-y-1.5">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-[#6b7280]">
                        <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#C9A84C" }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #C9A84C 0%, #8B6914 100%)" }}
            >
              Tüm Hizmetleri Keşfet
            </Link>
          </div>

        </div>
      </section>

      {/* ── Nasıl Çalışır (client) ──────────────────────────────────── */}
      <LandingHowItWorks />

      {/* ── Örnekler ────────────────────────────────────────────────── */}
      <section id="ornekler">
        <DemoExamplesSection />
      </section>

      {/* ── Yorumlar (client) ───────────────────────────────────────── */}
      <LandingTestimonials />

      {/* ── Fiyatlandırma (client) ──────────────────────────────────── */}
      <LandingPricing />

      {/* ── SSS (client) ────────────────────────────────────────────── */}
      <LandingFaq />

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full opacity-10 blur-[100px]" style={{ background: "radial-gradient(circle, #C9A84C 0%, #8B6914 100%)" }} />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-bold text-white mb-5 tracking-tight">
            Hemen Deneyin
          </h2>
          <p className="text-[#9ca3af] text-lg mb-10">5 ücretsiz üretim hakkı ile başlayın. Kredi kartı gerekmez.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-base font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" }}
          >
            Ücretsiz Başla <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />

    </div>
  );
}
