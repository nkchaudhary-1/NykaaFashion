// Home linens: `throw` (folded stack with fringed ends) and `bedding` (folded duvet set + pillow).
// Both are built from soft wavy fold slabs (as the saree stack). `anchor: floor` scene items use a ground shadow.
import { Curve, f, lerp, clamp, polyD, unionBounds, boundsOfPts } from '../lib/geometry.mjs';
import { FoldField } from '../lib/folds.mjs';
import { mix, darken, lighten } from '../lib/color.mjs';
import { makeMaterial, clothPiece, stitchLine } from '../lib/garment.mjs';
import { trimBand } from '../lib/trims.mjs';
import { Camera } from '../lib/shade.mjs';

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

function fringe(W, h, color, rng) {
  let s = '';
  for (const sx of [-1, 1]) {
    const x0 = sx * (W / 2 - 0.3);
    for (let i = 0; i < 30; i++) {
      const y = 1.1 + ((h - 2.2) * i) / 29 + rng.range(-0.12, 0.12), L = rng.range(2.6, 3.5), dy = rng.range(-0.5, 0.5);
      s += `<path d="M${f(x0)} ${f(y)}Q${f(x0 + sx * L * 0.55)} ${f(y + dy * 0.4)} ${f(x0 + sx * L)} ${f(y + dy)}" stroke="${color}" stroke-width=".11" fill="none" stroke-linecap="round" opacity=".95"/>`;
    }
  }
  return s;
}

