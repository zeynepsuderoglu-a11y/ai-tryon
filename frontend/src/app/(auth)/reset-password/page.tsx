"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (password !== confirm) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    if (!token) {
      toast.error("Geçersiz sıfırlama linki.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success("Şifreniz güncellendi!");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-red-500">Geçersiz veya eksik sıfırlama linki.</p>
        <Link href="/forgot-password" className="text-sm text-[#737373] hover:text-[#1a1a1a]">
          Yeni link talep et
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
          Yeni Şifre
        </label>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="En az 8 karakter"
            className="w-full pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-2.5 text-[#a3a3a3] hover:text-[#1a1a1a]"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
          Şifre Tekrar
        </label>
        <input
          type={showPass ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Şifreyi tekrar girin"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Güncelleniyor..." : "Şifremi Güncelle"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image src="/logo.png" alt="IMA AI Studio" width={44} height={44} className="rounded-full" />
            <span className="text-2xl font-semibold tracking-tight text-[#1a1a1a]">StudyoİMA AI</span>
          </Link>
          <p className="text-sm text-[#737373] mt-2">Yeni şifre belirle</p>
        </div>
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8">
          <Suspense fallback={<div className="text-sm text-[#737373]">Yükleniyor...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
