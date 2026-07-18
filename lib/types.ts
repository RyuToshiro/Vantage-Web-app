export type TourStatus = "queued" | "processing" | "done" | "failed";

export interface Profile {
  id: string;
  full_name: string | null;
  agency: string | null;
  credits: number;
  created_at: string;
}

export interface Tour {
  id: string;
  user_id: string;
  status: TourStatus;
  photo_urls: string[];
  prompt: string | null;
  aspect_ratio: string;
  segment_length_s: number;
  style: string | null;
  result_url: string | null;
  poster_url: string | null;
  error: string | null;
  progress: number;
  step: string | null;
  created_at: string;
}

export const STYLE_PRESETS = [
  "Cinematic dolly",
  "360 orbit",
  "Crane up",
  "Dolly-out reveal",
] as const;

export type StylePreset = (typeof STYLE_PRESETS)[number];

export const DEFAULT_PROMPT =
  "Slow cinematic dolly forward, eye-level, smooth gimbal motion, photorealistic, consistent architecture and lighting, subtle depth of field, no warping.";

export const PROGRESS_STEPS = [
  { at: 0, label: "Analyzing photos" },
  { at: 25, label: "Interpolating motion" },
  { at: 60, label: "Rendering tour" },
  { at: 90, label: "Finalizing" },
] as const;

export function stepForProgress(progress: number): string {
  let label: string = PROGRESS_STEPS[0].label;
  for (const s of PROGRESS_STEPS) {
    if (progress >= s.at) label = s.label;
  }
  return label;
}
