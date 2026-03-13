"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { generationsApi } from "@/lib/api";
import type { Generation } from "@/types";
import { formatDate } from "@/lib/utils";
import { Download, Trash2, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusBadge = {
  pending:    { label: "Bekliyor",    cls: "bg-yellow-900/30 text-yellow-400 border-yellow-800/30" },
  processing: { label: "İşleniyor",  cls: "bg-blue-900/30 text-blue-400 border-blue-800/30"       },
  completed:  { label: "Tamamlandı", cls: "bg-green-900/30 text-green-400 border-green-800/30"    },
  failed:     { label: "Başarısız",  cls: "bg-red-900/30 text-red-400 border-red-800/30"          },
};

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 12;

  const fetchHistory = () => {
    setLoading(true);
    generationsApi.list({ page, page_size: PAGE_SIZE })
      .then((res) => { setGenerations(res.items); setTotal(res.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHistory(); }, [page]);

  const handleDelete = async (id: string) => {
    try {
      await generationsApi.delete(id);
      toast.success("Silindi");
      fetchHistory();
    } catch {
      toast.error("Silinemedi");
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Geçmiş</h1>
            <p className="text-gray-400 text-sm mt-1">{total} toplam üretim</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[2/3] bg-gray-800" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-700 rounded w-2/3" />
                  <div className="h-2 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : generations.length === 0 ? (
          <div className="glass rounded-2xl p-20 text-center">
            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Henüz Geçmiş Yok</h3>
            <p className="text-gray-500">Üretilen görseller burada görünecek</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {generations.map((gen) => {
                const badge = statusBadge[gen.status];
                return (
                  <div key={gen.id} className="glass rounded-xl overflow-hidden group">
                    <div className="aspect-[2/3] relative bg-gray-800">
                      {gen.output_urls?.[0] ? (
                        <Image src={gen.output_urls[0]} alt="Result" fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {gen.status === "processing" ? (
                            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                          ) : gen.status === "failed" ? (
                            <XCircle className="w-8 h-8 text-red-400" />
                          ) : (
                            <Clock className="w-8 h-8 text-gray-600" />
                          )}
                        </div>
                      )}

                      {/* Actions overlay */}
                      {gen.output_urls?.[0] && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <a
                            href={gen.output_urls[0]}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(gen.id)}
                            className="bg-red-500/40 hover:bg-red-500/60 text-white p-2 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-xs border px-1.5 py-0.5 rounded-md", badge.cls)}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{gen.category}</span>
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(gen.created_at)}</p>
                      {gen.model_asset && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{gen.model_asset.name}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400">
                  Sayfa {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
