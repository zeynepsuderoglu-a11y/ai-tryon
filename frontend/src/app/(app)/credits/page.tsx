"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { Coins, ArrowRight, Check, Clock, Package, Glasses, Video, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import BillingModal from "@/components/BillingModal";

const plans = [
{ id: "kredi_10",  credits: 10,  price: 150,  unitPrice: 15,    discount: 0,  name: "Başlangıç Paketi",  desc: "10 AI Görsel Üretimi" },
  { id: "kredi_50",  credits: 50,  price: 712,  unitPrice: 14.25, discount: 5,  name: "Standart Paket",    desc: "50 AI Görsel Üretimi" },
  { id: "kredi_100", credits: 100, price: 1350, unitPrice: 13.50, discount: 10, name: "Profesyonel Paket", desc: "100 AI Görsel Üretimi", popular: true },
  { id: "kredi_500", credits: 500, price: 6000, unitPrice: 12,    discount: 20, name: "Kurumsal Paket",    desc: "500 AI Görsel Üretimi" },
];

const usageInfo = [
  { icon: <Glasses className="w-4 h-4 text-[#c9a96e]" />, label: "Gözlük",  cost: "1 üretim" },
  { icon: <UserX   className="w-4 h-4 text-[#c9a96e]" />, label: "Ghost Manken",   cost: "1 üretim" },
  { icon: <Package className="w-4 h-4 text-[#c9a96e]" />, label: "Kıyafet", cost: "2 üretim" },
  { icon: <Video   className="w-4 h-4 text-[#c9a96e]" />, label: "Video Üretimi",  cost: "5 üretim" },
];

export default function CreditsPage() {
  const { user } = useAuthStore();
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);

  const handleBuy = (packageId: string) => {
    setPendingPackageId(packageId);
    setBillingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Başlık */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f0f0f] mb-2">Paket Satın Al</h1>
          <p className="text-[#737373] text-sm">Tüm işlem türlerinde ortak kullanılan üretim hakları.</p>
          {user && (
            <div className="inline-flex items-center gap-2 bg-white border border-[#e8e8e8] rounded-full px-4 py-2 mt-3">
              <Coins className="w-4 h-4 text-[#c9a96e]" />
              <span className="text-sm font-semibold text-[#0f0f0f]">{user.credits_remaining}</span>
              <span className="text-xs text-[#737373]">kalan üretim</span>
            </div>
          )}
        </div>

        {/* Kullanım Tablosu */}
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5 mb-8">
          <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-4">Üretim Hakkı Kullanımı</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {usageInfo.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2 py-4 bg-[#f8f8f8] rounded-xl">
                {item.icon}
                <span className="text-xs text-[#737373] text-center">{item.label}</span>
                <span className="text-sm font-bold text-[#0f0f0f]">{item.cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Paket tablosu */}
        <div className="bg-white border border-[#e8e8e8] rounded-3xl overflow-hidden mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 bg-[#f8f8f8] border-b border-[#e8e8e8] px-4 sm:px-6 py-3.5">
            <div className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider sm:col-span-2">Paket</div>
            <div className="hidden sm:block text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider text-center">İndirim</div>
            <div className="hidden sm:block text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider text-center">Birim</div>
            <div className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider text-right">Fiyat</div>
          </div>

          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "grid grid-cols-2 sm:grid-cols-5 items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-[#f0f0f0] last:border-0 transition-colors",
                plan.popular ? "bg-[#0f0f0f]" : "hover:bg-[#fafafa]"
              )}
            >
              <div className="sm:col-span-2 flex items-center gap-3 min-w-0">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0",
                  plan.popular ? "bg-white/10 text-white" : "bg-[#f5f5f5] text-[#0f0f0f]"
                )}>
                  {plan.credits >= 100 ? "★" : plan.credits}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className={cn("text-sm font-semibold", plan.popular ? "text-white" : "text-[#0f0f0f]")}>
                      {plan.name}
                    </p>
                    {plan.popular && (
                      <span className="text-[9px] bg-[#c9a96e] text-white px-2 py-0.5 rounded-full font-medium uppercase tracking-wider flex-shrink-0">
                        Popüler
                      </span>
                    )}
                  </div>
                  <p className={cn("text-[11px] mt-0.5", plan.popular ? "text-white/50" : "text-[#a3a3a3]")}>
                    {plan.desc}
                  </p>
                  {plan.discount > 0 && (
                    <span className={cn(
                      "sm:hidden mt-0.5 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full",
                      plan.popular ? "bg-[#c9a96e] text-white" : "bg-[#faf5ee] text-[#c9a96e] border border-[#e8dcc8]"
                    )}>
                      %{plan.discount} indirim
                    </span>
                  )}
                </div>
              </div>

              <div className="hidden sm:block text-center">
                {plan.discount > 0 ? (
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    plan.popular ? "bg-[#c9a96e] text-white" : "bg-[#faf5ee] text-[#c9a96e] border border-[#e8dcc8]"
                  )}>
                    %{plan.discount}
                  </span>
                ) : (
                  <span className={plan.popular ? "text-white/30 text-xs" : "text-[#d4d4d4] text-xs"}>—</span>
                )}
              </div>

              <div className={cn("hidden sm:block text-sm text-center", plan.popular ? "text-white/70" : "text-[#737373]")}>
                ₺{plan.unitPrice}
              </div>

              <div className="flex items-center justify-end gap-2">
                <span className={cn("text-sm font-bold", plan.popular ? "text-white" : "text-[#0f0f0f]")}>
                  ₺{plan.price.toLocaleString("tr-TR")}
                </span>
                <button
                  onClick={() => handleBuy(plan.id)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs px-3 sm:px-4 py-2 rounded-full font-semibold transition-all flex-shrink-0",
                    plan.popular
                      ? "bg-white text-[#0f0f0f] hover:bg-[#f0f0f0]"
                      : "bg-[#0f0f0f] text-white hover:bg-[#2a2a2a]"
                  )}
                >
                  Satın Al <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bilgi */}
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { icon: <Check className="w-4 h-4 text-[#c9a96e]" />, text: "Ödeme sonrası üretim hakları anında tanımlanır" },
            { icon: <Clock className="w-4 h-4 text-[#c9a96e]" />,  text: "Üretim haklarının son kullanma tarihi yoktur" },
            { icon: <Coins className="w-4 h-4 text-[#c9a96e]" />,  text: "Tüm işlem türlerinde ortak kullanılır" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-white border border-[#e8e8e8] rounded-2xl px-4 py-3">
              {item.icon}
              <span className="text-[#737373] text-xs leading-snug">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/credits/history" className="text-xs text-[#a3a3a3] hover:text-[#0f0f0f] underline underline-offset-2 transition-colors">
            Ödeme Geçmişini Görüntüle
          </Link>
        </div>
      </div>

      {pendingPackageId && (
        <BillingModal
          isOpen={billingModalOpen}
          onClose={() => { setBillingModalOpen(false); setPendingPackageId(null); }}
          packageId={pendingPackageId}
        />
      )}
    </div>
  );
}
