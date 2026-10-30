// Ankle boot (chelsea style) and flat (loafer / ballet / jutti / sandal-ish): side profile, toe left, standing on a surface.
// Same construction as heel.mjs: sole slab + heel block + leather upper with stitching, built from smooth outlines.
import { Curve, f, lerp, clamp, polyD, unionBounds } from '../lib/geometry.mjs';
import { FoldField } from '../lib/folds.mjs';
import { mix, darken, lighten, luma } from '../lib/color.mjs';
import { makeMaterial, clothPiece } from '../lib/garment.mjs';
import { fitObject, paintObjectModels } from '../lib/object.mjs';
import { FABRICS } from '../lib/fabrics.mjs';

const L = 25;

function shoe(ctx, spec, kind, { flip = false, ox = 0, oy = 0, sc = 1, tag = '' } = {}) {
  const boot = kind === 'boot';
  const style = spec.style || (boot ? 'chelsea' : 'loafer');
  const men = spec.gender === 'men';
  const kids = !!spec.kids;
  const T = (p) => [ox + (flip ? L - p[0] : p[0]) * sc, oy + p[1] * sc, p[2]];
  const TT = (pts) => pts.map(T);
  const M = makeMaterial(ctx, spec, { fabric: spec.fabric || 'leather' });
  if (M.fabric === 'leather') M.mat = { ...M.mat, tex: { type: 'pebble', amp: 0.012, bump: 0.012 }, spec: 0.5, shin: 26 };
  const rng = ctx.rng.fork('shoe' + tag);
  const c1 = spec.color || (boot ? '#1C1A19' : '#6B3A1E');
  const dark = luma(c1) < 0.2;
  const soleC = spec.soleColor || (boot ? (dark ? '#2C2826' : darken(c1, 0.45)) : (style === 'ballet' || style === 'jutti' ? mix(c1, '#c9a27a', 0.4) : darken(c1, 0.35)));
  const H = boot ? 4.4 : style === 'ballet' || style === 'jutti' || style === 'slide' ? 0.9 : 2.3; // heel lift
  const th = boot ? 1.7 : 1.2; // sole thickness
  const pieces = [];
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const ySole = (x) => -(H - 0.6) * ss(8, 18.5, x) - (x < 2.4 ? (2.4 - x) * 0.3 : 0);
  // ---- sole slab (a thick rubber / leather sole that rises under the heel)
  const xs = [0.1, 1.0, 2.8, 5.2, 8, 11, 14.2, 17.4, 20.4, 22.6, 23.6];
  const solTop = xs.map((x) => [x, ySole(x) - th]), solBot = xs.map((x) => [x, ySole(x)]);
  const sole = Curve.through(TT([[0.1, ySole(0.1) - th * 0.9, 'c'], ...solBot.slice(1, -1), [23.7, -H + 0.2, 'c'], [23.7, -H - th, 'c'], ...solTop.slice(1, -1).reverse()]), { closed: true });
  pieces.push(clothPiece(M, { id: 'sole' + tag, z: 8, d: sole.d(), bounds: sole.bounds(), fill: soleC, noPattern: true, mat: { ...FABRICS.leather, spec: 0.3, shin: 16, tex: { type: 'none', amp: 0, bump: 0 } }, bevelCm: th * 0.42 * sc, bevelH: 0.5, edgeAo: 0.12, grid: 2, contact: { dx: 0.3, dy: 0.5, sigma: 0.45, strength: 0.34 } }));
  // heel block under the sole (boot / loafer heel)
  if (H > 1.2) {
    const hb = Curve.through(TT([[17.4, ySole(17.4) - 0.1, 'c'], [23.6, -H + 0.4, 'c'], [23.7, -0.35], [23.2, 0, 'c'], [18.6, 0, 'c'], [17.8, -0.5]]), { closed: true });
    pieces.push(clothPiece(M, { id: 'shaft' + tag, z: 7, d: hb.d(), bounds: hb.bounds(), fill: soleC, noPattern: true, mat: { ...FABRICS.leather, spec: 0.35, shin: 18, tex: { type: 'none', amp: 0, bump: 0 } }, bevelCm: 0.5 * sc, bevelH: 0.6, edgeAo: 0.1, grid: 2, contact: { dx: 0.3, dy: 0.4, sigma: 0.4, strength: 0.3 } }));
  }
  // ---- upper
  const yb = (x) => ySole(x) - th;
  let up;
  if (boot) {
    const top = style === 'ankle' ? -15.6 : -16.4;
    up = [[0.3, yb(0.3), 'c'], [0.1, yb(0.3) - 1.5], [1.1, -3.9], [3.4, -5.3], [6.6, -5.9], [9.6, -7.0], [12.0, -10.6], [13.0, top + 1.6], [13.4, top, 'c'], [23.2, top + 0.2, 'c'], [23.7, top * 0.62],
      [23.4, -H - th - 3.2], [23.6, yb(23.4) + 0.1, 'c'], [20, yb(20)], [14, yb(14)], [8, yb(8)], [3, yb(3)]];
  } else if (style === 'ballet' || style === 'jutti') {
    up = [[0.3, yb(0.3), 'c'], [0.1, yb(0.3) - 1.4], [1.0, -2.9], [3.2, -3.9], [6.0, -4.0], [8.8, -3.5], [11.5, -2.9, 'c'], [18.5, -3.2, 'c'], [20.8, -3.0], [22.6, -3.3], [23.4, yb(23.4) + 0.1, 'c'], [20, yb(20)], [14, yb(14)], [8, yb(8)], [3, yb(3)]];
  } else {
    // loafer: low vamp, open throat, small stacked heel counter
    up = [[0.3, yb(0.3), 'c'], [0.1, yb(0.3) - 1.6], [1.3, -4.0], [4.0, -5.3], [7.0, -6.0], [9.6, -5.9], [11.6, -5.2, 'c'], [17.0, -5.4, 'c'], [20.6, -6.4], [22.8, -7.9], [23.5, -6.8], [23.6, yb(23.4) + 0.1, 'c'], [20, yb(20)], [14, yb(14)], [8, yb(8)], [3, yb(3)]];
  }
  const upper = Curve.through(TT(up), { closed: true });
  const uf = new FoldField(rng.int(1, 1e6));
  uf.blob({ u: T([5, 0])[0], v: T([0, -4])[1], ru: 4.5 * sc, rv: 2 * sc, amp: 0.5 });
  uf.noise({ amp: 0.07, fu: 0.4 / sc, fv: 0.4 / sc, oct: 2 });
  if (boot) uf.band({ v: T([0, -6.2])[1], w: 1.0 * sc, amp: 0.12, u0: T([9, 0])[0], u1: T([14.5, 0])[0] });
  const gid = ctx.id('fg');
  const gr = `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>`;
  let inner = `<path d="${upper.d()}" fill="url(#${gid})"/>`;
  const P = (pts) => Curve.through(TT(pts)).d();
  const stitch = (pts) => `<path d="${P(pts)}" fill="none" stroke="${lighten(c1, dark ? 0.55 : 0.4)}" stroke-opacity=".75" stroke-width="${0.12 * sc}" stroke-dasharray="${0.38 * sc} ${0.26 * sc}"/>`;
  const seam = (pts, o = 0.4) => `<path d="${P(pts)}" fill="none" stroke="#000" stroke-opacity="${o}" stroke-width="${0.16 * sc}"/>`;
  if (boot) {
    // toe cap seam + stitch, elastic gusset, heel counter seam, pull tab loop (drawn as part of the upper's inner so it clips cleanly)
    inner += seam([[3.2, -5.3], [4.0, -3.6], [3.5, -1.2]]) + stitch([[2.6, -5.0], [3.3, -3.6], [2.9, -1.4]]);
    const gus = `${P([[13.8, -6.2], [15.2, -8.4], [14.6, -13.6]])}`;
    // elastic gusset: a narrower ribbed panel with a curved foot, set into the quarter
    const gp = [[15.9, -6.3], [20.7, -6.3], [20.5, -12.7], [16.3, -13.1]];
    inner += `<path d="M${gp.map((q) => { const t = T(q); return f(t[0]) + ' ' + f(t[1]); }).join('L')}Z" fill="#000" fill-opacity=".24"/>`;
    for (let i = 0; i < 7; i++) { const x = 16.5 + i * 0.62; inner += `<path d="M${f(T([x, -6.6])[0])} ${f(T([x, -6.6])[1])}L${f(T([x + 0.1, -12.6])[0])} ${f(T([x + 0.1, -12.6])[1])}" stroke="#000" stroke-opacity=".26" stroke-width="${0.07 * sc}"/>`; }
    inner += seam([[15.8, -6.2], [16.0, -9.5], [16.3, -13.1]], 0.45) + seam([[20.8, -6.2], [20.7, -9.5], [20.5, -12.8]], 0.45);
    inner += seam([[18.6, yb(18.6) - 2.8], [21.0, -6.6], [22.4, -8.5]], 0.25);
    inner += `<path d="M${f(T([13.4, -15.0])[0])} ${f(T([13.4, -15.0])[1])}L${f(T([23.2, -15.0])[0])} ${f(T([23.2, -15.0])[1])}" stroke="#000" stroke-opacity=".28" stroke-width="${0.14 * sc}"/>`;
  } else {
    inner += seam([[3.4, -4.3], [4.4, -3.0], [3.7, -1.0]], 0.34) + stitch([[2.7, -4.1], [3.6, -3.0], [3.0, -1.2]]);
    if (style === 'loafer') inner += `<path d="M${f(T([6.2, -5.1])[0])} ${f(T([6.2, -5.1])[1])}L${f(T([6.6, -2.2])[0])} ${f(T([6.6, -2.2])[1])}M${f(T([8.6, -5.1])[0])} ${f(T([8.6, -5.1])[1])}L${f(T([9.0, -2.6])[0])} ${f(T([9.0, -2.6])[1])}" stroke="#000" stroke-opacity=".32" stroke-width="${0.12 * sc}"/>` +
      stitch([[11.2, -4.4], [14, -4.6], [17, -4.7]]);
    if (style === 'ballet' || style === 'jutti') inner += stitch([[11.0, -2.9], [15, -3.2], [20, -3.1]]);
  }
  pieces.push(clothPiece(M, { id: 'upper' + tag, z: 9, d: upper.d(), bounds: upper.bounds(), field: uf, inner, defs: gr, bevelCm: 0.55 * sc, bevelH: 0.6, edgeAo: 0.14, grid: 2, contact: { dx: 0.3, dy: 0.5, sigma: 0.5, strength: 0.3 } }));
  // lining visible through the open throat (flat / loafer) and the saddle strap
  if (!boot && style !== 'ballet' && style !== 'jutti') {
    const lin = Curve.through(TT([[11.6, -5.2, 'c'], [14.5, -5.5], [17.0, -5.4, 'c'], [20.6, -6.4, 'c'], [17.4, -4.2], [13.5, -4.0]]), { closed: true });
    pieces.push(clothPiece(M, { id: 'lining' + tag, z: 8.8, d: lin.d(), bounds: lin.bounds(), fill: darken(c1, 0.55), noPattern: true, gain: 0.7, bevelCm: 0.2 * sc, bevelH: 0.3, edgeAo: 0.3, grid: 2, contact: false, noCast: true }));
    if (style === 'loafer') {
      const strap = Curve.through(TT([[5.4, -5.1, 'c'], [10.4, -5.1, 'c'], [10.9, -3.2, 'c'], [5.9, -2.6, 'c']]), { closed: true });
      pieces.push(clothPiece(M, { id: 'strap' + tag, z: 9.5, d: strap.d(), bounds: strap.bounds(), fill: mix(c1, '#000', 0.04), inner: `<path d="M${f(T([7.0, -3.6])[0])} ${f(T([7.0, -3.6])[1])}h${f(3.6 * sc)}" stroke="#000" stroke-opacity=".5" stroke-width="${0.45 * sc}" stroke-linecap="round"/>`, bevelCm: 0.35 * sc, bevelH: 0.5, edgeAo: 0.15, grid: 2, contact: { dx: 0.2, dy: 0.35, sigma: 0.3, strength: 0.3 } }));
    }
  }
  if (boot) { // pull tab at the back of the shaft
    const top = style === 'ankle' ? -15.6 : -16.4;
    const tab = Curve.through(TT([[20.9, top + 0.3, 'c'], [21.2, top - 2.7], [22.7, top - 2.9], [22.8, top + 0.3, 'c'], [22.2, top + 0.3], [22.1, top - 1.7], [21.7, top - 1.7], [21.6, top + 0.3, 'c']]), { closed: true });
    pieces.push(clothPiece(M, { id: 'tab' + tag, z: 8.6, d: tab.d(), bounds: tab.bounds(), fill: c1, noPattern: true, bevelCm: 0.2 * sc, bevelH: 0.4, edgeAo: 0.1, grid: 2, contact: { dx: 0.2, dy: 0.3, sigma: 0.3, strength: 0.3 } }));
  }
  const bounds = unionBounds(pieces.map((p) => p.bounds));
  return { pieces, bounds, baseY: oy, sc, contactScale: 0.8 };
}

