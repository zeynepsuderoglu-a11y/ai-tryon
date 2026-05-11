import Link from "next/link";
import { Mail, MapPin, Clock } from "lucide-react";
import ContactForm from "./ContactForm";
import SiteFooter from "@/components/SiteFooter";
import LandingNav from "@/components/LandingNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim | StudyoiMA AI",
  description: "StudyoiMA AI iletişim bilgileri. E-posta: ilgi@ilet.in — Merkez Mh. Merter Sk. No:42/1 Güngören / İSTANBUL.",
  alternates: { canonical: "https://www.studyoima.com/iletisim" },
};

export default function IletisimPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#080810" }}>

      <LandingNav activePage="iletisim" />

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#c084fc" }}>
              Get in Touch
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Bizimle{" "}
              <span style={{ background: "linear-gradient(135deg, #f0abfc 0%, #c084fc 50%, #ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                İletişime Geçin
              </span>
            </h1>
            <p className="text-[#9ca3af]">Sorularınız, önerileriniz veya işbirliği teklifleriniz için bize ulaşın</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">

            {/* Sol: İletişim kartları */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-5">İletişim Yöntemleri</h2>

              <div className="space-y-3 mb-6">

                {/* E-posta */}
                <a
                  href="mailto:ilgi@ilet.in"
                  className="flex items-center gap-4 p-4 rounded-xl transition-colors group"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.3)" }}>
                    <Mail className="w-5 h-5 text-[#c084fc]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7280] mb-0.5">E-posta</p>
                    <p className="text-sm font-medium text-white">ilgi@ilet.in</p>
                  </div>
                </a>

                {/* Adres */}
                <div
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.3)" }}>
                    <MapPin className="w-5 h-5 text-[#c084fc]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7280] mb-0.5">Adres</p>
                    <p className="text-sm font-medium text-white leading-relaxed">
                      Merkez Mh. Merter Sk. No:42/1<br />Güngören / İSTANBUL
                    </p>
                  </div>
                </div>

              </div>

              {/* Çalışma Saatleri */}
              <div
                className="p-5 rounded-xl"
                style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-[#c084fc]" />
                  <p className="text-sm font-semibold text-white">Çalışma Saatleri</p>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#9ca3af]">Pazartesi - Cuma</span>
                    <span className="text-white font-medium">09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9ca3af]">Cumartesi</span>
                    <span className="text-white font-medium">10:00 - 15:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9ca3af]">Pazar</span>
                    <span className="text-[#6b7280]">Kapalı</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ: Form */}
            <div>
              <ContactForm />
            </div>

          </div>

        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
