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
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = join(root, "scripts/placeholders/source");
const OUT = join(root, "public/img/placeholders");
const META = join(root, "src/data/generated/image-meta.json");
const jpgIdx = process.argv.indexOf("--jpg");
const JPG_DIR = jpgIdx > -1 ? resolve(process.argv[jpgIdx + 1]) : null;
const PAD = 820; // the most canvas ever added to a side of the photograph

// ── Subjects: where the figure sits in the source (source pixels) ──────────────────────────────────────────────
// cx = horizontal centre of the subject group, cy = vertical centre of the figure.
const SUBJECTS = {
  "kurta-set": { file: "kurta-set.png", cx: 800, cy: 575, label: "Seated in a printed kurta set" },
  "boucle-suit": { file: "boucle-suit.png", cx: 762, cy: 575, label: "Cream co-ord on a bouclé chair" },
};

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

// ── Backdrop extension ─────────────────────────────────────────────────────────────────────────────────────────
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r) => {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
};

/** Gaussian blur of an interleaved 3-channel line of length n (reflect at the ends). */
function blur1d(a, n, sigma) {
  const r = Math.ceil(sigma * 3);
  const k = new Float32Array(2 * r + 1);
  let sum = 0;
  for (let i = -r; i <= r; i++) sum += k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma));
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const o = new Float32Array(a.length);
  for (let i = 0; i < n; i++)
    for (let c = 0; c < 3; c++) {
      let acc = 0;
      for (let j = -r; j <= r; j++) {
        let t = i + j;
        if (t < 0) t = -t;
        if (t >= n) t = 2 * (n - 1) - t;
        acc += a[Math.max(0, t) * 3 + c] * k[j + r];
      }
      o[i * 3 + c] = acc;
    }
  return o;
}

/** Extend an interleaved RGB float image upward by n rows (see the header comment). */
function extendTop(src, w, h, n, grain, rand) {
  const R = 4, L = 70, TAU = 140, BLEND = 30, MAX_SHIFT = 20;
  const edge = new Float32Array(w * 3);
  const mid = new Float32Array(w * 3);
  for (let x = 0; x < w; x++)
    for (let c = 0; c < 3; c++) {
      let e = 0, m = 0;
      for (let j = 0; j < R; j++) {
        e += src[(j * w + x) * 3 + c];
        m += src[((L + j) * w + x) * 3 + c];
      }
      edge[x * 3 + c] = e / R;
      mid[x * 3 + c] = m / R;
    }
  const sig = Math.max(24, w / 45);
  const edgeS = blur1d(edge, w, sig);
  const midS = blur1d(mid, w, sig);
  let trend = new Float32Array(w * 3);
  for (let i = 0; i < trend.length; i++) trend[i] = (edgeS[i] - midS[i]) / L; // colour change per pixel going outward
  trend = blur1d(trend, w, sig * 2);
  const lim = MAX_SHIFT / TAU;
  for (let i = 0; i < trend.length; i++) trend[i] = Math.max(-lim, Math.min(lim, trend[i]));

  const out = new Float32Array(w * (h + n) * 3);
  for (let k = 1; k <= n; k++) {
    const y = n - k;
    const s = TAU * (1 - Math.exp(-k / TAU)); // the trend saturates: the vignette settles instead of running away
    const t = Math.min(1, k / BLEND);
    const mix = t * t * (3 - 2 * t); // 0 at the seam (the photograph's own edge pixels) → 1 (pure model)
    for (let x = 0; x < w; x++) {
      const gl = gauss(rand);
      for (let c = 0; c < 3; c++) {
        const model = edgeS[x * 3 + c] + trend[x * 3 + c] * s;
        const g = grain * (0.8 * gl + 0.6 * gauss(rand));
        out[(y * w + x) * 3 + c] = edge[x * 3 + c] * (1 - mix) + model * mix + g;
      }
    }
  }
  out.set(src, n * w * 3);
  return out;
}

const flipRows = (a, w, h) => {
  const o = new Float32Array(a.length);
  for (let y = 0; y < h; y++) o.set(a.subarray(y * w * 3, (y + 1) * w * 3), (h - 1 - y) * w * 3);
  return o;
};
const transpose = (a, w, h) => {
  const o = new Float32Array(a.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) o[(x * h + y) * 3 + c] = a[(y * w + x) * 3 + c];
  return o;
};

/** Pad the photograph by PAD on every side. Left/right first (on the original rows), then top/bottom (on the widened rows). */
function extendCanvas(src, w, h, grain, rand) {
  let a = transpose(src, w, h); // now h wide × w tall: "top" is the photograph's left
  a = extendTop(a, h, w, PAD, grain, rand); // left
  a = flipRows(a, h, w + PAD);
  a = extendTop(a, h, w + PAD, PAD, grain, rand); // right
  a = flipRows(a, h, w + 2 * PAD);
  a = transpose(a, h, w + 2 * PAD); // back to (w + 2PAD) × h
  const W = w + 2 * PAD;
  a = extendTop(a, W, h, PAD, grain, rand); // top
  a = flipRows(a, W, h + PAD);
  a = extendTop(a, W, h + PAD, PAD, grain, rand); // bottom
  a = flipRows(a, W, h + 2 * PAD);
  return { data: a, w: W, h: h + 2 * PAD };
}

// ── Output ─────────────────────────────────────────────────────────────────────────────────────────────────────
const hex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
async function regionHex(buf, x, y, w, h) {
  const s = await sharp(buf).extract({ left: Math.round(x), top: Math.round(y), width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) }).stats();
  return hex(s.channels[0].mean, s.channels[1].mean, s.channels[2].mean);
}

const meta = JSON.parse(readFileSync(META, "utf8"));
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
