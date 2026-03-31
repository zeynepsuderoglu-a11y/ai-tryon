"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const MESSAGES = [
  "Yapay zeka kıyafetinizi analiz ediyor...",
  "Manken üzerine kıyafet yerleştiriliyor...",
  "Işıklandırma ve gölgeler hesaplanıyor...",
  "Renk ve doku detayları işleniyor...",
  "Kompozisyon optimize ediliyor...",
  "Son rötuşlar uygulanıyor...",
  "Görseliniz neredeyse hazır...",
];

const EYEWEAR_MESSAGES = [
  "Yüz hatları analiz ediliyor...",
  "Gözlük çerçevesi yerleştiriliyor...",
  "Perspektif ve açı ayarlanıyor...",
  "Işık yansımaları hesaplanıyor...",
  "Son dokunuşlar uygulanıyor...",
];

const VIDEO_MESSAGES = [
  "Video sahnesi oluşturuluyor...",
  "Hareket algoritmaları işleniyor...",
  "Kare kare render ediliyor...",
  "Akışkanlık ve geçişler optimize ediliyor...",
  "Video dosyası hazırlanıyor...",
];

const GHOST_MESSAGES = [
  "Ürün fotoğrafı analiz ediliyor...",
  "Manken ve arka plan kaldırılıyor...",
  "Kıyafet şekli ve hacmi hesaplanıyor...",
  "Ghost mannequin efekti uygulanıyor...",
  "Detaylar ve dokular korunuyor...",
  "Profesyonel stüdyo görünümü oluşturuluyor...",
  "Görseliniz neredeyse hazır...",
];

const TIPS = [
  "💡 Beyaz veya açık arka planlı ürün fotoğrafları en iyi sonucu verir.",
  "✨ Kıyafetin tüm detayları net görünüyorsa daha yüksek kalite elde edilir.",
  "🎨 Farklı arka plan seçeneklerini deneyerek en uygun atmosferi yaratabilirsiniz.",
  "📸 Ürünün kumaş dokusu ve rengi fotoğrafta net gözükmelidir.",
  "🌟 Birden fazla manken ile deneme yaparak en iyi kombinasyonu bulabilirsiniz.",
];

interface Props {
  mode?: "garment" | "eyewear" | "video" | "ghost";
  estimatedSeconds?: number;
}

export default function GenerationWaiting({ mode = "garment", estimatedSeconds = 90 }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [tipIndex, setTipIndex]   = useState(0);
  const [elapsed, setElapsed]     = useState(0);
  const [progress, setProgress]   = useState(2);

  const messages = mode === "eyewear" ? EYEWEAR_MESSAGES : mode === "video" ? VIDEO_MESSAGES : mode === "ghost" ? GHOST_MESSAGES : MESSAGES;

  useEffect(() => {
    const timer    = setInterval(() => setElapsed((e) => e + 1), 1000);
    const msgTimer = setInterval(() => setMsgIndex((i) => (i + 1) % messages.length), 4000);
    const tipTimer = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 9000);
    return () => { clearInterval(timer); clearInterval(msgTimer); clearInterval(tipTimer); };
  }, [messages.length]);

  useEffect(() => {
    // Sahte ilerleme: estimatedSeconds süresinde %85'e kadar çıkar, sonra orada bekler
    const maxP = 85;
    setProgress(Math.min((elapsed / estimatedSeconds) * maxP, maxP));
  }, [elapsed, estimatedSeconds]);

  const formatTime = (s: number) =>
    s < 60 ? `${s} saniye` : `${Math.floor(s / 60)} dakika ${s % 60} saniye`;

  const remaining = Math.max(0, estimatedSeconds - elapsed);

  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">

      {/* Animasyonlu ikon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#f5f0ea] to-[#e8d5b7] flex items-center justify-center shadow-lg">
          <Sparkles className="w-10 h-10 text-[#c9a96e]" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-[#c9a96e]/40 animate-ping" />
        <div className="absolute -inset-3 rounded-full border border-[#c9a96e]/20 animate-pulse" />
      </div>

      {/* Başlık */}
      <h3 className="text-xl font-bold text-[#0f0f0f] mb-2">
        {mode === "video" ? "Video Üretiliyor" : mode === "ghost" ? "Ghost Mannequin Hazırlanıyor" : "Görseliniz Hazırlanıyor"}
      </h3>
      <p className="text-sm text-[#737373] mb-8 max-w-xs leading-relaxed">
        Yüksek kaliteli bir {mode === "video" ? "video" : mode === "ghost" ? "ghost mannequin görseli" : "görsel"} üretiyoruz.
        Lütfen sayfayı kapatmadan bekleyin.
      </p>

      {/* Dönen mesaj */}
      <div className="h-6 mb-5 overflow-hidden">
        <p key={msgIndex} className="text-sm text-[#c9a96e] font-medium animate-pulse">
          {messages[msgIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm mb-3">
        <div className="h-1.5 bg-[#f0ece6] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] rounded-full transition-all duration-[1200ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Süre */}
      <p className="text-xs text-[#b0b0b0] mb-8">
        {remaining > 5
          ? `Tahmini kalan süre: yaklaşık ${formatTime(remaining)}`
          : elapsed > 5
          ? "Neredeyse bitti, biraz daha bekleyin..."
          : "Başlatılıyor..."}
      </p>

      {/* İpucu kartı */}
      <div className="w-full max-w-sm bg-[#faf7f3] border border-[#ede5d8] rounded-2xl p-4 text-left transition-all duration-500">
        <p className="text-[11px] font-semibold text-[#a08040] uppercase tracking-wide mb-1.5">İpucu</p>
        <p className="text-xs text-[#8a7a5a] leading-relaxed">{TIPS[tipIndex]}</p>
      </div>

    </div>
  );
}
