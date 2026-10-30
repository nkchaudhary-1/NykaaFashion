// Cushion: piped / tasselled / tufted. Upright against the wall on a table. alt = two-cushion arrangement, detail = macro.
import { Curve, f, lerp, clamp, bandPath, polyD, unionBounds } from '../lib/geometry.mjs';
import { FoldField } from '../lib/folds.mjs';
import { Rng } from '../lib/prng.mjs';
import { mix, darken, lighten, shadowOf } from '../lib/color.mjs';
import { makeMaterial, clothPiece, button } from '../lib/garment.mjs';
import { fitObject } from '../lib/object.mjs';
import { tassels } from '../lib/trims.mjs';
import { Camera } from '../lib/shade.mjs';

function outlineCurve(a, rng, { n = 5.2, ears = 0.04, sag = 0.5 } = {}) {
  const pts = [];
  const N = 72;
  const ph = rng.range(0, 6.28);
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const c = Math.abs(Math.cos(t)), s = Math.abs(Math.sin(t));
    let r = a / Math.pow(Math.pow(c, n) + Math.pow(s, n), 1 / n);
    r *= 1 + ears * Math.pow(Math.abs(Math.sin(2 * t)), 6) + 0.012 * Math.sin(t * 3 + ph);
    let x = Math.cos(t) * r, y = Math.sin(t) * r;
    // top edge sags a little (leaning cushion), bottom is flatter where it sits on the table
    if (y < 0) y += sag * Math.exp(-Math.pow(x / (a * 0.7), 2)) * 1.2;
    pts.push([x, y]);
  }
  return Curve.through(pts, { closed: true });
}

const tuftedFirst = (st) => st === 'tufted';
function buildCushion(ctx, spec, { a = 22, cxOff = 0, tilt = 0, seedOff = 0, over = {} } = {}) {
  const sp = { scale: 0.72, ...spec, ...over };
  const style = sp.style || 'piped';
  const M = makeMaterial(ctx, sp, { fabric: sp.fabric || (sp.pattern && sp.pattern !== 'solid' ? 'cotton' : 'velvet') });
  const rng = ctx.rng.fork('cushion' + seedOff);
  const fabAmp = M.mat.foldAmp ?? 1, wr = M.mat.wrink ?? 0.5;
  const oc = outlineCurve(a, rng);
  const b = oc.bounds();
  const field = new FoldField(rng.int(1, 1e6));
  field.blob({ u: 0, v: 0, ru: a * 0.9, rv: a * 0.9, amp: tuftedFirst(style) ? 6.5 : 9.5 });
  field.blob({ u: -a * 0.15, v: -a * 0.18, ru: a * 0.42, rv: a * 0.42, amp: 1.2 });
  // corner creases radiating towards the centre
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    for (let i = 0; i < 3; i++) {
      const ang = Math.atan2(sy, sx) + (i - 1) * 0.28 + rng.range(-0.08, 0.08);
      const r0 = a * 1.24, r1 = a * rng.range(0.7, 0.9);
      const sg = i % 2 ? 1 : -1;
      field.ridge({ a: [Math.cos(ang) * r0, Math.sin(ang) * r0], b: [Math.cos(ang) * r1, Math.sin(ang) * r1], s0: 1.0, s1: 1.9, a0: 0.8 * sg * fabAmp, a1: 0.05 * sg, fade0: 0.05, fade1: 0.55, p: 2 });
    }
  }
  const tufted = style === 'tufted';
  if (tufted) {
    const g = [-a * 0.52, 0, a * 0.52];
    for (const gx of g) for (const gy of g) {
      field.blob({ u: gx, v: gy, ru: 2.1, rv: 2.1, amp: -1.9 * fabAmp });
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + 0.3 + rng.range(-0.15, 0.15);
        field.ridge({ a: [gx + Math.cos(ang) * 1.5, gy + Math.sin(ang) * 1.5], b: [gx + Math.cos(ang) * a * 0.34, gy + Math.sin(ang) * a * 0.34], s0: 0.8, s1: 1.6, a0: -0.7 * fabAmp, a1: 0.05, fade0: 0.05, fade1: 0.7 });
      }
    }
  }
  field.noise({ amp: 0.2 * wr, fu: 0.12, fv: 0.12, oct: 3 });
  const pieces = [];
  const c2 = sp.color2 || darken(sp.color, 0.25);
  pieces.push(clothPiece(M, { id: 'cushion', z: 10, d: oc.d(), bounds: b, field, bevelCm: 2.2, bevelH: 3.4, edgeAo: 0.2, grid: 4, contact: { dx: 0.6, dy: 0.8, sigma: 0.8, strength: 0.34 },
    inner: `<path d="${bandPath(oc, 0.4, 2.2, { n: 160 })}" fill="#000" fill-opacity=".05"/>` + (tufted ? [-a * 0.52, 0, a * 0.52].flatMap((gx) => [-a * 0.52, 0, a * 0.52].map((gy) => `<circle cx="${f(gx)}" cy="${f(gy)}" r="1.3" fill="#000" fill-opacity=".22"/>`)).join('') : '') }));
  if (style === 'piped' || style === 'tasselled') {
    const band = bandPath(oc, -0.5, 0.62, { n: 200 });
    pieces.push(clothPiece(M, { id: 'piping', z: 11, d: band, bounds: { x0: b.x0 - 1, y0: b.y0 - 1, x1: b.x1 + 1, y1: b.y1 + 1 }, fill: c2, noPattern: true, field: null, bevelCm: 0.3, bevelH: 0.5, edgeAo: 0.1, grid: 2,
      mat: { ...M.mat, tex: { type: 'weave', amp: 0.04, bump: 0.05 }, spec: 0.12, shin: 12 }, contact: { dx: 0.3, dy: 0.45, sigma: 0.35, strength: 0.3 },
      inner: `<path d="${bandPath(oc, -0.12, 0.2, { n: 200 })}" fill="#fff" fill-opacity=".08"/>` }));
  }
  const model = { pieces, bounds: { x0: b.x0 - 1, y0: b.y0 - 1, x1: b.x1 + 1, y1: b.y1 + (style === 'tasselled' ? 8 : 1) }, oc, a, M, style, c2, tufted };
  if (style === 'tasselled') {
    // corner tassels (overlay, drawn after shading)
    const corners = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy]) => [sx * a * 0.86, sy * a * 0.9]);
    model.tassels = corners.filter((c) => c[1] > 0);
  }
  return model;
}

