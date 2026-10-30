// Bag: tote / top-handle / sling / clutch / bucket / backpack / potli; hardware gold|silver|black.
// Oblique 3/4 construction (front + side + top faces), leather/canvas shading, metal hardware.
import { Curve, f, lerp, clamp, polyD, tube, bandPath, offsetPath, unionBounds, boundsOfPts, mirrorOutline } from '../lib/geometry.mjs';
import { FoldField } from '../lib/folds.mjs';
import { Rng } from '../lib/prng.mjs';
import { mix, darken, lighten, shadowOf, luma } from '../lib/color.mjs';
import { makeMaterial, clothPiece, stitchLine, button } from '../lib/garment.mjs';
import { fitObject } from '../lib/object.mjs';
import { FABRICS } from '../lib/fabrics.mjs';
import { tassels } from '../lib/trims.mjs';

const HW = { gold: '#CBA24E', silver: '#C9CCD0', black: '#2A2A2C', brass: '#B88A44' };
const metalMat = { amb: 0.28, wrap: 0.1, spec: 0.9, shin: 44, metal: 0.92, rim: 0, tex: { type: 'none', amp: 0, bump: 0 } };

// style table: w,h (front, cm), taper (top narrower by), depth, handle, flap, etc.
const STYLES = {
  tote: { w: 38, h: 33, topW: 41, depth: 13, handle: { type: 'double', rise: 17, span: 17 }, pocket: true, fabric: 'leather' },
  'top-handle': { w: 28, h: 20, topW: 25, depth: 11, handle: { type: 'single', rise: 11, span: 8.5 }, flap: true, clasp: true, fabric: 'leather' },
  sling: { w: 22, h: 16, topW: 21, depth: 6.5, handle: { type: 'strap', rise: 26, span: 15 }, flap: true, clasp: true, fabric: 'leather' },
  clutch: { w: 29, h: 17, topW: 29, depth: 3.5, handle: null, flap: true, clasp: true, fabric: 'leather' },
  bucket: { w: 26, h: 26, topW: 28, depth: 20, handle: { type: 'single', rise: 9, span: 8 }, drawstring: true, round: true, fabric: 'leather' },
  backpack: { w: 28, h: 38, topW: 26, depth: 13, handle: { type: 'loop', rise: 4.5, span: 3.2 }, pocket: true, zip: true, straps: true, fabric: 'cotton' },
  potli: { w: 22, h: 24, topW: 12, depth: 12, handle: { type: 'cord', rise: 9, span: 6 }, drawstring: true, round: true, fabric: 'velvet', tassel: true },
};

function tubePiece(M, id, pts, w, { z = 8, fill, mat, bevel = 0.5, closed = false } = {}) {
  const c = Curve.through(pts);
  const { L, R } = tube(c, w, { n: 44 });
  const d = polyD([...L, ...R.slice().reverse()]);
  return clothPiece(M, { id, z, d, bounds: c.bounds(), pad: 2, fill: fill ?? M.base, noPattern: true, mat: mat ?? M.mat, bevelCm: w * 0.45, bevelH: w * 0.5, edgeAo: 0.1, grid: 2, contact: { dx: 0.3, dy: 0.4, sigma: 0.35, strength: 0.32 } });
}

