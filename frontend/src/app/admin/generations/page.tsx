"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminGeneration {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  category: string;
  status: string;
  credits_used: number;
  garment_url: string;
  output_urls: string[];
  error_message?: string;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  tops: "Üst Giysi",
  bottoms: "Alt Giysi",
  "one-pieces": "Tek Parça",
  eyewear: "Gözlük",
  ghost_mannequin: "Ghost Manken",
  background_replace: "Arka Plan",
  mannequin_tryon: "AI Stil",
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  completed: { label: "Başarılı", cls: "bg-green-100 text-green-700 border-green-200" },
  failed:    { label: "Başarısız", cls: "bg-red-100 text-red-700 border-red-200" },
  processing:{ label: "İşleniyor", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  pending:   { label: "Bekliyor", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

const CATEGORIES = [
  { value: "", label: "Tümü" },
  { value: "tops", label: "Üst Giysi" },
  { value: "bottoms", label: "Alt Giysi" },
  { value: "one-pieces", label: "Tek Parça" },
  { value: "mannequin_tryon", label: "AI Stil" },
  { value: "background_replace", label: "Arka Plan" },
  { value: "ghost_mannequin", label: "Ghost Manken" },
  { value: "eyewear", label: "Gözlük" },
];

const STATUSES = [
  { value: "", label: "Tümü" },
  { value: "completed", label: "Başarılı" },
  { value: "failed", label: "Başarısız" },
  { value: "processing", label: "İşleniyor" },
  { value: "pending", label: "Bekliyor" },
];

export default function AdminGenerationsPage() {
  const [items, setItems] = useState<AdminGeneration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [userInput, setUserInput] = useState(""); // isim veya e-posta

  const [preview, setPreview] = useState<AdminGeneration | null>(null);

  const PAGE_SIZE = 20;

  const fetchData = useCallback(() => {
    setLoading(true);
    adminApi.generations({ page, page_size: PAGE_SIZE, category: filterCategory || undefined, status: filterStatus || undefined, user_search: filterUser || undefined })
      .then((res) => { setItems(res.items); setTotal(res.total); })
      .catch(() => toast.error("Veriler alınamadı"))
      .finally(() => setLoading(false));
  }, [page, filterCategory, filterStatus, filterUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyUserFilter = () => {
    setFilterUser(userInput.trim());
    setPage(1);
  };

  const resetFilters = () => {
    setFilterCategory("");
    setFilterStatus("");
    setFilterUser("");
    setUserInput("");
    setPage(1);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  /* ── Kategori dağılımı (sayfadaki veriden) ── */
  const catCounts: Record<string, number> = {};
  items.forEach((g) => {
    catCounts[g.category] = (catCounts[g.category] || 0) + 1;
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">

        {/* Başlık */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Üretimler</h1>
          <p className="text-[#737373] text-sm mt-0.5">{total} toplam üretim</p>
        </div>

        {/* Filtreler */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-[#737373] mb-1 font-medium">Kategori</label>
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#1a1a1a]"
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#737373] mb-1 font-medium">Durum</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#1a1a1a]"
            >
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-[#737373] mb-1 font-medium">Kullanıcı (isim veya e-posta)</label>
            <div className="flex gap-2">
              <input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyUserFilter()}
                placeholder="Ara..."
                className="flex-1 text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1a1a1a]"
              />
              <button onClick={applyUserFilter} className="px-3 py-2 text-sm bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333]">Ara</button>
            </div>
          </div>
          {(filterCategory || filterStatus || filterUser) && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-sm text-[#737373] hover:text-red-500 py-2">
              <X className="w-3.5 h-3.5" /> Temizle
            </button>
          )}
        </div>

        {/* Tablo */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-[#737373] text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Tarih</th>
                <th className="px-4 py-3 text-left">Kullanıcı</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-center">Durum</th>
                <th className="px-4 py-3 text-center">Kredi</th>
                <th className="px-4 py-3 text-center">Önizleme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[#a3a3a3] text-sm">
                        Üretim bulunamadı
                      </td>
                    </tr>
                  )
                : items.map((g) => {
                    const st = STATUS_LABELS[g.status] ?? { label: g.status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
                    return (
                      <tr key={g.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="px-4 py-3 text-[#737373] whitespace-nowrap">
                          {new Date(g.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                          <span className="block text-[11px] text-[#b0b0b0]">
                            {new Date(g.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#1a1a1a] truncate max-w-[160px]">{g.user_name}</p>
                          <p className="text-[11px] text-[#a3a3a3] truncate max-w-[160px]">{g.user_email}</p>
                        </td>
                        <td className="px-4 py-3 text-[#1a1a1a]">
                          {CATEGORY_LABELS[g.category] ?? g.category}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border", st.cls)}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-[#c9a96e]">
                          {g.credits_used}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setPreview(g)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-[#e5e5e5] hover:border-[#1a1a1a] text-[#737373] hover:text-[#1a1a1a] transition-colors"
                          >
                            Görüntüle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg border border-[#e5e5e5] hover:border-[#1a1a1a] disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-[#737373]">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-[#e5e5e5] hover:border-[#1a1a1a] disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Önizleme Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-[#1a1a1a]">{preview.user_name}</p>
                <p className="text-xs text-[#a3a3a3]">{preview.user_email}</p>
                <p className="text-xs text-[#a3a3a3] mt-0.5">
                  {CATEGORY_LABELS[preview.category] ?? preview.category} · {new Date(preview.created_at).toLocaleString("tr-TR")}
                </p>
              </div>
              <button onClick={() => setPreview(null)} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#737373]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Giriş */}
              <div>
                <p className="text-xs font-medium text-[#737373] mb-2 uppercase tracking-wider">Giriş Görseli</p>
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#f5f5f5] border border-[#e5e5e5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview.garment_url} alt="Giriş" className="w-full h-full object-contain" />
                </div>
                <a href={preview.garment_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 mt-1.5 text-[11px] text-[#a3a3a3] hover:text-[#1a1a1a]">
                  <ExternalLink className="w-3 h-3" /> Orijinal
                </a>
              </div>

              {/* Çıkış */}
              <div>
                <p className="text-xs font-medium text-[#737373] mb-2 uppercase tracking-wider">Çıkış Görseli</p>
                {preview.output_urls.length > 0 ? (
                  <>
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#f5f5f5] border border-[#e5e5e5]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview.output_urls[0]} alt="Çıkış" className="w-full h-full object-contain" />
                    </div>
                    <a href={preview.output_urls[0]} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 mt-1.5 text-[11px] text-[#a3a3a3] hover:text-[#1a1a1a]">
                      <ExternalLink className="w-3 h-3" /> Tam Boyut
                    </a>
                  </>
                ) : (
                  <div className="aspect-[3/4] rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center">
                    <p className="text-xs text-[#a3a3a3]">
                      {preview.status === "failed" ? (preview.error_message ?? "Başarısız") : "Henüz yok"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-4 pt-4 border-t border-[#f0f0f0] text-sm text-[#737373]">
              <span>Durum: <strong className="text-[#1a1a1a]">{STATUS_LABELS[preview.status]?.label ?? preview.status}</strong></span>
              <span>Kredi: <strong className="text-[#c9a96e]">{preview.credits_used}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
