// Pattern library. Every builder returns { defs, fill, ink } where `defs` contains <pattern id="pat"> (cm space,
// patternUnits=userSpaceOnUse so scale follows the fabric, not the canvas) and `fill` is 'url(#pat)'.
// Motifs are drawn with per-instance jitter (rotation / scale / offset / ink density) so repeats feel hand-made.
import { Rng } from './prng.mjs';
import { f, Curve, tube, polyD } from './geometry.mjs';
import { mix, lighten, darken, luma, adjust, toHsl, fromHsl, shadowOf, highlightOf } from './color.mjs';

export const PATTERNS = ['solid', 'stripe', 'pinstripe', 'check', 'gingham', 'polka', 'floral', 'paisley', 'block-print', 'ikat', 'bandhani',
  'chevron', 'embroidery', 'sequin', 'mirror-work', 'abstract', 'tonal-jacquard'];

/** a pleasant contrasting ink if the caller gave only a base colour */
export function autoInk(base) {
  const l = luma(base);
  if (l > 0.62) return mix(adjust(base, { ds: 1.1, dl: -0.34 }), '#2b2320', 0.18);
  if (l > 0.35) return mix(adjust(base, { ds: 0.7, dl: 0.4 }), '#f3ebdd', 0.35);
  return mix(adjust(base, { ds: 0.55, dl: 0.5 }), '#f3ebdd', 0.3);
}
function inks(spec) {
  const c1 = spec.color || '#8B2E3C';
  const c2 = spec.color2 || autoInk(c1);
  const c3 = spec.color3 || mix(c2, c1, 0.5);
  return { c1, c2, c3 };
}

const petal = (len, wid) => `M0 0C${f(wid)} ${f(-len * 0.28)} ${f(wid * 0.78)} ${f(-len * 0.92)} 0 ${f(-len)}C${f(-wid * 0.78)} ${f(-len * 0.92)} ${f(-wid)} ${f(-len * 0.28)} 0 0Z`;
const leaf = (len, wid) => `M0 0C${f(wid)} ${f(-len * 0.3)} ${f(wid * 0.9)} ${f(-len * 0.75)} 0 ${f(-len)}C${f(-wid * 0.9)} ${f(-len * 0.75)} ${f(-wid)} ${f(-len * 0.3)} 0 0Z`;

function tileWrap(w, h, body, { id = 'pat', transform = '', extraDefs = '' } = {}) {
  return `${extraDefs}<pattern id="${id}" patternUnits="userSpaceOnUse" width="${f(w)}" height="${f(h)}"${transform ? ` patternTransform="${transform}"` : ''}>${body}</pattern>`;
}

/** draw a motif at all wrap-around positions that touch the tile so tiles seam perfectly */
function wrapUse(id, x, y, w, h, rot, sc, r) {
  let s = '';
  const xs = [0], ys = [0];
  if (x < r) xs.push(w); if (x > w - r) xs.push(-w);
  if (y < r) ys.push(h); if (y > h - r) ys.push(-h);
  for (const dx of xs) for (const dy of ys) s += `<use href="#${id}" transform="translate(${f(x + dx)} ${f(y + dy)}) rotate(${f(rot)}) scale(${f(sc)})"/>`;
  return s;
}

// ---------------------------------------------------------------- builders
const B = {};

B.solid = () => ({ defs: '', fill: null });

B.stripe = (spec, rng) => {
  const { c2 } = inks(spec);
  const w = spec.scale || 4.2, bw = w * rng.range(0.34, 0.46);
  const ang = spec.angle ?? 0;
  const body = `<rect x="0" y="0" width="${f(bw)}" height="${f(w)}" fill="${c2}" opacity=".96"/>` +
    (spec.color3 ? `<rect x="${f(bw + (w - bw) * 0.55)}" y="0" width="${f(w * 0.06)}" height="${f(w)}" fill="${spec.color3}"/>` : '');
  return { defs: tileWrap(w, w, body, { transform: `rotate(${ang})` }), fill: 'url(#pat)' };
};

B.pinstripe = (spec, rng) => {
  const { c2 } = inks(spec);
  const w = spec.scale || 1.45;
  const body = `<rect x="0" y="0" width="${f(w * 0.075)}" height="${f(w)}" fill="${c2}" opacity=".85"/>`;
  return { defs: tileWrap(w, w, body, { transform: `rotate(${spec.angle ?? 0})` }), fill: 'url(#pat)' };
};

