// Earrings: jhumka / stud / hoop / chandbali / drop in gold / silver / oxidised / rosegold; stones in color2.
// A pair is displayed on a soft draped cloth. alt = tilted pair + single macro arrangement, detail = macro of the ornament.
import { Curve, f, lerp, clamp, polyD, tube, unionBounds, boundsOfPts, ellipseD } from '../lib/geometry.mjs';
import { FoldField } from '../lib/folds.mjs';
import { Rng } from '../lib/prng.mjs';
import { mix, darken, lighten, shadowOf, luma } from '../lib/color.mjs';
import { clothPiece } from '../lib/garment.mjs';
import { fitObject, paintObjectModels } from '../lib/object.mjs';
import { FABRICS, fabricOf } from '../lib/fabrics.mjs';
import { makeMaterial } from '../lib/garment.mjs';
import { Camera } from '../lib/shade.mjs';

const METALS = { gold: '#E0BA5E', silver: '#F3F4F7', oxidised: '#948D84', rosegold: '#F6BFA9' };
const metalMat = (m) => ({ amb: 0.26, wrap: 0.08, spec: 0.9, shin: 46, metal: m === 'oxidised' ? 0.8 : 0.93, rim: 0, tex: { type: 'none', amp: 0, bump: 0 } });
const stoneMat = { amb: 0.34, wrap: 0.1, spec: 0.95, shin: 70, rim: 0, tex: { type: 'none', amp: 0, bump: 0 } };
const pearlMat = { amb: 0.5, wrap: 0.25, spec: 0.8, shin: 38, rim: 0.1, tex: { type: 'none', amp: 0, bump: 0 } };

let UID = 0;
const gid = (p) => `${p}${++UID}`;

function part(id, d, bounds, fill, mat, o = {}) {
  return { id, z: o.z ?? 10, d, bounds, pad: 1.5, fill, inner: o.inner || '', defs: o.defs || '', mat, bevelCm: o.bevel ?? 0.2, bevelH: o.bevelH ?? 0.28, edgeAo: o.edgeAo ?? 0.04, grid: 2, sphere: o.sphere, normalFn: o.normalFn, contact: o.contact ?? { dx: 0.1, dy: 0.18, sigma: 0.15, strength: 0.34 }, overlay: o.overlay };
}
const circle = (cx, cy, r) => ellipseD(cx, cy, r, r);

function stone(id, cx, cy, r, color, z, { facets = true, shape = 'round' } = {}) {
  const g = gid('sg');
  const defs = `<radialGradient id="${g}" cx=".38" cy=".34" r=".8"><stop offset="0" stop-color="${lighten(color, 0.45)}"/><stop offset=".45" stop-color="${color}"/><stop offset="1" stop-color="${darken(color, 0.4)}"/></radialGradient>`;
  let inner = `<path d="${circle(cx, cy, r)}" fill="url(#${g})"/>`;
  if (facets) for (let i = 0; i < 8; i++) { const a0 = (i / 8) * Math.PI * 2 + 0.2, a1 = ((i + 1) / 8) * Math.PI * 2 + 0.2; inner += `<path d="M${f(cx)} ${f(cy)}L${f(cx + Math.cos(a0) * r)} ${f(cy + Math.sin(a0) * r)}L${f(cx + Math.cos(a1) * r)} ${f(cy + Math.sin(a1) * r)}Z" fill="${i % 2 ? '#fff' : '#000'}" fill-opacity="${i % 2 ? 0.12 : 0.1}"/>`; }
  return part(id, circle(cx, cy, r), { x0: cx - r - 1, y0: cy - r - 1, x1: cx + r + 1, y1: cy + r + 1 }, color, stoneMat, { z, defs, inner, sphere: { u: cx, v: cy, r: r * 1.0 }, contact: { dx: 0.05, dy: 0.1, sigma: 0.1, strength: 0.3 } });
}
function pearl(id, cx, cy, r, z) {
  const g = gid('pg');
  const defs = `<radialGradient id="${g}" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#F1EADD"/><stop offset="1" stop-color="#C9BFAE"/></radialGradient>`;
  return part(id, circle(cx, cy, r), { x0: cx - r - 1, y0: cy - r - 1, x1: cx + r + 1, y1: cy + r + 1 }, '#F1EADD', pearlMat, { z, defs, inner: `<path d="${circle(cx, cy, r)}" fill="url(#${g})"/>`, sphere: { u: cx, v: cy, r }, contact: { dx: 0.05, dy: 0.1, sigma: 0.1, strength: 0.3 } });
}
function flowerStud(id, cx, cy, R, metal, color2, z, mat) {
  // petalled stud: 10 rounded petals + centre stone
  const n = 10;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, px = cx + Math.cos(a) * R * 0.72, py = cy + Math.sin(a) * R * 0.72;
    d += circle(px, py, R * 0.34);
  }
  d += circle(cx, cy, R * 0.8);
  const out = [part(id, d, { x0: cx - R - 1, y0: cy - R - 1, x1: cx + R + 1, y1: cy + R + 1 }, metal, mat, { z, bevel: R * 0.22, bevelH: R * 0.3 })];
  out.push(stone(id + 's', cx, cy, R * 0.42, color2, z + 0.5));
  return out;
}

