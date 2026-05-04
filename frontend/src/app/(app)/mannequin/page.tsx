"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { tryonApi, mannequinTryonApi, authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Wand2, Upload, X, Download, RotateCcw, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const MANNEQUINS = [
  { id: 1, label: "Manken 1" },
  { id: 2, label: "Manken 2" },
  { id: 3, label: "Manken 3" },
  { id: 4, label: "Manken 4" },
  { id: 5, label: "Manken 5" },
  { id: 6, label: "Manken 6" },
  { id: 7, label: "Manken 7" },
];

const STATIC_BASE =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    : "";

export default function MannequinPage() {
  const { user, setUser } = useAuthStore();

  const [selectedMannequin, setSelectedMannequin] = useState<number | null>(null);
  const [garmentUrl, setGarmentUrl] = useState<string | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Ürün yükleme ── */
  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setGarmentPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const res = await tryonApi.uploadGarment(file);
      setGarmentUrl(res.url);
    } catch {
      toast.error("Yükleme başarısız");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: uploading,
  });

  /* ── Üretim başlat ── */
  async function handleGenerate() {
    if (!selectedMannequin) { toast.error("Lütfen bir manken seçin"); return; }
    if (!garmentUrl)        { toast.error("Lütfen ürün fotoğrafı yükleyin"); return; }

    setGenerating(true);
    setResultUrl(null);

    try {
      const { generation_id } = await mannequinTryonApi.run(garmentUrl, selectedMannequin);

      pollRef.current = setInterval(async () => {
        try {
          const status = await mannequinTryonApi.getStatus(generation_id);
          if (status.status === "completed") {
            clearInterval(pollRef.current!);
            setResultUrl(status.output_urls?.[0] ?? null);
            setGenerating(false);
            try { const me = await authApi.me(); setUser(me); } catch {}
          } else if (status.status === "failed") {
            clearInterval(pollRef.current!);
            setGenerating(false);
            toast.error("Üretim başarısız, lütfen tekrar deneyin");
          }
        } catch {
          clearInterval(pollRef.current!);
          setGenerating(false);
        }
      }, 3000);
    } catch (err: any) {
      setGenerating(false);
      if (err?.response?.status === 402) toast.error("Yetersiz kredi");
      else toast.error("Bir hata oluştu");
    }
  }

  function handleReset() {
    setResultUrl(null);
    setGarmentUrl(null);
    setGarmentPreview(null);
    setSelectedMannequin(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/studio" className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> Studio
        </Link>
        <div className="h-4 w-px bg-gray-200" />
        <h1 className="font-semibold text-gray-800">Manken ile Giydirme</h1>
        <div className="ml-auto text-sm text-gray-500">
          Kalan kredi: <span className="font-semibold text-gray-800">{user?.credits ?? 0}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Sol — Seçimler */}
        <div className="space-y-6">

          {/* 1. Manken seç */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">1. Manken Seç</h2>
            <div className="grid grid-cols-4 gap-3">
              {MANNEQUINS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMannequin(m.id)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4] ${
                    selectedMannequin === m.id
                      ? "border-purple-600 ring-2 ring-purple-300"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <img
                    src={`${STATIC_BASE}/static/mannequins/${m.id}.png`}
                    alt={m.label}
                    className="w-full h-full object-cover object-top"
                  />
                  {selectedMannequin === m.id && (
                    <div className="absolute inset-0 bg-purple-600/10 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Ürün yükle */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">2. Ürün Fotoğrafı Yükle</h2>

            {garmentPreview ? (
              <div className="relative">
                <img
                  src={garmentPreview}
                  alt="Ürün"
                  className="w-full max-h-64 object-contain rounded-xl border"
                />
                <button
                  onClick={() => { setGarmentUrl(null); setGarmentPreview(null); }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Sürükle bırak veya tıkla</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP</p>
              </div>
            )}
          </div>

          {/* Giydir butonu */}
          <button
            onClick={handleGenerate}
            disabled={generating || uploading || !garmentUrl || !selectedMannequin}
            className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Wand2 className="w-5 h-5" />
            {generating ? "Üretiliyor..." : "Giydir — 2 Kredi"}
          </button>
        </div>

        {/* Sağ — Sonuç */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="font-semibold text-gray-800 mb-4">Sonuç</h2>

          {generating && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Manken giyindiriliyor...</p>
              <p className="text-xs text-gray-300">30–90 saniye sürebilir</p>
            </div>
          )}

          {!generating && !resultUrl && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-3">
              <Wand2 className="w-12 h-12" />
              <p className="text-sm">Sonuç burada görünecek</p>
            </div>
          )}

          {resultUrl && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="relative flex-1 rounded-xl overflow-hidden bg-gray-50 min-h-96">
                <Image
                  src={resultUrl}
                  alt="Sonuç"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="flex gap-3">
                <a
                  href={resultUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4" /> İndir
                </a>
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Yeni Üretim
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
