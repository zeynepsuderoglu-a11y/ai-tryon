import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Instagram, Facebook } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="bg-[#0d0d0d] text-white">
      <div className="max-w-7xl mx-auto px-8 pt-16 pb-10">

        {/* Üst satır: Logo + kolonlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Logo + açıklama + iletişim */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.png" alt="StudyoİMA AI" width={32} height={32} className="rounded-full" />
              <span className="text-base font-semibold">StudyoİMA AI</span>
            </Link>
            <p className="text-sm text-[#888] leading-relaxed mb-6 max-w-xs">
              E-ticaret işletmeleri için yapay zeka destekli görsel ve video üretim platformu.
              Profesyonel görseller, saniyeler içinde.
            </p>
            <div className="space-y-2.5">
              <a href="mailto:ilgi@ilet.in" className="flex items-center gap-2.5 text-sm text-[#aaa] hover:text-white transition-colors">
                <Mail className="w-4 h-4 flex-shrink-0 text-[#666]" />
                ilgi@ilet.in
              </a>
              <div className="flex items-start gap-2.5 text-sm text-[#aaa]">
                <MapPin className="w-4 h-4 flex-shrink-0 text-[#666] mt-0.5" />
                <span>Merkez Mh. Merter Sk. No:42/1<br />Güngören / İSTANBUL</span>
              </div>
            </div>
          </div>

          {/* Ürünler */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-4">Ürünler</p>
            <ul className="space-y-2.5 text-sm text-[#999]">
              <li><Link href="/studio?tab=mannequin" className="hover:text-white transition-colors">Kıyafet Manken</Link></li>
              <li><Link href="/studio?tab=eyewear" className="hover:text-white transition-colors">Gözlük Sanal Deneme</Link></li>
              <li><Link href="/studio?tab=video" className="hover:text-white transition-colors">Video Üretimi</Link></li>
              <li><Link href="/studio?tab=ghost" className="hover:text-white transition-colors">Ghost Manken</Link></li>
              <li><Link href="/studio?tab=background" className="hover:text-white transition-colors">Arka Plan Değişimi</Link></li>
            </ul>
          </div>

          {/* Şirket */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-4">Şirket</p>
            <ul className="space-y-2.5 text-sm text-[#999]">
              <li><Link href="/hakkimizda" className="hover:text-white transition-colors">Hakkımızda</Link></li>
              <li><Link href="/iletisim" className="hover:text-white transition-colors">İletişim</Link></li>
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-4">Yasal</p>
            <ul className="space-y-2.5 text-sm text-[#999]">
              <li><Link href="/gizlilik" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
              <li><Link href="/satis-sozlesmesi" className="hover:text-white transition-colors">Satış Sözleşmesi</Link></li>
            </ul>
          </div>

        </div>

        {/* Alt satır: Copyright + Sosyal medya + Güvenlik */}
        <div className="border-t border-[#1e1e1e] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#555]">© {new Date().getFullYear()} StudyoİMA AI. Tüm hakları saklıdır.</p>

          {/* Sosyal medya */}
          <div className="flex items-center gap-3">
            <a href="https://www.instagram.com/studyoimaai/" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full border border-[#2a2a2a] flex items-center justify-center text-[#666] hover:text-white hover:border-[#444] transition-colors">
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a href="https://www.facebook.com/studyoimaai" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full border border-[#2a2a2a] flex items-center justify-center text-[#666] hover:text-white hover:border-[#444] transition-colors">
              <Facebook className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* SSL + KVKK */}
          <div className="flex items-center gap-4 text-xs text-[#555]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              SSL Güvenli
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              KVKK Uyumlu
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
