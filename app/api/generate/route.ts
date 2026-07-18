import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { kickoffGeneration } from "@/lib/generation/kickoff";
import { DEFAULT_PROMPT, STYLE_PRESETS } from "@/lib/types";

const bodySchema = z.object({
  photo_paths: z.array(z.string().min(1)).min(2, "Add at least 2 photos.").max(8, "8 photos max."),
  prompt: z.string().max(2000).optional(),
  aspect_ratio: z.literal("9:16").default("9:16"),
  segment_length_s: z.union([z.literal(5), z.literal(8)]).default(5),
  style: z.enum(STYLE_PRESETS).optional(),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const { photo_paths, prompt, aspect_ratio, segment_length_s, style } = parsed.data;

  // Ownership check — every photo path must live under this user's storage folder.
  const ownsAllPhotos = photo_paths.every((p) => p.startsWith(`${user.id}/`));
  if (!ownsAllPhotos) {
    return NextResponse.json({ error: "Invalid photo reference." }, { status: 403 });
  }

  // Atomically charge one credit; fails closed if the user has none left.
  const { data: hadCredit, error: creditError } = await supabase.rpc("decrement_credit_if_available", {
    p_user_id: user.id,
  });
  if (creditError) {
    return NextResponse.json({ error: "Could not check credits." }, { status: 500 });
  }
  if (!hadCredit) {
    return NextResponse.json({ error: "out_of_credits" }, { status: 402 });
  }

  const { data: tour, error: insertError } = await supabase
    .from("tours")
    .insert({
      user_id: user.id,
      status: "queued",
      photo_urls: photo_paths,
      prompt: prompt?.trim() || DEFAULT_PROMPT,
      aspect_ratio,
      segment_length_s,
      style: style ?? STYLE_PRESETS[0],
      progress: 0,
      step: "Analyzing photos",
    })
    .select("id")
    .single();

  if (insertError || !tour) {
    // Refund the credit we just charged since the tour never got queued.
    await supabase.rpc("increment_credits", { p_user_id: user.id, p_amount: 1 });
    return NextResponse.json({ error: "Could not queue tour." }, { status: 500 });
  }

  kickoffGeneration(tour.id, user.id);

  return NextResponse.json({ id: tour.id }, { status: 201 });
}
