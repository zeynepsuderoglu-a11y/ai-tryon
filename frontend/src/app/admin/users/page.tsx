"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { UserCheck, UserX, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  credits_remaining: number;
  is_active: boolean;
  total_generations: number;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creditModal, setCreditModal] = useState<{ userId: string; name: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditType, setCreditType] = useState("unified");
  const PAGE_SIZE = 20;

  const fetchUsers = () => {
    setLoading(true);
    adminApi.users({ page, page_size: PAGE_SIZE })
      .then((res) => { setUsers(res.items); setTotal(res.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const toggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await adminApi.toggleUserStatus(userId, !isActive);
      toast.success(`User ${!isActive ? "activated" : "deactivated"}`);
      fetchUsers();
    } catch { toast.error("Failed to update status"); }
  };

  const addCredits = async () => {
    if (!creditModal || !creditAmount) return;
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount === 0) { toast.error("Enter a valid amount"); return; }
    try {
      await adminApi.adjustCredits(creditModal.userId, amount, undefined, creditType);
      toast.success(`${amount > 0 ? "Added" : "Removed"} ${Math.abs(amount)} ${creditType} credits`);
      setCreditModal(null);
      setCreditAmount("");
      setCreditType("unified");
      fetchUsers();
    } catch { toast.error("Failed to adjust credits"); }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-gray-400 text-sm">{total} total users</p>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Kayıt Tarihi</th>
                <th className="px-4 py-3 text-right">Üretim</th>
                <th className="px-4 py-3 text-right">Generations</th>
                <th className="px-4 py-3 text-right">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-700 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.full_name}</p>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full border",
                          u.role === "admin"
                            ? "bg-accent-900/30 text-accent-400 border-accent-700/30"
                            : "bg-gray-700/30 text-gray-400 border-gray-600/30"
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-yellow-400 font-medium">
                        {u.credits_remaining}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {u.total_generations}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full border",
                          u.is_active
                            ? "bg-green-900/30 text-green-400 border-green-700/30"
                            : "bg-red-900/30 text-red-400 border-red-700/30"
                        )}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setCreditModal({ userId: u.id, name: u.full_name })}
                            className="p-1.5 rounded-lg bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400 transition-colors"
                            title="Adjust credits"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleStatus(u.id, u.is_active)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              u.is_active
                                ? "bg-red-900/20 hover:bg-red-900/40 text-red-400"
                                : "bg-green-900/20 hover:bg-green-900/40 text-green-400"
                            )}
                            title={u.is_active ? "Deactivate" : "Activate"}
                          >
                            {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Credit Modal */}
      {creditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-6 w-80">
            <h3 className="font-semibold mb-1">Adjust Credits</h3>
            <p className="text-gray-400 text-sm mb-4">{creditModal.name}</p>
            <p className="text-xs text-gray-400 mb-3">Pozitif = ekle, Negatif = düş</p>
            <input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="Amount (use negative to deduct)"
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-3 py-2 text-[#1a1a1a] text-sm mb-4 focus:outline-none focus:border-[#1a1a1a]"
            />
            <div className="flex gap-2">
              <button onClick={() => { setCreditModal(null); setCreditAmount(""); }}
                className="flex-1 bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#1a1a1a] py-2 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={addCredits}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
