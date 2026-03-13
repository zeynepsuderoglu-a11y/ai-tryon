"use client";

import { useState } from "react";
import { toast } from "sonner";
import { tryonApi } from "@/lib/api";
import { useStudioStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store";
import GarmentUpload from "@/components/studio/GarmentUpload";
import ModelSelector from "@/components/studio/ModelSelector";
import ResultDisplay from "@/components/studio/ResultDisplay";
import { Wand2, ChevronRight, ChevronLeft, Check, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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

const STEPS = ["Kıyafet", "Model", "Üret"];

export default function StudioPage() {
  const { user, setUser } = useAuthStore();
  const {
    garmentUrl, selectedModelId, isBatchMode, batchModelIds, setIsBatchMode,
  } = useStudioStore();

  const [step, setStep] = useState(0);
  const [bodyType, setBodyType] = useState("standard");
  const [background, setBackground] = useState("white_studio");
  const [aesthetic, setAesthetic] = useState("auto");
  const [running, setRunning] = useState(false);
  const [runningMessage, setRunningMessage] = useState("Başlatılıyor...");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const canNext0 = !!garmentUrl;
  const canNext1 = isBatchMode ? batchModelIds.length > 0 : !!selectedModelId;

  const handleRun = async () => {
    setRunning(true);
    setGenerationId(null);
    setBatchJobId(null);
    setShowResult(false);
    setRunningMessage("Başlatılıyor...");

    try {
      if (isBatchMode) {
        const result = await tryonApi.runBatch({
          garment_url: garmentUrl!,
          model_ids: batchModelIds,
        });
        setBatchJobId(result.batch_job_id);
        toast.success(`Toplu işlem başladı! ${result.total} üretim sıraya alındı.`);
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - result.total });
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
        });
        setGenerationId(result.generation_id);
        toast.success("Üretim başladı!");
        if (user) setUser({ ...user, credits_remaining: user.credits_remaining - 1 });
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
    setStep(0);
  };


  // Result screen
  if (showResult) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col">
        <div className="px-4 pt-5 pb-3 border-b border-[#e5e5e5] bg-white flex items-center justify-between">
          <button
            onClick={handleNewGeneration}
            className="flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#1a1a1a] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Yeni Üretim
          </button>
          <span className="text-sm font-medium text-[#1a1a1a]">Sonuç</span>
          <div className="w-20" />
        </div>
        <div className="flex-1 p-4 max-w-2xl mx-auto w-full pb-20 md:pb-4">
          <ResultDisplay
            generationId={generationId || undefined}
            batchJobId={batchJobId || undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">

      {/* Step Header */}
      <div className="bg-white border-b border-[#e5e5e5] px-4 py-4">
        {/* Desktop title */}
        <div className="hidden md:flex items-center justify-between mb-4">
          <h1 className="text-lg font-medium text-[#1a1a1a]">Stüdyo</h1>
          <button
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              isBatchMode
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "bg-white text-[#737373] border-[#e5e5e5] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            {isBatchMode ? "Toplu: Açık" : "Toplu İşlem"}
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => {
                  if (i === 0) setStep(0);
                  if (i === 1 && canNext0) setStep(1);
                  if (i === 2 && canNext0 && canNext1) setStep(2);
                }}
                className="flex items-center gap-2"
              >
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all flex-shrink-0",
                  step === i
                    ? "bg-[#1a1a1a] border-[#1a1a1a] text-white"
                    : step > i
                    ? "bg-[#c9a96e] border-[#c9a96e] text-white"
                    : "bg-white border-[#e5e5e5] text-[#a3a3a3]"
                )}>
                  {step > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  step === i ? "text-[#1a1a1a]" : "text-[#a3a3a3]"
                )}>{s}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-px mx-2",
                  step > i ? "bg-[#c9a96e]" : "bg-[#e5e5e5]"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto pb-32 md:pb-6">

        {/* Step 0: Kıyafet Yükle */}
        {step === 0 && (
          <div className="max-w-lg mx-auto px-4 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-medium text-[#1a1a1a] mb-1">Kıyafet Fotoğrafı</h2>
              <p className="text-sm text-[#737373]">Ürün fotoğrafını yükleyin</p>
            </div>
            <GarmentUpload />
          </div>
        )}

        {/* Step 1: Model Seç */}
        {step === 1 && (
          <div className="px-4 py-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-medium text-[#1a1a1a] mb-0.5">Model Seç</h2>
                  <p className="text-sm text-[#737373]">
                    {isBatchMode
                      ? `${batchModelIds.length} model seçildi (max 10)`
                      : "Kıyafetin giyileceği modeli seçin"}
                  </p>
                </div>
                {/* Mobile batch toggle */}
                <button
                  onClick={() => setIsBatchMode(!isBatchMode)}
                  className={cn(
                    "md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border",
                    isBatchMode
                      ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                      : "bg-white text-[#737373] border-[#e5e5e5]"
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {isBatchMode ? "Toplu: Açık" : "Toplu"}
                </button>
              </div>
              <ModelSelector />
            </div>
          </div>
        )}

        {/* Step 2: Ayarlar & Üret */}
        {step === 2 && (
          <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
            <div>
              <h2 className="text-xl font-medium text-[#1a1a1a] mb-1">Ayarlar</h2>
              <p className="text-sm text-[#737373]">Üretim tercihlerini belirleyin</p>
            </div>

            {/* Özet */}
            <div className="card p-4 space-y-3">
              <p className="text-xs font-medium text-[#737373] uppercase tracking-wider">Özet</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#737373]">Kıyafet</span>
                <span className="text-[#1a1a1a] font-medium">Yüklendi ✓</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#737373]">Model</span>
                <span className="text-[#1a1a1a] font-medium">
                  {isBatchMode ? `${batchModelIds.length} model seçildi` : "Seçildi ✓"}
                </span>
              </div>

            </div>

            {/* Trend Estetiği */}
            <div>
              <label className="label flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#c9a96e]" /> Trend Estetiği
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AESTHETICS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setAesthetic(a.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all",
                      aesthetic === a.value
                        ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                        : "border-[#e5e5e5] bg-white text-[#737373] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
                    )}
                  >
                    <span className="text-lg leading-none">{a.emoji}</span>
                    <span className="text-[10px] font-medium leading-tight">{a.label}</span>
                    <span className={cn("text-[9px] leading-tight", aesthetic === a.value ? "text-[#a3a3a3]" : "text-[#b3b3b3]")}>{a.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Arka Plan */}
            <div>
              <label className="label block mb-2">Arka Plan</label>
              <div className="grid grid-cols-5 gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => setBackground(bg.value)}
                    className="flex flex-col items-center gap-1"
                    title={bg.label}
                  >
                    <div
                      className={cn(
                        "w-full aspect-square rounded-lg transition-all overflow-hidden",
                        background === bg.value
                          ? "ring-2 ring-[#1a1a1a] ring-offset-1"
                          : "hover:ring-1 hover:ring-[#a3a3a3]"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bg.image}
                        alt={bg.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className={cn(
                      "text-[10px] text-center leading-tight",
                      background === bg.value ? "text-[#1a1a1a] font-medium" : "text-[#a3a3a3]"
                    )}>
                      {bg.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Manken Tipi */}
            <div>
              <label className="label block mb-2">Manken Tipi</label>
              <div className="flex gap-2">
                {[
                  { value: "standard", label: "Standart"    },
                  { value: "plus",     label: "Büyük Beden" },
                ].map((bt) => (
                  <button
                    key={bt.value}
                    onClick={() => setBodyType(bt.value)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-medium border transition-colors",
                      bodyType === bt.value
                        ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                        : "bg-white text-[#737373] border-[#e5e5e5] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
                    )}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kredi bilgisi */}
            {user && (
              <div className="flex items-center justify-between text-sm text-[#737373] py-2 border-t border-[#e5e5e5]">
                <span>Kalan kredi</span>
                <span className="font-medium text-[#c9a96e]">{user.credits_remaining}</span>
              </div>
            )}

            {/* Üret Butonu */}
            <button
              onClick={handleRun}
              disabled={running}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-sm transition-all",
                !running
                  ? "bg-[#1a1a1a] text-white hover:bg-[#333]"
                  : "bg-[#e5e5e5] text-[#a3a3a3] cursor-not-allowed"
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
                  {isBatchMode
                    ? `Toplu Üret (${batchModelIds.length} model · ${batchModelIds.length} kredi)`
                    : "Üret (1 kredi)"}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="fixed bottom-16 left-0 right-0 z-40 md:static md:bottom-auto bg-white border-t border-[#e5e5e5] px-4 py-3 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center justify-center gap-2 flex-1 py-3.5 rounded-xl text-sm font-semibold border-2 border-[#1a1a1a] text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Geri
          </button>
        )}
        {step < 2 && (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 0 ? !canNext0 : !canNext1}
            className={cn(
              "flex items-center justify-center gap-2 flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all",
              (step === 0 ? canNext0 : canNext1)
                ? "bg-[#1a1a1a] text-white hover:bg-[#333] shadow-md"
                : "bg-[#e5e5e5] text-[#a3a3a3] cursor-not-allowed"
            )}
          >
            İleri <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
