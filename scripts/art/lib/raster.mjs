// Raster helpers: SVG -> float layers (via sharp/librsvg), blurs, compositing.
// All pixel work is done on Float32Arrays in [0,1] so gradients never band; we quantise (with grain) once at the end.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

export { sharp };

/** A straight-alpha float layer positioned on the film. */
export class Layer {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.rgb = new Float32Array(w * h * 3);
    this.a = new Float32Array(w * h);
  }
}

/** Rasterise an SVG string (with explicit width/height) into a Layer at (x,y). */
export async function rasterize(svg, x, y, w, h) {
  const { data } = await sharp(Buffer.from(svg), { density: 72, limitInputPixels: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const L = new Layer(x, y, w, h);
  const n = w * h;
  for (let i = 0, j = 0, k = 0; i < n; i++, j += 3, k += 4) {
    L.rgb[j] = data[k] / 255; L.rgb[j + 1] = data[k + 1] / 255; L.rgb[j + 2] = data[k + 2] / 255;
    L.a[i] = data[k + 3] / 255;
  }
  return L;
}

/** Wrap SVG body content so that user-space = film pixels inside the (x,y,w,h) window. */
export function svgWindow(x, y, w, h, inner, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}"><defs>${defs}</defs>${inner}</svg>`;
}

// ---------------------------------------------------------------- blur
function boxesForGauss(sigma, n = 3) {
  const wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let wl = Math.floor(wIdeal); if (wl % 2 === 0) wl--;
  const wu = wl + 2;
  const mIdeal = (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
  const m = Math.round(mIdeal);
  const sizes = [];
  for (let i = 0; i < n; i++) sizes.push(i < m ? wl : wu);
  return sizes;
}

function boxH(src, dst, w, h, r, clampEdge) {
  const iarr = 1 / (r + r + 1);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    const first = clampEdge ? src[row] : 0, last = clampEdge ? src[row + w - 1] : 0;
    for (let k = -r; k <= r; k++) acc += k < 0 ? first : k >= w ? last : src[row + k];
    for (let x = 0; x < w; x++) {
      dst[row + x] = acc * iarr;
      const add = x + r + 1, sub = x - r;
      acc += (add >= w ? last : src[row + add]) - (sub < 0 ? first : src[row + sub]);
    }
  }
}
function boxV(src, dst, w, h, r, clampEdge) {
  const iarr = 1 / (r + r + 1);
  for (let x = 0; x < w; x++) {
    let acc = 0;
    const first = clampEdge ? src[x] : 0, last = clampEdge ? src[(h - 1) * w + x] : 0;
    for (let k = -r; k <= r; k++) acc += k < 0 ? first : k >= h ? last : src[k * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = acc * iarr;
      const add = y + r + 1, sub = y - r;
      acc += (add >= h ? last : src[add * w + x]) - (sub < 0 ? first : src[sub * w + x]);
    }
  }
}

/** Gaussian-ish blur of a single float plane (3 box passes). Returns a new array. */
export function blur(src, w, h, sigma, clampEdge = false) {
  if (sigma < 0.35) return Float32Array.from(src);
  const boxes = boxesForGauss(sigma, 3);
  let a = Float32Array.from(src), b = new Float32Array(src.length);
  for (const bw of boxes) {
    const r = (bw - 1) >> 1;
    boxH(a, b, w, h, r, clampEdge);
    boxV(b, a, w, h, r, clampEdge);
  }
  return a;
}

/** Blur an interleaved 3-channel float image (clamped edges). */
export function blurRgb(rgb, w, h, sigma) {
  const n = w * h;
  const out = new Float32Array(rgb.length);
  const plane = new Float32Array(n);
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < n; i++) plane[i] = rgb[i * 3 + c];
    const bl = blur(plane, w, h, sigma, true);
    for (let i = 0; i < n; i++) out[i * 3 + c] = bl[i];
  }
  return out;
}

