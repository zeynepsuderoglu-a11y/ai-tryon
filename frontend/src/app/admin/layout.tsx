"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, clearTokens } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import Image from "next/image";
import { BarChart3, Users, ImageIcon, LogOut, KeyRound, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin",             label: "Genel Bakış",    icon: BarChart3  },
  { href: "/admin/users",       label: "Kullanıcılar",   icon: Users      },
  { href: "/admin/models",      label: "Modeller",       icon: ImageIcon  },
  { href: "/admin/backgrounds", label: "Arka Planlar",   icon: Layers     },
  { href: "/admin/settings",    label: "Şifre Değiştir", icon: KeyRound   },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    if (!user) {
      authApi.me().then((u) => {
        if (u.role !== "admin") { router.push("/studio"); return; }
        setUser(u);
      }).catch(() => { clearTokens(); router.push("/login"); });
    } else if (user.role !== "admin") {
      router.push("/studio");
    }
  }, []);

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      <aside className="w-56 border-r border-[#e5e5e5] bg-white flex flex-col fixed h-full">
        <div className="px-6 py-5 border-b border-[#e5e5e5]">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="IMA AI Studio" width={36} height={36} className="rounded-full" />
            <div>
              <span className="text-base font-semibold tracking-tight text-[#1a1a1a] block">StudyoİMA AI</span>
              <span className="text-[10px] text-[#c9a96e] font-medium tracking-widest uppercase">Admin Panel</span>
            </div>
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
        <div className="px-4 py-4 border-t border-[#e5e5e5]">
          <div className="px-2 mb-3">
            <p className="text-xs font-medium text-[#1a1a1a]">{user?.full_name}</p>
            <p className="text-[11px] text-[#c9a96e]">Yönetici</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2 py-2 text-xs text-[#737373] hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Çıkış Yap
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-56 overflow-auto">{children}</main>
    </div>
  );
}
