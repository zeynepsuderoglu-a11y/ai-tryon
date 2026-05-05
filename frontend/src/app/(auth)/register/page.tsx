"use client";

import { useState, useRef, useEffect } from "react";
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
import { Eye, EyeOff, ArrowRight, Mail, RotateCcw } from "lucide-react";
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

  /* ── Adım 2: doğrulama ── */
  const [step, setStep] = useState<"form" | "verify">("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  /* ── Geri sayım ── */
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  /* ── Adım 1: kayıt formu ── */
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.register(data);
      setPendingEmail(data.email);
      setStep("verify");
      setResendCountdown(60);
      toast.success("Doğrulama kodu e-postanıza gönderildi");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  };

  /* ── Adım 2: kod doğrulama ── */
  const handleCodeChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) codeRefs.current[idx + 1]?.focus();
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      codeRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) { toast.error("6 haneli kodu eksiksiz girin"); return; }
    setVerifying(true);
    try {
      const tokens = await authApi.verifyEmail(pendingEmail, fullCode);
      saveTokens(tokens);
      const user = await authApi.me();
      setUser(user);
      toast.success(`Hoş geldiniz! ${user.credits_remaining} ücretsiz üretim hakkı tanımlandı.`);
      router.push("/studio");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Doğrulama başarısız");
      setCode(["", "", "", "", "", ""]);
      codeRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    try {
      await authApi.resendVerification(pendingEmail);
      setResendCountdown(60);
      setCode(["", "", "", "", "", ""]);
      codeRefs.current[0]?.focus();
      toast.success("Yeni kod gönderildi");
    } catch {
      toast.error("Kod gönderilemedi");
    }
  };

  /* ──────────────────────────────── UI ──────────────────────────────── */
  return (
    <div className="min-h-screen flex bg-white">

      {/* Sol — Marka Paneli */}
      <div className="hidden lg:flex flex-col w-[440px] flex-shrink-0 bg-[#0f0f0f] p-12">
        <Link href="/" className="flex items-center gap-2.5 mb-auto">
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

      {/* Sağ — Form veya Doğrulama */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobil logo */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="inline-flex flex-col items-center gap-2">
              <Image src="/logo.png" alt="IMA AI Studio" width={44} height={44} className="rounded-full" />
              <span className="text-2xl font-bold tracking-tight text-[#0f0f0f]">StudyoİMA AI</span>
            </Link>
          </div>

          {/* ── ADIM 1: Kayıt Formu ── */}
          {step === "form" && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-[-0.02em] text-[#0f0f0f] mb-2">Hesap Oluştur</h1>
                <p className="text-sm text-[#737373]">5 ücretsiz üretim hakkı ile hemen başlayın</p>
              </div>

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
                  {loading ? "Gönderiliyor..." : (<>Devam Et <ArrowRight className="w-4 h-4" /></>)}
                </button>
              </form>

              <p className="text-center text-[#737373] text-sm mt-8">
                Zaten hesabınız var mı?{" "}
                <Link href="/login" className="text-[#0f0f0f] font-semibold hover:underline underline-offset-2">
                  Giriş yapın
                </Link>
              </p>
            </>
          )}

          {/* ── ADIM 2: E-posta Doğrulama ── */}
          {step === "verify" && (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center mb-5">
                  <Mail className="w-5 h-5 text-[#737373]" />
                </div>
                <h1 className="text-3xl font-bold tracking-[-0.02em] text-[#0f0f0f] mb-2">E-postanızı Doğrulayın</h1>
                <p className="text-sm text-[#737373]">
                  <span className="font-medium text-[#0f0f0f]">{pendingEmail}</span> adresine 6 haneli doğrulama kodu gönderdik.
                </p>
              </div>

              {/* 6 kutucuk */}
              <div className="flex gap-2 mb-6" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className="flex-1 h-14 text-center text-xl font-bold border border-[#e5e5e5] bg-[#fafafa] rounded-xl outline-none focus:border-[#0f0f0f] focus:bg-white transition-colors text-[#0f0f0f]"
                  />
                ))}
              </div>

              <button
                onClick={handleVerify}
                disabled={verifying || code.join("").length < 6}
                className="w-full bg-[#0f0f0f] text-white py-3.5 rounded-full text-sm font-medium hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mb-4"
              >
                {verifying ? "Doğrulanıyor..." : (<>Doğrula <ArrowRight className="w-4 h-4" /></>)}
              </button>

              {/* Tekrar gönder */}
              <div className="text-center">
                <button
                  onClick={handleResend}
                  disabled={resendCountdown > 0}
                  className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#0f0f0f] disabled:text-[#c0c0c0] disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {resendCountdown > 0 ? `Tekrar gönder (${resendCountdown}s)` : "Kodu tekrar gönder"}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-[#f0f0f0] text-center">
                <button
                  onClick={() => { setStep("form"); setCode(["", "", "", "", "", ""]); }}
                  className="text-sm text-[#a3a3a3] hover:text-[#0f0f0f] transition-colors"
                >
                  ← Geri dön
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <AuthDecorativePanel />
    </div>
  );
}
