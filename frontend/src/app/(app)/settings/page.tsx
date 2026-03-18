"use client";

import { useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Lock, Eye, EyeOff, Check } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirm) {
      toast.error("Yeni şifreler eşleşmiyor.");
      return;
    }
    if (newPw.length < 8) {
      toast.error("Şifre en az 8 karakter olmalıdır.");
      return;
    }
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
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="max-w-lg mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f0f0f] mb-1">Ayarlar</h1>
        <p className="text-sm text-[#737373] mb-8">Hesap bilgilerinizi yönetin</p>

        {/* Profil Bilgisi */}
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5 mb-5">
          <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-3">Hesap</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#737373]">Ad Soyad</span>
              <span className="font-medium text-[#0f0f0f]">{user?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">E-posta</span>
              <span className="font-medium text-[#0f0f0f]">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Şifre Değiştir */}
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-4 h-4 text-[#c9a96e]" />
            <p className="text-sm font-semibold text-[#0f0f0f]">Şifre Değiştir</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mevcut Şifre */}
            <div>
              <label className="block text-xs font-medium text-[#737373] mb-1.5">Mevcut Şifre</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-[#e8e8e8] text-sm focus:outline-none focus:border-[#0f0f0f] transition-colors bg-[#fafafa]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-[#0f0f0f]"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Yeni Şifre */}
            <div>
              <label className="block text-xs font-medium text-[#737373] mb-1.5">Yeni Şifre</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  placeholder="En az 8 karakter"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-[#e8e8e8] text-sm focus:outline-none focus:border-[#0f0f0f] transition-colors bg-[#fafafa]"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-[#0f0f0f]"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Şifre Tekrar */}
            <div>
              <label className="block text-xs font-medium text-[#737373] mb-1.5">Yeni Şifre (Tekrar)</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-[#e8e8e8] text-sm focus:outline-none focus:border-[#0f0f0f] transition-colors bg-[#fafafa]"
                />
                {confirm && newPw && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {confirm === newPw
                      ? <Check className="w-4 h-4 text-green-500" />
                      : <span className="text-xs text-red-400">✗</span>
                    }
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-[#0f0f0f] text-white text-sm font-semibold hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
