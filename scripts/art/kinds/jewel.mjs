// Necklace (layered / temple) and bangles (kundan / kada): flat-lay on soft draped silk, same studio as earrings.
// necklace: metal gold|oxidised|silver|rosegold, `color` nudges the metal tone, `color2` = stones.
// bangles : `count`, style kundan|kada, `color` = enamel / lacquer body, `color2` = kundan stones, `metal` for the trim.
import { Curve, f, lerp, polyD, tube, unionBounds, boundsOfPts, ellipseD } from '../lib/geometry.mjs';
import { mix, darken, lighten } from '../lib/color.mjs';
import { Camera } from '../lib/shade.mjs';
import { METALS, metalMat, part, stone, pearl, paintPair, wrapTransform, jewelOnDish } from './earrings.mjs';

const stoneColors = (spec) => {
  const a = spec.color2 || '#A33B3B';
  return [a, '#F4EFE6', mix(a, '#1F6F4F', 0.55)];
};

/** chain tube along a U-shaped curve: links are suggested by dark ticks across the tube */
function chain(id, curve, thick, metal, mat, z, tick = 0.5) {
  const { L, R } = tube(curve, thick, { n: 90 });
  const d = polyD([...L, ...R.slice().reverse()]);
  const n = Math.round(curve.length / tick);
  let inner = '';
  for (let i = 0; i <= n; i++) {
    const u = i / n, p = curve.at(u), nn = curve.normal(u), h = thick * 0.52;
    inner += `<path d="M${f(p[0] - nn[0] * h)} ${f(p[1] - nn[1] * h)}L${f(p[0] + nn[0] * h)} ${f(p[1] + nn[1] * h)}" stroke="#000" stroke-opacity="${i % 2 ? 0.34 : 0.14}" stroke-width="${f(tick * 0.2)}"/>`;
  }
  const b = boundsOfPts([...L, ...R]);
  return part(id, d, { x0: b.x0 - 0.5, y0: b.y0 - 0.5, x1: b.x1 + 0.5, y1: b.y1 + 0.5 }, metal, mat, { z, inner, bevel: thick * 0.4, bevelH: 0.4, edgeAo: 0.05 });
}

const uCurve = (w, d, pw = 2.0, lift = 0) => Curve.through(Array.from({ length: 13 }, (_, i) => { const t = (i / 12) * 2 - 1; return [w * t, lift + d * (1 - Math.pow(Math.abs(t), pw))]; }));

function bead(id, x, y, r, metal, mat, z) {
  return part(id, ellipseD(x, y, r, r), { x0: x - r - 1, y0: y - r - 1, x1: x + r + 1, y1: y + r + 1 }, metal, mat, { z, sphere: { u: x, v: y, r }, bevel: 0.05, contact: { dx: 0.05, dy: 0.1, sigma: 0.1, strength: 0.28 } });
}