B.check = (spec, rng) => {
  const { c2, c3 } = inks(spec);
  const w = spec.scale || 7.5;
  const band = w * 0.3;
  const body = `<rect x="0" y="0" width="${f(band)}" height="${f(w)}" fill="${c2}" opacity=".42"/>` +
    `<rect x="0" y="0" width="${f(w)}" height="${f(band)}" fill="${c2}" opacity=".42"/>` +
    `<rect x="${f(w * 0.62)}" y="0" width="${f(w * 0.05)}" height="${f(w)}" fill="${c3}" opacity=".9"/>` +
    `<rect x="0" y="${f(w * 0.62)}" width="${f(w)}" height="${f(w * 0.05)}" fill="${c3}" opacity=".9"/>`;
  return { defs: tileWrap(w, w, body), fill: 'url(#pat)' };
};

B.gingham = (spec, rng) => {
  const { c2 } = inks(spec);
  const w = spec.scale || 2.2;
  const body = `<rect x="0" y="0" width="${f(w / 2)}" height="${f(w)}" fill="${c2}" opacity=".5"/>` +
    `<rect x="0" y="0" width="${f(w)}" height="${f(w / 2)}" fill="${c2}" opacity=".5"/>`;
  return { defs: tileWrap(w, w, body), fill: 'url(#pat)' };
};

B.polka = (spec, rng) => {
  const { c2 } = inks(spec);
  const s = spec.scale || 3.4, r = s * 0.16;
  const body = `<circle cx="${f(s / 2)}" cy="${f(s / 2)}" r="${f(r)}" fill="${c2}"/>` +
    [[0, 0], [s, 0], [0, s], [s, s]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${f(r)}" fill="${c2}"/>`).join('');
  return { defs: tileWrap(s, s, body), fill: 'url(#pat)' };
};

B.chevron = (spec, rng) => {
  const { c2 } = inks(spec);
  const w = spec.scale || 6, h = w * 0.5, t = h * 0.42;
  const body = `<path d="M0 ${f(h * 0.5)}L${f(w / 2)} 0L${f(w)} ${f(h * 0.5)}L${f(w)} ${f(h * 0.5 + t)}L${f(w / 2)} ${f(t)}L0 ${f(h * 0.5 + t)}Z" fill="${c2}"/>` +
    `<path d="M0 ${f(-h * 0.5)}L${f(w / 2)} ${f(-h)}L${f(w)} ${f(-h * 0.5)}L${f(w)} ${f(-h * 0.5 + t)}L${f(w / 2)} ${f(-h + t)}L0 ${f(-h * 0.5 + t)}Z" fill="${c2}"/>` +
    `<path d="M0 ${f(h * 1.5)}L${f(w / 2)} ${f(h)}L${f(w)} ${f(h * 1.5)}L${f(w)} ${f(h * 1.5 + t)}L${f(w / 2)} ${f(h + t)}L0 ${f(h * 1.5 + t)}Z" fill="${c2}"/>`;
  return { defs: tileWrap(w, h, body), fill: 'url(#pat)' };
};

// ---- florals ----------------------------------------------------------------
function flowerDef(id, rng, { petals, len, wid, c, centre, ring }) {
  let g = '';
  const n = petals, off = rng.range(0, 360 / n);
  for (let i = 0; i < n; i++) {
    const L = len * rng.range(0.9, 1.08), Wd = wid * rng.range(0.9, 1.1);
    g += `<path transform="rotate(${f(off + (360 / n) * i + rng.range(-4, 4))})" d="${petal(L, Wd)}" fill="${c}"/>`;
  }
  if (ring) g += `<circle r="${f(len * 0.34)}" fill="${ring}" opacity=".9"/>`;
  g += `<circle r="${f(len * 0.17)}" fill="${centre}"/>`;
  return `<g id="${id}">${g}</g>`;
}

B.floral = (spec, rng) => {
  const { c1, c2, c3 } = inks(spec);
  const S = spec.scale || 0.85;
  const T = 40 * S;
  const leafC = spec.color3 || mix(lighten(c1, 0.12), c2, 0.32);
  const petalC = c2, centreC = luma(c2) > 0.55 ? mix(c3, '#b9852a', 0.55) : lighten(c2, 0.6);
  let defs = '';
  defs += flowerDef('fl1', rng, { petals: 5, len: 2.9 * S, wid: 1.55 * S, c: petalC, centre: centreC });
  defs += flowerDef('fl2', rng, { petals: 6, len: 2.1 * S, wid: 1.05 * S, c: mix(petalC, c1, 0.28), centre: centreC });
  defs += flowerDef('fl3', rng, { petals: 8, len: 1.25 * S, wid: 0.55 * S, c: mix(petalC, '#ffffff', 0.18), centre: centreC });
  defs += `<g id="lf"><path d="${leaf(2.6 * S, 0.8 * S)}" fill="${leafC}"/><path d="M0 0L0 ${f(-2.2 * S)}" stroke="${mix(leafC, c1, 0.45)}" stroke-width="${f(0.07 * S)}"/></g>`;
  defs += `<g id="sprig"><path d="M0 0C${f(0.6 * S)} ${f(-1.6 * S)} ${f(-0.3 * S)} ${f(-3 * S)} ${f(0.4 * S)} ${f(-4.6 * S)}" stroke="${leafC}" stroke-width="${f(0.12 * S)}" fill="none"/>` +
    `<use href="#lf" transform="translate(${f(0.2 * S)} ${f(-1.1 * S)}) rotate(48) scale(.7)"/><use href="#lf" transform="translate(${f(0.1 * S)} ${f(-2.2 * S)}) rotate(-52) scale(.75)"/>` +
    `<use href="#lf" transform="translate(${f(0.35 * S)} ${f(-3.7 * S)}) rotate(14) scale(.6)"/></g>`;
  let body = '';
  // dart-throwing (blue-noise-ish) layout on a wrapped tile so repeats never read as a grid
  const pts = [];
  const minD = 6.2 * S, N = Math.round(26 * (T / (38 * S)) ** 2);
  const wd = (a, b) => { let m = 1e9; for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) m = Math.min(m, Math.hypot(a[0] - b[0] + ox, a[1] - b[1] + oy)); return m; };
  for (let tries = 0; pts.length < N && tries < 6000; tries++) {
    const p = [rng.range(0, T), rng.range(0, T)];
    if (pts.every((q) => wd(p, q) > minD * (tries > 3000 ? 0.8 : 1))) pts.push(p);
  }
  pts.forEach(([x, y], idx) => {
    const rot = rng.range(0, 360), r = rng.next();
    if (r < 0.34) {
      body += wrapUse('fl1', x, y, T, T, rot, rng.range(0.85, 1.2), 6 * S);
      for (let q = 0; q < 2; q++) body += wrapUse('lf', x, y, T, T, rot + 150 + q * 70 + rng.range(-20, 20), rng.range(0.85, 1.1), 7 * S);
    } else if (r < 0.58) {
      body += wrapUse('fl2', x, y, T, T, rot, rng.range(0.9, 1.25), 5 * S);
      body += wrapUse('sprig', x + 0.5, y + 0.8, T, T, rng.range(-40, 40), 1, 9 * S);
    } else if (r < 0.82) {
      body += wrapUse('sprig', x, y, T, T, rng.range(0, 360), rng.range(0.9, 1.3), 9 * S);
      body += wrapUse('fl3', x + 1.4, y - 0.6, T, T, rot, 1, 4 * S);
    } else {
      body += wrapUse('fl3', x, y, T, T, rot, rng.range(0.9, 1.4), 4 * S);
      body += wrapUse('lf', x, y, T, T, rot + 90, 0.8, 6 * S);
    }
  });
  return { defs: tileWrap(T, T, body, { extraDefs: defs }), fill: 'url(#pat)' };
};

