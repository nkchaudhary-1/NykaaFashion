// Jacket: blazer / bomber / denim / trench / shacket / waistcoat / nehru.
import { garmentKind } from '../lib/garmentKind.mjs';
import { buildUpper, upperDetail } from '../lib/upper.mjs';
import { collarPieces, placket, buttonsOverlay, patchPocket } from '../lib/collar.mjs';
import { Curve, lerp, f, polyD } from '../lib/geometry.mjs';
import { mix, darken, lighten } from '../lib/color.mjs';
import { clothPiece, button, stitchLine } from '../lib/garment.mjs';
import { FoldField } from '../lib/folds.mjs';

const flapPocket = ({ u, v, w, h, tilt = 0, M, color }) => {
  const x0 = u - w / 2, x1 = u + w / 2;
  const d = `M${f(x0)} ${f(v)}L${f(x1)} ${f(v + tilt)}L${f(x1)} ${f(v + tilt + h)}L${f(x0)} ${f(v + h)}Z`;
  return `<path d="${d}" fill="#000" opacity=".16" transform="translate(.12 .35)"/>` +
    `<path d="M${f(x0)} ${f(v - 0.35)}L${f(x1)} ${f(v + tilt - 0.35)}" stroke="#000" stroke-opacity=".5" stroke-width=".2"/>` +
    `<path d="${d}" fill="${M.base}"/>` + (M.pat.fill ? `<path d="${d}" fill="${M.pat.fill}"/>` : '') +
    `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".38" stroke-width=".1"/><path d="M${f(x0 + .2)} ${f(v + .2)}L${f(x1 - .2)} ${f(v + tilt + .2)}" stroke="#fff" stroke-opacity=".16" stroke-width=".1"/>` +
    `<path d="M${f(x0 + .5)} ${f(v + h - .5)}L${f(x1 - .5)} ${f(v + tilt + h - .5)}" stroke="#000" stroke-opacity=".2" stroke-width=".06" stroke-dasharray=".3 .2"/>`;
};

const STYLES = {
  blazer:   { len: 74, chest: 25.2, ST: [20.8, 5.9], waist: 23.4, hem: 26.6, drop: 3.0, fabric: 'wool', sleeve: { len: 62, hang: 8, wCuff: 11.5 }, neck: { type: 'v', width: 7.6, depth: 29 }, foldAmp: 0.7 },
  bomber:   { len: 57, chest: 27.0, ST: [20.6, 5.9], waist: 27, hem: 23.4, drop: 1.0, fabric: 'cotton', sleeve: { len: 60, hang: 10, wCuff: 9 }, neck: { type: 'crew', width: 7.4, depth: 4.5 }, foldAmp: 1.1 },
  denim:    { len: 58, chest: 26.0, ST: [20.4, 5.8], waist: 25.4, hem: 25, drop: 1.4, fabric: 'denim', sleeve: { len: 61, hang: 9, wCuff: 10.6 }, neck: { type: 'collar', width: 6.9, depth: 3 }, foldAmp: 0.8 },
  trench:   { len: 108, chest: 26.8, ST: [20.8, 6.0], waist: 26, hem: 33, drop: 4, fabric: 'cotton', sleeve: { len: 62, hang: 8, wCuff: 11.5 }, neck: { type: 'v', width: 7.6, depth: 26 }, foldAmp: 1.0 },
  shacket:  { len: 74, chest: 28.6, ST: [22.6, 6.8], waist: 29, hem: 29.6, drop: 1.8, fabric: 'wool', sleeve: { len: 62, hang: 9, wCuff: 11.5 }, neck: { type: 'collar', width: 7.0, depth: 3 }, foldAmp: 0.8 },
  waistcoat:{ len: 56, chest: 22.0, ST: [13.8, 1.6 + (13.8 - 7) * 0.31], waist: 20.6, hem: 21.0, drop: 5, fabric: 'wool', sleeve: 'none', neck: { type: 'v', width: 7.0, depth: 24 }, foldAmp: 0.5 },
  nehru:    { len: 80, chest: 25.0, ST: [19.8, 5.6], waist: 23.6, hem: 26, drop: 2.0, fabric: 'silk', sleeve: { len: 62, hang: 8, wCuff: 10.4 }, neck: { type: 'collar', width: 6.6, depth: 3 }, foldAmp: 0.9 },
};