function medallion(id, x, y, R, metal, mat, stoneC, z) {
  const ps = [];
  let petals = '';
  for (let i = 0; i < 12; i++) petals += `<path transform="translate(${f(x)} ${f(y)}) rotate(${i * 30})" d="M0 ${f(-R * 0.55)}C${f(R * 0.2)} ${f(-R * 0.75)} ${f(R * 0.2)} ${f(-R * 0.95)} 0 ${f(-R)}C${f(-R * 0.2)} ${f(-R * 0.95)} ${f(-R * 0.2)} ${f(-R * 0.75)} 0 ${f(-R * 0.55)}Z" fill="#000" fill-opacity=".28"/>`;
  ps.push(part(id, ellipseD(x, y, R, R), { x0: x - R - 1, y0: y - R - 1, x1: x + R + 1, y1: y + R + 1 }, metal, mat, { z, inner: petals + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R * 0.56)}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="${f(R * 0.06)}"/>`, bevel: R * 0.2, bevelH: 0.5 }));
  ps.push(stone(id + 's', x, y, R * 0.42, stoneC, z + 1));
  return ps;
}

function buildNecklace(ctx, spec, shot) {
  const style = spec.style === 'temple' ? 'temple' : 'layered';
  const base = METALS[spec.metal] || METALS.gold;
  const metal = lighten(spec.color && spec.metal !== 'silver' ? mix(base, spec.color, 0.32) : base, spec.metal === 'oxidised' ? 0.06 : 0.14);
  const mat = metalMat(spec.metal);
  const [st1, st2] = stoneColors(spec);
  const rng = ctx.rng.fork('neck-' + shot);
  const P = [];
  const lift = -2;
  if (style === 'layered') {
    const A = uCurve(6.4, 5.6, 2.1, lift), B = uCurve(8.2, 10.4, 2.0, lift), C = uCurve(9.8, 15.8, 1.9, lift);
    P.push(chain('chC', C, 0.36, metal, mat, 8), chain('chB', B, 0.3, darken(metal, 0.06), mat, 9), chain('chA', A, 0.42, lighten(metal, 0.06), mat, 10, 0.42));
    // small beads on the middle strand, pearls on the choker
    for (let i = 1; i < 13; i += 1) { const p = B.at(i / 13); P.push(bead('bb' + i, p[0], p[1], 0.3, metal, mat, 11)); }
    for (let i = 1; i < 8; i++) { const p = A.at(i / 8); P.push(pearl('pa' + i, p[0], p[1], 0.36, 11)); }
    // pendant on the long strand: teardrop frame + stone
    const pb = C.at(0.5), px = pb[0], py = pb[1];
    P.push(part('pend', `M${f(px)} ${f(py + 0.2)}C${f(px + 1.55)} ${f(py + 1.6)} ${f(px + 1.45)} ${f(py + 3.4)} ${f(px)} ${f(py + 4.1)}C${f(px - 1.45)} ${f(py + 3.4)} ${f(px - 1.55)} ${f(py + 1.6)} ${f(px)} ${f(py + 0.2)}Z`,
      { x0: px - 2.2, y0: py - 0.5, x1: px + 2.2, y1: py + 4.6 }, metal, mat, { z: 12, bevel: 0.35, bevelH: 0.5 }));
    P.push(stone('pst', px, py + 2.3, 0.82, st1, 13), bead('pbail', px, py - 0.1, 0.36, metal, mat, 12));
    for (const sx of [-1, 1]) for (const [w, y] of [[6.4, 0], [8.2, 0], [9.8, 0]]) P.push(bead('end' + sx + w, sx * w, y + lift, 0.42, lighten(metal, 0.1), mat, 12));
  } else {
    // temple: three bib bands with stones and pearl drops, a long coin strand and a central medallion
    const rows = [[7.2, 5.0, 1.35], [8.8, 7.6, 1.25], [10.2, 10.0, 1.15]];
    rows.forEach(([w, d, th], r) => {
      const c = uCurve(w, d, 1.9, lift);
      P.push(chain('bib' + r, c, th, metal, mat, 8 + r, 0.42));
      const n = 9 + r * 2;
      for (let i = 1; i < n; i++) { const p = c.at(i / n); P.push(stone(`bs${r}_${i}`, p[0], p[1], th * 0.3, i % 3 === 1 ? st2 : (i % 3 === 2 ? '#F4EFE6' : st1), 13 + r, { facets: false })); }
      const m = 10 + r * 2;
      for (let i = 1; i < m; i++) { const t = i / m, p = c.at(t), nn = c.normal(t), dir = nn[1] > 0 ? 1 : -1; P.push(pearl(`bp${r}_${i}`, p[0] + nn[0] * dir * (th * 0.5 + 0.34), p[1] + nn[1] * dir * (th * 0.5 + 0.34), 0.3, 12)); }
    });
    const L = uCurve(10.8, 19.5, 1.7, lift);
    P.push(chain('longc', L, 0.3, metal, mat, 7, 0.5));
    for (let i = 1; i < 11; i++) {
      const p = L.at(i / 11), r = 0.8 + 0.5 * Math.sin((i / 11) * Math.PI);
      P.push(part('coin' + i, ellipseD(p[0], p[1], r, r), { x0: p[0] - r - 1, y0: p[1] - r - 1, x1: p[0] + r + 1, y1: p[1] + r + 1 }, metal, mat,
        { z: 9, inner: `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r * 0.62)}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="${f(r * 0.12)}"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r * 0.2)}" fill="#000" fill-opacity=".3"/>`, bevel: r * 0.35, bevelH: 0.5 }));
    }
    const m0 = L.at(0.5);
    P.push(...medallion('med', m0[0], m0[1] + 2.4, 2.3, lighten(metal, 0.04), mat, st1, 14));
  }
  const bounds = unionBounds(P.map((p) => p.bounds));
  return { pieces: P, bounds, style };
}

