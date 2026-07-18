import "server-only";
import { higgsfield, config as configureHiggsfield } from "@higgsfield/client/v2";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const credentials = process.env.HIGGSFIELD_API_KEY;
  if (!credentials) {
    throw new Error(
      "HIGGSFIELD_API_KEY is not set. Expected format is 'KEY_ID:KEY_SECRET' from https://cloud.higgsfield.ai."
    );
  }
  configureHiggsfield({ credentials });
  configured = true;
}

export interface StartEndFrameInput {
  startImageUrl: string;
  endImageUrl: string;
  prompt: string;
  durationSeconds: 5 | 8;
}

export interface SegmentResult {
  videoUrl: string;
}

/**
 * Model + field names verified against https://docs.higgsfield.ai/how-to/introduction
 * and the Models Gallery listing (kling-video/v2.1/pro/image-to-video is one of
 * Higgsfield's documented Kling image-to-video endpoints, chosen here for its
 * start+end frame support — see higgsfield.ai/blog/Kling-Start-End-Frames).
 * This is the ONE place a different provider/model would be swapped in.
 */
const MODEL_ID = "kling-video/v2.1/pro/image-to-video";

export async function generateSegment(input: StartEndFrameInput): Promise<SegmentResult> {
  ensureConfigured();

  const response = await higgsfield.subscribe(MODEL_ID, {
    input: {
      image_url: input.startImageUrl,
      // TODO: before flipping GENERATION_MODE=live, confirm this field name
      // against the live schema for MODEL_ID in the Models Gallery — some
      // image-to-video models on the platform expose the end frame as
      // `end_image_url`, others as `tail_image_url`. Kling's is documented
      // as `end_image_url` at the time this adapter was written.
      end_image_url: input.endImageUrl,
      prompt: input.prompt,
      duration: input.durationSeconds,
      aspect_ratio: "9:16",
    },
    withPolling: true,
  });

  if (response.status === "nsfw") {
    throw new Error("Segment was rejected by content moderation.");
  }
  if (response.status !== "completed") {
    throw new Error(`Segment generation did not complete (status: ${response.status}).`);
  }
  if (!response.video?.url) {
    throw new Error("Higgsfield returned no video URL for this segment.");
  }
  return { videoUrl: response.video.url };
}