// ---------------------------------------------------------------- compositing
/** Composite a layer over the film (film is opaque RGB). */
export function over(film, FW, FH, layer, opacity = 1) {
  const { x, y, w, h, rgb, a } = layer;
  for (let j = 0; j < h; j++) {
    const fy = y + j; if (fy < 0 || fy >= FH) continue;
    for (let i = 0; i < w; i++) {
      const fx = x + i; if (fx < 0 || fx >= FW) continue;
      const al = a[j * w + i] * opacity;
      if (al <= 0) continue;
      const fo = (fy * FW + fx) * 3, lo = (j * w + i) * 3;
      film[fo] += (rgb[lo] - film[fo]) * al;
      film[fo + 1] += (rgb[lo + 1] - film[fo + 1]) * al;
      film[fo + 2] += (rgb[lo + 2] - film[fo + 2]) * al;
    }
  }
}

/** Place a layer's alpha into a full-film float mask (max-union). */
export function alphaToMask(layer, FW, FH, mask = new Float32Array(FW * FH)) {
  const { x, y, w, h, a } = layer;
  for (let j = 0; j < h; j++) {
    const fy = y + j; if (fy < 0 || fy >= FH) continue;
    for (let i = 0; i < w; i++) {
      const fx = x + i; if (fx < 0 || fx >= FW) continue;
      const v = a[j * w + i];
      const o = fy * FW + fx;
      if (v > mask[o]) mask[o] = v;
    }
  }
  return mask;
}

/**
 * Cast a soft shadow of a plane onto the film.  `src` = { x, y, w, h, a } (a Layer, or any {a} plane with a rect).
 * Work is confined to the source rect expanded by the blur/offset margin.
 *   dx,dy offset (px); shear shifts x by shear*(rowY - y0) so shadows lengthen with distance from the wall;
 *   sigma blur (px); strength 0-1; tint = rgb multiplier at full shadow; gate = optional film-sized plane (0..1) that
 *   restricts where the shadow may land (e.g. only onto the garment underneath).
 */
export function castShadow(film, FW, FH, src, { dx = 0, dy = 0, shear = 0, y0 = 0, sigma = 6, strength = 0.3, tint = [0.55, 0.5, 0.5], gate = null } = {}) {
  const maxShift = Math.abs(dx) + Math.abs(shear) * (src.h + Math.abs(y0 - src.y)) + 1;
  const m = Math.ceil(3 * sigma + Math.max(maxShift, Math.abs(dy)) + 2);
  const wx0 = Math.max(0, src.x - m), wy0 = Math.max(0, src.y - m);
  const wx1 = Math.min(FW, src.x + src.w + m), wy1 = Math.min(FH, src.y + src.h + m);
  const ww = wx1 - wx0, wh = wy1 - wy0;
  if (ww <= 0 || wh <= 0) return;
  const plane = new Float32Array(ww * wh);
  for (let y = 0; y < wh; y++) {
    const fy = wy0 + y;
    const sy = Math.round(fy - dy) - src.y; // source row
    if (sy < 0 || sy >= src.h) continue;
    const sh = dx + shear * (fy - dy - y0);
    const ish = Math.floor(sh), fr = sh - ish;
    for (let x = 0; x < ww; x++) {
      const sxp = wx0 + x - ish - src.x; // source col for a (integer) shift
      const a = sxp >= 0 && sxp < src.w ? src.a[sy * src.w + sxp] : 0;
      const b = sxp - 1 >= 0 && sxp - 1 < src.w ? src.a[sy * src.w + sxp - 1] : 0;
      plane[y * ww + x] = a * (1 - fr) + b * fr;
    }
  }
  const bl = blur(plane, ww, wh, sigma);
  for (let y = 0; y < wh; y++) {
    for (let x = 0; x < ww; x++) {
      let s = bl[y * ww + x] * strength;
      if (gate) s *= gate[(wy0 + y) * FW + wx0 + x];
      if (s <= 0.0004) continue;
      const o = ((wy0 + y) * FW + wx0 + x) * 3;
      film[o] *= 1 - s * (1 - tint[0]);
      film[o + 1] *= 1 - s * (1 - tint[1]);
      film[o + 2] *= 1 - s * (1 - tint[2]);
    }
  }
}
