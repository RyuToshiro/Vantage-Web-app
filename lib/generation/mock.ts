import "server-only";
import { stepForProgress } from "@/lib/types";
import { updateTour, failTour, sleep } from "./store";

const MOCK_DURATION_MS = 9_500;
const TICK_MS = 550;
const PLACEHOLDER_VARIANTS = 3;

/**
 * mock mode: no external calls, no keys beyond Supabase. Walks the job
 * through the same statuses / progress steps the live pipeline would use,
 * over ~10s, then "delivers" one of the bundled placeholder MP4s from
 * /public/placeholders (see scripts/generate-placeholders.mjs).
 */
export async function processTourMock(tourId: string, userId: string) {
  try {
    await updateTour(tourId, { status: "processing", progress: 1, step: "Analyzing photos" });

    let elapsed = 0;
    while (elapsed < MOCK_DURATION_MS) {
      await sleep(TICK_MS);
      elapsed += TICK_MS;
      const progress = Math.min(96, Math.round((elapsed / MOCK_DURATION_MS) * 100));
      await updateTour(tourId, { progress, step: stepForProgress(progress) });
    }

    const variant = 1 + (hashString(tourId) % PLACEHOLDER_VARIANTS);
    await updateTour(tourId, {
      status: "done",
      progress: 100,
      step: "Finalizing",
      result_url: `/placeholders/sample-tour-${variant}.mp4`,
      poster_url: `/placeholders/sample-tour-${variant}.jpg`,
      error: null,
    });
  } catch (err) {
    await failTour(tourId, userId, err instanceof Error ? err.message : "Mock generation failed.");
  }
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}
