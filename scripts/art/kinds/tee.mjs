// T-shirt: crew / v / polo / henley, regular / oversized / boxy / cropped, short / long sleeve.
import { garmentKind } from '../lib/garmentKind.mjs';
import { buildUpper, upperDetail } from '../lib/upper.mjs';
import { collarPieces, placket, buttonsOverlay } from '../lib/collar.mjs';
import { lerp, f } from '../lib/geometry.mjs';
import { mix, darken } from '../lib/color.mjs';

const FIT = {
  regular:   { chest: 24.6, hem: 24.8, len: 66, ST: [19.6, 5.5], UA: 22, sw: 1.0 },
  oversized: { chest: 29.0, hem: 29.4, len: 73, ST: [24.2, 8.1], UA: 24, sw: 1.18 },
  boxy:      { chest: 27.0, hem: 27.2, len: 60, ST: [21.2, 6.2], UA: 22.5, sw: 1.06 },
  cropped:   { chest: 26.0, hem: 26.0, len: 46, ST: [20.4, 5.9], UA: 22, sw: 1.04 },
};

export function teeProfile(ctx, spec, shot) {
  const fit = FIT[spec.fit] || FIT.regular;
  const neck = spec.neck || 'crew';
  const long = spec.sleeve === 'long';
  const [sx, sy] = fit.ST;
  const UAhw = fit.chest;
  const P = {
    fabric: spec.fabric || 'knit', ST: fit.ST, UA: [UAhw, fit.UA], hemV: fit.len, drop: 0.9,
    side: [[30, fit.chest + 0.1], [46, lerp(fit.chest, fit.hem, 0.6)], [fit.len - 2.2, fit.hem]],
    sleeve: long ? { len: 62 * fit.sw, hang: 9, wCuff: 9.4 } : { len: 20 * fit.sw, hang: 28, wCuff: 16 * fit.sw },
    neck: neck === 'v' ? { type: 'v', width: 7.4, depth: 12.5 } : neck === 'polo' || neck === 'henley' ? { type: 'crew', width: 7.4, depth: 7.5 } : { type: 'crew', width: 7.4, depth: 6.6 },
    backNeck: { width: 7.4, depth: 1.4 }, dome: 1.2, foldAmp: 0.9, fold: { n: 4, v0: 20, a1: 1.3 }, creases: [fit.len * 0.55],
    neckRib: neck === 'polo' ? 0 : 1.5, noBinding: neck === 'polo', hemCorner: false,
    cuff: long ? { type: 'rib', h: 4.5 } : { type: 'none' },
    sleeveOverride: {},
  };
  if (neck === 'polo' || neck === 'henley') {
    P.hasPlacket = true;
    P.bodyInner = ({ M, nk, c2 }) => ({ inner: placket({ x: 0, v0: nk.centreY - 0.5, v1: nk.centreY + (neck === 'polo' ? 7.5 : 11), w: 3.0, color: mix(spec.color, '#000', 0.04), M }) });
    P.overlay = ({ nk }) => shot === 'alt' ? '' : buttonsOverlay(0, neck === 'polo' ? [nk.centreY + 1.6, nk.centreY + 5.2] : [nk.centreY + 1.8, nk.centreY + 5.4, nk.centreY + 9], 0.62, mix(spec.color, '#e8e0d0', 0.55));
    if (neck === 'polo') P.extraPieces = ({ M, nk, rng }) => collarPieces(M, nk, 'polo', { rng, back: shot === 'alt', color: mix(spec.color, '#fff', 0.02) });
    if (neck === 'henley') P.neckRib = 1.4;
  }
  return P;
}

export default garmentKind((ctx, spec, shot) => buildUpper(ctx, spec, shot, teeProfile(ctx, spec, shot)), { detail: upperDetail });
