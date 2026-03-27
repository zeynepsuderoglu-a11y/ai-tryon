"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { paymentsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { BillingProfile } from "@/types";
import { cn } from "@/lib/utils";

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
}

const EMPTY_INDIVIDUAL: BillingProfile = {
  type: "individual",
  full_name: "",
  city: "",
  district: "",
  tc_no: "",
};

const EMPTY_CORPORATE: BillingProfile = {
  type: "corporate",
  company_name: "",
  tax_no: "",
  tax_office: "",
  city: "",
  district: "",
  address: "",
};

export default function BillingModal({ isOpen, onClose, packageId }: BillingModalProps) {
  const { user, setUser } = useAuthStore();
  const [tab, setTab] = useState<"individual" | "corporate">("individual");
  const [form, setForm] = useState<BillingProfile>(EMPTY_INDIVIDUAL);
  const [loading, setLoading] = useState(false);

  // Pre-fill from saved profile when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const bp = user?.billing_profile;
    if (bp) {
      setTab(bp.type);
      setForm(bp);
    } else {
      setTab("individual");
      setForm(EMPTY_INDIVIDUAL);
    }
  }, [isOpen, user?.billing_profile]);

  const handleTabChange = (t: "individual" | "corporate") => {
    setTab(t);
    const existing = user?.billing_profile;
    if (existing && existing.type === t) {
      setForm(existing);
    } else {
      setForm(t === "individual" ? EMPTY_INDIVIDUAL : EMPTY_CORPORATE);
    }
  };

  const set = (field: keyof BillingProfile, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): string | null => {
    if (!form.city.trim()) return "Şehir zorunludur.";
    if (!form.district.trim()) return "İlçe zorunludur.";
    if (tab === "individual") {
      if (!form.full_name?.trim()) return "Ad Soyad zorunludur.";
    } else {
      if (!form.company_name?.trim()) return "Firma adı zorunludur.";
      if (!form.tax_no?.trim()) return "Vergi No / T.C. Kimlik No zorunludur.";
      const taxLen = form.tax_no.trim().length;
      if (taxLen !== 10 && taxLen !== 11) return "Vergi No 10, T.C. Kimlik No 11 hane olmalıdır.";
      if (!form.tax_office?.trim()) return "Vergi dairesi zorunludur.";
      if (!form.address?.trim()) return "Adres zorunludur.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setLoading(true);
    try {
      const profile: BillingProfile = { ...form, type: tab };
      const result = await paymentsApi.createCheckout(packageId, profile);
      // Update local user store so next open is pre-filled
      if (user) setUser({ ...user, billing_profile: profile });
      window.location.href = result.paymentPageUrl;
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Ödeme başlatılamadı");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasExisting = !!user?.billing_profile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#0f0f0f]">Fatura Bilgileri</h2>
            <p className="text-xs text-[#a3a3a3] mt-0.5">Yasal uyum için zorunludur</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center hover:bg-[#e8e8e8] transition-colors"
          >
            <X className="w-4 h-4 text-[#737373]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1 bg-[#f5f5f5] rounded-xl">
          {(["individual", "corporate"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={cn(
                "flex-1 text-sm font-medium py-2 rounded-lg transition-all",
                tab === t
                  ? "bg-white text-[#0f0f0f] shadow-sm"
                  : "text-[#737373] hover:text-[#0f0f0f]"
              )}
            >
              {t === "individual" ? "Bireysel" : "Kurumsal"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-3">
          {tab === "individual" ? (
            <>
              <Field label="Ad Soyad *" value={form.full_name || ""} onChange={(v) => set("full_name", v)} placeholder="Ahmet Yılmaz" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Şehir *" value={form.city} onChange={(v) => set("city", v)} placeholder="İstanbul" />
                <Field label="İlçe *" value={form.district} onChange={(v) => set("district", v)} placeholder="Kadıköy" />
              </div>
              <Field label="TC Kimlik No (opsiyonel)" value={form.tc_no || ""} onChange={(v) => set("tc_no", v)} placeholder="12345678901" maxLength={11} />
            </>
          ) : (
            <>
              <Field label="Firma Adı *" value={form.company_name || ""} onChange={(v) => set("company_name", v)} placeholder="Örnek A.Ş." />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vergi No / T.C. Kimlik No *" value={form.tax_no || ""} onChange={(v) => set("tax_no", v)} placeholder="10 veya 11 hane" maxLength={11} />
                <Field label="Vergi Dairesi *" value={form.tax_office || ""} onChange={(v) => set("tax_office", v)} placeholder="Kadıköy V.D." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Şehir *" value={form.city} onChange={(v) => set("city", v)} placeholder="İstanbul" />
                <Field label="İlçe *" value={form.district} onChange={(v) => set("district", v)} placeholder="Kadıköy" />
              </div>
              <Field label="Adres *" value={form.address || ""} onChange={(v) => set("address", v)} placeholder="Moda Cad. No:1" />
            </>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full bg-[#0f0f0f] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#2a2a2a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            hasExisting ? "Onayla ve Ödemeye Geç" : "Ödemeye Geç"
          )}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#737373] mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 text-sm text-[#0f0f0f] placeholder-[#c4c4c4] focus:outline-none focus:ring-2 focus:ring-[#0f0f0f]/10 focus:border-[#0f0f0f] transition-colors"
      />
    </div>
  );
}
