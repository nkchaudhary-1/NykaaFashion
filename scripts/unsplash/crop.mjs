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

/** Pins for a window: the anchors that are comfortably inside it and apart from one another, best first; the rest filled from a fixed spread. `source` says which. */
export function pinsFor(box, pw, ph, anchors, count, flip = false) {
  const out = [];
  const inside = ({ x, y }) => x > 0.12 && x < 0.88 && y > 0.12 && y < 0.88;
  const apart = (p, list, d) => !list.some((q) => Math.hypot((q.x - p.x) * 1.6, q.y - p.y) < d);
  for (const a of anchors ?? []) {
    if (out.length === count) break;
    const p = where(box, pw, ph, a, flip);
    if (inside(p) && apart(p, out, 0.16)) out.push({ ...p, source: "anchor" });
  }
  for (const [x, y] of [[0.5, 0.42], [0.42, 0.66], [0.6, 0.7], [0.5, 0.55]]) {
    if (out.length === count) break;
    if (apart({ x, y }, out, 0.12)) out.push({ x, y, source: "fallback" });
  }
  return out.slice(0, count);
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