B.paisley = (spec, rng) => {
  const { c1, c2, c3 } = inks(spec);
  const S = spec.scale || 1;
  const T = 26 * S;
  const bodyC = c2, accentC = mix(c3, c2, 0.2), dotC = c3;
  // boteh: a plump teardrop sheared into a lazy S with a hooked tip. Built as a plain width profile + lateral bend
  // (no spine normals, so the tip never folds over itself). Bulb centre sits at the origin, tip curls up and to the right.
  const L = 10, W = 6.6, N = 84;
  const bend = (u) => 0.26 * L * u * u + 0.26 * L * Math.pow(Math.max(0, u - 0.52) / 0.48, 2.4);
  const widthAt = (u) => W * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.6)), 0.92);
  const boteh = (sc, ox = 0, oy = 0) => {
    const l = [], r = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, y = -u * L * sc, w = widthAt(u) * sc, b = bend(u) * sc;
      l.push([b - w * 0.54, y]); r.push([b + w * 0.46, y]);
    }
    return polyD([...l, ...r.reverse()].map(([x, y]) => [x + ox, y + oy]));
  };
  const rosette = (R, c, c2_) => {
    let g = '';
    for (let i = 0; i < 6; i++) g += `<path transform="rotate(${i * 60})" d="${petal(R, R * 0.42)}" fill="${c}"/>`;
    return g + `<circle r="${f(R * 0.2)}" fill="${c2_}"/>`;
  };
  let defs = `<g id="pa">` +
    `<path d="${boteh(1, 0, 4.6)}" fill="${bodyC}"/>` +
    `<path d="${boteh(0.8, 0.0, 3.6)}" fill="${c1}"/>` +
    `<path d="${boteh(0.62, 0.0, 2.9)}" fill="${accentC}"/>` +
    `<path d="${boteh(0.3, -0.1, 1.5)}" fill="${c1}"/>` +
    `<g transform="translate(-0.05 1.1)">${rosette(1.12, bodyC, c1)}</g>` +
    [0, 1, 2, 3, 4, 5, 6].map((i) => { const u = 0.2 + i * 0.105; return `<circle cx="${f(bend(u) - widthAt(u) * 0.54 - 0.62 * (1 - 0.3 * u))}" cy="${f(4.6 - u * L)}" r="${f(0.17 + 0.05 * Math.sin(u * 3))}" fill="${dotC}"/>`; }).join('') +
    `</g>`;
  defs += `<g id="pr">${rosette(1.15, dotC, bodyC)}</g>`;
  let body = '';
  // classic half-drop: same shape throughout, alternate rows turned half a circle so tips and bulbs interlock
  const A = [[0.25, 0.25, -12], [0.75, 0.25, -12]], Bq = [[0.0, 0.75, 168], [0.5, 0.75, 168]];
  for (const [fx, fy, rot] of [...A, ...Bq]) {
    const x = fx * T + rng.range(-0.4, 0.4) * S, y = fy * T + rng.range(-0.4, 0.4) * S;
    body += wrapUse('pa', x, y, T, T, rot + rng.range(-5, 5), S * rng.range(0.96, 1.04), 9 * S);
  }
  for (const [fx, fy] of [[0.5, 0.25], [0.0, 0.25], [0.25, 0.75], [0.75, 0.75]]) body += wrapUse('pr', fx * T, fy * T, T, T, rng.range(0, 60), S, 2 * S);
  for (let i = 0; i < 10; i++) body += `<circle cx="${f(rng.range(0, T))}" cy="${f(rng.range(0, T))}" r="${f(rng.range(0.12, 0.2) * S)}" fill="${dotC}" opacity=".8"/>`;
  return { defs: tileWrap(T, T, body, { extraDefs: defs }), fill: 'url(#pat)' };
};

