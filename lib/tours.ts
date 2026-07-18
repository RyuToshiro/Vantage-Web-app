import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tour } from "@/lib/types";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days — long enough for the Share button's copied link to stay useful

/**
 * Bundled mock-mode placeholders live under /public and are already
 * public app routes (e.g. "/placeholders/sample-tour-1.mp4"). Anything
 * else is a private-bucket storage path that needs signing before it's
 * safe to send to the browser.
 */
function isPublicAppPath(url: string) {
  return url.startsWith("/");
}

export async function presentTour(tour: Tour, supabase: SupabaseClient): Promise<Tour> {
  const [result_url, poster_url] = await Promise.all([
    signIfNeeded(tour.result_url, supabase),
    signIfNeeded(tour.poster_url, supabase),
  ]);
  return { ...tour, result_url, poster_url };
}

export async function presentTours(tours: Tour[], supabase: SupabaseClient): Promise<Tour[]> {
  return Promise.all(tours.map((t) => presentTour(t, supabase)));
}

async function signIfNeeded(url: string | null, supabase: SupabaseClient): Promise<string | null> {
  if (!url) return url;
  if (isPublicAppPath(url)) return url;
  const { data, error } = await supabase.storage
    .from("tours")
    .createSignedUrl(url, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    console.error("Failed to sign tour media URL:", error?.message);
    return null;
  }
  return data.signedUrl;
}
