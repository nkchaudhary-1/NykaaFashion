// The cloth/solid shader. Takes a flat-colour "albedo" Layer and lights it using
//   (a) a fold height-field evaluated on a coarse grid (smooth slopes),
//   (b) an edge bevel derived from the blurred alpha (rolled hems, binding, tube volume),
//   (c) a per-pixel micro-texture bump,
// then applies wrap-diffuse, specular / environment, rim, AO, saturated shadows and the shared light pool.
import { blur } from './raster.mjs';
import { clamp } from './geometry.mjs';

const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
/** Direction *towards* the key light: upper-left, in front of the surface. x right, y down, z to viewer. */
export const LIGHT = norm3([-0.52, -0.62, 0.6]);
const HALF = norm3([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);

export class Camera {
  constructor({ k = 9, tx = 0, ty = 0, rot = 0 } = {}) {
    this.k = k; this.tx = tx; this.ty = ty; this.rot = rot;
    this.c = Math.cos(rot); this.s = Math.sin(rot);
  }
  /** cm -> px */
  fwd(u, v) { return [this.tx + this.k * (this.c * u - this.s * v), this.ty + this.k * (this.s * u + this.c * v)]; }
  /** px -> cm */
  inv(x, y) { const dx = x - this.tx, dy = y - this.ty; return [(this.c * dx + this.s * dy) / this.k, (-this.s * dx + this.c * dy) / this.k]; }
  /** SVG matrix for a <g transform> mapping cm space to film px */
  matrix() { return `matrix(${(this.k * this.c).toFixed(5)} ${(this.k * this.s).toFixed(5)} ${(-this.k * this.s).toFixed(5)} ${(this.k * this.c).toFixed(5)} ${this.tx.toFixed(3)} ${this.ty.toFixed(3)})`; }
}

/**
 * Shade a layer in place.
 * o = { cam, field, mat, tex (fn u,v), pool (fn x,y), bevel:{sigma,h}, edgeAo, grid, shadowTint }
 */
export function shadeLayer(layer, o) {
  const { cam, field, mat } = o;
  const { w, h, x: X0, y: Y0, a, rgb } = layer;
  const k = cam.k;
  const g = o.grid || 4;
  const gw = Math.ceil(w / g) + 2, gh = Math.ceil(h / g) + 2;

  // ---- coarse field grid -------------------------------------------------
  const H = new Float32Array(gw * gh);
  const PL = new Float32Array(gw * gh).fill(1);
  if (field) {
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const [u, v] = cam.inv(X0 + i * g, Y0 + j * g);
        H[j * gw + i] = field.h(u, v);
      }
    }
  }
  if (o.pool) for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) PL[j * gw + i] = o.pool(X0 + i * g, Y0 + j * g);
  const SX = new Float32Array(gw * gh), SY = new Float32Array(gw * gh), AO = new Float32Array(gw * gh).fill(1);
  const gcm = g / k; // grid step in cm
  const cav = mat.cav ?? 0.22;
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(gw - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(gh - 1, j + 1);
      // screen-space slopes (cm per cm) – independent of camera rotation because we differentiate in px space
      SX[j * gw + i] = (H[j * gw + i1] - H[j * gw + i0]) / ((i1 - i0) * gcm);
      SY[j * gw + i] = (H[j1 * gw + i] - H[j0 * gw + i]) / ((j1 - j0) * gcm);
      if (field) {
        const lap = (H[j * gw + i0] + H[j * gw + i1] + H[j0 * gw + i] + H[j1 * gw + i] - 4 * H[j * gw + i]) / (gcm * gcm);
        // valleys (positive laplacian) darker, ridges a touch lighter
        AO[j * gw + i] = 1 - cav * clamp(lap * 0.55, -0.6, 1);
      }
    }
  }

  // ---- bevel (edge volume) -------------------------------------------------
  const bev = o.bevel;
  let Ab = null;
  if (bev && bev.h > 0) Ab = blur(a, w, h, bev.sigma);
  let Ae = null;
  const edgeAo = o.edgeAo ?? 0;
  if (edgeAo > 0) Ae = blur(a, w, h, o.edgeSigma ?? 0.55 * k);
  const bevAmp = bev ? bev.h * k : 0; // slope per px-gradient

  const nfn = o.normalFn || null; // optional analytic normal: (ix, iy, out[3]) -> fills unit normal (x right, y down, z to viewer)
  const NV = [0, 0, 1];
  const tex = o.tex;
  let T0 = null;
  if (tex) {
    // texture is evaluated once per pixel; its bump comes from finite differences of this plane
    T0 = new Float32Array(w * h);
    const cc = cam.c, ss = cam.s;
    for (let iy = 0; iy < h; iy++) {
      for (let ix = 0; ix < w; ix++) {
        if (a[iy * w + ix] <= 0.003) continue;
        const dx = X0 + ix - cam.tx, dy = Y0 + iy - cam.ty;
        T0[iy * w + ix] = tex((cc * dx + ss * dy) / k, (-ss * dx + cc * dy) / k);
      }
    }
  }
  const zoom = clamp(k / 14, 1, 1.8);
  const tAmp = mat.tex ? mat.tex.amp * zoom : 0, tBump = mat.tex ? mat.tex.bump * zoom : 0;
  const amb = mat.amb, wrap = mat.wrap;
  const Lx = LIGHT[0], Ly = LIGHT[1], Lz = LIGHT[2];
  const S0 = amb + (1 - amb) * clamp((Lz + wrap) / (1 + wrap), 0, 1);
  const specK = mat.spec || 0, shin = mat.shin || 10, metal = mat.metal || 0;
  const rimK = mat.rim || 0, trans = mat.trans || 0;
  const tint = o.shadowTint ?? 0.38;
  const alphaMul = mat.alpha ?? 1;
  const gain = o.gain ?? 1;
  const c = cam.c, s = cam.s;

  for (let iy = 0; iy < h; iy++) {
    const fy = iy / g, j = Math.floor(fy), ty = fy - j;
    for (let ix = 0; ix < w; ix++) {
      const pi = iy * w + ix;
      const al = a[pi];
      if (al <= 0.003) continue;
      const fx = ix / g, i = Math.floor(fx), tx = fx - i;
      const n00 = j * gw + i, n10 = n00 + 1, n01 = n00 + gw, n11 = n01 + 1;
      const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
      let sx = SX[n00] * w00 + SX[n10] * w10 + SX[n01] * w01 + SX[n11] * w11;
      let sy = SY[n00] * w00 + SY[n10] * w10 + SY[n01] * w01 + SY[n11] * w11;
      let ao = AO[n00] * w00 + AO[n10] * w10 + AO[n01] * w01 + AO[n11] * w11;
      const pool = PL[n00] * w00 + PL[n10] * w10 + PL[n01] * w01 + PL[n11] * w11;

      if (nfn) {
        nfn(ix, iy, NV);
        const nzz = NV[2] < 0.04 ? 0.04 : NV[2];
        sx = -NV[0] / nzz; sy = -NV[1] / nzz;
      }
      if (Ab) {
        const xm = ix > 0 ? ix - 1 : ix, xp = ix < w - 1 ? ix + 1 : ix, ym = iy > 0 ? iy - 1 : iy, yp = iy < h - 1 ? iy + 1 : iy;
        sx += (Ab[iy * w + xp] - Ab[iy * w + xm]) * 0.5 * bevAmp;
        sy += (Ab[yp * w + ix] - Ab[ym * w + ix]) * 0.5 * bevAmp;
      }
      let tm = 1;
      if (T0) {
        tm = 1 + tAmp * T0[pi];
        if (tBump > 0) {
          const xm = ix > 0 ? ix - 1 : ix, xp = ix < w - 1 ? ix + 1 : ix, ym = iy > 0 ? iy - 1 : iy, yp = iy < h - 1 ? iy + 1 : iy;
          sx += tBump * (T0[iy * w + xp] - T0[iy * w + xm]) * 0.5;
          sy += tBump * (T0[yp * w + ix] - T0[ym * w + ix]) * 0.5;
        }
      }
      if (Ae) {
        const e2 = Ae[pi];
        // darken towards edges: e2 ~0.5 on the edge, 1 inside
        const q = e2 >= 1 ? 0 : (1 - e2) * 2;
        ao *= 1 - edgeAo * (q > 1 ? 1 : q * q);
      }

      // ---- lighting
      const inv = 1 / Math.sqrt(sx * sx + sy * sy + 1);
      const nx = -sx * inv, ny = -sy * inv, nz = inv;
      const ndl = nx * Lx + ny * Ly + nz * Lz;
      let d = (ndl + wrap) / (1 + wrap); d = d < 0 ? 0 : d > 1 ? 1 : d;
      let S = (amb + (1 - amb) * d) / S0;
      if (trans) S += trans * (1 - S) * 0.6;
      S *= ao * pool * tm * gain;

      const lo = pi * 3;
      let r = rgb[lo], gcol = rgb[lo + 1], b = rgb[lo + 2];
      // very dark cloth (charcoal / black) would collapse to a silhouette: lift the blacks a touch and let the folds read
      const lumA = 0.2126 * r + 0.7152 * gcol + 0.0722 * b;
      let dkl = 0;
      if (lumA < 0.22) { dkl = (0.22 - lumA) / 0.22; const up = dkl * 0.05; r += up; gcol += up; b += up; }
      // saturated shadows / airy highlights (per-channel exponent)
      const sl = S > 0.02 ? Math.log(S) : -3.9;
      let rr = r * Math.exp(sl * (1 + tint * (1 - r))), gg = gcol * Math.exp(sl * (1 + tint * (1 - gcol))), bb = b * Math.exp(sl * (1 + tint * (1 - b)));

      if (specK > 0 || metal > 0) {
        const ndh = nx * HALF[0] + ny * HALF[1] + nz * HALF[2];
        let sp = ndh > 0 ? Math.exp(shin * Math.log(ndh)) : 0;
        sp *= specK;
        if (metal > 0) {
          // studio environment lookup from the reflection vector
          const rx = 2 * nz * nx, ry = 2 * nz * ny, rz = 2 * nz * nz - 1;
          const sky = 0.46 + 0.8 * clamp(-ry * 0.9 + 0.1, -0.4, 1);
          const box = Math.max(0, rx * Lx + ry * Ly + rz * Lz);
          const env = sky * (0.6 + 0.4 * rz) + 1.7 * Math.exp(14 * Math.log(Math.max(box, 1e-4)));
          rr = rr * (1 - metal) + r * env * pool * metal * 1.2;
          gg = gg * (1 - metal) + gcol * env * pool * metal * 1.2;
          bb = bb * (1 - metal) + b * env * pool * metal * 1.2;
          const sc = 0.35 * metal; // tinted specular for metals
          rr += sp * (1 - sc + sc * r); gg += sp * (1 - sc + sc * gcol); bb += sp * (1 - sc + sc * b);
        } else {
          const hl = sp * pool * ao;
          rr += hl; gg += hl; bb += hl;
        }
      }
      if (rimK > 0) {
        const rim = rimK * Math.pow(1 - nz, 2.2) * 2.2;
        rr += rim * (0.5 + 0.5 * r); gg += rim * (0.5 + 0.5 * gcol); bb += rim * (0.5 + 0.5 * b);
      }
      if (dkl > 0) { const add = dkl * 0.16 * (S - 0.9) + dkl * 0.03; rr += add; gg += add; bb += add * 1.04; }
      rgb[lo] = rr < 0 ? 0 : rr > 1 ? 1 : rr;
      rgb[lo + 1] = gg < 0 ? 0 : gg > 1 ? 1 : gg;
      rgb[lo + 2] = bb < 0 ? 0 : bb > 1 ? 1 : bb;
      if (alphaMul < 1) a[pi] = al * alphaMul;
    }
  }
  return layer;
}
