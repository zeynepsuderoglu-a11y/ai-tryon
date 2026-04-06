"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const slides = [
  {
    label: "Kıyafet",
    before: { src: "/demo/product.webp",       alt: "Kahverengi mont ürün fotoğrafı",          caption: "Ürün"         },
    after:  { src: "/demo/model.webp",          alt: "AI kıyafet try-on sonucu — manken üzerinde kahverengi mont", caption: "AI Çıktı"   },
  },
  {
    label: "Ghost Manken",
    before: { src: "/demo/ghost_before.jpg",    alt: "Ghost mannequin öncesi — askıdaki kıyafet",       caption: "Orijinal"    },
    after:  { src: "/demo/ghost_after.jpg",     alt: "Ghost mannequin sonucu — e-ticaret görseli",       caption: "Ghost Çıktı" },
  },
  {
    label: "Ghost Manken",
    before: { src: "/demo/ghost_before2.jpg",   alt: "Ghost mannequin öncesi — kahverengi kombin",       caption: "Orijinal"    },
    after:  { src: "/demo/ghost_after2.jpg",    alt: "Ghost mannequin sonucu — kahverengi gömlek kombin", caption: "Ghost Çıktı" },
  },
  {
    label: "Ghost Manken",
    before: { src: "/demo/ghost_before3.jpg",   alt: "Ghost mannequin öncesi — lacivert elbise",         caption: "Orijinal"    },
    after:  { src: "/demo/ghost_after3.jpg",    alt: "Ghost mannequin sonucu — lacivert elbise",          caption: "Ghost Çıktı" },
  },
  {
    label: "Gözlük",
    before: { src: "/demo/eyewear_model.webp",  alt: "Gözlük try-on öncesi — manken",           caption: "Orijinal"    },
    after:  { src: "/demo/eyewear_result1.webp",alt: "AI gözlük try-on sonucu",                 caption: "AI Çıktı"   },
  },
];

export default function DemoExamplesSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[current];

  return (
    <section className="py-24 px-8 bg-[#f8f8f8]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-[0.25em] mb-4">Gerçek Çıktı</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em]">AI Üretim Örnekleri</h2>
        </div>

        {/* Slide label */}
        <p className="text-center text-sm font-semibold text-[#c9a96e] uppercase tracking-[0.2em] mb-8">
          {slide.label}
        </p>

        {/* Before → After */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {/* Before */}
          <div className="text-center">
            <div className="w-44 h-60 rounded-3xl overflow-hidden shadow-sm bg-[#efefef]">
              <Image
                key={slide.before.src}
                src={slide.before.src}
                alt={slide.before.alt}
                width={176}
                height={240}
                className="w-full h-full object-cover object-top transition-opacity duration-500"
              />
            </div>
            <p className="text-xs text-[#a3a3a3] uppercase tracking-wider mt-4">{slide.before.caption}</p>
          </div>

          <ArrowRight className="w-8 h-8 text-[#d4d4d4] flex-shrink-0" />

          {/* After */}
          <div className="text-center">
            <div className="w-44 h-60 rounded-3xl overflow-hidden shadow-sm bg-[#efefef]">
              <Image
                key={slide.after.src}
                src={slide.after.src}
                alt={slide.after.alt}
                width={176}
                height={240}
                className="w-full h-full object-cover object-top transition-opacity duration-500"
              />
            </div>
            <p className="text-xs text-[#c9a96e] uppercase tracking-wider mt-4">{slide.after.caption}</p>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-10">
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
    </section>
  );
}
