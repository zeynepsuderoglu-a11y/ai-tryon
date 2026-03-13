"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import type { AdminStats } from "@/types";
import { Users, Image as ImageIcon, Coins, Activity, Layers } from "lucide-react";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats().then(setStats).finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: "Total Users", value: stats.total_users, icon: <Users className="w-6 h-6 text-blue-400" />, color: "text-blue-400" },
        { label: "Total Generations", value: stats.total_generations, icon: <ImageIcon className="w-6 h-6 text-primary-400" />, color: "text-primary-400" },
        { label: "Credits Used", value: stats.total_credits_used, icon: <Coins className="w-6 h-6 text-yellow-400" />, color: "text-yellow-400" },
        { label: "Active Today", value: stats.active_users_today, icon: <Activity className="w-6 h-6 text-green-400" />, color: "text-green-400" },
        { label: "Batch Jobs", value: stats.total_batch_jobs, icon: <Layers className="w-6 h-6 text-accent-400" />, color: "text-accent-400" },
      ]
    : [];

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="h-6 w-6 bg-gray-700 rounded mb-3" />
                <div className="h-8 bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {cards.map((card) => (
              <div key={card.label} className="glass rounded-xl p-6">
                <div className="mb-3">{card.icon}</div>
                <p className={`text-3xl font-extrabold ${card.color}`}>
                  {card.value.toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm mt-1">{card.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
