"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

const tabs = [
  { id: "gozluk", label: "Gözlük Try-On" },
  { id: "ghost",  label: "Ghost Manken"  },
] as const;

type TabId = typeof tabs[number]["id"];

export default function DemoExamplesSection() {
  const [activeTab, setActiveTab] = useState<TabId>("gozluk");

  return (
    <section className="py-24 px-8 bg-[#f8f8f8]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-[0.25em] mb-4">Gerçek Çıktı</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em]">AI Üretim Örnekleri</h2>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#0f0f0f] text-white"
                  : "bg-white border border-[#e8e8e8] text-[#737373] hover:text-[#0f0f0f]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Gözlük Tab */}
        {activeTab === "gozluk" && (
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="text-center">
              <div className="w-44 h-60 rounded-3xl overflow-hidden shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/demo/eyewear_model.webp" alt="Gözlük try-on öncesi — orijinal manken görseli" className="w-full h-full object-cover object-top" loading="lazy" />
              </div>
              <p className="text-xs text-[#a3a3a3] uppercase tracking-wider mt-4">Orijinal</p>
            </div>
            <ArrowRight className="w-8 h-8 text-[#d4d4d4] flex-shrink-0 rotate-0 sm:rotate-0" />
            <div className="flex gap-5">
              <div className="text-center">
                <div className="w-44 h-60 rounded-3xl overflow-hidden shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/demo/eyewear_result1.webp" alt="Yapay zeka gözlük try-on sonucu — manken üzerinde gözlük" className="w-full h-full object-cover object-top" loading="lazy" />
                </div>
                <p className="text-xs text-[#c9a96e] uppercase tracking-wider mt-4">Sonuç 1</p>
              </div>
              <div className="text-center">
                <div className="w-44 h-60 rounded-3xl overflow-hidden shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/demo/eyewear_result2.webp" alt="AI gözlük görselleştirme — farklı çerçeve modeli" className="w-full h-full object-cover object-top" loading="lazy" />
                </div>
                <p className="text-xs text-[#c9a96e] uppercase tracking-wider mt-4">Sonuç 2</p>
              </div>
            </div>
          </div>
        )}

        {/* Ghost Tab */}
        {activeTab === "ghost" && (
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="text-center">
              <div className="w-44 h-60 rounded-3xl overflow-hidden shadow-sm bg-[#f5f5f5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/demo/ghost_before.jpg" alt="Ghost mannequin öncesi — askıdaki kıyafet ürün fotoğrafı" className="w-full h-full object-cover object-top" loading="lazy" />
              </div>
              <p className="text-xs text-[#a3a3a3] uppercase tracking-wider mt-4">Orijinal</p>
            </div>
            <ArrowRight className="w-8 h-8 text-[#d4d4d4] flex-shrink-0" />
            <div className="text-center">
              <div className="w-44 h-60 rounded-3xl overflow-hidden shadow-sm bg-[#f5f5f5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/demo/ghost_after.jpg" alt="Ghost mannequin sonucu — profesyonel e-ticaret görseli" className="w-full h-full object-cover object-top" loading="lazy" />
              </div>
              <p className="text-xs text-[#c9a96e] uppercase tracking-wider mt-4">Ghost Çıktı</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
