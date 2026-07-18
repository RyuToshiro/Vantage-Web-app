const ROOMS = [
  { file: "thumb-1.jpg", label: "Living room" },
  { file: "thumb-2.jpg", label: "Kitchen" },
  { file: "thumb-3.jpg", label: "Primary suite" },
  { file: "thumb-4.jpg", label: "Exterior" },
  { file: "thumb-5.jpg", label: "Dining" },
  { file: "thumb-6.jpg", label: "Backyard" },
  { file: "thumb-7.jpg", label: "Home office" },
  { file: "thumb-8.jpg", label: "Pool" },
];

export function ThumbnailStrip() {
  const track = [...ROOMS, ...ROOMS];

  return (
    <div className="edge-fade-x -mx-2 overflow-hidden">
      <div className="motion-safe:animate-marquee-x flex w-max gap-3 px-2 py-1">
        {track.map((room, i) => (
          <figure
            key={`${room.file}-${i}`}
            className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-hairline shadow-soft"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/placeholders/${room.file}`}
              alt={room.label}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 py-1 text-[10px] font-medium tracking-wide text-white">
              {room.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