B['block-print'] = (spec, rng) => {
  const { c1, c2, c3 } = inks(spec);
  const S = spec.scale || 1.3;
  const T = 32 * S;
  const ink = c2, ink2 = spec.color3 || mix(c2, c1, 0.35);
  let defs = '';
  // hand-carved wooden-block motifs: rosette buti, three-leaf sprig, tiny dot cluster
  let buti = '';
  for (let i = 0; i < 8; i++) buti += `<path transform="rotate(${i * 45})" d="${petal(1.9 * S, 0.62 * S)}" fill="${ink}"/>`;
  buti += `<circle r="${f(0.78 * S)}" fill="${c1}"/><circle r="${f(0.5 * S)}" fill="${ink}"/><circle r="${f(0.2 * S)}" fill="${c1}"/>`;
  for (let i = 0; i < 8; i++) buti += `<circle cx="${f(Math.cos(i * 0.785 + 0.39) * 2.35 * S)}" cy="${f(Math.sin(i * 0.785 + 0.39) * 2.35 * S)}" r="${f(0.14 * S)}" fill="${ink}"/>`;
  defs += `<g id="bt">${buti}</g>`;
  let rose = '';
  for (let i = 0; i < 5; i++) rose += `<path transform="rotate(${i * 72})" d="${petal(1.5 * S, 0.8 * S)}" fill="${ink2}"/>`;
  rose += `<circle r="${f(0.4 * S)}" fill="${c1}"/><circle r="${f(0.2 * S)}" fill="${ink2}"/>`;
  defs += `<g id="rs">${rose}</g>`;
  defs += `<g id="sp"><path d="M0 0C${f(0.5 * S)} ${f(-1.5 * S)} ${f(-0.2 * S)} ${f(-3 * S)} ${f(0.2 * S)} ${f(-4.4 * S)}" stroke="${ink}" stroke-width="${f(0.16 * S)}" fill="none" stroke-linecap="round"/>` +
    `<path transform="translate(${f(0.15 * S)} ${f(-1.2 * S)}) rotate(52)" d="${leaf(1.7 * S, 0.5 * S)}" fill="${ink}"/><path transform="translate(${f(0.05 * S)} ${f(-2.3 * S)}) rotate(-54)" d="${leaf(1.7 * S, 0.5 * S)}" fill="${ink}"/>` +
    `<path transform="translate(${f(0.2 * S)} ${f(-4.2 * S)}) rotate(4)" d="${leaf(1.5 * S, 0.45 * S)}" fill="${ink}"/></g>`;
  defs += `<g id="dt"><circle r="${f(0.2 * S)}" fill="${ink}"/><circle cx="${f(0.7 * S)}" cy="${f(0.3 * S)}" r="${f(0.16 * S)}" fill="${ink}"/><circle cx="${f(-0.5 * S)}" cy="${f(0.65 * S)}" r="${f(0.16 * S)}" fill="${ink}"/></g>`;
  const pts = [];
  const minD = 4.6 * S;
  const wd = (a, b) => { let m = 1e9; for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) m = Math.min(m, Math.hypot(a[0] - b[0] + ox, a[1] - b[1] + oy)); return m; };
  for (let tries = 0; pts.length < 34 && tries < 8000; tries++) {
    const p = [rng.range(0, T), rng.range(0, T)];
    if (pts.every((q) => wd(p, q) > minD * (tries > 4000 ? 0.75 : 1))) pts.push(p);
  }
  let body = '';
  pts.forEach(([x, y], i) => {
    const r = rng.next();
    const id = r < 0.46 ? 'bt' : r < 0.68 ? 'rs' : r < 0.9 ? 'sp' : 'dt';
    const o = rng.range(0.8, 0.97), rot = (id === 'sp' ? rng.range(-35, 35) : rng.range(-8, 8)) + (id === 'bt' ? rng.range(0, 45) : 0);
    const sc = rng.range(0.92, 1.1);
    for (const ox of [0, -T, T]) for (const oy of [0, -T, T]) {
      const X = x + ox, Y = y + oy;
      if (X < -4 * S || X > T + 4 * S || Y < -4 * S || Y > T + 4 * S) continue;
      body += `<use href="#${id}" opacity="${f(o)}" transform="translate(${f(X)} ${f(Y)}) rotate(${f(rot)}) scale(${f(sc)})"/>`;
    }
  });
  return { defs: tileWrap(T, T, body, { extraDefs: defs }), fill: 'url(#pat)' };
};