async function drawCushion(ctx, model, { cx = 0, baseV = 0 }) {
  const { pieces } = model;
  const layers = [];
  for (const p of pieces) p.layer = await ctx.albedo(p);
  ctx.groundShadow(pieces.map((p) => p.layer).filter(Boolean).slice(0, 1), { baseY: ctx.cam.fwd(0, model.oc.bounds().y1)[1], sx: 0.45, sy: 0.05, sigma: 0.45, strength: 0.4, wide: 2.2, wideStrength: 0.2 });
  { const bb = model.oc.bounds(); const [cx0, cy0] = ctx.cam.fwd(0, bb.y1); ctx.contactEllipse(cx0, cy0, model.a * ctx.cam.k * 0.95, model.a * ctx.cam.k * 0.07, { strength: 0.55, sigma: 0.5 * ctx.cam.k }); }
  ctx.wallShadow(pieces.map((p) => p.layer).filter(Boolean), { dx: 0.9, dy: 0.7, sigma: 1.2, strength: 0.22, ambient: 0.08, shear: 0 });
  for (const p of pieces) {
    ctx.shadeAndDraw(p.layer, { mat: p.mat, field: p.field, bevel: { sigma: (p.bevelCm ?? 0.3) * ctx.cam.k, h: p.bevelH ?? 0.26 }, edgeAo: p.edgeAo ?? 0.12, edgeSigma: 0.5 * ctx.cam.k, contact: p.contact, grid: p.grid });
  }
  if (model.style === 'tasselled') {
    let s = '';
    for (const [x, y] of model.tassels) s += tassels(Curve.line([x - 0.01, y], [x + 0.01, y]), { count: 1, len: 6.5, color: model.c2, head: darken(model.c2, 0.25), rng: new Rng(7) }).replace(/<ellipse[^>]*opacity=".16"\/>/, '');
    await ctx.vector(s, { bounds: { x0: -model.a * 1.4, x1: model.a * 1.4, y0: 0, y1: model.a * 1.9 } });
  }
  if (model.tufted) {
    const g = [-model.a * 0.52, 0, model.a * 0.52];
    let s = '';
    for (const gx of g) for (const gy of g) s += button(gx, gy, 0.85, mix(model.M.base, '#000', 0.2), { holes: 0, ring: false });
    await ctx.vector(s, { bounds: model.oc.bounds() });
  }
}

