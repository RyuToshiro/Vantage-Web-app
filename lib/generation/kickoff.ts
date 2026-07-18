import "server-only";
import { processTour } from "./index";

/**
 * Starts generation WITHOUT blocking the response. On Vercel this uses
 * waitUntil() so the function isn't frozen the instant the response is
 * sent; on a persistent Node server (next start, or Docker) plain
 * fire-and-forget works because the process stays alive regardless.
 *
 * Caveat for real deployments: the `live` pipeline can run for minutes,
 * which exceeds most serverless function time limits even with
 * waitUntil(). For production `live` traffic, swap this for a durable
 * queue (Supabase Edge Function + pg_cron, Inngest, trigger.dev, or a
 * QStash webhook back into a dedicated worker route) — see README.
 */
export function kickoffGeneration(tourId: string, userId: string) {
  const run = () =>
    processTour(tourId, userId).catch((err) => {
      console.error(`[generation] unhandled error for tour ${tourId}:`, err);
    });

  try {
    // Lazy require so this file still loads fine in environments where
    // @vercel/functions' waitUntil isn't backed by an active request context.
    const { waitUntil } = require("@vercel/functions") as typeof import("@vercel/functions");
    waitUntil(run());
  } catch {
    void run();
  }
}