/** build one earring centred on x=0, top (post/hook) at y=0, hanging down (+y). */
function buildOne(spec, style, { rng, flip = 1 }) {
  const metal = METALS[spec.metal] || METALS.gold;
  const mat = metalMat(spec.metal);
  const stoneC = spec.color2 || '#A33B3B';
  const dk = darken(metal, 0.42), hi = lighten(metal, 0.35);
  const pieces = [];
  const W = (ps) => ps;
  switch (style) {
    case 'stud': {
      const R = 1.15;
      pieces.push(...flowerStud('stud', 0, 0.2, R, metal, stoneC, 10, mat));
      break;
    }
    case 'hoop': {
      const R = 2.5, t = 0.42;
      const d = `${circle(0, R, R)}${ellipseD(0, R, R - t * 2, R - t * 2).replace(/A([\d.]+) ([\d.]+) 0 1 0/g, 'A$1 $2 0 1 1')}`;
      pieces.push(part('hoop', d, { x0: -R - 1, y0: -1, x1: R + 1, y1: 2 * R + 1 }, metal, mat, { z: 10, bevel: t * 0.9, bevelH: t * 0.95 }));
      pieces.push(...flowerStud('hs', 0, 0.1, 0.42, metal, stoneC, 11, mat));
      break;
    }
    case 'drop': {
      pieces.push(...flowerStud('dstud', 0, 0.2, 0.9, metal, stoneC, 12, mat));
      const c = Curve.through([[0, 1.1], [0.0, 1.7]]);
      // teardrop frame (gold) + stone inside
      const tear = (r, h) => `M0 ${f(2.0)}C${f(r * 1.0)} ${f(2.0 + h * 0.25)} ${f(r * 1.05)} ${f(2.0 + h * 0.7)} 0 ${f(2.0 + h)}C${f(-r * 1.05)} ${f(2.0 + h * 0.7)} ${f(-r * 1.0)} ${f(2.0 + h * 0.25)} 0 ${f(2.0)}Z`;
      pieces.push(part('bail', `M-0.35 1.0h0.7v1.4h-0.7Z`, { x0: -1, y0: 0.5, x1: 1, y1: 3 }, metal, mat, { z: 9, bevel: 0.2 }));
      pieces.push(part('frame', tear(1.05, 3.3), { x0: -2, y0: 1.5, x1: 2, y1: 6 }, metal, mat, { z: 10, bevel: 0.32, bevelH: 0.4 }));
      const g = gid('tg');
      const defs = `<radialGradient id="${g}" cx=".38" cy=".3" r=".9"><stop offset="0" stop-color="${lighten(stoneC, 0.45)}"/><stop offset=".5" stop-color="${stoneC}"/><stop offset="1" stop-color="${darken(stoneC, 0.45)}"/></radialGradient>`;
      pieces.push(part('tstone', tear(0.72, 2.7).replace('M0 2', 'M0 2.3').replace(/2\.0/g, '2.3'), { x0: -2, y0: 1.5, x1: 2, y1: 6 }, stoneC, stoneMat, { z: 11, defs, inner: `<path d="${tear(0.72, 2.7).replace(/2\.0/g, '2.3')}" fill="url(#${g})"/><path d="M-0.3 3.2Q0 2.7 0.4 3.1" stroke="#fff" stroke-opacity=".5" stroke-width=".14" fill="none"/>`, bevel: 0.35, bevelH: 0.55 }));
      break;
    }
    case 'chandbali': {
      pieces.push(...flowerStud('cstud', 0, 0.3, 1.05, metal, stoneC, 12, mat));
      // chain links down to the plate
      pieces.push(part('chain', `M-0.18 1.2h0.36v1.5h-0.36Z`, { x0: -1, y0: 1, x1: 1, y1: 3 }, metal, mat, { z: 9, bevel: 0.14, bevelH: 0.2 }));
      // half-moon plate with a scalloped border
      const R = 3.1, cy = 2.9;
      const sc = Array.from({ length: 13 }, (_, i) => { const t = Math.PI * (i / 12); return [Math.cos(t) * R, Math.sin(t) * R * 0.98]; });
      let d = `M${f(-R)} ${f(cy - 0.15)}H${f(R)}`;
      for (let i = 0; i < 12; i++) { const a0 = Math.PI * (i / 12), a1 = Math.PI * ((i + 1) / 12), am = (a0 + a1) / 2; d += `Q${f(Math.cos(am) * (R + 0.3))} ${f(cy + Math.sin(am) * (R + 0.3) * 0.98)} ${f(Math.cos(a1) * R)} ${f(cy + Math.sin(a1) * R * 0.98)}`; }
      d = `M${f(R)} ${f(cy - 0.15)}` + Array.from({ length: 12 }, (_, i) => { const a1 = Math.PI * ((i + 1) / 12), am = (Math.PI * (i / 12) + a1) / 2; return `Q${f(Math.cos(am) * (R + 0.32))} ${f(cy + Math.sin(am) * (R + 0.32) * 0.98)} ${f(Math.cos(a1) * R)} ${f(cy + Math.sin(a1) * R * 0.98)}`; }).join('') + 'Z';
      const dots = Array.from({ length: 11 }, (_, i) => { const t = Math.PI * ((i + 0.5) / 11); return `<circle cx="${f(Math.cos(t) * R * 0.84)}" cy="${f(cy + Math.sin(t) * R * 0.82)}" r=".1" fill="${dk}" fill-opacity=".8"/>`; }).join('');
      const rings = [0.62, 0.42].map((r) => `<path d="M${f(-R * r)} ${f(cy + 0.1)}A${f(R * r)} ${f(R * r * 0.98)} 0 0 0 ${f(R * r)} ${f(cy + 0.1)}" fill="none" stroke="${dk}" stroke-opacity=".5" stroke-width=".09"/>`).join('');
      pieces.push(part('plate', d, { x0: -R - 1, y0: cy - 1, x1: R + 1, y1: cy + R + 1 }, metal, mat, { z: 10, bevel: 0.45, bevelH: 0.6, inner: `<path d="${d}" fill="${metal}"/>${dots}${rings}` }));
      pieces.push(stone('mc', 0, cy + R * 0.34, 0.62, stoneC, 11.5));
      for (let i = 0; i < 6; i++) { if (i === 3) continue; const t = Math.PI * ((i + 0.5) / 6); pieces.push(stone('ms' + i, Math.cos(t) * R * 0.66, cy + Math.sin(t) * R * 0.66, 0.28, mix(stoneC, '#ffffff', 0.18), 11.5)); }
      for (let i = 0; i < 9; i++) { const t = Math.PI * ((i + 0.5) / 9); pieces.push(pearl('mp' + i, Math.cos(t) * R * 1.02, cy + Math.sin(t) * R * 1.0 + 0.45, 0.3, 9.5)); }
      break;
    }
    case 'jhumka':
    default: {
      pieces.push(...flowerStud('jstud', 0, 0.35, 1.1, metal, stoneC, 12, mat));
      // bell: dome with scalloped rim
      const R = 2.25, top = 1.8, bot = 5.4;
      const bell = `M${f(-0.9)} ${f(top)}C${f(-R * 0.6)} ${f(top + 0.3)} ${f(-R * 1.05)} ${f(top + 1.4)} ${f(-R)} ${f(bot - 0.7)}` +
        Array.from({ length: 8 }, (_, i) => { const x0 = -R + (2 * R * i) / 8, x1 = -R + (2 * R * (i + 1)) / 8; return `Q${f((x0 + x1) / 2)} ${f(bot + 0.5)} ${f(x1)} ${f(bot - 0.7)}`; }).join('') +
        `C${f(R * 1.05)} ${f(top + 1.4)} ${f(R * 0.6)} ${f(top + 0.3)} ${f(0.9)} ${f(top)}Z`;
      const engr = Array.from({ length: 4 }, (_, r) => Array.from({ length: 6 - r }, (_, i) => { const y = top + 1.0 + r * 0.7, w = R * (0.55 + 0.1 * r); return `<circle cx="${f(-w * 0.8 + (i * 1.6 * w) / (5 - r || 1) * (r === 5 ? 0 : 1) * 0.62 + (r % 2) * 0.0)}" cy="${f(y)}" r=".12" fill="${dk}" fill-opacity=".75"/>`; }).join('')).join('');
      const arcs = Array.from({ length: 5 }, (_, i) => `<path d="M${f(-R * 0.9 + i * 0.1)} ${f(bot - 1.4 - i * 0.42)}Q0 ${f(bot - 0.4 - i * 0.42)} ${f(R * 0.9 - i * 0.1)} ${f(bot - 1.4 - i * 0.42)}" fill="none" stroke="${dk}" stroke-opacity=".55" stroke-width=".1"/>`).join('');
      pieces.push(part('bell', bell, { x0: -R - 1, y0: top - 1, x1: R + 1, y1: bot + 1.2 }, metal, mat, { z: 10, bevel: 0.7, bevelH: 1.0, inner: `<path d="${bell}" fill="${metal}"/>${arcs}${engr}` }));
      pieces.push(part('collar', `M${f(-1.0)} ${f(top - 0.3)}h2.0v0.7h-2.0Z`, { x0: -2, y0: top - 1, x1: 2, y1: top + 1 }, metal, mat, { z: 11, bevel: 0.2 }));
      // pearl fringe
      for (let i = 0; i < 9; i++) { const x = -R + 0.25 + ((2 * R - 0.5) * i) / 8; pieces.push(pearl('jp' + i, x, bot + 0.35 + (i % 2 ? 0.05 : 0), 0.3, 9)); }
      pieces.push(stone('jc', 0, bot - 1.4, 0.35, stoneC, 11.5));
    }
  }
  return pieces;
}

