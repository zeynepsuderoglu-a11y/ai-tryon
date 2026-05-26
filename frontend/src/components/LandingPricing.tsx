"use client";
import Link from "next/link";
import { Check, X, Zap, Package, Crown, Building2, Users } from "lucide-react";

const PLANS = [
  {
    icon: <Zap className="w-5 h-5 text-white" />,
    iconBg: "#374151",
    name: "Ücretsiz",
    desc: "Platformu keşfetmek için ideal başlangıç",
    price: 0,
    credits: 5,
    popular: false,
    cta: "Ücretsiz Başla",
    href: "/register",
    features: [
      { text: "5 Ücretsiz Kredi",       ok: true },
      { text: "Tüm hizmetlere erişim",  ok: true },
      { text: "Düşük çözünürlük indirme", ok: true },
      { text: "E-posta desteği",         ok: true },
      { text: "Yüksek çözünürlük",       ok: false },
      { text: "Toplu işlem",             ok: false },
      { text: "Öncelikli işlem",         ok: false },
    ],
  },
  {
    icon: <Package className="w-5 h-5 text-white" />,
    iconBg: "#1d4ed8",
    name: "Temel",
    desc: "Küçük işletmeler için uygun başlangıç",
    price: 150,
    credits: 10,
    popular: false,
    cta: "Satın Al",
    href: "/credits",
    features: [
      { text: "10 Kredi",               ok: true },
      { text: "Tüm hizmetlere erişim",  ok: true },
      { text: "HD çözünürlük",          ok: true },
      { text: "Standart işlem hızı",    ok: true },
      { text: "E-posta desteği",        ok: true },
      { text: "Toplu işlem",            ok: false },
      { text: "Öncelikli işlem",        ok: false },
    ],
  },
  {
    icon: <Crown className="w-5 h-5 text-white" />,
    iconBg: "linear-gradient(135deg, #C9A84C, #8B6914)",
    name: "Pro",
    desc: "Büyüyen e-ticaret işletmeleri için",
    price: 1350,
    credits: 100,
    popular: true,
    cta: "Satın Al",
    href: "/credits",
    features: [
      { text: "100 Kredi (%10 indirim)", ok: true },
      { text: "Tüm hizmetlere erişim",   ok: true },
      { text: "4K çözünürlük",           ok: true },
      { text: "Toplu işlem (10 adet)",   ok: true },
      { text: "Öncelikli işlem",         ok: true },
      { text: "Canlı destek",            ok: true },
      { text: "Özel API erişimi",        ok: false },
    ],
  },
  {
    icon: <Building2 className="w-5 h-5 text-white" />,
    iconBg: "#d97706",
    name: "İşletme",
    desc: "Kurumsal kullanım için kapsamlı çözüm",
    price: 6000,
    credits: 500,
    popular: false,
    cta: "Satın Al",
    href: "/credits",
    features: [
      { text: "500 Kredi (%20 indirim)", ok: true },
      { text: "Tüm hizmetlere erişim",   ok: true },
      { text: "4K çözünürlük",           ok: true },
      { text: "Sınırsız toplu işlem",    ok: true },
      { text: "Ultra öncelikli işlem",   ok: true },
      { text: "7/24 öncelikli destek",   ok: true },
      { text: "Özel API erişimi",        ok: true },
    ],
  },
  {
    icon: <Users className="w-5 h-5 text-white" />,
    iconBg: "#059669",
    name: "Ajans",
    desc: "Çoklu kullanıcı ve özel ihtiyaçlar için",
    price: null,
    credits: null,
    popular: false,
    cta: "İletişime Geç",
    href: "/iletisim",
    features: [
      { text: "Sınırsız kredi",          ok: true },
      { text: "Tüm özellikler + fazlası", ok: true },
      { text: "Çoklu kullanıcı hesabı",  ok: true },
      { text: "Marka silwaterma",        ok: true },
      { text: "Özel eğitim",             ok: true },
      { text: "VIP destek",              ok: true },
      { text: "Özel API entegrasyonu",   ok: true },
    ],
  },
];

export default function LandingPricing() {
  return (
    <section id="fiyatlandirma" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Badge */}
        <div className="flex justify-center mb-5">
          <span className="text-xs font-medium px-4 py-1.5 rounded-full border" style={{ color: "#D4AF37", borderColor: "rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.08)" }}>
            Transparent Pricing
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-3 tracking-tight">
          Esnek <span style={{ background: "linear-gradient(135deg, #F0D060, #D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fiyatlandırma</span>
        </h2>
        <p className="text-center text-[#9ca3af] mb-14">İhtiyacınıza uygun plan seçin. Kredi kartı gerekmez, istediğiniz zaman iptal edin.</p>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="relative rounded-2xl p-5 flex flex-col"
              style={
                plan.popular
                  ? { background: "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(236,72,153,0.1))", border: "1px solid rgba(201,168,76,0.5)" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full text-white whitespace-nowrap" style={{ background: "linear-gradient(135deg, #C9A84C, #8B6914)" }}>
                    En Popüler
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: typeof plan.iconBg === "string" && plan.iconBg.startsWith("linear") ? plan.iconBg : plan.iconBg }}>
                {plan.icon}
              </div>

              <h3 className="text-white font-bold text-base mb-1">{plan.name}</h3>
              <p className="text-[#6b7280] text-xs mb-4 leading-relaxed">{plan.desc}</p>

              {/* Price */}
              <div className="mb-4">
                {plan.price === null ? (
                  <p className="text-2xl font-bold text-white">Özel</p>
                ) : (
                  <p className="text-2xl font-bold text-white">
                    {plan.price === 0 ? "₺0" : `₺${plan.price.toLocaleString("tr-TR")}`}
                    {plan.price > 0 && <span className="text-sm font-normal text-[#6b7280]">/ay</span>}
                  </p>
                )}
                {plan.credits && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: plan.popular ? "#D4AF37" : "#6b7280" }} />
                    <span className="text-xs text-[#9ca3af]">{plan.credits} Kredi</span>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2">
                    {f.ok ? (
                      <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[#4b5563] flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-xs ${f.ok ? "text-[#d1d5db]" : "text-[#4b5563]"}`}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className="w-full text-center py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
                style={
                  plan.popular
                    ? { background: "linear-gradient(135deg, #C9A84C, #8B6914)", color: "#ffffff" }
                    : { background: "rgba(255,255,255,0.08)", color: "#d1d5db", border: "1px solid rgba(255,255,255,0.1)" }
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom badges */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-[#6b7280]">
          {["Kredi kartı gerekmez", "İstediğiniz zaman iptal", "Güvenli ödeme", "7/24 destek"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-green-400" /> {t}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