B.ikat = (spec, rng) => {
  const { c1, c2, c3 } = inks(spec);
  const S = spec.scale || 1;
  const w = 9 * S, h = 12 * S;
  const filt = `<filter id="ikf" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${f(0.17 * S)} ${f(0.05 * S)}"/></filter>`;
  let body = '';
  // vertical bands of stepped diamonds with feathered edges
  const diamond = (cx, cy, r, c) => {
    let p = '';
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      const rr = r * (1 - i / steps), jx = rng.range(-0.12, 0.12) * S;
      p += `<path d="M${f(cx + jx)} ${f(cy - rr)}L${f(cx + rr * 0.72 + jx)} ${f(cy)}L${f(cx + jx)} ${f(cy + rr)}L${f(cx - rr * 0.72 + jx)} ${f(cy)}Z" fill="${i % 2 ? c1 : c}"/>`;
    }
    return p;
  };
  let g = '';
  for (let j = 0; j < 2; j++) {
    const cy = h * (0.25 + 0.5 * j);
    g += diamond(w * 0.5, cy, 4.1 * S, c2);
    g += diamond(0, cy + h * 0.25, 2.6 * S, c3) + diamond(w, cy + h * 0.25, 2.6 * S, c3);
    g += `<path d="M0 ${f(cy - h * 0.06)}L${f(w)} ${f(cy - h * 0.06)}" stroke="${c3}" stroke-width="${f(0.24 * S)}" opacity=".85"/>`;
  }
  // warp-dyed streaks
  for (let i = 0; i < 18; i++) {
    const x = rng.range(0, w), y = rng.range(0, h), L = rng.range(0.6, 2.2) * S;
    g += `<rect x="${f(x)}" y="${f(y)}" width="${f(0.1 * S)}" height="${f(L)}" fill="${rng.chance(0.5) ? c2 : c3}" opacity=".7"/>`;
  }
  body = `<g filter="url(#ikf)">${g}</g>`;
  return { defs: tileWrap(w, h, body, { extraDefs: filt }), fill: 'url(#pat)' };
};

