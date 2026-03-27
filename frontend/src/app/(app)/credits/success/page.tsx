"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { CheckCircle, ArrowRight, Coins, LogIn } from "lucide-react";

export default function PaymentSuccessPage() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated()) {
      authApi.me().then(setUser).catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">

        <div className="w-20 h-20 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#0f0f0f] mb-2">
          Ödeme Başarılı
        </h1>
        <p className="text-[#737373] text-sm mb-8 leading-relaxed">
          Üretim haklarınız hesabınıza tanımlandı.
        </p>

        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4 flex items-center gap-3 mb-8 text-left">
          <div className="w-10 h-10 rounded-xl bg-[#faf5ee] border border-[#e8dcc8] flex items-center justify-center flex-shrink-0">
            <Coins className="w-5 h-5 text-[#c9a96e]" />
          </div>
          <div>
            <p className="text-xs text-[#737373]">Üretim hakkınız güncellendi</p>
            <p className="text-sm font-semibold text-[#0f0f0f]">Stüdyo sayfasından kontrol edebilirsiniz</p>
          </div>
        </div>

        {isAuthenticated() ? (
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 bg-[#0f0f0f] text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-[#2a2a2a] transition-colors"
          >
            Stüdyoya Git <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#0f0f0f] text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-[#2a2a2a] transition-colors"
          >
            Giriş Yap <LogIn className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