function ringD(cx, cy, rx, ry, rxi, ryi) {
  const e = (x, y, a, b, sw) => `M${f(x - a)} ${f(y)}A${f(a)} ${f(b)} 0 1 ${sw} ${f(x + a)} ${f(y)}A${f(a)} ${f(b)} 0 1 ${sw} ${f(x - a)} ${f(y)}Z`;
  return e(cx, cy, rx, ry, 1) + e(cx, cy, rxi, ryi, 0);
}

function buildBangles(ctx, spec, shot) {
  const style = spec.style === 'kada' ? 'kada' : 'kundan';
  const n = Math.max(1, Math.min(8, spec.count | 0 || (style === 'kada' ? 2 : 6)));
  const rng = ctx.rng.fork('bang-' + shot);
  const base = METALS[spec.metal] || METALS.gold;
  const metal = base;
  const mat = metalMat(spec.metal);
  const body = spec.color || '#1F6F78';
  const enamel = { amb: 0.34, wrap: 0.22, spec: 0.5, shin: 22, rim: 0.05, tex: { type: 'none', amp: 0, bump: 0 } };
  const [st1, st2, st3] = stoneColors(spec);
  const P = [];
  const R = style === 'kada' ? 5.5 : 5.3, t = style === 'kada' ? 1.9 : 1.6, tilt = shot === 'alt' ? 0.46 : 0.4;
  const rings = [];
  if (n <= 3) for (let i = 0; i < n; i++) rings.push([(i - (n - 1) / 2) * R * 1.55 + (shot === 'alt' ? i * 0.6 : 0), (i % 2 ? -0.6 : 0.4) - (shot === 'alt' ? i * 0.8 : 0), R * (1 - 0.03 * i)]);
  else {
    // a leaning stack: rings piled with a small sideways drift so each shows its front band
    for (let i = 0; i < n; i++) rings.push([Math.sin(i * 1.9) * 0.6 + (shot === 'alt' ? (i - n / 2) * 0.55 : 0), -i * (shot === 'alt' ? 1.5 : 1.3), R]);
  }
  rings.forEach(([cx, cy, r], i) => {
    const ry = r * tilt, rxi = r - t, ryi = ry - t * tilt * 0.95;
    const d = ringD(cx, cy, r, ry, rxi, ryi);
    const edge = `<path d="${ringD(cx, cy, r - 0.05, ry - 0.05, rxi + 0.05, ryi + 0.05)}" fill="none" stroke="${metal}" stroke-width="0.2" fill-rule="evenodd"/>`;
    let inner = '';
    if (style === 'kada') {
      // engraved border: short ticks along the front band
      for (let q = 0; q < 34; q++) { const a = (q / 34) * Math.PI; const rm = r - t * 0.5, rym = ry - t * tilt * 0.5; const x = cx + Math.cos(a) * rm, y = cy + Math.sin(a) * rym; inner += `<path d="M${f(x)} ${f(y - 0.34)}L${f(x)} ${f(y + 0.34)}" stroke="#000" stroke-opacity=".32" stroke-width=".09"/>`; }
    }
    P.push(part('ring' + i, d, { x0: cx - r - 1, y0: cy - ry - 1, x1: cx + r + 1, y1: cy + ry + 1 }, style === 'kada' ? metal : body, style === 'kada' ? mat : enamel, { z: 8 + i * 2, inner: inner + (style === 'kada' ? '' : edge), bevel: t * 0.46, bevelH: 0.62, edgeAo: 0.08, contact: { dx: 0.2, dy: 0.35, sigma: 0.35, strength: 0.34 } }));
    if (style === 'kundan') {
      const m = 8;
      for (let q = 0; q < m; q++) {
        const a = 0.18 + (q / (m - 1)) * (Math.PI - 0.36), rm = r - t * 0.5, rym = ry - t * tilt * 0.5;
        const x = cx + Math.cos(a) * rm, y = cy + Math.sin(a) * rym, sr = 0.27 + 0.05 * Math.sin(a);
        const col = q % 3 === 1 ? st1 : q % 3 === 0 ? st2 : st3;
        P.push(stone(`k${i}_${q}`, x, y, sr, col, 9 + i * 2, { facets: true }));
        P.push(part(`kg${i}_${q}`, ellipseD(x, y, sr + 0.1, sr + 0.1), { x0: x - 1, y0: y - 1, x1: x + 1, y1: y + 1 }, metal, mat, { z: 8.6 + i * 2, bevel: 0.08, contact: false }));
      }
    }
  });
  const bounds = unionBounds(P.map((p) => p.bounds));
  return { pieces: P, bounds, style, n };
}

