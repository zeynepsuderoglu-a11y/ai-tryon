"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "", surname: "", email: "", phone: "", message: "", kvkk: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.kvkk) { setError("Aydınlatma Metni'ni kabul etmeniz gerekmektedir."); return; }
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Ad, e-posta ve mesaj alanları zorunludur."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Bir hata oluştu.");
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-10 flex flex-col items-center text-center gap-4">
        <CheckCircle className="w-12 h-12 text-[#c9a96e]" />
        <h3 className="text-lg font-semibold text-[#1a1a1a]">Mesajınız İletildi</h3>
        <p className="text-sm text-[#737373] max-w-sm">
          En kısa sürede <span className="text-[#1a1a1a] font-medium">support@studyoima.com</span> adresinden dönüş yapacağız.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-[#e5e5e5] rounded-2xl p-6 sm:p-8 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#737373] mb-1.5">Ad <span className="text-red-400">*</span></label>
          <input
            name="name" value={form.name} onChange={handle} placeholder="Adınız"
            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] bg-[#fafafa] text-sm text-[#1a1a1a] placeholder-[#b0b0b0] focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e] transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#737373] mb-1.5">Soyad</label>
          <input
            name="surname" value={form.surname} onChange={handle} placeholder="Soyadınız"
            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] bg-[#fafafa] text-sm text-[#1a1a1a] placeholder-[#b0b0b0] focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e] transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#737373] mb-1.5">E-Posta <span className="text-red-400">*</span></label>
        <input
          type="email" name="email" value={form.email} onChange={handle} placeholder="ornek@email.com"
          className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] bg-[#fafafa] text-sm text-[#1a1a1a] placeholder-[#b0b0b0] focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e] transition"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#737373] mb-1.5">Telefon</label>
        <input
          type="tel" name="phone" value={form.phone} onChange={handle} placeholder="0 (5xx) xxx xx xx"
          className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] bg-[#fafafa] text-sm text-[#1a1a1a] placeholder-[#b0b0b0] focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e] transition"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#737373] mb-1.5">Mesajınız <span className="text-red-400">*</span></label>
        <textarea
          name="message" value={form.message} onChange={handle}
          placeholder="Sorunuzu veya mesajınızı buraya yazın..."
          rows={5}
          className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] bg-[#fafafa] text-sm text-[#1a1a1a] placeholder-[#b0b0b0] focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e] transition resize-none"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.kvkk}
          onChange={(e) => setForm((p) => ({ ...p, kvkk: e.target.checked }))}
          className="mt-0.5 w-4 h-4 rounded border-[#e5e5e5] accent-[#c9a96e] cursor-pointer"
        />
        <span className="text-xs text-[#737373] leading-relaxed">
          Girdiğim kişisel verilerimin{" "}
          <a href="/gizlilik" target="_blank" className="text-[#c9a96e] hover:underline">Aydınlatma Metni</a>
          {" "}kapsamında işlenmesini kabul ediyorum.
        </span>
      </label>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {loading ? "Gönderiliyor…" : "Gönder"}
      </button>
    </form>
  );
}
