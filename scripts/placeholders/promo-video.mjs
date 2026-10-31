// The sample promotional video for the PiP pop-up (src/data/promos.ts → "vrisa-teaser"): a short, seamless, silent loop made ONLY from the supplied photograph —
// a slow push-in on the figure, a dissolve to the hem, a dissolve to the face, a dissolve back to the start. Crops, zooms, pans and dissolves of the photograph;
// nothing is generated, recoloured or added (the same rule as every other picture on the site).
//   node scripts/placeholders/promo-video.mjs            writes public/video/promo/vrisa-teaser.{mp4,webm} and its poster public/img/promo/vrisa-teaser.webp
//   node scripts/placeholders/promo-video.mjs --photo-id <unsplash id>
//        the same clip cut from a photograph of the Unsplash library instead (scripts/unsplash: its original from the cache, its focus point from the manifest): the whole
//        photograph pushing in, the lower part (hem, drape, object), the upper part (face, neckline), around the focus. Records the photo for /credits
//        (src/data/generated/photo-assignments.json → promo/vrisa-teaser; run  npm run unsplash:build -- --only promo/  to refresh photo-credits.json).
// Needs ffmpeg (libx264, libvpx-vp9) on the PATH. Real campaign video simply replaces the files; the app only needs the paths in src/data/promos.ts.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { hex, root } from "./lib.mjs";

const idIdx = process.argv.indexOf("--photo-id");
const PHOTO_ID = idIdx > -1 ? process.argv[idIdx + 1] : null;

const W = 640, H = 480, FPS = 24; // 4:3, shown at up to 288 css px wide (2x = 576)
const HOLD = 2.3, FADE = 0.55; // seconds on each framing, seconds of dissolve between framings
const lib = PHOTO_ID ? await import("../unsplash/lib.mjs") : null;
const manifest = PHOTO_ID ? (await import("../unsplash/manifest.mjs")).loadManifest() : null;
if (PHOTO_ID && !manifest.photos[PHOTO_ID]) throw new Error(`${PHOTO_ID} is not in scripts/unsplash/manifest.json`);
const PHOTO = PHOTO_ID ? lib.originalPath(PHOTO_ID) : join(root, "scripts/placeholders/source/kurta-set.png"); // 1536×1024
const OUT_VIDEO = process.env.PROMO_OUT_VIDEO ?? join(root, "public/video/promo");
const OUT_IMG = process.env.PROMO_OUT_IMG ?? join(root, "public/img/promo");
const META = process.env.UNSPLASH_META ?? join(root, "src/data/generated/image-meta.json");

// Windows onto the photograph (source pixels; width sw, height sw·0.75 — all inside the 1536×1024 frame, so nothing is extended). from → to over the segment.
const SUPPLIED = [
  { from: { cx: 800, cy: 512, sw: 1365 }, to: { cx: 800, cy: 545, sw: 980 } }, // the whole photograph, pushing in on the figure
  { from: { cx: 1000, cy: 740, sw: 700 }, to: { cx: 985, cy: 725, sw: 780 } }, // the hem and drape, easing out
  { from: { cx: 790, cy: 430, sw: 620 }, to: { cx: 795, cy: 445, sw: 700 } }, // the face and neckline, easing out
];
/** The same three framings around a library photograph's focus point (fractions of the photo): zoom 1 = the widest 4:3 window the photograph holds. */
function aroundFocus(pw, ph, [fx, fy]) {
  const base = Math.min(pw, (ph * W) / H);
  const win = (dy, zoom) => ({ cx: fx * pw, cy: (fy + dy) * ph, sw: Math.max(W / 1.5, base / zoom) });
  return [
    { from: win(0, 1), to: win(0.02, 1.38) }, // the whole photograph, pushing in on the subject
    { from: win(0.17, 2.1), to: win(0.15, 1.9) }, // the lower part: hem, drape, the object itself
    { from: win(-0.16, 2.3), to: win(-0.14, 2.0) }, // the upper part: face, neckline
  ];
}
const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t); // easeInOutSine
const lerp = (a, b, t) => a + (b - a) * t;

const src = await sharp(PHOTO).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
const SEGMENTS = PHOTO_ID ? aroundFocus(src.info.width, src.info.height, manifest.photos[PHOTO_ID].focus ?? [0.5, 0.5]) : SUPPLIED;
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

if (PHOTO_ID) {
  // the poster and clip now come from this photograph: record it, so the credits page names the photographer and fill.mjs leaves the poster alone
  const assigned = lib.readJson(lib.ASSIGNMENTS_JSON, {});
  assigned["promo/vrisa-teaser"] = PHOTO_ID;
  lib.writeJson(lib.ASSIGNMENTS_JSON, Object.fromEntries(Object.entries(assigned).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))));
}
rmSync(tmp, { recursive: true, force: true });
const kb = (f) => `${Math.round(statSync(join(OUT_VIDEO, f)).size / 1024)} KB`;
console.log(`vrisa-teaser: ${seconds}s loop, ${W}×${H} @ ${FPS}fps — mp4 ${kb("vrisa-teaser.mp4")}, webm ${kb("vrisa-teaser.webm")}, poster public/img/promo/vrisa-teaser.webp`);
