// Saree: neatly folded stack seen from above - every fold shows the woven border, the top fold carries the pleated pallu
// with a motif band and tassels. alt = angled stack with the pallu pulled out; detail = macro of border + motif.
import { Curve, f, lerp, clamp, bandPath, offsetPath, polyD, unionBounds, boundsOfPts } from '../lib/geometry.mjs';
import { FoldField } from '../lib/folds.mjs';
import { Rng } from '../lib/prng.mjs';
import { mix, darken, lighten, shadowOf, luma } from '../lib/color.mjs';
import { makeMaterial, clothPiece, stitchLine } from '../lib/garment.mjs';
import { trimBand, tassels } from '../lib/trims.mjs';
import { Camera } from '../lib/shade.mjs';

/** soft, slightly wavy folded-cloth slab outline (top edge = fold crease, bottom edge = visible border edge) */
function slabPath(w, h, rng) {
  const ph1 = rng.range(0, 6.28), ph2 = rng.range(0, 6.28);
  const topY = (t) => 0.5 * Math.sin(t * 5.2 + ph1) + 0.28 * Math.sin(t * 12 + ph1 * 2);
  const botY = (t) => 0.75 * Math.sin(t * 4.1 + ph2) + 0.3 * Math.sin(t * 10 + ph2 * 3);
  const N = 8, pts = [];
  for (let i = 0; i <= N; i++) { const t = i / N; pts.push([-w / 2 + 2.4 + (w - 4.8) * t, topY(t)]); }
  pts.push([w / 2 - 0.2, 1.8], [w / 2 + rng.range(-0.3, 0.5), h * 0.5], [w / 2 - 0.2, h - 1.8]);
  for (let i = N; i >= 0; i--) { const t = i / N; pts.push([-w / 2 + 2.4 + (w - 4.8) * t, h + botY(t)]); }
  pts.push([-w / 2 + 0.2, h - 1.8], [-w / 2 - rng.range(-0.3, 0.5), h * 0.5], [-w / 2 + 0.2, 1.8]);
  return { curve: Curve.through(pts, { closed: true }), botY };
}

