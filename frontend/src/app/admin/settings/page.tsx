"use client";

import { useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { Lock, Eye, EyeOff, Check } from "lucide-react";

export default function AdminSettingsPage() {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirm) { toast.error("Yeni şifreler eşleşmiyor."); return; }
    if (newPw.length < 8) { toast.error("Şifre en az 8 karakter olmalıdır."); return; }
    setLoading(true);
    try {
      await authApi.changePassword({ current_password: current, new_password: newPw });
      toast.success("Şifreniz başarıyla güncellendi.");
      setCurrent(""); setNewPw(""); setConfirm("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Şifre güncellenemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-xl font-bold text-[#1a1a1a] mb-1">Şifre Değiştir</h1>
      <p className="text-sm text-[#737373] mb-8">Admin hesap şifresini güncelle</p>

      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-[#c9a96e]" />
          <p className="text-sm font-semibold text-[#1a1a1a]">Yeni Şifre Belirle</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#737373] mb-1.5">Mevcut Şifre</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-10 rounded-xl border border-[#e5e5e5] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors bg-[#fafafa]"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-[#1a1a1a]">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#737373] mb-1.5">Yeni Şifre</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                placeholder="En az 8 karakter"
                className="w-full px-4 py-3 pr-10 rounded-xl border border-[#e5e5e5] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors bg-[#fafafa]"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-[#1a1a1a]">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#737373] mb-1.5">Yeni Şifre (Tekrar)</label>
            <div className="relative">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-10 rounded-xl border border-[#e5e5e5] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors bg-[#fafafa]"
              />
              {confirm && newPw && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {confirm === newPw
                    ? <Check className="w-4 h-4 text-green-500" />
                    : <span className="text-xs text-red-400">✗</span>}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      </div>
    </div>
  );
}