/** soft draped cloth the earrings rest on */
function clothBase(ctx, spec, { cx = 0, top = 0, w = 40, h = 30 } = {}) {
  const rng = ctx.rng.fork('cloth');
  const tone = spec.surface || mix(ctx.bg, '#5a4a40', 0.16);
  const M = makeMaterial(ctx, { color: tone, seed: spec.seed, pattern: 'solid' }, { fabric: 'silk' });
  const pts = [[cx - w / 2, top - h * 0.8, 'c'], [cx + w / 2, top - h * 0.8, 'c'], [cx + w / 2, top + h], [cx - w / 2, top + h]];
  const curve = Curve.through(pts, { closed: true });
  const fld = new FoldField(rng.int(1, 1e6));
  for (let i = 0; i < 7; i++) { const x = cx + (i - 3) * w * 0.13 + rng.range(-3, 3); fld.ridge({ a: [x, top - h * 0.7], b: [x + rng.range(-9, 9), top + h], s0: 4.0, s1: 6.5, a0: 0.15 * (i % 2 ? 1 : -1), a1: rng.range(0.5, 1.1) * (i % 2 ? 1 : -1), bow: rng.range(-3, 3), fade0: 0.05, fade1: 0.05, wob: 1.2, wobF: 1.2, ph: rng.range(0, 6) }); }
  fld.noise({ amp: 0.7, fu: 0.05, fv: 0.05, oct: 3 });
  return clothPiece(M, { id: 'cloth', z: 1, d: curve.d(), bounds: curve.bounds(), field: fld, bevelCm: 0.0, bevelH: 0, edgeAo: 0.0, grid: 4, noCast: true, contact: false });
}

