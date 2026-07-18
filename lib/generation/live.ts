import "server-only";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_PROMPT, stepForProgress } from "@/lib/types";
import { updateTour, failTour } from "./store";
import { generateSegment } from "./higgsfield";
import { normalizeToH264, concatVideos, extractPoster } from "./ffmpeg";

// Respect Higgsfield's per-account concurrency limits by capping how many
// segment jobs are in flight at once.
const SEGMENT_CONCURRENCY = 2;

export async function processTourLive(tourId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: tour, error: fetchError } = await supabase
    .from("tours")
    .select("*")
    .eq("id", tourId)
    .single();

  if (fetchError || !tour) {
    console.error(`[generation:live] tour ${tourId} not found`, fetchError);
    return;
  }

  const photos: string[] = Array.isArray(tour.photo_urls) ? tour.photo_urls : [];
  if (photos.length < 2) {
    await failTour(tourId, tour.user_id, "A tour needs at least 2 photos.");
    return;
  }

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `vantage-${tourId}-`));

  try {
    await updateTour(tourId, { status: "processing", progress: 2, step: "Analyzing photos" });

    // The `photos` bucket is private, but Higgsfield needs a URL it can GET
    // from the outside — so resolve each photo path to a short-lived signed
    // URL right before use rather than ever making the bucket public.
    const signedPhotoUrls = await Promise.all(
      photos.map(async (objectPath) => {
        const { data, error } = await supabase.storage
          .from("photos")
          .createSignedUrl(objectPath, 60 * 60); // 1 hour, plenty for one job
        if (error || !data) throw new Error(`Could not sign photo URL: ${error?.message}`);
        return data.signedUrl;
      })
    );

    // 1. Segment plan: consecutive pairs → N-1 segments.
    const pairs = signedPhotoUrls.slice(0, -1).map((p, i) => [p, signedPhotoUrls[i + 1]] as const);
    const segmentPaths: string[] = new Array(pairs.length);
    let completedSegments = 0;

    // 2. Submit + poll segments a few at a time, download + normalize each.
    await mapWithConcurrency(pairs, SEGMENT_CONCURRENCY, async ([start, end], i) => {
      const { videoUrl } = await generateSegment({
        startImageUrl: start,
        endImageUrl: end,
        prompt: tour.prompt || DEFAULT_PROMPT,
        durationSeconds: tour.segment_length_s === 8 ? 8 : 5,
      });

      const rawPath = path.join(workDir, `segment-${i}-raw.mp4`);
      await downloadTo(videoUrl, rawPath);

      const normalizedPath = path.join(workDir, `segment-${i}.mp4`);
      await normalizeToH264(rawPath, normalizedPath);
      segmentPaths[i] = normalizedPath;

      completedSegments += 1;
      // Segment generation spans roughly 10%-70% of overall progress.
      const progress = 10 + Math.round((completedSegments / pairs.length) * 60);
      await updateTour(tourId, { progress, step: stepForProgress(progress) });
    });

    // 3. Stitch, normalize, extract poster.
    await updateTour(tourId, { progress: 75, step: "Rendering tour" });
    const finalPath = path.join(workDir, "final.mp4");
    const listPath = path.join(workDir, "segments.txt");
    await concatVideos(segmentPaths, finalPath, listPath);

    const posterPath = path.join(workDir, "poster.jpg");
    await extractPoster(finalPath, posterPath);

    // 4. Upload to Supabase Storage, mark done.
    await updateTour(tourId, { progress: 90, step: "Finalizing" });
    const prefix = `${tour.user_id}/${tourId}`;
    const [videoBuffer, posterBuffer] = await Promise.all([
      fs.readFile(finalPath),
      fs.readFile(posterPath),
    ]);

    const { error: videoErr } = await supabase.storage
      .from("tours")
      .upload(`${prefix}/tour.mp4`, videoBuffer, { contentType: "video/mp4", upsert: true });
    if (videoErr) throw new Error(`Video upload failed: ${videoErr.message}`);

    const { error: posterErr } = await supabase.storage
      .from("tours")
      .upload(`${prefix}/poster.jpg`, posterBuffer, { contentType: "image/jpeg", upsert: true });
    if (posterErr) throw new Error(`Poster upload failed: ${posterErr.message}`);

    // Store STORAGE PATHS, not public URLs — the `tours` bucket is private.
    // The /api/tours routes turn these into short-lived signed URLs on read,
    // which is what actually gets sent to the browser.
    await updateTour(tourId, {
      status: "done",
      progress: 100,
      step: "Finalizing",
      result_url: `${prefix}/tour.mp4`,
      poster_url: `${prefix}/poster.jpg`,
      error: null,
    });
  } catch (err) {
    console.error(`[generation:live] pipeline failed for ${tourId}:`, err);
    await failTour(tourId, tour.user_id, err instanceof Error ? err.message : "Generation failed.");
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function downloadTo(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download generated segment (${res.status}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
