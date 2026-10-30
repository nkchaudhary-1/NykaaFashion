// Sweater: crew / turtle / cardigan (+ vest, hoodie falls back to crew). Knit rib neck, hem and cuffs; cardigan has a buttoned rib placket.
import { Curve, f, lerp, polyD } from '../lib/geometry.mjs';
import { mix, darken } from '../lib/color.mjs';
import { clothPiece } from '../lib/garment.mjs';
import { garmentKind } from '../lib/garmentKind.mjs';
import { buildUpper, upperDetail, ribDefs } from '../lib/upper.mjs';
import { buttonsOverlay } from '../lib/collar.mjs';

export function sweaterProfile(ctx, spec, shot) {
  const style = ['crew', 'turtle', 'cardigan', 'vest'].includes(spec.style) ? spec.style : 'crew';
  const men = spec.gender === 'men';
  const chest = men ? 27.4 : 26.2, len = style === 'cardigan' ? (men ? 70 : 68) : (men ? 68 : 62);
  const ST = men ? [21.6, 6.2] : [20.4, 5.8];
  const sleeve = style === 'vest' ? 'none' : { len: 60, hang: 10, wCuff: 9.6 };
  const neck = style === 'cardigan' ? { type: 'v', width: 7.4, depth: 22 } : style === 'turtle' ? { type: 'crew', width: 6.6, depth: 2.4 } : { type: 'crew', width: 7.8, depth: 5.6 };
  const P = {
    menHandled: true,
    fabric: spec.fabric || 'knit', ST, UA: [chest, 22], hemV: len, drop: 0.8,
    side: [[30, chest + 0.1], [len * 0.7, chest - 0.3], [len - 2.2, chest - 0.7]],
    sleeve, neck, backNeck: { width: 7.2, depth: 1.5 }, dome: 1.2, foldAmp: 0.85, fold: { n: 4, v0: 20, a1: 1.2 }, creases: [len * 0.5],
    neckRib: style === 'turtle' ? 0 : 2.0, noBinding: style === 'turtle', hemRib: 5.2, cuff: { type: 'rib', h: 5.6 },
    armhole: style === 'vest' ? 'tank' : undefined,
  };
  if (style === 'cardigan') {
    P.hasPlacket = true;
    P.bodyInner = ({ M, nk, hemV, back: bk }) => {
      if (bk) return { inner: '' };
      const v0 = nk.centreY - 0.2, v1 = hemV - 0.4, w = 3.8;
      return {
        defs: ribDefs('ribp', mix(spec.color, '#000', 0.05), 0.3),
        inner: `<rect x="${f(-w / 2)}" y="${f(v0)}" width="${f(w)}" height="${f(v1 - v0)}" fill="url(#ribp)"/>` +
          `<path d="M${f(-w / 2)} ${f(v0)}V${f(v1)}M${f(w / 2)} ${f(v0)}V${f(v1)}" stroke="#000" stroke-opacity=".32" stroke-width=".1"/>`,
      };
    };
    P.overlay = ({ nk, hemV, back: bk }) => {
      if (bk) return '';
      const n = 6, vs = Array.from({ length: n }, (_, i) => lerp(nk.centreY + 2.6, hemV - 7.5, i / (n - 1)));
      return buttonsOverlay(0, vs, 0.7, mix(spec.color, '#e9dfcf', 0.5), { holes: 4 });
    };
  }
  if (style === 'turtle') {
    P.extraPieces = ({ M, nk }) => {
      const ys = nk.ys, wB = 6.8, wT = 6.0, yT = ys - 5.6;
      const d = `M${f(-wB)} ${f(ys + 0.4)}C${f(-wB)} ${f(ys + 2.2)} ${f(-3)} ${f(ys + 3)} 0 ${f(ys + 3)}C3 ${f(ys + 3)} ${f(wB)} ${f(ys + 2.2)} ${f(wB)} ${f(ys + 0.4)}L${f(wT)} ${f(yT)}C${f(wT * 0.6)} ${f(yT - 1.4)} ${f(-wT * 0.6)} ${f(yT - 1.4)} ${f(-wT)} ${f(yT)}Z`;
      const inner = `<rect x="${f(-wB - 1)}" y="${f(yT - 3)}" width="${f(2 * wB + 2)}" height="${f(ys + 8 - yT)}" fill="url(#ribt)"/>` +
        `<path d="M${f(-wT - 0.2)} ${f(lerp(yT, ys, 0.45))}Q0 ${f(lerp(yT, ys, 0.45) + 1.5)} ${f(wT + 0.2)} ${f(lerp(yT, ys, 0.45))}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width=".16"/>`;
      return [clothPiece(M, { id: 'collar', z: 14, d, bounds: { x0: -wB - 1, y0: yT - 2, x1: wB + 1, y1: ys + 4 }, inner, defs: ribDefs('ribt', mix(spec.color, '#000', 0.03), 0.28), bevelCm: 0.9, bevelH: 0.9, edgeAo: 0.2, grid: 2, contact: { dx: 0.2, dy: 0.5, sigma: 0.5, strength: 0.34 } })];
    };
  }
  return P;
}

export default garmentKind((ctx, spec, shot) => buildUpper(ctx, spec, shot, sweaterProfile(ctx, spec, shot)), { detail: upperDetail });
