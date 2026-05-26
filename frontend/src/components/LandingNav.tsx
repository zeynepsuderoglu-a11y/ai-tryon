import Link from "next/link";
import Image from "next/image";

interface LandingNavProps {
  activePage?: "home" | "iletisim" | "hakkimizda" | "other";
}

export default function LandingNav({ activePage = "home" }: LandingNavProps) {
  const base = activePage === "home" ? "" : "/";

  return (
    <nav
      className="fixed top-0 w-full z-50 border-b"
      style={{ background: "rgba(8,8,8,0.9)", backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <Image src="/logo.png" alt="StudyoiMA" width={32} height={32} className="rounded-full" priority />
          <span className="text-base font-semibold text-white tracking-tight">StudyoiMA</span>
        </Link>

        <div className="hidden lg:flex items-center gap-7">
          {[
            { label: "Hizmetler",     href: `${base}#hizmetler` },
            { label: "Nasıl Çalışır", href: `${base}#nasil-calisir` },
            { label: "Örnekler",      href: `${base}#ornekler` },
            { label: "Yorumlar",      href: `${base}#yorumlar` },
            { label: "Fiyatlandırma", href: `${base}#fiyatlandirma` },
            { label: "SSS",           href: `${base}#sss` },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
              {item.label}
            </Link>
          ))}
          <Link
            href="/iletisim"
            className={`text-sm transition-colors ${activePage === "iletisim" ? "text-[#3B82F6]" : "text-[#9ca3af] hover:text-white"}`}
          >
            İletişim
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#9ca3af] hover:text-white transition-colors hidden sm:block">
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium px-5 py-2 rounded-full text-white hover:opacity-90 transition-opacity"
            style={{ background: "#FFFFFF", color: "#070D1A" }}
          >
            Ücretsiz Başla
          </Link>
        </div>
      </div>
    </nav>
  );
}
