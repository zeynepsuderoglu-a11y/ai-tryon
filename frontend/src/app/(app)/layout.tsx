"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { clearTokens } from "@/lib/auth";
import { Wand2, LayoutDashboard, Clock, LogOut, Coins, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/studio",    label: "Stüdyo",  icon: Wand2 },
  { href: "/dashboard", label: "Panel",   icon: LayoutDashboard },
  { href: "/history",   label: "Geçmiş",  icon: Clock },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    if (!user) {
      authApi.me().then(setUser).catch(() => {
        clearTokens();
        router.push("/login");
      });
    }
  }, []);

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 border-r border-[#e5e5e5] bg-white flex-col fixed h-full z-10">
        <div className="px-6 py-5 border-b border-[#e5e5e5]">
          <Link href="/" className="block">
            <span className="text-base font-semibold tracking-tight text-[#1a1a1a]">İMA Tryon</span>
            <span className="block text-[10px] text-[#c9a96e] font-medium tracking-widest uppercase mt-0.5">AI Studio</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                pathname === href
                  ? "bg-[#1a1a1a] text-white font-medium"
                  : "text-[#737373] hover:text-[#1a1a1a] hover:bg-[#f5f5f5]"
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-[#e5e5e5] space-y-3">
          {user && (
            <div className="flex items-center gap-2 px-2">
              <Coins className="w-4 h-4 text-[#c9a96e] flex-shrink-0" />
              <span className="text-sm font-medium text-[#1a1a1a]">{user.credits_remaining}</span>
              <span className="text-xs text-[#737373]">kredi</span>
            </div>
          )}
          <div className="px-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-[#737373]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#1a1a1a] truncate">{user?.full_name}</p>
                <p className="text-[11px] text-[#737373] truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2 py-2 text-xs text-[#737373] hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-56 pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e5e5] z-50">
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                pathname === href
                  ? "text-[#1a1a1a]"
                  : "text-[#a3a3a3]"
              )}
            >
              <Icon className={cn("w-5 h-5", pathname === href && "stroke-[2.5]")} />
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium text-[#a3a3a3]"
          >
            <LogOut className="w-5 h-5" />
            Çıkış
          </button>
        </div>
      </nav>
    </div>
  );
}