function buildStack(ctx, spec, shot, cfg) {
  const alt = shot === 'alt';
  const M = makeMaterial(ctx, spec, { fabric: spec.fabric || cfg.fabric });
  const rng = ctx.rng.fork(cfg.name + '-' + shot);
  const c2 = spec.color2 || mix(spec.color, '#fff', 0.55);
  const { W, h, ov, n } = cfg;
  const fabAmp = M.mat.foldAmp ?? 1;
  const pieces = [], slabs = [];
  for (let i = 0; i < n; i++) {
    const y0 = (n - 1 - i) * (h - ov) - ((n - 1) * (h - ov) + h) / 2;
    const dx = rng.range(-1.4, 1.4) + (alt && i === n - 1 ? 8 : 0) + (alt && i === 1 ? -3 : 0);
    const sp = slabPath(W - rng.range(0, 3), h, rng);
    const curve = sp.curve, b = curve.bounds();
    const rot = rng.range(-0.014, 0.014) + (alt && i === n - 1 ? 0.05 : 0);
    const f2 = new FoldField(rng.int(1, 1e6));
    f2.dome({ hw: W * 0.5, v0: 0, v1: h, amp: cfg.dome * fabAmp, in: 3, out: 3, pow: 0.8 });
    for (let q = 0; q < 6; q++) { const x = rng.range(-W * 0.42, W * 0.42); f2.ridge({ a: [x, 1], b: [x + rng.range(-5, 5), h - 1], s0: 1.8, s1: 3.0, a0: (q % 2 ? 1 : -1) * rng.range(0.2, 0.6), a1: (q % 2 ? 1 : -1) * rng.range(0.3, 0.8), bow: rng.range(-1.4, 1.4), fade: 0.12, wob: 0.5, wobF: 1.4, ph: rng.range(0, 6) }); }
    f2.noise({ amp: 0.3 * (M.mat.wrink ?? 0.4), fu: 0.12, fv: 0.12, oct: 3 });
    let inner = '', defs = '', overlay = '';
    const bottom = Curve.through(Array.from({ length: 9 }, (_, q) => { const t = q / 8; return [-W / 2 + 2.4 + (W - 4.8) * t, h + sp.botY(t) - 0.15]; }));
    if (cfg.hem) {
      const tb = trimBand('contrast-border', bottom, { o0: -cfg.hem - 0.4, o1: -0.4, color: spec.color, color2: c2, n: 100 });
      inner += tb.inner; defs += tb.defs;
    }
    if (cfg.stripes) {
      // woven bands near both short ends
      for (const sx of [-1, 1]) for (const [o, wd] of [[3.2, 1.3], [5.6, 0.45]]) inner += `<rect x="${f(sx > 0 ? W / 2 - o - wd : -W / 2 + o)}" y="-2" width="${f(wd)}" height="${f(h + 6)}" fill="${c2}" opacity=".92"/>`;
    }
    if (cfg.fringe) overlay = fringe(W, h, mix(c2, spec.color, 0.25), rng.fork('fr' + i));
    pieces.push(clothPiece(M, { id: 'slab' + i, z: 10 + i, d: curve.d(), bounds: { x0: b.x0 - 4.5, y0: b.y0 - 1, x1: b.x1 + 4.5, y1: b.y1 + 1 }, field: f2, inner, defs,
      patTransform: `translate(${rng.range(0, 8)} ${rng.range(0, 8)})`, bevelCm: 0.9, bevelH: 1.0, edgeAo: 0.16, grid: 4, contact: { dx: 0.1, dy: 1.1, sigma: 1.0, strength: 0.42 }, overlay }));
    pieces[pieces.length - 1].shift = [dx, y0];
    slabs.push({ i, dx, y0, rot });
  }
  pieces.forEach((p, i) => {
    const [dx, y0] = p.shift, rot = slabs[i].rot, cy = h / 2, deg = (rot * 180) / Math.PI;
    const tf = `translate(${f(dx)} ${f(y0 + cy)}) rotate(${f(deg)}) translate(0 ${f(-cy)})`;
    p.d = `<<TF:${tf}>>${p.d}`;
    const bb = p.bounds, pad = 1.2;
    p.bounds = { x0: bb.x0 + dx - pad, x1: bb.x1 + dx + pad, y0: bb.y0 + y0 - pad - 2, y1: bb.y1 + y0 + pad + 2 };
    if (p.overlay) p.overlay = `<g transform="${tf}">${p.overlay}</g>`;
    const fld = p.field, oh = fld.h.bind(fld), c = Math.cos(-rot), sn = Math.sin(-rot);
    fld.h = (u, v) => { const x = u - dx, y = v - (y0 + cy); return oh(x * c - y * sn, x * sn + y * c + cy); };
  });
  let topY = Math.min(...pieces.map((p) => p.bounds.y0));
  if (cfg.pillow) {
    // pillow resting on the top slab: puffy rounded rectangle with a flange stitch
    const pw = 44, ph = 29, cxp = alt ? -6 : 4, cyp = topY + 4.5, rot = alt ? -0.07 : 0.045;
    const r = 6.5, hw = pw / 2, hh = ph / 2;
    const d = `M${f(-hw + r)} ${f(-hh)}H${f(hw - r)}Q${f(hw)} ${f(-hh)} ${f(hw)} ${f(-hh + r)}V${f(hh - r)}Q${f(hw)} ${f(hh)} ${f(hw - r)} ${f(hh)}H${f(-hw + r)}Q${f(-hw)} ${f(hh)} ${f(-hw)} ${f(hh - r)}V${f(-hh + r)}Q${f(-hw)} ${f(-hh)} ${f(-hw + r)} ${f(-hh)}Z`;
    const pf = new FoldField(rng.int(1, 1e6));
    pf.dome({ hw: hw, v0: -hh, v1: hh, amp: 4.2 * fabAmp, in: 4, out: 4, pow: 0.7 });
    pf.blob({ u: 0, v: 0, ru: hw * 0.8, rv: hh * 0.8, amp: 1.0 });
    for (let q = 0; q < 4; q++) pf.ridge({ a: [(q - 1.5) * 9, -hh * 0.7], b: [(q - 1.5) * 11, hh * 0.7], s0: 1.4, s1: 1.8, a0: (q % 2 ? 1 : -1) * 0.28, a1: (q % 2 ? 1 : -1) * 0.2, fade: 0.2 });
    pf.noise({ amp: 0.2, fu: 0.14, fv: 0.14, oct: 2 });
    const fl = 3.0;
    const inner = `<rect x="${f(-hw + fl)}" y="${f(-hh + fl)}" width="${f(pw - 2 * fl)}" height="${f(ph - 2 * fl)}" rx="${f(r * 0.6)}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width=".1" stroke-dasharray=".38 .24"/>` +
      `<rect x="${f(-hw + 0.5)}" y="${f(-hh + 0.5)}" width="${f(pw - 1)}" height="${f(ph - 1)}" rx="${f(r)}" fill="none" stroke="${c2}" stroke-opacity=".55" stroke-width=".35"/>`;
    const deg = (rot * 180) / Math.PI;
    const tf = `translate(${f(cxp)} ${f(cyp)}) rotate(${f(deg)})`;
    const pp = clothPiece(M, { id: 'pillow', z: 40, d: `<<TF:${tf}>>${d}`, bounds: { x0: cxp - hw - 3, y0: cyp - hh - 3, x1: cxp + hw + 3, y1: cyp + hh + 3 }, field: pf, inner, patTransform: `translate(3 5)`, bevelCm: 1.3, bevelH: 1.3, edgeAo: 0.2, grid: 4, contact: { dx: 0.4, dy: 1.6, sigma: 1.3, strength: 0.46 } });
    const fh = pf.h.bind(pf), c = Math.cos(-rot), sn = Math.sin(-rot);
    pf.h = (u, v) => { const x = u - cxp, y = v - cyp; return fh(x * c - y * sn, x * sn + y * c); };
    pieces.push(pp);
    topY = Math.min(topY, pp.bounds.y0);
  }
  const bounds = unionBounds(pieces.map((p) => p.bounds));
  return { pieces, bounds: { x0: bounds.x0 - 2, x1: bounds.x1 + 2, y0: bounds.y0 - 2, y1: bounds.y1 + 2 }, M, slabs, W, h };
}

