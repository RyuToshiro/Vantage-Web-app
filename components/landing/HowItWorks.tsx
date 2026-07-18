import { ImageUp, Wand2, Send } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: ImageUp,
    title: "Upload photos",
    body: "Drop in 2–8 photos that cover the listing. No special gear or shot list required.",
  },
  {
    n: "02",
    icon: Wand2,
    title: "AI renders the walkthrough",
    body: "Vantage plots a camera path between your photos and renders a smooth, cinematic pass.",
  },
  {
    n: "03",
    icon: Send,
    title: "Post everywhere",
    body: "Download a vertical, broker-grade video ready for Reels, TikTok, and Stories.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-hairline bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          From photo folder to finished tour
        </h2>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step) => (
            <div key={step.n} className="relative">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium tabular-nums text-accent-dark">{step.n}</span>
                <div className="h-px flex-1 bg-hairline" />
              </div>
              <step.icon className="mt-5 h-6 w-6 text-ink" strokeWidth={1.5} />
              <h3 className="mt-4 text-lg font-medium text-ink">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
