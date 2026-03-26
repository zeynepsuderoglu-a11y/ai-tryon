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
import {
  Wand2, ChevronLeft, Layers, Sparkles, Glasses, Package,
  ShoppingCart, Video, Upload, X, ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const BACKGROUNDS = [
  { value: "white_studio",   label: "Beyaz",   image: "/backgrounds/white_studio.jpg"   },
  { value: "grey_studio",    label: "Gri",      image: "/backgrounds/grey_studio.jpg"    },
  { value: "cream",          label: "Krem",     image: "/backgrounds/cream.jpg"          },
  { value: "black_studio",   label: "Siyah",    image: "/backgrounds/black_studio.jpg"   },
  { value: "pink_studio",    label: "Pembe",    image: "/backgrounds/pink_studio.jpg"    },
  { value: "outdoor_city",   label: "Şehir",    image: "/backgrounds/outdoor_city.jpg"   },
  { value: "outdoor_nature", label: "Doğa",     image: "/backgrounds/outdoor_nature.jpg" },
  { value: "cafe",           label: "Kafe",     image: "/backgrounds/cafe.jpg"           },
  { value: "minimal_room",   label: "Oda",      image: "/backgrounds/minimal_room.jpg"   },
  { value: "beige_outdoor",  label: "Plaj",     image: "/backgrounds/beige_outdoor.jpg"  },
];

const AESTHETICS = [
  { value: "no_accessories",   label: "Aksesuarsız", emoji: "✨", desc: "Sade üretim"      },
  { value: "with_accessories", label: "Aksesuarlı",  emoji: "👜", desc: "Çanta, gözlük"    },
];

export default function StudioPage() {
  const { user, setUser } = useAuthStore();
  const {
    garmentUrl, selectedModelId, isBatchMode, batchModelIds, setIsBatchMode,
    glassesUrl, studioMode, setStudioMode,
    videoImageUrls, setVideoImageUrls, videoMode, setVideoMode,
  } = useStudioStore();

  const [bodyType, setBodyType]     = useState("standard");
  const [tuckStyle, setTuckStyle]   = useState("");
  const [background, setBackground] = useState("white_studio");
  const [aesthetic, setAesthetic]   = useState("no_accessories");
  const [running, setRunning]       = useState(false);
  const [runningMessage, setRunningMessage] = useState("Başlatılıyor...");
  const [generationId, setGenerationId]     = useState<string | null>(null);
  const [batchJobId, setBatchJobId]         = useState<string | null>(null);
  const [showResult, setShowResult]         = useState(false);
  const [videoGenerationId, setVideoGenerationId] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const isEyewear = studioMode === "eyewear";
  const isVideo   = studioMode === "video";

  const canGenerate = isVideo
    ? videoImageUrls.length > 0
    : isEyewear
    ? !!glassesUrl && !!selectedModelId
    : isBatchMode
    ? !!garmentUrl && batchModelIds.length > 0
    : !!garmentUrl && !!selectedModelId;

  const requiredCredits = isVideo ? 5 : isEyewear ? 1 : isBatchMode ? batchModelIds.length * 2 : 2;
  const hasCredits = !user || user.credits_remaining >= requiredCredits;

  const handleModeSwitch = (mode: "kiyafet" | "eyewear" | "video") => {
    if (mode === studioMode) return;
    setStudioMode(mode);
    setShowResult(false);
    setGenerationId(null);
    setBatchJobId(null);
    setVideoGenerationId(null);
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
    setRunningMessage("Başlatılıyor...");
    try {
      if (isVideo) {
        setRunningMessage("Video üretimi başlatılıyor...");
        const result = await videoApi.run({ image_urls: videoImageUrls, mode: videoMode });
        setVideoGenerationId(result.generation_id);
        toast.success("Video üretimi başladı! Bu işlem 2-3 dakika sürebilir.");
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - 5 });
        setShowResult(true);
      } else if (isEyewear) {
        const result = await eyewearApi.run({ glasses_url: glassesUrl!, model_asset_id: selectedModelId! });
        setGenerationId(result.generation_id);
        toast.success("Gözlük try-on başladı!");
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - 1 });
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
          body_type: bodyType, provider: "fashn", background, aesthetic, tuck_style: tuckStyle,
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
    if (isVideo) setVideoImageUrls([]);
  };

  /* ── Sonuç Ekranı ── */
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
            />
          )}
        </div>
      </div>
    );
  }

  /* ── Ana Sayfa ── */
  return (
    <div className="min-h-screen bg-[#f8f8f8]">

      {/* ── Üst Bar: Mod Seçimi ── */}
      <div className="bg-white border-b border-[#e8e8e8] px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="inline-flex bg-[#f3f3f3] rounded-full p-1 gap-1">
          {[
            { mode: "kiyafet" as const, label: "Kıyafet", icon: <Package className="w-3.5 h-3.5" /> },
            { mode: "eyewear" as const, label: "Gözlük",  icon: <Glasses className="w-3.5 h-3.5" /> },
            { mode: "video"   as const, label: "Video",   icon: <Video className="w-3.5 h-3.5" />   },
          ].map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => handleModeSwitch(mode)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                studioMode === mode
                  ? "bg-[#0f0f0f] text-white shadow-sm"
                  : "text-[#737373] hover:text-[#0f0f0f]"
              )}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {studioMode === "kiyafet" && (
          <button
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border",
              isBatchMode
                ? "bg-[#0f0f0f] text-white border-[#0f0f0f]"
                : "bg-white text-[#737373] border-[#e5e5e5] hover:border-[#0f0f0f] hover:text-[#0f0f0f]"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            {isBatchMode ? "Toplu: Açık" : "Toplu"}
          </button>
        )}
      </div>

      {/* ── İçerik ── */}
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-4 pb-36">

        {/* ─── BÖLÜM 1: YÜKLEME ─── */}
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

        {/* ─── BÖLÜM 2: MANKEN (video hariç) ─── */}
        {!isVideo && (
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

        {/* ─── BÖLÜM 3: AYARLAR (sadece kıyafet) ─── */}
        {!isVideo && !isEyewear && (
          <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
            <div className="px-5 pt-5 pb-1">
              <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Ayarlar</p>
            </div>
            <div className="p-5 pt-3 space-y-6">

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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={bg.image} alt={bg.label} className="w-full h-full object-cover" />
                      </div>
                      <span className={cn("text-[10px] text-center leading-tight", background === bg.value ? "text-[#0f0f0f] font-semibold" : "text-[#a3a3a3]")}>
                        {bg.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manken Tipi */}
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

              {/* Stilist Notu */}
              <div>
                <label className="block text-xs font-medium text-[#737373] uppercase tracking-wider mb-2">
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
            </div>
          </div>
        )}

        {/* ─── BÖLÜM 3: VİDEO MODU ─── */}
        {isVideo && (
          <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
            <div className="px-5 pt-5 pb-1">
              <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Video Modu</p>
            </div>
            <div className="p-5 pt-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "image_to_video",     emoji: "🎬", label: "Hızlı",    desc: "Fotoğrafı canlandır" },
                  { value: "reference_to_video",  emoji: "✨", label: "Referanslı", desc: "Referans ile üret" },
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
      <div className="fixed bottom-16 left-0 right-0 z-40 md:bottom-0 bg-white/95 backdrop-blur-sm border-t border-[#e8e8e8] px-5 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
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
  );
}