function make(kind) {
  const ids = ['sole', 'upper', 'shaft', 'strap'];
  const top = kind === 'boot' ? -19.5 : -9;
  return {
    async front(ctx, spec) {
      const m = shoe(ctx, spec, kind, {});
      fitObject(ctx, { x0: -1, x1: L, y0: Math.min(m.bounds.y0, top) - 0.5, y1: 0.5 }, { baseFrac: 0.78, maxW: 0.78, maxH: 0.55, kmax: 40 });
      await ctx.backdrop({ mode: 'surface', horizon: 0.6 });
      await paintObjectModels(ctx, [m], { shadowIds: ids });
    },
    async alt(ctx, spec) {
      const a = shoe(ctx, spec, kind, { tag: 'a' });
      const b = shoe(ctx, { ...spec, seed: (spec.seed | 0) + 1 }, kind, { ox: 11, oy: -3.4, sc: 0.965, tag: 'b' });
      fitObject(ctx, { x0: -1, x1: L + 12, y0: Math.min(a.bounds.y0, b.bounds.y0) - 0.5, y1: 0.5 }, { baseFrac: 0.78, maxW: 0.84, maxH: 0.55, kmax: 36 });
      await ctx.backdrop({ mode: 'surface', horizon: 0.6, seedOffset: 3 });
      await paintObjectModels(ctx, [b, a], { shadowIds: ids });
    },
    async detail(ctx, spec) {
      const m = shoe(ctx, spec, kind, {});
      const k = ctx.u * 9.5 * (kind === 'boot' ? 4.4 : 5.4);
      ctx.focusCamera(kind === 'boot' ? 12 : 6.5, kind === 'boot' ? -9 : -3.4, k, { rot: -0.05, cx: 0.5, cy: 0.52 });
      await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.05 }, leaves: false });
      await paintObjectModels(ctx, [m], { shadowIds: ids });
      ctx.setDof({ axis: 'diag', dx: 0.7, dy: 0.7, focus: 0.5, band: 0.2, falloff: 0.4, sigma: 5.5 });
    },
  };
}

export const boot = make('boot');
export const flat = make('flat');
