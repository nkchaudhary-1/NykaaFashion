// Shared machinery for hanging garments: materials, necklines, sleeves, piece construction, stitching, buttons and
// the render orchestrator that composes wall shadow -> shaded pieces -> vector details in z-order.
import { Curve, mirrorOutline, mirrorPts, bandPath, offsetPath, offsetPoints, polyD, boundsOfPts, unionBounds, clamp, lerp, smoothstep, f } from './geometry.mjs';
import { Rng, hashStr } from './prng.mjs';
import { buildPattern } from './patterns.mjs';
import { FABRICS, fabricOf, defaultFabric } from './fabrics.mjs';
import { mix, lighten, darken, shadowOf, highlightOf, luma } from './color.mjs';
import { FoldField } from './folds.mjs';

// ------------------------------------------------------------------ materials
export function makeMaterial(ctx, spec, { fabric } = {}) {
  const name = spec.fabric || fabric || defaultFabric(spec);
  const fab = fabricOf(name);
  const rng = new Rng((hashStr('pat:' + (spec.pattern || 'solid')) ^ Math.imul((spec.seed | 0) + 17, 7919)) >>> 0);
  const pat = buildPattern(spec, rng);
  const mat = { ...fab, ...(pat.fx || {}) };
  return { base: spec.color || '#8B2E3C', pat, mat, fabric: name, spec };
}

/** Build a drawable piece (see lib/garment.renderGarment). Lengths are cm. */
export function clothPiece(M, o) {
  const b = o.bounds;
  const patRect = M.pat.fill && !o.noPattern
    ? `<rect x="${f(b.x0 - 3)}" y="${f(b.y0 - 3)}" width="${f(b.x1 - b.x0 + 6)}" height="${f(b.y1 - b.y0 + 6)}" fill="${M.pat.fill}"${o.patTransform ? ` transform="${o.patTransform}"` : ''}/>`
    : '';
  return {
    id: o.id, z: o.z ?? 10, d: o.d, bounds: b, pad: o.pad,
    fill: o.fill ?? M.base,
    inner: patRect + (o.inner || ''), defs: (o.noPattern ? '' : M.pat.defs) + (o.defs || ''),
    mat: o.mat ?? M.mat, field: o.field, bevelCm: o.bevelCm ?? 0.3, bevelH: o.bevelH ?? 0.26, edgeAo: o.edgeAo ?? 0.12,
    contact: o.contact, overlay: o.overlay, gain: o.gain, texSwap: o.texSwap, noCast: o.noCast, grid: o.grid,
  };
}

// ------------------------------------------------------------------ silhouettes
/** smoothed half-width lookup (cm) of a closed outline, for domes/folds that follow the silhouette */
export function hwTable(curve, { v0 = 0, v1 = 160, step = 0.5, smooth = 2.5 } = {}) {
  const n = Math.ceil((v1 - v0) / step) + 1;
  const xmax = new Float32Array(n).fill(-1e9), xmin = new Float32Array(n).fill(1e9);
  const pts = curve.sample(900);
  for (const p of pts) {
    const i = Math.round((p[1] - v0) / step);
    if (i < 0 || i >= n) continue;
    if (p[0] > xmax[i]) xmax[i] = p[0];
    if (p[0] < xmin[i]) xmin[i] = p[0];
  }
  const hw = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) { hw[i] = xmax[i] > -1e8 ? (xmax[i] - xmin[i]) / 2 : last; last = hw[i] || last; }
  const r = Math.max(1, Math.round(smooth / step)), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let j = -r; j <= r; j++) { const q = i + j; if (q >= 0 && q < n) { s += hw[q]; c++; } } out[i] = s / c; }
  return (v) => { const x = (v - v0) / step, i = clamp(Math.floor(x), 0, n - 2), t = clamp(x - i, 0, 1); return out[i] * (1 - t) + out[i + 1] * t; };
}

/**
 * Front neckline, right half from the centre to the neck-side point (NS).
 * Returns { half: [[x,y,flag?]…centre→NS], nsx, ys (y of NS), centreY, backDip }.
 */
