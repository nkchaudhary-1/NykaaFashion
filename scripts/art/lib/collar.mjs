// Collars, plackets, buttons, pockets for hung upper garments (cm space, centre x=0).
import { Curve, f, lerp, mirrorPts, boundsOfPts } from './geometry.mjs';
import { FoldField } from './folds.mjs';
import { mix, darken, lighten } from './color.mjs';
import { clothPiece, button } from './garment.mjs';

/** right-leaf outline points for a collar style; ys = y of the neck-side point, nsx = x of it */
function leafPts(style, nsx, ys, d) {
  switch (style) {
    case 'band': // mandarin / band: low standing band with a small front gap
      return { pts: [[0.7, ys + 0.5, 'c'], [nsx * 0.5, ys - 1.7], [nsx + 0.4, ys - 2.9], [nsx + 1.6, ys + 0.6, 'c'], [nsx * 0.62, ys + 2.9], [0.7, ys + 3.3, 'c']], z: 14 };
    case 'camp': // open camp collar, lying flat
      return { pts: [[0.5, ys + 2.0, 'c'], [nsx * 0.55, ys - 1.0], [nsx + 0.8, ys - 2.3], [nsx + 3.2, ys + 1.0, 'c'], [nsx + 4.2, ys + d * 0.66, 'c'], [nsx * 0.62 + 1.2, ys + d * 0.52], [0.5, ys + d * 0.2, 'c']], z: 14 };
    case 'polo':
      return { pts: [[0.5, ys + 1.3, 'c'], [nsx * 0.5, ys - 1.5], [nsx + 0.4, ys - 2.4], [nsx + 1.9, ys + 0.7, 'c'], [nsx + 1.4, ys + 4.8, 'c'], [nsx * 0.62 + 0.3, ys + 3.8], [0.5, ys + 3.0, 'c']], z: 14 };
    case 'spread':
    default:
      return { pts: [[0.4, ys + 0.6, 'c'], [nsx * 0.5, ys - 0.9], [nsx + 0.1, ys - 1.5], [nsx + 1.0, ys + 1.0], [nsx + 1.35, ys + 6.8, 'c'], [nsx * 0.55 + 0.5, ys + 5.0], [0.4, ys + 3.3, 'c']], z: 14 };
  }
}

/** collar pieces: leaf R + leaf L (+ back stand when front view) */
export function collarPieces(M, nk, style, { color, rng, back = false, gain = 1, d = 9 } = {}) {
  const pieces = [];
  const nsx = nk.nsx, ys = nk.ys;
  const lp = leafPts(style, nsx, ys, d);
  const fill = color || M.base;
  if (back) {
    // from behind: a continuous stand + folded-over collar across the back neck
    const top = Curve.through([[-nsx - 2.2, ys + 0.6, 'c'], [-nsx * 0.55, ys - 2.6], [0, ys - 3.4], [nsx * 0.55, ys - 2.6], [nsx + 2.2, ys + 0.6, 'c'], [nsx * 0.6, ys + 3.2], [0, ys + 3.7], [-nsx * 0.6, ys + 3.2]], { closed: true });
    const ff = new FoldField(rng.int(1, 1e6));
    ff.dome({ hw: nsx + 3, v0: ys - 3.4, v1: ys + 4, amp: 0.5, in: 1, out: 2 });
    pieces.push(clothPiece(M, { id: 'collar-back', z: 14, d: top.d(), bounds: top.bounds(), fill: color, noPattern: !!color, field: ff, bevelCm: 0.2, bevelH: 0.25, grid: 2, contact: { dx: 0.1, dy: 0.4, sigma: 0.4, strength: 0.4 }, inner: `<path d="${top.d()}" fill="none"/>` + `<path d="M${f(-nsx - 1.4)} ${f(ys + 0.4)}Q0 ${f(ys + 3.7)} ${f(nsx + 1.4)} ${f(ys + 0.4)}" stroke="#000" stroke-opacity=".25" stroke-width=".08" stroke-dasharray=".3 .2" fill="none"/>` }));
    return pieces;
  }
  // inner stand visible behind the neck above the shoulder line
  const standTop = Curve.through([[-nsx - 0.6, ys + 0.8, 'c'], [-nsx * 0.5, ys - 1.6], [0, ys - 2.2], [nsx * 0.5, ys - 1.6], [nsx + 0.6, ys + 0.8, 'c'], [0, ys + 2.4]], { closed: true });
  pieces.push(clothPiece(M, { id: 'collar-stand', z: 4, d: standTop.d(), bounds: standTop.bounds(), fill: color, noPattern: !!color, gain: 0.74, noCast: true, edgeAo: 0.2, bevelH: 0.15, grid: 2, contact: { strength: 0.15 } }));
  for (const side of [1, -1]) {
    const pts = side === 1 ? lp.pts : lp.pts.map((p) => [-p[0], p[1], p[2]]);
    const c = Curve.through(pts, { closed: true });
    const b = c.bounds();
    const ff = new FoldField(rng.int(1, 1e6));
    // roll line along the neck + gentle dome
    ff.ridge({ a: [side * 0.8, ys + 1.8], b: [side * (nsx + 0.6), ys - 2.0], s0: 0.9, s1: 1.1, a0: 0.6, a1: 0.6, fade: 0.1 });
    ff.blob({ u: side * (nsx * 0.8 + 1.5), v: ys + 3.2, ru: 3.4, rv: 3.8, amp: 0.55 });
    ff.noise({ amp: 0.06, fu: 0.4, fv: 0.4, oct: 2 });
    pieces.push(clothPiece(M, {
      id: 'collar' + side, z: lp.z, d: c.d(), bounds: b, field: ff, fill: color, noPattern: !!color, gain,
      bevelCm: 0.22, bevelH: 0.3, edgeAo: 0.16, grid: 2, contact: { dx: 0.3 * side, dy: 0.55, sigma: 0.5, strength: 0.42 },
      inner: `<path d="${c.d()}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width=".1"/>`,
    }));
  }
  return pieces;
}

