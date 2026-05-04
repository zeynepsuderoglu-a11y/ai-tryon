"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { tryonApi, eyewearApi, videoApi, ghostMannequinApi, geminiTryonApi, backgroundReplaceApi, mannequinTryonApi } from "@/lib/api";
import { useStudioStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store";
import GarmentUpload from "@/components/studio/GarmentUpload";
import GlassesUpload from "@/components/studio/GlassesUpload";
import ModelSelector from "@/components/studio/ModelSelector";
import ResultDisplay from "@/components/studio/ResultDisplay";
import VideoResult from "@/components/studio/VideoResult";
import GenerationWaiting from "@/components/studio/GenerationWaiting";
import BgReplaceResultPanel from "@/components/studio/BgReplaceResultPanel";
import {
  Wand2, ChevronLeft, Layers, Sparkles, Glasses, Package,
  ShoppingCart, Video, Upload, X, ImageIcon, UserX, Check,
  Menu, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

const BACKGROUNDS = [
  { value: "original",       label: "Orijinal", image: null                              },
  { value: "white_studio",   label: "Beyaz",    image: "/backgrounds/white_studio.jpg"   },
  { value: "grey_studio",    label: "Gri",      image: "/backgrounds/grey_studio.jpg"    },
  { value: "cream",          label: "Krem",     image: "/backgrounds/cream.jpg"          },
  { value: "black_studio",   label: "Siyah",    image: "/backgrounds/black_studio.jpg"   },
  { value: "pink_studio",    label: "Pembe",    image: "/backgrounds/pink_studio.jpg"    },
  { value: "outdoor_city",   label: "Şehir",    image: "/backgrounds/outdoor_city.jpg"   },
  { value: "outdoor_nature", label: "Doğa",     image: "/backgrounds/outdoor_nature.jpg" },
  { value: "cafe",           label: "Kafe",     image: "/backgrounds/cafe.jpg"           },
  { value: "minimal_room",   label: "Oda",      image: "/backgrounds/minimal_room.jpg"   },
  { value: "beige_outdoor",      label: "Plaj",         image: "/backgrounds/beige_outdoor.jpg"      },
  { value: "istanbul_terrace",   label: "İstanbul",     image: "/backgrounds/istanbul_terrace.jpg"   },
  { value: "boho_room",          label: "Boho",         image: "/backgrounds/boho_room.jpg"          },
  { value: "wood_studio",        label: "Ahşap",        image: "/backgrounds/wood_studio.jpg"        },
  { value: "luxury_marble",      label: "Mermer",       image: "/backgrounds/luxury_marble.jpg"      },
  { value: "warm_studio",        label: "Sıcak",        image: "/backgrounds/warm_studio.jpg"        },
  { value: "ottoman_cafe",       label: "Osmanlı",      image: "/backgrounds/ottoman_cafe.jpg"       },
  { value: "industrial_room",    label: "Endüstriyel",  image: "/backgrounds/industrial_room.jpg"    },
  { value: "garden",             label: "Bahçe",        image: "/backgrounds/garden.jpg"             },
  { value: "concrete_loft",      label: "Loft",         image: "/backgrounds/concrete_loft.jpg"      },
  { value: "rose_studio",        label: "Gül",          image: "/backgrounds/rose_studio.jpg"        },
  { value: "arch_room",          label: "Kemerli",      image: "/backgrounds/arch_room.jpg"          },
];

const AESTHETICS = [
  { value: "no_accessories",   label: "Aksesuarsız", emoji: "✨", desc: "Sade üretim"      },
  { value: "with_accessories", label: "Aksesuarlı",  emoji: "👜", desc: "Çanta, gözlük"    },
];

/* ── Arka Plan Seçim Tipi ── */
type BgPhoto = { id: string; url: string; preview: string };
type BgSelection = { background: string; customUrl?: string; customPreview?: string };

/* ── Ghost Mannequin Upload Bileşeni ── */
function GhostUpload() {
  const { ghostInputUrl, setGhostInputUrl } = useStudioStore();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const result = await tryonApi.uploadGarment(file);
      setGhostInputUrl(result.url);
      toast.success("Fotoğraf yüklendi!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Yükleme başarısız");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [setGhostInputUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  });

  const clear = () => {
    setPreview(null);
    setGhostInputUrl(null);
  };

  if (preview || ghostInputUrl) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-[#f5f5f5] group max-w-xs mx-auto">
        <div className="aspect-[3/4] relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview || ghostInputUrl!} alt="Ürün" className="w-full h-full object-contain p-4" />
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

/* ── Ghost Sonuç Ekranı ── */
function GhostResultPanel({
  generationId,
  onNew,
}: {
  generationId: string;
  onNew: () => void;
}) {
  const [gen, setGen] = useState<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const downloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `studyoimaai-ghost-mannequin-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await ghostMannequinApi.getStatus(generationId);
        setGen(data);
        if (data.status === "completed" || data.status === "failed") {
          clearInterval(pollRef.current!);
        }
      } catch {
        clearInterval(pollRef.current!);
      }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current!);
  }, [generationId]);

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">
      <div className="px-6 pt-5 pb-4 bg-white border-b border-[#e8e8e8] flex items-center justify-between">
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#0f0f0f] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Yeni Üretim
        </button>
        <span className="text-sm font-semibold text-[#0f0f0f]">Ghost Mannequin</span>
        <div className="w-24" />
      </div>

      <div className="flex-1 p-5 max-w-2xl mx-auto w-full pb-20 md:pb-6 flex flex-col items-center gap-4">
        {!gen || gen.status === "processing" || gen.status === "pending" ? (
          <div className="w-full">
            <GenerationWaiting mode="ghost" estimatedSeconds={60} />
          </div>
        ) : gen.status === "failed" ? (
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-600 mb-1">Üretim başarısız</p>
            <p className="text-xs text-red-400">Kredi iade edildi. Lütfen tekrar deneyin.</p>
          </div>
        ) : gen.output_urls?.[0] ? (
          <div className="w-full max-w-sm">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg bg-white">
              <Image src={gen.output_urls[0]} alt="Ghost mannequin" fill className="object-contain object-center" />
            </div>
            <button
              onClick={() => downloadImage(gen.output_urls[0])}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0f0f0f] text-white text-sm font-semibold hover:bg-[#2a2a2a] transition-colors"
            >
              İndir
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── Mannequin Ürün Yükleme Bileşeni ── */
function MannequinGarmentSection({
  url,
  preview,
  uploading,
  onUpload,
  onClear,
}: {
  url: string | null;
  preview: string | null;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onClear: () => void;
}) {
  const onDrop = useCallback(async (files: File[]) => {
    if (files[0]) await onUpload(files[0]);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: uploading,
  });

  if (preview || url) {
    return (
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview || url!} alt="Ürün" className="w-full max-h-64 object-contain rounded-xl border border-[#e8e8e8]" />
        <button onClick={onClear} className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow border border-[#e5e5e5]">
          <X className="w-3.5 h-3.5 text-[#737373]" />
        </button>
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
            <div className="w-6 h-6 border-2 border-[#0f0f0f] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
        isDragActive ? "border-[#0f0f0f] bg-[#f5f5f5]" : "border-[#d4d4d4] hover:border-[#a3a3a3] hover:bg-[#f9f9f9]"
      )}
    >
      <input {...getInputProps()} />
      <div className="w-12 h-12 rounded-full bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center mx-auto mb-3">
        <Upload className="w-5 h-5 text-[#737373]" />
      </div>
      <p className="text-sm font-medium text-[#0f0f0f] mb-1">
        {isDragActive ? "Bırakabilirsiniz!" : "Ürün fotoğrafını yükle"}
      </p>
      <p className="text-xs text-[#737373]">Sürükle & bırak veya tıkla</p>
      <p className="text-[11px] text-[#a3a3a3] mt-2">JPG, PNG, WEBP</p>
    </div>
  );
}

/* ── Studio Sekmeleri ── */
const STUDIO_TABS = [
  { mode: "mannequin"  as const, label: "AI Stil Oluştur",    icon: User      },
  { mode: "kiyafet"   as const, label: "Model Seç & Giydir", icon: Package   },
  { mode: "nano"      as const, label: "AI Giydir Pro",       icon: Sparkles  },
  { mode: "background"as const, label: "Arka Plan",           icon: ImageIcon },
  { mode: "ghost"     as const, label: "Ghost",               icon: UserX     },
  { mode: "eyewear"   as const, label: "Gözlük",              icon: Glasses   },
  { mode: "video"     as const, label: "Video",               icon: Video     },
];

/* ── Ana Sayfa ── */
export default function StudioPage() {
  const { user, setUser } = useAuthStore();
  const {
    garmentUrl, garmentDetailUrls, selectedModelId, isBatchMode, batchModelIds, setIsBatchMode,
    glassesUrl, studioMode, setStudioMode,
    videoImageUrls, setVideoImageUrls, videoMode, setVideoMode,
    ghostInputUrl, setGhostInputUrl,
  } = useStudioStore();

  const [bodyType, setBodyType]         = useState("standard");
  const [background, setBackground]     = useState("white_studio");

  // Model galerisinden seçim yapılınca otomatik "orijinal arka plan" moduna geç
  useEffect(() => {
    if (selectedModelId) setBackground("original");
  }, [selectedModelId]);
  const [aesthetic, setAesthetic]       = useState("no_accessories");
  const [ghostGarmentType, setGhostGarmentType] = useState("top");
  const [garmentCategory, setGarmentCategory] = useState("tops");
  const [bgPhotos, setBgPhotos] = useState<BgPhoto[]>([]);
  const [bgSelections, setBgSelections] = useState<BgSelection[]>([]);
  const [bgPhotosUploading, setBgPhotosUploading] = useState(false);
  const [bgCustomUploading, setBgCustomUploading] = useState(false);
  const [bgReplaceGenerationIds, setBgReplaceGenerationIds] = useState<string[]>([]);
  const [running, setRunning]           = useState(false);
  const [runningMessage, setRunningMessage] = useState("Başlatılıyor...");
  const [generationId, setGenerationId]     = useState<string | null>(null);
  const [batchJobId, setBatchJobId]         = useState<string | null>(null);
  const [showResult, setShowResult]         = useState(false);
  const [videoGenerationId, setVideoGenerationId] = useState<string | null>(null);
  const [ghostGenerationId, setGhostGenerationId] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  /* ── Mannequin State ── */
  const [selectedMannequin, setSelectedMannequin] = useState<number | null>(null);
  const [mannequinGarmentUrl, setMannequinGarmentUrl] = useState<string | null>(null);
  const [mannequinGarmentPreview, setMannequinGarmentPreview] = useState<string | null>(null);
  const [mannequinUploading, setMannequinUploading] = useState(false);

  /* ── Mobil Sidebar ── */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isMannequin = studioMode === "mannequin";
  const isEyewear   = studioMode === "eyewear";
  const isVideo     = studioMode === "video";
  const isGhost     = studioMode === "ghost";
  const isNano      = studioMode === "nano";
  const isBgReplace = studioMode === "background";

  const bgSelectionsValid =
    bgPhotos.length > 0 &&
    (bgSelections.length === 1 || bgSelections.length === bgPhotos.length) &&
    bgSelections.every(s => s.background !== "custom" || !!s.customUrl);

  const canGenerate = isMannequin
    ? !!mannequinGarmentUrl && !!selectedMannequin
    : isBgReplace
    ? bgSelectionsValid
    : isGhost
    ? !!ghostInputUrl
    : isVideo
    ? videoImageUrls.length > 0
    : isEyewear
    ? !!glassesUrl && !!selectedModelId
    : isNano
    ? !!garmentUrl && !!selectedModelId
    : isBatchMode
    ? !!garmentUrl && batchModelIds.length > 0
    : !!garmentUrl && !!selectedModelId;

  const requiredCredits = isVideo ? 5 : isGhost ? 1 : isBgReplace ? bgPhotos.length : isEyewear ? 1 : isMannequin ? 2 : isBatchMode ? batchModelIds.length * 2 : 2;
  const hasCredits = !user || user.credits_remaining >= requiredCredits;

  const handleModeSwitch = (mode: "mannequin" | "kiyafet" | "eyewear" | "video" | "ghost" | "nano" | "background") => {
    if (mode === studioMode) return;
    setStudioMode(mode);
    setShowResult(false);
    setGenerationId(null);
    setBatchJobId(null);
    setVideoGenerationId(null);
    setGhostGenerationId(null);
    if (mode === "ghost") setGhostGarmentType("top");
  };

  const handleVideoFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 3 - videoImageUrls.length;
    if (remaining <= 0) { toast.error("En fazla 3 fotoğraf yükleyebilirsiniz"); return; }
    const toUpload = Array.from(files).slice(0, remaining);
    setVideoUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const result = await tryonApi.uploadGarment(file);
        uploaded.push(result.url);
      }
      setVideoImageUrls([...videoImageUrls, ...uploaded]);
      toast.success(`${uploaded.length} fotoğraf yüklendi`);
    } catch {
      toast.error("Fotoğraf yüklenemedi");
    } finally {
      setVideoUploading(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setGenerationId(null);
    setBatchJobId(null);
    setShowResult(false);
    setVideoGenerationId(null);
    setGhostGenerationId(null);
    setRunningMessage("Başlatılıyor...");
    try {
      if (isMannequin) {
        setRunningMessage("Kıyafet analiz ediliyor...");
        const result = await mannequinTryonApi.run(mannequinGarmentUrl!, selectedMannequin!);
        setGenerationId(result.generation_id);
        toast.success("Üretim başladı!");
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - 2 });
        setShowResult(true);
      } else if (isBgReplace) {
        setRunningMessage(`${bgPhotos.length} fotoğraf işleniyor...`);
        const results = await Promise.all(
          bgPhotos.map((photo, i) => {
            const sel = bgSelections.length === 1 ? bgSelections[0] : bgSelections[i];
            return backgroundReplaceApi.run(
              photo.url,
              sel.background,
              sel.background === "custom" ? (sel.customUrl || "") : "",
            );
          })
        );
        const ids = results.map((r) => r.generation_id);
        setBgReplaceGenerationIds(ids);
        toast.success(`${ids.length} arka plan değiştirme başladı!`);
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - ids.length });
        setShowResult(true);
      } else if (isGhost) {
        setRunningMessage("Ghost mannequin hazırlanıyor...");
        const result = await ghostMannequinApi.run(ghostInputUrl!, ghostGarmentType);
        setGhostGenerationId(result.generation_id);
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - 1 });
        setShowResult(true);
      } else if (isVideo) {
        setRunningMessage("Video üretimi başlatılıyor...");
        const result = await videoApi.run({ image_urls: videoImageUrls, mode: videoMode });
        setVideoGenerationId(result.generation_id);
        toast.success("Video üretimi başladı! Bu işlem 2-3 dakika sürebilir.");
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - 5 });
        setShowResult(true);
      } else if (isEyewear) {
        const result = await eyewearApi.run({ glasses_url: glassesUrl!, model_asset_id: selectedModelId! });
        setGenerationId(result.generation_id);
        toast.success("Gözlük üretimi başladı!");
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - 1 });
        setShowResult(true);
      } else if (isNano) {
        setRunningMessage("Nano Banana analiz ediyor...");
        const result = await geminiTryonApi.run({
          garment_url: garmentUrl!,
          model_asset_id: selectedModelId!,
          background,
        });
        setGenerationId(result.generation_id);
        toast.success("Üretim Başladı!");
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - 2 });
        setShowResult(true);
      } else if (isBatchMode) {
        const result = await tryonApi.runBatch({ garment_url: garmentUrl!, model_ids: batchModelIds });
        setBatchJobId(result.batch_job_id);
        toast.success(`Toplu işlem başladı! ${result.total} üretim sıraya alındı.`);
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - result.total * 2 });
        setShowResult(true);
      } else {
        const result = await tryonApi.run({
          garment_url: garmentUrl!, model_asset_id: selectedModelId!,
          category: garmentCategory, body_type: bodyType, provider: "fashn", background, aesthetic,
          ...(garmentDetailUrls.length > 0 ? { garment_detail_urls: garmentDetailUrls } : {}),
        });
        setGenerationId(result.generation_id);
        toast.success("Üretim başladı!");
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - 2 });
        setShowResult(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.message || "Üretim başlatılamadı");
    } finally {
      setRunning(false);
    }
  };

  const handleNewGeneration = () => {
    setShowResult(false);
    setGenerationId(null);
    setBatchJobId(null);
    setVideoGenerationId(null);
    setGhostGenerationId(null);
    setBgReplaceGenerationIds([]);
    setBgPhotos([]);
    setBgSelections([]);
    if (isVideo) setVideoImageUrls([]);
    if (isGhost) setGhostInputUrl(null);
    if (isMannequin) {
      setMannequinGarmentUrl(null);
      setMannequinGarmentPreview(null);
      setSelectedMannequin(null);
    }
  };

  /* ── Ghost Sonuç Ekranı ── */
  if (showResult && isGhost && ghostGenerationId) {
    return (
      <GhostResultPanel
        generationId={ghostGenerationId}
        onNew={handleNewGeneration}
      />
    );
  }

  /* ── Arka Plan Değiştirme Sonuç Ekranı ── */
  if (showResult && isBgReplace && bgReplaceGenerationIds.length > 0) {
    return (
      <BgReplaceResultPanel
        generationIds={bgReplaceGenerationIds}
        onNew={handleNewGeneration}
      />
    );
  }

  /* ── Diğer Sonuç Ekranları ── */
  if (showResult) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex flex-col">
        <div className="px-6 pt-5 pb-4 bg-white border-b border-[#e8e8e8] flex items-center justify-between">
          <button
            onClick={handleNewGeneration}
            className="flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#0f0f0f] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Yeni Üretim
          </button>
          <span className="text-sm font-semibold text-[#0f0f0f]">Sonuç</span>
          <div className="w-24" />
        </div>
        <div className="flex-1 p-5 max-w-2xl mx-auto w-full pb-20 md:pb-6">
          {isVideo && videoGenerationId ? (
            <VideoResult generationId={videoGenerationId} />
          ) : (
            <ResultDisplay
              generationId={generationId || undefined}
              batchJobId={batchJobId || undefined}
              mode={isEyewear ? "eyewear" : "garment"}
              statusEndpoint={isNano ? "gemini-tryon" : isMannequin ? "mannequin-tryon" : isBgReplace ? "background-replace" : undefined}
            />
          )}
        </div>
      </div>
    );
  }

  /* ── Ana Sayfa ── */
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex">

      {/* ── Sol Sidebar — Masaüstü ── */}
      <div className="hidden md:flex flex-col w-48 bg-white border-r border-[#e8e8e8] sticky top-0 h-screen flex-shrink-0 z-20">
        <nav className="flex-1 p-3 pt-5 space-y-1 overflow-y-auto">
          {STUDIO_TABS.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => handleModeSwitch(mode)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                studioMode === mode
                  ? "bg-[#0f0f0f] text-white"
                  : "text-[#737373] hover:bg-[#f5f5f5] hover:text-[#0f0f0f]"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        {studioMode === "kiyafet" && (
          <div className="px-3 pb-3">
            <button
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                isBatchMode
                  ? "bg-[#0f0f0f] text-white border-[#0f0f0f]"
                  : "bg-white text-[#737373] border-[#e5e5e5] hover:border-[#0f0f0f] hover:text-[#0f0f0f]"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              {isBatchMode ? "Toplu: Açık" : "Toplu"}
            </button>
          </div>
        )}
      </div>

      {/* ── Mobil Sidebar Overlay ── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#e8e8e8]">
              <span className="text-sm font-semibold text-[#0f0f0f]">Kategoriler</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-[#f5f5f5]">
                <X className="w-4 h-4 text-[#737373]" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {STUDIO_TABS.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => { handleModeSwitch(mode); setSidebarOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                    studioMode === mode
                      ? "bg-[#0f0f0f] text-white"
                      : "text-[#737373] hover:bg-[#f5f5f5] hover:text-[#0f0f0f]"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
              {studioMode === "kiyafet" && (
                <button
                  onClick={() => { setIsBatchMode(!isBatchMode); setSidebarOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left mt-2",
                    isBatchMode
                      ? "bg-[#0f0f0f] text-white border-[#0f0f0f]"
                      : "bg-white text-[#737373] border-[#e5e5e5]"
                  )}
                >
                  <Layers className="w-4 h-4 flex-shrink-0" />
                  {isBatchMode ? "Toplu: Açık" : "Toplu Üretim"}
                </button>
              )}
            </nav>
          </div>
          <div className="flex-1 bg-black/20" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* ── İçerik Alanı ── */}
      <div className="flex-1 min-w-0">

        {/* Mobil Üst Bar */}
        <div className="md:hidden bg-white border-b border-[#e8e8e8] px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-[#f5f5f5] flex-shrink-0"
          >
            <Menu className="w-5 h-5 text-[#737373]" />
          </button>
          <span className="text-sm font-semibold text-[#0f0f0f] flex-1">
            {STUDIO_TABS.find(t => t.mode === studioMode)?.label ?? "Studio"}
          </span>
          {user && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <ImageIcon className="w-3.5 h-3.5 text-[#c9a96e]" />
              <span className="font-bold text-sm text-[#0f0f0f]">{user.credits_remaining}</span>
            </div>
          )}
        </div>

        {/* ── İçerik ── */}
        <div className="max-w-2xl mx-auto px-5 py-6 space-y-4 pb-36">

          {/* ─── MANKEN GİYDİRME MODU ─── */}
          {isMannequin && (
            <>
              {/* Ürün Fotoğrafı */}
              <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
                <div className="px-5 pt-5 pb-1">
                  <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">1. Ürün Fotoğrafı</p>
                </div>
                <div className="p-5 pt-3">
                  <MannequinGarmentSection
                    url={mannequinGarmentUrl}
                    preview={mannequinGarmentPreview}
                    uploading={mannequinUploading}
                    onUpload={async (file: File) => {
                      setMannequinGarmentPreview(URL.createObjectURL(file));
                      setMannequinUploading(true);
                      try {
                        const result = await tryonApi.uploadGarment(file);
                        setMannequinGarmentUrl(result.url);
                      } catch {
                        toast.error("Yükleme başarısız");
                        setMannequinGarmentPreview(null);
                      } finally {
                        setMannequinUploading(false);
                      }
                    }}
                    onClear={() => {
                      setMannequinGarmentUrl(null);
                      setMannequinGarmentPreview(null);
                    }}
                  />
                </div>
              </div>

              {/* Manken Seç */}
              <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
                <div className="px-5 pt-5 pb-1">
                  <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">2. Manken Seç</p>
                </div>
                <div className="p-5 pt-3 grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((id) => (
                    <button
                      key={id}
                      onClick={() => setSelectedMannequin(id)}
                      className={cn(
                        "relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4]",
                        selectedMannequin === id
                          ? "border-[#0f0f0f] ring-2 ring-[#0f0f0f]/20"
                          : "border-[#e8e8e8] hover:border-[#a3a3a3]"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/static/mannequins/${id}.jpg`}
                        alt={`Manken ${id}`}
                        className="w-full h-full object-cover object-top"
                      />
                      {selectedMannequin === id && (
                        <div className="absolute inset-0 bg-[#0f0f0f]/10 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-[#0f0f0f] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── ARKA PLAN DEĞİŞTİR MODU ─── */}
          {isBgReplace && (
            <>
              {/* ── Toplu Fotoğraf Yükleme ── */}
              <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
                <div className="px-5 pt-5 pb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Fotoğraflar</p>
                  <span className="text-xs text-[#737373]">{bgPhotos.length}/5</span>
                </div>
                <div className="p-5 pt-3 space-y-3">
                  {/* Yüklenen fotoğraflar */}
                  {bgPhotos.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                      {bgPhotos.map((photo, i) => (
                        <div key={photo.id} className="relative flex-shrink-0">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#f5f5f5] border border-[#e8e8e8]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                          </div>
                          {/* Numara */}
                          <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#0f0f0f] text-white text-[10px] font-bold flex items-center justify-center shadow">
                            {i + 1}
                          </div>
                          {/* Sil */}
                          <button
                            onClick={() => {
                              setBgPhotos(prev => prev.filter(p => p.id !== photo.id));
                              setBgSelections([]);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload alanı */}
                  {bgPhotos.length < 5 && (
                    <label className={cn(
                      "flex items-center gap-3 rounded-xl border-2 border-dashed border-[#e5e5e5] bg-[#fafafa] p-4 cursor-pointer hover:border-[#0f0f0f] transition-all",
                      bgPhotosUploading && "opacity-60 pointer-events-none"
                    )}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          const remaining = 5 - bgPhotos.length;
                          const toUpload = files.slice(0, remaining);
                          if (!toUpload.length) return;
                          setBgPhotosUploading(true);
                          try {
                            const uploaded: BgPhoto[] = await Promise.all(
                              toUpload.map(async (file) => ({
                                id: Date.now().toString() + Math.random().toString(36).slice(2),
                                preview: URL.createObjectURL(file),
                                url: (await tryonApi.uploadGarment(file)).url,
                              }))
                            );
                            setBgPhotos(prev => [...prev, ...uploaded]);
                            setBgSelections([]);
                            toast.success(`${uploaded.length} fotoğraf yüklendi!`);
                          } catch {
                            toast.error("Yükleme başarısız");
                          } finally {
                            setBgPhotosUploading(false);
                          }
                        }}
                      />
                      {bgPhotosUploading ? (
                        <div className="w-5 h-5 border-2 border-[#0f0f0f] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      ) : (
                        <Upload className="w-5 h-5 text-[#a3a3a3] flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-medium text-[#0f0f0f]">
                          {bgPhotos.length === 0 ? "Fotoğrafları seç (aynı anda birden fazla)" : `${5 - bgPhotos.length} fotoğraf daha ekleyebilirsiniz`}
                        </p>
                        <p className="text-xs text-[#a3a3a3]">JPG, PNG, WEBP · Maks 5 fotoğraf</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* ── Arka Plan Seçimi ── */}
              <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
                <div className="px-5 pt-5 pb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Arka Plan Seç</p>
                  <span className={cn(
                    "text-xs font-medium",
                    bgSelectionsValid ? "text-green-600" : "text-[#737373]"
                  )}>
                    {bgSelections.length > 0
                      ? bgPhotos.length > 0
                        ? `${bgSelections.length}/${bgPhotos.length} seçildi${bgSelections.length === 1 && bgPhotos.length > 1 ? " · tüm fotoğraflara" : bgSelections.length === bgPhotos.length && bgPhotos.length > 1 ? " · her birine ayrı" : ""}`
                        : `${bgSelections.length} seçildi`
                      : "Seçilmedi"}
                  </span>
                </div>
                <div className="px-5 pb-1 pt-2">
                  <p className="text-xs text-[#a3a3a3]">
                    {bgPhotos.length === 0
                      ? "Arka plan seçin, ardından fotoğraf yükleyin."
                      : bgSelections.length === 0
                      ? `1 arka plan seçin (tüm fotoğraflara) veya ${bgPhotos.length} seçin (her birine ayrı).`
                      : bgSelections.length === 1
                      ? `1 arka plan seçildi — ${bgPhotos.length} fotoğrafın hepsine uygulanacak.`
                      : bgSelections.length === bgPhotos.length
                      ? "Her fotoğrafa ayrı arka plan — numara fotoğraf sırasıyla eşleşir."
                      : `${bgPhotos.length} seçim için devam edin veya 1'de kalıp herkese uygulayın.`
                    }
                  </p>
                </div>
                <div className="p-5 pt-3">
                  <div className="grid grid-cols-5 gap-2">
                    {BACKGROUNDS.filter(bg => bg.value !== "original").map((bg) => {
                      const selIdx = bgSelections.findIndex(s => s.background === bg.value);
                      const isSelected = selIdx !== -1;
                      const canSelectMore = bgSelections.length < (bgPhotos.length > 0 ? bgPhotos.length : 5);
                        return (
                          <button
                            key={bg.value}
                            onClick={() => {
                              if (isSelected) {
                                setBgSelections(prev => prev.filter((_, i) => i !== selIdx));
                              } else if (canSelectMore) {
                                setBgSelections(prev => [...prev, { background: bg.value }]);
                              }
                            }}
                            className={cn(
                              "relative flex flex-col items-center gap-1 rounded-xl overflow-hidden border-2 transition-all",
                              isSelected
                                ? "border-[#0f0f0f]"
                                : canSelectMore
                                ? "border-transparent hover:border-[#e8e8e8]"
                                : "border-transparent opacity-40 cursor-not-allowed"
                            )}
                          >
                            {/* Sıra numarası */}
                            {isSelected && (
                              <div className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-[#0f0f0f] text-white text-[10px] font-bold flex items-center justify-center shadow">
                                {selIdx + 1}
                              </div>
                            )}
                            {bg.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={bg.image} alt={bg.label} className="w-full aspect-square object-cover rounded-lg" />
                            ) : (
                              <div className="w-full aspect-square bg-[#f3f3f3] rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-[#a3a3a3]" />
                              </div>
                            )}
                            <span className="text-[10px] text-[#737373] pb-1 truncate w-full text-center">{bg.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Özel arka plan yükleme */}
                    {bgSelections.length < (bgPhotos.length > 0 ? bgPhotos.length : 5) && (
                      <div className="mt-3">
                        <label className={cn(
                          "flex items-center gap-3 rounded-xl border-2 border-dashed border-[#e5e5e5] bg-[#fafafa] p-3 cursor-pointer hover:border-[#0f0f0f] transition-all",
                          bgCustomUploading && "opacity-60 pointer-events-none"
                        )}>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file || bgSelections.length >= bgPhotos.length) return;
                              setBgCustomUploading(true);
                              try {
                                const preview = URL.createObjectURL(file);
                                const result = await tryonApi.uploadGarment(file);
                                setBgSelections(prev => [...prev, { background: "custom", customUrl: result.url, customPreview: preview }]);
                                toast.success("Özel arka plan eklendi!");
                              } catch {
                                toast.error("Yükleme başarısız");
                              } finally {
                                setBgCustomUploading(false);
                              }
                            }}
                          />
                          {bgCustomUploading ? (
                            <div className="w-4 h-4 border-2 border-[#0f0f0f] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          ) : (
                            <Upload className="w-4 h-4 text-[#a3a3a3] flex-shrink-0" />
                          )}
                          <p className="text-xs font-medium text-[#0f0f0f]">Özel arka plan yükle</p>
                        </label>
                      </div>
                    )}

                    {/* Seçili özel arka planlar */}
                    {bgSelections.some(s => s.background === "custom") && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {bgSelections.map((s, i) => s.background === "custom" && s.customPreview ? (
                          <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-[#0f0f0f] flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s.customPreview} alt="" className="w-full h-full object-cover" />
                            <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#0f0f0f] text-white text-[9px] font-bold flex items-center justify-center">
                              {i + 1}
                            </div>
                            <button
                              onClick={() => setBgSelections(prev => prev.filter((_, j) => j !== i))}
                              className="absolute bottom-0.5 left-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"
                            >
                              <X className="w-2.5 h-2.5 text-white" />
                            </button>
                          </div>
                        ) : null)}
                      </div>
                    )}
                  </div>
                </div>

              {/* Bilgi kutusu */}
              <div className="bg-[#f8f8f8] rounded-xl px-4 py-3 text-xs text-[#737373]">
                <p className="font-medium text-[#0f0f0f] mb-1">
                  Arka Plan Değiştirme{bgPhotos.length > 0 ? ` — ${bgPhotos.length} kredi` : ""}
                </p>
                <p>Fotoğraf 1 → Arka plan 1, Fotoğraf 2 → Arka plan 2 şeklinde eşleşir. Tümü aynı anda işlenir.</p>
              </div>
            </>
          )}

          {/* ─── GHOST MANNEQUIN MODU ─── */}
          {isGhost && (
            <>
              <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
                <div className="px-5 pt-5 pb-1">
                  <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Ürün Fotoğrafı</p>
                </div>
                <div className="p-5 pt-3">
                  <GhostUpload />
                </div>
              </div>

              {/* Ürün Tipi Seçimi */}
              <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
                <div className="px-5 pt-5 pb-1">
                  <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Ürün Tipi</p>
                </div>
                <div className="p-5 pt-3 grid grid-cols-2 gap-2">
                  {[
                    { value: "top",    label: "Üst Parça",      desc: "Bluz, gömlek, ceket..." },
                    { value: "bottom", label: "Alt Parça",       desc: "Pantolon, etek..."      },
                    { value: "dress",  label: "Elbise / Tulum",  desc: "Tam boy kıyafet"        },
                    { value: "set",    label: "Tam Set",         desc: "Üst + alt kombin"       },
                  ].map((gt) => (
                    <button
                      key={gt.value}
                      onClick={() => setGhostGarmentType(gt.value)}
                      className={cn(
                        "flex flex-col items-start gap-0.5 p-3.5 rounded-xl border text-left transition-all",
                        ghostGarmentType === gt.value
                          ? "border-[#0f0f0f] bg-[#0f0f0f] text-white"
                          : "border-[#e8e8e8] bg-white text-[#0f0f0f] hover:border-[#0f0f0f]"
                      )}
                    >
                      <span className="text-xs font-semibold">{gt.label}</span>
                      <span className={cn("text-[10px]", ghostGarmentType === gt.value ? "text-white/50" : "text-[#a3a3a3]")}>
                        {gt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#f5f0ea] rounded-2xl p-4">
                <p className="text-xs font-semibold text-[#a08040] mb-1.5">Ghost Mannequin Nedir?</p>
                <p className="text-xs text-[#a08040] leading-relaxed">
                  Kıyafet fotoğrafındaki manken veya model otomatik olarak kaldırılır, kıyafetin 3D şekli ve iç hacmi korunur.
                  Profesyonel e-ticaret ürün fotoğrafı elde edersiniz.
                </p>
                <ul className="mt-2 space-y-0.5 text-[11px] text-[#b09050]">
                  <li>✓ Manken üzerindeki ürün fotoğrafları</li>
                  <li>✓ Model üzerindeki ürün fotoğrafları</li>
                  <li>✓ Beyaz arka planlı veya stüdyo çekimleri</li>
                </ul>
              </div>
            </>
          )}

          {/* ─── BÖLÜM 1: YÜKLEME (ghost, bgReplace, mannequin hariç) ─── */}
          {!isGhost && !isBgReplace && !isMannequin && (
            <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
              <div className="px-5 pt-5 pb-1">
                <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">
                  {isVideo ? "Fotoğraf" : isEyewear ? "Gözlük Fotoğrafı" : "Ürün Fotoğrafı"}
                </p>
              </div>

              {/* Kıyafet / Gözlük upload */}
              {!isVideo && (
                <div className="p-5 pt-3">
                  {isEyewear ? <GlassesUpload /> : <GarmentUpload />}
                </div>
              )}

              {/* Video upload */}
              {isVideo && (
                <div className="p-5 pt-3 space-y-4">
                  {videoImageUrls.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                      {videoImageUrls.map((url, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#f0f0f0] group flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setVideoImageUrls(videoImageUrls.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {i === 0 && (
                            <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1 py-0.5 rounded-full">Ana</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {videoImageUrls.length < 3 && (
                    <button
                      onClick={() => videoFileInputRef.current?.click()}
                      disabled={videoUploading}
                      className={cn(
                        "w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-2 transition-all",
                        videoUploading
                          ? "border-[#e8e8e8] bg-[#f8f8f8] cursor-not-allowed"
                          : "border-[#e0e0e0] hover:border-[#c9a96e] hover:bg-[#fdf9f4] cursor-pointer"
                      )}
                    >
                      {videoUploading ? (
                        <>
                          <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
                          <p className="text-xs text-[#737373]">Yükleniyor...</p>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-[#f5f0ea] flex items-center justify-center">
                            <Upload className="w-5 h-5 text-[#c9a96e]" />
                          </div>
                          <p className="text-sm font-medium text-[#0f0f0f]">Fotoğraf Ekle</p>
                          <p className="text-xs text-[#a3a3a3]">
                            {videoImageUrls.length === 0 ? "1-3 fotoğraf · JPG, PNG" : `${3 - videoImageUrls.length} fotoğraf daha ekleyebilirsiniz`}
                          </p>
                        </>
                      )}
                    </button>
                  )}
                  <input
                    ref={videoFileInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => handleVideoFileChange(e.target.files)}
                  />
                  <div className="bg-[#f5f0ea] rounded-xl p-3">
                    <p className="text-xs text-[#a08040] leading-relaxed">
                      Veo 3.1 Fast ile 8 saniyelik dikey video. İşlem yaklaşık 2-3 dakika sürer.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── BÖLÜM 2: MANKEN (kıyafet + gözlük, mannequin hariç) ─── */}
          {!isVideo && !isGhost && !isBgReplace && !isMannequin && (
            <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
              <div className="px-5 pt-5 pb-1 flex items-center justify-between">
                <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Manken</p>
                {!isEyewear && isBatchMode && (
                  <span className="text-xs text-[#737373]">{batchModelIds.length} seçildi</span>
                )}
              </div>
              <div className="p-5 pt-3">
                <ModelSelector />
              </div>
            </div>
          )}

          {/* ─── BÖLÜM 3: AYARLAR (sadece kıyafet, mannequin hariç) ─── */}
          {!isVideo && !isEyewear && !isGhost && !isBgReplace && !isMannequin && (
            <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
              <div className="px-5 pt-5 pb-1">
                <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Ayarlar</p>
              </div>
              <div className="p-5 pt-3 space-y-6">

                {/* Kıyafet Kategorisi — sadece Kıyafet-1 */}
                {!isNano && (
                  <div>
                    <label className="block text-xs font-medium text-[#737373] uppercase tracking-wider mb-3">Kıyafet Kategorisi</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "tops",       label: "Üst Parça",    desc: "Gömlek, bluz, ceket..." },
                        { value: "bottoms",    label: "Alt Parça",    desc: "Pantolon, etek..."      },
                        { value: "one-pieces", label: "Elbise / Set", desc: "Elbise, tulum, takım"   },
                      ].map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setGarmentCategory(cat.value)}
                          className={cn(
                            "flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-all",
                            garmentCategory === cat.value
                              ? "border-[#0f0f0f] bg-[#0f0f0f] text-white"
                              : "border-[#e8e8e8] bg-white text-[#0f0f0f] hover:border-[#0f0f0f]"
                          )}
                        >
                          <span className="text-xs font-semibold">{cat.label}</span>
                          <span className={cn("text-[10px]", garmentCategory === cat.value ? "text-white/50" : "text-[#a3a3a3]")}>
                            {cat.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trend Estetiği */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[#737373] uppercase tracking-wider mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-[#c9a96e]" /> Trend Estetiği
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AESTHETICS.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => setAesthetic(a.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border text-center transition-all",
                          aesthetic === a.value
                            ? "border-[#0f0f0f] bg-[#0f0f0f] text-white"
                            : "border-[#e8e8e8] bg-white text-[#737373] hover:border-[#0f0f0f] hover:text-[#0f0f0f]"
                        )}
                      >
                        <span className="text-lg leading-none">{a.emoji}</span>
                        <span className="text-[10px] font-semibold leading-tight">{a.label}</span>
                        <span className={cn("text-[9px] leading-tight", aesthetic === a.value ? "text-white/50" : "text-[#c0c0c0]")}>
                          {a.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arka Plan */}
                <div>
                  <label className="block text-xs font-medium text-[#737373] uppercase tracking-wider mb-3">Arka Plan</label>
                  <div className="grid grid-cols-5 gap-2">
                    {BACKGROUNDS.map((bg) => (
                      <button key={bg.value} onClick={() => setBackground(bg.value)} className="flex flex-col items-center gap-1.5" title={bg.label}>
                        <div className={cn(
                          "w-full aspect-square rounded-xl overflow-hidden transition-all",
                          background === bg.value
                            ? "ring-2 ring-[#0f0f0f] ring-offset-2"
                            : "hover:ring-1 hover:ring-[#a3a3a3] ring-offset-1"
                        )}>
                          {bg.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={bg.image} alt={bg.label} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <span className={cn("text-[10px] text-center leading-tight", background === bg.value ? "text-[#0f0f0f] font-semibold" : "text-[#a3a3a3]")}>
                          {bg.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manken Tipi — Nano modda gösterilmez */}
                {!isNano && (
                  <div>
                    <label className="block text-xs font-medium text-[#737373] uppercase tracking-wider mb-3">Manken Tipi</label>
                    <div className="flex gap-2">
                      {[{ value: "standard", label: "Standart" }, { value: "plus", label: "Büyük Beden" }].map((bt) => (
                        <button
                          key={bt.value}
                          onClick={() => setBodyType(bt.value)}
                          className={cn(
                            "flex-1 py-2.5 rounded-full text-xs font-medium border transition-all",
                            bodyType === bt.value
                              ? "bg-[#0f0f0f] text-white border-[#0f0f0f]"
                              : "bg-white text-[#737373] border-[#e5e5e5] hover:border-[#0f0f0f] hover:text-[#0f0f0f]"
                          )}
                        >
                          {bt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {isNano && (
                  <div className="bg-[#fff8ec] border border-[#f5d48a] rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-[#a07020] mb-1">Kıyafet-2 Bilgisi</p>
                    <p className="text-xs text-[#b08030] leading-relaxed">
                      Büyük beden çalışmaları için <strong>Kıyafet-1</strong> sekmesini kullanın.
                      Kıyafet-2, standart beden mankenlerle optimize edilmiştir.
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ─── VİDEO MODU ─── */}
          {isVideo && (
            <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
              <div className="px-5 pt-5 pb-1">
                <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Video Modu</p>
              </div>
              <div className="p-5 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "image_to_video",    emoji: "🎬", label: "Hızlı",      desc: "Fotoğrafı canlandır" },
                    { value: "reference_to_video", emoji: "✨", label: "Referanslı", desc: "Referans ile üret"    },
                  ].map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setVideoMode(m.value as any)}
                      className={cn(
                        "flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all text-left",
                        videoMode === m.value
                          ? "border-[#0f0f0f] bg-[#0f0f0f] text-white"
                          : "border-[#e8e8e8] bg-white text-[#0f0f0f] hover:border-[#0f0f0f]"
                      )}
                    >
                      <span className="text-lg">{m.emoji}</span>
                      <span className="text-sm font-semibold">{m.label}</span>
                      <span className={cn("text-xs", videoMode === m.value ? "text-white/60" : "text-[#a3a3a3]")}>{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Sabit Alt Bar: Üret Butonu ── */}
        <div className="fixed bottom-16 left-0 right-0 z-40 md:bottom-0 md:left-[27rem] bg-white/95 backdrop-blur-sm border-t border-[#e8e8e8] px-5 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
                <ImageIcon className="w-4 h-4 text-[#c9a96e]" />
                <span className="font-bold text-sm text-[#0f0f0f]">{user.credits_remaining}</span>
                <span className="text-xs text-[#a3a3a3]">üretim</span>
              </div>
            )}
            <div className="flex-1">
              {!hasCredits ? (
                <Link
                  href="/credits"
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-full font-semibold text-sm bg-[#c9a96e] text-white hover:bg-[#b8935a] transition-all shadow-sm"
                >
                  <ShoppingCart className="w-4 h-4" /> Paket Satın Al
                </Link>
              ) : (
                <button
                  onClick={handleRun}
                  disabled={!canGenerate || running}
                  className={cn(
                    "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-full font-semibold text-sm transition-all",
                    canGenerate && !running
                      ? "bg-[#0f0f0f] text-white hover:bg-[#2a2a2a] shadow-sm"
                      : "bg-[#e8e8e8] text-[#a3a3a3] cursor-not-allowed"
                  )}
                >
                  {running ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#a3a3a3] border-t-transparent rounded-full animate-spin" />
                      {runningMessage}
                    </>
                  ) : isMannequin ? (
                    <><Wand2 className="w-4 h-4" /> Giydir — 2 üretim</>
                  ) : isBgReplace ? (
                    <><ImageIcon className="w-4 h-4" /> Arka Plan Değiştir — {bgPhotos.length || 1} üretim</>
                  ) : isGhost ? (
                    <><UserX className="w-4 h-4" /> Ghost Mannequin — 1 üretim</>
                  ) : isVideo ? (
                    <><Video className="w-4 h-4" /> Video Üret — 5 üretim</>
                  ) : isEyewear ? (
                    <><Wand2 className="w-4 h-4" /> Üret — 1 üretim</>
                  ) : isBatchMode ? (
                    <><Wand2 className="w-4 h-4" /> Toplu Üret — {batchModelIds.length} model · {batchModelIds.length * 2} üretim</>
                  ) : (
                    <><Wand2 className="w-4 h-4" /> Üret — 2 üretim</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
