"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { ChevronLeft, ChevronRight, Search, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistrationItem {
  id: string;
  email: string;
  status: "pending" | "verified" | "resent";
  resend_count: number;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
}

interface RedisResult {
  has_pending: boolean;
  expires_in_seconds: number;
}

const PAGE_SIZE = 20;
const TEN_MINUTES_MS = 10 * 60 * 1000;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}dk ${sec}sn` : `${sec}sn`;
}

function StatusBadge({ status, createdAt }: { status: string; createdAt: string }) {
  const isExpired = status === "pending" &&
    Date.now() - new Date(createdAt).getTime() > TEN_MINUTES_MS;

  if (status === "verified") {
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Doğrulandı</span>;
  }
  if (status === "resent") {
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Yeniden Gönderildi</span>;
  }
  if (isExpired) {
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">Süresi Doldu</span>;
  }
  return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Bekliyor</span>;
}

export default function AdminRegistrationsPage() {
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [emailSearch, setEmailSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [redisResults, setRedisResults] = useState<Record<string, RedisResult | null>>({});
  const [redisLoading, setRedisLoading] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(() => {
    setLoading(true);
    adminApi.registrations
      .list({ email_search: emailSearch, status: statusFilter, page, page_size: PAGE_SIZE })
      .then((res) => { setItems(res.items as RegistrationItem[]); setTotal(res.total); })
      .finally(() => setLoading(false));
  }, [emailSearch, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounce email search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchData(); }, 400);
    return () => clearTimeout(t);
  }, [emailSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkRedis = async (email: string) => {
    setRedisLoading((p) => ({ ...p, [email]: true }));
    try {
      const res = await adminApi.registrations.checkRedis(email);
      setRedisResults((p) => ({ ...p, [email]: res }));
    } catch {
      setRedisResults((p) => ({ ...p, [email]: null }));
    } finally {
      setRedisLoading((p) => ({ ...p, [email]: false }));
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a]">Kayıt Girişimleri</h1>
        <p className="text-sm text-[#737373] mt-1">Tüm e-posta doğrulama girişimleri</p>
      </div>

      {/* Filtreler */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" />
          <input
            type="text"
            placeholder="E-posta ara..."
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#1a1a1a]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#1a1a1a] bg-white"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="pending">Bekliyor</option>
          <option value="verified">Doğrulandı</option>
          <option value="resent">Yeniden Gönderildi</option>
        </select>
      </div>

      {/* Tablo */}
      <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#fafafa] border-b border-[#e5e5e5]">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[#737373]">E-posta</th>
              <th className="text-left px-4 py-3 font-medium text-[#737373]">Durum</th>
              <th className="text-left px-4 py-3 font-medium text-[#737373]">Yeniden Gönderim</th>
              <th className="text-left px-4 py-3 font-medium text-[#737373]">Başlangıç</th>
              <th className="text-left px-4 py-3 font-medium text-[#737373]">Doğrulanma</th>
              <th className="text-left px-4 py-3 font-medium text-[#737373]">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#f5f5f5]">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-[#f5f5f5] rounded animate-pulse w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#a3a3a3]">
                  Kayıt girişimi bulunamadı
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const redis = redisResults[item.email];
                return (
                  <tr key={item.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa]">
                    <td className="px-4 py-3 font-mono text-xs text-[#1a1a1a]">{item.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} createdAt={item.created_at} />
                    </td>
                    <td className="px-4 py-3 text-[#737373]">
                      {item.resend_count > 0 ? `${item.resend_count}x` : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#737373] text-xs">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3 text-[#737373] text-xs">
                      {item.verified_at ? formatDate(item.verified_at) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => checkRedis(item.email)}
                          disabled={redisLoading[item.email]}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors",
                            redisLoading[item.email]
                              ? "border-[#e5e5e5] text-[#a3a3a3] cursor-not-allowed"
                              : "border-[#e5e5e5] text-[#737373] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
                          )}
                        >
                          <Radio className="w-3 h-3" />
                          Redis
                        </button>
                        {redis !== undefined && redis !== null && (
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            redis.has_pending
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-500"
                          )}>
                            {redis.has_pending
                              ? `Aktif — ${formatSeconds(redis.expires_in_seconds)} kaldı`
                              : "Kod yok"}
                          </span>
                        )}
                        {redis === null && (
                          <span className="text-xs text-red-500">Hata</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5e5e5]">
            <span className="text-xs text-[#737373]">
              Toplam {total} kayıt
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-[#737373]">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