B.bandhani = (spec, rng) => {
  const { c1, c2, c3 } = inks(spec);
  const S = spec.scale || 1;
  const T = 7.2 * S;
  const rdot = 0.17 * S;
  const dye = `<radialGradient id="bdg" cx=".4" cy=".38" r=".7"><stop offset="0" stop-color="${lighten(c2, 0.3)}"/><stop offset=".7" stop-color="${c2}"/><stop offset="1" stop-color="${mix(c2, c1, 0.6)}"/></radialGradient>`;
  const dot = (x, y, r = rdot) => `<circle cx="${f(x + rng.range(-0.025, 0.025) * S)}" cy="${f(y + rng.range(-0.025, 0.025) * S)}" r="${f(r * rng.range(0.85, 1.12))}" fill="url(#bdg)"/>`;
  const cluster = (cx, cy) => {
    let s = dot(cx, cy, rdot * 1.25);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s += dot(cx + Math.cos(a) * 0.72 * S, cy + Math.sin(a) * 0.72 * S); }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + 0.2; s += dot(cx + Math.cos(a) * 1.32 * S, cy + Math.sin(a) * 1.32 * S, rdot * 0.9); }
    return s;
  };
  let body = '';
  for (const [x, y] of [[0.25, 0.25], [0.75, 0.75], [0.75, 0.25], [0.25, 0.75]]) {
    for (const ox of [0, -T, T]) for (const oy of [0, -T, T]) {
      const cx = x * T + ox, cy = y * T + oy;
      if (cx < -2 * S || cx > T + 2 * S || cy < -2 * S || cy > T + 2 * S) continue;
      body += (x === 0.25 && y === 0.25) || (x === 0.75 && y === 0.75) ? cluster(cx, cy) : dot(cx, cy, rdot * 1.2) + [0, 1, 2, 3].map((i) => dot(cx + Math.cos(i * 1.57) * 0.62 * S, cy + Math.sin(i * 1.57) * 0.62 * S)).join('');
    }
  }
  for (let i = 0; i < 30; i++) body += dot(rng.range(0, T), rng.range(0, T), rdot * 0.55);
  return { defs: tileWrap(T, T, body, { extraDefs: dye }), fill: 'url(#pat)' };
};

B.embroidery = (spec, rng) => {
  const { c1, c2, c3 } = inks(spec);
  const S = spec.scale || 1;
  const T = 15 * S;
  const thread = (c) => c;
  const hatch = (len, wid, c) => {
    let h = '';
    const n = Math.max(4, Math.round(len / (0.14 * S)));
    for (let i = 0; i < n; i++) {
      const y = -(i + 0.5) * (len / n), w = wid * Math.sin(Math.PI * (i + 0.5) / n) * 0.9;
      h += `<path d="M${f(-w)} ${f(y)}L${f(w)} ${f(y - 0.08 * S)}" stroke="${i % 3 ? c : lighten(c, 0.22)}" stroke-width="${f(0.14 * S)}" stroke-linecap="round"/>`;
    }
    return h;
  };
  let defs = '';
  let fl = '';
  for (let i = 0; i < 6; i++) fl += `<g transform="rotate(${i * 60})">${hatch(1.7 * S, 0.45 * S, c2)}</g>`;
  fl += `<circle r="${f(0.3 * S)}" fill="${c3}"/><circle r="${f(0.14 * S)}" fill="${lighten(c3, 0.35)}"/>`;
  defs += `<g id="ef">${fl}</g>`;
  defs += `<g id="el">${hatch(1.5 * S, 0.34 * S, mix(c2, c1, 0.4))}</g>`;
  defs += `<g id="ev"><path d="M0 0C${f(0.8 * S)} ${f(-1.4 * S)} ${f(-0.7 * S)} ${f(-2.8 * S)} ${f(0.3 * S)} ${f(-4.2 * S)}" stroke="${mix(c2, c1, 0.35)}" stroke-width="${f(0.17 * S)}" fill="none" stroke-linecap="round"/>` +
    `<g transform="translate(${f(0.35 * S)} ${f(-1.4 * S)}) rotate(50)"><use href="#el"/></g><g transform="translate(${f(-0.05 * S)} ${f(-2.7 * S)}) rotate(-55)"><use href="#el"/></g></g>`;
  let body = '';
  const pos = [[0.22, 0.25], [0.72, 0.18], [0.5, 0.58], [0.15, 0.78], [0.85, 0.75]];
  pos.forEach(([fx, fy], i) => {
    const x = fx * T, y = fy * T;
    body += wrapUse(i % 2 ? 'ev' : 'ef', x, y, T, T, rng.range(0, 360), rng.range(0.9, 1.1), 4 * S);
    body += wrapUse('ev', x + 1.8 * S, y + 1.4 * S, T, T, rng.range(0, 360), 0.8, 4 * S);
  });
  return { defs: tileWrap(T, T, body, { extraDefs: defs }), fill: 'url(#pat)', fx: { spec: 0.08, shin: 14 } };
};

