"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#0f0f0f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#737373] text-sm mb-4">Ödeme sayfasına yönlendiriliyorsunuz...</p>
        <Link href="/credits" className="inline-flex items-center gap-1.5 text-xs text-[#a3a3a3] hover:text-[#0f0f0f] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Pakete geri dön
        </Link>
      </div>
    </div>
  );
}
