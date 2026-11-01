// Pure helpers for the build: where a window sits on a photograph, where a point lands in it, colour distance, contrast. No I/O, so scripts/qa/unsplash-build-unit.mjs tests them directly.

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** A deterministic number in [0, 1) from a string (FNV-1a), the same one fill.mjs uses — so "random" variation never changes between builds. */
export const H01 = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
};
/** ± amp, deterministic per (key, salt). */
export const jitter = (key, salt, amp) => (H01(key + salt) * 2 - 1) * amp;

/**
 * A window of aspect `ratio` (width / height) onto a `pw × ph` photograph.
 *   (fx, fy)   the point of the photograph (fractions) the window is built around
 *   (atX, atY) where in the window that point should land (0.5, 0.5 = the middle; a banner with copy on the left puts its subject at atX ≈ 0.68)
 *   zoom       1 = the largest window of that ratio the photograph holds; 2 = half as wide
 *   minWidth   never narrower than this many source pixels (so the picture is not enlarged too far): zoom is relaxed until it holds
 * The window never leaves the photograph (it slides back inside), so the subject may end up off the requested spot — `where()` says where it really is.
 */
export function cropAround(pw, ph, ratio, { fx = 0.5, fy = 0.5, atX = 0.5, atY = 0.5, zoom = 1, minWidth = 0 } = {}) {
  const baseW = Math.min(pw, ph * ratio);
  let z = Math.max(1, zoom);
  if (minWidth) z = Math.min(z, Math.max(1, baseW / minWidth));
  const width = baseW / z;
  const height = width / ratio;
  const left = clamp(fx * pw - atX * width, 0, pw - width);
  const top = clamp(fy * ph - atY * height, 0, ph - height);
  return { left, top, width, height, zoom: z };
}

/** Where a point of the photograph (fractions) lands in a window (fractions of the window); `flip` mirrors the picture left to right. */
export function where(box, pw, ph, [ax, ay], flip = false) {
  const x = (ax * pw - box.left) / box.width;
  return { x: flip ? 1 - x : x, y: (ay * ph - box.top) / box.height };
}

/**
 * Pins for a window: the anchors that are comfortably inside it and apart from one another, best first. An anchor is [x, y] or [x, y, productId] — a pin on a labelled anchor
 * points at that product (what is really under it); an unlabelled one takes the next product the picture was meant to point at. Windows with no labelled anchor in them are
 * filled from a fixed spread, marked `source: "fallback"` so the build can say so.
 */
export function pinsFor(box, pw, ph, anchors, count, flip = false) {
  const out = [];
  const inside = ({ x, y }) => x > 0.12 && x < 0.88 && y > 0.12 && y < 0.88;
  const apart = (p, list, d) => !list.some((q) => Math.hypot((q.x - p.x) * 1.6, q.y - p.y) < d);
  for (const a of anchors ?? []) {
    if (out.length === count) break;
    const p = where(box, pw, ph, a, flip);
    if (inside(p) && apart(p, out, 0.16)) out.push({ ...p, source: "anchor", id: a[2] });
  }
  if (!out.some((p) => p.id)) {
    for (const [x, y] of [[0.5, 0.42], [0.42, 0.66], [0.6, 0.7], [0.5, 0.55]]) {
      if (out.length === count) break;
      if (apart({ x, y }, out, 0.12)) out.push({ x, y, source: "fallback" });
    }
  }
  return out.slice(0, count);
}

/**
 * Where the subject of a studio photograph sits: the box (fractions [x0, y0, x1, y1]) that holds nearly all of what is not backdrop. `rgb` is a raw RGB decode, `w × h`, of the
 * whole photograph (a small one is enough: 116 × 144). The backdrop is what the outer ring of the picture looks like — smooth, one colour. A pixel belongs to the subject when it
 * has an edge of its own (fabric, a seam, a rim) or is far from the backdrop colour; stray specks are dropped and the box takes the middle 97 % of what is left on each axis.
 * A window frame or a plinth in the picture widens the box (the build then zooms less, never more than the subject allows); no subject found gives `found: false` and the centre.
 */
export function subjectBox(rgb, w, h) {
  const px = (x, y, c) => rgb[(y * w + x) * 3 + c];
  const edge = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      let e = 0;
      for (let c = 0; c < 3; c++) e += Math.abs(px(x + 1, y, c) - px(x - 1, y, c)) + Math.abs(px(x, y + 1, c) - px(x, y - 1, c));
      edge[y * w + x] = e;
    }
  const ring = Math.max(2, Math.round(Math.min(w, h) * 0.05));
  const onRing = (x, y) => x < ring || x >= w - ring || y < ring || y >= h - ring;
  const median = (list) => list.sort((a, b) => a - b)[Math.floor(list.length / 2)];
  const back = [0, 1, 2].map((c) => {
    const v = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (onRing(x, y)) v.push(px(x, y, c));
    return median(v);
  });
  const ringEdges = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (onRing(x, y)) ringEdges.push(edge[y * w + x]);
  ringEdges.sort((a, b) => a - b);
  const edgeLimit = Math.max(24, (ringEdges[Math.floor(ringEdges.length * 0.9)] ?? 0) * 2.2);
  const subject = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const away = Math.abs(px(x, y, 0) - back[0]) + Math.abs(px(x, y, 1) - back[1]) + Math.abs(px(x, y, 2) - back[2]);
      subject[y * w + x] = edge[y * w + x] > edgeLimit || away > 90 ? 1 : 0;
    }
  const cols = new Float32Array(w);
  const rows = new Float32Array(h);
  let total = 0;
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      if (!subject[y * w + x]) continue;
      let near = 0; // a speck has no neighbours
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && subject[(y + dy) * w + x + dx]) near++;
      if (near < 3) continue;
      cols[x]++;
      rows[y]++;
      total++;
    }
  if (total < 40) return { box: [0.15, 0.1, 0.85, 0.9], found: false };
  const at = (list, share) => {
    let sum = 0;
    for (let i = 0; i < list.length; i++) {
      sum += list[i];
      if (sum >= total * share) return i;
    }
    return list.length - 1;
  };
  return { box: [at(cols, 0.015) / w, at(rows, 0.015) / h, (at(cols, 0.985) + 1) / w, (at(rows, 0.985) + 1) / h], found: true };
}

// ── colour ─────────────────────────────────────────────────────────────────────────────────────────────────────
export const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
/** sRGB [r, g, b] (0–255) → CIE L*a*b* (D65). */
export function toLab([r, g, b]) {
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
/** Perceptual distance between two colours (CIE76 ΔE): ~2 is just noticeable, ~20 is "another colour". */
export const deltaE = (a, b) => Math.hypot(...toLab(a).map((v, i) => v - toLab(b)[i]));
/** Relative luminance 0–1 and WCAG contrast ratio. */
export const relLum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const contrastRatio = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
