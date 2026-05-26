"use client";

import BeforeAfterSlider from "./BeforeAfterSlider";

const EXAMPLES = [
  {
    beforeSrc: "/demo/product.webp",
    afterSrc: "/demo/model.webp",
    beforeLabel: "Ürün Fotoğrafı",
    afterLabel: "AI Manken",
    title: "Kıyafet",
    desc: "Askıdaki ürününüz saniyeler içinde manken üzerinde",
  },
  {
    beforeSrc: "/demo/ghost_before.jpg",
    afterSrc: "/demo/ghost_after.jpg",
    beforeLabel: "Ham Görsel",
    afterLabel: "Ghost Manken",
    title: "Ghost Manken",
    desc: "Profesyonel ghost mannequin efekti, tek tıkla",
  },
  {
    beforeSrc: "/demo/eyewear_model.jpg",
    afterSrc: "/demo/eyewear_result1.jpg",
    beforeLabel: "Model",
    afterLabel: "Gözlük Deneme",
    title: "Gözlük",
    desc: "468 yüz noktası ile mükemmel hizalamalı sanal deneme",
  },
];

// Video URL'sini buraya yapıştırın (YouTube embed veya direkt mp4/webm)
// Örnek YouTube: "https://www.youtube.com/embed/VIDEO_ID"
// Boş bırakırsanız video bölümü görünmez
const VIDEO_URL = "";

export default function LandingBeforeAfter() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Başlık */}
        <div className="flex justify-center mb-5">
          <span className="text-xs font-medium px-4 py-1.5 rounded-full border"
            style={{ color: "#3B82F6", borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.1)" }}>
            Önce & Sonra
          </span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-3 tracking-tight">
          Farkı{" "}
          <span style={{ color: "#93C5FD" }}>
            Kendiniz Görün
          </span>
        </h2>
        <p className="text-center text-[#9ca3af] mb-12 max-w-xl mx-auto">
          Fareyi üzerinde sürükleyin — masaüstünde otomatik takip eder, telefonda parmağınızla kaydırın
        </p>

        {/* Slider grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {EXAMPLES.map((ex) => (
            <div key={ex.title} className="flex flex-col gap-3">
              <BeforeAfterSlider
                beforeSrc={ex.beforeSrc}
                afterSrc={ex.afterSrc}
                beforeLabel={ex.beforeLabel}
                afterLabel={ex.afterLabel}
              />
              <div>
                <p className="text-white font-semibold text-sm">{ex.title}</p>
                <p className="text-[#9ca3af] text-xs mt-0.5">{ex.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Video bölümü — VIDEO_URL doluysa göster */}
        {VIDEO_URL && (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-5">
              <span className="text-xs font-medium px-4 py-1.5 rounded-full border"
                style={{ color: "#3B82F6", borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.1)" }}>
                Tanıtım Videosu
              </span>
            </div>
            <h3 className="text-3xl font-bold text-center text-white mb-8">
              Nasıl Çalışır?
            </h3>
            <div
              className="relative w-full rounded-2xl overflow-hidden"
              style={{ paddingBottom: "56.25%", background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <iframe
                src={VIDEO_URL}
                title="StudyoİMA Tanıtım"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
