// The sample promotional video for the PiP pop-up (src/data/promos.ts → "vrisa-teaser"): a short, seamless, silent loop made ONLY from the supplied photograph —
// a slow push-in on the figure, a dissolve to the hem, a dissolve to the face, a dissolve back to the start. Crops, zooms, pans and dissolves of the photograph;
// nothing is generated, recoloured or added (the same rule as every other picture on the site).
//   node scripts/placeholders/promo-video.mjs            writes public/video/promo/vrisa-teaser.{mp4,webm} and its poster public/img/promo/vrisa-teaser.webp
// Needs ffmpeg (libx264, libvpx-vp9) on the PATH. Real campaign video simply replaces the files; the app only needs the paths in src/data/promos.ts.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { hex, root } from "./lib.mjs";

const W = 640, H = 480, FPS = 24; // 4:3, shown at up to 288 css px wide (2x = 576)
const HOLD = 2.3, FADE = 0.55; // seconds on each framing, seconds of dissolve between framings
const PHOTO = join(root, "scripts/placeholders/source/kurta-set.png"); // 1536×1024
const OUT_VIDEO = join(root, "public/video/promo");
const OUT_IMG = join(root, "public/img/promo");
const META = join(root, "src/data/generated/image-meta.json");

// Windows onto the photograph (source pixels; width sw, height sw·0.75 — all inside the 1536×1024 frame, so nothing is extended). from → to over the segment.
const SEGMENTS = [
  { from: { cx: 800, cy: 512, sw: 1365 }, to: { cx: 800, cy: 545, sw: 980 } }, // the whole photograph, pushing in on the figure
  { from: { cx: 1000, cy: 740, sw: 700 }, to: { cx: 985, cy: 725, sw: 780 } }, // the hem and drape, easing out
  { from: { cx: 790, cy: 430, sw: 620 }, to: { cx: 795, cy: 445, sw: 700 } }, // the face and neckline, easing out
];
const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t); // easeInOutSine
const lerp = (a, b, t) => a + (b - a) * t;

const src = await sharp(PHOTO).removeAlpha().raw().toBuffer({ resolveWithObject: true });
async function frame(win) {
  const width = Math.round(win.sw);
  const height = Math.round(win.sw * (H / W));
  const left = Math.max(0, Math.min(src.info.width - width, Math.round(win.cx - width / 2)));
  const top = Math.max(0, Math.min(src.info.height - height, Math.round(win.cy - height / 2)));
  return sharp(src.data, { raw: { width: src.info.width, height: src.info.height, channels: 3 } })
    .extract({ left, top, width, height })
    .resize(W, H, { kernel: "lanczos3" })
    .raw()
    .toBuffer();
}
const at = (seg, t) => ({ cx: lerp(seg.from.cx, seg.to.cx, ease(t)), cy: lerp(seg.from.cy, seg.to.cy, ease(t)), sw: lerp(seg.from.sw, seg.to.sw, ease(t)) });

const tmp = mkdtempSync(join(tmpdir(), "nf-promo-"));
let n = 0;
const save = async (buf) => sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 1 }).toFile(join(tmp, `f${String(n++).padStart(4, "0")}.png`));
const holdFrames = Math.round(HOLD * FPS);
const fadeFrames = Math.round(FADE * FPS);
let poster;

for (let s = 0; s < SEGMENTS.length; s++) {
  const seg = SEGMENTS[s];
  const next = SEGMENTS[(s + 1) % SEGMENTS.length];
  for (let i = 0; i < holdFrames; i++) {
    const buf = await frame(at(seg, i / (holdFrames - 1)));
    if (!poster) poster = buf;
    await save(buf);
  }
  // dissolve into the start of the next framing (the last segment dissolves back into the first, so the loop has no seam)
  for (let i = 1; i <= fadeFrames; i++) {
    const t = ease(i / (fadeFrames + 1));
    const a = await frame(at(seg, 1));
    const b = await frame(at(next, 0));
    const out = Buffer.allocUnsafe(a.length);
    for (let k = 0; k < a.length; k++) out[k] = a[k] + (b[k] - a[k]) * t;
    await save(out);
  }
}
const seconds = (n / FPS).toFixed(1);

mkdirSync(OUT_VIDEO, { recursive: true });
mkdirSync(OUT_IMG, { recursive: true });
const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", join(tmp, "f%04d.png"), ...args], { stdio: "inherit" });
ff(["-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-profile:v", "main", "-movflags", "+faststart", "-an", join(OUT_VIDEO, "vrisa-teaser.mp4")]);
ff(["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "37", "-pix_fmt", "yuv420p", "-row-mt", "1", "-an", join(OUT_VIDEO, "vrisa-teaser.webm")]);

// the poster is the first frame, so the picture never jumps when the video starts
const posterPng = await sharp(poster, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
writeFileSync(join(OUT_IMG, "vrisa-teaser.webp"), await sharp(posterPng).webp({ quality: 84, effort: 5 }).toBuffer());
const st = await sharp(posterPng).stats();
const meta = JSON.parse(readFileSync(META, "utf8"));
meta["promo/vrisa-teaser"] = { w: W, h: H, avg: hex(st.channels[0].mean, st.channels[1].mean, st.channels[2].mean) };
writeFileSync(META, JSON.stringify(Object.fromEntries(Object.entries(meta).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))), null, 1) + "\n");

rmSync(tmp, { recursive: true, force: true });
const kb = (f) => `${Math.round(statSync(join(OUT_VIDEO, f)).size / 1024)} KB`;
console.log(`vrisa-teaser: ${seconds}s loop, ${W}×${H} @ ${FPS}fps — mp4 ${kb("vrisa-teaser.mp4")}, webm ${kb("vrisa-teaser.webm")}, poster public/img/promo/vrisa-teaser.webp`);