export function buildBag(ctx, spec, shot) {
  const style = STYLES[spec.style] ? spec.style : 'tote';
  const S = STYLES[style];
  const back = shot === 'alt';
  const M = makeMaterial(ctx, spec, { fabric: spec.fabric || S.fabric });
  const rng = ctx.rng.fork('bag-' + shot);
  const hwC = HW[spec.hardware] || HW.gold;
  const dir = back ? -1 : 1;                       // which side we see (alt: from the other side)
  const D = [dir * S.depth * 0.3, -S.depth * 0.16]; // oblique depth vector
  const w = S.w, h = S.h, tw = S.topW;
  // front face outline: trapezoid (top slightly different width), rounded bottom corners; bucket/potli are rounded
  const x0b = -w / 2, x1b = w / 2, x0t = -tw / 2, x1t = tw / 2;
  const yb = 0, yt = -h;
  let front;
  if (S.round) {
    const tp = style === 'potli' ? 0.34 : 0.9;
    const pts = [[x0t * (style === 'potli' ? 0.5 : 1), yt, 'c'], [x0t * 0.96 - 0.2, yt + h * 0.2], [x0b * 1.02, yt + h * (style === 'potli' ? 0.6 : 0.5)], [x0b * 0.9, yb - h * 0.12], [x0b * 0.55, yb - 0.4], [0, yb + 0.1], [x1b * 0.55, yb - 0.4], [x1b * 0.9, yb - h * 0.12], [x1b * 1.02, yt + h * (style === 'potli' ? 0.6 : 0.5)], [x1t * 0.96 + 0.2, yt + h * 0.2], [x1t * (style === 'potli' ? 0.5 : 1), yt, 'c']];
    front = Curve.through(pts, { closed: true });
  } else {
    const r = style === 'clutch' ? 1.2 : style === 'backpack' ? 6 : 2.4;
    const pts = [[x0t + 0.6, yt, 'c'], [x1t - 0.6, yt, 'c'], [x1t, yt + 0.5], [x1b - 0.4, yb - r], [x1b - r * 0.55, yb - r * 0.15], [x1b - r, yb], [x0b + r, yb], [x0b + r * 0.55, yb - r * 0.15], [x0b + 0.4, yb - r], [x0t, yt + 0.5]];
    front = Curve.through(pts, { closed: true });
  }
  const fb = front.bounds();
  const field = new FoldField(rng.int(1, 1e6));
  const soft = M.fabric === 'velvet' || style === 'potli' || style === 'bucket' || style === 'tote';
  field.blob({ u: 0, v: -h * 0.5, ru: w * 0.5, rv: h * 0.55, amp: soft ? 2.2 : 0.9 });
  if (soft) {
    for (let i = 0; i < 4; i++) { const x = rng.range(-w * 0.35, w * 0.35); field.ridge({ a: [x, yt + 2], b: [x + rng.range(-3, 3), yb - 3], s0: 1.6, s1: 2.2, a0: 0.1, a1: (i % 2 ? 1 : -1) * rng.range(0.4, 0.9), fade0: 0.3, fade1: 0.3 }); }
  }
  field.noise({ amp: 0.1, fu: 0.2, fv: 0.2, oct: 3 });
  const pieces = [];
  const stitchC = luma(M.base) > 0.5 ? darken(M.base, 0.35) : lighten(M.base, 0.4);
  // ---- side + top faces (offset copies)
  const sideD = `M${f(x1b)} ${f(yb)}L${f(x1b + D[0])} ${f(yb + D[1])}L${f(x1t + D[0])} ${f(yt + D[1])}L${f(x1t)} ${f(yt)}Z`;
  const sideDs = dir > 0 ? sideD : `M${f(x0b)} ${f(yb)}L${f(x0b + D[0])} ${f(yb + D[1])}L${f(x0t + D[0])} ${f(yt + D[1])}L${f(x0t)} ${f(yt)}Z`;
  if (!S.round) {
    pieces.push(clothPiece(M, { id: 'side', z: 8, d: sideDs, bounds: boundsOfPts([[x0b - 8, yt - 5], [x1b + 8, yb + 1]]), gain: 0.72, bevelCm: 0.5, bevelH: 0.4, edgeAo: 0.12, field: null, grid: 2 }));
    const topD = `M${f(x0t)} ${f(yt)}L${f(x1t)} ${f(yt)}L${f(x1t + D[0])} ${f(yt + D[1])}L${f(x0t + D[0])} ${f(yt + D[1])}Z`;
    pieces.push(clothPiece(M, { id: 'top', z: 9, d: topD, bounds: boundsOfPts([[x0t - 8, yt - 5], [x1t + 8, yt + 1]]), gain: 1.06, bevelCm: 0.4, bevelH: 0.3, edgeAo: 0.1, grid: 2, inner: style === 'backpack' || S.zip ? `<path d="M${f(x0t + D[0] * 0.5)} ${f(yt + D[1] * 0.5)}L${f(x1t + D[0] * 0.5)} ${f(yt + D[1] * 0.5)}" stroke="#000" stroke-opacity=".45" stroke-width=".35"/><path d="M${f(x0t + D[0] * 0.5)} ${f(yt + D[1] * 0.5)}L${f(x1t + D[0] * 0.5)} ${f(yt + D[1] * 0.5)}" stroke="${hwC}" stroke-width=".22" stroke-dasharray=".2 .14"/>` : '' }));
  } else {
    // round bags: open mouth ellipse (inner dark) at the top
    const mw = (tw / 2) * (style === 'potli' ? 0.6 : 1);
    pieces.push({ id: 'mouth', z: 9, d: `M${f(-mw)} ${f(yt)}A${f(mw)} ${f(mw * 0.2)} 0 1 1 ${f(mw)} ${f(yt)}A${f(mw)} ${f(mw * 0.2)} 0 1 1 ${f(-mw)} ${f(yt)}Z`, bounds: { x0: -mw - 1, y0: yt - mw * 0.2 - 1, x1: mw + 1, y1: yt + mw * 0.2 + 1 }, fill: darken(M.base, 0.6), inner: '', defs: '', mat: { ...M.mat, tex: { type: 'none', amp: 0, bump: 0 } }, bevelCm: 0.5, bevelH: 0.2, edgeAo: 0.2, grid: 2, gain: 0.7 });
  }
  // ---- front inner details
  let inner = '';
  inner += stitchLine(front, -0.9, { color: stitchC, op: 0.7, w: 0.09, dash: 0.4, gap: 0.26 });
  if (S.pocket && !back) inner += `<path d="M${f(x0b + 3)} ${f(yt + 5.5)}H${f(x1b - 3)}V${f(yb - 4)}H${f(x0b + 3)}Z" fill="none" stroke="#000" stroke-opacity=".28" stroke-width=".12"/><path d="M${f(x0b + 3.5)} ${f(yt + 6)}H${f(x1b - 3.5)}" stroke="${stitchC}" stroke-opacity=".7" stroke-width=".09" stroke-dasharray=".4 .26"/>`;
  if (back) {
    // back: zip pocket
    const zy = yt + h * 0.3;
    inner += `<path d="M${f(x0b + 4)} ${f(zy)}H${f(x1b - 4)}" stroke="#000" stroke-opacity=".55" stroke-width=".5"/><path d="M${f(x0b + 4)} ${f(zy)}H${f(x1b - 4)}" stroke="${hwC}" stroke-width=".28" stroke-dasharray=".2 .14"/>` +
      `<rect x="${f(x1b - 7)}" y="${f(zy - 0.9)}" width="2.2" height="1.8" rx=".5" fill="${hwC}" stroke="#000" stroke-opacity=".3" stroke-width=".08"/>`;
  }
  if (style === 'backpack' && !back) inner += `<path d="M${f(x0b + 3)} ${f(yb - 14)}H${f(x1b - 3)}V${f(yb - 2.4)}H${f(x0b + 3)}Z" fill="#000" fill-opacity=".05" stroke="#000" stroke-opacity=".3" stroke-width=".12"/><path d="M${f(x0b + 3.5)} ${f(yb - 12.6)}H${f(x1b - 3.5)}" stroke="${hwC}" stroke-width=".26" stroke-dasharray=".2 .14"/>`;
  pieces.push(clothPiece(M, { id: 'front', z: 10, d: front.d(), bounds: fb, field, inner, bevelCm: S.round ? 1.4 : 0.55, bevelH: S.round ? 1.5 : 0.7, edgeAo: 0.16, grid: 3, contact: { dx: 0.4, dy: 0.5, sigma: 0.5, strength: 0.3 } }));
  // ---- flap + clasp
  let overlay = '';
  if (S.flap && !back) {
    const fh = h * (style === 'clutch' ? 0.62 : 0.5);
    const fp = style === 'clutch'
      ? Curve.through([[x0b - 0.1, yt, 'c'], [x1b + 0.1, yt, 'c'], [x1b + 0.1, yt + fh * 0.7], [x1b * 0.55, yt + fh * 0.95], [0, yt + fh * 1.05], [x0b * 0.55, yt + fh * 0.95], [x0b - 0.1, yt + fh * 0.7]], { closed: true })
      : Curve.through([[x0t - 0.2, yt - 0.2, 'c'], [x1t + 0.2, yt - 0.2, 'c'], [x1t + 0.4, yt + fh * 0.55], [x1t * 0.6, yt + fh * 0.92], [0, yt + fh * 1.0], [x0t * 0.6, yt + fh * 0.92], [x0t - 0.4, yt + fh * 0.55]], { closed: true });
    const ff = new FoldField(rng.int(1, 1e6)); ff.blob({ u: 0, v: yt + fh * 0.4, ru: w * 0.4, rv: fh * 0.5, amp: 0.5 });
    pieces.push(clothPiece(M, { id: 'flap', z: 12, d: fp.d(), bounds: fp.bounds(), field: ff, inner: stitchLine(fp, -0.8, { color: stitchC, op: 0.7, w: 0.09, dash: 0.4, gap: 0.26 }) + `<path d="${fp.d()}" fill="none" stroke="#000" stroke-opacity=".22" stroke-width=".12"/>`, bevelCm: 0.55, bevelH: 0.8, edgeAo: 0.16, grid: 3, contact: { dx: 0.35, dy: 0.7, sigma: 0.7, strength: 0.42 } }));
    if (S.clasp) {
      const cy = yt + fh * (style === 'clutch' ? 1.0 : 0.96);
      const cw = style === 'clutch' ? 4.2 : 3.4;
      const lock = `M${f(-cw / 2)} ${f(cy - 1.6)}H${f(cw / 2)}V${f(cy + 1.2)}Q0 ${f(cy + 2.4)} ${f(-cw / 2)} ${f(cy + 1.2)}Z`;
      pieces.push({ id: 'clasp', z: 20, d: lock, bounds: { x0: -cw, y0: cy - 3, x1: cw, y1: cy + 4 }, fill: hwC, inner: '', defs: '', mat: metalMat, bevelCm: 0.6, bevelH: 0.5, edgeAo: 0.05, grid: 2, contact: { dx: 0.2, dy: 0.35, sigma: 0.3, strength: 0.4 } });
      overlay += `<circle cx="0" cy="${f(cy - 0.2)}" r=".38" fill="${darken(hwC, 0.45)}"/>`;
    }
  }
  if (S.drawstring) {
    const my = yt + 1.2;
    overlay += `<path d="M${f(-tw * 0.42)} ${f(my)}Q0 ${f(my + 1.6)} ${f(tw * 0.42)} ${f(my)}" stroke="#000" stroke-opacity=".5" stroke-width=".5" fill="none"/><path d="M${f(-tw * 0.42)} ${f(my - 0.1)}Q0 ${f(my + 1.5)} ${f(tw * 0.42)} ${f(my - 0.1)}" stroke="${lighten(M.base, 0.25)}" stroke-width=".4" fill="none"/>`;
  }
  // ---- handles / straps
  const H = S.handle;
  const topY = yt + (S.round ? 0 : D[1] * 0.5), cxh = D[0] * 0.5;
  const hMat = { ...M.mat };
  if (H) {
    const arch = (cx0, base, span, rise) => [[cx0 - span, base], [cx0 - span * 0.96, base - rise * 0.55], [cx0 - span * 0.55, base - rise * 0.95], [cx0, base - rise], [cx0 + span * 0.55, base - rise * 0.95], [cx0 + span * 0.96, base - rise * 0.55], [cx0 + span, base]];
    if (H.type === 'single') pieces.push(tubePiece(M, 'handle', arch(cxh, topY, H.span, H.rise), 1.6, { z: 7 }));
    if (H.type === 'double') {
      const bh = tubePiece(M, 'handleB', arch(cxh, topY, w * 0.22, H.rise * 0.98), 1.7, { z: 6 }); bh.gain = 0.78; pieces.push(bh);
      pieces.push(tubePiece(M, 'handleF', arch(0, yt, w * 0.22, H.rise), 1.7, { z: 11 }));
    }
    if (H.type === 'strap') pieces.push(tubePiece(M, 'strap', [[x1b - 3, yt + 0.2], [x1b - 1.5, yt - H.rise * 0.5], [cxh + 2, yt - H.rise], [x0b + 5, yt - H.rise * 0.6], [x0b + 3, yt + 0.2]], 1.5, { z: 7 }));
    if (H.type === 'loop') pieces.push(tubePiece(M, 'handle', arch(cxh, topY, H.span, H.rise), 1.4, { z: 7 }));
    if (H.type === 'cord') { for (const s of [-1, 1]) pieces.push(tubePiece(M, 'cord' + s, [[s * tw * 0.3, yt + 0.5], [s * H.span * 0.9, yt - H.rise * 0.6], [s * H.span * 0.2, yt - H.rise]], 0.5, { z: 7, fill: hwC })); }
  }
  if (S.straps) for (const s of [-1, 1]) pieces.push(tubePiece(M, 'bpstrap' + s, [[s * 6, yt + 3], [s * 9.5, yt + 12], [s * 10.5, yb - 8], [s * 9, yb - 1.5]], 3.2, { z: 11, bevel: 0.8 }));
  // ring hardware at strap joints
  if (H && (H.type === 'single' || H.type === 'double' || H.type === 'strap')) {
    const ends = H.type === 'strap' ? [[x1b - 2.5, yt + 0.4], [x0b + 2.5, yt + 0.4]] : H.type === 'single' ? [[cxh - H.span, topY], [cxh + H.span, topY]] : [[-w * 0.22, yt + 0.3], [w * 0.22, yt + 0.3]];
    for (let i = 0; i < ends.length; i++) {
      const [ex, ey] = ends[i];
      pieces.push({ id: 'ring' + i, z: 21, d: `M${f(ex - 0.9)} ${f(ey - 0.5)}h1.8v1.8h-1.8Z`, bounds: { x0: ex - 2, y0: ey - 2, x1: ex + 2, y1: ey + 2.5 }, fill: hwC, inner: '', defs: '', mat: metalMat, bevelCm: 0.4, bevelH: 0.5, edgeAo: 0, grid: 2, contact: { dx: 0.15, dy: 0.25, sigma: 0.2, strength: 0.3 } });
    }
  }
  if (S.tassel) overlay += tassels(Curve.line([w * 0.18, yb - 0.5], [w * 0.18 + 0.02, yb - 0.5]), { count: 1, len: 7, color: HW.gold, head: '#7a5a22', rng });
  // feet studs on the base
  if (!S.round && style !== 'clutch') for (const sx of [-1, 1]) pieces.push({ id: 'foot' + sx, z: 15, d: `M${f(sx * (w / 2 - 3) - 0.6)} ${f(yb - 0.5)}h1.2v0.8h-1.2Z`, bounds: { x0: sx * (w / 2 - 3) - 2, y0: yb - 2, x1: sx * (w / 2 - 3) + 2, y1: yb + 1 }, fill: hwC, inner: '', defs: '', mat: metalMat, bevelCm: 0.3, bevelH: 0.3, edgeAo: 0, grid: 2, noCast: true, contact: false });
  const pieceFront = pieces.find((p) => p.id === 'front'); pieceFront.overlay = overlay || null;
  const bounds = unionBounds(pieces.map((p) => p.bounds).concat([{ x0: -w / 2 - 6, x1: w / 2 + 8, y0: yt - (H ? H.rise + 3 : 3), y1: 1 }]));
  return { pieces, bounds, front, S, hwC, w, h, yb, rng };
}

