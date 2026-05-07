"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { Plus, Trash2, Eye, EyeOff, Upload, X, Link, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type BgItem = {
  id: string;
  key: string;
  label: string;
  image_url: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export default function AdminBackgroundsPage() {
  const [bgs, setBgs] = useState<BgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  /* ── Upload Modal ── */
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadSortOrder, setUploadSortOrder] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Edit Modal ── */
  const [editingBg, setEditingBg] = useState<BgItem | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    setLoading(true);
    adminApi.backgrounds.list(showInactive || undefined)
      .then(setBgs)
      .catch(() => toast.error("Yükleme başarısız"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [showInactive]);

  const openEdit = (bg: BgItem) => {
    setEditingBg(bg);
    setEditLabel(bg.label);
    setEditDesc(bg.description || "");
    setEditSortOrder(bg.sort_order);
  };

  const handleUpdate = async () => {
    if (!editingBg || !editLabel.trim()) return;
    setSaving(true);
    try {
      await adminApi.backgrounds.update(editingBg.id, {
        label: editLabel.trim(),
        description: editDesc.trim(),
        sort_order: editSortOrder,
      });
      toast.success("Güncellendi");
      setEditingBg(null);
      fetch();
    } catch { toast.error("Güncelleme başarısız"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (bg: BgItem) => {
    try {
      await adminApi.backgrounds.update(bg.id, { is_active: !bg.is_active });
      toast.success(`Arka plan ${!bg.is_active ? "aktif" : "pasif"} edildi`);
      fetch();
    } catch { toast.error("Güncelleme başarısız"); }
  };

  const handleDelete = async (bg: BgItem) => {
    if (!confirm(`"${bg.label}" arka planını sil?`)) return;
    try {
      await adminApi.backgrounds.delete(bg.id);
      toast.success("Silindi");
      fetch();
    } catch { toast.error("Silme başarısız"); }
  };

  const handleUpload = async () => {
    if (!uploadLabel.trim()) { toast.error("İsim zorunlu"); return; }
    setUploading(true);
    try {
      if (uploadMode === "file") {
        if (!uploadFile) { toast.error("Dosya seçin"); setUploading(false); return; }
        await adminApi.backgrounds.upload(uploadLabel.trim(), uploadFile, uploadDesc.trim(), uploadSortOrder);
      } else {
        if (!uploadUrl.trim()) { toast.error("URL girin"); setUploading(false); return; }
        await adminApi.backgrounds.uploadFromUrl(uploadLabel.trim(), uploadUrl.trim(), uploadDesc.trim(), uploadSortOrder);
      }
      toast.success("Arka plan eklendi!");
      setShowUpload(false);
      setUploadLabel(""); setUploadDesc(""); setUploadSortOrder(0);
      setUploadFile(null); setUploadUrl("");
      fetch();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Yükleme başarısız");
    } finally { setUploading(false); }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Arka Planlar</h1>
            <p className="text-gray-400 text-sm">{bgs.length} arka plan</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={cn("px-4 py-2 rounded-lg text-sm transition-colors",
                showInactive ? "bg-white/20 text-white" : "bg-white/10 text-gray-400 hover:text-white"
              )}
            >
              {showInactive ? "Tümü" : "Pasifler dahil"}
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Arka Plan Ekle
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-xl bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {bgs.map((bg) => (
              <div key={bg.id} className={cn("relative group rounded-xl overflow-hidden bg-gray-800", !bg.is_active && "opacity-50")}>
                <div className="aspect-video relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bg.image_url} alt={bg.label} className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">{bg.label}</p>
                  <p className="text-gray-400 text-[10px] truncate">{bg.key}</p>
                </div>
                {!bg.is_active && (
                  <div className="absolute top-1 left-1">
                    <span className="bg-red-500/80 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">Pasif</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(bg)}
                    className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg"
                    title="Düzenle"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => toggleActive(bg)}
                    className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg"
                    title={bg.is_active ? "Pasif yap" : "Aktif yap"}
                  >
                    {bg.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => handleDelete(bg)}
                    className="bg-red-500/60 hover:bg-red-500/80 text-white p-1.5 rounded-lg"
                    title="Sil"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingBg && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-white">Arka Planı Düzenle</h3>
              <button onClick={() => setEditingBg(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={editingBg.image_url} alt={editingBg.label} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Key (değiştirilemez)</label>
                <p className="text-xs text-gray-500 bg-gray-800/50 rounded px-3 py-2 font-mono">{editingBg.key}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">İsim *</label>
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  style={{ color: "white" }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">AI Açıklaması</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 resize-none"
                  style={{ color: "white" }}
                  placeholder="warm cozy café interior background"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Sıra</label>
                <input
                  type="number"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  style={{ color: "white" }}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditingBg(null)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg text-sm">
                  İptal
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-white">Arka Plan Ekle</h3>
              <button onClick={() => { setShowUpload(false); setUploadFile(null); setUploadUrl(""); setUploadLabel(""); setUploadDesc(""); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">İsim *</label>
                <input
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 placeholder:text-gray-500"
                  placeholder="Arka plan adı (ör: Mavi Stüdyo)"
                  style={{ color: "white" }}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">AI Açıklaması (opsiyonel)</label>
                <textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 resize-none placeholder:text-gray-500"
                  style={{ color: "white" }}
                  placeholder="soft blue studio background, natural light"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Sıra</label>
                <input
                  type="number"
                  value={uploadSortOrder}
                  onChange={(e) => setUploadSortOrder(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  style={{ color: "white" }}
                />
              </div>

              {/* Yükleme modu seçimi */}
              <div>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setUploadMode("file")}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      uploadMode === "file" ? "bg-primary-600 text-white" : "bg-white/10 text-gray-400 hover:text-white"
                    )}
                  >
                    <Upload className="w-3 h-3" /> Dosyadan
                  </button>
                  <button
                    onClick={() => setUploadMode("url")}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      uploadMode === "url" ? "bg-primary-600 text-white" : "bg-white/10 text-gray-400 hover:text-white"
                    )}
                  >
                    <Link className="w-3 h-3" /> URL ile
                  </button>
                </div>

                {uploadMode === "file" ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={cn("w-full border-2 border-dashed rounded-xl py-8 text-sm transition-colors",
                        uploadFile ? "border-primary-500 text-primary-300" : "border-white/20 text-gray-400 hover:border-white/40"
                      )}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        {uploadFile ? uploadFile.name : "Resim seçmek için tıkla"}
                      </span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={uploadUrl}
                      onChange={(e) => setUploadUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                    />
                    {uploadUrl && (
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={uploadUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowUpload(false); setUploadFile(null); setUploadUrl(""); setUploadLabel(""); setUploadDesc(""); }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg text-sm"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium"
                >
                  {uploading ? "Yükleniyor..." : "Ekle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