export function neckline(type, { nsx0 = 7.0, ys0 = 1.6, depth, width } = {}) {
  const slope = 0.31;
  const mk = (w, d, n = 2, corner = false) => {
    const ys = ys0 + (w - nsx0) * slope;
    const half = [];
    const N = 6;
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * (Math.PI / 2);
      const x = w * Math.pow(Math.sin(th), 2 / n), y = ys + d * Math.pow(Math.cos(th), 2 / n);
      half.push([x, y]);
    }
    return { half, nsx: w, ys, centreY: ys + d };
  };
  switch (type) {
    case 'v': { // straight-ish V with a crisp point
      const w = width ?? 7.6, d = depth ?? 17, ys = ys0 + (w - nsx0) * slope;
      return { half: [[0, ys + d, 'c'], [w * 0.28, ys + d * 0.62], [w * 0.62, ys + d * 0.3], [w, ys]], nsx: w, ys, centreY: ys + d };
    }
    case 'collar': { // shirt-collar opening: narrow V
      const w = width ?? 7.0, d = depth ?? 11, ys = ys0;
      return { half: [[0, ys + d, 'c'], [w * 0.3, ys + d * 0.6], [w * 0.66, ys + d * 0.28], [w, ys]], nsx: w, ys, centreY: ys + d };
    }
    case 'scoop': return mk(width ?? 10.6, depth ?? 13.5, 2.5);
    case 'square': {
      const w = width ?? 9.4, d = depth ?? 10.5, ys = ys0 + (w - nsx0) * slope;
      return { half: [[0, ys + d], [w - 0.5, ys + d], [w, ys + d - 0.5, 'c'], [w, ys + 1.4], [w, ys, 'c']], nsx: w, ys, centreY: ys + d };
    }
    case 'halter': return mk(width ?? 5.6, depth ?? 5.5, 2.2);
    case 'crew': return mk(width ?? 7.4, depth ?? 5.2, 2.3);
    case 'boat': return mk(width ?? 13.5, depth ?? 3.2, 2.6);
    case 'round':
    default: return mk(width ?? 7.2, depth ?? 8.4, 2.2);
  }
}

/** Mirror a half-list that runs centre→NS into a full left→right curve through the centre. */
export function fullFromHalf(half) {
  const right = half.slice(1);
  const left = half.slice(1).reverse().map((p) => [-p[0], p[1], p[2]]);
  return Curve.through([...left, half[0], ...right]);
}

// ------------------------------------------------------------------ sleeves
/**
 * Hanging sleeve outline (right side when side=+1). ST = shoulder tip, UA = underarm on the body.
 * The outer edge leaves the shoulder tangentially (continuing the hanger slope) and then gravity bends it to `hang`
 * degrees from vertical; the cuff is perpendicular to the final direction.
 * Returns { d, curve, bounds, centre, widthAt, cuff:{o,i,mid}, outer, inner }.
 */
export function sleeveShape({ ST, UA, len, hang = 20, wCuff = 11, bulge = 0, side = 1, sag = 0, bow = 1.0 }) {
  const aS = Math.atan2(0.31, 1);                     // shoulder slope
  const dS = [Math.cos(aS), Math.sin(aS)];            // shoulder direction (outward, slightly down)
  const aE = (hang * Math.PI) / 180;
  const dE = [Math.sin(aE), Math.cos(aE)];            // final hang direction
  const inw = [-Math.cos(aE), Math.sin(aE)];          // perpendicular pointing back towards the body
  const bz = (p0, p1, p2, p3, t) => { const m = 1 - t; return [m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0], m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]]; };
  const cap = len < 14;
  const run = cap ? len * 0.75 : Math.min(8.5, len * 0.38);
  const rest = Math.max(0.5, len - run);
  const CO = [ST[0] + dS[0] * run + dE[0] * rest, ST[1] + dS[1] * run + dE[1] * rest];
  const o1 = [ST[0] + dS[0] * run * 0.75, ST[1] + dS[1] * run * 0.75];
  const o2 = [CO[0] - dE[0] * rest * 0.55 - dS[0] * 0.5, CO[1] - dE[1] * rest * 0.55];
  const outerPts = [0, 0.22, 0.46, 0.7, 0.88, 1].map((t) => bz(ST, o1, o2, CO, t));
  let CI, UAe = UA;
  if (cap) {
    const t = clamp(0.28 + len / 40, 0.3, 0.62);
    CI = [lerp(ST[0], UA[0], t) - 0.4, lerp(ST[1], UA[1], t)];
    UAe = CI;
  } else {
    CI = [CO[0] + inw[0] * wCuff, CO[1] + inw[1] * wCuff + sag];
  }
  // inner edge: straight-ish from the underarm to the inner cuff corner, with a gentle outward bow
  const innerPts = [];
  const lx = CI[0] - UAe[0], ly = CI[1] - UAe[1], ll = Math.hypot(lx, ly) || 1;
  const nx = ly / ll, ny = -lx / ll; // normal pointing outward (right of travel UA->CI when moving down)
  for (const t of [0.3, 0.62]) {
    const w = Math.sin(Math.PI * t) * (cap ? 0.2 : bow);
    innerPts.push([lerp(UAe[0], CI[0], t) + nx * w * -1, lerp(UAe[1], CI[1], t) + ny * w * -1]);
  }
  // puff: push the mid-edges outward
  if (bulge) {
    for (let i = 1; i < outerPts.length - 1; i++) { const t = i / (outerPts.length - 1); const w = Math.sin(Math.PI * t) * bulge * 0.6; outerPts[i] = [outerPts[i][0] + dE[1] * w, outerPts[i][1] - dE[0] * w]; }
    for (let i = 0; i < innerPts.length; i++) { const w = bulge * 0.5; innerPts[i] = [innerPts[i][0] - dE[1] * w * 0.4 + 0.6 * w * 0.2, innerPts[i][1] + dE[0] * w * 0.4]; }
  }
  const cuffMid = [(CO[0] + CI[0]) / 2 + dE[0] * 0.45, (CO[1] + CI[1]) / 2 + dE[1] * 0.45];
  // innerPts run UA->CI; the loop wants CI->UA
  const pts = [
    [ST[0], ST[1], 'c'], ...outerPts.slice(1, -1), [CO[0], CO[1], 'c'], cuffMid,
    [CI[0], CI[1], 'c'], ...innerPts.slice().reverse(), ...(cap ? [] : [[UA[0], UA[1], 'c']]),
  ];
  const mir = (p) => (side === 1 ? p : [-p[0], p[1], p[2]]);
  const final = Curve.through(pts.map(mir), { closed: true });
  // centre line (for fold fields)
  const nC = 8, cpts = [];
  const innerFull = [UAe, ...innerPts, CI];
  const innerCurve = Curve.through(innerFull);
  for (let i = 0; i <= nC; i++) {
    const t = i / nC;
    const o = bz(ST, o1, o2, CO, t), ii = innerCurve.at(t);
    cpts.push(mir([(o[0] + ii[0]) / 2, (o[1] + ii[1]) / 2]));
  }
  const centre = Curve.through(cpts);
  const widthAt = (u) => { const o = bz(ST, o1, o2, CO, u), ii = innerCurve.at(u); return Math.hypot(o[0] - ii[0], o[1] - ii[1]); };
  return {
    d: final.d(), curve: final, bounds: final.bounds(), centre, widthAt,
    cuff: { o: mir(CO), i: mir(CI), mid: mir(cuffMid) },
    outer: Curve.through(outerPts.map(mir)), inner: Curve.through(innerFull.map(mir)),
  };
}

