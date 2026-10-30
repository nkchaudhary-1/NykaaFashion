// Trims: bands that follow a curve (hem, neckline, cuffs, placket) drawn into a piece's albedo (so they are shaded
// with the cloth), plus overlay-only elements (tassels). All lengths in cm.
import { Curve, bandPath, offsetPath, offsetPoints, f, lerp } from './geometry.mjs';
import { mix, lighten, darken, shadowOf, highlightOf, luma } from './color.mjs';
import { Rng } from './prng.mjs';

const GOLD = '#C9A24A';

const id = (() => { let n = 0; return (p) => `${p}${++n}`; })();

/**
 * Band along `curve` between offsets o0..o1 (cm; +ve = curve normal side). Returns { inner, defs }.
 * type: contrast-border | gota | zari-border | lace | piping | ruffle(not here)
 */
export function trimBand(type, curve, { o0 = 0, o1 = 2.2, color = '#d9c9b0', color2, u0 = 0, u1 = 1, n = 90, rng = new Rng(5) } = {}) {
  const w = Math.abs(o1 - o0);
  let inner = '', defs = '';
  const band = bandPath(curve, o0, o1, { n, u0, u1 });
  switch (type) {
    case 'contrast-border': {
      const c = color2 || color;
      inner += `<path d="${band}" fill="${c}"/>`;
      inner += `<path d="${offsetPath(curve, o0 + w * 0.5, { n, u0, u1 })}" stroke="${mix(c, '#fff', 0.3)}" stroke-opacity=".5" stroke-width="${f(w * 0.08)}" fill="none"/>`;
      inner += `<path d="${offsetPath(curve, o0 + w * 0.12, { n, u0, u1 })}" stroke="#000" stroke-opacity=".2" stroke-width="0.06" stroke-dasharray=".3 .2" fill="none"/>`;
      inner += `<path d="${offsetPath(curve, o1 - w * 0.12, { n, u0, u1 })}" stroke="#000" stroke-opacity=".2" stroke-width="0.06" stroke-dasharray=".3 .2" fill="none"/>`;
      break;
    }
    case 'gota': {
      const g = id('gt');
      const base = mix(GOLD, color2 || GOLD, 0.1);
      defs += `<pattern id="${g}" patternUnits="userSpaceOnUse" width="0.3" height="0.3" patternTransform="rotate(45)">` +
        `<rect width="0.3" height="0.3" fill="${base}"/><rect width="0.15" height="0.15" fill="${lighten(base, 0.22)}"/><rect x="0.15" y="0.15" width="0.15" height="0.15" fill="${lighten(base, 0.22)}"/>` +
        `<rect x="0.15" width="0.15" height="0.15" fill="${darken(base, 0.1)}"/><rect y="0.15" width="0.15" height="0.15" fill="${darken(base, 0.1)}"/></pattern>`;
      inner += `<path d="${band}" fill="url(#${g})"/>`;
      inner += `<path d="${offsetPath(curve, o0 + w * 0.08, { n, u0, u1 })}" stroke="${darken(base, 0.35)}" stroke-opacity=".7" stroke-width="${f(w * 0.07)}" fill="none"/>`;
      inner += `<path d="${offsetPath(curve, o1 - w * 0.08, { n, u0, u1 })}" stroke="${darken(base, 0.35)}" stroke-opacity=".7" stroke-width="${f(w * 0.07)}" fill="none"/>`;
      break;
    }
    case 'zari-border': {
      const base = color2 && luma(color2) < 0.5 ? color2 : mix(color, '#000', 0.25);
      const gold = GOLD, gl = lighten(GOLD, 0.45);
      inner += `<path d="${band}" fill="${base}"/>`;
      inner += `<path d="${offsetPath(curve, o0 + w * 0.07, { n, u0, u1 })}" stroke="${gold}" stroke-width="${f(w * 0.07)}" fill="none"/>`;
      inner += `<path d="${offsetPath(curve, o1 - w * 0.07, { n, u0, u1 })}" stroke="${gold}" stroke-width="${f(w * 0.07)}" fill="none"/>`;
      // repeated kangri / leaf motif along the band
      const len = curve.length * (u1 - u0), step = Math.max(1.3, w * 0.72), cnt = Math.max(4, Math.round(len / step));
      const mid = (o0 + o1) / 2;
      for (const p of offsetPoints(curve, mid, cnt, u0, u1)) {
        const a = (Math.atan2(p.ty, p.tx) * 180) / Math.PI;
        const r = w * 0.27;
        inner += `<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${f(a)})"><path d="M${f(-r)} 0C${f(-r * 0.4)} ${f(-r * 1.3)} ${f(r * 0.4)} ${f(-r * 1.3)} ${f(r)} 0C${f(r * 0.4)} ${f(r * 1.3)} ${f(-r * 0.4)} ${f(r * 1.3)} ${f(-r)} 0Z" fill="${gold}"/><circle r="${f(r * 0.32)}" fill="${base}"/><circle r="${f(r * 0.15)}" fill="${gl}"/></g>`;
      }
      inner += offsetPoints(curve, mid, cnt * 2, u0, u1).filter((_, i) => i % 2 === 1).map((p) => `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(w * 0.045)}" fill="${gl}"/>`).join('');
      break;
    }
    case 'lace': {
      const lc = lighten(color2 || '#efe6d6', 0.12);
      inner += `<path d="${band}" fill="${lc}" fill-opacity=".92"/>`;
      // scalloped inner edge + eyelets
      const len = curve.length * (u1 - u0), step = 1.5, cnt = Math.max(6, Math.round(len / step));
      const pts = offsetPoints(curve, o1, cnt, u0, u1);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        inner += `<path d="M${f(a.x)} ${f(a.y)}Q${f((a.x + b.x) / 2 + a.nx * -0.0)} ${f((a.y + b.y) / 2)} ${f(b.x)} ${f(b.y)}" fill="none"/>`;
      }
      for (const p of offsetPoints(curve, (o0 + o1) / 2, cnt, u0, u1)) {
        inner += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(w * 0.16)}" fill="${shadowOf(lc, 0.35)}" fill-opacity=".55"/><circle cx="${f(p.x - 0.03)}" cy="${f(p.y - 0.03)}" r="${f(w * 0.07)}" fill="${lighten(lc, 0.4)}" fill-opacity=".8"/>`;
      }
      for (const p of offsetPoints(curve, o1 - w * 0.12, cnt * 2, u0, u1)) inner += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(w * 0.05)}" fill="${shadowOf(lc, 0.3)}" fill-opacity=".6"/>`;
      inner += `<path d="${offsetPath(curve, o0 + w * 0.12, { n, u0, u1 })}" stroke="${shadowOf(lc, 0.3)}" stroke-opacity=".5" stroke-width="0.06" fill="none"/>`;
      break;
    }
    case 'piping': {
      const c = color2 || darken(color, 0.25);
      inner += `<path d="${offsetPath(curve, (o0 + o1) / 2, { n, u0, u1 })}" stroke="${shadowOf(c, 0.3)}" stroke-width="${f(Math.min(0.5, w))}" stroke-linecap="round" fill="none"/>`;
      inner += `<path d="${offsetPath(curve, (o0 + o1) / 2 - 0.05, { n, u0, u1 })}" stroke="${c}" stroke-width="${f(Math.min(0.4, w * 0.8))}" stroke-linecap="round" fill="none"/>`;
      inner += `<path d="${offsetPath(curve, (o0 + o1) / 2 - 0.12, { n, u0, u1 })}" stroke="${lighten(c, 0.4)}" stroke-opacity=".5" stroke-width="0.07" fill="none"/>`;
      break;
    }
    default: break;
  }
  return { inner, defs };
}

