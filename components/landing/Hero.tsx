import { Star, Sparkles } from "lucide-react";
import { PillLink } from "@/components/ui/Pill";
import { ThumbnailStrip } from "./ThumbnailStrip";
import { VideoMarquee } from "./VideoMarquee";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-14 md:grid-cols-2 md:items-center md:pt-20">
      <div className="max-w-xl">
        <div className="inline-flex items-center gap-2 rounded-pill bg-accent-soft px-3 py-1 text-xs font-medium tracking-wide text-accent-dark">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
          AI PROPERTY VIDEO
        </div>

        <h1 className="mt-5 text-[2.75rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
          Turn your photos into a cinematic <span className="text-accent-dark">tour</span>.
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-muted">
          Upload a few photos of the listing. Get a broker-grade walkthrough video in
          minutes — no crew, no drone, no editing.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-6">
          <PillLink href="/app">Open app</PillLink>

          <div className="flex items-center gap-2">
            <div className="flex text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" strokeWidth={0} />
              ))}
            </div>
            <span className="text-sm text-muted">Loved by listing agents</span>
          </div>
        </div>

        <div className="mt-12">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
            Works from whatever you&apos;ve already shot
          </p>
          <ThumbnailStrip />
        </div>
      </div>

      <div className="hidden justify-center md:flex">
        <VideoMarquee />
      </div>
    </section>
  );
}