// ------------------------------------------------------------------ details
/** running-stitch line (dashes) along a curve at offset; returns svg string (cm space) */
export function stitchLine(curve, off, { color = '#000', op = 0.35, w = 0.07, dash = 0.32, gap = 0.22, u0 = 0, u1 = 1 } = {}) {
  return `<path d="${offsetPath(curve, off, { n: 80, u0, u1 })}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="${w}" stroke-dasharray="${dash} ${gap}" stroke-linecap="round"/>`;
}

/** two-hole button (cm space). returns svg */
export function button(x, y, r, color, { holes = 2, ring = true, shank = false } = {}) {
  const hi = lighten(color, 0.42), lo = darken(color, 0.32);
  const g = `bg${Math.round(x * 10)}${Math.round(y * 10)}`;
  let s = `<defs><radialGradient id="${g}" cx=".34" cy=".3" r=".85"><stop offset="0" stop-color="${hi}"/><stop offset=".55" stop-color="${color}"/><stop offset="1" stop-color="${lo}"/></radialGradient></defs>`;
  s += `<circle cx="${f(x + r * 0.12)}" cy="${f(y + r * 0.2)}" r="${f(r * 1.05)}" fill="#000" opacity=".28"/>`;
  s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${g})"/>`;
  if (ring) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.72)}" fill="none" stroke="${lo}" stroke-opacity=".55" stroke-width="${f(r * 0.1)}"/>`;
  const hr = r * 0.11;
  if (holes === 2) s += [-1, 1].map((q) => `<circle cx="${f(x + q * r * 0.26)}" cy="${f(y)}" r="${f(hr)}" fill="${darken(color, 0.65)}"/>`).join('');
  if (holes === 4) s += [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => `<circle cx="${f(x + a * r * 0.24)}" cy="${f(y + b * r * 0.24)}" r="${f(hr)}" fill="${darken(color, 0.65)}"/>`).join('');
  s += `<ellipse cx="${f(x - r * 0.32)}" cy="${f(y - r * 0.36)}" rx="${f(r * 0.3)}" ry="${f(r * 0.16)}" fill="#fff" opacity=".32" transform="rotate(-35 ${f(x)} ${f(y)})"/>`;
  return s;
}

// ------------------------------------------------------------------ render orchestration
/**
 * model = { pieces: [piece…] }  (see clothPiece / hangerPieces). Caller must have set ctx.cam and painted the backdrop.
 */
export async function renderGarment(ctx, model, { wall } = {}) {
  const k = ctx.cam.k;
  const pieces = model.pieces.slice().sort((a, b) => a.z - b.z);
  for (const p of pieces) p.layer = await ctx.albedo(p);
  const castLayers = pieces.filter((p) => p.layer && !p.noCast).map((p) => p.layer);
  ctx.wallShadow(castLayers, wall || model.wall || {});
  for (const p of pieces) {
    if (!p.layer) continue;
    ctx.shadeAndDraw(p.layer, {
      mat: p.mat, field: p.field, gain: p.gain, texSwap: p.texSwap,
      bevel: { sigma: (p.bevelCm ?? 0.3) * k, h: p.bevelH ?? 0.26 }, edgeAo: p.edgeAo ?? 0.12, edgeSigma: 0.5 * k,
      contact: p.contact, grid: p.grid ?? model.grid,
    });
    if (p.overlay) await ctx.vector(typeof p.overlay === 'function' ? p.overlay() : p.overlay, { bounds: p.bounds });
    if (p.after) await p.after(ctx, p);
  }
}
