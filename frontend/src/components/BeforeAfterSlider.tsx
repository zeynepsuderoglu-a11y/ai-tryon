"use client";

import { useRef, useCallback } from "react";
import Image from "next/image";
import { useState } from "react";

interface Props {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspectRatio?: string;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Ürün",
  afterLabel = "Sonuç",
  aspectRatio = "3/4",
}: Props) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl cursor-col-resize select-none w-full"
      style={{ aspectRatio, touchAction: "none" }}
      onMouseMove={(e) => updatePosition(e.clientX)}
      onTouchMove={(e) => { e.preventDefault(); updatePosition(e.touches[0].clientX); }}
      onTouchStart={(e) => updatePosition(e.touches[0].clientX)}
    >
      {/* Sonuç görseli (arka plan) */}
      <Image
        src={afterSrc}
        alt={afterLabel}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 33vw"
      />

      {/* Ürün görseli (kırpılmış) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={beforeSrc}
          alt={beforeLabel}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      {/* Bölücü çizgi */}
      <div
        className="absolute inset-y-0 w-[2px] bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.6)] pointer-events-none"
        style={{ left: `${position}%` }}
      >
        {/* Tutamaç */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center gap-0.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 7H1M1 7L3 5M1 7L3 9" stroke="#1e1b4b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 7H13M13 7L11 5M13 7L11 9" stroke="#1e1b4b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Etiketler */}
      <div className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full pointer-events-none"
        style={{ background: "rgba(0,0,0,0.55)", color: "#e5e7eb", backdropFilter: "blur(4px)" }}>
        {beforeLabel}
      </div>
      <div className="absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full pointer-events-none"
        style={{ background: "rgba(168,85,247,0.7)", color: "#fff", backdropFilter: "blur(4px)" }}>
        {afterLabel}
      </div>
    </div>
  );
}
