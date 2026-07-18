import "server-only";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import ffmpegPath from "ffmpeg-static";

function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = (ffmpegPath as string) || "ffmpeg";
    const proc = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-1500)}`));
    });
  });
}

/**
 * Normalizes an arbitrary input (H.264, HEVC, whatever a provider returns)
 * to a uniform H.264 / yuv420p / 1080x1920 / 30fps stream so segments can be
 * concatenated with a stream copy afterward.
 */
export async function normalizeToH264(input: string, output: string): Promise<void> {
  await run([
    "-y",
    "-i",
    input,
    "-vf",
    "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1",
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    output,
  ]);
}

/** Concatenates already-normalized (same codec/resolution/fps) segments in order. */
export async function concatVideos(inputs: string[], output: string, listFilePath: string): Promise<void> {
  const list = inputs.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  await fs.writeFile(listFilePath, list, "utf-8");
  await run([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listFilePath,
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    output,
  ]);
}

/** Extracts the first frame as a poster JPG. */
export async function extractPoster(input: string, output: string): Promise<void> {
  await run(["-y", "-i", input, "-frames:v", "1", "-q:v", "3", output]);
}