/** placket band (albedo, in body inner) + button overlay */
export function placket({ x = 0, v0, v1, w = 3.2, color, M, stitch = true }) {
  let s = '';
  s += `<rect x="${f(x - w / 2)}" y="${f(v0)}" width="${f(w)}" height="${f(v1 - v0)}" fill="${color || M.base}" opacity="${color ? 1 : 0.0}"/>`;
  s += `<path d="M${f(x - w / 2)} ${f(v0)}V${f(v1)}M${f(x + w / 2)} ${f(v0)}V${f(v1)}" stroke="#000" stroke-opacity=".3" stroke-width=".09"/>`;
  s += `<path d="M${f(x - w / 2 + 0.12)} ${f(v0)}V${f(v1)}" stroke="#fff" stroke-opacity=".14" stroke-width=".1"/>`;
  if (stitch) s += `<path d="M${f(x - w / 2 + 0.55)} ${f(v0)}V${f(v1)}M${f(x + w / 2 - 0.55)} ${f(v0)}V${f(v1)}" stroke="#000" stroke-opacity=".22" stroke-width=".06" stroke-dasharray=".3 .22"/>`;
  return s;
}

export function buttonsOverlay(x, vs, r, color, { holes = 2 } = {}) {
  return vs.map((v) => button(x, v, r, color, { holes })).join('');
}

/** patch pocket (albedo): fill follows the cloth, soft edge shading */
export function patchPocket({ u, v, w, h, M, flap = 0, round = 0.8, tone = 0 }) {
  const x0 = u - w / 2, x1 = u + w / 2, y1 = v + h;
  const d = `M${f(x0)} ${f(v)}H${f(x1)}V${f(y1 - round)}Q${f(x1)} ${f(y1)} ${f(x1 - round)} ${f(y1)}H${f(x0 + round)}Q${f(x0)} ${f(y1)} ${f(x0)} ${f(y1 - round)}Z`;
  let s = `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".07" stroke-width="0.7" transform="translate(.12 .22)"/>`;
  s += `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="0.4" transform="translate(.1 .16)"/>`;
  s += `<path d="${d}" fill="${M.base}"/>`;
  if (M.pat.fill) s += `<path d="${d}" fill="${M.pat.fill}" transform="translate(0 0)"/>`;
  s += `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".34" stroke-width="0.1"/>`;
  s += `<path d="M${f(x0 + 0.1)} ${f(v + 0.2)}H${f(x1 - 0.1)}" stroke="#fff" stroke-opacity=".16" stroke-width="0.12"/>`;
  s += `<path d="M${f(x0 + 0.5)} ${f(v + 0.6)}H${f(x1 - 0.5)}" stroke="#000" stroke-opacity=".18" stroke-width="0.06" stroke-dasharray=".3 .2"/>`;
  return s;
}