async function paintPair(ctx, spec, pairs, { cloth = true, clothTop = 3, clothH = 26 } = {}) {
  const k = ctx.cam.k;
  const models = pairs.map((p) => ({ pieces: p.pieces, bounds: unionBounds(p.pieces.map((q) => q.bounds)), baseY: 0, sc: 1, contactScale: 0 }));
  // cloth first
  if (cloth) {
    const cl = clothBase(ctx, spec, { cx: 0, top: clothTop, w: 400, h: clothH });
    cl.bounds = { x0: -200, y0: -400, x1: 200, y1: 400 };
    cl.layer = await ctx.albedo(cl);
    cl.mat = { ...cl.mat, tex: { type: 'none', amp: 0, bump: 0 } };
    ctx.shadeAndDraw(cl.layer, { mat: cl.mat, field: cl.field, bevel: null, edgeAo: 0, edgeSigma: 1, contact: false, grid: 6 });
  }
  // soft drop-shadow of each earring on the cloth
  for (const m of models) {
    for (const p of m.pieces) p.layer = await ctx.albedo(p);
    ctx.wallShadow(m.pieces.map((p) => p.layer).filter(Boolean), { dx: 0.55, dy: 0.8, sigma: 0.55, strength: 0.38, ambient: 0.1, shear: 0 });
    for (const p of m.pieces.slice().sort((a, b) => a.z - b.z)) {
      if (!p.layer) continue;
      let normalFn = p.normalFn || null;
      if (p.sphere) {
        const [sx0, sy0] = ctx.cam.fwd(p.sphere.u, p.sphere.v), R = p.sphere.r * k, X0 = p.layer.x, Y0 = p.layer.y;
        normalFn = (ix, iy, out) => { const dx = (X0 + ix - sx0) / R, dy = (Y0 + iy - sy0) / R, q = Math.min(0.995, dx * dx + dy * dy); out[0] = dx; out[1] = dy; out[2] = Math.sqrt(1 - q); };
      }
      ctx.shadeAndDraw(p.layer, { mat: p.mat, normalFn, bevel: p.sphere ? null : { sigma: (p.bevelCm ?? 0.2) * k, h: p.bevelH ?? 0.28 }, edgeAo: p.edgeAo ?? 0.04, edgeSigma: 0.4 * k, contact: p.contact, grid: p.grid });
    }
  }
}

