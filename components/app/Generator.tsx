"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader, type PhotoSlot } from "./PhotoUploader";
import { GeneratorOptions } from "./GeneratorOptions";
import { ResultPanel, type ResultState } from "./ResultPanel";
import { MyToursStrip } from "./MyToursStrip";
import { DEFAULT_PROMPT, STYLE_PRESETS, type StylePreset, type Tour } from "@/lib/types";
import { PillButton } from "@/components/ui/Pill";

export function Generator({ userId }: { userId: string }) {
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [segmentLength, setSegmentLength] = useState<5 | 8>(5);
  const [style, setStyle] = useState<StylePreset>(STYLE_PRESETS[0]);

  const [submitting, setSubmitting] = useState(false);
  const [resultState, setResultState] = useState<ResultState>("empty");
  const [progress, setProgress] = useState(0);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function pollTour(tourId: string) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/tours/${tourId}`);
        if (!res.ok) return;
        const { tour }: { tour: Tour } = await res.json();

        setProgress(tour.progress);
        if (tour.poster_url) setPosterUrl(tour.poster_url);

        if (tour.status === "done") {
          stopPolling();
          setVideoUrl(tour.result_url);
          setPosterUrl(tour.poster_url);
          setResultState("done");
          setSubmitting(false);
          setRefreshKey((k) => k + 1);
        } else if (tour.status === "failed") {
          stopPolling();
          setError(tour.error ?? "Generation failed.");
          setResultState("failed");
          setSubmitting(false);
          setRefreshKey((k) => k + 1);
        }
      } catch {
        // transient network hiccup — next tick will retry
      }
    }, 2000);
  }

  async function handleGenerate() {
    if (photos.length < 2 || submitting) return;

    setSubmitting(true);
    setResultState("processing");
    setProgress(1);
    setPosterUrl(null);
    setVideoUrl(null);
    setError(null);

    try {
      const supabase = createClient();
      const draftId = crypto.randomUUID();

      const photoPaths: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i].file;
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `${userId}/${draftId}/${i}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("photos").upload(path, file, {
          contentType: file.type,
          upsert: true,
        });
        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
        photoPaths.push(path);
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo_paths: photoPaths,
          prompt,
          aspect_ratio: "9:16",
          segment_length_s: segmentLength,
          style,
        }),
      });

      if (res.status === 402) {
        setError("You're out of credits — visit Settings to upgrade your plan.");
        setResultState("failed");
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not start generation.");
      }

      const { id } = await res.json();
      setRefreshKey((k) => k + 1);
      pollTour(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setResultState("failed");
      setSubmitting(false);
    }
  }

  const count = photos.length;
  const canGenerate = count >= 2 && !submitting;

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">New Tour</h1>
        <p className="mt-1 text-sm text-muted">Upload photos, tune the camera move, and render a walkthrough.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-5">
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-soft md:col-span-3">
          <PhotoUploader onChange={setPhotos} disabled={submitting} />

          <div className="mt-7">
            <label className="text-sm font-medium text-ink">Camera prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={submitting}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-hairline px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink disabled:opacity-60"
            />
          </div>

          <div className="mt-7">
            <GeneratorOptions
              segmentLength={segmentLength}
              onSegmentLengthChange={setSegmentLength}
              style={style}
              onStyleChange={setStyle}
              disabled={submitting}
            />
          </div>

          <div className="mt-7 flex items-center gap-3">
            <PillButton onClick={handleGenerate} disabled={!canGenerate} className="min-w-[200px]">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Generating…" : count >= 2 ? `Generate tour · ${count} photos` : "Generate tour"}
            </PillButton>
            {count < 2 && <p className="text-xs text-muted">Add at least 2 photos to generate</p>}
          </div>
        </div>

        <div className="md:col-span-2">
          <ResultPanel
            state={resultState}
            progress={progress}
            posterUrl={posterUrl}
            videoUrl={videoUrl}
            error={error}
            onRegenerate={handleGenerate}
          />
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-medium text-ink">My Tours</h2>
        </div>
        <MyToursStrip limit={6} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
