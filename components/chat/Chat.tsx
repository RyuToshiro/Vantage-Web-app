"use client";

import { useEffect, useRef, useState } from "react";
import { Aperture, Loader2, ImagePlus, ArrowUp, X, Download, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_PROMPT, stepForProgress, type Tour } from "@/lib/types";

interface Attachment {
  id: string;
  file: File;
  previewUrl: string;
}

type ChatMessage =
  | { id: string; role: "user"; text: string; photoPreviews: string[] }
  | { id: string; role: "assistant"; stage: "thinking" }
  | { id: string; role: "assistant"; stage: "generating"; progress: number; posterUrl: string | null }
  | { id: string; role: "assistant"; stage: "done"; videoUrl: string; posterUrl: string | null; reply: string }
  | { id: string; role: "assistant"; stage: "failed"; error: string };

function uid() {
  return Math.random().toString(36).slice(2);
}

export function Chat({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  function addFiles(fileList: FileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const room = 8 - attachments.length;
    const next = files.slice(0, Math.max(0, room)).map((file) => ({
      id: uid(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setAttachments((prev) => [...prev, ...next]);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const slot = prev.find((a) => a.id === id);
      if (slot) URL.revokeObjectURL(slot.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }

  function updateLastAssistant(update: Partial<ChatMessage> & { id: string }) {
    setMessages((prev) => prev.map((m) => (m.id === update.id ? ({ ...m, ...update } as ChatMessage) : m)));
  }

  async function handleSend() {
    if (busy) return;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      text: trimmed,
      photoPreviews: attachments.map((a) => a.previewUrl),
    };
    setMessages((prev) => [...prev, userMsg]);

    if (attachments.length < 2) {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", stage: "failed", error: "Attach at least 2 photos so I can build the tour." },
      ]);
      setText("");
      return;
    }

    const jobPhotos = attachments;
    setText("");
    setAttachments([]);
    setBusy(true);

    const thinkingId = uid();
    setMessages((prev) => [...prev, { id: thinkingId, role: "assistant", stage: "thinking" }]);

    try {
      await new Promise((r) => setTimeout(r, 700));

      const supabase = createClient();
      const draftId = crypto.randomUUID();
      const photoPaths: string[] = [];
      for (let i = 0; i < jobPhotos.length; i++) {
        const file = jobPhotos[i].file;
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `${userId}/${draftId}/${i}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("photos").upload(path, file, {
          contentType: file.type,
          upsert: true,
        });
        if (uploadError) throw new Error(uploadError.message);
        photoPaths.push(path);
      }

      updateLastAssistant({ id: thinkingId, role: "assistant", stage: "generating", progress: 2, posterUrl: null });

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo_paths: photoPaths,
          prompt: trimmed || DEFAULT_PROMPT,
          aspect_ratio: "9:16",
          segment_length_s: 5,
        }),
      });

      if (res.status === 402) {
        updateLastAssistant({ id: thinkingId, role: "assistant", stage: "failed", error: "You're out of credits — visit Settings to upgrade." });
        setBusy(false);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not start generation.");
      }

      const { id: tourId } = await res.json();

      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/tours/${tourId}`);
          if (!r.ok) return;
          const { tour }: { tour: Tour } = await r.json();

          if (tour.status === "done") {
            if (pollRef.current) clearInterval(pollRef.current);
            updateLastAssistant({
              id: thinkingId,
              role: "assistant",
              stage: "done",
              videoUrl: tour.result_url!,
              posterUrl: tour.poster_url,
              reply: "Here's your tour — download it below, or find it anytime in My Tours.",
            });
            setBusy(false);
          } else if (tour.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            updateLastAssistant({ id: thinkingId, role: "assistant", stage: "failed", error: tour.error ?? "Generation failed." });
            setBusy(false);
          } else {
            updateLastAssistant({ id: thinkingId, role: "assistant", stage: "generating", progress: tour.progress, posterUrl: tour.poster_url });
          }
        } catch {
          // transient — next tick retries
        }
      }, 2000);
    } catch (err) {
      updateLastAssistant({
        id: thinkingId,
        role: "assistant",
        stage: "failed",
        error: err instanceof Error ? err.message : "Something went wrong.",
      });
      setBusy(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <Aperture className="h-8 w-8 text-accent" strokeWidth={1.5} />
            <h1 className="mt-4 text-xl font-semibold text-ink">Describe the tour you want</h1>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Attach a few listing photos and tell me the camera move — I&apos;ll render a cinematic walkthrough.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-hairline bg-canvas px-6 py-4">
        <div className="mx-auto max-w-2xl">
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((a) => (
                <div key={a.id} className="group relative h-14 w-14 overflow-hidden rounded-lg border border-hairline">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeAttachment(a.id)}
                    className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-ink text-white group-hover:flex"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-hairline bg-white p-2 shadow-soft">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-40"
              title="Attach photos"
            >
              <ImagePlus className="h-4.5 w-4.5" strokeWidth={1.75} />
            </button>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={busy}
              placeholder="Slow dolly forward through the living room…"
              rows={1}
              className="max-h-32 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-ink outline-none placeholder:text-muted/70 disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={busy || (!text.trim() && attachments.length === 0)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-accent-dark disabled:opacity-30"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-3 text-white">
          {message.photoPreviews.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {message.photoPreviews.map((src, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={i} src={src} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ))}
            </div>
          )}
          {message.text && <p className="text-sm leading-relaxed">{message.text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        {message.stage === "thinking" && (
          <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-surface px-4 py-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}

        {message.stage === "generating" && (
          <div className="w-56 overflow-hidden rounded-2xl rounded-bl-md border border-hairline bg-ink">
            <div className="relative aspect-[9/16]">
              {message.posterUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={message.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
              <div className="shimmer-bg motion-safe:animate-shimmer absolute inset-0 opacity-20" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-white/90">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {message.progress}%
                </div>
                <div className="h-1 w-full overflow-hidden rounded-pill bg-white/20">
                  <div className="h-full rounded-pill bg-accent transition-[width] duration-500" style={{ width: `${Math.max(4, message.progress)}%` }} />
                </div>
                <p className="mt-1.5 text-[10px] text-white/60">{stepForProgress(message.progress)}</p>
              </div>
            </div>
          </div>
        )}

        {message.stage === "done" && (
          <div>
            <div className="w-56 overflow-hidden rounded-2xl rounded-bl-md border border-hairline bg-ink">
              <video
                className="aspect-[9/16] w-full object-cover"
                src={message.videoUrl}
                poster={message.posterUrl ?? undefined}
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
            <p className="mt-2 text-sm text-ink">{message.reply}</p>
            <div className="mt-2 flex gap-2">
              <a
                href={message.videoUrl}
                download
                className="flex items-center gap-1.5 rounded-pill border border-hairline px-3 py-1.5 text-xs font-medium text-ink hover:border-ink"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                Download
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(message.videoUrl)}
                className="flex items-center gap-1.5 rounded-pill border border-hairline px-3 py-1.5 text-xs font-medium text-ink hover:border-ink"
              >
                <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Share
              </button>
            </div>
          </div>
        )}

        {message.stage === "failed" && (
          <div className="rounded-2xl rounded-bl-md bg-red-50 px-4 py-3 text-sm text-red-700">{message.error}</div>
        )}
      </div>
    </div>
  );
}
