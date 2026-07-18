const COLUMN_A = ["hero-1.mp4", "hero-2.mp4", "hero-3.mp4"];
const COLUMN_B = ["hero-4.mp4", "hero-5.mp4", "hero-6.mp4"];

function Column({ clips, reverse }: { clips: string[]; reverse?: boolean }) {
  const track = [...clips, ...clips]; // duplicated for a seamless -50% loop

  return (
    <div className="edge-fade-y h-full overflow-hidden">
      <div
        className={`flex w-40 flex-col gap-4 ${
          reverse ? "motion-safe:animate-marquee-reverse" : "motion-safe:animate-marquee"
        }`}
      >
        {track.map((clip, i) => (
          <div
            key={`${clip}-${i}`}
            className="aspect-[9/16] w-40 shrink-0 overflow-hidden rounded-2xl border border-hairline bg-ink shadow-card"
          >
            <video
              className="h-full w-full object-cover"
              src={`/placeholders/${clip}`}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function VideoMarquee() {
  return (
    <div className="flex h-[560px] justify-center gap-5 [transform:rotate(12deg)] md:h-[620px]">
      <Column clips={COLUMN_A} />
      <Column clips={COLUMN_B} reverse />
    </div>
  );
}
