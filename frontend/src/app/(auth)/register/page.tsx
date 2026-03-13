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
import { Eye, EyeOff } from "lucide-react";

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
      toast.success("Hesabınız oluşturuldu! 3 ücretsiz kredi tanımlandı.");
      router.push("/studio");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-semibold tracking-tight text-[#1a1a1a]">İMA Tryon</span>
          </Link>
          <p className="text-sm text-[#737373] mt-2">Ücretsiz hesap oluşturun</p>
        </div>

        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8">
          <div className="bg-[#f9f6f0] border border-[#e8dcc8] rounded-lg px-4 py-3 text-sm text-[#8B6914] mb-5">
            3 ücretsiz kredi — kredi kartı gerekmez
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#737373] mb-1.5 uppercase tracking-wider">Ad Soyad</label>
              <input {...register("full_name")} placeholder="Adınız Soyadınız" />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#737373] mb-1.5 uppercase tracking-wider">E-posta</label>
              <input {...register("email")} type="email" placeholder="ornek@firma.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#737373] mb-1.5 uppercase tracking-wider">Şifre</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 8 karakter"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-2.5 text-[#a3a3a3] hover:text-[#1a1a1a]"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Oluşturuluyor..." : "Ücretsiz Başla"}
            </button>
          </form>

          <p className="text-center text-[#737373] text-sm mt-6">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="text-[#1a1a1a] font-medium hover:underline">
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
