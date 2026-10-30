// Heel: stiletto / block / kitten / platform / mule. Side profile (toe left) standing on the table.
import { Curve, f, lerp, clamp, polyD, tube, unionBounds, boundsOfPts } from '../lib/geometry.mjs';
import { FoldField } from '../lib/folds.mjs';
import { Rng } from '../lib/prng.mjs';
import { mix, darken, lighten, shadowOf, luma } from '../lib/color.mjs';
import { makeMaterial, clothPiece } from '../lib/garment.mjs';
import { fitObject, paintObjectModels } from '../lib/object.mjs';
import { FABRICS } from '../lib/fabrics.mjs';

const STY = {
  stiletto: { H: 10.4, P: 0, shaft: [3.3, 1.0] },
  block: { H: 7.6, P: 0, shaft: [5.6, 4.6] },
  kitten: { H: 4.6, P: 0, shaft: [3.2, 1.3] },
  platform: { H: 11.0, P: 3.0, shaft: [3.6, 1.2] },
  mule: { H: 6.8, P: 0, shaft: [5.4, 4.4], mule: true },
};

function build(ctx, spec, { flip = false, ox = 0, oy = 0, sc = 1, tag = '' } = {}) {
  const style = STY[spec.style] ? spec.style : 'stiletto';
  const S = STY[style];
  const { H, P } = S;
  const L = 22;
  const T = (p) => [ox + (flip ? L - p[0] : p[0]) * sc, oy + p[1] * sc, p[2]];
  const TT = (pts) => pts.map(T);
  const M = makeMaterial(ctx, spec, { fabric: spec.fabric || 'leather' });
  if (M.fabric === 'leather') M.mat = { ...M.mat, tex: { type: 'pebble', amp: 0.012, bump: 0.012 }, spec: 0.5, shin: 28 };
  const rng = ctx.rng.fork('heel' + tag);
  const c1 = spec.color || '#8B2E3C';
  const soleC = spec.soleColor || '#C9A27A';
  const pieces = [];
  // sole line: y of the foot-bed underside as a function of x (flat under the ball, rising to the heel seat)
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const ySole = (x) => -P - (H - P) * Math.pow(ss(7.2, 17.0, x), 1.08) - (x < 2.6 ? (2.6 - x) * 0.42 : 0);
  const seatX0 = 16.4, seatX1 = 22.0;
  // ---- heel shaft (side view): top spans the seat, tapering towards the ground
  const [wt, wb] = S.shaft;
  const sx1 = seatX1 - 0.2, sx0 = sx1 - wt;
  const bx0 = sx0 + (wt - wb) * 0.7, bx1 = bx0 + wb;
  const shaft = Curve.through(TT([[sx0, -H + 0.3, 'c'], [sx1, -H + 0.3, 'c'], [lerp(sx1, bx1, 0.5) + 0.1, -H * 0.5], [bx1, -0.5], [bx1 - 0.05, 0, 'c'], [bx0 + 0.05, 0, 'c'], [bx0, -0.5], [lerp(sx0, bx0, 0.5) - (style === 'stiletto' ? 0.35 : 0.1), -H * 0.5]]), { closed: true });
  pieces.push(clothPiece(M, { id: 'shaft' + tag, z: 6, d: shaft.d(), bounds: shaft.bounds(), fill: spec.heelColor || c1, noPattern: true, mat: { ...M.mat, spec: 0.7, shin: 34 }, bevelCm: Math.max(0.5, wb * 0.45) * sc, bevelH: Math.max(0.6, wb * 0.5) * sc, edgeAo: 0.1, grid: 2, contact: { dx: 0.2, dy: 0.3, sigma: 0.25, strength: 0.3 } }));
  pieces.push({ id: 'tip' + tag, z: 7, d: Curve.through(TT([[bx0 + 0.02, -0.8, 'c'], [bx1 - 0.02, -0.8, 'c'], [bx1, 0, 'c'], [bx0, 0, 'c']]), { closed: true }).d(), bounds: { x0: ox + (flip ? L - bx1 : bx0) * sc - 1, y0: oy - 2, x1: ox + (flip ? L - bx0 : bx1) * sc + 1, y1: oy + 1 }, fill: '#2a2624', inner: '', defs: '', mat: { ...FABRICS.cotton, spec: 0.1, shin: 8, tex: { type: 'none', amp: 0, bump: 0 } }, bevelCm: 0.15, bevelH: 0.2, edgeAo: 0, grid: 2, contact: false });
  // ---- platform / sole slab
  const sx = [0.1, 0.9, 2.6, 5, 7.2, 9.6, 12.2, 14.8, 17.0, seatX1];
  const soleTop = sx.map((x) => [x, ySole(x) - 0.75]);
  const soleBot = sx.map((x) => [x, ySole(x)]);
  const sole = Curve.through(TT([[0.1, ySole(0.1) - 0.7, 'c'], ...soleBot.slice(1, -1), [seatX1, -H + 0.3, 'c'], [seatX1, -H - 0.5, 'c'], ...soleTop.slice(1, -1).reverse()]), { closed: true });
  pieces.push(clothPiece(M, { id: 'sole' + tag, z: 8, d: sole.d(), bounds: sole.bounds(), fill: soleC, noPattern: true, mat: { ...FABRICS.leather, spec: 0.25, shin: 14, tex: { type: 'none', amp: 0, bump: 0 } }, bevelCm: 0.3 * sc, bevelH: 0.35 * sc, edgeAo: 0.1, grid: 2, contact: false }));
  if (P > 0) {
    const plat = Curve.through(TT([[0.2, ySole(0.2) - 0.1, 'c'], [0.1, -P * 0.5], [0.6, 0, 'c'], [8.6, 0, 'c'], [8.9, -P * 0.5], [8.4, -P - 0.1, 'c']]), { closed: true });
    pieces.push(clothPiece(M, { id: 'platform' + tag, z: 7.5, d: plat.d(), bounds: plat.bounds(), fill: mix(c1, '#c9a27a', 0.55), noPattern: true, mat: { ...M.mat, spec: 0.3, shin: 16 }, bevelCm: 0.4 * sc, bevelH: 0.5 * sc, edgeAo: 0.12, grid: 2, contact: { dx: 0.2, dy: 0.3, sigma: 0.3, strength: 0.3 } }));
  }
  // ---- upper
  const gid = ctx.id('hg');
  const gr = `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>`;
  const yb = (x) => ySole(x) - 0.75; // upper sits on the foot bed
  let upPts;
  if (S.mule) {
    upPts = [[0.2, yb(0.2), 'c'], [0.1, yb(0.2) - 1.3], [1.4, -P - 3.2], [4.0, -P - 4.0], [7.0, -P - 3.8], [8.4, -P - 2.2], [8.2, yb(8.2), 'c'], [5, yb(5)], [2.6, yb(2.6)]];
  } else {
    const tl = (x, dy) => [x, ySole(x) - dy];
    upPts = [[0.2, yb(0.2), 'c'], [0.1, yb(0.2) - 1.2], [1.5, -P - 3.0], [4.6, -P - 4.1], [8.4, -P - 4.4], tl(11.2, 3.4), tl(13.8, 2.7), tl(16.2, 2.5), [18.6, -H - 2.2], [20.6, -H - 3.2], [21.9, -H - 1.8], [22.0, -H + 0.2, 'c'], [seatX0 + 0.4, -H + 0.3, 'c'], [14.4, yb(14.4)], [10.4, yb(10.4)], [6.2, yb(6.2)], [2.8, yb(2.8)]];
  }
  const upper = Curve.through(TT(upPts), { closed: true });
  const uf = new FoldField(rng.int(1, 1e6));
  uf.blob({ u: T([5, 0])[0], v: T([0, -P - 3.4])[1], ru: 4.5 * sc, rv: 2 * sc, amp: 0.6 });
  uf.noise({ amp: 0.06, fu: 0.4 / sc, fv: 0.4 / sc, oct: 2 });
  let inner = `<path d="${upper.d()}" fill="url(#${gid})"/>`;
  // lining edge along the topline (a lighter inside seen at the throat)
  if (!S.mule) inner += `<path d="${Curve.through(TT([[8.4, -P - 4.4], [11.2, ySole(11.2) - 3.4], [13.8, ySole(13.8) - 2.7], [16.2, ySole(16.2) - 2.5], [18.6, -H - 2.2], [20.6, -H - 3.2]])).d()}" fill="none" stroke="${lighten(c1, 0.35)}" stroke-opacity=".7" stroke-width="${0.35 * sc}"/>`;
  else inner += `<path d="${Curve.through(TT([[1.0, -P - 3.0], [4.0, -P - 4.0], [7.0, -P - 3.7]])).d()}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="${0.25 * sc}"/>`;
  pieces.push(clothPiece(M, { id: 'upper' + tag, z: 9, d: upper.d(), bounds: upper.bounds(), field: uf, inner, defs: gr, bevelCm: 0.55 * sc, bevelH: 0.65 * sc, edgeAo: 0.14, grid: 2, contact: { dx: 0.3, dy: 0.5, sigma: 0.5, strength: 0.3 } }));
  // mule vamp band + footbed
  if (S.mule) {
    const fb = Curve.through(TT([[8.2, yb(8.2), 'c'], [10.4, yb(10.4)], [14.4, yb(14.4)], [seatX0 + 0.4, -H + 0.3, 'c'], [seatX1 - 0.2, -H - 0.4, 'c'], [seatX1 - 0.2, -H - 1.3], [14.4, yb(14.4) - 1.0], [10.4, yb(10.4) - 1.0]]), { closed: true });
    pieces.push(clothPiece(M, { id: 'footbed' + tag, z: 8.5, d: fb.d(), bounds: fb.bounds(), fill: mix(soleC, c1, 0.2), noPattern: true, bevelCm: 0.25 * sc, bevelH: 0.3 * sc, edgeAo: 0.15, grid: 2, contact: false }));
  }
  const bounds = unionBounds(pieces.map((p) => p.bounds));
  return { pieces, bounds, baseY: oy, sc, contactScale: 0.8 };
}

