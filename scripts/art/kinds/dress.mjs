// Dress: hung from a wooden hanger on a wall peg. front = hero view, alt = back, detail = macro crop with depth of field.
import { Curve, mirrorOutline, bandPath, offsetPath, tube, polyD, lerp, clamp, smoothstep, f, boundsOfPts, unionBounds } from '../lib/geometry.mjs';
import { FoldField } from '../lib/folds.mjs';
import { Rng } from '../lib/prng.mjs';
import { mix, darken, lighten, shadowOf } from '../lib/color.mjs';
import { hangerPieces, pickHangerTone } from '../lib/hanger.mjs';
import { makeMaterial, clothPiece, hwTable, neckline, fullFromHalf, sleeveShape, stitchLine, button, renderGarment } from '../lib/garment.mjs';
import { trimBand, tassels } from '../lib/trims.mjs';
import { garmentKind } from '../lib/garmentKind.mjs';
import { collarPieces, placket, buttonsOverlay } from '../lib/collar.mjs';
import { upperDetail } from '../lib/upper.mjs';

const HEM_V = { mini: 84, midi: 116, maxi: 146 };
const HEM_HW = {
  'a-line': { mini: 33, midi: 41, maxi: 46 }, 'fit-flare': { mini: 37, midi: 45, maxi: 52 }, slip: { mini: 27, midi: 29.5, maxi: 32 },
  wrap: { mini: 36, midi: 43, maxi: 49 }, shirt: { mini: 28.5, midi: 31, maxi: 34 }, tiered: { mini: 37, midi: 43, maxi: 48 }, bodycon: { mini: 21.5, midi: 19.5, maxi: 21 },
};
// [bust(v30), waist v, waist hw, hip v, hip hw, flare exponent]
const BODY = {
  'a-line': [23.4, 44, 23.2, 62, 26.5, 1.2], 'fit-flare': [22.2, 43, 19.4, 56, 26.0, 1.3], slip: [21.8, 46, 21.0, 64, 23.6, 1.1],
  wrap: [22.4, 43, 19.2, 56, 25.5, 1.25], shirt: [24.6, 46, 24.2, 64, 25.0, 1.0], tiered: [22.2, 42, 21.0, 58, 26.0, 1.15], bodycon: [22.4, 44, 18.4, 62, 23.6, 1.0],
};
const SLEEVES = {
  cap: { len: 9, hang: 40, wCuff: 13 },
  short: { len: 21, hang: 28, wCuff: 15 },
  'three-quarter': { len: 44, hang: 13, wCuff: 11.5 },
  long: { len: 61, hang: 9, wCuff: 9.5 },
  puff: { len: 23, hang: 28, wCuff: 11, bulge: 7 },
};

