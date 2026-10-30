// Sneaker: low / high / chunky / slip-on. Side-profile (toe left) with midsole, panels, tongue, laces, stitching.
// alt = pair arrangement, detail = macro of toe cap / laces / stitching with shallow depth of field.
import { Curve, f, lerp, clamp, polyD, tube, unionBounds, boundsOfPts, offsetPath } from '../lib/geometry.mjs';
import { FoldField } from '../lib/folds.mjs';
import { Rng } from '../lib/prng.mjs';
import { mix, darken, lighten, shadowOf, luma } from '../lib/color.mjs';
import { makeMaterial, clothPiece, stitchLine, button } from '../lib/garment.mjs';
import { fitObject, paintObjectModels } from '../lib/object.mjs';
import { FABRICS } from '../lib/fabrics.mjs';
import { Camera } from '../lib/shade.mjs';

const LEN = 28;

function build(ctx, spec, { flip = false, ox = 0, oy = 0, sc = 1, tag = '', z0 = 0 } = {}) {
  const style = spec.style || 'low';
  const high = style === 'high', chunky = style === 'chunky', slip = style === 'slip-on';
  const M = makeMaterial(ctx, spec, { fabric: spec.fabric || (spec.pattern && spec.pattern !== 'solid' ? 'cotton' : 'leather') });
  if (M.fabric === 'leather') M.mat = { ...M.mat, tex: { type: 'pebble', amp: 0.018, bump: 0.02 }, spec: 0.4, shin: 22 };
  const rng = ctx.rng.fork('sneaker' + tag);
  const c1 = spec.color || '#E8E1D4', c2 = spec.color2 || '#2B3A67', c3 = spec.color3 || mix(c2, c1, 0.5);
  const soleC = spec.soleColor || (luma(c1) < 0.3 ? '#E8E1D4' : '#F1EBE2');
  const T = (p) => [ox + (flip ? LEN - p[0] : p[0]) * sc, oy + p[1] * sc, p[2]];
  const TT = (pts) => pts.map(T);
  const th = chunky ? 5.4 : 3.2, thT = chunky ? 4.0 : 2.4;
  const hi = high ? 6.4 : 0; // extra collar height
  const pieces = [];
  const zz = (n) => z0 + n;

  // ---------------------------------------------------------------- midsole
  const sole = Curve.through(TT([[0.2, -thT - 0.3, 'c'], [0, -thT * 0.5], [0.9, -0.5], [3.6, 0], [8, 0.05], [20, 0.05], [24.6, -0.05], [27.7, -0.6], [28.2, -th * 0.55], [28.0, -th - 0.5, 'c'], [24, -th - 0.2], [14, -th + 0.15], [7, -thT - 0.3], [2.6, -thT - 0.5]]), { closed: true });
  pieces.push(clothPiece(M, { id: 'sole' + tag, z: zz(8), d: sole.d(), bounds: sole.bounds(), fill: soleC, noPattern: true, mat: { ...FABRICS.cotton, amb: 0.4, wrap: 0.2, spec: 0.2, shin: 14, tex: { type: 'grit', amp: 0.02, bump: 0.03 } }, bevelCm: 0.55 * sc, bevelH: 0.55 * sc, edgeAo: 0.12, grid: 2, contact: false,
    inner: `<path d="M${T([0.4, -1.1])[0]} ${T([0.4, -1.1])[1]}L${T([27.6, -1.1])[0]} ${T([27.6, -1.1])[1]}" stroke="#000" stroke-opacity=".12" stroke-width="${0.12 * sc}"/>` +
      Array.from({ length: 14 }, (_, i) => { const x = 3 + i * 1.7, a = T([x, -0.15]), b = T([x + 0.6, -1.1]); return `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#000" stroke-opacity=".14" stroke-width="${0.13 * sc}"/>`; }).join('') }));

  // ---------------------------------------------------------------- upper
  const topLine = slip
    ? [[0.5, -th, 'c'], [0.2, -4.4], [1.8, -6.2], [5.0, -7.6], [9.0, -8.4], [12.6, -8.8], [15.4, -8.0], [18.5, -8.6], [22, -9.6], [26.6, -10.2], [28.0, -6.4], [27.7, -th - 0.2, 'c']]
    : high
      ? [[0.5, -th, 'c'], [0.2, -4.6], [1.9, -6.3], [5.4, -7.8], [9.0, -9.8], [11.8, -12.6], [13.4, -15.0], [14.6, -16.6], [16.4, -16.0], [18.2, -14.8], [20.6, -14.4], [23.8, -15.4], [26.6, -16.0], [28.0, -10.4], [27.7, -th - 0.2, 'c']]
      : [[0.5, -th, 'c'], [0.2, -4.6], [1.9, -6.3], [5.4, -7.5], [9.0, -8.8], [11.6, -10.0], [14.0, -11.8], [14.9, -13.0], [16.3, -12.0], [17.2, -10.2], [19.2, -8.8], [22.4, -9.8], [26.4, -10.4], [28.0, -7.0], [27.7, -th - 0.2, 'c']];
  const upper = Curve.through(TT(topLine), { closed: true });
  const ub = upper.bounds();
  const gradId = ctx.id('ug');
  const ugr = `<linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>`;
  const uf = new FoldField(rng.int(1, 1e6));
  uf.blob({ u: T([8, 0])[0], v: T([0, -7])[1], ru: 6 * sc, rv: 3.5 * sc, amp: 0.7 });
  uf.ridge({ a: T([14.6, -8.4]), b: T([17.4, -5.2]), s0: 0.7 * sc, s1: 0.8 * sc, a0: 0.5, a1: 0.3, fade: 0.2 });
  uf.noise({ amp: 0.1, fu: 0.4 / sc, fv: 0.4 / sc, oct: 2 });
  const stitch = (pts, op = 0.55) => `<path d="${Curve.through(TT(pts)).d()}" fill="none" stroke="${luma(c1) > 0.5 ? '#000' : '#fff'}" stroke-opacity="${op * 0.6}" stroke-width="${0.09 * sc}" stroke-dasharray="${0.4 * sc} ${0.26 * sc}"/>`;
  let upInner = `<path d="${upper.d()}" fill="url(#${gradId})"/>`;
  // quarter / side stripe (accent, no logo): a long curved band across the midfoot
  if (!slip) {
    const bandC = Curve.through(TT([[10.6, -th - 0.1], [12.6, -5.6], [15.6, -7.2], [19.2, -7.2], [22.6, -th - 0.2]]));
    const bt = tube(bandC, 1.5 * sc, { n: 30 });
    const band = polyD([...bt.L, ...bt.R.slice().reverse()]);
    upInner += `<path d="${band}" fill="${c3}"/><path d="${band}" fill="url(#${gradId})"/>`;
  }
  // toe cap
  const cap = Curve.through(TT([[0.55, -th - 0.1, 'c'], [0.4, -4.4], [1.9, -6.0], [3.8, -6.7], [4.9, -th - 0.1, 'c']]), { closed: true });
  upInner += `<path d="${cap.d()}" fill="${c2}"/><path d="${cap.d()}" fill="url(#${gradId})"/>` + stitch([[1.0, -th - 0.6], [1.0, -4.4], [2.4, -5.7], [4.2, -th - 0.7]]);
  // heel counter
  const hc = Curve.through(TT(high ? [[22.4, -th - 0.1, 'c'], [22.6, -9.6], [24.4, -13.6], [26.6, -15.2], [27.9, -10.2], [27.7, -th - 0.1, 'c']] : [[22.8, -th - 0.1, 'c'], [23.0, -7.2], [24.6, -9.2], [26.4, -9.9], [27.9, -7.0], [27.7, -th - 0.1, 'c']]), { closed: true });
  upInner += `<path d="${hc.d()}" fill="${c2}"/><path d="${hc.d()}" fill="url(#${gradId})"/>` + stitch(high ? [[23.4, -th - 0.8], [23.6, -9.4], [25.0, -13.0], [26.4, -14.4]] : [[23.6, -th - 0.8], [23.8, -7.1], [25.0, -8.7], [26.3, -9.2]]);
  // padded collar rim
  if (!slip) upInner += `<path d="${Curve.through(TT(high ? [[16.4, -16.0], [18.2, -14.8], [20.6, -14.4], [23.8, -15.4], [26.6, -16.0]] : [[16.3, -12.0], [17.2, -10.2], [19.2, -8.8], [22.4, -9.8], [26.4, -10.4]])).d()}" fill="none" stroke="${darken(c1, 0.35)}" stroke-opacity=".55" stroke-width="${0.9 * sc}"/>`;
  // foxing line + sole stitch
  upInner += stitch([[0.6, -th - 0.6], [8, -th - 0.5], [20, -th - 0.5], [27.4, -th - 0.5]], 0.6);
  const upPiece = clothPiece(M, { id: 'upper' + tag, z: zz(9), d: upper.d(), bounds: ub, field: uf, inner: upInner, defs: ugr, bevelCm: 0.6 * sc, bevelH: 0.7 * sc, edgeAo: 0.16, grid: 2, contact: { dx: 0.3, dy: 0.5, sigma: 0.5, strength: 0.3 } });
  pieces.push(upPiece);

  // ---------------------------------------------------------------- tongue + laces
  if (!slip) {
    const tongue = Curve.through(TT(high ? [[10.8, -11.0, 'c'], [12.2, -14.6], [14.2, -17.2], [16.0, -16.4], [15.6, -12.6, 'c']] : [[11.0, -10.0, 'c'], [12.0, -13.0], [14.2, -14.4], [15.8, -13.4], [15.0, -11.0, 'c']]), { closed: true });
    pieces.push(clothPiece(M, { id: 'tongue' + tag, z: zz(9.5), d: tongue.d(), bounds: tongue.bounds(), fill: mix(c1, '#ffffff', 0.12), noPattern: true, mat: { ...FABRICS.cotton, tex: { type: 'weave', amp: 0.05, bump: 0.05 } }, bevelCm: 0.45 * sc, bevelH: 0.7 * sc, edgeAo: 0.16, grid: 2, contact: { dx: 0.3, dy: 0.5, sigma: 0.4, strength: 0.34 } }));
    const n = high ? 7 : 5;
    const lacePts = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const px = lerp(6.8, high ? 13.0 : 13.2, t), py = lerp(-8.6, high ? -14.4 : -11.2, t);
      lacePts.push([px, py]);
      const dir = i % 2 ? 1 : -1;
      const a = T([px - 1.0 * dir, py + 0.4]), b = T([px + 1.0 * dir, py - 0.45]);
      const bar = tube(Curve.through([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.15 * sc], b]), 0.6 * sc, { n: 10 });
      pieces.push(clothPiece(M, { id: 'lace' + i + tag, z: zz(11), d: polyD([...bar.L, ...bar.R.slice().reverse()]), bounds: boundsOfPts([a, b]), pad: 1, fill: '#EFEADF', noPattern: true, mat: { ...FABRICS.cotton, tex: { type: 'weave', amp: 0.06, bump: 0.06 } }, bevelCm: 0.26 * sc, bevelH: 0.4 * sc, edgeAo: 0.1, grid: 2, contact: { dx: 0.15, dy: 0.3, sigma: 0.2, strength: 0.34 } }));
    }
    // small bow
    const last = lacePts[n - 1];
    const bx = T([last[0] + 0.6, last[1] - 0.6]);
    for (const s2 of [-1, 1]) {
      const c = Curve.through([bx, [bx[0] + s2 * 0.9 * sc, bx[1] - 1.0 * sc], [bx[0] + s2 * 2.0 * sc, bx[1] - 0.5 * sc], [bx[0] + s2 * 1.3 * sc, bx[1] + 0.4 * sc], bx]);
      const tb = tube(c, 0.42 * sc, { n: 20 });
      pieces.push(clothPiece(M, { id: 'loop' + s2 + tag, z: zz(12), d: polyD([...tb.L, ...tb.R.slice().reverse()]), bounds: c.bounds(), pad: 1, fill: '#EFEADF', noPattern: true, bevelCm: 0.2 * sc, bevelH: 0.3 * sc, edgeAo: 0.1, grid: 2, contact: { dx: 0.12, dy: 0.2, sigma: 0.2, strength: 0.28 } }));
    }
  } else {
    const g = Curve.through(TT([[10.2, -8.4, 'c'], [12.2, -8.6], [13.6, -7.0], [11.4, -6.6, 'c']]), { closed: true });
    pieces.push(clothPiece(M, { id: 'gore' + tag, z: zz(10), d: g.d(), bounds: g.bounds(), fill: darken(c1, 0.3), noPattern: true, bevelCm: 0.3 * sc, bevelH: 0.4 * sc, edgeAo: 0.2, grid: 2 }));
  }
  // eyelets
  let overlay = '';
  if (!slip) for (let i = 0; i < (high ? 7 : 5); i++) { const t = i / ((high ? 7 : 5) - 1); const px = lerp(6.2, high ? 12.4 : 12.6, t), py = lerp(-8.0, high ? -13.6 : -10.6, t); const q = T([px, py + 0.4]); overlay += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(0.2 * sc)}" fill="#cfc7b5" stroke="#000" stroke-opacity=".4" stroke-width="${0.06 * sc}"/>`; }
  // heel pull tab
  const ht = T([27.7, high ? -15.0 : -9.2]);
  overlay += `<path d="M${f(ht[0])} ${f(ht[1])}q${f((flip ? -1 : 1) * 0.9 * sc)} ${f(-1.4 * sc)} ${f((flip ? -1 : 1) * 0.2 * sc)} ${f(-2.4 * sc)}" stroke="${c2}" stroke-width="${0.55 * sc}" fill="none" stroke-linecap="round"/>`;
  upPiece.overlay = overlay;
  const bounds = unionBounds(pieces.map((p) => p.bounds));
  return { pieces, bounds, baseY: oy, ox, sc, sole, soleBase: oy };
}

