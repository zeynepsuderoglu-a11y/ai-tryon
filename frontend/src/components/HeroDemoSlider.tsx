"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const slides = [
  {
    label: "Kıyafet",
    before: { src: "/demo/product.webp", alt: "Kıyafet try-on — ürün fotoğrafı girdi" },
    after:  { src: "/demo/model.webp",   alt: "AI kıyafet try-on sonucu — manken üzerinde ürün" },
    afterLabel: "AI Çıktı",
  },
  {
    label: "Ghost Manken",
    before: { src: "/demo/ghost_before.jpg", alt: "Ghost manken öncesi — askıdaki ceket" },
    after:  { src: "/demo/ghost_after.jpg",  alt: "Ghost manken sonucu — profesyonel e-ticaret görseli" },
    afterLabel: "Ghost Çıktı",
  },
];

export default function HeroDemoSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[current];

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Before */}
      <div className="space-y-4">
        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-[#f5f5f5]">
          <Image
            key={slide.before.src}
            src={slide.before.src}
            alt={slide.before.alt}
            fill
            className="object-cover transition-opacity duration-700"
            priority
            sizes="(max-width: 768px) 40vw, 20vw"
          />
        </div>
        <div className="bg-[#f5f5f5] rounded-2xl px-4 py-3 text-center">
          <p className="text-[10px] text-[#a3a3a3] uppercase tracking-widest">Ürün</p>
        </div>
      </div>

      {/* After */}
      <div className="space-y-4 mt-10">
        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-[#f5f5f5]">
          <Image
            key={slide.after.src}
            src={slide.after.src}
            alt={slide.after.alt}
            fill
            className="object-cover transition-opacity duration-700"
            priority
            sizes="(max-width: 768px) 40vw, 20vw"
          />
        </div>
        <div className="bg-[#c9a96e] rounded-2xl px-4 py-3 text-center">
          <p className="text-[10px] text-white/80 uppercase tracking-widest">{slide.afterLabel}</p>
        </div>
      </div>

      {/* Dots */}
      <div className="col-span-2 flex justify-center gap-2 mt-2">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-[#c9a96e]" : "w-1.5 bg-[#d4d4d4]"
            }`}
            aria-label={s.label}
          />
        ))}
      </div>
    </div>
  );
}
