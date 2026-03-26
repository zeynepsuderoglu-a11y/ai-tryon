"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { tryonApi } from "@/lib/api";
import type { Generation, BatchJob } from "@/types";
import { Download, Share2, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultDisplayProps {
  generationId?: string;
  batchJobId?: string;
  onComplete?: () => void;
}

export default function ResultDisplay({ generationId, batchJobId, onComplete }: ResultDisplayProps) {
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [batchJob, setBatchJob] = useState<BatchJob | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!generationId && !batchJobId) return;

    const poll = async () => {
      try {
        if (generationId) {
          const gen = await tryonApi.getStatus(generationId);
          setGeneration(gen);
          if (gen.status === "completed" || gen.status === "failed") {
            clearInterval(pollRef.current!);
            setLoading(false);
            onComplete?.();
          }
        } else if (batchJobId) {
          const job = await tryonApi.getBatchStatus(batchJobId);
          setBatchJob(job);
          if (job.status === "completed" || job.status === "failed" || job.status === "partial") {
            clearInterval(pollRef.current!);
            setLoading(false);
            onComplete?.();
          }
        }
      } catch {
        setLoading(false);
      }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current!);
  }, [generationId, batchJobId]);

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  if (!generationId && !batchJobId) return null;

  if (batchJob) {
    return (
      <div className="space-y-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Toplu İşlem</span>
            <span className="text-xs text-gray-400">
              {batchJob.completed}/{batchJob.total} tamamlandı
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
              style={{ width: `${batchJob.progress}%` }}
            />
          </div>
          {batchJob.failed > 0 && (
            <p className="text-xs text-red-400 mt-1">{batchJob.failed} başarısız</p>
          )}
        </div>

        {batchJob.results && batchJob.results.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {batchJob.results.map((result) =>
              result.output_urls?.map((url, i) => (
                <div key={`${result.id}-${i}`} className="relative aspect-[3/4] rounded-xl overflow-hidden group bg-white">
                  <Image src={url} alt="Result" fill className="object-contain object-center" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => downloadImage(url, `studyoimaai-${result.id}-${i + 1}.jpg`)}
                      className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {(loading || batchJob.status === "processing" || batchJob.status === "pending") && (
          <div className="text-center py-6">
            <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-400">Toplu işlem devam ediyor...</p>
          </div>
        )}
      </div>
    );
  }

  if (!generation) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-400">Üretim başlatılıyor...</p>
      </div>
    );
  }

  const statusIcon = {
    pending: <Clock className="w-5 h-5 text-yellow-400" />,
    processing: <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />,
    completed: <CheckCircle className="w-5 h-5 text-green-400" />,
    failed: <XCircle className="w-5 h-5 text-red-400" />,
  }[generation.status];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 glass rounded-lg px-3 py-2">
        {statusIcon}
        <span className="text-sm capitalize text-gray-300">{generation.status}</span>
        {generation.status === "processing" && (
          <span className="text-xs text-gray-500 ml-auto">Her 3sn güncelleniyor...</span>
        )}
      </div>

      {generation.status === "failed" && (
        <div className="glass rounded-xl p-4 border-red-900/30">
          <p className="text-sm text-red-400">{generation.error_message || "Üretim başarısız"}</p>
        </div>
      )}

      {generation.output_urls && generation.output_urls.length > 0 ? (
        <div className="flex flex-col items-center gap-4">
          {generation.output_urls.map((url, i) => (
            <div key={i} className="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl overflow-hidden group shadow-lg bg-white">
              <Image src={url} alt={`Try-on result ${i + 1}`} fill className="object-contain object-center" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors">
                <div className="absolute bottom-4 inset-x-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => downloadImage(url, `studyoimaai-result-${i + 1}.jpg`)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/90 hover:bg-white backdrop-blur-sm text-[#1a1a1a] py-2.5 rounded-xl text-xs font-semibold shadow"
                  >
                    <Download className="w-3.5 h-3.5" /> İndir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        generation.status === "processing" || generation.status === "pending" ? (
          <div className="aspect-[3/4] max-w-sm mx-auto rounded-2xl bg-[#f5f5f5] border border-[#e5e5e5] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#737373]">Görsel üretiliyor...</p>
            <p className="text-xs text-[#a3a3a3]">Bu işlem genellikle 60-90 saniye sürer</p>
          </div>
        ) : null
      )}
    </div>
  );
}
