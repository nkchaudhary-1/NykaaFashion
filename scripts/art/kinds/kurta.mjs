// Kurta: short / knee / calf; straight / a-line / flared / angrakha; mandarin / round / v / keyhole necks; optional slits.
import { garmentKind } from '../lib/garmentKind.mjs';
import { buildUpper, upperDetail } from '../lib/upper.mjs';
import { collarPieces, placket, buttonsOverlay } from '../lib/collar.mjs';
import { Curve, lerp, f, offsetPath } from '../lib/geometry.mjs';
import { mix, darken, lighten } from '../lib/color.mjs';
import { trimBand } from '../lib/trims.mjs';
import { button } from '../lib/garment.mjs';

const LEN = { short: 82, knee: 100, calf: 120 };

export function kurtaProfile(ctx, spec, shot) {
  const men = spec.gender === 'men';
  const len = LEN[spec.length] || LEN.knee;
  const fitName = spec.fit || 'straight';
  const neck = spec.neck || 'mandarin';
  const back = shot === 'alt';
  const chest = men ? 26.4 : 24.4;
  const hemHw = { straight: chest + 1.8, 'a-line': chest + 8.5, flared: chest + 17, angrakha: chest + 7 }[fitName] ?? chest + 2;
  const ST = men ? [20.4, 5.7] : [19.0, 5.3];
  const sleeveKey = spec.sleeve || (men ? 'long' : 'three-quarter');
  const trim = spec.trim && spec.trim !== 'none' ? spec.trim : null;
  const btn = trim === 'zari-border' || trim === 'gota' ? '#C9A24A' : mix(spec.color, '#e8dcc4', 0.6);
  const P = {
    menHandled: true,
    fabric: spec.fabric, ST, UA: [chest, 22], hemV: len, drop: fitName === 'flared' ? 3.8 : fitName === 'a-line' ? 2.6 : 1.5,
    side: [[30, chest + 0.2], [48, lerp(chest, hemHw, 0.12)], [lerp(48, len - 2.5, 0.5), lerp(chest, hemHw, 0.42)], [len - 3.4, hemHw]],
    sleeve: sleeveKey, neck: neck === 'mandarin' ? { type: 'collar', width: 6.6, depth: 3 } : neck === 'keyhole' ? { type: 'round', width: 7.2, depth: 4.5 } : neck === 'v' ? { type: 'v', width: 7.4, depth: 13 } : { type: 'round', width: 7.4, depth: 7.2 },
    backNeck: { width: 7.0, depth: 1.6 }, dome: 1.5, foldAmp: fitName === 'flared' ? 1.15 : 0.9,
    fold: { n: fitName === 'flared' ? 8 : fitName === 'a-line' ? 6 : 4, v0: fitName === 'straight' ? 30 : 36, a1: fitName === 'flared' ? 2.1 : 1.4 },
    creases: [len * 0.55], hangerHalfW: 18.8, noBinding: neck === 'mandarin',
    cuff: { type: 'none' },
    hemCorner: false, hasPlacket: neck !== 'v',
  };
  if (neck === 'round' || neck === 'v') P.neckRib = 0; // binding comes from trims
  P.bodyInner = ({ M, nk, hw, hemV, back: bk, c2 }) => {
    let inner = '';
    if (!bk) {
      const pv0 = neck === 'mandarin' ? nk.ys + 3 : nk.centreY - 0.3, pv1 = neck === 'v' ? nk.centreY + 4 : (neck === 'mandarin' ? nk.ys + 24 : nk.centreY + 18);
      if (neck !== 'v') {
        inner += placket({ x: 0, v0: pv0, v1: pv1, w: 3.4, color: trim ? null : null, M });
        if (trim) {
          const edge = Curve.line([-1.7, pv0], [-1.7, pv1]), edge2 = Curve.line([1.7, pv0], [1.7, pv1]);
          const wd = 0.9;
          for (const [e, o0, o1] of [[edge, 0, wd], [edge2, -wd, 0]]) {
            const tb = trimBand(trim === 'contrast-border' ? 'contrast-border' : trim === 'zari-border' ? 'zari-border' : trim === 'gota' ? 'gota' : 'piping', e, { o0: o0 * -1, o1: o1 * -1, color: spec.color, color2: c2, n: 40 });
            inner += tb.inner;
          }
        }
      }
      if (neck === 'keyhole') {
        // keyhole: little slit with loop and button
        inner += `<path d="M0 ${f(nk.centreY - 0.2)}V${f(nk.centreY + 5.8)}" stroke="#000" stroke-opacity=".5" stroke-width=".22"/><path d="M-.9 ${f(nk.centreY + 5.8)}Q0 ${f(nk.centreY + 7.4)} .9 ${f(nk.centreY + 5.8)}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width=".12"/>`;
      }
      if (spec.slit !== false && (spec.slit || fitName === 'straight' || fitName === 'a-line')) {
        const sx = hw(hemV - 8) - 0.6, v0 = hemV - 21;
        for (const s of [-1, 1]) inner += `<path d="M${f(s * (sx - 0.2))} ${f(v0)}L${f(s * (sx - 0.9))} ${f(hemV - 1)}" stroke="#000" stroke-opacity=".32" stroke-width=".12"/><path d="M${f(s * (sx - 0.5))} ${f(v0 + 0.2)}L${f(s * (sx - 1.2))} ${f(hemV - 1)}" stroke="#fff" stroke-opacity=".12" stroke-width=".1"/>`;
      }
      if (fitName === 'angrakha') {
        // overlapping panel: diagonal wrap line from the right shoulder to the left hip with ties
        inner += `<path d="M${f(7.4)} 3Q${f(2)} 22 ${f(-hw(hemV) * 0.62)} ${f(hemV - 4)}" fill="none" stroke="#000" stroke-opacity=".32" stroke-width=".16"/><path d="M${f(7.0)} 3.4Q${f(1.6)} 22 ${f(-hw(hemV) * 0.62 + 0.4)} ${f(hemV - 4)}" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width=".12"/>`;
      }
    } else {
      inner += `<path d="M0 ${f(nk.ys + 2.2)}V${f(hemV - 2.4)}" stroke="#000" stroke-opacity=".14" stroke-width=".1"/>`;
    }
    return { inner };
  };
  P.overlay = ({ nk, hemV }) => {
    if (back || neck === 'v') return '';
    const pv0 = neck === 'mandarin' ? nk.ys + 3 : nk.centreY, n = neck === 'keyhole' ? 1 : 3;
    const vs = [];
    if (neck === 'mandarin') vs.push(nk.ys + 1.4);
    for (let i = 0; i < n; i++) vs.push(neck === 'keyhole' ? nk.centreY + 5.6 : lerp(pv0 + 2.2, pv0 + 17, i / Math.max(1, n - 1)));
    return buttonsOverlay(0, vs, 0.55, btn, { holes: 4 });
  };
  if (neck === 'mandarin') P.extraPieces = ({ M, nk, rng }) => collarPieces(M, nk, 'band', { rng, back, d: 3 });
  return P;
}

export default garmentKind((ctx, spec, shot) => buildUpper(ctx, spec, shot, kurtaProfile(ctx, spec, shot)), { detail: upperDetail });
