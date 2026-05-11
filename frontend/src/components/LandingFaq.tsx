"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    cat: "Genel",
    q: "Kredi kartı gerekli mi?",
    a: "Hayır, ücretsiz kayıt için kredi kartı gerekmez. Ücretsiz 5 krediniz ile platformu keşfedebilirsiniz. Ücretli planlarda ödeme yapmak için kredi kartı veya banka kartı kullanabilirsiniz.",
  },
  {
    cat: "Faturalandırma",
    q: "Kredileri nasıl satın alabilirim?",
    a: "Hesabınıza giriş yaptıktan sonra Kredi Al sayfasından istediğiniz paketi seçerek güvenli ödeme altyapımız üzerinden kredi satın alabilirsiniz.",
  },
  {
    cat: "Faturalandırma",
    q: "Kredilerimin son kullanma tarihi var mı?",
    a: "Hayır, satın aldığınız kredilerin son kullanma tarihi yoktur. Hesabınız aktif kaldığı sürece kredileriniz kullanılabilir.",
  },
  {
    cat: "Faturalandırma",
    q: "İptal ve iade politikanız nedir?",
    a: "Kullanılmamış krediler için satın alma tarihinden itibaren 14 gün içinde cayma hakkı kullanılabilir. Kullanılmış krediler için iade yapılmaz. İptal talebinizi ilgi@ilet.in adresine iletebilirsiniz.",
  },
  {
    cat: "Teknik",
    q: "Hangi görsel formatları destekleniyor?",
    a: "JPG, PNG, WEBP ve TIFF formatları desteklenmektedir. En iyi sonuçlar için yüksek çözünürlüklü (en az 800x800 piksel) görseller önerilir.",
  },
  {
    cat: "Teknik",
    q: "Üretilen görseller ne kadar süre saklanır?",
    a: "Üretilen görseller 90 gün boyunca hesabınızda saklanır. Bu süre içinde istediğiniz zaman indirebilirsiniz.",
  },
];

const CATS = ["Genel", "Teknik", "Faturalandırma"];

export default function LandingFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [cat, setCat] = useState("Genel");
  const [search, setSearch] = useState("");

  const filtered = FAQS.filter((f) => {
    const matchCat = f.cat === cat;
    const matchSearch = !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <section id="sss" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Badge */}
        <div className="flex justify-center mb-5">
          <span className="text-xs font-medium px-4 py-1.5 rounded-full border" style={{ color: "#c084fc", borderColor: "rgba(192,132,252,0.3)", background: "rgba(192,132,252,0.08)" }}>
            FAQ
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-3 tracking-tight">
          Sıkça Sorulan <span style={{ background: "linear-gradient(135deg, #f0abfc, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sorular</span>
        </h2>
        <p className="text-center text-[#9ca3af] mb-10">Cevabını bulamadığınız sorular için bizimle iletişime geçebilirsiniz</p>

        {/* Search */}
        <div className="relative mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sorularınızı arayın..."
            className="w-full py-3 pl-5 pr-4 rounded-xl text-sm text-white placeholder-[#6b7280] outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-8">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => { setCat(c); setOpenIdx(null); }}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={
                cat === c
                  ? { background: "linear-gradient(135deg, #a855f7, #ec4899)", color: "#ffffff" }
                  : { background: "rgba(255,255,255,0.05)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              {c}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-[#6b7280] py-8">Arama sonucu bulunamadı.</p>
          )}
          {filtered.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#a855f7" }} />
                  <span className="text-sm font-medium text-white">{faq.q}</span>
                </div>
                <ChevronDown
                  className="w-4 h-4 flex-shrink-0 text-[#6b7280] transition-transform"
                  style={{ transform: openIdx === i ? "rotate(180deg)" : "rotate(0)" }}
                />
              </button>
              {openIdx === i && (
                <div className="px-5 pb-4 pl-12">
                  <p className="text-sm text-[#9ca3af] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-[#9ca3af] text-sm mb-4">Hâlâ sorunuz var mı?</p>
          <Link
            href="/iletisim"
            className="inline-flex items-center px-8 py-3.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" }}
          >
            Destek Ekibimize Ulaşın
          </Link>
        </div>

      </div>
    </section>
  );
}
