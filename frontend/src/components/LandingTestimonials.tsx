"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    initials: "MK",
    name: "Mehmet Kaya",
    role: "Online Satıcı",
    company: "TrendAlış",
    badge: "%80 hız artışı",
    stars: 5,
    text: "Ghost manken özelliği inanılmaz! Daha önce Photoshop'ta saatlerce uğraştığım işlemleri artık tek tıkla yapıyorum. İşimi %80 hızlandırdım.",
    color: "#c084fc",
    bg: "from-purple-500 to-pink-500",
  },
  {
    initials: "AY",
    name: "Ayşe Yılmaz",
    role: "E-ticaret Yöneticisi",
    company: "ModaHub",
    badge: "Maliyet tasarrufu",
    stars: 5,
    text: "Katalog çekimi için aylık binlerce lira harcıyorduk. StudyoiMA sayesinde bu maliyeti sıfırladık. Görsel kalitesi gerçekten etkileyici.",
    color: "#f0abfc",
    bg: "from-pink-500 to-purple-600",
  },
  {
    initials: "CO",
    name: "Can Öztürk",
    role: "Marka Sahibi",
    company: "UrbanStyle",
    badge: "10x daha hızlı",
    stars: 5,
    text: "Gözlük sanal deneme özelliği müşterilerimizin satın alma kararını çok kolaylaştırdı. Dönüşüm oranımız %40 arttı.",
    color: "#818cf8",
    bg: "from-violet-500 to-purple-600",
  },
];

export default function LandingTestimonials() {
  const [idx, setIdx] = useState(0);
  const t = TESTIMONIALS[idx];

  return (
    <section id="yorumlar" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Badge */}
        <div className="flex justify-center mb-5">
          <span className="text-xs font-medium px-4 py-1.5 rounded-full border" style={{ color: "#c084fc", borderColor: "rgba(192,132,252,0.3)", background: "rgba(192,132,252,0.08)" }}>
            Customer Love
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-3 tracking-tight">
          Müşterilerimiz <span style={{ background: "linear-gradient(135deg, #f0abfc, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ne Diyor?</span>
        </h2>
        <p className="text-center text-[#9ca3af] mb-14">Binlerce e-ticaret işletmesi StudyoiMA&apos;yı tercih ediyor</p>

        {/* Testimonial card */}
        <div className="relative rounded-3xl p-8 sm:p-10 mb-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Avatar */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${t.color}, #7c3aed)` }}
            >
              {t.initials}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-white font-medium">{t.name}</p>
              <p className="text-[#6b7280] text-sm">{t.role} · {t.company}</p>
            </div>
          </div>

          <blockquote className="text-[#d1d5db] text-base leading-relaxed mb-5">
            &ldquo;{t.text}&rdquo;
          </blockquote>

          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#86efac" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            {t.badge}
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? "28px" : "8px",
                  height: "8px",
                  background: i === idx ? "linear-gradient(135deg, #a855f7, #ec4899)" : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIdx((idx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIdx((idx + 1) % TESTIMONIALS.length)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-8">
            {[
              { val: "2.500+", label: "Mutlu Müşteri" },
              { val: "4.9/5",  label: "Ortalama Puan" },
              { val: "50K+",   label: "Üretilen Görsel" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-white font-bold text-lg">{s.val}</p>
                <p className="text-[#6b7280] text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