B.sequin = (spec, rng) => {
  const { c1, c2, c3 } = inks(spec);
  const r = (spec.scale || 1) * 0.3;
  const dx = r * 1.7, dy = r * 1.5;
  const grad = (id, a, b) => `<radialGradient id="${id}" cx=".34" cy=".3" r=".8"><stop offset="0" stop-color="${lighten(a, 0.55)}"/><stop offset=".35" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
  const defs = grad('sqa', c2, shadowOf(c1, 0.7)) + grad('sqb', mix(c1, c2, 0.35), shadowOf(c1, 0.8)) + grad('sqc', lighten(c2, 0.25), shadowOf(c2, 0.5));
  let body = '';
  const rows = 4, cols = 4;
  for (let j = -1; j <= rows; j++) for (let i = -1; i <= cols; i++) {
    const x = i * dx * 2 + (j % 2 ? dx : 0), y = j * dy;
    const pick = rng.next();
    const id = pick < 0.5 ? 'sqa' : pick < 0.85 ? 'sqb' : 'sqc';
    body += `<circle cx="${f(x + rng.range(-0.03, 0.03))}" cy="${f(y + rng.range(-0.03, 0.03))}" r="${f(r * rng.range(0.93, 1.05))}" fill="url(#${id})"/>`;
  }
  return { defs: tileWrap(dx * 2 * cols, dy * rows, body, { extraDefs: defs }), fill: 'url(#pat)', fx: { spec: 0.55, shin: 20, tex: { type: 'none', amp: 0, bump: 0 }, sparkle: true } };
};

B['mirror-work'] = (spec, rng) => {
  const { c1, c2, c3 } = inks(spec);
  const S = spec.scale || 1;
  const T = 8 * S;
  const defs = `<radialGradient id="mrg" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#fbfbf6"/><stop offset=".45" stop-color="#cfd3d4"/><stop offset=".8" stop-color="#8d9496"/><stop offset="1" stop-color="#e8eaea"/></radialGradient>`;
  const mirror = (x, y, r) => {
    let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 1.55)}" fill="none" stroke="${c2}" stroke-width="${f(0.17 * S)}"/>`;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += `<path d="M${f(x + Math.cos(a) * r * 1.1)} ${f(y + Math.sin(a) * r * 1.1)}L${f(x + Math.cos(a) * r * 1.85)} ${f(y + Math.sin(a) * r * 1.85)}" stroke="${c3}" stroke-width="${f(0.11 * S)}" stroke-linecap="round"/>`; }
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#mrg)"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.22)}" fill="#fff" opacity=".9"/>`;
    return s;
  };
  let body = '';
  for (const [fx, fy, r] of [[0.25, 0.25, 0.62], [0.75, 0.75, 0.62], [0.75, 0.25, 0.38], [0.25, 0.75, 0.38]]) {
    for (const ox of [0, -T, T]) for (const oy of [0, -T, T]) {
      const x = fx * T + ox, y = fy * T + oy;
      if (x < -2 * S || x > T + 2 * S || y < -2 * S || y > T + 2 * S) continue;
      body += mirror(x, y, r * S);
    }
  }
  body += `<path d="M${f(T * 0.25)} ${f(T * 0.25)}L${f(T * 0.75)} ${f(T * 0.75)}M${f(T * 0.75)} ${f(T * 0.25)}L${f(T * 0.25)} ${f(T * 0.75)}" stroke="${c3}" stroke-width="${f(0.09 * S)}" stroke-dasharray="${f(0.18 * S)} ${f(0.16 * S)}" opacity=".7"/>`;
  return { defs: tileWrap(T, T, body, { extraDefs: defs }), fill: 'url(#pat)', fx: { spec: 0.1, shin: 12 } };
};

