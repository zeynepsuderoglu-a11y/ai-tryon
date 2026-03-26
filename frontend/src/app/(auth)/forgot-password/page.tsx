"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error("Bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image src="/logo.png" alt="IMA AI Studio" width={44} height={44} className="rounded-full" />
            <span className="text-2xl font-semibold tracking-tight text-[#1a1a1a]">StudyoİMA AI</span>
          </Link>
          <p className="text-sm text-[#737373] mt-2">Şifre sıfırlama</p>
        </div>

        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#f0fdf4] flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-[#1a1a1a] font-medium">E-posta gönderildi</p>
              <p className="text-sm text-[#737373]">
                Eğer <span className="font-medium text-[#1a1a1a]">{email}</span> adresi kayıtlıysa,
                şifre sıfırlama linki gönderildi. Gelen kutunuzu kontrol edin.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#1a1a1a] transition-colors mt-2"
              >
                <ChevronLeft className="w-4 h-4" /> Girişe dön
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-[#737373] mb-2">
                Kayıtlı e-posta adresinizi girin, şifre sıfırlama linki gönderelim.
              </p>
              <div>
                <label className="block text-xs font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
                  E-posta
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@firma.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Linki Gönder"}
              </button>
              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-[#737373] hover:text-[#1a1a1a] transition-colors pt-1"
              >
                <ChevronLeft className="w-4 h-4" /> Girişe dön
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
