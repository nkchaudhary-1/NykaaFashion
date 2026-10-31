// Shared by build.mjs (the ratio variants) and fill.mjs (every other image on the site): the two supplied photographs, where their figures
// sit, and the seamless studio-backdrop extension that lets a window reach past the edge of a photograph without a seam.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const PAD = 820; // the most canvas ever added to a side of the photograph

// ── Subjects: where the figure sits in the source (source pixels) ──────────────────────────────────────────────
// cx = horizontal centre of the subject group, cy = vertical centre of the figure.
export const SUBJECTS = {
  "kurta-set": { file: "kurta-set.png", cx: 800, cy: 575, label: "Seated in a printed kurta set" },
  "boucle-suit": { file: "boucle-suit.png", cx: 762, cy: 575, label: "Cream co-ord on a bouclé chair" },
};

// ── Backdrop extension ─────────────────────────────────────────────────────────────────────────────────────────
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const gauss = (r) => {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
};

/** Gaussian blur of an interleaved 3-channel line of length n (reflect at the ends). */
export function blur1d(a, n, sigma) {
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
export function extendTop(src, w, h, n, grain, rand) {
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

export const flipRows = (a, w, h) => {
  const o = new Float32Array(a.length);
  for (let y = 0; y < h; y++) o.set(a.subarray(y * w * 3, (y + 1) * w * 3), (h - 1 - y) * w * 3);
  return o;
};
export const transpose = (a, w, h) => {
  const o = new Float32Array(a.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) o[(x * h + y) * 3 + c] = a[(y * w + x) * 3 + c];
  return o;
};

/** Pad the photograph by PAD on every side. Left/right first (on the original rows), then top/bottom (on the widened rows). */
export function extendCanvas(src, w, h, grain, rand) {
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
export const hex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
export async function regionHex(buf, x, y, w, h) {
  const s = await sharp(buf).extract({ left: Math.round(x), top: Math.round(y), width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) }).stats();
  return hex(s.channels[0].mean, s.channels[1].mean, s.channels[2].mean);
}