function frame(ctx, bounds, { fill = 0.7, maxH = 0.6, kmax = 70, cy = 0.46, rot = 0 } = {}) {
  const bw = bounds.x1 - bounds.x0, bh = bounds.y1 - bounds.y0;
  if (ctx.place) { ctx._placeCam(bounds); return; }
  const k = Math.min((ctx.W * fill) / bw, (ctx.H * maxH) / bh, kmax * ctx.u);
  const c = new Camera({ k, tx: 0, ty: 0, rot });
  const [px, py] = c.fwd((bounds.x0 + bounds.x1) / 2, (bounds.y0 + bounds.y1) / 2);
  ctx.cam = new Camera({ k, tx: ctx.W / 2 - px, ty: ctx.H * cy - py, rot });
}

function make(buildFn, { fill, maxH, kmax, dz }) {
  return {
    async scene(ctx, spec) {
      const m = buildFn(ctx, spec, 'front');
      const w = m.bounds.x1 - m.bounds.x0, h = m.bounds.y1 - m.bounds.y0;
      // shift so the lowest point sits at y=0 and the piece stands on a dish
      const dy = -m.bounds.y1;
      const pieces = m.pieces.map((p) => wrapTransform(p, 0, dy, 0, 1));
      await jewelOnDish(ctx, spec, pieces, { w, h });
    },
    async front(ctx, spec) {
      const m = buildFn(ctx, spec, 'front');
      frame(ctx, m.bounds, { fill: m.n && m.n <= 3 ? 0.84 : fill, maxH, kmax });
      await ctx.backdrop({ mode: 'wall', shaft: true, leaves: false });
      await paintPair(ctx, spec, [{ pieces: m.pieces }], { cloth: true, clothTop: m.bounds.y0 + (m.bounds.y1 - m.bounds.y0) * 0.5, clothH: 60 });
    },
    async alt(ctx, spec) {
      const m = buildFn(ctx, spec, 'alt');
      frame(ctx, m.bounds, { fill: (m.n && m.n <= 3 ? 0.84 : fill) * 0.92, maxH, kmax, rot: -0.2, cy: 0.5 });
      await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.05 }, leaves: false, seedOffset: 3 });
      await paintPair(ctx, spec, [{ pieces: m.pieces }], { cloth: true, clothTop: m.bounds.y0 + (m.bounds.y1 - m.bounds.y0) * 0.5, clothH: 60 });
    },
    async detail(ctx, spec) {
      const m = buildFn(ctx, spec, 'front');
      const b = m.bounds, k = ctx.u * 9.5 * dz;
      ctx.focusCamera((b.x0 + b.x1) * 0.5 * 0.9, b.y0 + (b.y1 - b.y0) * (m.style === 'kundan' || m.style === 'kada' ? 0.55 : 0.62), k, { rot: 0.05, cx: 0.5, cy: 0.5 });
      await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.04 }, leaves: false });
      await paintPair(ctx, spec, [{ pieces: m.pieces }], { cloth: true, clothTop: b.y0 + 4, clothH: 60 });
      ctx.setDof({ axis: 'diag', dx: 0.6, dy: 0.8, focus: 0.55, band: 0.1, falloff: 0.36, sigma: 8 });
    },
  };
}

export const necklace = make(buildNecklace, { fill: 0.82, maxH: 0.7, kmax: 60, dz: 6.2 });
export const bangles = make(buildBangles, { fill: 0.64, maxH: 0.52, kmax: 60, dz: 6.8 });
