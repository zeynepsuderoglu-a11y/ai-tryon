"use client";

import { useState, useEffect } from "react";
import { modelsApi } from "@/lib/api";
import { useStudioStore } from "@/lib/store";
import type { ModelAsset } from "@/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const GENDER_OPTIONS = [
  { value: "all",    label: "Tümü"   },
  { value: "female", label: "Kadın"  },
  { value: "male",   label: "Erkek"  },
  { value: "unisex", label: "Unisex" },
] as const;

const BODY_OPTIONS = [
  { value: "all",       label: "Tüm Bedenler" },
  { value: "slim",      label: "İnce"         },
  { value: "average",   label: "Orta"         },
  { value: "plus_size", label: "Büyük Beden"  },
] as const;

const TAG_OPTIONS = [
  { value: "all",    label: "Tüm Mankenler" },
  { value: "pijama", label: "Pijama"        },
] as const;

// Strip absolute localhost origin so images proxy through Next.js (works from any device)
const normalizeUrl = (url: string) =>
  url.replace(/^https?:\/\/(localhost|127\.0\.0\.1):\d+/, "");

export default function ModelSelector() {
  const {
    selectedModelId, setSelectedModelId,
    isBatchMode, batchModelIds, toggleBatchModel
  } = useStudioStore();

  const [models, setModels] = useState<ModelAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [gender, setGender] = useState<string>("all");
  const [bodyType, setBodyType] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 18;

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
    if (gender !== "all") params.gender = gender;
    if (bodyType !== "all") params.body_type = bodyType;
    if (tag !== "all") params.tags = tag;
    modelsApi.list(params as any).then((res) => {
      setModels(res.items);
      setTotal(res.total);
    }).finally(() => setLoading(false));
  }, [gender, bodyType, tag, page]);

  const handleSelect = (id: string) => {
    if (isBatchMode) toggleBatchModel(id);
    else setSelectedModelId(id === selectedModelId ? null : id);
  };

  const isSelected = (id: string) =>
    isBatchMode ? batchModelIds.includes(id) : selectedModelId === id;

  return (
    <div className="space-y-3">
      {/* Kategori filtresi */}
      <div className="flex gap-2 flex-wrap">
        {TAG_OPTIONS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setTag(t.value); setPage(1); }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              tag === t.value
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "bg-white text-[#737373] border-[#e5e5e5] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cinsiyet filtresi */}
      <div className="flex gap-2 flex-wrap">
        {GENDER_OPTIONS.map((g) => (
          <button
            key={g.value}
            onClick={() => { setGender(g.value); setPage(1); }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              gender === g.value
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "bg-white text-[#737373] border-[#e5e5e5] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Beden filtresi */}
      <div className="flex gap-2 flex-wrap">
        {BODY_OPTIONS.map((b) => (
          <button
            key={b.value}
            onClick={() => { setBodyType(b.value); setPage(1); }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              bodyType === b.value
                ? "bg-[#c9a96e] text-white border-[#c9a96e]"
                : "bg-white text-[#737373] border-[#e5e5e5] hover:border-[#c9a96e] hover:text-[#c9a96e]"
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-[#f0f0f0] animate-pulse" />
          ))}
        </div>
      ) : models.length === 0 ? (
        <div className="py-12 text-center text-[#737373] text-sm">Model bulunamadı</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {models.map((model) => {
            const selected = isSelected(model.id);
            return (
              <button
                key={model.id}
                onClick={() => handleSelect(model.id)}
                className={cn(
                  "relative aspect-[2/3] rounded-xl overflow-hidden transition-all",
                  selected
                    ? "ring-2 ring-[#1a1a1a] ring-offset-1 ring-offset-[#fafafa]"
                    : "hover:ring-1 hover:ring-[#a3a3a3]"
                )}
              >
                {model.thumbnail_url || model.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={normalizeUrl(model.thumbnail_url || model.image_url)}
                    alt={model.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#f0f0f0] flex items-center justify-center text-[#a3a3a3] text-xs">
                    {model.name[0]}
                  </div>
                )}
                {selected && (
                  <div className="absolute top-1.5 right-1.5 bg-[#1a1a1a] rounded-full p-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex justify-center items-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-xs border border-[#e5e5e5] rounded-lg hover:border-[#1a1a1a] disabled:opacity-30 transition-colors"
          >
            Önceki
          </button>
          <span className="text-xs text-[#737373]">
            {page} / {Math.ceil(total / PAGE_SIZE)}
          </span>
          <button
            disabled={page >= Math.ceil(total / PAGE_SIZE)}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-xs border border-[#e5e5e5] rounded-lg hover:border-[#1a1a1a] disabled:opacity-30 transition-colors"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