B.abstract = (spec, rng) => {
  const { c1, c2, c3 } = inks(spec);
  const S = spec.scale || 1;
  const T = 34 * S;
  let body = '';
  const cols = [c2, c3, mix(c2, c1, 0.45), lighten(c2, 0.25)];
  const blob = (cx, cy, r, c, o) => {
    const n = 7, pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rr = r * rng.range(0.55, 1.2); pts.push([cx + Math.cos(a) * rr * rng.range(0.8, 1.6), cy + Math.sin(a) * rr]); }
    let d = `M${f((pts[0][0] + pts[n - 1][0]) / 2)} ${f((pts[0][1] + pts[n - 1][1]) / 2)}`;
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; d += `Q${f(p[0])} ${f(p[1])} ${f((p[0] + q[0]) / 2)} ${f((p[1] + q[1]) / 2)}`; }
    return `<path d="${d}Z" fill="${c}" opacity="${f(o)}"/>`;
  };
  for (let i = 0; i < 9; i++) {
    const x = rng.range(0, T), y = rng.range(0, T), r = rng.range(2.2, 6.5) * S, c = rng.pick(cols), o = rng.range(0.55, 0.92);
    for (const ox of [0, -T, T]) for (const oy of [0, -T, T]) {
      const X = x + ox, Y = y + oy;
      if (X < -r * 2 || X > T + r * 2 || Y < -r * 2 || Y > T + r * 2) continue;
      body += blob(X, Y, r, c, o);
    }
  }
  // dry-brush strokes
  for (let i = 0; i < 10; i++) {
    const x = rng.range(0, T), y = rng.range(0, T), a = rng.range(-0.5, 0.5), L = rng.range(3, 8) * S;
    body += `<path d="M${f(x)} ${f(y)}q${f(Math.sin(a) * L * 0.5)} ${f(L * 0.5)} ${f(Math.sin(a) * L)} ${f(L)}" stroke="${rng.pick(cols)}" stroke-width="${f(rng.range(0.25, 0.7) * S)}" stroke-linecap="round" fill="none" opacity=".75"/>`;
  }
  return { defs: tileWrap(T, T, body), fill: 'url(#pat)' };
};

B['tonal-jacquard'] = (spec, rng) => {
  const { c1 } = inks(spec);
  const S = spec.scale || 1;
  const w = 9 * S, h = 12 * S;
  const lo = highlightOf(c1, 0.55), dk = shadowOf(c1, 0.55);
  const motif = (id) => `<g id="${id}">` +
    `<path d="M0 ${f(-3.4 * S)}C${f(1.6 * S)} ${f(-2.2 * S)} ${f(1.8 * S)} ${f(-0.2 * S)} 0 ${f(1 * S)}C${f(-1.8 * S)} ${f(-0.2 * S)} ${f(-1.6 * S)} ${f(-2.2 * S)} 0 ${f(-3.4 * S)}Z" fill="${lo}" opacity=".5"/>` +
    `<path d="M0 ${f(1 * S)}C${f(2.6 * S)} ${f(0.6 * S)} ${f(3.4 * S)} ${f(2.6 * S)} ${f(2.2 * S)} ${f(4 * S)}C${f(1 * S)} ${f(3.2 * S)} ${f(0.4 * S)} ${f(2.4 * S)} 0 ${f(1.4 * S)}C${f(-0.4 * S)} ${f(2.4 * S)} ${f(-1 * S)} ${f(3.2 * S)} ${f(-2.2 * S)} ${f(4 * S)}C${f(-3.4 * S)} ${f(2.6 * S)} ${f(-2.6 * S)} ${f(0.6 * S)} 0 ${f(1 * S)}Z" fill="${lo}" opacity=".42"/>` +
    `<path d="M0 ${f(-2.6 * S)}C${f(0.9 * S)} ${f(-1.8 * S)} ${f(0.9 * S)} ${f(-0.6 * S)} 0 ${f(0.2 * S)}" fill="none" stroke="${dk}" stroke-width="${f(0.12 * S)}" opacity=".45"/>` +
    `<circle cy="${f(2.1 * S)}" r="${f(0.22 * S)}" fill="${dk}" opacity=".4"/></g>`;
  const defs = motif('jm');
  let body = '';
  for (const [x, y] of [[0.5, 0.25], [0, 0.75], [1, 0.75]]) body += `<use href="#jm" transform="translate(${f(x * w)} ${f(y * h)})"/>`;
  body += `<use href="#jm" transform="translate(${f(0.5 * w)} ${f(1.25 * h)})"/><use href="#jm" transform="translate(${f(0.5 * w)} ${f(-0.75 * h)})"/>`;
  // diaper lattice
  body += `<path d="M0 ${f(h * 0.5)}L${f(w * 0.5)} 0L${f(w)} ${f(h * 0.5)}L${f(w * 0.5)} ${f(h)}Z" fill="none" stroke="${dk}" stroke-width="${f(0.1 * S)}" opacity=".28"/>`;
  return { defs: tileWrap(w, h, body, { extraDefs: defs }), fill: 'url(#pat)', fx: { spec: 0.18, shin: 10 } };
};

/** Build a pattern for a spec. rng should be a dedicated fork so the pattern is identical across pieces. */
export function buildPattern(spec, rng) {
  const name = spec.pattern || 'solid';
  const fn = B[name] || B.solid;
  return { name, ...fn(spec, rng) };
}
