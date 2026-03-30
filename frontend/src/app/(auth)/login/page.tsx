"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { saveTokens } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";
import Image from "next/image";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import AuthDecorativePanel from "@/components/AuthDecorativePanel";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const tokens = await authApi.login(data);
      saveTokens(tokens);
      const user = await authApi.me();
      setUser(user);
      toast.success("Hoş geldiniz!");
      router.push(user.role === "admin" ? "/admin" : "/studio");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* Sol — Marka Paneli */}
      <div className="hidden lg:flex flex-col w-[440px] flex-shrink-0 bg-[#0f0f0f] p-12">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="IMA AI Studio" width={38} height={38} className="rounded-full ring-1 ring-white/20" />
          <span className="text-white text-base font-semibold tracking-tight">StudyoİMA AI</span>
        </Link>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-xs font-medium text-[#c9a96e] uppercase tracking-[0.2em] mb-6">
            AI Görsel Üretim
          </p>
          <h2 className="text-4xl font-bold tracking-[-0.03em] text-white leading-tight mb-10">
            Katalog çekimi<br />olmadan profesyonel<br />görsel üretimi
          </h2>
          <div className="space-y-5">
            {[
              { title: "Kıyafet Try-On", desc: "Ürün fotoğrafından manken görseli" },
              { title: "Gözlük Try-On",  desc: "468 yüz noktasıyla matematiksel hizalama" },
              { title: "5 Ücretsiz Üretim", desc: "Kredi kartı gerekmeden başlayın" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{f.title}</p>
                  <p className="text-white/40 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/20 text-xs">© {new Date().getFullYear()} StudyoİMA AI</p>
      </div>

      {/* Sağ — Form */}
      <div className="flex-1 flex items-center justify-center px-6 relative overflow-hidden bg-[#fdfcfa]">

        {/* Sol floating kartlar */}
        <div className="hidden 2xl:flex absolute left-10 top-1/2 -translate-y-1/2 flex-col gap-4 w-44">
          <div className="bg-white border border-[#efefef] rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-[#c9a96e] uppercase tracking-wider mb-2">Kıyafet Try-On</p>
            <p className="text-[#1a1a1a] text-sm font-semibold leading-snug">Ürün fotoğrafından manken görseli</p>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <p className="text-[11px] text-[#737373]">2 kredi / üretim</p>
            </div>
          </div>
          <div className="bg-white border border-[#efefef] rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-[#c9a96e] uppercase tracking-wider mb-2">Gözlük Try-On</p>
            <p className="text-[#1a1a1a] text-sm font-semibold leading-snug">468 nokta ile hassas hizalama</p>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <p className="text-[11px] text-[#737373]">1 kredi / üretim</p>
            </div>
          </div>
          <div className="bg-white border border-[#efefef] rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-[#c9a96e] uppercase tracking-wider mb-2">AI Video</p>
            <p className="text-[#1a1a1a] text-sm font-semibold leading-snug">Görselden akıcı video üretimi</p>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <p className="text-[11px] text-[#737373]">5 kredi / video</p>
            </div>
          </div>
        </div>

        {/* Sağ floating kartlar */}
        <div className="hidden 2xl:flex absolute right-10 top-1/2 -translate-y-1/2 flex-col gap-4 w-44">
          <div className="bg-[#0f0f0f] rounded-2xl p-4 shadow-sm">
            <p className="text-[#c9a96e] text-2xl font-bold">5</p>
            <p className="text-white/60 text-xs mt-1">Ücretsiz üretim hakkı</p>
            <p className="text-white/30 text-[10px] mt-0.5">Kayıt anında tanımlanır</p>
          </div>
          <div className="bg-white border border-[#efefef] rounded-2xl p-4 shadow-sm">
            <p className="text-[#1a1a1a] text-2xl font-bold">{"< 30s"}</p>
            <p className="text-[#737373] text-xs mt-1">Ortalama üretim süresi</p>
          </div>
          <div className="bg-white border border-[#efefef] rounded-2xl p-4 shadow-sm">
            <p className="text-[#1a1a1a] text-sm font-semibold leading-snug mb-2">Kredi kartı gerekmez</p>
            <p className="text-[#737373] text-[11px]">Hemen başlayın, beğenirseniz yükseltin</p>
          </div>
        </div>

        {/* Hafif nokta grid */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #1a1a1a 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="w-full max-w-sm relative z-10">

          {/* Mobil logo */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="flex items-center gap-3 justify-center">
              <Image src="/logo.png" alt="IMA AI Studio" width={44} height={44} className="rounded-full" />
              <span className="text-2xl font-bold tracking-tight text-[#0f0f0f]">StudyoİMA AI</span>
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-[-0.02em] text-[#0f0f0f] mb-2">Giriş Yap</h1>
            <p className="text-sm text-[#737373]">Hesabınıza erişin</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#737373] mb-2 uppercase tracking-wider">
                E-posta
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="ornek@firma.com"
                className="w-full border border-[#e5e5e5] bg-[#fafafa] rounded-xl px-4 py-3 text-sm text-[#0f0f0f] placeholder:text-[#c0c0c0] outline-none focus:border-[#0f0f0f] focus:bg-white transition-colors"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-[#737373] uppercase tracking-wider">
                  Şifre
                </label>
                <Link href="/forgot-password" className="text-xs text-[#a3a3a3] hover:text-[#0f0f0f] transition-colors">
                  Şifremi unuttum
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full border border-[#e5e5e5] bg-[#fafafa] rounded-xl px-4 py-3 pr-11 text-sm text-[#0f0f0f] placeholder:text-[#c0c0c0] outline-none focus:border-[#0f0f0f] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-3.5 text-[#b0b0b0] hover:text-[#0f0f0f] transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f0f0f] text-white py-3.5 rounded-full text-sm font-medium hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Giriş yapılıyor..." : (<>Giriş Yap <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <p className="text-center text-[#737373] text-sm mt-8">
            Hesabınız yok mu?{" "}
            <Link href="/register" className="text-[#0f0f0f] font-semibold hover:underline underline-offset-2">
              Ücretsiz kaydolun
            </Link>
          </p>
        </div>
      </div>

      <AuthDecorativePanel />
    </div>
  );
}