export default {
  async front(ctx, spec) {
    const rng = ctx.rng.fork('c-front');
    const tilt = rng.range(-0.07, 0.07);
    const a = 22;
    const model = buildCushion(ctx, spec, { a });
    const bb = { x0: -a * 1.2, x1: a * 1.2, y0: -a * 2.0, y1: a * 0.02 };
    const { baseY } = fitObject(ctx, { x0: -a * 1.25, x1: a * 1.25, y0: -a * 2.06, y1: 0 }, { baseFrac: 0.82, maxW: 0.78, maxH: 0.7, kmax: 40 });
    // sit the cushion on the table: shift so its lowest point is at v=0
    const oc = model.oc.bounds();
    ctx.cam = new Camera({ k: ctx.cam.k, tx: ctx.cam.tx, ty: ctx.cam.ty + (-oc.y1) * -ctx.cam.k * 0 + (-oc.y1 * ctx.cam.k) * 0, rot: tilt });
    // translate geometry rather than the camera: draw with centre at (0, -a)
    const k = ctx.cam.k;
    ctx.cam = new Camera({ k, tx: ctx.W / 2, ty: baseY - oc.y1 * k * Math.cos(tilt) * 1.0 - 0, rot: tilt });
    await ctx.backdrop({ mode: 'surface', horizon: 0.63 });
    await drawCushion(ctx, model, {});
  },
  async alt(ctx, spec) {
    const rng = ctx.rng.fork('c-alt');
    const a = 21;
    const m1 = buildCushion(ctx, spec, { a, seedOff: 1 });
    const back = { color: spec.color2 || mix(spec.color, '#ffffff', 0.4), color2: spec.color, pattern: 'solid', style: spec.style === 'tufted' ? 'piped' : 'tufted', fabric: 'linen' };
    const m2 = buildCushion(ctx, { ...spec, ...back }, { a: a * 0.95, seedOff: 2 });
    const k = Math.min(ctx.W * 0.78 / (a * 3.1), ctx.H * 0.64 / (a * 2.2), 36 * ctx.u);
    const baseY = ctx.H * 0.82;
    const oc = m1.oc.bounds();
    // back cushion (drawn first, shifted right & up, tilted the other way); front cushion lower-left
    ctx.cam = new Camera({ k, tx: ctx.W / 2 + a * 0.62 * k, ty: baseY - oc.y1 * k, rot: 0.1 });
    await ctx.backdrop({ mode: 'surface', horizon: 0.63, seedOffset: 3 });
    await drawCushion(ctx, m2, {});
    ctx.cam = new Camera({ k, tx: ctx.W / 2 - a * 0.5 * k, ty: baseY - oc.y1 * k + a * 0.1 * k, rot: -0.05 });
    await drawCushion(ctx, m1, {});
  },
  async detail(ctx, spec) {
    const a = 22;
    const model = buildCushion(ctx, spec, { a });
    const k = ctx.u * 9.5 * 2.7;
    const which = (spec.seed | 0) % 2;
    const corner = which ? [a * 0.78, -a * 0.78] : [-a * 0.8, a * 0.78];
    const c = new Camera({ k, tx: 0, ty: 0, rot: 0.1 });
    ctx.focusCamera(corner[0], corner[1], k, { rot: 0.1, cx: 0.5, cy: 0.5 });
    await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.05 }, leaves: false });
    const { pieces } = model;
    for (const p of pieces) p.layer = await ctx.albedo(p);
    ctx.wallShadow(pieces.map((p) => p.layer).filter(Boolean), { dx: 0.9, dy: 0.7, sigma: 1.2, strength: 0.2, ambient: 0.05, shear: 0 });
    for (const p of pieces) ctx.shadeAndDraw(p.layer, { mat: p.mat, field: p.field, bevel: { sigma: (p.bevelCm ?? 0.3) * ctx.cam.k, h: p.bevelH ?? 0.26 }, edgeAo: p.edgeAo ?? 0.12, edgeSigma: 0.5 * ctx.cam.k, contact: p.contact, grid: p.grid });
    if (model.tufted) {
      const g = [-a * 0.52, 0, a * 0.52];
      let s = ''; for (const gx of g) for (const gy of g) s += button(gx, gy, 0.85, mix(model.M.base, '#000', 0.2), { holes: 0, ring: false });
      await ctx.vector(s, { bounds: model.oc.bounds() });
    }
    ctx.setDof({ axis: 'diag', dx: 0.6, dy: 0.8, focus: 0.58, band: 0.12, falloff: 0.4, sigma: 6.5 });
  },
};
