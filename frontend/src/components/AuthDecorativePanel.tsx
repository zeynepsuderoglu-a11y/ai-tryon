"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    tag: "Kıyafet",
    title: "Ürün fotoğrafından\nmanken görseli",
    steps: [
      { step: "01", title: "Ürün Fotoğrafı Yükle", desc: "Beyaz fon, flat-lay veya askı fotoğrafı" },
      { step: "02", title: "AI Analiz & İşlem", desc: "Kıyafet tipi, renk ve detaylar otomatik okunur" },
      { step: "03", title: "Profesyonel Görsel", desc: "Manken üzerinde stüdyo kalitesinde çıktı" },
    ],
    stats: [
      { value: "2", label: "Kredi / üretim" },
      { value: "< 30s", label: "Ortalama süre" },
    ],
  },
  {
    tag: "Gözlük",
    title: "Matematiksel\nhizalamayla gözlük",
    steps: [
      { step: "01", title: "Yüz Fotoğrafı Yükle", desc: "Düz, ön cepheden net bir portre" },
      { step: "02", title: "468 Nokta Analizi", desc: "MediaPipe ile yüz geometrisi çıkarılır" },
      { step: "03", title: "Hassas Hizalama", desc: "Gözlük matematiksel olarak konumlandırılır" },
    ],
    stats: [
      { value: "1", label: "Kredi / üretim" },
      { value: "468", label: "Yüz noktası" },
    ],
  },
  {
    tag: "AI Video Üretimi",
    title: "Görselden akıcı\nAI videosu",
    steps: [
      { step: "01", title: "Görsel Yükle", desc: "Manken görseli veya ürün fotoğrafı" },
      { step: "02", title: "Video Parametreleri", desc: "Hareket tipi ve süre otomatik ayarlanır" },
      { step: "03", title: "Profesyonel Video", desc: "Kie.ai Veo ile stüdyo kalitesinde çıktı" },
    ],
    stats: [
      { value: "5", label: "Kredi / video" },
      { value: "HD", label: "Çıktı kalitesi" },
    ],
  },
];

export default function AuthDecorativePanel() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setActive((prev) => (prev + 1) % slides.length);
        setAnimating(false);
      }, 300);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const goTo = (i: number) => {
    if (i === active) return;
    setAnimating(true);
    setTimeout(() => {
      setActive(i);
      setAnimating(false);
    }, 300);
  };

  const slide = slides[active];

  return (
    <div className="hidden xl:flex w-[420px] flex-shrink-0 bg-[#0a0a0a] relative overflow-hidden flex-col justify-center p-14">

      {/* Arka plan glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#c9a96e]/6 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-[#c9a96e]/4 blur-2xl pointer-events-none" />

      {/* Nokta grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #c9a96e 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* İçerik */}
      <div
        className="relative z-10 transition-opacity duration-300"
        style={{ opacity: animating ? 0 : 1 }}
      >
        {/* Slayt etiketi */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e]" />
          <p className="text-[#c9a96e] text-[10px] font-semibold uppercase tracking-[0.35em]">
            {slide.tag}
          </p>
        </div>

        {/* Başlık */}
        <h3 className="text-white text-[1.5rem] font-bold tracking-[-0.03em] leading-tight mb-9 whitespace-pre-line">
          {slide.title}
        </h3>

        {/* Adımlar */}
        <div className="space-y-5">
          {slide.steps.map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#c9a96e] text-[11px] font-bold">{item.step}</span>
              </div>
              <div className="pt-1">
                <p className="text-white text-sm font-medium leading-snug">{item.title}</p>
                <p className="text-white/35 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Çizgi */}
        <div className="border-t border-white/[0.06] my-8" />

        {/* İstatistikler */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {slide.stats.map((stat) => (
            <div key={stat.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
              <p className="text-white text-lg font-bold tracking-tight">{stat.value}</p>
              <p className="text-white/35 text-[11px] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Nokta indikatörleri */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === active ? "24px" : "6px",
                height: "6px",
                backgroundColor: i === active ? "#c9a96e" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
