"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, AlertTriangle } from "lucide-react";
import type { Tour } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MyToursStripProps {
  limit?: number;
  refreshKey?: number;
  emptyHint?: string;
}

const STATUS_BADGE: Record<Tour["status"], { label: string; className: string } | null> = {
  queued: { label: "Queued", className: "bg-white/90 text-ink" },
  processing: { label: "Processing", className: "bg-white/90 text-ink" },
  done: null,
  failed: { label: "Failed", className: "bg-red-600 text-white" },
};

export function MyToursStrip({ limit, refreshKey, emptyHint }: MyToursStripProps) {
  const [tours, setTours] = useState<Tour[] | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/tours");
      if (!res.ok) return;
      const data = await res.json();
      setTours(data.tours as Tour[]);
    } catch {
      // silent — strip just stays in its last known state
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    const hasActive = tours?.some((t) => t.status === "queued" || t.status === "processing");
    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(load, 4000);
    }
    if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tours]);

  const visible = limit ? tours?.slice(0, limit) : tours;

  if (tours && tours.length === 0) {
    return <p className="text-sm text-muted">{emptyHint ?? "No tours yet — generate your first one above."}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {!tours &&
        Array.from({ length: limit ?? 6 }).map((_, i) => (
          <div key={i} className="aspect-[9/16] animate-pulse rounded-xl bg-surface" />
        ))}

      {visible?.map((tour) => {
        const badge = STATUS_BADGE[tour.status];
        return (
          <Link
            key={tour.id}
            id={tour.id}
            href={`/app/tours#${tour.id}`}
            className="group relative block aspect-[9/16] overflow-hidden rounded-xl border border-hairline bg-ink scroll-mt-24 target:ring-2 target:ring-accent"
          >
            {tour.poster_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={tour.poster_url}
                alt="Tour poster"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-white/40" />
              </div>
            )}

            {badge && (
              <span
                className={cn(
                  "absolute left-2 top-2 flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-medium",
                  badge.className
                )}
              >
                {tour.status === "failed" && <AlertTriangle className="h-2.5 w-2.5" />}
                {tour.status === "processing" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                {badge.label}
              </span>
            )}

            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] text-white/80">
              {formatDate(tour.created_at)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