export default {
  async front(ctx, spec) {
    const m = build(ctx, spec, {});
    fitObject(ctx, { x0: -1, x1: LEN + 1, y0: m.bounds.y0 - 0.5, y1: 0.5 }, { baseFrac: 0.76, maxW: 0.84, maxH: 0.5, kmax: 40 });
    await ctx.backdrop({ mode: 'surface', horizon: 0.58 });
    await paintObjectModels(ctx, [m]);
  },
  async alt(ctx, spec) {
    const near = build(ctx, spec, { flip: false, ox: 0, oy: 0, sc: 1, tag: 'a' });
    // a catalogue pair: both shoes in profile facing the same way, the second one tucked behind and a little further back
    const far = build(ctx, { ...spec, seed: (spec.seed | 0) + 1 }, { ox: 12, oy: -3.8, sc: 0.965, tag: 'b' });
    fitObject(ctx, { x0: -1, x1: 40.6, y0: Math.min(near.bounds.y0, far.bounds.y0) - 0.5, y1: 0.5 }, { baseFrac: 0.78, maxW: 0.86, maxH: 0.5, kmax: 30 });
    await ctx.backdrop({ mode: 'surface', horizon: 0.6, seedOffset: 3 });
    await paintObjectModels(ctx, [far, near]);
  },
  async detail(ctx, spec) {
    const m = build(ctx, spec, {});
    const k = ctx.u * 9.5 * 5.2;
    ctx.focusCamera(4.0, -6.4, k, { rot: -0.06, cx: 0.45, cy: 0.52 });
    await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.05 }, leaves: false });
    await paintObjectModels(ctx, [m]);
    ctx.setDof({ axis: 'diag', dx: 0.7, dy: 0.7, focus: 0.5, band: 0.1, falloff: 0.4, sigma: 7 });
  },
};
