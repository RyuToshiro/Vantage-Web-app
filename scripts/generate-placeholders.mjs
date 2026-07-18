// Generates every bundled placeholder asset the app needs to run with
// zero external calls and zero 404s on first boot. Run with `npm run
// placeholders` (also runs automatically — see README). Safe to re-run;
// it just overwrites the files in /public/placeholders.
import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "placeholders");

mkdirSync(OUT_DIR, { recursive: true });

function ffmpeg(args, label) {
  process.stdout.write(`  ${label} ... `);
  const res = spawnSync(ffmpegPath, ["-y", ...args], { stdio: ["ignore", "ignore", "pipe"] });
  if (res.status !== 0) {
    console.error("FAILED");
    console.error(res.stderr?.toString().slice(-2000));
    process.exit(1);
  }
  console.log("ok");
}

// Warm, neutral palette pairs that read as "premium architectural photography"
// in the abstract rather than as literal stock photos — these are stand-ins
// for the agent's real listing footage, swap the files, not the code.
const PALETTES = [
  { c0: "0x2A2620", c1: "0xB49A6C", type: 1, speed: 0.012, label: "DOLLY FORWARD" },
  { c0: "0x1C1E20", c1: "0x8C6F44", type: 3, speed: 0.02, label: "360 ORBIT" },
  { c0: "0xE7E1D3", c1: "0x6B6255", type: 4, speed: 0.01, label: "CRANE UP" },
  { c0: "0x22201D", c1: "0xC9B48C", type: 2, speed: 0.015, label: "DOLLY-OUT REVEAL" },
  { c0: "0x2E2B26", c1: "0xA8875A", type: 0, speed: 0.018, label: "EYE-LEVEL PAN" },
  { c0: "0x161615", c1: "0xB49A6C", type: 1, speed: 0.009, label: "SLOW REVEAL" },
];

const W = 1080;
const H = 1920;


console.log("Generating hero marquee clips (6x, ~6s, 1080x1920)...");
PALETTES.forEach((p, i) => {
  const n = i + 1;
  const out = path.join(OUT_DIR, `hero-${n}.mp4`);
  const vf = `vignette=PI/4`;
  ffmpeg(
    [
      "-f",
      "lavfi",
      "-i",
      `gradients=size=${W}x${H}:rate=30:c0=${p.c0}:c1=${p.c1}:type=${p.type}:speed=${p.speed}:duration=6`,
      "-vf",
      vf,
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      out,
    ],
    `hero-${n}.mp4`
  );
});

console.log("Generating sample finished-tour clips (3x, ~8s) + posters...");
for (let n = 1; n <= 3; n++) {
  const p = PALETTES[(n - 1) * 2];
  const out = path.join(OUT_DIR, `sample-tour-${n}.mp4`);
  const poster = path.join(OUT_DIR, `sample-tour-${n}.jpg`);
  const vf = `vignette=PI/4`;
  ffmpeg(
    [
      "-f",
      "lavfi",
      "-i",
      `gradients=size=${W}x${H}:rate=30:c0=${p.c0}:c1=${p.c1}:type=${p.type}:speed=${p.speed}:duration=8`,
      "-vf",
      vf,
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      out,
    ],
    `sample-tour-${n}.mp4`
  );
  ffmpeg(["-i", out, "-frames:v", "1", "-q:v", "3", poster], `sample-tour-${n}.jpg (poster)`);
}

console.log("Generating property-photo placeholder thumbnails (8x)...");
const ROOMS = [
  { label: "Living room", c0: "0xE7E1D3", c1: "0xB49A6C" },
  { label: "Kitchen", c0: "0xDED6C4", c1: "0x8C6F44" },
  { label: "Primary suite", c0: "0xE2DACB", c1: "0x6B6255" },
  { label: "Exterior", c0: "0x2A2620", c1: "0xB49A6C" },
  { label: "Dining", c0: "0xE9E3D6", c1: "0xA8875A" },
  { label: "Backyard", c0: "0x22201D", c1: "0xC9B48C" },
  { label: "Home office", c0: "0xEFE8D9", c1: "0x6B6255" },
  { label: "Pool", c0: "0x1C1E20", c1: "0x8C6F44" },
];
ROOMS.forEach((r, i) => {
  const n = i + 1;
  const out = path.join(OUT_DIR, `thumb-${n}.jpg`);
  const vf = `drawbox=x=0:y=0:w=iw:h=ih:color=black@0.15:t=3`;
  ffmpeg(
    [
      "-f",
      "lavfi",
      "-i",
      `gradients=size=960x720:rate=1:c0=${r.c0}:c1=${r.c1}:type=1:duration=1`,
      "-vf",
      vf,
      "-frames:v",
      "1",
      out,
    ],
    `thumb-${n}.jpg`
  );
});

console.log(`\nDone. Wrote assets to ${path.relative(process.cwd(), OUT_DIR)}/`);