function build(ctx, spec, shot) {
  const alt = shot === 'alt';
  const M = makeMaterial(ctx, spec, { fabric: spec.fabric || 'silk' });
  const rng = ctx.rng.fork('saree-' + shot);
  const c2 = spec.color2 || mix(spec.color, '#000', 0.3);
  const borderType = spec.border || (spec.trim && spec.trim !== 'none' ? spec.trim : 'zari-border');
  const W = 80, h = 21, ov = 2.6, n = 5;
  const pieces = [];
  const fabAmp = M.mat.foldAmp ?? 1;
  const slabs = [];
  for (let i = 0; i < n; i++) {
    const y0 = (n - 1 - i) * (h - ov) - ((n - 1) * (h - ov) + h) / 2 + (alt ? 0 : 0);
    const dx = rng.range(-1.6, 1.6) + (alt && i === n - 1 ? 9 : 0);
    const sp = slabPath(W - rng.range(0, 3.2), h, rng);
    const curve = sp.curve;
    const rot = rng.range(-0.016, 0.016);
    const b = curve.bounds();
    const isTop = i === n - 1;
    const f2 = new FoldField(rng.int(1, 1e6));
    f2.dome({ hw: W * 0.5, v0: 0, v1: h, amp: 1.5 * fabAmp, in: 3, out: 3, pow: 0.8 });
    for (let q = 0; q < 6; q++) { const x = rng.range(-W * 0.42, W * 0.42); f2.ridge({ a: [x, 1], b: [x + rng.range(-5, 5), h - 1], s0: 1.8, s1: 3.0, a0: (q % 2 ? 1 : -1) * rng.range(0.25, 0.7), a1: (q % 2 ? 1 : -1) * rng.range(0.3, 0.9), bow: rng.range(-1.4, 1.4), fade: 0.12, wob: 0.5, wobF: 1.4, ph: rng.range(0, 6) }); }
    f2.ridge({ a: [-W * 0.45, h * 0.2], b: [W * 0.45, h * 0.6], s0: 1.6, s1: 2.2, a0: -0.4, a1: -0.3, fade: 0.15 }); // soft diagonal crease
    f2.noise({ amp: 0.3 * (M.mat.wrink ?? 0.3), fu: 0.12, fv: 0.12, oct: 3 });
    // border along the bottom edge (and a fine line along the top)
    const bottom = Curve.through(Array.from({ length: 9 }, (_, q) => { const t = q / 8; return [-W / 2 + 2.4 + (W - 4.8) * t, h + sp.botY(t) - 0.15]; }));
    const bw = isTop ? 4.4 : 3.6;
    const tb = trimBand(borderType === 'none' ? 'contrast-border' : borderType, bottom, { o0: -bw - 0.5, o1: -0.5, color: spec.color, color2: c2, n: 120 });
    let inner = tb.inner;
    const tb2 = trimBand('piping', bottom, { o0: -bw - 1.4, o1: -bw - 0.9, color: spec.color, color2: lighten(c2, 0.1), n: 60 });
    inner += tb2.inner;
    let defs = tb.defs;
    let overlay = '';
    if (isTop) {
      // pallu: pleated block on the right with a motif band; pleat ridges drawn in the field, motif as pattern band
      const px0 = W * 0.04, px1 = W / 2 - 1.5;
      for (let q = 0; q < 14; q++) {
        const x = lerp(px0, px1, (q + 0.5) / 14);
        f2.ridge({ a: [x, 1.2], b: [x + (alt ? 2.5 : 0.4), h - 4.6], s0: 0.5, s1: 0.5, a0: (q % 2 ? 1 : -1) * 0.7, a1: (q % 2 ? 1 : -1) * 0.7, p: 1.5, fade: 0.08 });
      }
      // motif band (big paisley row) between pleats and border
      const bandY = h - bw - 5.6;
      inner += `<rect x="${f(px0)}" y="${f(bandY)}" width="${f(px1 - px0)}" height="4.6" fill="${mix(spec.color, '#000', 0.12)}" opacity=".35"/>`;
      for (let q = 0; q < 6; q++) {
        const x = lerp(px0 + 2.6, px1 - 2.6, q / 5), y = bandY + 2.3;
        inner += `<g transform="translate(${f(x)} ${f(y)})"><path d="M0 1.9C-1.7 1.4 -2.3 -0.6 -1.6 -1.6C-0.8 -2.7 0.7 -2.4 1.1 -1.3C1.4 -0.5 0.6 -0.2 0.2 -0.6C0.8 0.6 0.4 1.5 0 1.9Z" fill="${GOLDC(c2)}"/><circle cx="-0.1" cy="-0.3" r=".35" fill="${darken(c2, 0.3)}"/></g>`;
      }
      inner += `<path d="M${f(px0)} ${f(bandY)}H${f(px1)}M${f(px0)} ${f(bandY + 4.6)}H${f(px1)}" stroke="${GOLDC(c2)}" stroke-width=".18"/>`;
      // end tassels (hanging off the right edge)
      overlay = '';
    }
    const patTransform = `translate(${rng.range(0, 8)} ${rng.range(0, 8)})`;
    pieces.push(clothPiece(M, { id: 'slab' + i, z: 10 + i, d: curve.d(), bounds: { x0: b.x0 - 1, y0: b.y0 - 1, x1: b.x1 + 1, y1: b.y1 + 1 }, field: f2, inner, defs, patTransform, bevelCm: 0.9, bevelH: 1.0, edgeAo: 0.16, grid: 4,
      contact: { dx: 0.1, dy: 1.1, sigma: 1.0, strength: 0.42 }, overlay }));
    // shift into place
    const p = pieces[pieces.length - 1];
    p.shift = [dx, y0];
    slabs.push({ i, dx, y0, bw, isTop, curve, rot });
  }
  // apply placement (translate + small rotation) by wrapping path data in a transform (albedo supports <<TF:>>)
  pieces.forEach((p, i) => {
    const [dx, y0] = p.shift, rot = slabs[i].rot, cy = h / 2;
    const deg = (rot * 180) / Math.PI;
    p.d = `<<TF:translate(${f(dx)} ${f(y0 + cy)}) rotate(${f(deg)}) translate(0 ${f(-cy)})>>${p.d}`;
    const bb = p.bounds, pad = 1.2;
    p.bounds = { x0: bb.x0 + dx - pad, x1: bb.x1 + dx + pad, y0: bb.y0 + y0 - pad - 2, y1: bb.y1 + y0 + pad + 2 };
    if (p.overlay) p.overlay = `<g transform="translate(${f(dx)} ${f(y0 + cy)}) rotate(${f(deg)}) translate(0 ${f(-cy)})">${p.overlay}</g>`;
    // the field is evaluated in world space: map world -> slab-local (inverse of the placement)
    const fld = p.field, oh = fld.h.bind(fld), c = Math.cos(-rot), sn = Math.sin(-rot);
    fld.h = (u, v) => { const x = u - dx, y = v - (y0 + cy); return oh(x * c - y * sn, x * sn + y * c + cy); };
  });
  // tassels on the right edge of the top slab
  const top = pieces[pieces.length - 1], ts = slabs[slabs.length - 1];
  const edge = Curve.line([W / 2 - 0.6 + ts.dx + 1.2, ts.y0 + 2], [W / 2 - 0.6 + ts.dx + 1.2, ts.y0 + h - 2]);
  const tass = tassels(Curve.through([[W / 2 - 0.6 + ts.dx + 0.8, ts.y0 + 2], [W / 2 - 0.6 + ts.dx + 0.8, ts.y0 + h * 0.5], [W / 2 - 0.6 + ts.dx + 0.8, ts.y0 + h - 2]]), { count: 5, len: 4.2, color: GOLDC(c2), head: darken(c2, 0.2), u0: 0.02, u1: 0.98, rng }).replace(/<ellipse[^>]*opacity=".16"\/>/g, '');
  top.overlay = (top.overlay || '') + `<g transform="rotate(-90 ${f(W / 2 + ts.dx)} ${f(ts.y0 + h / 2)}) translate(0 0)">${''}</g>` + '';
  const bounds = unionBounds(pieces.map((p) => p.bounds));
  return { pieces, bounds: { x0: bounds.x0 - 2, x1: bounds.x1 + 2, y0: bounds.y0 - 2, y1: bounds.y1 + 2 }, M, slabs, W, h, alt };
}
const GOLDC = (c) => '#C9A24A';