async function paint(ctx, model, { floor = false } = {}) {
  const k = ctx.cam.k;
  for (const p of model.pieces) p.layer = await ctx.albedo(p);
  const layers = model.pieces.map((p) => p.layer).filter(Boolean);
  if (floor) {
    const by = ctx.cam.fwd(0, model.bounds.y1 - 2)[1];
    ctx.groundShadow(layers, { baseY: by, sx: 0.5, sy: 0.08, sigma: 0.5, strength: 0.34, wide: 2.2, wideStrength: 0.15 });
    ctx.contactEllipse(ctx.cam.fwd((model.bounds.x0 + model.bounds.x1) / 2, 0)[0], by - 1, (model.bounds.x1 - model.bounds.x0) * k * 0.46, 0.8 * k, { strength: 0.5, sigma: 0.8 * k });
  } else ctx.wallShadow(layers, { dx: 0.7, dy: 1.1, sigma: 1.1, strength: 0.3, ambient: 0.1, shear: 0 });
  for (const p of model.pieces.slice().sort((a, b) => a.z - b.z)) {
    if (!p.layer) continue;
    ctx.shadeAndDraw(p.layer, { mat: p.mat, field: p.field, bevel: { sigma: p.bevelCm * k, h: p.bevelH }, edgeAo: p.edgeAo, edgeSigma: 0.5 * k, contact: p.contact, grid: p.grid });
    if (p.overlay) await ctx.vector(p.overlay, { bounds: p.bounds });
  }
}

function linenKind(cfg) {
  return {
    async scene(ctx, spec) {
      const model = buildStack(ctx, spec, 'front', cfg);
      ctx.fitCamera(model.bounds);
      await paint(ctx, model, { floor: true });
    },
    async front(ctx, spec) {
      const model = buildStack(ctx, spec, 'front', cfg);
      ctx.fitCamera(model.bounds, { mx: 0.09, top: 0.07, bottom: 0.08, kmax: 14 });
      await ctx.backdrop({ mode: 'wall' });
      await paint(ctx, model);
    },
    async alt(ctx, spec) {
      const model = buildStack(ctx, spec, 'alt', cfg);
      ctx.fitCamera(model.bounds, { mx: 0.09, top: 0.07, bottom: 0.08, kmax: 14 });
      ctx.cam = new Camera({ k: ctx.cam.k * 0.97, tx: ctx.cam.tx, ty: ctx.cam.ty, rot: -0.1 });
      await ctx.backdrop({ mode: 'wall', seedOffset: 3 });
      await paint(ctx, model);
    },
    async detail(ctx, spec) {
      const model = buildStack(ctx, spec, 'front', cfg);
      const top = model.slabs[model.slabs.length - 1];
      const k = ctx.u * 9.5 * cfg.zoom;
      ctx.focusCamera(cfg.pillow ? model.W * 0.12 : model.W * 0.3, top.y0 + model.h * (cfg.pillow ? -0.4 : 0.55), k, { rot: 0.05, cx: 0.5, cy: 0.5 });
      await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.05 }, leaves: false });
      await paint(ctx, model);
      ctx.setDof({ axis: 'diag', dx: 0.6, dy: 0.8, focus: 0.55, band: 0.12, falloff: 0.4, sigma: 7 });
    },
  };
}

export const throwKind = linenKind({ name: 'throw', W: 72, h: 17, ov: 3.4, n: 4, fabric: 'cotton', dome: 1.4, stripes: true, fringe: true, zoom: 3.4 });
export const bedding = linenKind({ name: 'bedding', W: 66, h: 19, ov: 3.2, n: 3, fabric: 'cotton', dome: 1.6, hem: 3.2, pillow: true, zoom: 2.6 });
