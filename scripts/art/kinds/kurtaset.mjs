// Kurta set: a kurta on a hanger with its matching bottom (palazzo / churidar / pant) continuing below the hem and,
// for women's sets, a dupatta draped diagonally over the shoulder. alt = back view, detail = macro of neck / hem / print.
import { Curve, f, lerp, polyD, tube, unionBounds } from '../lib/geometry.mjs';
import { FoldField } from '../lib/folds.mjs';
import { mix, darken, lighten } from '../lib/color.mjs';
import { clothPiece, makeMaterial, renderGarment } from '../lib/garment.mjs';
import { Camera } from '../lib/shade.mjs';
import { buildUpper, upperDetail } from '../lib/upper.mjs';
import { WAIST_Y } from '../lib/lower.mjs';
import { kurtaProfile } from './kurta.mjs';
import { buildTrousers } from './trousers.mjs';

const BOTTOM = { palazzo: { leg: 'palazzo' }, churidar: { leg: 'tapered', ruched: true }, pant: { leg: 'straight' } };
const HANGER = /^(hanger|hook|peg|clip)/;

function dupatta(ctx, spec, K) {
  const M = makeMaterial(ctx, { ...spec, color: spec.color2 && spec.color2 !== spec.color ? spec.color2 : lighten(spec.color, 0.34), pattern: 'solid' }, { fabric: 'chiffon' });
  const ST = K.ST, rng = ctx.rng.fork('dup');
  const c = Curve.through([[-ST[0] + 3.2, ST[1] - 0.6], [-ST[0] * 0.42, 22], [ST[0] * 0.1, 44], [ST[0] * 0.36, K.hemV * 0.78]]);
  const { L, R } = tube(c, 11, { n: 40 });
  const d = polyD([...L, ...R.slice().reverse()]);
  const fld = new FoldField(rng.int(1, 1e6));
  fld.curveRidge({ curve: c, type: 'gauss', s: () => 4.5, a: () => 1.1, fade0: 0.05, fade1: 0.05 });
  for (let i = 0; i < 3; i++) fld.curveRidge({ curve: c, off: () => (i - 1) * 0.26 * 11, s: () => 1.2, a: (u) => (i % 2 ? 1 : -1) * (0.2 + 0.5 * u), fade0: 0.2, fade1: 0.05 });
  fld.noise({ amp: 0.16, fu: 0.2, fv: 0.1, oct: 2 });
  const gold = '#C9A24A';
  const inner = `<path d="${polyD(L, false)}" fill="none" stroke="${gold}" stroke-width=".5" opacity=".9"/><path d="${polyD(R, false)}" fill="none" stroke="${gold}" stroke-width=".5" opacity=".9"/>`;
  const b = c.bounds();
  return clothPiece(M, { id: 'dupatta', z: 20, d, bounds: { x0: b.x0 - 8, y0: b.y0 - 8, x1: b.x1 + 8, y1: b.y1 + 8 }, field: fld, inner, bevelCm: 0.3, bevelH: 0.3, edgeAo: 0.14, grid: 4, contact: { dx: 0.4, dy: 0.7, sigma: 0.5, strength: 0.34 } });
}

function build(ctx, spec, shot) {
  const men = spec.gender === 'men', kids = !!spec.kids;
  const kspec = { ...spec, kind: 'kurta' };
  const K = buildUpper(ctx, kspec, shot, kurtaProfile(ctx, kspec, shot));
  const bo = BOTTOM[spec.bottom] || BOTTOM.pant;
  const bcol = spec.bottomColor || (spec.color2 && luma2(spec.color2) && men ? mix(spec.color, '#fff', 0.1) : mix(spec.color, '#000', 0.05));
  const bspec = { ...spec, kind: 'trousers', leg: bo.leg, ruched: bo.ruched, length: 'ankle', pattern: 'solid', color: bcol, trim: 'none', pleats: false, fabric: spec.fabric === 'silk' ? 'silk' : 'cotton' };
  const B = buildTrousers(ctx, bspec, shot);
  const dyB = K.hemV * (kids ? 0.4 : 0.42) - WAIST_Y;
  const bpieces = B.pieces.filter((p) => !HANGER.test(p.id));
  const top = K.pieces.slice();
  if (!men && !kids && shot !== 'alt') top.push(dupatta(ctx, spec, K));
  const bb = unionBounds(bpieces.map((p) => p.bounds));
  const bounds = unionBounds([K.bounds, { x0: bb.x0, x1: bb.x1, y0: bb.y0 + dyB, y1: bb.y1 + dyB }]);
  return { K, top, bpieces, dyB, bounds, nk: K.nk, ST: K.ST, hemV: K.hemV, hasPlacket: K.hasPlacket, hw: K.hw, M: K.M };
}
const luma2 = () => false;

async function paint(ctx, m, wall) {
  const c0 = ctx.cam;
  const [x0, y0] = c0.fwd(0, 0), [x1, y1] = c0.fwd(0, m.dyB);
  ctx.cam = new Camera({ k: c0.k, tx: c0.tx + (x1 - x0), ty: c0.ty + (y1 - y0), rot: c0.rot });
  await renderGarment(ctx, { pieces: m.bpieces }, { wall });
  ctx.cam = c0;
  await renderGarment(ctx, { pieces: m.top }, { wall });
}

export default {
  async front(ctx, spec) {
    const m = build(ctx, spec, 'front');
    ctx.fitCamera(m.bounds, { mx: 0.1, top: 0.05, bottom: 0.06, kmax: 8.6 * (spec.kids ? 1.45 : 1) });
    await ctx.backdrop({ mode: 'wall' });
    await paint(ctx, m);
  },
  async alt(ctx, spec) {
    const m = build(ctx, spec, 'alt');
    ctx.fitCamera(m.bounds, { mx: 0.1, top: 0.05, bottom: 0.06, kmax: 8.6 * (spec.kids ? 1.45 : 1) });
    await ctx.backdrop({ mode: 'wall', seedOffset: 3 });
    await paint(ctx, m);
  },
  async detail(ctx, spec) {
    const m = build(ctx, spec, 'front');
    const rng = ctx.rng.fork('detail');
    const t = upperDetail(m.K, ctx, spec, rng);
    ctx.focusCamera(t.u, t.v, ctx.u * 9.5 * t.zoom, { rot: t.rot ?? rng.range(-0.05, 0.05), cx: t.cx ?? 0.5, cy: t.cy ?? 0.5 });
    await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.05 }, leaves: false });
    await paint(ctx, { ...m, top: m.K.pieces }, { dx: 1.2, dy: 1.6, sigma: 1.1 });
    ctx.setDof(t.dof || { axis: 'diag', dx: 0.6, dy: 0.8, focus: 0.62, band: 0.14, falloff: 0.4, sigma: 6.5 });
  },
};
