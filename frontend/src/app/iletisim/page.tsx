import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Mail, Instagram, Facebook } from "lucide-react";
import ContactForm from "./ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "StudyoİMA AI iletişim bilgileri. E-posta: support@studyoima.com — Merkez Mh. Merter Sk. No:42/1 Güngören / İSTANBUL. Yapay zeka kıyafet ve gözlük görselleştirme platformu.",
  alternates: { canonical: "https://www.studyoima.com/iletisim" },
  openGraph: {
    title: "İletişim | StudyoİMA AI",
    description: "StudyoİMA AI iletişim bilgileri. E-posta ve adres bilgileri.",
    url: "https://www.studyoima.com/iletisim",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "StudyoİMA AI İletişim" }],
  },
};

export default function IletisimPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-[#e5e5e5]">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="IMA AI Studio" width={30} height={30} className="rounded-full" />
            <span className="text-base font-semibold tracking-tight">StudyoİMA AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#737373] hover:text-[#1a1a1a] transition-colors">Giriş Yap</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">Ücretsiz Başla</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto">

          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#1a1a1a] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Ana Sayfa
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight mb-2">İletişim</h1>
          <p className="text-sm text-[#737373] mb-10">
            Sorularınız, demo talepleriniz veya iş birliği teklifleriniz için bizimle iletişime geçin.
          </p>

          {/* İletişim Kartları */}
          <div className="grid sm:grid-cols-2 gap-4 mb-10">

            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-[#faf5ee] border border-[#e8dcc8] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-[#c9a96e]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-1">Adres</p>
                <p className="text-sm text-[#1a1a1a] leading-relaxed">
                  Merkez Mh. Merter Sk. No:42/1<br />
                  Güngören / İSTANBUL
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-[#faf5ee] border border-[#e8dcc8] flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-[#c9a96e]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-1">E-posta</p>
                <a
                  href="mailto:support@studyoima.com"
                  className="text-sm text-[#1a1a1a] hover:text-[#c9a96e] transition-colors"
                >
                  support@studyoima.com
                </a>
              </div>
            </div>

          </div>

          {/* İletişim Formu */}
          <h2 className="text-xl font-semibold text-[#1a1a1a] mb-1">Bize Ulaşın</h2>
          <p className="text-sm text-[#737373] mb-6">
            Sorularınız, demo talepleriniz veya destek için aşağıdaki formu doldurun.
          </p>
          <ContactForm />

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-[#1a1a1a]">StudyoİMA AI</span>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-[#737373]">
            <Link href="/hakkimizda" className="hover:text-[#1a1a1a] transition-colors">Hakkımızda</Link>
            <Link href="/iletisim" className="hover:text-[#1a1a1a] transition-colors">İletişim</Link>
            <Link href="/gizlilik" className="hover:text-[#1a1a1a] transition-colors">Gizlilik Politikası</Link>
            <Link href="/satis-sozlesmesi" className="hover:text-[#1a1a1a] transition-colors">Satış Sözleşmesi</Link>
            <a href="https://www.instagram.com/studyoimaai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#1a1a1a] transition-colors">
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
            <a href="https://www.facebook.com/studyoimaai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#1a1a1a] transition-colors">
              <Facebook className="w-3.5 h-3.5" /> Facebook
            </a>
          </div>
          <p className="text-xs text-[#a3a3a3]">© {new Date().getFullYear()} StudyoİMA AI</p>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-5 border-t border-[#f0f0f0] flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="text-[11px] text-[#b0b0b0] tracking-wide">GÜVENLİ ÖDEME</span>
          <div className="flex items-center gap-2">
            <div className="h-8 px-3 flex items-center justify-center border border-[#e0e0e0] rounded-md bg-white shadow-sm">
              <Image src="/visa.svg" alt="Visa" width={46} height={15} className="object-contain" />
            </div>
            <div className="h-8 px-3 flex items-center justify-center border border-[#e0e0e0] rounded-md bg-white shadow-sm">
              <Image src="/mastercard.svg" alt="Mastercard" width={38} height={24} className="object-contain" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