export function buildDress(ctx, spec, shot) {
  const back = shot === 'alt';
  const sil = BODY[spec.silhouette] ? spec.silhouette : 'a-line';
  const length = HEM_V[spec.length] ? spec.length : 'midi';
  const sleeve = spec.sleeve || 'none';
  const necklineType = back ? 'round' : (spec.neckline || (spec.silhouette === 'shirt' ? 'collar' : 'round'));
  const collared = necklineType === 'collar' || (back && (spec.neckline === 'collar' || spec.silhouette === 'shirt'));
  const M = makeMaterial(ctx, spec);
  const rng = ctx.rng.fork('dress-' + shot);
  const kids = !!spec.kids, KV = kids ? 0.62 : 1, KH = kids ? 0.82 : 1;
  const vh = HEM_V[length] * KV, hemHw = HEM_HW[sil][length] * KH;
  const [bustHw0, waistV0, waistHw0, hipV0, hipHw0, flare] = BODY[sil];
  const bustHw = bustHw0 * KH, waistV = waistV0 * (kids ? 0.72 : 1), waistHw = waistHw0 * KH * (kids ? 1.05 : 1), hipV = hipV0 * (kids ? 0.7 : 1), hipHw = hipHw0 * KH;
  const sleeved = sleeve !== 'none' && sil !== 'slip';
  const ST = [18.6 * KH, 5.2], UAv = kids ? 17.6 : 22.0, UAhw = (sil === 'shirt' ? 24.6 : lerp(22.2, bustHw0, 0.6)) * KH;
  const slip = sil === 'slip';
  const halter = necklineType === 'halter';

  // ---- neckline
  const nk = neckline(necklineType === 'collar' ? 'collar' : necklineType, necklineType === 'collar' ? { depth: 3.0 } : {});
  let half = [];
  let neckFront = nk;
  if (slip && !back) {
    half.push([0, 17.5, 'c'], [3.2, 14.0], [7.2, 10.4], [9.8, 8.5, 'c']);
  } else if (back) {
    // back view: shallow neckline; neck-side point stays on the hanger line
    const w = 7.2, ys = 1.6 + (w - 7.0) * 0.31;
    half.push([0, ys + 2.1], [w * 0.5, ys + 1.2], [w, ys]);
  } else {
    half.push(...nk.half);
  }
  const NS = half[half.length - 1];
  if (!slip) {
    // shoulder line (slight convex bump from the hanger)
    const mid = [lerp(NS[0], ST[0], 0.5), lerp(NS[1], ST[1], 0.5) - 0.28];
    half.push(mid, [ST[0], ST[1], 'c']);
  }
  // ---- armhole
  const UA = [UAhw, UAv];
  if (slip) {
    half.push([11.4, 13.0], [14.6, 17.6], [UA[0] - 0.4, UA[1], 'c']);
  } else if (sleeved) {
    half.push([lerp(ST[0], UA[0], 0.5) + 1.0, lerp(ST[1], UA[1], 0.5)], [UA[0], UA[1], 'c']);
  } else if (halter) {
    half.push([ST[0] - 6.5, ST[1] + 1.6], [ST[0] - 8.6, ST[1] + 6.8], [UA[0] - 4.2, UA[1] - 3.8], [UA[0], UA[1], 'c']);
  } else {
    half.push([ST[0] - 0.9, ST[1] + 3.0], [ST[0] - 3.1, ST[1] + 8.7], [UA[0] - 3.4, UA[1] - 4.2], [UA[0] - 0.6, UA[1] - 0.4], [UA[0], UA[1], 'c']);
  }

  // ---- fold field (needs a half-width table, so build a provisional outline first for hw)
  const drop = { 'fit-flare': 5.2, wrap: 5.0, 'a-line': 4.2, tiered: 4.0, shirt: 2.4, slip: 1.8, bodycon: 0.9 }[sil] * (length === 'mini' ? 0.7 : 1);
  const flared = sil === 'fit-flare' || sil === 'wrap' || sil === 'a-line' || sil === 'tiered';
  const sideV = [[UAv, UAhw], [30, bustHw], [waistV, waistHw]];
  if (flared && sil !== 'tiered') {
    for (const t of [0.14, 0.34, 0.6, 0.82, 1]) sideV.push([lerp(waistV, vh - drop - 1.4, t), lerp(waistHw, hemHw, Math.pow(t, flare))]);
  } else if (sil === 'tiered') {
    const t1 = lerp(waistV, vh, 0.34), t2 = lerp(waistV, vh, 0.67);
    sideV.push([lerp(waistV, t1, 0.5), lerp(waistHw, hipHw, 0.55)], [t1 - 0.6, hipHw], [t1 + 0.6, hipHw + 1.3], [lerp(t1, t2, 0.6), lerp(hipHw + 1.6, hemHw * 0.82, 0.55)],
      [t2 - 0.6, hemHw * 0.82], [t2 + 0.6, hemHw * 0.82 + 1.5], [lerp(t2, vh - drop - 1.4, 0.6), lerp(hemHw * 0.86, hemHw, 0.6)], [vh - drop - 1.4, hemHw]);
  } else {
    const hipEnd = Math.min(hipV, vh - 18);
    sideV.push([hipEnd, hipHw]);
    for (const t of [0.35, 0.7, 1]) sideV.push([lerp(hipEnd, vh - drop - 1.4, t), lerp(hipHw, hemHw, Math.pow(t, flare))]);
  }
  for (let i = 1; i < sideV.length; i++) half.push([sideV[i][1], sideV[i][0], sideV[i][2]]);
  const hc = vh - drop;
  const wave = (x) => 0;
  half.push([hemHw + 0.05, hc - 0.2], [hemHw * 0.955, hc + drop * 0.1], [hemHw * 0.74, hc + drop * 0.42], [hemHw * 0.42, hc + drop * 0.8], [0, vh]);
  // provisional outline for hw
  const provisional = mirrorOutline(half);
  const hw = hwTable(provisional, { v0: 0, v1: vh + 4 });

  const field = new FoldField(rng.int(1, 1e6));
  const fabAmp = M.mat.foldAmp ?? 1;
  const wr = M.mat.wrink ?? 0.5;
  field.dome({ hw, v0: 2, v1: vh, amp: (sil === 'bodycon' ? 1.3 : 1.9) * (0.8 + 0.3 * fabAmp), in: 6, out: 9, pow: 1.1 });
  const nFold = { 'a-line': 8, 'fit-flare': 10, slip: 5, wrap: 8, shirt: 5, tiered: 6, bodycon: 0 }[sil];
  const va = sil === 'shirt' ? 28 : sil === 'slip' ? 24 : waistV - 9;
  const vb = vh - 1.2;
  // drape: jittered spacing, uneven strength, a few dominant folds, softer secondary folds in between
  let prevS = -1;
  for (let i = 0; i < nFold; i++) {
    const s = -0.9 + (1.8 * (i + 0.5 + rng.range(-0.34, 0.34))) / nFold;
    const sign = rng.chance(0.55) ? (i % 2 ? 1 : -1) : (i % 2 ? -1 : 1);
    const spacingTop = (2 * hw(va) * 0.55) / nFold, spacingBot = (2 * hw(vb) * 0.95) / nFold;
    const big = rng.chance(0.28) ? 1.5 : 1;
    const mag = rng.range(0.5, 1.25) * big * fabAmp * (sil === 'slip' ? 0.9 : sil === 'shirt' ? 0.55 : 1);
    field.ridge({
      a: [s * hw(va) * 0.55 + rng.range(-0.8, 0.8), va], b: [s * hw(vb) * 0.95 + rng.range(-1.6, 1.6), vb],
      s0: Math.max(0.8, spacingTop * 0.26) * rng.range(0.8, 1.3), s1: Math.max(1.3, spacingBot * 0.2) * rng.range(0.8, 1.4),
      a0: 0.06 * sign, a1: (sil === 'slip' ? 1.7 : 2.1) * mag * sign, bow: rng.range(-1.8, 1.8), fade0: rng.range(0.3, 0.5), fade1: 0.12,
      wob: rng.range(0.2, 0.9), wobF: rng.range(0.8, 1.8), ph: rng.range(0, 6.28),
    });
    if (rng.chance(0.6)) { // softer secondary fold tucked beside the main one
      const s2 = s + (rng.chance(0.5) ? 1 : -1) * (0.35 / nFold) * 2.2;
      field.ridge({
        a: [s2 * hw(va) * 0.55, va + 8], b: [s2 * hw(vb) * 0.95, vb - rng.range(0, 14)], s0: 0.7, s1: 1.1, a0: 0.03, a1: -sign * 0.8 * fabAmp * rng.range(0.5, 1), bow: rng.range(-1, 1), fade0: 0.45, fade1: 0.3,
      });
    }
  }
  // bodice: bust shaping, armhole pull lines, shoulder strain, centre-front sheen
  if (sil !== 'shirt' && !slip) {
    for (const sx of [-1, 1]) field.blob({ u: sx * 8.6, v: 26, ru: 5.8, rv: 5, amp: 0.85 * fabAmp });
    for (const sx of [-1, 1]) field.ridge({ a: [sx * (UAhw - 1.2), UAv - 0.5], b: [sx * 6.5, 15], s0: 1.2, s1: 1.9, a0: 0.5 * fabAmp, a1: 0.05, fade0: 0.1, fade1: 0.4, bow: sx * 0.9 });
    for (const sx of [-1, 1]) field.ridge({ a: [sx * 11, 7], b: [sx * 15.5, 17], s0: 1.0, s1: 1.4, a0: 0.04, a1: -0.36 * fabAmp, fade0: 0.3, fade1: 0.3 });
  }
  if (sil === 'shirt') for (const sx of [-1, 1]) field.ridge({ a: [sx * (UAhw - 1), UAv + 1], b: [sx * 8, 14], s0: 1.2, s1: 1.8, a0: 0.4 * fabAmp, a1: 0.05, fade0: 0.1, fade1: 0.35 });
  if (sil === 'fit-flare' || sil === 'wrap' || sil === 'bodycon') field.band({ v: waistV + 0.5, w: 1.6, amp: -0.25 * fabAmp });
  if (sil === 'bodycon') for (const v of [31, 53, 60]) field.band({ v, w: 1.4, amp: 0.2 * fabAmp });
  if (sil === 'tiered') for (const v of [lerp(waistV, vh, 0.34) + 0.4, lerp(waistV, vh, 0.67) + 0.5]) field.band({ v, w: 1.0, amp: -0.5 });
  field.noise({ amp: 0.16 * wr, fu: 0.2, fv: 0.06, oct: 3, v0: 6 });
  field.noise({ amp: 0.07 * wr, fu: 0.55, fv: 0.4, oct: 2, v0: 6 });

  // hem waviness couples to the folds
  const hemFix = (p) => [p[0], p[1] + (p[2] === 'c' ? 0 : 0.55 * field.h(p[0], p[1])), p[2]];
  const hemStart = half.length - 5;
  for (let i = hemStart + 1; i < half.length - 1; i++) half[i] = hemFix(half[i]);

  const outline = mirrorOutline(half);
  const bodyBounds = outline.bounds();

  const pieces = [];
  // ---- hanger
  const tone = pickHangerTone(ctx, spec.color);
  pieces.push(...hangerPieces(ctx, { halfW: ST[0] - 1.5, drop: 5.4, tone }));

  // ---- trims drawn into the body (binding, hem band…)
  let bodyInner = '';
  let bodyDefs = '';
  const trim = spec.trim && spec.trim !== 'none' ? spec.trim : null;
  const neckCurve = slip && !back ? null : (back ? fullFromHalf(half.slice(0, 3)) : fullFromHalf(nk.half));
  const c2 = spec.color2 || mix(spec.color, '#000', 0.25);
  if (neckCurve) {
    const trimmed = trim && trim !== 'tassel' && trim !== 'lace' && trim !== 'ruffle';
    if (trimmed) {
      const tn = trimBand(trim === 'piping' ? 'piping' : trim === 'gota' ? 'gota' : trim === 'zari-border' ? 'zari-border' : 'contrast-border', neckCurve, { o0: 0, o1: trim === 'zari-border' ? 1.2 : trim === 'gota' ? 0.9 : 0.62, color: spec.color, color2: c2 });
      bodyInner += tn.inner; bodyDefs += tn.defs;
    } else bodyInner += `<path d="${bandPath(neckCurve, 0, 0.5, { n: 50 })}" fill="${mix(spec.color, '#000', 0.07)}"/>`;
    bodyInner += stitchLine(neckCurve, trim && trim !== 'piping' ? 1.4 : 0.85, { color: '#000', op: 0.22, w: 0.06 });
  }
  // waist seam on fitted / flared shapes: dark seam line, light lip below it, running stitch
  if (sil === 'fit-flare' || sil === 'wrap' || sil === 'tiered' || sil === 'shirt') {
    const wv = sil === 'tiered' ? lerp(waistV, vh, 0.34) : waistV, ww = hw(wv) + 2;
    bodyInner += `<path d="M${f(-ww)} ${f(wv)}Q0 ${f(wv + 1.1)} ${f(ww)} ${f(wv)}" fill="none" stroke="#000" stroke-opacity=".34" stroke-width=".16"/>` +
      `<path d="M${f(-ww)} ${f(wv + 0.28)}Q0 ${f(wv + 1.38)} ${f(ww)} ${f(wv + 0.28)}" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width=".14"/>` +
      `<path d="M${f(-ww)} ${f(wv + 0.7)}Q0 ${f(wv + 1.8)} ${f(ww)} ${f(wv + 0.7)}" fill="none" stroke="#000" stroke-opacity=".2" stroke-width=".07" stroke-dasharray=".3 .22"/>`;
  }
  // wrap dress: crossing panel edge from the V to the side-waist tie
  if (sil === 'wrap' && !back) {
    const wx = hw(waistV) * 0.8, cy0 = nk.centreY;
    const edge = `M-1.0 ${f(cy0 - 0.3)}Q${f(wx * 0.45)} ${f(lerp(cy0, waistV, 0.55))} ${f(wx)} ${f(waistV + 0.6)}`;
    bodyInner += `<path d="${edge}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width=".2"/><path d="${edge}" transform="translate(.35 .1)" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width=".12"/>` +
      `<path d="${edge}" transform="translate(-.6 -.05)" fill="none" stroke="#000" stroke-opacity=".2" stroke-width=".07" stroke-dasharray=".3 .22"/>`;
  }
  // shirt-dress / collared dresses: button placket down the front (+ collar pieces further below)
  if (collared && !back) bodyInner += placket({ x: 0, v0: nk.ys + 1.5, v1: sil === 'shirt' ? vh - 2.4 : waistV + 8, w: 3.4, M });
  // hem curve (full, left -> right) for trims
  const rightHem = half.slice(hemStart).map((p) => [p[0], p[1]]);
  const hemFull = Curve.through([...rightHem.slice(1).reverse().map((p) => [-p[0], p[1]]), ...rightHem]);
  if (trim && ['contrast-border', 'gota', 'zari-border', 'lace'].includes(trim)) {
    const wd = { 'contrast-border': 2.6, gota: 2.2, 'zari-border': 4.2, lace: 3.4 }[trim];
    const tb = trimBand(trim, hemFull, { o0: -wd - 0.6, o1: -0.6, color: spec.color, color2: c2, n: 140 });
    bodyInner += tb.inner; bodyDefs += tb.defs;
  }
  // back-view details: centre-back zip with pull tab, neck hook
  if (back) {
    const zTop = 3.6, zBot = waistV + (sil === 'a-line' || sil === 'shirt' ? 14 : 9);
    bodyInner += `<path d="M0 ${zTop}L0 ${zBot}" stroke="#000" stroke-opacity=".35" stroke-width=".5"/>` +
      `<path d="M0 ${zTop}L0 ${zBot}" stroke="${mix(spec.color, '#fff', 0.35)}" stroke-width=".34" stroke-dasharray=".16 .12"/>` +
      `<path d="M-.5 ${zTop}L-.5 ${zBot}M.5 ${zTop}L.5 ${zBot}" stroke="#000" stroke-opacity=".18" stroke-width=".08"/>` +
      `<rect x="-.5" y="${zTop + 0.3}" width="1" height="1.8" rx=".35" fill="#b9b3a7"/><rect x="-.28" y="${zTop + 0.7}" width=".56" height=".9" rx=".25" fill="${darken(spec.color, 0.3)}"/>`;
  }

  // ---- back panel (inner back neck visible through the opening)
  if (!back && !slip) {
    const nsx = nk.nsx, ys = nk.ys;
    const backTop = Curve.through([[-nsx, ys], [-nsx * 0.5, ys + 0.95], [0, ys + 1.25], [nsx * 0.5, ys + 0.95], [nsx, ys]]);
    const lowL = [-nsx, ys + 1.5], lowR = [nsx, ys + 1.5];
    const shifted = fullFromHalf(nk.half.map((p) => [p[0], p[1] + 1.4, p[2]]));
    const d = backTop.d() + `L${f(nsx)} ${f(ys + 1.6)}` + shifted.reversed().d({ move: false }) + 'Z';
    const bb = boundsOfPts([[-nsx - 1, ys - 1], [nsx + 1, nk.centreY + 4]]);
    pieces.push(clothPiece(M, { id: 'back', z: 5, d, bounds: bb, gain: (necklineType === 'square' || necklineType === 'scoop') ? 0.9 : 0.8, edgeAo: 0.2, bevelH: 0.15, field: null, noCast: true, contact: { strength: 0.2 } }));
  }

  // ---- body
  const bodyPiece = clothPiece(M, { id: 'body', z: 10, d: outline.d(), bounds: bodyBounds, field, inner: bodyInner, defs: bodyDefs, bevelCm: 0.28, bevelH: 0.3 });
  if (trim === 'tassel') bodyPiece.overlay = tassels(hemFull, { count: Math.round(hemHw / 3.4), color: c2, u0: 0.04, u1: 0.96, rng: rng.fork('tass') });
  if (sil === 'wrap' && !back) {
    const bx = hw(waistV) * 0.8, by = waistV + 0.9, bc = spec.color, bd = darken(spec.color, 0.3);
    const loop = (sg) => `<path d="M0 0C${f(sg * 2.7)} -2.6 ${f(sg * 4.8)} -0.9 ${f(sg * 3.8)} 1.3C${f(sg * 2.9)} 2.8 ${f(sg * 0.9)} 1.5 0 0Z" fill="${bc}" stroke="#000" stroke-opacity=".32" stroke-width=".1"/><path d="M${f(sg * 0.8)} -.2C${f(sg * 2.4)} -1.6 ${f(sg * 3.5)} -.9 ${f(sg * 3.3)} .3" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".12"/>`;
    const tail = (sg) => `<path d="M${f(sg * 0.3)} .3C${f(sg * 1.6)} 3 ${f(sg * 2.6)} 5.4 ${f(sg * 3.4)} 7.8L${f(sg * 1.5)} 7.6C${f(sg * 1.1)} 5.4 ${f(sg * 0.3)} 3 ${f(-sg * 0.3)} .5Z" fill="${bc}" stroke="#000" stroke-opacity=".3" stroke-width=".1"/>`;
    bodyPiece.overlay = (bodyPiece.overlay || '') + `<g transform="translate(${f(bx)} ${f(by)})"><path d="M0 0" />${tail(-1)}${tail(1)}${loop(-1)}${loop(1)}<ellipse cx="0" cy=".2" rx=".95" ry=".85" fill="${bd}" stroke="#000" stroke-opacity=".3" stroke-width=".08"/></g>`;
  }
  if (collared && !back) {
    const btn = mix(spec.color, '#efe8da', 0.7);
    const vs = [nk.ys + 2.6];
    const end = sil === 'shirt' ? vh - 8 : waistV + 6;
    for (let i = 0; i < (sil === 'shirt' ? 7 : 3); i++) vs.push(lerp(nk.ys + 11, end, i / ((sil === 'shirt' ? 7 : 3) - 1)));
    bodyPiece.overlay = (bodyPiece.overlay || '') + buttonsOverlay(0, vs, 0.6, btn, { holes: 4 });
  }
  pieces.push(bodyPiece);
  if (collared) pieces.push(...collarPieces(M, nk, 'spread', { rng, back, d: 3 }));

  // ---- sleeves
  if (sleeved) {
    const sp0 = SLEEVES[sleeve] || SLEEVES.short, sp = kids ? { ...sp0, len: sp0.len * 0.62, wCuff: sp0.wCuff * 0.88 } : sp0;
    for (const side of [1, -1]) {
      const sh = sleeveShape({ ST: [ST[0], ST[1]], UA: [UA[0] - 0.2, UA[1]], side, ...sp });
      const sf = new FoldField(rng.int(1, 1e6));
      const c = sh.centre;
      sf.curveRidge({ curve: c, type: 'gauss', s: (u) => sh.widthAt(u) * 0.42, a: (u) => 1.5 * fabAmp * (1 - 0.3 * u), fade0: 0.2, fade1: 0.1 });
      const nCrease = sleeve === 'cap' ? 1 : 3;
      for (let i = 0; i < nCrease; i++) {
        const off0 = rng.range(-0.3, 0.3), sg = i % 2 ? 1 : -1;
        const cAmp = rng.range(0.7, 1.1);
        sf.curveRidge({ curve: c, u0: 0.3, off: (u) => off0 * sh.widthAt(u), s: (u) => 1.4 + 0.7 * u, a: (u) => sg * (0.1 + 0.55 * u) * fabAmp * cAmp, fade0: 0.35, fade1: 0.1 });
      }
      sf.noise({ amp: 0.14 * wr, fu: 0.25, fv: 0.12, oct: 2 });
      pieces.push(clothPiece(M, { id: 'sleeve' + side, z: 12, d: sh.d, bounds: sh.bounds, field: sf, patTransform: `translate(${side * 3.1} 1.7)`, bevelCm: 0.28, bevelH: 0.3, grid: 2, contact: { dx: 0.4 * side, dy: 0.6, sigma: 0.7, strength: 0.38 } }));
    }
  }
  // slip straps
  if (slip && !back) {
    for (const side of [1, -1]) {
      const c = Curve.through([[side * 9.8, 8.8], [side * 9.0, 5.9], [side * 8.2, 3.3], [side * 7.9, 2.0]]);
      const { L, R } = tube(c, 0.95, { n: 24 });
      pieces.push(clothPiece(M, { id: 'strap' + side, z: 12, d: polyD([...L, ...R.slice().reverse()]), bounds: c.bounds(), pad: 1, bevelCm: 0.2, bevelH: 0.25, noPattern: false, fill: M.base, edgeAo: 0.1 }));
    }
  }
  if (slip && back) {
    for (const side of [1, -1]) {
      const c = Curve.through([[side * 8.4, 2.4], [side * 9.2, 7], [side * 10.5, 11]]);
      const { L, R } = tube(c, 0.95, { n: 24 });
      pieces.push(clothPiece(M, { id: 'strap' + side, z: 12, d: polyD([...L, ...R.slice().reverse()]), bounds: c.bounds(), pad: 1, bevelCm: 0.2, bevelH: 0.25 }));
    }
  }

  if (trim === 'tassel') pieces.push({ ...bodyPiece, id: 'tassel-bounds', z: -1, d: 'M0 0', bounds: { x0: -hemHw, y0: vh, x1: hemHw, y1: vh + 6 }, overlay: null, inner: '', defs: '', noCast: true });
  const bounds = unionBounds(pieces.map((p) => p.bounds));
  return { pieces, bounds, field, hw, vh, hemV: vh, waistV, ST, nk, neckCurve, hemCurve: hemFull, sleeved, M, sil, hasPlacket: collared };
}

export default garmentKind((ctx, spec, shot) => buildDress(ctx, spec, shot), { detail: upperDetail });
