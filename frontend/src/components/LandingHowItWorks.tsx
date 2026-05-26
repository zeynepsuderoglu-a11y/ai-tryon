"use client";
import { useState } from "react";
import Link from "next/link";
import { Upload, Wand2, Download, Sparkles } from "lucide-react";

const TABS = [
  { id: "kiyafet",    label: "Kıyafet",    sub: "Manken Görseli" },
  { id: "gozluk",     label: "Gözlük",     sub: "Sanal Deneme" },
  { id: "video",      label: "Video",      sub: "Üretimi" },
  { id: "ghost",      label: "Ghost",      sub: "Manken" },
  { id: "arkaplan",   label: "Arka Plan",  sub: "Değişimi" },
];

const STEPS: Record<string, { num: string; icon: React.ReactNode; title: string; desc: string }[]> = {
  kiyafet: [
    { num: "01", icon: <Upload className="w-5 h-5 text-white" />, title: "Fotoğraf Yükle", desc: "Ürün fotoğrafınızı yükleyin. AI modelimiz 10 yıllık stüdyo deneyimiyle eğitildi." },
    { num: "02", icon: <Sparkles className="w-5 h-5 text-white" />, title: "Manken Seç", desc: "10 farklı manken seçeneğinden istediğinizi seçin veya otomatik seçim yapmasına izin verin." },
    { num: "03", icon: <Wand2 className="w-5 h-5 text-white" />, title: "AI İşleme", desc: "Yapay zeka fotoğrafınızı işleyerek profesyonel manken görseli oluşturur." },
    { num: "04", icon: <Download className="w-5 h-5 text-white" />, title: "İndir", desc: "Sonucu yüksek çözünürlükte indirin. Tüm formatlar desteklenir." },
  ],
  gozluk: [
    { num: "01", icon: <Upload className="w-5 h-5 text-white" />, title: "Gözlük Fotoğrafı Yükle", desc: "Gözlüğün ürün fotoğrafını yükleyin, arka plan otomatik kaldırılır." },
    { num: "02", icon: <Sparkles className="w-5 h-5 text-white" />, title: "Manken Seç", desc: "Gözlüğün takılacağı manken görselini seçin." },
    { num: "03", icon: <Wand2 className="w-5 h-5 text-white" />, title: "AI Render", desc: "468 yüz noktası ile matematiksel hizalama, AI gerçekçilik katmanı uygulanır." },
    { num: "04", icon: <Download className="w-5 h-5 text-white" />, title: "İndir", desc: "Gerçekçi gözlük görselini indirin. E-ticaret için hazır." },
  ],
  video: [
    { num: "01", icon: <Upload className="w-5 h-5 text-white" />, title: "Görsel Yükle", desc: "1-3 adet ürün veya manken fotoğrafı yükleyin." },
    { num: "02", icon: <Sparkles className="w-5 h-5 text-white" />, title: "Mod Seç", desc: "Hızlı üretim veya referanslı mod seçeneğini belirleyin." },
    { num: "03", icon: <Wand2 className="w-5 h-5 text-white" />, title: "AI İşleme", desc: "Google Veo 3.1 Fast teknolojisiyle yapay zeka video üretir." },
    { num: "04", icon: <Download className="w-5 h-5 text-white" />, title: "İndir", desc: "6-10 saniyelik HD videoyu sosyal medya için hazır indirin." },
  ],
  ghost: [
    { num: "01", icon: <Upload className="w-5 h-5 text-white" />, title: "Fotoğraf Yükle", desc: "Kıyafetin askıda, modelde veya düz zemin fotoğrafını yükleyin." },
    { num: "02", icon: <Wand2 className="w-5 h-5 text-white" />, title: "AI Dönüştürür", desc: "Yapay zeka arka planı, askıyı ve figürü otomatik kaldırır." },
    { num: "03", icon: <Sparkles className="w-5 h-5 text-white" />, title: "Ghost Efekti", desc: "3D hacimli, içi dolu profesyonel ghost mannequin oluşturulur." },
    { num: "04", icon: <Download className="w-5 h-5 text-white" />, title: "İndir", desc: "E-ticaret standardında ghost manken görselini indirin." },
  ],
  arkaplan: [
    { num: "01", icon: <Upload className="w-5 h-5 text-white" />, title: "Fotoğraf Yükle", desc: "Arka planını değiştirmek istediğiniz kişi veya ürün fotoğrafını yükleyin." },
    { num: "02", icon: <Sparkles className="w-5 h-5 text-white" />, title: "Arka Plan Seç", desc: "21 hazır arka plan seçeneğinden birini seçin ya da kendi görselinizi yükleyin." },
    { num: "03", icon: <Wand2 className="w-5 h-5 text-white" />, title: "AI Uygular", desc: "Yapay zeka arka planı değiştirir; kişi, kıyafet ve aksesuarlar korunur." },
    { num: "04", icon: <Download className="w-5 h-5 text-white" />, title: "İndir", desc: "Profesyonel arka plan değişimli görselinizi indirin." },
  ],
};

export default function LandingHowItWorks() {
  const [active, setActive] = useState("kiyafet");
  const steps = STEPS[active];

  return (
    <section id="nasil-calisir" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Badge */}
        <div className="flex justify-center mb-5">
          <span className="text-xs font-medium px-4 py-1.5 rounded-full border" style={{ color: "#3B82F6", borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.1)" }}>
            Simple Process
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-3 tracking-tight">
          Nasıl <span style={{ color: "#93C5FD" }}>Çalışır?</span>
        </h2>
        <p className="text-center text-[#9ca3af] text-base mb-10">Sadece 4 basit adımda profesyonel görseller oluşturun</p>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={
                active === tab.id
                  ? { background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", color: "#ffffff" }
                  : { background: "rgba(255,255,255,0.05)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              {tab.label}
              {tab.sub && <span className="opacity-60 ml-1 text-xs">({tab.sub})</span>}
            </button>
          ))}
        </div>

        {/* Steps grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {steps.map((step) => (
            <div
              key={step.num}
              className="rounded-2xl p-5 flex gap-4 items-start"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}>
                  {step.icon}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold" style={{ color: "#3B82F6" }}>{step.num}</span>
                  <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                </div>
                <p className="text-xs text-[#6b7280] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#FFFFFF", color: "#070D1A" }}
          >
            Şimdi Dene — Ücretsiz 5 Kredi
          </Link>
        </div>

      </div>
    </section>
  );
}