export function jacketProfile(ctx, spec, shot) {
  const style = STYLES[spec.style] ? spec.style : 'blazer';
  const S = STYLES[style];
  const back = shot === 'alt';
  const btn = style === 'denim' ? '#B88A44' : style === 'bomber' ? '#8E8A84' : mix(spec.color, '#101010', 0.45);
  const P = {
    fabric: spec.fabric || S.fabric, ST: S.ST, UA: [S.chest, 22], hemV: S.len, drop: S.drop,
    side: [[30, S.chest + 0.1], [S.len * 0.45, S.waist], [S.len - S.drop - 1.4, S.hem]],
    sleeve: S.sleeve, neck: S.neck, backNeck: { width: 7.2, depth: 1.8 }, dome: 1.3, foldAmp: S.foldAmp,
    fold: { n: style === 'trench' ? 6 : 4, v0: 22, a1: 1.3 }, creases: [S.len * 0.6], hangerHalfW: 19.4, noBinding: true,
    cuff: style === 'bomber' ? { type: 'rib', h: 6 } : style === 'denim' || style === 'shacket' ? { type: 'band', h: 5.2 } : { type: 'none' }, hemCorner: style === 'blazer',
    armhole: style === 'waistcoat' ? 'tank' : undefined,
    hasPlacket: style !== 'bomber',
  };
  if (style === 'bomber') { P.hemRib = 6; P.neckRib = 3.4; P.noBinding = false; P.neck = { type: 'crew', width: 8.2, depth: 3.2 }; }
  if (style === 'waistcoat') { P.hangerHalfW = 16.6; P.noHemStitch = true; }
  if (style === 'blazer' || style === 'trench') P.noHemStitch = false;
  const fbtn = (nk, hemV) => {
    const v0 = nk.centreY + (style === 'blazer' ? 0.2 : 4), v1 = style === 'blazer' ? nk.centreY + 6.5 : style === 'waistcoat' ? hemV - 9 : hemV - 8;
    return { v0, v1 };
  };
  P.bodyInner = ({ M, nk, hw, hemV, back: bk, c2 }) => {
    let inner = '';
    if (bk) {
      // back: centre seam (+ vent for blazer/trench), yoke for denim
      inner += `<path d="M0 ${f(nk.ys + 2)}V${f(hemV - 1)}" stroke="#000" stroke-opacity=".22" stroke-width=".12"/>`;
      if (style === 'blazer' || style === 'trench') inner += `<path d="M0 ${f(hemV - 24)}V${f(hemV - 1)}M.5 ${f(hemV - 24)}V${f(hemV - 1)}" stroke="#000" stroke-opacity=".4" stroke-width=".14"/>`;
      if (style === 'denim') inner += `<path d="M${f(-S.ST[0] + 2)} 15Q0 17.5 ${f(S.ST[0] - 2)} 15" fill="none" stroke="#C9803A" stroke-width=".18" stroke-dasharray=".5 .25"/>`;
      if (style === 'waistcoat') inner += `<path d="M-6 ${f(hemV - 16)}L6 ${f(hemV - 16)}" stroke="#000" stroke-opacity=".3" stroke-width=".3"/>`;
      return { inner };
    }
    const pv = fbtn(nk, hemV);
    if (style === 'blazer') {
      // lapels as darker facings + notch, button stance, flap pockets, welt pocket
      inner += flapPocket({ u: 14.2, v: hemV * 0.62, w: 9.6, h: 3.2, tilt: 0.5, M });
      inner += flapPocket({ u: -14.2, v: hemV * 0.62, w: 9.6, h: 3.2, tilt: 0.5, M });
      inner += `<path d="M7.4 ${f(hemV * 0.35)}h7.4" stroke="#000" stroke-opacity=".45" stroke-width=".22"/><path d="M7.4 ${f(hemV * 0.35 + .3)}h7.4" stroke="#fff" stroke-opacity=".12" stroke-width=".12"/>`;
    }
    if (style === 'trench') {
      inner += `<path d="M-9 ${f(hemV * 0.55)}H9" stroke="#000" stroke-opacity=".0"/>`;
      // storm flap + belt
      inner += `<path d="M${f(-hw(hemV * 0.5))} ${f(hemV * 0.5)}H${f(hw(hemV * 0.5))}V${f(hemV * 0.5 + 4.6)}H${f(-hw(hemV * 0.5))}Z" fill="${mix(spec.color, '#000', 0.04)}"/>` +
        `<path d="M${f(-hw(hemV * 0.5))} ${f(hemV * 0.5)}H${f(hw(hemV * 0.5))}M${f(-hw(hemV * 0.5))} ${f(hemV * 0.5 + 4.6)}H${f(hw(hemV * 0.5))}" stroke="#000" stroke-opacity=".38" stroke-width=".14"/>` +
        `<path d="M${f(-hw(hemV * 0.5))} ${f(hemV * 0.5 + 0.5)}H${f(hw(hemV * 0.5))}M${f(-hw(hemV * 0.5))} ${f(hemV * 0.5 + 4.1)}H${f(hw(hemV * 0.5))}" stroke="#000" stroke-opacity=".22" stroke-width=".06" stroke-dasharray=".3 .2"/>` +
        `<rect x="-2.6" y="${f(hemV * 0.5 + 0.9)}" width="5.2" height="2.8" rx=".4" fill="#9a9288"/><rect x="-1.8" y="${f(hemV * 0.5 + 1.5)}" width="3.6" height="1.6" fill="${mix(spec.color, '#000', 0.2)}"/>`;
      inner += flapPocket({ u: 15.5, v: hemV * 0.66, w: 11, h: 3.4, tilt: 0.4, M }) + flapPocket({ u: -15.5, v: hemV * 0.66, w: 11, h: 3.4, tilt: 0.4, M });
      // yoke / epaulette hint
      for (const s of [-1, 1]) inner += `<path d="M${f(s * 8.4)} ${f(nk.ys - 0.2)}L${f(s * (S.ST[0] - 1))} ${f(S.ST[1] - 0.2)}L${f(s * (S.ST[0] - 0.6))} ${f(S.ST[1] + 3)}L${f(s * 8.4)} ${f(nk.ys + 3.4)}Z" fill="${mix(spec.color, '#000', 0.06)}" stroke="#000" stroke-opacity=".32" stroke-width=".1"/>`;
    }
    if (style === 'denim') {
      const orange = '#C9803A';
      inner += `<path d="M${f(-S.ST[0] + 2)} 14Q0 16.6 ${f(S.ST[0] - 2)} 14" fill="none" stroke="${orange}" stroke-width=".16" stroke-dasharray=".5 .26"/>`;
      for (const s of [-1, 1]) {
        inner += patchPocket({ u: s * 9.2, v: 20.4, w: 9.4, h: 10.4, M });
        inner += `<path d="M${f(s * 9.2 - 4.4)} 21.2H${f(s * 9.2 + 4.4)}" stroke="${orange}" stroke-width=".13" stroke-dasharray=".4 .22"/>`;
        inner += `<path d="M${f(s * 5.8)} ${f(nk.ys + 8)}V${f(hemV - 5)}" stroke="${orange}" stroke-width=".14" stroke-dasharray=".5 .26" opacity="0"/>`;
      }
      inner += placket({ x: 0, v0: nk.ys + 1.5, v1: hemV - 1.4, w: 3.4, M });
      inner += `<path d="M-1.8 ${f(nk.ys + 1.5)}V${f(hemV - 1.4)}M1.8 ${f(nk.ys + 1.5)}V${f(hemV - 1.4)}" stroke="${orange}" stroke-width=".14" stroke-dasharray=".5 .26" opacity=".9"/>`;
    }
    if (style === 'shacket') {
      inner += placket({ x: 0, v0: nk.ys + 1.5, v1: hemV - 1.4, w: 3.6, M });
      inner += flapPocket({ u: 11.5, v: 22, w: 10, h: 10.6, tilt: 0, M }) + flapPocket({ u: -11.5, v: 22, w: 10, h: 10.6, tilt: 0, M });
      inner += flapPocket({ u: 15.5, v: hemV * 0.7, w: 11, h: 3.6, tilt: 0, M }) + flapPocket({ u: -15.5, v: hemV * 0.7, w: 11, h: 3.6, tilt: 0, M });
    }
    if (style === 'bomber') {
      // centre zip + slanted welt pockets
      inner += `<path d="M0 ${f(nk.ys + 3)}V${f(hemV - 6.2)}" stroke="#000" stroke-opacity=".5" stroke-width=".55"/><path d="M0 ${f(nk.ys + 3)}V${f(hemV - 6.2)}" stroke="#aaa59c" stroke-width=".34" stroke-dasharray=".16 .12"/>` +
        `<rect x="-.55" y="${f(nk.ys + 3.2)}" width="1.1" height="2.2" rx=".4" fill="#b9b3a7"/>`;
      for (const s of [-1, 1]) inner += `<path d="M${f(s * 8)} ${f(hemV * 0.62)}L${f(s * 15)} ${f(hemV * 0.62 + 4)}" stroke="#000" stroke-opacity=".5" stroke-width=".3"/><path d="M${f(s * 8)} ${f(hemV * 0.62 + .35)}L${f(s * 15)} ${f(hemV * 0.62 + 4.35)}" stroke="#fff" stroke-opacity=".14" stroke-width=".12"/>`;
    }
    if (style === 'waistcoat') {
      inner += `<path d="M${f(-hw(hemV * 0.6))} ${f(hemV * 0.62)}h0" stroke="#000"/>` +
        [-1, 1].map((s) => `<path d="M${f(s * 6.4)} ${f(hemV * 0.62)}h${f(s * 5.6)}" stroke="#000" stroke-opacity=".5" stroke-width=".24"/><path d="M${f(s * 6.4)} ${f(hemV * 0.62 + .35)}h${f(s * 5.6)}" stroke="#fff" stroke-opacity=".12" stroke-width=".12"/>`).join('');
    }
    if (style === 'nehru') {
      inner += placket({ x: 0, v0: nk.ys + 3, v1: hemV - 1.4, w: 3.0, M });
      for (const s of [-1, 1]) inner += `<path d="M${f(s * 12.5)} ${f(hemV * 0.58)}h${f(s * 6)}" stroke="#000" stroke-opacity=".4" stroke-width=".22"/>`;
    }
    return { inner };
  };
  P.overlay = ({ nk, hemV }) => {
    if (back) return '';
    if (style === 'bomber') return '';
    const pv = fbtn(nk, hemV);
    if (style === 'blazer') return buttonsOverlay(0, [nk.centreY + 0.2, nk.centreY + 6.2], 0.95, btn, { holes: 4 });
    if (style === 'trench') {
      let s = '';
      for (const sx of [-1, 1]) s += buttonsOverlay(sx * 4.4, [nk.centreY + 2, nk.centreY + 11, nk.centreY + 20, hemV * 0.5 + 10, hemV * 0.5 + 19], 0.9, btn, { holes: 4 });
      return s;
    }
    const n = style === 'waistcoat' ? 5 : style === 'nehru' ? 6 : 6;
    const vs = [];
    const top = style === 'waistcoat' ? nk.centreY + 1.4 : nk.ys + (style === 'nehru' ? 4.6 : 9.4);
    const bot = hemV - (style === 'waistcoat' ? 7 : 9);
    if (style !== 'waistcoat') vs.push(nk.ys + 2.6);
    for (let i = 0; i < n; i++) vs.push(lerp(top, bot, i / (n - 1)));
    return buttonsOverlay(0, vs, style === 'waistcoat' ? 0.65 : 0.62, btn, { holes: 4 });
  };
  P.sleeveOverlay = ({ sh }) => {
    if (style === 'blazer' || style === 'nehru' || style === 'trench') {
      let s = '';
      const o = sh.outer.at(0.9), i1 = sh.inner.at(0.9);
      for (let i = 0; i < 3; i++) s += button(lerp(o[0], i1[0], 0.22 + i * 0.012) + i * 0.9 * (sh.cuff.o[0] > 0 ? -0.3 : 0.3), lerp(o[1], i1[1], 0.22) + i * 1.1, 0.46, btn, { holes: 4 });
      return s;
    }
    if (style === 'denim' || style === 'shacket') { const o = sh.outer.at(0.95), i1 = sh.inner.at(0.95); return button(lerp(o[0], i1[0], 0.3), lerp(o[1], i1[1], 0.3), 0.5, btn, { holes: 4 }); }
    return '';
  };
  P.extraPieces = ({ M, nk, rng, ST, hw, hemV, tone }) => {
    const out = [];
    if (style === 'blazer' || style === 'trench') {
      // lapels: darker/lighter facing with notch, drawn as separate pieces over the body
      const ys = nk.ys, nsx = nk.nsx;
      const lapelLen = style === 'trench' ? 26 : 27;
      for (const side of [1, -1]) {
        const pts = [[nsx + 0.1, ys - 0.6, 'c'], [nsx + 4.2, ys + 1.7], [nsx + 8.6, ys + 5.2, 'c'], [nsx + 6.8, ys + 8.2, 'c'], [nsx * 0.7 + 2.3, ys + 10.2], [nsx * 0.4 + 0.6, ys + lapelLen * 0.62], [0.5, ys + lapelLen, 'c'], [0.3, ys + 7, 'c']].map((p) => [side * p[0], p[1], p[2]]);
        const c = Curve.through(pts, { closed: true });
        const ff = new FoldField(rng.int(1, 1e6));
        ff.ridge({ a: [side * (nsx + 0.2), ys], b: [side * 1.2, ys + lapelLen - 1], s0: 1.0, s1: 1.2, a0: 0.5, a1: 0.4, fade: 0.1 });
        ff.noise({ amp: 0.05, fu: 0.3, fv: 0.3 });
        out.push(clothPiece(M, { id: 'lapel' + side, z: 11, d: c.d(), bounds: c.bounds(), field: ff, bevelCm: 0.24, bevelH: 0.4, edgeAo: 0.14, grid: 2,
          contact: { dx: 0.3 * side, dy: 0.5, sigma: 0.55, strength: 0.4 },
          inner: `<path d="${c.d()}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width=".1"/>` + `<path d="${Curve.through(pts.slice(0, 5).map((p) => [p[0] * 0.92, p[1] + 0.35])).d()}" fill="none" stroke="#000" stroke-opacity=".2" stroke-width=".06" stroke-dasharray=".3 .2"/>` }));
      }
      if (style === 'trench') out.push(...collarPieces(M, nk, 'spread', { rng, back, d: 9 }).filter((p) => back || p.id !== 'collar-stand'));
    } else if (style === 'denim' || style === 'shacket') out.push(...collarPieces(M, nk, 'spread', { rng, back, d: 9 }));
    else if (style === 'nehru') out.push(...collarPieces(M, nk, 'band', { rng, back, d: 3 }));
    return out;
  };
  return P;
}

export default garmentKind((ctx, spec, shot) => buildUpper(ctx, spec, shot, jacketProfile(ctx, spec, shot)), { detail: upperDetail });
