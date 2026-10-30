// Top: tank / cami / blouse / crop / peplum / bodysuit / saree-blouse.
import { garmentKind } from '../lib/garmentKind.mjs';
import { buildUpper, upperDetail } from '../lib/upper.mjs';
import { collarPieces, placket, buttonsOverlay } from '../lib/collar.mjs';
import { lerp, f } from '../lib/geometry.mjs';
import { mix, darken, lighten } from '../lib/color.mjs';

export function topProfile(ctx, spec, shot) {
  const style = spec.style || 'blouse';
  const back = shot === 'alt';
  const neck = spec.neckline || spec.neck || (style === 'tank' ? 'scoop' : style === 'saree-blouse' ? 'scoop' : 'round');
  const base = {
    fabric: spec.fabric, UA: [22, 21], drop: 1.2, dome: 1.1, foldAmp: 0.85, fold: { n: 4, v0: 18, a1: 1.2 }, creases: [],
    backNeck: { width: 7.2, depth: 2.0 },
  };
  let P;
  switch (style) {
    case 'tank': {
      const hem = 58;
      P = { ...base, ST: [12.2, 1.6 + (12.2 - 7) * 0.31], UA: [21.6, 19.5], hemV: hem, armhole: 'tank', sleeve: 'none',
        side: [[28, 22.2], [44, 22.6], [hem - 2.2, 23.4]], neck: { type: 'scoop', width: 7.6, depth: 9.5 }, hangerHalfW: 16.6, neckRib: 0.9, backNeck: { width: 7.6, depth: 3 } };
      break;
    }
    case 'cami': {
      const hem = 50;
      P = { ...base, ST: [12, 3.2], UA: [21.6, 20], hemV: hem, armhole: 'strap', sleeve: 'none',
        topHalf: [[0, 14.5, 'c'], [3.4, 11.8], [7.4, 9.0], [10.6, 8.2, 'c']], armholeHalf: [[11.6, 12.6], [15.8, 17.6], [21.2, 20, 'c']],
        side: [[28, 22.2], [40, 22.6], [hem - 2.2, 24]], neck: { type: 'v' }, noNeckCurve: true, noBinding: true, noBackPiece: true, hangerHalfW: 16.8,
        straps: { w: 0.8, front: [[10.6, 8.4], [9.6, 5.4], [8.4, 3.1], [7.9, 1.9]], back: [[8.2, 2.6], [9.4, 7], [10.8, 10.6]] } };
      if (back) P.topHalf = [[0, 11.2], [4.4, 10.4], [8, 9.6], [10.6, 8.6, 'c']];
      break;
    }
    case 'crop': {
      const hem = 38;
      P = { ...base, ST: [19.8, 5.5], UA: [24.2, 22], hemV: hem, sleeve: spec.sleeve || 'none', armhole: spec.sleeve && spec.sleeve !== 'none' ? undefined : 'tank',
        side: [[30, 24.6], [hem - 2, 24.8]], neck: { type: neck }, hangerHalfW: 18.4, hemCorner: true, fold: { n: 3, v0: 18, a1: 1.1 } };
      if (!spec.sleeve || spec.sleeve === 'none') P.ST = [14.2, 1.6 + (14.2 - 7) * 0.31], P.UA = [23.4, 20], P.hangerHalfW = 17;
      break;
    }
    case 'peplum': {
      const hem = 54;
      P = { ...base, ST: [15.6, 1.6 + (15.6 - 7) * 0.31], UA: [21.2, 20], hemV: hem, armhole: 'tank', sleeve: 'none', drop: 2.8,
        side: [[30, 21.4], [36, 19.6], [41.5, 23.0], [47, 26.6], [hem - 3.6, 29.2]], neck: { type: neck === 'scoop' ? 'scoop' : neck }, hangerHalfW: 17.2, waistBand: 36.5, bust: 0.35,
        fold: { n: 7, v0: 36, a1: 1.7 } };
      break;
    }
    case 'bodysuit': {
      const hem = 62;
      P = { ...base, ST: [14.6, 1.6 + (14.6 - 7) * 0.31], UA: [21.8, 20], hemV: hem, armhole: spec.sleeve && spec.sleeve !== 'none' ? undefined : 'tank', sleeve: spec.sleeve || 'none', drop: 1.6,
        side: [[28, 21.8], [42, 19.6], [54, 15.2], [hem - 2.5, 12.6]], neck: { type: neck }, hangerHalfW: 17.4, hemCorner: true, bust: 0.6, foldAmp: 0.6, fold: { n: 2, v0: 30, a1: 0.9 } };
      if (P.sleeve !== 'none') { P.ST = [18.4, 5.1]; P.UA = [22, 21]; P.hangerHalfW = 18.4; }
      break;
    }
    case 'saree-blouse': {
      const hem = 36;
      P = { ...base, ST: [18.6, 5.2], UA: [22.4, 21], hemV: hem, sleeve: spec.sleeve || 'short', drop: 1.0,
        side: [[28, 22.4], [hem - 2, 22.0]], neck: { type: neck === 'round' ? 'scoop' : neck, depth: 11 }, hangerHalfW: 18.2, bust: 0.9, hemCorner: true, fold: { n: 2, v0: 20, a1: 1.0 },
        backNeck: { width: 8.6, depth: 9.5 } };
      break;
    }
    case 'blouse':
    default: {
      const hem = 60;
      P = { ...base, ST: [19.2, 5.4], UA: [24.0, 22], hemV: hem, sleeve: spec.sleeve || 'short',
        side: [[30, 24.2], [46, 24.4], [hem - 2.4, 25.4]], neck: { type: neck }, hangerHalfW: 18.8, drop: 1.8, bust: 0.5, fold: { n: 5, v0: 22, a1: 1.4 }, creases: [hem * 0.6] };
      if (neck === 'collar') { P.neck = { type: 'collar', depth: 3 }; }
    }
  }
  if (neck === 'collar') {
    P.extraPieces = ({ M, nk, rng }) => collarPieces(M, nk, 'band', { rng, back, d: 3 });
    P.noBinding = true;
  }
  if (style === 'saree-blouse') {
    P.sleeveOverride = {};
    if (!spec.trim) spec = { ...spec };
  }
  return P;
}

export default garmentKind((ctx, spec, shot) => {
  const sp = spec.style === 'saree-blouse' && !spec.trim ? { ...spec, trim: 'zari-border' } : spec;
  return buildUpper(ctx, sp, shot, topProfile(ctx, sp, shot));
}, { detail: upperDetail });
