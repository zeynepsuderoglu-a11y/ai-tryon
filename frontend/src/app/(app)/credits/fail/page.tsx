"use client";

import Link from "next/link";
import { XCircle, ArrowRight, RefreshCw } from "lucide-react";

export default function PaymentFailPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">

        {/* İkon */}
        <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#0f0f0f] mb-2">
          Ödeme Başarısız
        </h1>
        <p className="text-[#737373] text-sm mb-8 leading-relaxed">
          Ödeme işlemi tamamlanamadı. Üretim haklarınızdan herhangi bir kesinti yapılmamıştır.
          Tekrar deneyebilirsiniz.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/credits"
            className="inline-flex items-center justify-center gap-2 bg-[#0f0f0f] text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-[#2a2a2a] transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Tekrar Dene
          </Link>
          <Link
            href="/studio"
            className="inline-flex items-center justify-center gap-2 text-[#737373] text-sm hover:text-[#0f0f0f] transition-colors"
          >
            Stüdyoya Dön <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