export default {
  async front(ctx, spec) {
    const m = build(ctx, spec, {});
    fitObject(ctx, { x0: -1, x1: 24, y0: m.bounds.y0 - 0.5, y1: 0.5 }, { baseFrac: 0.78, maxW: 0.8, maxH: 0.55, kmax: 42 });
    await ctx.backdrop({ mode: 'surface', horizon: 0.6 });
    await paintObjectModels(ctx, [m], { shadowIds: ['sole', 'upper', 'shaft', 'platform'] });
  },
  async alt(ctx, spec) {
    // a catalogue pair: both shoes in profile facing the same way, the second one tucked behind and a little further back
    const a = build(ctx, spec, { ox: 0, oy: 0, sc: 1, tag: 'a' });
    const b = build(ctx, { ...spec, seed: (spec.seed | 0) + 1 }, { ox: 10.5, oy: -3.6, sc: 0.965, tag: 'b' });
    fitObject(ctx, { x0: -1, x1: 33.6, y0: Math.min(a.bounds.y0, b.bounds.y0) - 0.5, y1: 0.5 }, { baseFrac: 0.8, maxW: 0.84, maxH: 0.55, kmax: 38 });
    await ctx.backdrop({ mode: 'surface', horizon: 0.6, seedOffset: 3 });
    await paintObjectModels(ctx, [b, a], { shadowIds: ['sole', 'upper', 'shaft', 'platform'] });
  },
  async detail(ctx, spec) {
    const m = build(ctx, spec, {});
    const k = ctx.u * 9.5 * 4.4;
    ctx.focusCamera(5, -(STY[spec.style]?.P || 0) - 4.4, k, { rot: -0.05, cx: 0.45, cy: 0.52 });
    await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.05 }, leaves: false });
    await paintObjectModels(ctx, [m], { shadowIds: ['sole', 'upper', 'shaft', 'platform'] });
    ctx.setDof({ axis: 'diag', dx: 0.7, dy: 0.7, focus: 0.5, band: 0.1, falloff: 0.4, sigma: 7 });
  },
};
