export default function AuthDecorativePanel() {
  return (
    <div className="hidden xl:flex w-[420px] flex-shrink-0 bg-[#0a0a0a] relative overflow-hidden flex-col justify-center p-14">

      {/* Arka plan glow efektleri */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#c9a96e]/6 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-[#c9a96e]/4 blur-2xl pointer-events-none" />

      {/* Nokta grid deseni */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #c9a96e 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* İçerik */}
      <div className="relative z-10">

        {/* Başlık */}
        <p className="text-[#c9a96e] text-[10px] font-semibold uppercase tracking-[0.35em] mb-3">
          Nasıl Çalışır
        </p>
        <h3 className="text-white text-[1.6rem] font-bold tracking-[-0.03em] leading-tight mb-10">
          3 adımda<br />profesyonel görsel
        </h3>

        {/* Adımlar */}
        <div className="space-y-5">
          {[
            {
              step: "01",
              title: "Ürün Fotoğrafı Yükle",
              desc: "Beyaz fon veya düz zemin, flat-lay veya askı",
            },
            {
              step: "02",
              title: "AI Analiz & İşlem",
              desc: "Kıyafet tipi, renk ve detaylar otomatik okunur",
            },
            {
              step: "03",
              title: "Profesyonel Görsel",
              desc: "Manken üzerinde stüdyo kalitesinde çıktı",
            },
          ].map((item) => (
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
        <div className="border-t border-white/[0.06] my-9" />

        {/* İstatistikler */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "5", label: "Ücretsiz üretim" },
            { value: "< 30s", label: "Ortalama süre" },
            { value: "3", label: "Üretim türü" },
            { value: "7/24", label: "Erişim" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
              <p className="text-white text-lg font-bold tracking-tight">{stat.value}</p>
              <p className="text-white/35 text-[11px] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
