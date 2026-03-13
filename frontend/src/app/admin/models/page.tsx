"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import type { ModelAsset } from "@/types";
import { Plus, Trash2, Eye, EyeOff, Upload, X, Link } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminModelsPage() {
  const [models, setModels] = useState<ModelAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "", gender: "female", body_type: "average", skin_tone: "medium", crop_type: "full_body"
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [imageUrl, setImageUrl] = useState("");

  const fetchModels = () => {
    setLoading(true);
    adminApi.models.list({ page: 1, page_size: 50, include_inactive: showInactive })
      .then((res) => { setModels(res.items); setTotal(res.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchModels(); }, [showInactive]);

  const handleUpload = async () => {
    if (!form.name) { toast.error("Model adı zorunlu"); return; }
    setUploading(true);
    try {
      if (uploadMode === "file") {
        if (!file) { toast.error("Lütfen bir dosya seçin"); setUploading(false); return; }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", form.name);
        formData.append("gender", form.gender);
        formData.append("body_type", form.body_type);
        formData.append("skin_tone", form.skin_tone);
        formData.append("crop_type", form.crop_type);
        await adminApi.models.upload(formData);
      } else {
        if (!imageUrl.trim()) { toast.error("Lütfen bir URL girin"); setUploading(false); return; }
        await adminApi.models.uploadFromUrl({
          name: form.name, gender: form.gender,
          body_type: form.body_type, skin_tone: form.skin_tone,
          crop_type: form.crop_type, image_url: imageUrl.trim(),
        });
      }
      toast.success("Model eklendi!");
      setShowUpload(false);
      setFile(null);
      setImageUrl("");
      setForm({ name: "", gender: "female", body_type: "average", skin_tone: "medium", crop_type: "full_body" });
      fetchModels();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Yükleme başarısız");
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (model: ModelAsset) => {
    try {
      await adminApi.models.update(model.id, { is_active: !model.is_active });
      toast.success(`Model ${!model.is_active ? "activated" : "deactivated"}`);
      fetchModels();
    } catch { toast.error("Update failed"); }
  };

  const deleteModel = async (id: string) => {
    if (!confirm("Delete this model?")) return;
    try {
      await adminApi.models.delete(id);
      toast.success("Model deleted");
      fetchModels();
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Model Gallery</h1>
            <p className="text-gray-400 text-sm">{total} models</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={cn("px-4 py-2 rounded-lg text-sm transition-colors",
                showInactive ? "bg-white/20 text-white" : "bg-white/10 text-gray-400 hover:text-white"
              )}
            >
              {showInactive ? "Hide" : "Show"} Inactive
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Model
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {models.map((model) => (
              <div key={model.id} className={cn("relative group rounded-xl overflow-hidden bg-gray-800", !model.is_active && "opacity-50")}>
                <div className="aspect-[2/3] relative">
                  {model.thumbnail_url || model.image_url ? (
                    <Image src={model.thumbnail_url || model.image_url} alt={model.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
                      {model.name[0]}
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">{model.name}</p>
                  <p className="text-gray-400 text-xs capitalize">{model.gender}</p>
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleActive(model)}
                    className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg"
                    title={model.is_active ? "Deactivate" : "Activate"}
                  >
                    {model.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => deleteModel(model.id)}
                    className="bg-red-500/60 hover:bg-red-500/80 text-white p-1.5 rounded-lg"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Upload Model</h3>
              <button onClick={() => { setShowUpload(false); setFile(null); setImageUrl(""); setUploadMode("file"); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 placeholder:text-gray-500"
                  placeholder="Model adı"
                  style={{ color: "white" }}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Fotoğraf Tipi</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "full_body", label: "Tam Boy", desc: "Ayaklar görünüyor" },
                    { value: "half_body", label: "Yarım Boy", desc: "Bel/kalçaya kadar" },
                  ].map((ct) => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, crop_type: ct.value }))}
                      className={cn(
                        "py-2 px-3 rounded-lg text-xs border transition-colors text-left",
                        form.crop_type === ct.value
                          ? "bg-primary-600 border-primary-500 text-white"
                          : "bg-gray-800 border-white/10 text-gray-300 hover:border-white/30"
                      )}
                    >
                      <div className="font-medium">{ct.label}</div>
                      <div className="text-[10px] opacity-70">{ct.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                    className="w-full bg-gray-800 border border-white/10 rounded-lg px-2 py-2 text-white text-xs focus:outline-none" style={{ color: "white" }}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Body Type</label>
                  <select
                    value={form.body_type}
                    onChange={(e) => setForm((f) => ({ ...f, body_type: e.target.value }))}
                    className="w-full bg-gray-800 border border-white/10 rounded-lg px-2 py-2 text-white text-xs focus:outline-none" style={{ color: "white" }}
                  >
                    <option value="slim">Slim</option>
                    <option value="average">Average</option>
                    <option value="plus_size">Plus Size</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Skin Tone</label>
                  <select
                    value={form.skin_tone}
                    onChange={(e) => setForm((f) => ({ ...f, skin_tone: e.target.value }))}
                    className="w-full bg-gray-800 border border-white/10 rounded-lg px-2 py-2 text-white text-xs focus:outline-none" style={{ color: "white" }}
                  >
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setUploadMode("file")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      uploadMode === "file" ? "bg-primary-600 text-white" : "bg-white/10 text-gray-400 hover:text-white"
                    )}
                  >
                    <Upload className="w-3 h-3" /> Dosyadan Yükle
                  </button>
                  <button
                    onClick={() => setUploadMode("url")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      uploadMode === "url" ? "bg-primary-600 text-white" : "bg-white/10 text-gray-400 hover:text-white"
                    )}
                  >
                    <Link className="w-3 h-3" /> URL ile Ekle
                  </button>
                </div>

                {uploadMode === "file" ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "w-full border-2 border-dashed rounded-xl py-8 text-sm transition-colors",
                        file ? "border-primary-500 text-primary-300" : "border-white/20 text-gray-400 hover:border-white/40"
                      )}
                    >
                      {file ? (
                        <span className="flex items-center justify-center gap-2">
                          <Upload className="w-4 h-4" /> {file.name}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Upload className="w-4 h-4" /> Resim seçmek için tıkla
                        </span>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://lh3.googleusercontent.com/..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                    />
                    <p className="text-xs text-gray-500">
                      Google Fotoğraflar: resme sağ tıkla → "Resim adresini kopyala"
                    </p>
                    {imageUrl && (
                      <div className="relative aspect-[2/3] w-24 rounded-lg overflow-hidden bg-gray-800">
                        <img src={imageUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowUpload(false); setFile(null); setImageUrl(""); setUploadMode("file"); }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
