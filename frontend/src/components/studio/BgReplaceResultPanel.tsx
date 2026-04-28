"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { backgroundReplaceApi } from "@/lib/api";
import { ChevronLeft, Download } from "lucide-react";
import GenerationWaiting from "./GenerationWaiting";

type GenResult = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  outputUrl?: string;
};

export default function BgReplaceResultPanel({
  generationIds,
  onNew,
}: {
  generationIds: string[];
  onNew: () => void;
}) {
  const resultsRef = useRef<GenResult[]>(
    generationIds.map((id) => ({ id, status: "processing" as const }))
  );
  const [results, setResults] = useState<GenResult[]>(resultsRef.current);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const poll = async () => {
      const updated = await Promise.all(
        resultsRef.current.map(async (r) => {
          if (r.status === "completed" || r.status === "failed") return r;
          try {
            const data = await backgroundReplaceApi.getStatus(r.id);
            return {
              id: r.id,
              status: data.status as GenResult["status"],
              outputUrl: data.output_urls?.[0],
            };
          } catch {
            return r;
          }
        })
      );
      resultsRef.current = updated;
      setResults([...updated]);
      if (updated.every((r) => r.status === "completed" || r.status === "failed")) {
        clearInterval(pollRef.current!);
      }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current!);
  }, []);

  const allDone = results.every((r) => r.status === "completed" || r.status === "failed");
  const completedResults = results.filter((r) => r.status === "completed" && r.outputUrl);

  const downloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `studyoimaai-bg-${index + 1}-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const downloadAll = async () => {
    for (let i = 0; i < completedResults.length; i++) {
      await downloadImage(completedResults[i].outputUrl!, i);
      if (i < completedResults.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">
      {/* Üst Bar */}
      <div className="px-6 pt-5 pb-4 bg-white border-b border-[#e8e8e8] flex items-center justify-between">
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#0f0f0f] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Yeni Üretim
        </button>
        <span className="text-sm font-semibold text-[#0f0f0f]">
          Arka Plan — {results.length} adet
        </span>
        <div className="w-28" />
      </div>

      <div className="flex-1 p-5 max-w-2xl mx-auto w-full pb-20 md:pb-6 space-y-4">
        {/* Tümünü İndir */}
        {allDone && completedResults.length > 1 && (
          <button
            onClick={downloadAll}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0f0f0f] text-white text-sm font-semibold hover:bg-[#2a2a2a] transition-colors"
          >
            <Download className="w-4 h-4" /> Tümünü İndir ({completedResults.length})
          </button>
        )}

        {/* Sonuç Grid */}
        <div className={results.length === 1 ? "grid grid-cols-1 max-w-md mx-auto w-full" : "grid grid-cols-2 gap-4"}>
          {results.map((r, i) => (
            <div key={r.id} className="space-y-2 w-full">
              {r.status === "completed" && r.outputUrl ? (
                <>
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md bg-white">
                    <Image
                      src={r.outputUrl}
                      alt={`Arka plan ${i + 1}`}
                      fill
                      className="object-contain object-center"
                    />
                  </div>
                  <button
                    onClick={() => downloadImage(r.outputUrl!, i)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0f0f0f] text-white text-xs font-semibold hover:bg-[#2a2a2a] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> İndir
                  </button>
                </>
              ) : r.status === "failed" ? (
                <div className="aspect-[3/4] rounded-2xl border border-red-200 bg-red-50 flex flex-col items-center justify-center gap-2 p-4">
                  <p className="text-xs font-semibold text-red-500 text-center">Başarısız</p>
                  <p className="text-[10px] text-red-400 text-center">Kredi iade edildi</p>
                </div>
              ) : (
                <div className="aspect-[3/4] rounded-2xl bg-white border border-[#e8e8e8] flex items-center justify-center">
                  <GenerationWaiting mode="garment" estimatedSeconds={60} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
