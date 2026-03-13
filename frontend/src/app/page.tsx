"use client";

import Link from "next/link";
import { ArrowRight, Check, Zap, Users, Package } from "lucide-react";

const features = [
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

const steps = [
  { num: "01", title: "Ürün Fotoğrafı Yükle", desc: "Kıyafetin herhangi bir açıdan fotoğrafını yükleyin." },
  { num: "02", title: "Manken Seç", desc: "Standart veya büyük beden, kadın veya erkek modellerimizden seçin." },
  { num: "03", title: "Görsel Oluştur", desc: "Yapay zeka birkaç saniyede profesyonel görsel oluşturur." },
];

const plans = [
  {
    name: "Başlangıç",
    price: "Ücretsiz",
    credits: "3 kontör",
    features: ["3 görsel üretimi", "Standart modeller", "PNG indirme"],
  },
  {
    name: "Pro",
    price: "₺5.000",
    credits: "200 kontör / ay",
    features: ["200 görsel üretimi", "Tüm modeller", "Toplu işlem (5)", "HD indirme", "Öncelikli işlem"],
    popular: true,
  },
  {
    name: "İşletme",
    price: "₺25.000",
    credits: "1.000 kontör / ay",
    features: ["1.000 görsel üretimi", "Tüm modeller", "Toplu işlem (10)", "4K indirme", "API erişimi", "Admin paneli"],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-[#e5e5e5]">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <span className="text-base font-semibold tracking-tight">İMA Tryon</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#737373] hover:text-[#1a1a1a] transition-colors">
              Giriş Yap
            </Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-medium text-[#c9a96e] uppercase tracking-widest mb-4">
            Yapay Zeka Kıyafet Giydirme
          </p>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-tight mb-6">
            Ürünlerinizi Manken
            <br />
            Üzerinde Görün
          </h1>
          <p className="text-lg text-[#737373] mb-10 max-w-xl mx-auto leading-relaxed">
            Katalog çekimi olmadan, saniyeler içinde profesyonel manken görseli.
            Butik ve e-ticaret firmalarının yeni nesil çözümü.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-primary flex items-center gap-2 px-6 py-3 text-base">
              Ücretsiz Deneyin <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-secondary flex items-center gap-2 px-6 py-3 text-base">
              Giriş Yap
            </Link>
          </div>
          <p className="text-xs text-[#a3a3a3] mt-4">3 ücretsiz kredi · Kredi kartı gerekmez</p>
        </div>
      </section>

      {/* Demo */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8 flex flex-col sm:flex-row gap-8 items-center justify-center">
            <div className="text-center">
              <div className="w-44 h-60 rounded-2xl overflow-hidden border border-[#e5e5e5] shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/demo/product.jpg"
                  alt="Ürün fotoğrafı"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="mt-3 text-xs text-[#a3a3a3] font-medium uppercase tracking-wider">Ürün Fotoğrafı</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-[#c9a96e]">
              <ArrowRight className="w-6 h-6" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-[#a3a3a3]">AI</span>
            </div>
            <div className="text-center">
              <div className="w-44 h-60 rounded-2xl overflow-hidden border border-[#e8dcc8] shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/demo/model.jpg"
                  alt="Manken görseli"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="mt-3 text-xs text-[#c9a96e] font-medium uppercase tracking-wider">Manken Görseli</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white border-t border-[#e5e5e5]">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-medium text-[#c9a96e] uppercase tracking-widest text-center mb-3">Özellikler</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-12 tracking-tight">Neden İMA Tryon?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 border border-[#e5e5e5] rounded-xl bg-white">
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-medium text-base mb-2">{f.title}</h3>
                <p className="text-[#737373] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-medium text-[#c9a96e] uppercase tracking-widest text-center mb-3">Nasıl Çalışır?</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-12 tracking-tight">3 Adımda Görsel</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 rounded-full border border-[#e5e5e5] bg-white flex items-center justify-center text-sm font-medium text-[#c9a96e] mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-medium mb-2 text-sm">{s.title}</h3>
                <p className="text-[#737373] text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-white border-t border-[#e5e5e5]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-medium text-[#c9a96e] uppercase tracking-widest text-center mb-3">Fiyatlandırma</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-3 tracking-tight">Sade Fiyatlandırma</h2>
          <p className="text-sm text-[#737373] text-center mb-12">1 kontör = ₺25 · Her görsel üretimi 1 kontör</p>
          <div className="grid md:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 flex flex-col border ${
                  plan.popular
                    ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                    : "bg-white border-[#e5e5e5]"
                }`}
              >
                {plan.popular && (
                  <span className="text-[10px] bg-[#c9a96e] text-white px-2 py-0.5 rounded-full mb-4 self-start font-medium uppercase tracking-wider">
                    Popüler
                  </span>
                )}
                <h3 className={`font-medium text-base ${plan.popular ? "text-white" : "text-[#1a1a1a]"}`}>{plan.name}</h3>
                <div className="my-4">
                  <span className={`text-3xl font-semibold ${plan.popular ? "text-white" : "text-[#1a1a1a]"}`}>{plan.price}</span>
                  {plan.price !== "Ücretsiz" && <span className={`text-sm ml-1 ${plan.popular ? "text-white/60" : "text-[#737373]"}`}>/ay</span>}
                </div>
                <p className={`text-xs mb-4 ${plan.popular ? "text-[#c9a96e]" : "text-[#c9a96e]"}`}>{plan.credits}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.popular ? "text-white/80" : "text-[#737373]"}`}>
                      <Check className={`w-3.5 h-3.5 flex-shrink-0 ${plan.popular ? "text-[#c9a96e]" : "text-[#c9a96e]"}`} /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    plan.popular
                      ? "bg-white text-[#1a1a1a] hover:bg-[#f5f5f5]"
                      : "bg-[#1a1a1a] text-white hover:bg-[#333]"
                  }`}
                >
                  Başla
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4 tracking-tight">Hemen Deneyin</h2>
          <p className="text-[#737373] mb-8">3 ücretsiz kredi ile başlayın. Kredi kartı gerekmez.</p>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base">
            Ücretsiz Başla <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] py-8 px-6 text-center text-[#a3a3a3] text-xs">
        © {new Date().getFullYear()} İMA Tryon · imatryon.com
      </footer>
    </div>
  );
}
