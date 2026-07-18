"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PillButton } from "@/components/ui/Pill";

interface SettingsFormProps {
  userId: string;
  initialFullName: string;
  initialAgency: string;
}

export function SettingsForm({ userId, initialFullName, initialAgency }: SettingsFormProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [agency, setAgency] = useState(initialAgency);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, agency })
      .eq("id", userId);
    setSaving(false);
    if (!error) {
      setSaved(true);
      router.refresh(); // re-fetch server-rendered profile data (e.g. the sidebar name)
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-ink">Full name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-hairline px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
          placeholder="Jane Rivera"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-ink">Agency</label>
        <input
          value={agency}
          onChange={(e) => setAgency(e.target.value)}
          className="mt-2 w-full rounded-xl border border-hairline px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
          placeholder="Rivera Realty Group"
        />
      </div>
      <PillButton type="submit" disabled={saving} size="sm">
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {!saving && saved && <Check className="h-3.5 w-3.5" />}
        {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
      </PillButton>
    </form>
  );
}
