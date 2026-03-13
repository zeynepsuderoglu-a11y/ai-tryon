"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { tryonApi } from "@/lib/api";
import { useStudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function GarmentUpload() {
  const { garmentUrl, setGarmentUrl } = useStudioStore();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const result = await tryonApi.uploadGarment(file);
      setGarmentUrl(result.url);
      toast.success("Kıyafet yüklendi!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Yükleme başarısız");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [setGarmentUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  });

  const clear = () => {
    setPreview(null);
    setGarmentUrl(null);
  };

  if (preview || garmentUrl) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-[#f5f5f5] group max-w-xs mx-auto">
        <div className="aspect-[3/4] relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview || garmentUrl!} alt="Kıyafet" className="w-full h-full object-cover" />
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!uploading && (
          <>
            <button
              onClick={clear}
              className="absolute top-3 right-3 bg-white shadow-sm text-[#1a1a1a] p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-[#e5e5e5]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-3 left-3 right-3">
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <button className="w-full py-2 bg-white/90 backdrop-blur-sm text-[#1a1a1a] text-xs font-medium rounded-lg border border-[#e5e5e5] hover:bg-white transition-colors">
                  Değiştir
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
        isDragActive
          ? "border-[#1a1a1a] bg-[#f5f5f5]"
          : "border-[#d4d4d4] hover:border-[#a3a3a3] hover:bg-[#f9f9f9]"
      )}
    >
      <input {...getInputProps()} />
      <div className="w-14 h-14 rounded-full bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center mx-auto mb-4">
        <Upload className="w-6 h-6 text-[#737373]" />
      </div>
      <p className="text-sm font-medium text-[#1a1a1a] mb-1">
        {isDragActive ? "Bırakabilirsiniz!" : "Ürün fotoğrafını yükle"}
      </p>
      <p className="text-xs text-[#737373] mb-4">Sürükle & bırak veya tıklayın</p>
      <p className="text-[11px] text-[#a3a3a3]">JPG, PNG, WEBP · Maks 10MB</p>
    </div>
  );
}