async function paint(ctx, model) {
  const { renderGarment } = await import('../lib/garment.mjs');
  const k = ctx.cam.k, by = ctx.cam.fwd(0, model.yb)[1];
  const layers = [];
  for (const p of model.pieces) { p.layer = await ctx.albedo(p); if (p.layer && !p.noCast) layers.push(p.layer); }
  ctx.groundShadow(layers.filter((l, i) => ['front', 'side', 'top'].includes(model.pieces.filter((p) => p.layer)[i]?.id)), { baseY: by, sx: 0.5, sy: 0.06, sigma: 0.4, strength: 0.34, wide: 2.0, wideStrength: 0.17 });
  ctx.contactEllipse(ctx.cam.fwd(0, model.yb)[0], by, model.w * k * 0.5, model.w * k * 0.045, { strength: 0.5, sigma: 0.45 * k });
  const sorted = model.pieces.slice().sort((a, b) => a.z - b.z);
  for (const p of sorted) {
    if (!p.layer) continue;
    ctx.shadeAndDraw(p.layer, { mat: p.mat, field: p.field, gain: p.gain, bevel: { sigma: (p.bevelCm ?? 0.3) * k, h: p.bevelH ?? 0.26 }, edgeAo: p.edgeAo ?? 0.12, edgeSigma: 0.5 * k, contact: p.contact, grid: p.grid });
    if (p.overlay) await ctx.vector(p.overlay, { bounds: p.bounds });
  }
}

