"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { generationsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { Generation } from "@/types";
import { formatDate } from "@/lib/utils";
import { Wand2, Coins, Image as ImageIcon, ArrowRight, Clock } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generationsApi.list({ page: 1, page_size: 6 })
      .then((res) => {
        setRecentGenerations(res.items);
        setTotalGenerations(res.total);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Üretim Bakiyesi",
      value: user?.credits_remaining ?? 0,
      icon: <Coins className="w-5 h-5 text-yellow-400" />,
      color: "text-yellow-400",
    },
    {
      label: "Toplam Üretim",
      value: totalGenerations,
      icon: <ImageIcon className="w-5 h-5 text-primary-400" />,
      color: "text-primary-400",
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Hoş geldin, {user?.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">AI TryOn genel bakış</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                {s.icon}
                <span className="text-sm text-gray-400">{s.label}</span>
              </div>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="glass rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Hızlı Eylemler</h2>
          <div className="flex gap-3">
            <Link
              href="/studio"
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Wand2 className="w-4 h-4" /> Yeni Üretim
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-gray-300 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Clock className="w-4 h-4" /> Geçmişi Gör
            </Link>
          </div>
        </div>

        {/* Recent Generations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Son Üretimler</h2>
            <Link href="/history" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              Tümünü gör <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : recentGenerations.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Henüz üretim yok</p>
              <Link href="/studio" className="text-primary-400 text-sm mt-2 inline-block">
                İlk üretimini yap →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {recentGenerations.map((gen) => (
                <div key={gen.id} className="relative aspect-[2/3] rounded-xl overflow-hidden group bg-gray-800">
                  {gen.output_urls?.[0] ? (
                    <Image src={gen.output_urls[0]} alt="Generation" fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {gen.status === "processing" && (
                        <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                      )}
                      {gen.status === "failed" && (
                        <span className="text-red-400 text-xs">Başarısız</span>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs">{formatDate(gen.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
