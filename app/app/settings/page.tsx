import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/app/SettingsForm";

const BILLING_TIERS = [
  { name: "Starter", credits: "10 / mo", price: "$49" },
  { name: "Pro", credits: "40 / mo", price: "$149" },
  { name: "Studio", credits: "150 / mo", price: "$399" },
];

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, agency, credits")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Your profile and billing.</p>
      </div>

      <section className="rounded-2xl border border-hairline bg-white p-6 shadow-soft">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Profile</h2>
        <div className="mt-4">
          <SettingsForm
            userId={user.id}
            initialFullName={profile?.full_name ?? ""}
            initialAgency={profile?.agency ?? ""}
          />
        </div>
        <p className="mt-4 text-xs text-muted">Signed in as {user.email}</p>
      </section>

      <section className="mt-8 rounded-2xl border border-hairline bg-white p-6 shadow-soft">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Billing</h2>
          <span className="text-sm font-medium text-ink">{profile?.credits ?? 0} credits remaining</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {BILLING_TIERS.map((tier) => (
            <div key={tier.name} className="rounded-xl border border-hairline p-4">
              <p className="text-sm font-medium text-ink">{tier.name}</p>
              <p className="mt-1 text-lg font-semibold text-ink">{tier.price}<span className="text-xs font-normal text-muted">/mo</span></p>
              <p className="mt-0.5 text-xs text-accent-dark">{tier.credits}</p>
              <button
                disabled
                className="mt-3 w-full cursor-not-allowed rounded-pill border border-hairline py-1.5 text-xs font-medium text-muted"
              >
                Coming soon
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          Checkout isn&apos;t wired up yet — this page is structured so Stripe Billing can be dropped in later.
        </p>
      </section>
    </div>
  );
}
