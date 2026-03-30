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
  full_name: z.string().min(2, "En az 2 karakter girin"),
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "En az 8 karakter olmalı"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
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
      const tokens = await authApi.register(data);
      saveTokens(tokens);
      const user = await authApi.me();
      setUser(user);
      toast.success("Hesabınız oluşturuldu! 5 ücretsiz üretim hakkı tanımlandı.");
      router.push("/studio");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* Sol — Marka Paneli */}
      <div className="hidden lg:flex flex-col w-[440px] flex-shrink-0 bg-[#0f0f0f] p-12">
        <Link href="/">
          <Image src="/logo.png" alt="IMA AI Studio" width={38} height={38} className="rounded-full ring-1 ring-white/20" />
          <span className="text-white text-base font-semibold tracking-tight">StudyoİMA AI</span>
        </Link>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-xs font-medium text-[#c9a96e] uppercase tracking-[0.2em] mb-6">
            Ücretsiz Başlayın
          </p>
          <h2 className="text-4xl font-bold tracking-[-0.03em] text-white leading-tight mb-10">
            Dakikalar içinde<br />profesyonel<br />ürün görseli
          </h2>
          <div className="space-y-5">
            {[
              { title: "5 Ücretsiz Üretim",    desc: "Kayıt anında hesabınıza tanımlanır" },
              { title: "Kredi Kartı Yok",      desc: "Ödeme bilgisi gerekmeden başlayın" },
              { title: "Anında Erişim",        desc: "Kayıt sonrası hemen üretim yapın" },
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
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden bg-[#fdfcfa]">

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
            <Link href="/">
              <Image src="/logo.png" alt="IMA AI Studio" width={44} height={44} className="rounded-full" />
              <span className="text-2xl font-bold tracking-tight text-[#0f0f0f]">StudyoİMA AI</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-[-0.02em] text-[#0f0f0f] mb-2">Hesap Oluştur</h1>
            <p className="text-sm text-[#737373]">5 ücretsiz üretim hakkı ile hemen başlayın</p>
          </div>

          {/* Ücretsiz kredi banner */}
          <div className="flex items-center gap-2.5 bg-[#faf5ee] border border-[#e8dcc8] rounded-2xl px-4 py-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#c9a96e] flex-shrink-0" />
            <p className="text-sm text-[#8B6914] font-medium">5 ücretsiz üretim hakkı — kredi kartı gerekmez</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#737373] mb-2 uppercase tracking-wider">
                Ad Soyad
              </label>
              <input
                {...register("full_name")}
                placeholder="Adınız Soyadınız"
                className="w-full border border-[#e5e5e5] bg-[#fafafa] rounded-xl px-4 py-3 text-sm text-[#0f0f0f] placeholder:text-[#c0c0c0] outline-none focus:border-[#0f0f0f] focus:bg-white transition-colors"
              />
              {errors.full_name && <p className="text-red-500 text-xs mt-1.5">{errors.full_name.message}</p>}
            </div>

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
              <label className="block text-xs font-medium text-[#737373] mb-2 uppercase tracking-wider">
                Şifre
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 8 karakter"
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
              {loading ? "Oluşturuluyor..." : (<>Ücretsiz Başla <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <p className="text-center text-[#737373] text-sm mt-8">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="text-[#0f0f0f] font-semibold hover:underline underline-offset-2">
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>

      <AuthDecorativePanel />
    </div>
  );
}
