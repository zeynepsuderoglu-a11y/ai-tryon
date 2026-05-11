"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", surname: "", email: "", subject: "", message: "", kvkk: false });
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

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  };

  if (success) {
    return (
      <div className="rounded-2xl p-10 flex flex-col items-center text-center gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">Mesajınız İletildi</h3>
        <p className="text-sm text-[#9ca3af] max-w-sm">
          En kısa sürede <span className="text-white font-medium">ilgi@ilet.in</span> adresinden dönüş yapacağız.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl p-6 sm:p-8 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Ad Soyad</label>
          <input name="name" value={form.name} onChange={handle} placeholder="Adınız Soyadınız" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">E-posta</label>
          <input type="email" name="email" value={form.email} onChange={handle} placeholder="ornek@email.com" style={inputStyle} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Konu</label>
        <input name="subject" value={form.subject} onChange={handle} placeholder="Mesajınızın konusu" style={inputStyle} />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Mesajınız</label>
        <textarea
          name="message" value={form.message} onChange={handle}
          placeholder="Mesajınızı buraya yazın..."
          rows={5}
          style={{ ...inputStyle, resize: "none" }}
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.kvkk}
          onChange={(e) => setForm((p) => ({ ...p, kvkk: e.target.checked }))}
          className="mt-0.5 w-4 h-4 cursor-pointer"
          style={{ accentColor: "#a855f7" }}
        />
        <span className="text-xs text-[#6b7280] leading-relaxed">
          Girdiğim kişisel verilerimin{" "}
          <a href="/gizlilik" target="_blank" className="text-[#c084fc] hover:underline">Aydınlatma Metni</a>
          {" "}kapsamında işlenmesini kabul ediyorum.
        </span>
      </label>

      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        style={{ background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" }}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {loading ? "Gönderiliyor…" : "Mesaj Gönder"}
      </button>

    </form>
  );
}