/** Transform a set of pieces (cm) by rotation+offset (applied to path data via an SVG transform wrapper). */
function placed(pieces, { ox = 0, oy = 0, rot = 0, flipX = false }) {
  const tf = `translate(${ox} ${oy}) rotate(${rot})${flipX ? ' scale(-1 1)' : ''}`;
  return pieces.map((p) => ({ ...p, d: p.d, _tf: tf }));
}

export default {
  async front(ctx, spec) { return render(ctx, spec, 'front'); },
  async alt(ctx, spec) { return render(ctx, spec, 'alt'); },
  async detail(ctx, spec) { return render(ctx, spec, 'detail'); },
};

async function render(ctx, spec, shot) {
  const style = ['jhumka', 'stud', 'hoop', 'chandbali', 'drop'].includes(spec.style) ? spec.style : 'jhumka';
  const rng = ctx.rng.fork('ear-' + shot);
  const size = { jhumka: 7.6, stud: 2.6, hoop: 5.6, chandbali: 8.4, drop: 7.4 }[style];
  const sep = { jhumka: 4.2, stud: 3.0, hoop: 4.6, chandbali: 4.6, drop: 3.6 }[style];
  // bake placement into path data by wrapping each piece's svg in a transform group (inner + fill drawn via d)
  const one = (flip, dx, dy, rot) => {
    const ps = buildOne(spec, style, { rng, flip });
    return ps.map((p) => wrapTransform(p, dx, dy, rot, flip));
  };
  let pairs;
  if (shot === 'alt') pairs = [{ pieces: one(1, -sep * 0.35, 1.5, 14) }, { pieces: one(-1, sep * 0.9, -0.4, -9) }];
  else pairs = [{ pieces: one(1, -sep, 0, -4) }, { pieces: one(-1, sep, 0, 4) }];
  const bw = sep * 2 + size * 0.7, bh = size + 4;
  if (shot === 'detail') {
    const k = ctx.u * 9.5 * (style === 'stud' ? 22 : style === 'hoop' ? 11 : 12);
    ctx.focusCamera(-sep * 0.95, size * (style === 'hoop' ? 0.45 : 0.32), k, { rot: 0.04, cx: 0.5, cy: 0.46 });
    await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.04 }, leaves: false });
    await paintPair(ctx, spec, pairs, { cloth: true, clothTop: size * 0.6, clothH: 60 });
    ctx.setDof({ axis: 'diag', dx: 0.6, dy: 0.8, focus: 0.55, band: 0.1, falloff: 0.36, sigma: 8 });
    return;
  }
  const b = { x0: -bw / 2, x1: bw / 2, y0: -1, y1: size + 2 };
  const k = Math.min((ctx.W * 0.74) / bw, (ctx.H * 0.5) / bh, 70 * ctx.u);
  ctx.cam = new Camera({ k, tx: ctx.W / 2, ty: ctx.H * 0.3, rot: 0 });
  await ctx.backdrop({ mode: 'wall', shaft: shot === 'alt' ? { strength: 0.05 } : true, leaves: false, seedOffset: shot === 'alt' ? 3 : 0 });
  await paintPair(ctx, spec, pairs, { cloth: true, clothTop: size * 0.5, clothH: 60 });
}

