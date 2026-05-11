import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Instagram, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer style={{ background: "#0b0d14" }} className="text-white">
      <div className="max-w-7xl mx-auto px-8 pt-16 pb-6">

        {/* Ana grid: 5 kolon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10 mb-12">

          {/* Logo + açıklama + iletişim */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.png" alt="StudyoiMA" width={34} height={34} className="rounded-full" />
              <span className="text-sm font-semibold tracking-tight">StudyoiMA</span>
            </Link>
            <p className="text-[13px] leading-relaxed mb-5 max-w-[220px]" style={{ color: "#9ca3af" }}>
              E-ticaret işletmeleri için yapay zeka destekli görsel ve video üretim platformu. Profesyonel görseller, saniyeler içinde.
            </p>
            <div className="space-y-2.5">
              <a href="mailto:ilgi@ilet.in" className="flex items-center gap-2 text-[13px] text-[#9ca3af] hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5 flex-shrink-0 text-[#6b7280]" />
                ilgi@ilet.in
              </a>
              <div className="flex items-start gap-2 text-[13px] text-[#9ca3af]">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#6b7280]" />
                <span>Merkez Mh. Merter Sk. No:42/1<br />Güngören / İSTANBUL</span>
              </div>
            </div>
          </div>

          {/* Ürünler */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-4 text-[#6b7280]">Ürünler</p>
            <ul className="space-y-2.5">
              {[
                { label: "Kıyafet Manken",    href: "/studio" },
                { label: "Gözlük Sanal Deneme", href: "/studio" },
                { label: "Video Üretimi",     href: "/studio" },
                { label: "Ghost Manken",      href: "/studio" },
                { label: "Arka Plan Değişimi", href: "/studio" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[13px] text-[#9ca3af] hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Şirket */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-4 text-[#6b7280]">Şirket</p>
            <ul className="space-y-2.5">
              {[
                { label: "Hakkımızda", href: "/hakkimizda" },
                { label: "İletişim",   href: "/iletisim" },
                { label: "Blog",       href: "/iletisim" },
                { label: "Kariyer",    href: "/iletisim" },
                { label: "Basın",      href: "/iletisim" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[13px] text-[#9ca3af] hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Destek */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-4 text-[#6b7280]">Destek</p>
            <ul className="space-y-2.5">
              {[
                { label: "Yardım Merkezi",     href: "/iletisim" },
                { label: "SSS",               href: "/#sss" },
                { label: "Eğitimler",          href: "/iletisim" },
                { label: "API Dokümantasyonu", href: "/iletisim" },
                { label: "Durum Sayfası",      href: "/iletisim" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[13px] text-[#9ca3af] hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-4 text-[#6b7280]">Yasal</p>
            <ul className="space-y-2.5">
              {[
                { label: "Gizlilik Politikası", href: "/gizlilik" },
                { label: "Kullanım Koşulları",  href: "/satis-sozlesmesi" },
                { label: "Satış Sözleşmesi",    href: "/satis-sozlesmesi" },
                { label: "Çerez Politikası",    href: "/gizlilik" },
                { label: "GDPR Uyumluluğu",     href: "/gizlilik" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[13px] text-[#9ca3af] hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Alt çizgi */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-5" style={{ borderTop: "1px solid #1f2937" }}>

          <p className="text-[12px] text-[#6b7280]">
            © {new Date().getFullYear()} StudyoiMA. Tüm hakları saklıdır.
          </p>

          {/* Sosyal medya */}
          <div className="flex items-center gap-2">
            {[
              { href: "https://www.instagram.com/studyoimaai/", icon: <Instagram className="w-4 h-4" /> },
              { href: "https://www.facebook.com/studyoimaai",   icon: <Facebook  className="w-4 h-4" /> },
              { href: "#", icon: <Twitter  className="w-4 h-4" /> },
              { href: "#", icon: <Linkedin className="w-4 h-4" /> },
              { href: "#", icon: <Youtube  className="w-4 h-4" /> },
            ].map((s, i) => (
              <a
                key={i}
                href={s.href}
                target={s.href !== "#" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                style={{ border: "1px solid #1f2937" }}
              >
                {s.icon}
              </a>
            ))}
          </div>

          {/* SSL + KVKK */}
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[12px] text-[#6b7280]">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              SSL Güvenli
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-[#6b7280]">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              KVKK Uyumlu
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}