export default {
  async front(ctx, spec) {
    const model = buildBag(ctx, spec, 'front');
    fitObject(ctx, model.bounds, { baseFrac: 0.8, maxW: 0.74, maxH: 0.66, kmax: 30 });
    await ctx.backdrop({ mode: 'surface', horizon: 0.62 });
    await paint(ctx, model);
  },
  async alt(ctx, spec) {
    const model = buildBag(ctx, spec, 'alt');
    fitObject(ctx, model.bounds, { baseFrac: 0.8, maxW: 0.74, maxH: 0.66, kmax: 30 });
    await ctx.backdrop({ mode: 'surface', horizon: 0.62, seedOffset: 3 });
    await paint(ctx, model);
  },
  async detail(ctx, spec) {
    const model = buildBag(ctx, spec, 'front');
    const S = model.S;
    const k = ctx.u * 9.5 * 2.6;
    const hasClasp = !!S.clasp;
    const fx = hasClasp ? 0 : -model.w * 0.2, fy = hasClasp ? -model.h * 0.5 : -model.h * 0.8;
    ctx.focusCamera(fx, fy, k * (hasClasp ? 1.05 : 0.95), { rot: -0.05, cx: 0.5, cy: 0.5 });
    await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.05 }, leaves: false });
    const layers = [];
    for (const p of model.pieces) { p.layer = await ctx.albedo(p); }
    const sorted = model.pieces.slice().sort((a, b) => a.z - b.z);
    ctx.wallShadow(model.pieces.map((p) => p.layer).filter(Boolean), { dx: 0.9, dy: 1.0, sigma: 0.9, strength: 0.28, ambient: 0.06, shear: 0 });
    for (const p of sorted) {
      if (!p.layer) continue;
      ctx.shadeAndDraw(p.layer, { mat: p.mat, field: p.field, gain: p.gain, bevel: { sigma: (p.bevelCm ?? 0.3) * ctx.cam.k, h: p.bevelH ?? 0.26 }, edgeAo: p.edgeAo ?? 0.12, edgeSigma: 0.5 * ctx.cam.k, contact: p.contact, grid: p.grid });
      if (p.overlay) await ctx.vector(p.overlay, { bounds: p.bounds });
    }
    ctx.setDof({ axis: 'diag', dx: 0.6, dy: 0.8, focus: 0.58, band: 0.12, falloff: 0.4, sigma: 6.5 });
  },
};