function wrapTransform(p, dx, dy, rot, flip) {
  // pieces carry cm-space paths; apply the placement by transforming the path data through a matrix on the albedo group
  const a = (rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const mx = (x, y) => [dx + flip * (x * c - y * s), dy + (x * s + y * c)];
  const tfd = (d) => d.replace(/(-?[\d.]+)[ ,](-?[\d.]+)/g, (m, x, y) => { const [X, Y] = mx(+x, +y); return `${f(X)} ${f(Y)}`; });
  // arcs (A rx ry rot large sweep x y) need special handling: only transform the endpoint
  const fixArcs = (d) => d.replace(/A(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) ([01]) ([01]) (-?[\d.]+) (-?[\d.]+)/g, (m, rx, ry, xr, la, sw, x, y) => { const [X, Y] = mx(+x, +y); return `A${rx} ${ry} ${xr} ${la} ${flip === -1 ? 1 - sw : sw} ${f(X)} ${f(Y)}`; });
  // simplest robust approach: wrap in a group transform and let the albedo builder apply it
  const tf = `translate(${dx} ${dy}) rotate(${rot}) scale(${flip} 1)`;
  const q = { ...p, _tf: tf };
  const pt = (x, y) => mx(x, y);
  const bb = p.bounds;
  const corners = [[bb.x0, bb.y0], [bb.x1, bb.y0], [bb.x1, bb.y1], [bb.x0, bb.y1]].map(([x, y]) => pt(x, y));
  q.bounds = boundsOfPts(corners);
  if (p.sphere) { const [u, v] = pt(p.sphere.u, p.sphere.v); q.sphere = { u, v, r: p.sphere.r }; }
  q.d = `<<TF:${tf}>>${p.d}`;
  q.inner = p.inner;
  return q;
}
