import { Check } from "lucide-react";
import { PillLink } from "@/components/ui/Pill";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    credits: "10 tours / mo",
    blurb: "For agents shipping a listing or two a month.",
    features: ["10 credits monthly", "9:16 export", "Standard render queue"],
    featured: false,
  },
  {
    name: "Pro",
    price: "$149",
    period: "/mo",
    credits: "40 tours / mo",
    blurb: "For active agents and small teams listing every week.",
    features: ["40 credits monthly", "Priority render queue", "All camera styles", "Credit rollover"],
    featured: true,
  },
  {
    name: "Studio",
    price: "$399",
    period: "/mo",
    credits: "150 tours / mo",
    blurb: "For brokerages and marketing teams at volume.",
    features: ["150 credits monthly", "Fastest render queue", "Multi-seat workspace", "Priority support"],
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-xl">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Simple, credit-based pricing
        </h2>
        <p className="mt-3 text-[15px] text-muted">
          One credit renders one tour. Billing is handled monthly — cancel any time.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "flex flex-col rounded-2xl border bg-white p-7 shadow-soft",
              tier.featured ? "border-accent" : "border-hairline"
            )}
          >
            {tier.featured && (
              <span className="mb-4 inline-flex w-fit items-center rounded-pill bg-accent-soft px-3 py-1 text-xs font-medium text-accent-dark">
                Most popular
              </span>
            )}
            <h3 className="text-base font-medium text-ink">{tier.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight text-ink">{tier.price}</span>
              <span className="text-sm text-muted">{tier.period}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-accent-dark">{tier.credits}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{tier.blurb}</p>

            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-dark" strokeWidth={2} />
                  {f}
                </li>
              ))}
            </ul>

            <PillLink
              href="/login"
              variant={tier.featured ? "primary" : "secondary"}
              className="mt-7 w-full"
            >
              Get started
            </PillLink>
          </div>
        ))}
      </div>
    </section>
  );
}
