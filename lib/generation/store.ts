import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { TourStatus } from "@/lib/types";

export interface TourUpdate {
  status?: TourStatus;
  progress?: number;
  step?: string | null;
  result_url?: string | null;
  poster_url?: string | null;
  error?: string | null;
}

/** Patches a tour row using the service-role client (bypasses RLS — server/background use only). */
export async function updateTour(tourId: string, patch: TourUpdate) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("tours").update(patch).eq("id", tourId);
  if (error) {
    console.error(`[generation] failed to update tour ${tourId}:`, error.message);
  }
}

/** Marks a tour failed and refunds the credit it consumed. */
export async function failTour(tourId: string, userId: string, message: string) {
  const supabase = createServiceClient();
  await supabase
    .from("tours")
    .update({ status: "failed", error: message, step: null })
    .eq("id", tourId);

  // Refund the credit atomically via RPC (see supabase/migrations/0001_init.sql).
  const { error } = await supabase.rpc("increment_credits", {
    p_user_id: userId,
    p_amount: 1,
  });
  if (error) {
    console.error(`[generation] failed to refund credit for ${userId}:`, error.message);
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