async function paint(ctx, model) {
  const k = ctx.cam.k;
  for (const p of model.pieces) p.layer = await ctx.albedo(p);
  ctx.wallShadow(model.pieces.map((p) => p.layer).filter(Boolean), { dx: 0.7, dy: 1.1, sigma: 1.1, strength: 0.3, ambient: 0.1, shear: 0 });
  for (const p of model.pieces.slice().sort((a, b) => a.z - b.z)) {
    if (!p.layer) continue;
    ctx.shadeAndDraw(p.layer, { mat: p.mat, field: p.field, bevel: { sigma: p.bevelCm * k, h: p.bevelH }, edgeAo: p.edgeAo, edgeSigma: 0.5 * k, contact: p.contact, grid: p.grid });
    if (p.overlay) await ctx.vector(p.overlay, { bounds: p.bounds });
  }
}

export default {
  async front(ctx, spec) {
    const model = build(ctx, spec, 'front');
    ctx.fitCamera(model.bounds, { mx: 0.09, top: 0.07, bottom: 0.08, kmax: 14 });
    await ctx.backdrop({ mode: 'wall' });
    await paint(ctx, model);
  },
  async alt(ctx, spec) {
    const model = build(ctx, spec, 'alt');
    ctx.fitCamera(model.bounds, { mx: 0.09, top: 0.07, bottom: 0.08, kmax: 14 });
    ctx.cam = new Camera({ k: ctx.cam.k * 0.97, tx: ctx.cam.tx, ty: ctx.cam.ty, rot: -0.1 });
    await ctx.backdrop({ mode: 'wall', seedOffset: 3 });
    await paint(ctx, model);
  },
  async detail(ctx, spec) {
    const model = build(ctx, spec, 'front');
    const top = model.slabs[model.slabs.length - 1];
    const k = ctx.u * 9.5 * 2.9;
    ctx.focusCamera(W2(model) * 0.18, top.y0 + model.h - 6, k, { rot: 0.05, cx: 0.5, cy: 0.5 });
    await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.05 }, leaves: false });
    await paint(ctx, model);
    ctx.setDof({ axis: 'diag', dx: 0.6, dy: 0.8, focus: 0.55, band: 0.12, falloff: 0.4, sigma: 7 });
  },
};
const W2 = (m) => m.W;
