"use client";

import { useState } from "react";
import { Video, Download, Share2, RotateCcw, AlertTriangle } from "lucide-react";
import { stepForProgress } from "@/lib/types";

export type ResultState = "empty" | "processing" | "done" | "failed";

interface ResultPanelProps {
  state: ResultState;
  progress: number;
  posterUrl: string | null;
  videoUrl: string | null;
  error: string | null;
  onRegenerate: () => void;
}

export function ResultPanel({ state, progress, posterUrl, videoUrl, error, onRegenerate }: ResultPanelProps) {
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2400);
  }

  async function handleDownload() {
    if (!videoUrl) return;
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vantage-tour.mp4";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Couldn't download — try opening the video directly.");
    }
  }

  async function handleShare() {
    if (!videoUrl) return;
    try {
      await navigator.clipboard.writeText(videoUrl);
      showToast("Saved to your library");
    } catch {
      showToast("Couldn't copy the link.");
    }
  }

  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-2xl border border-hairline bg-ink shadow-card">
      {/* EMPTY */}
      {state === "empty" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
          <Video className="h-8 w-8 text-white/30" strokeWidth={1.5} />
          <p className="text-sm text-white/50">Your tour will appear here</p>
        </div>
      )}

      {/* PROCESSING */}
      {state === "processing" && (
        <div className="absolute inset-0">
          {posterUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          <div className="shimmer-bg motion-safe:animate-shimmer absolute inset-0 opacity-20" />

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5">
            <p className="text-sm font-medium text-white">{stepForProgress(progress)}</p>
            <div className="h-1.5 w-full overflow-hidden rounded-pill bg-white/20">
              <div
                className="h-full rounded-pill bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${Math.max(4, progress)}%` }}
              />
            </div>
            <p className="text-xs text-white/60">{progress}%</p>
          </div>
        </div>
      )}

      {/* DONE */}
      {state === "done" && videoUrl && (
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover"
            src={videoUrl}
            poster={posterUrl ?? undefined}
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-pill bg-white/95 px-3 py-1.5 text-xs font-medium text-ink hover:bg-white"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              Download
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/25"
            >
              <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Share
            </button>
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/25"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
              Regenerate
            </button>
          </div>

          {toast && (
            <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-pill bg-black/80 px-3 py-1.5 text-xs text-white">
              {toast}
            </div>
          )}
        </div>
      )}

      {/* FAILED */}
      {state === "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
          <AlertTriangle className="h-7 w-7 text-white/60" strokeWidth={1.5} />
          <p className="text-sm text-white/80">Generation failed</p>
          {error && <p className="text-xs text-white/50">{error}</p>}
          <button
            onClick={onRegenerate}
            className="mt-2 flex items-center gap-1.5 rounded-pill bg-white/95 px-3 py-1.5 text-xs font-medium text-ink hover:bg-white"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
