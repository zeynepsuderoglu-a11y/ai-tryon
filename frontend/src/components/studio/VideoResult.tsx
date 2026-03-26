"use client";

import { useEffect, useState, useRef } from "react";
import { videoApi } from "@/lib/api";
import { Download, RefreshCw, VideoIcon } from "lucide-react";

interface Props {
  generationId: string;
}

export default function VideoResult({ generationId }: Props) {
  const [status, setStatus] = useState<"processing" | "completed" | "failed">("processing");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    const poll = async () => {
      try {
        const data = await videoApi.getStatus(generationId);
        if (data.status === "completed" && data.output_url) {
          setStatus("completed");
          setOutputUrl(data.output_url);
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        } else if (data.status === "failed") {
          setStatus("failed");
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch {
        // sessizce devam et
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [generationId]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[#f5f5f5] flex items-center justify-center">
            <VideoIcon className="w-8 h-8 text-[#c9a96e]" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-[#c9a96e] border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#0f0f0f] mb-1">Video üretiliyor...</p>
          <p className="text-xs text-[#a3a3a3]">Veo 3.1 Fast ile işleniyor · {formatTime(elapsed)}</p>
          <p className="text-xs text-[#c0c0c0] mt-1">Bu işlem yaklaşık 2-3 dakika sürebilir</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <RefreshCw className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0f0f0f] mb-1">Video üretilemedi</p>
          <p className="text-xs text-[#a3a3a3]">Üretim hakkınız iade edildi. Lütfen tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-black rounded-3xl overflow-hidden aspect-[9/16] max-w-xs mx-auto">
        <video
          src={outputUrl!}
          controls
          autoPlay
          loop
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
      <a
        href={outputUrl!}
        download="studyoimaai-video.mp4"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-[#0f0f0f] text-white text-sm font-semibold hover:bg-[#2a2a2a] transition-colors"
      >
        <Download className="w-4 h-4" /> Videoyu İndir
      </a>
    </div>
  );
}
