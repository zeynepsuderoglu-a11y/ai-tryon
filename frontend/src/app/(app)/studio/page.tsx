"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { tryonApi, eyewearApi, videoApi } from "@/lib/api";
import { useStudioStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store";
import GarmentUpload from "@/components/studio/GarmentUpload";
import GlassesUpload from "@/components/studio/GlassesUpload";
import ModelSelector from "@/components/studio/ModelSelector";
import ResultDisplay from "@/components/studio/ResultDisplay";
import VideoResult from "@/components/studio/VideoResult";
import { Wand2, ChevronRight, ChevronLeft, Check, Layers, Sparkles, Glasses, Package, ShoppingCart, Video, Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const BACKGROUNDS = [
  { value: "white_studio",   label: "Beyaz Stüdyo",  image: "/backgrounds/white_studio.jpg"   },
  { value: "grey_studio",    label: "Gri Stüdyo",    image: "/backgrounds/grey_studio.jpg"    },
  { value: "cream",          label: "Krem",          image: "/backgrounds/cream.jpg"          },
  { value: "black_studio",   label: "Siyah Stüdyo",  image: "/backgrounds/black_studio.jpg"   },
  { value: "pink_studio",    label: "Pembe Stüdyo",  image: "/backgrounds/pink_studio.jpg"    },
  { value: "outdoor_city",   label: "Şehir",         image: "/backgrounds/outdoor_city.jpg"   },
  { value: "outdoor_nature", label: "Doğa",          image: "/backgrounds/outdoor_nature.jpg" },
  { value: "cafe",           label: "Kafe",          image: "/backgrounds/cafe.jpg"           },
  { value: "minimal_room",   label: "Oda",           image: "/backgrounds/minimal_room.jpg"   },
  { value: "beige_outdoor",  label: "Plaj",          image: "/backgrounds/beige_outdoor.jpg"  },
];

const AESTHETICS = [
  { value: "auto",               label: "Otomatik",     emoji: "✨", desc: "Claude seçer" },
  { value: "quiet_luxury",       label: "Quiet Luxury", emoji: "🤍", desc: "The Row, Max Mara" },
  { value: "parisian_chic",      label: "Parisian",     emoji: "🥐", desc: "Fransız şıklığı" },
  { value: "corporate_siren",    label: "Corporate",    emoji: "💼", desc: "Güç giyimi" },
  { value: "coastal_cool",       label: "Coastal",      emoji: "🌊", desc: "Resort, keten" },
  { value: "street_luxe",        label: "Street Luxe",  emoji: "👟", desc: "High-low mix" },
  { value: "romantic_feminine",  label: "Romantik",     emoji: "🌸", desc: "Ballet-core" },
];

const KIYAFET_STEPS = ["Kıyafet", "Model", "Üret"];
const EYEWEAR_STEPS = ["Gözlük",  "Model", "Üret"];
const VIDEO_STEPS   = ["Fotoğraf", "Üret"];

export default function StudioPage() {
  const { user, setUser } = useAuthStore();
  const {
    garmentUrl, selectedModelId, isBatchMode, batchModelIds, setIsBatchMode,
    glassesUrl, studioMode, setStudioMode,
    videoImageUrls, setVideoImageUrls, videoMode, setVideoMode,
  } = useStudioStore();

  const [step, setStep] = useState(0);
  const [bodyType, setBodyType] = useState("standard");
  const [tuckStyle, setTuckStyle] = useState("");
  const [background, setBackground] = useState("white_studio");
  const [aesthetic, setAesthetic] = useState("auto");
  const [running, setRunning] = useState(false);
  const [runningMessage, setRunningMessage] = useState("Başlatılıyor...");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [videoGenerationId, setVideoGenerationId] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const isEyewear = studioMode === "eyewear";
  const isVideo   = studioMode === "video";
  const STEPS = isVideo ? VIDEO_STEPS : (isEyewear ? EYEWEAR_STEPS : KIYAFET_STEPS);

  const canNext0 = isVideo
    ? videoImageUrls.length > 0
    : isEyewear ? !!glassesUrl : !!garmentUrl;
  const canNext1 = isEyewear ? !!selectedModelId : (isBatchMode ? batchModelIds.length > 0 : !!selectedModelId);

  const handleModeSwitch = (mode: "kiyafet" | "eyewear" | "video") => {
    if (mode === studioMode) return;
    setStudioMode(mode);
    setStep(0);
    setShowResult(false);
    setGenerationId(null);
    setBatchJobId(null);
    setVideoGenerationId(null);
  };

  // Video image upload
  const handleVideoFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 3 - videoImageUrls.length;
    if (remaining <= 0) {
      toast.error("En fazla 3 fotoğraf yükleyebilirsiniz");
      return;
    }
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

  const removeVideoImage = (index: number) => {
    setVideoImageUrls(videoImageUrls.filter((_, i) => i !== index));
  };

  const handleRun = async () => {
    setRunning(true);
    setGenerationId(null);
    setBatchJobId(null);
    setShowResult(false);
    setVideoGenerationId(null);
    setRunningMessage("Başlatılıyor...");

    try {
      if (isVideo) {
        setRunningMessage("Video üretimi başlatılıyor...");
        const result = await videoApi.run({
          image_urls: videoImageUrls,
          mode: videoMode,
        });
        setVideoGenerationId(result.generation_id);
        toast.success("Video üretimi başladı! Bu işlem 2-3 dakika sürebilir.");
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - 5 });
        setShowResult(true);
      } else if (isEyewear) {
        setRunningMessage("Üretim başlatılıyor...");
        const result = await eyewearApi.run({
          glasses_url: glassesUrl!,
          model_asset_id: selectedModelId!,
        });
        setGenerationId(result.generation_id);
        toast.success("Gözlük try-on başladı!");
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - 1 });
        setShowResult(true);
      } else if (isBatchMode) {
        const result = await tryonApi.runBatch({
          garment_url: garmentUrl!,
          model_ids: batchModelIds,
        });
        setBatchJobId(result.batch_job_id);
        toast.success(`Toplu işlem başladı! ${result.total} üretim sıraya alındı.`);
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - result.total * 2 });
        setShowResult(true);
      } else {
        setRunningMessage("Üretim başlatılıyor...");
        const result = await tryonApi.run({
          garment_url: garmentUrl!,
          model_asset_id: selectedModelId!,
          body_type: bodyType,
          provider: "fashn",
          background,
          aesthetic,
          tuck_style: tuckStyle,
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
    setStep(0);
    if (isVideo) setVideoImageUrls([]);
  };

  // Sonuç ekranı
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
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e8] px-5 py-4">

        {/* Üst satır: Mode toggle + başlık + batch */}
        <div className="flex items-center justify-between mb-5">
          {/* Mode Toggle — pill */}
          <div className="inline-flex bg-[#f3f3f3] rounded-full p-1 gap-1">
            <button
              onClick={() => handleModeSwitch("kiyafet")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                studioMode === "kiyafet"
                  ? "bg-[#0f0f0f] text-white shadow-sm"
                  : "text-[#737373] hover:text-[#0f0f0f]"
              )}
            >
              <Package className="w-3.5 h-3.5" /> Kıyafet
            </button>
            <button
              onClick={() => handleModeSwitch("eyewear")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                studioMode === "eyewear"
                  ? "bg-[#0f0f0f] text-white shadow-sm"
                  : "text-[#737373] hover:text-[#0f0f0f]"
              )}
            >
              <Glasses className="w-3.5 h-3.5" /> Gözlük
            </button>
            <button
              onClick={() => handleModeSwitch("video")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                studioMode === "video"
                  ? "bg-[#0f0f0f] text-white shadow-sm"
                  : "text-[#737373] hover:text-[#0f0f0f]"
              )}
            >
              <Video className="w-3.5 h-3.5" /> Video
            </button>
          </div>

          {/* Sağ: Toplu işlem (desktop, sadece kıyafet modunda) */}
          {studioMode === "kiyafet" && (
            <button
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={cn(
                "hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border",
                isBatchMode
                  ? "bg-[#0f0f0f] text-white border-[#0f0f0f]"
                  : "bg-white text-[#737373] border-[#e5e5e5] hover:border-[#0f0f0f] hover:text-[#0f0f0f]"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              {isBatchMode ? "Toplu: Açık" : "Toplu İşlem"}
            </button>
          )}
        </div>

        {/* Step Göstergesi */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => {
                  if (i === 0) setStep(0);
                  if (i === 1 && canNext0) setStep(1);
                  if (i === 2 && canNext0 && canNext1) setStep(2);
                }}
                className="flex items-center gap-2.5"
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all flex-shrink-0",
                  step === i
                    ? "bg-[#0f0f0f] text-white"
                    : step > i
                    ? "bg-[#c9a96e] text-white"
                    : "bg-[#f0f0f0] text-[#a3a3a3]"
                )}>
                  {step > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  step === i ? "text-[#0f0f0f]" : "text-[#b0b0b0]"
                )}>{s}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-px mx-3",
                  step > i ? "bg-[#c9a96e]" : "bg-[#e8e8e8]"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-y-auto pb-32 md:pb-8">

        {/* ─── VIDEO MODU ─── */}
        {isVideo && step === 0 && (
          <div className="max-w-lg mx-auto px-5 py-10">
            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-[#0f0f0f] mb-1">Fotoğraf Yükle</h2>
              <p className="text-sm text-[#737373]">Canlandırmak istediğiniz fotoğrafları yükleyin (max 3)</p>
            </div>

            {/* Uploaded Images Grid */}
            {videoImageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {videoImageUrls.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-[#f0f0f0] group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeVideoImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded-full">
                        Ana
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            {videoImageUrls.length < 3 && (
              <button
                onClick={() => videoFileInputRef.current?.click()}
                disabled={videoUploading}
                className={cn(
                  "w-full border-2 border-dashed rounded-3xl p-10 flex flex-col items-center gap-3 transition-all",
                  videoUploading
                    ? "border-[#e8e8e8] bg-[#f8f8f8] cursor-not-allowed"
                    : "border-[#e0e0e0] hover:border-[#c9a96e] hover:bg-[#fdf9f4] cursor-pointer"
                )}
              >
                {videoUploading ? (
                  <>
                    <div className="w-10 h-10 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-[#737373]">Yükleniyor...</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-[#f5f0ea] flex items-center justify-center">
                      <Upload className="w-6 h-6 text-[#c9a96e]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#0f0f0f]">Fotoğraf Ekle</p>
                      <p className="text-xs text-[#a3a3a3] mt-1">
                        {videoImageUrls.length === 0
                          ? "1-3 fotoğraf yükleyebilirsiniz"
                          : `${3 - videoImageUrls.length} fotoğraf daha ekleyebilirsiniz`}
                      </p>
                    </div>
                  </>
                )}
              </button>
            )}
            <input
              ref={videoFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleVideoFileChange(e.target.files)}
            />

            {/* Info */}
            <div className="mt-5 bg-[#f5f0ea] rounded-2xl p-4 space-y-1.5">
              <p className="text-xs font-semibold text-[#8a6a3a]">Nasıl çalışır?</p>
              <p className="text-xs text-[#a08040] leading-relaxed">
                Yüklediğiniz fotoğraf yapay zeka tarafından 8 saniyelik dikey video olarak canlandırılır.
                Veo 3.1 Fast teknolojisi ile gerçekçi hareket efektleri oluşturulur.
              </p>
            </div>
          </div>
        )}

        {/* Video — Adım 1: Üret */}
        {isVideo && step === 1 && (
          <div className="max-w-lg mx-auto px-5 py-10 space-y-7">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#0f0f0f] mb-1">Video Üret</h2>
              <p className="text-sm text-[#737373]">Video modunu seçin ve üretimi başlatın</p>
            </div>

            {/* Yüklenen fotoğraflar özeti */}
            <div className="flex gap-2">
              {videoImageUrls.map((url, i) => (
                <div key={i} className="w-16 h-16 rounded-xl overflow-hidden bg-[#f0f0f0] flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="flex-1 flex items-center">
                <p className="text-sm text-[#737373]">{videoImageUrls.length} fotoğraf yüklendi</p>
              </div>
            </div>

            {/* Video Modu */}
            <div>
              <label className="block text-xs font-medium text-[#737373] uppercase tracking-wider mb-3">
                Video Modu
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setVideoMode("image_to_video")}
                  className={cn(
                    "flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all text-left",
                    videoMode === "image_to_video"
                      ? "border-[#0f0f0f] bg-[#0f0f0f] text-white"
                      : "border-[#e8e8e8] bg-white text-[#0f0f0f] hover:border-[#0f0f0f]"
                  )}
                >
                  <span className="text-lg">🎬</span>
                  <span className="text-sm font-semibold">Hızlı</span>
                  <span className={cn("text-xs leading-tight", videoMode === "image_to_video" ? "text-white/60" : "text-[#a3a3a3]")}>
                    Fotoğrafı canlandır
                  </span>
                </button>
                <button
                  onClick={() => setVideoMode("reference_to_video")}
                  className={cn(
                    "flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all text-left",
                    videoMode === "reference_to_video"
                      ? "border-[#0f0f0f] bg-[#0f0f0f] text-white"
                      : "border-[#e8e8e8] bg-white text-[#0f0f0f] hover:border-[#0f0f0f]"
                  )}
                >
                  <span className="text-lg">✨</span>
                  <span className="text-sm font-semibold">Referanslı</span>
                  <span className={cn("text-xs leading-tight", videoMode === "reference_to_video" ? "text-white/60" : "text-[#a3a3a3]")}>
                    Referans ile üret
                  </span>
                </button>
              </div>
            </div>

            {/* Üretim bakiyesi */}
            {user && (
              <div className="flex items-center justify-between text-sm py-3 border-t border-[#e8e8e8]">
                <span className="text-[#737373]">Üretim bakiyesi</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#0f0f0f]">{user.credits_remaining}</span>
                  <span className="text-xs text-[#c9a96e] font-medium">üretim</span>
                </div>
              </div>
            )}

            {/* Üret Butonu */}
            {user && user.credits_remaining < 5 ? (
              <Link
                href="/credits"
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-full font-semibold text-sm bg-[#c9a96e] text-white hover:bg-[#b8935a] transition-all shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Paket Satın Al
              </Link>
            ) : (
              <button
                onClick={handleRun}
                disabled={running}
                className={cn(
                  "w-full flex items-center justify-center gap-2.5 py-4 rounded-full font-semibold text-sm transition-all",
                  !running
                    ? "bg-[#0f0f0f] text-white hover:bg-[#2a2a2a] shadow-sm"
                    : "bg-[#e8e8e8] text-[#a3a3a3] cursor-not-allowed"
                )}
              >
                {running ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#a3a3a3] border-t-transparent rounded-full animate-spin" />
                    {runningMessage}
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    Video Üret — 5 üretim
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* ─── KIYAFEt / GÖZLÜK MODU ─── */}

        {/* Adım 0 — Yükleme */}
        {!isVideo && step === 0 && (
          <div className="max-w-lg mx-auto px-5 py-10">
            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-[#0f0f0f] mb-1">
                {isEyewear ? "Gözlük Fotoğrafı" : "Kıyafet Fotoğrafı"}
              </h2>
              <p className="text-sm text-[#737373]">Ürün fotoğrafını yükleyin</p>
            </div>
            {isEyewear ? <GlassesUpload /> : <GarmentUpload />}
          </div>
        )}

        {/* Adım 1 — Model Seç */}
        {!isVideo && step === 1 && (
          <div className="px-5 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#0f0f0f] mb-1">Model Seç</h2>
                  <p className="text-sm text-[#737373]">
                    {!isEyewear && isBatchMode
                      ? `${batchModelIds.length} model seçildi (max 10)`
                      : "Kıyafetin giyileceği modeli seçin"}
                  </p>
                </div>
                {/* Mobil batch toggle */}
                {!isEyewear && (
                  <button
                    onClick={() => setIsBatchMode(!isBatchMode)}
                    className={cn(
                      "md:hidden flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all",
                      isBatchMode
                        ? "bg-[#0f0f0f] text-white border-[#0f0f0f]"
                        : "bg-white text-[#737373] border-[#e5e5e5]"
                    )}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {isBatchMode ? "Toplu: Açık" : "Toplu"}
                  </button>
                )}
              </div>
              <ModelSelector />
            </div>
          </div>
        )}

        {/* Adım 2 — Ayarlar & Üret */}
        {!isVideo && step === 2 && (
          <div className="max-w-lg mx-auto px-5 py-10 space-y-7">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#0f0f0f] mb-1">
                {isEyewear ? "Üret" : "Ayarlar"}
              </h2>
              <p className="text-sm text-[#737373]">
                {isEyewear ? "Gözlük try-on'u başlatın" : "Üretim tercihlerini belirleyin"}
              </p>
            </div>

            {/* Özet kartı */}
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5 space-y-3">
              <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider">Özet</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#737373]">{isEyewear ? "Gözlük" : "Kıyafet"}</span>
                <span className="text-[#0f0f0f] font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#c9a96e]" /> Yüklendi
                </span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-[#f0f0f0] pt-3">
                <span className="text-[#737373]">Model</span>
                <span className="text-[#0f0f0f] font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#c9a96e]" />
                  {!isEyewear && isBatchMode ? `${batchModelIds.length} model` : "Seçildi"}
                </span>
              </div>
            </div>

            {/* Kıyafet'e özel ayarlar */}
            {!isEyewear && (
              <>
                {/* Trend Estetiği */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[#737373] uppercase tracking-wider mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-[#c9a96e]" /> Trend Estetiği
                  </label>
                  <div className="grid grid-cols-4 gap-2">
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
                  <label className="block text-xs font-medium text-[#737373] uppercase tracking-wider mb-3">
                    Arka Plan
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.value}
                        onClick={() => setBackground(bg.value)}
                        className="flex flex-col items-center gap-1.5"
                        title={bg.label}
                      >
                        <div className={cn(
                          "w-full aspect-square rounded-xl overflow-hidden transition-all",
                          background === bg.value
                            ? "ring-2 ring-[#0f0f0f] ring-offset-2"
                            : "hover:ring-1 hover:ring-[#a3a3a3] ring-offset-1"
                        )}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={bg.image} alt={bg.label} className="w-full h-full object-cover" />
                        </div>
                        <span className={cn(
                          "text-[10px] text-center leading-tight",
                          background === bg.value ? "text-[#0f0f0f] font-semibold" : "text-[#a3a3a3]"
                        )}>
                          {bg.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manken Tipi */}
                <div>
                  <label className="block text-xs font-medium text-[#737373] uppercase tracking-wider mb-3">
                    Manken Tipi
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: "standard", label: "Standart"    },
                      { value: "plus",     label: "Büyük Beden" },
                    ].map((bt) => (
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

                {/* Stilist Notu */}
                <div>
                  <label className="block text-xs font-medium text-[#737373] uppercase tracking-wider mb-3">
                    Stilist Notu <span className="normal-case font-normal text-[#b0b0b0]">(isteğe bağlı)</span>
                  </label>
                  <textarea
                    value={tuckStyle}
                    onChange={(e) => setTuckStyle(e.target.value)}
                    placeholder="Örn: gömleği dışarıda bırak, düğmeleri kapat, kolları sıvayarak göster..."
                    maxLength={200}
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl border border-[#e5e5e5] bg-white text-sm text-[#0f0f0f] placeholder-[#c0c0c0] resize-none focus:outline-none focus:border-[#0f0f0f] transition-colors"
                  />
                </div>
              </>
            )}

            {/* Üretim bakiyesi */}
            {user && (
              <div className="flex items-center justify-between text-sm py-3 border-t border-[#e8e8e8]">
                <span className="text-[#737373]">Üretim bakiyesi</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#0f0f0f]">{user.credits_remaining}</span>
                  <span className="text-xs text-[#c9a96e] font-medium">üretim</span>
                </div>
              </div>
            )}

            {/* Üret Butonu */}
            {user && user.credits_remaining < (isEyewear ? 1 : 2) ? (
              <Link
                href="/credits"
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-full font-semibold text-sm bg-[#c9a96e] text-white hover:bg-[#b8935a] transition-all shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Paket Satın Al
              </Link>
            ) : (
              <button
                onClick={handleRun}
                disabled={running}
                className={cn(
                  "w-full flex items-center justify-center gap-2.5 py-4 rounded-full font-semibold text-sm transition-all",
                  !running
                    ? "bg-[#0f0f0f] text-white hover:bg-[#2a2a2a] shadow-sm"
                    : "bg-[#e8e8e8] text-[#a3a3a3] cursor-not-allowed"
                )}
              >
                {running ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#a3a3a3] border-t-transparent rounded-full animate-spin" />
                    {runningMessage}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    {isEyewear
                      ? "Üret — 1 üretim"
                      : isBatchMode
                      ? `Toplu Üret — ${batchModelIds.length} model · ${batchModelIds.length * 2} üretim`
                      : "Üret — 2 üretim"}
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Alt Navigasyon Butonları */}
      <div className="fixed bottom-16 left-0 right-0 z-40 md:static md:bottom-auto md:ml-0 bg-white border-t border-[#e8e8e8] px-5 py-3 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center justify-center gap-2 flex-1 py-3.5 rounded-full text-sm font-semibold border-2 border-[#0f0f0f] text-[#0f0f0f] bg-white hover:bg-[#f5f5f5] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Geri
          </button>
        )}
        {step < STEPS.length - 1 && (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 0 ? !canNext0 : !canNext1}
            className={cn(
              "flex items-center justify-center gap-2 flex-1 py-3.5 rounded-full text-sm font-semibold transition-all",
              (step === 0 ? canNext0 : canNext1)
                ? "bg-[#0f0f0f] text-white hover:bg-[#2a2a2a]"
                : "bg-[#e8e8e8] text-[#a3a3a3] cursor-not-allowed"
            )}
          >
            İleri <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