/** Tassels hanging from points along a curve. Returns an overlay svg (cm). */
export function tassels(curve, { count = 9, len = 4.2, color = '#C9A24A', head = '#8a6a2e', u0 = 0.06, u1 = 0.94, rng = new Rng(11) } = {}) {
  let s = '';
  const dark = darken(color, 0.4), light = lighten(color, 0.45);
  for (const p of offsetPoints(curve, 0.2, count - 1, u0, u1)) {
    const L = len * rng.range(0.9, 1.1);
    const x = p.x, y = p.y;
    // shadow
    s += `<ellipse cx="${f(x + 0.4)}" cy="${f(y + L * 0.5 + 0.5)}" rx="0.55" ry="${f(L * 0.55)}" fill="#000" opacity=".16"/>`;
    // strands
    for (let i = 0; i < 9; i++) {
      const dx = (i - 4) * 0.1 + rng.range(-0.05, 0.05), c = i % 3 === 0 ? dark : i % 3 === 1 ? color : light;
      s += `<path d="M${f(x + dx * 0.4)} ${f(y + 1.0)}C${f(x + dx * 1.2)} ${f(y + L * 0.4)} ${f(x + dx * 1.8 + rng.range(-0.1, 0.1))} ${f(y + L * 0.75)} ${f(x + dx * 2.2)} ${f(y + L)}" stroke="${c}" stroke-width="0.11" fill="none" stroke-linecap="round"/>`;
    }
    // knot head
    s += `<circle cx="${f(x)}" cy="${f(y + 0.55)}" r="0.55" fill="${head}"/><circle cx="${f(x - 0.16)}" cy="${f(y + 0.4)}" r="0.2" fill="${lighten(head, 0.5)}" opacity=".7"/>`;
    s += `<rect x="${f(x - 0.42)}" y="${f(y + 1.0)}" width="0.84" height="0.5" rx="0.2" fill="${color}"/><path d="M${f(x - 0.42)} ${f(y + 1.25)}h0.84" stroke="${dark}" stroke-width="0.06"/>`;
  }
  return s;
}

/** Decide which curves get which trim from spec.trim */
export function trimPlan(spec) {
  const t = spec.trim || 'none';
  return {
    type: t,
    hem: t !== 'none' && t !== 'piping' && t !== 'tassel',
    neck: t === 'piping' || t === 'contrast-border' || t === 'gota' || t === 'zari-border',
    tassel: t === 'tassel',
  };
}
