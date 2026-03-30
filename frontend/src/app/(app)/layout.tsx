"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { clearTokens } from "@/lib/auth";
import Image from "next/image";
import { Wand2, LayoutDashboard, Clock, LogOut, Coins, User, ShoppingCart, Instagram, Facebook, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/studio",    label: "Stüdyo",        icon: Wand2 },
  { href: "/dashboard", label: "Panel",          icon: LayoutDashboard },
  { href: "/history",   label: "Geçmiş",         icon: Clock },
  { href: "/credits",   label: "Paket Satın Al", icon: ShoppingCart },
  { href: "/settings",  label: "Ayarlar",        icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    // Ödeme sonuç sayfaları auth gerektirmez (iyzico redirect sonrası token kaybolabilir)
    if (pathname === "/credits/success" || pathname === "/credits/fail") return;
    if (!isAuthenticated()) { router.push("/login"); return; }
    if (!user) {
      authApi.me().then(setUser).catch(() => {
        clearTokens();
        router.push("/login");
      });
    }
  }, [pathname]);

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-[#0f0f0f] flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="IMA AI Studio" width={38} height={38} className="rounded-full ring-1 ring-white/20" />
            <div>
              <span className="text-white text-base font-semibold tracking-tight block">StudyoİMA AI</span>
              <span className="text-[10px] text-[#c9a96e] font-medium tracking-[0.2em] uppercase">AI Studio</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all",
                pathname === href
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + Credits */}
        <div className="px-4 py-5 border-t border-white/10 space-y-4">
          {/* Credits */}
          {user && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/5">
                <Coins className="w-3.5 h-3.5 text-[#c9a96e] flex-shrink-0" />
                <span className="text-sm font-semibold text-white">{user.credits_remaining}</span>
                <span className="text-xs text-white/40">üretim</span>
              </div>
            </div>
          )}
          {/* User info */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-white/60" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          {/* Sosyal Medya */}
          <div className="flex gap-1">
            <a
              href="https://www.instagram.com/studyoimaai"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
              className="flex items-center gap-2 flex-1 px-2 py-2 text-xs text-white/40 hover:text-[#c9a96e] rounded-xl hover:bg-white/5 transition-all"
            >
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
            <a
              href="https://www.facebook.com/studyoimaai"
              target="_blank"
              rel="noopener noreferrer"
              title="Facebook"
              className="flex items-center gap-2 flex-1 px-2 py-2 text-xs text-white/40 hover:text-[#4267B2] rounded-xl hover:bg-white/5 transition-all"
            >
              <Facebook className="w-3.5 h-3.5" /> Facebook
            </a>
          </div>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2 py-2 text-xs text-white/40 hover:text-red-400 rounded-xl hover:bg-white/5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 md:ml-60 pb-16 md:pb-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15,15,15,0.07) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-white/10 z-50">
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                pathname === href
                  ? "text-white"
                  : "text-white/35 hover:text-white/60"
              )}
            >
              <Icon className={cn("w-5 h-5", pathname === href && "stroke-[2.5]")} />
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium text-white/35"
          >
            <LogOut className="w-5 h-5" />
            Çıkış
          </button>
        </div>
      </nav>
    </div>
  );
}
