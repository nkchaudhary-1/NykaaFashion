// Aspect-ratio versions of the two placeholder photographs (3:4 · 4:5 · 1:1 · 16:9 · 9:16, plus a 16:9 with copy space).
//   node scripts/placeholders/build.mjs [--jpg <dir>]
// Sources: scripts/placeholders/source/*.png (3:2 studio photographs, 1536×1024).
// Every ratio is a window onto the photograph. Where a ratio needs more canvas than the photograph has (portrait and vertical
// formats, copy-space heroes) the seamless studio backdrop is extended — never the subject: the edge colour is continued with a
// damped copy of its own gradient (so the vignette keeps falling off), blended in over the first rows so there is no seam, and
// given grain that matches the photograph. The result is a placeholder that behaves like a real photo of the same set.
// Writes public/img/placeholders/<name>-<ratio>.webp and merges { w, h, avg, blur, edge? } into src/data/generated/image-meta.json.
// Swap any file for a real photograph of the same name and nothing else changes (see docs/GRID_SYSTEM.md → Imagery).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { PAD, SUBJECTS, extendCanvas, hex, regionHex, rng, root } from "./lib.mjs";

const SRC = join(root, "scripts/placeholders/source");
const OUT = join(root, "public/img/placeholders");
const META = join(root, "src/data/generated/image-meta.json");
const jpgIdx = process.argv.indexOf("--jpg");
const JPG_DIR = jpgIdx > -1 ? resolve(process.argv[jpgIdx + 1]) : null;

// ── Formats: output size, scale (output px per source px) and where the figure sits (bias = share of the height above its centre).
// `x0` overrides the horizontal window start (copy-space heroes push the subject to the right).
const FORMATS = {
  "kurta-set": {
    "3x4": { W: 1200, H: 1600, s: 1.25, bias: 0.55 },
    "4x5": { W: 1200, H: 1500, s: 1.25, bias: 0.54 },
    "1x1": { W: 1200, H: 1200, s: 1.2, bias: 0.5 },
    "16x9": { W: 1920, H: 1080, s: 1.25, bias: 0.5, x0: 0 },
    "16x9-copy-left": { W: 1920, H: 1080, s: 1.0, bias: 0.5, x0: -560 },
    "9x16": { W: 1080, H: 1920, s: 1.2, bias: 0.5 },
  },
  "boucle-suit": {
    "3x4": { W: 1200, H: 1600, s: 1.55, bias: 0.55 },
    "4x5": { W: 1200, H: 1500, s: 1.55, bias: 0.54 },
    "1x1": { W: 1200, H: 1200, s: 1.45, bias: 0.5 },
    "16x9": { W: 1920, H: 1080, s: 1.25, bias: 0.5, x0: 0 },
    "16x9-copy-left": { W: 1920, H: 1080, s: 1.0, bias: 0.5, x0: -428 },
    "9x16": { W: 1080, H: 1920, s: 1.6, bias: 0.52 },
  },
};

const meta = JSON.parse(readFileSync(META, "utf8"));
// ratio versions cut from Unsplash photographs (scripts/unsplash/build.mjs) are not this script's to overwrite
const OWNED = (() => {
  try {
    return new Set(Object.keys(JSON.parse(readFileSync(join(root, "src/data/generated/photo-assignments.json"), "utf8"))));
  } catch {
    return new Set();
  }
})();
mkdirSync(OUT, { recursive: true });
if (JPG_DIR) mkdirSync(JPG_DIR, { recursive: true });
let total = 0;

for (const [name, subj] of Object.entries(SUBJECTS)) {
  const { data, info } = await sharp(join(SRC, subj.file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const rand = rng(name.length * 7919 + 17);
  const ext = extendCanvas(Float32Array.from(data), w, h, 0.5, rand);
  const canvas = sharp(Buffer.from(Uint8ClampedArray.from(ext.data).buffer), { raw: { width: ext.w, height: ext.h, channels: 3 } });
  const canvasPng = await canvas.clone().png({ compressionLevel: 3 }).toBuffer(); // decoded once, windowed many times

  // The untouched photograph at its own 3:2, so every ratio has a reference.
  const jobs = { "3x2": { W: w, H: h, s: 1, original: true } };
  for (const [ratio, f] of Object.entries(FORMATS[name])) jobs[ratio] = f;

  for (const [ratio, f] of Object.entries(jobs)) {
    const key = `placeholders/${name}-${ratio}`;
    if (OWNED.has(key)) continue;
    const ww = Math.round(f.W / f.s), hh = Math.round(f.H / f.s);
    const x0 = f.original ? 0 : f.x0 ?? Math.round(subj.cx - ww / 2);
    const y0 = f.original ? 0 : Math.round(subj.cy - f.bias * hh);
    let img = sharp(canvasPng).extract({ left: x0 + PAD, top: y0 + PAD, width: ww, height: hh });
    if (ww !== f.W || hh !== f.H) img = img.resize(f.W, f.H, { kernel: "lanczos3" });
    if (f.s > 1.05) img = img.sharpen({ sigma: 0.6, m1: 0.5, m2: 0.8 });
    const png = await img.png().toBuffer();
    const webp = await sharp(png).webp({ quality: 90, effort: 5 }).toBuffer();
    writeFileSync(join(OUT, `${name}-${ratio}.webp`), webp);
    if (JPG_DIR) writeFileSync(join(JPG_DIR, `${name}-${ratio}.jpg`), await sharp(png).jpeg({ quality: 92, mozjpeg: true }).toBuffer());

    const st = await sharp(png).stats();
    const m = { w: f.W, h: f.H, avg: hex(st.channels[0].mean, st.channels[1].mean, st.channels[2].mean) };
    if (ratio.startsWith("16x9") || ratio === "3x2") {
      // wall / floor colours at the left and right edges (the hero picks its text colour from the wall)
      const fy = 0.82;
      m.edge = {
        wall: [await regionHex(png, 0, f.H * 0.3, f.W * 0.04, f.H * 0.2), await regionHex(png, f.W * 0.96, f.H * 0.3, f.W * 0.04, f.H * 0.2)],
        floor: [await regionHex(png, 0, f.H * 0.9, f.W * 0.04, f.H * 0.08), await regionHex(png, f.W * 0.96, f.H * 0.9, f.W * 0.04, f.H * 0.08)],
        floorY: fy,
      };
    }
    m.blur = `data:image/webp;base64,${(await sharp(png).resize(16, Math.max(2, Math.round((16 * f.H) / f.W))).webp({ quality: 25 }).toBuffer()).toString("base64")}`;
    meta[key] = m;
    total++;
    console.log(`${key.padEnd(40)} ${String(f.W).padStart(4)}×${String(f.H).padEnd(4)}  window ${ww}×${hh} @ ${x0},${y0}  ${(webp.length / 1024).toFixed(0)} KB`);
  }
}
const sorted = Object.fromEntries(Object.entries(meta).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(META, JSON.stringify(sorted, null, 1) + "\n");
console.log(`\n${total} images → ${OUT.replace(root + "/", "")}  (meta merged)`);
