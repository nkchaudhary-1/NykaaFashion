// Shirt: spread / band / camp collar, regular / slim / relaxed, short / long sleeve, optional chest pocket.
import { garmentKind } from '../lib/garmentKind.mjs';
import { buildUpper, upperDetail } from '../lib/upper.mjs';
import { collarPieces, placket, buttonsOverlay, patchPocket } from '../lib/collar.mjs';
import { lerp, f } from '../lib/geometry.mjs';
import { mix, darken, lighten } from '../lib/color.mjs';

const FIT = {
  regular: { chest: 25.8, waist: 25.4, hem: 26.4, len: 77, ST: [19.9, 5.6] },
  slim:    { chest: 24.0, waist: 22.6, hem: 23.8, len: 76, ST: [19.2, 5.4] },
  relaxed: { chest: 27.8, waist: 28.0, hem: 29.2, len: 80, ST: [21.4, 6.2] },
};

export function shirtProfile(ctx, spec, shot) {
  const fit = FIT[spec.fit] || FIT.regular;
  const collar = spec.collar || 'spread';
  const long = spec.sleeve !== 'short';
  const back = shot === 'alt';
  const btn = mix(spec.color, '#efe8da', 0.7);
  const nkDepth = collar === 'camp' ? 8.5 : 3.0;
  const P = {
    fabric: spec.fabric || (spec.pattern === 'check' || spec.pattern === 'gingham' ? 'cotton' : 'cotton'),
    ST: fit.ST, UA: [fit.chest, 22], hemV: fit.len, drop: 2.2,
    side: [[30, fit.chest], [48, fit.waist], [fit.len - 3.4, fit.hem]],
    sleeve: long ? { len: 62, hang: 9, wCuff: 10.5 } : { len: 23, hang: 26, wCuff: 17 },
    neck: { type: 'collar', width: 6.9, depth: nkDepth }, backNeck: { width: 7.0, depth: 1.6 },
    dome: 1.2, foldAmp: 0.95, fold: { n: 5, v0: 22, a1: 1.3 }, creases: [fit.len * 0.62], noBinding: true,
    cuff: long ? { type: 'band', h: 6.2 } : { type: 'none' },
    hangerHalfW: 19.4, hasPlacket: true,
  };
  const pocket = spec.pocket && !back;
  P.bodyInner = ({ M, nk, hw, hemV, back: bk }) => {
    let inner = '';
    if (!bk) {
      inner += placket({ x: 0, v0: nk.centreY - 0.3, v1: hemV - 1.2, w: 3.4, color: null, M });
      if (pocket) inner += patchPocket({ u: 9.6, v: 24.5, w: 9.4, h: 10.6, M });
    } else {
      // yoke seam + centre-back box pleat
      inner += `<path d="M${f(-fit.ST[0] + 2)} 13.2Q0 15.2 ${f(fit.ST[0] - 2)} 13.2" fill="none" stroke="#000" stroke-opacity=".3" stroke-width=".11"/>` +
        `<path d="M${f(-fit.ST[0] + 2)} 13.7Q0 15.7 ${f(fit.ST[0] - 2)} 13.7" fill="none" stroke="#000" stroke-opacity=".2" stroke-width=".06" stroke-dasharray=".3 .2"/>` +
        `<path d="M-1.4 15.6V${f(hemV - 2.4)}M1.4 15.6V${f(hemV - 2.4)}" stroke="#000" stroke-opacity=".16" stroke-width=".1"/>`;
    }
    // side-seam stitch / hem stitch
    return { inner };
  };
  P.overlay = ({ nk, hemV }) => {
    if (back) return '';
    const n = 6, v1 = hemV - 8;
    const vs = [nk.ys + 2.6]; // top button on the collar band
    for (let i = 0; i < n; i++) vs.push(lerp(nk.ys + 9.6, v1, i / (n - 1)));
    return buttonsOverlay(0, collar === 'camp' ? vs.slice(1).map((v, i) => v - 1.4 + 0) : vs, 0.62, btn, { holes: 4 });
  };
  P.sleeveOverlay = ({ sh, side }) => {
    if (!long) return '';
    // cuff button
    const o = sh.outer.at(0.955), i1 = sh.inner.at(0.955);
    return buttonsOverlay(0, [], 0.5, btn) + require_btn(lerp(o[0], i1[0], 0.3), lerp(o[1], i1[1], 0.3), btn);
  };
  P.extraPieces = ({ M, nk, rng }) => collarPieces(M, nk, collar === 'band' ? 'band' : collar === 'camp' ? 'camp' : 'spread', { rng, back, d: nkDepth });
  return P;
}
import { button } from '../lib/garment.mjs';
function require_btn(x, y, c) { return button(x, y, 0.5, c, { holes: 4 }); }

export default garmentKind((ctx, spec, shot) => buildUpper(ctx, spec, shot, shirtProfile(ctx, spec, shot)), { detail: upperDetail });
