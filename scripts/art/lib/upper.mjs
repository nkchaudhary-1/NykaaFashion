// Generic hanging upper-body garment (tee, top, shirt, jacket, kurta…). A kind supplies a *profile* P (numbers, flags and
// small hooks); this builds the outline, drape field, hanger, inner-back, sleeves, trims and back-view variant.
import { Curve, mirrorOutline, bandPath, offsetPath, tube, polyD, lerp, clamp, smoothstep, f, boundsOfPts, unionBounds } from './geometry.mjs';
import { FoldField } from './folds.mjs';
import { mix, darken, lighten, shadowOf, luma } from './color.mjs';
import { hangerPieces, pickHangerTone } from './hanger.mjs';
import { makeMaterial, clothPiece, hwTable, neckline, fullFromHalf, sleeveShape, stitchLine, button } from './garment.mjs';
import { trimBand, tassels } from './trims.mjs';

export const SLEEVE_TYPES = {
  none: null,
  cap: { len: 9, hang: 40, wCuff: 13 },
  short: { len: 21, hang: 28, wCuff: 15.5 },
  elbow: { len: 33, hang: 20, wCuff: 13 },
  'three-quarter': { len: 44, hang: 13, wCuff: 11.5 },
  long: { len: 61, hang: 9, wCuff: 9.5 },
  puff: { len: 23, hang: 28, wCuff: 11, bulge: 7 },
  bishop: { len: 60, hang: 10, wCuff: 8.5, bulge: 5 },
};

/** rib / cuff band polygon across a sleeve end */
export function cuffBand(sh, h) {
  const len = sh.centre.length;
  const dl = clamp(h / Math.max(len, 1), 0.02, 0.5);
  const o1 = sh.outer.at(1 - dl), o2 = sh.outer.at(1), i1 = sh.inner.at(1 - dl), i2 = sh.inner.at(1);
  return `M${f(o1[0])} ${f(o1[1])}L${f(o2[0])} ${f(o2[1])}L${f(i2[0])} ${f(i2[1])}L${f(i1[0])} ${f(i1[1])}Z`;
}

/** rib texture pattern def (vertical lines) */
export function ribDefs(id, color, pitch = 0.3) {
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${pitch}" height="${pitch}"><rect width="${pitch}" height="${pitch}" fill="${color}"/><rect x="${pitch * 0.55}" width="${pitch * 0.45}" height="${pitch}" fill="#000" fill-opacity=".2"/><rect x="${pitch * 0.1}" width="${pitch * 0.18}" height="${pitch}" fill="#fff" fill-opacity=".1"/></pattern>`;
}

export function buildUpper(ctx, spec, shot, P) {
  const back = shot === 'alt';
  const M = makeMaterial(ctx, spec, { fabric: P.fabric });
  const rng = ctx.rng.fork('upper-' + shot);
  const fabAmp = (M.mat.foldAmp ?? 1) * (P.foldAmp ?? 1), wr = M.mat.wrink ?? 0.5;
  const ST = P.ST, UA = P.UA, hemV = P.hemV;
  const sleeveKey = P.sleeve || 'none';
  const sp = typeof sleeveKey === 'object' ? sleeveKey : SLEEVE_TYPES[sleeveKey];
  const sleeved = !!sp && P.armhole !== 'tank' && P.armhole !== 'strap';
  const tone = pickHangerTone(ctx, spec.color);

  // ---------------------------------------------------------------- outline (right half, centre-top -> hem centre)
  const nk = neckline(P.neck.type, P.neck);
  let half = [];
  if (P.topHalf && !back) half.push(...P.topHalf);
  else if (back) {
    const bw = P.backNeck?.width ?? Math.min(nk.nsx, P.neck.type === 'scoop' || P.neck.type === 'boat' ? 9 : 7.4), ys = 1.6 + (bw - 7.0) * 0.31;
    const dep = P.backNeck?.depth ?? 2.1;
    half.push([0, ys + dep], [bw * 0.5, ys + dep * 0.55], [bw, ys]);
  } else half.push(...nk.half);
  const NS = half[half.length - 1];
  if (!P.topHalf || back) {
    const mid = [lerp(NS[0], ST[0], 0.5), lerp(NS[1], ST[1], 0.5) - (P.shoulderBump ?? 0.28)];
    half.push(mid, [ST[0], ST[1], 'c']);
  }
  if (P.armholeHalf) half.push(...P.armholeHalf);
  else if (sleeved) half.push([lerp(ST[0], UA[0], 0.5) + 1.0, lerp(ST[1], UA[1], 0.5)], [UA[0], UA[1], 'c']);
  else if (P.armhole === 'tank') half.push([ST[0] - 0.2, ST[1] + 3.4], [ST[0] + 0.6, ST[1] + 9.0], [lerp(ST[0], UA[0], 0.62), UA[1] - 4.4], [UA[0] - 0.8, UA[1] - 1.2], [UA[0], UA[1], 'c']);
  else half.push([ST[0] - 0.9, ST[1] + 3.0], [ST[0] - 3.1, ST[1] + 8.7], [UA[0] - 3.4, UA[1] - 4.2], [UA[0] - 0.6, UA[1] - 0.4], [UA[0], UA[1], 'c']);
  for (const q of P.side) half.push([q[1], q[0], q[2]]); // P.side entries are [v, hw]
  const hemHw = P.side[P.side.length - 1][1];
  const drop = P.drop ?? 1.2, hc = hemV - drop;
  half.push([hemHw + 0.05, hc - 0.2, P.hemCorner ? 'c' : undefined], [hemHw * 0.955, hc + drop * 0.1], [hemHw * 0.74, hc + drop * 0.42], [hemHw * 0.42, hc + drop * 0.8], [0, hemV]);
  const provisional = mirrorOutline(half);
  const hw = hwTable(provisional, { v0: 0, v1: hemV + 4 });

  // ---------------------------------------------------------------- drape field
  const field = new FoldField(rng.int(1, 1e6));
  field.dome({ hw, v0: 2, v1: hemV, amp: (P.dome ?? 1.5) * (0.8 + 0.3 * fabAmp), in: 5, out: Math.min(9, hemV * 0.2), pow: 1.1 });
  const F = P.fold || {};
  const nF = F.n ?? 5, va = F.v0 ?? 22, vb = hemV - 1.2;
  for (let i = 0; i < nF; i++) {
    const s = -0.88 + (1.76 * (i + 0.5 + rng.range(-0.3, 0.3))) / nF;
    const sign = rng.chance(0.55) ? (i % 2 ? 1 : -1) : (i % 2 ? -1 : 1);
    const big = rng.chance(0.25) ? 1.4 : 1;
    const mag = rng.range(0.45, 1.2) * big * fabAmp * (F.amp ?? 1);
    const spTop = (2 * hw(va) * 0.6) / nF, spBot = (2 * hw(vb) * 0.95) / nF;
    field.ridge({
      a: [s * hw(va) * 0.6 + rng.range(-0.6, 0.6), va], b: [s * hw(vb) * 0.95 + rng.range(-1.2, 1.2), vb],
      s0: Math.max(0.8, spTop * 0.25) * rng.range(0.85, 1.3), s1: Math.max(1.2, spBot * 0.22) * rng.range(0.85, 1.4),
      a0: 0.05 * sign, a1: (F.a1 ?? 1.5) * mag * sign, bow: rng.range(-1.2, 1.2), fade0: rng.range(0.25, 0.5), fade1: 0.14,
      wob: rng.range(0.15, 0.7), wobF: rng.range(0.8, 1.6), ph: rng.range(0, 6.28),
    });
  }
  for (const sx of [-1, 1]) {
    field.ridge({ a: [sx * (UA[0] - 1.2), UA[1] - 0.5], b: [sx * 6.5, 14.5], s0: 1.2, s1: 1.9, a0: 0.5 * fabAmp, a1: 0.05, fade0: 0.1, fade1: 0.4, bow: sx * 0.9 });
    field.ridge({ a: [sx * 11, 6.5], b: [sx * (ST[0] - 3), 16], s0: 1.0, s1: 1.4, a0: 0.04, a1: -0.34 * fabAmp, fade0: 0.3, fade1: 0.3 });
  }
  if (P.bust) for (const sx of [-1, 1]) field.blob({ u: sx * 8.4, v: 25, ru: 5.6, rv: 4.8, amp: P.bust * fabAmp });
  if (P.waistBand) field.band({ v: P.waistBand, w: 1.8, amp: -0.28 * fabAmp });
  for (const v of P.creases || []) field.band({ v, w: 1.3, amp: 0.16 * fabAmp * (M.mat.crisp ?? 0.5) * 2 });
  field.noise({ amp: 0.15 * wr, fu: 0.2, fv: 0.06, oct: 3, v0: 6 });
  field.noise({ amp: 0.07 * wr, fu: 0.55, fv: 0.4, oct: 2, v0: 6 });
  const hemFix = (p) => [p[0], p[1] + (p[2] === 'c' ? 0 : 0.5 * field.h(p[0], p[1])), p[2]];
  const hemStart = half.length - 5;
  for (let i = hemStart + 1; i < half.length - 1; i++) half[i] = hemFix(half[i]);
  const outline = mirrorOutline(half);
  const bodyBounds = outline.bounds();

  // ---------------------------------------------------------------- pieces
  const pieces = [];
  pieces.push(...hangerPieces(ctx, { halfW: Math.min(P.hangerHalfW ?? ST[0] - 0.3, 19.5), drop: Math.min(ST[1] - 0.2, 6.5), tone }));
  const c2 = spec.color2 || mix(spec.color, '#000', 0.25);
  const trim = spec.trim && spec.trim !== 'none' ? spec.trim : null;
  let bodyInner = '', bodyDefs = '';
  const neckCurve = P.noNeckCurve && !back ? null : (back ? fullFromHalf(half.slice(0, 3)) : fullFromHalf(nk.half));
  const helpers = { M, rng, hw, field, nk, ST, UA, hemV, back, c2, trim, fabAmp, tone, half, outline };
  if (neckCurve && !P.noBinding) {
    if (P.neckRib) {
      const rid = 'rib1';
      bodyDefs += ribDefs(rid, mix(spec.color, '#000', 0.04));
      bodyInner += `<path d="${bandPath(neckCurve, 0, P.neckRib, { n: 60 })}" fill="url(#${rid})"/>` +
        `<path d="${offsetPath(neckCurve, P.neckRib, { n: 60 })}" stroke="#000" stroke-opacity=".28" stroke-width=".08" fill="none"/>`;
    } else if (trim && !['tassel', 'lace', 'ruffle'].includes(trim)) {
      const tn = trimBand(trim, neckCurve, { o0: 0, o1: trim === 'zari-border' ? 1.2 : trim === 'gota' ? 0.9 : 0.62, color: spec.color, color2: c2 });
      bodyInner += tn.inner; bodyDefs += tn.defs;
      bodyInner += stitchLine(neckCurve, trim === 'piping' ? 0.85 : 1.4, { color: '#000', op: 0.22, w: 0.06 });
    } else {
      bodyInner += `<path d="${bandPath(neckCurve, 0, 0.5, { n: 50 })}" fill="${mix(spec.color, '#000', 0.07)}"/>` + stitchLine(neckCurve, 0.85, { color: '#000', op: 0.22, w: 0.06 });
    }
  }
  const rightHem = half.slice(hemStart).map((p) => [p[0], p[1]]);
  const hemFull = Curve.through([...rightHem.slice(1).reverse().map((p) => [-p[0], p[1]]), ...rightHem]);
  if (P.hemRib) {
    bodyDefs += ribDefs('rib2', mix(spec.color, '#000', 0.05));
    bodyInner += `<path d="${bandPath(hemFull, -P.hemRib - 0.3, -0.3, { n: 120 })}" fill="url(#rib2)"/><path d="${offsetPath(hemFull, -P.hemRib - 0.3, { n: 120 })}" stroke="#000" stroke-opacity=".3" stroke-width=".09" fill="none"/>`;
  } else if (trim && ['contrast-border', 'gota', 'zari-border', 'lace'].includes(trim) && !P.noHemTrim) {
    const wd = { 'contrast-border': 2.4, gota: 2.0, 'zari-border': 3.6, lace: 3.0 }[trim];
    const tb = trimBand(trim, hemFull, { o0: -wd - 0.5, o1: -0.5, color: spec.color, color2: c2, n: 120 });
    bodyInner += tb.inner; bodyDefs += tb.defs;
  } else if (!P.noHemStitch) {
    bodyInner += stitchLine(hemFull, -1.0, { color: '#000', op: 0.2, w: 0.06 });
  }
  if (P.bodyInner) { const r = P.bodyInner({ ...helpers, hemFull, neckCurve }); bodyInner += r.inner || ''; bodyDefs += r.defs || ''; }

  // inner back neck
  if (!back && !P.topHalf && !P.noBackPiece) {
    const nsx = nk.nsx, ys = nk.ys;
    const backTop = Curve.through([[-nsx, ys], [-nsx * 0.5, ys + 0.95], [0, ys + 1.25], [nsx * 0.5, ys + 0.95], [nsx, ys]]);
    const shifted = fullFromHalf(nk.half.map((p) => [p[0], p[1] + 1.4, p[2]]));
    const d = backTop.d() + `L${f(nsx)} ${f(ys + 1.6)}` + shifted.reversed().d({ move: false }) + 'Z';
    pieces.push(clothPiece(M, { id: 'back', z: 5, d, bounds: boundsOfPts([[-nsx - 1, ys - 1], [nsx + 1, nk.centreY + 4]]), gain: 0.78, edgeAo: 0.2, bevelH: 0.15, noCast: true, contact: { strength: 0.2 } }));
  }
  const bodyPiece = clothPiece(M, { id: 'body', z: 10, d: outline.d(), bounds: bodyBounds, field, inner: bodyInner, defs: bodyDefs, bevelCm: 0.28, bevelH: 0.3 });
  if (trim === 'tassel') bodyPiece.overlay = tassels(hemFull, { count: Math.round(hemHw / 3.4), color: c2, u0: 0.04, u1: 0.96, rng: rng.fork('tass') });
  if (P.overlay) { const o = P.overlay({ ...helpers, hemFull, neckCurve }); bodyPiece.overlay = (bodyPiece.overlay || '') + o; }
  pieces.push(bodyPiece);
  if (trim === 'tassel') pieces.push({ ...bodyPiece, id: 'tassel-bounds', z: -1, d: 'M0 0', bounds: { x0: -hemHw, y0: hemV, x1: hemHw, y1: hemV + 6 }, overlay: null, inner: '', defs: '', noCast: true });

  // ---------------------------------------------------------------- sleeves
  const sleeveShapes = {};
  if (sleeved) {
    const cuff = P.cuff || {};
    for (const side of [1, -1]) {
      const sh = sleeveShape({ ST: [ST[0], ST[1]], UA: [UA[0] - 0.2, UA[1]], side, ...sp, ...(P.sleeveOverride || {}) });
      sleeveShapes[side] = sh;
      const sf = new FoldField(rng.int(1, 1e6));
      const c = sh.centre;
      sf.curveRidge({ curve: c, type: 'gauss', s: (u) => sh.widthAt(u) * 0.42, a: (u) => 1.5 * fabAmp * (1 - 0.3 * u), fade0: 0.02, fade1: 0.05 });
      const nCrease = sp.len < 14 ? 1 : 3;
      for (let i = 0; i < nCrease; i++) {
        const off0 = rng.range(-0.3, 0.3), sg = i % 2 ? 1 : -1;
        const cAmp = rng.range(0.7, 1.1);
        sf.curveRidge({ curve: c, off: (u) => off0 * sh.widthAt(u), s: (u) => 1.4 + 0.7 * u, a: (u) => sg * (0.1 + 0.55 * u) * fabAmp * cAmp, fade0: 0.35, fade1: 0.1 });
      }
      if (sp.len > 30) sf.band({ v: ST[1] + 24, w: 1.4, amp: 0.2 * fabAmp });
      sf.noise({ amp: 0.14 * wr, fu: 0.25, fv: 0.12, oct: 2 });
      let sInner = '', sDefs = '';
      if (cuff.type === 'rib') {
        sDefs += ribDefs('rib3', mix(spec.color, '#000', 0.05));
        sInner += `<path d="${cuffBand(sh, cuff.h ?? 5)}" fill="url(#rib3)"/>`;
      } else if (cuff.type === 'band') {
        const cb = cuffBand(sh, cuff.h ?? 5.5);
        sInner += `<path d="${cb}" fill="${cuff.color || spec.color}"/><path d="${cb}" fill="url(#pat)" opacity="${cuff.color ? 0 : 1}"/><path d="${cb}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width=".09"/>`;
        const o = sh.outer.at(1 - (cuff.h ?? 5.5) / sh.centre.length), i1 = sh.inner.at(1 - (cuff.h ?? 5.5) / sh.centre.length);
        sInner += `<path d="M${f(o[0])} ${f(o[1])}L${f(i1[0])} ${f(i1[1])}" stroke="#fff" stroke-opacity=".12" stroke-width=".12"/>`;
      } else if (trim && ['contrast-border', 'gota', 'zari-border', 'lace', 'piping'].includes(trim) && sp.len > 12 && !P.noCuffTrim) {
        const cc = Curve.through([sh.cuff.o, sh.cuff.mid, sh.cuff.i]);
        const wd = { 'contrast-border': 2.0, gota: 1.8, 'zari-border': 3.0, lace: 2.6, piping: 0.5 }[trim];
        const tb = trimBand(trim, cc, { o0: -wd - 0.4, o1: -0.4, color: spec.color, color2: c2 });
        // the cuff curve runs outer->inner; "inside the sleeve" is the opposite normal for the right sleeve
        const tb2 = trimBand(trim, cc, { o0: 0.4, o1: wd + 0.4, color: spec.color, color2: c2 });
        sInner += side === 1 ? tb.inner : tb2.inner; sDefs += side === 1 ? tb.defs : tb2.defs;
      } else sInner += `<path d="${offsetPath(Curve.through([sh.cuff.o, sh.cuff.mid, sh.cuff.i]), side === 1 ? -0.8 : 0.8, { n: 20 })}" stroke="#000" stroke-opacity=".2" stroke-width=".06" stroke-dasharray=".3 .2" fill="none"/>`;
      if (P.sleeveInner) { const r = P.sleeveInner({ ...helpers, sh, side }); sInner += r.inner || ''; sDefs += r.defs || ''; }
      const sPiece = clothPiece(M, { id: 'sleeve' + side, z: 12, d: sh.d, bounds: sh.bounds, field: sf, inner: sInner, defs: sDefs, patTransform: `translate(${side * 3.1} 1.7)`, bevelCm: 0.28, bevelH: 0.3, grid: 2, contact: { dx: 0.4 * side, dy: 0.6, sigma: 0.7, strength: 0.38 } });
      if (P.sleeveOverlay) sPiece.overlay = P.sleeveOverlay({ ...helpers, sh, side });
      pieces.push(sPiece);
    }
  }
  if (P.straps) {
    for (const side of [1, -1]) {
      const pts = back && P.straps.back ? P.straps.back : P.straps.front;
      const c = Curve.through(pts.map((p) => [side * p[0], p[1]]));
      const { L, R } = tube(c, P.straps.w ?? 0.95, { n: 24 });
      pieces.push(clothPiece(M, { id: 'strap' + side, z: 12, d: polyD([...L, ...R.slice().reverse()]), bounds: c.bounds(), pad: 1, bevelCm: 0.2, bevelH: 0.25, edgeAo: 0.1, grid: 2 }));
    }
  }
  if (P.extraPieces) pieces.push(...P.extraPieces({ ...helpers, sleeveShapes, hemFull, neckCurve, bodyPiece }));
  const bounds = unionBounds(pieces.map((p) => p.bounds));
  return { pieces, bounds, field, hw, vh: hemV, hemV, ST, UA, neckCurve, hemCurve: hemFull, sleeveShapes, M, nk, outline, rng, back, hasPlacket: !!P.hasPlacket };
}

/** generic detail targets: collar / placket / shoulder / cuff for plain cloth, hem or neck for trimmed / printed pieces */
export function upperDetail(model, ctx, spec, rng) {
  const trimmed = spec.trim && spec.trim !== 'none';
  const patterned = spec.pattern && spec.pattern !== 'solid';
  const nk = model.nk, ST = model.ST, seed = spec.seed | 0;
  const T = {
    neck: { u: 1.6, v: nk.ys + 7.5, zoom: 2.9, cx: 0.52, cy: 0.5 },
    shoulder: { u: ST[0] * 0.58, v: ST[1] + 4.5, zoom: 2.6, cx: 0.5, cy: 0.5 },
    placket: { u: 0.6, v: nk.ys + 15, zoom: 2.7, cx: 0.5, cy: 0.5 },
    hem: { u: model.hw(model.hemV) * 0.34, v: model.hemV - 5.5, zoom: 2.5, cy: 0.55 },
    mid: { u: -3 + rng.range(-3, 3), v: model.hemV * 0.5, zoom: 2.4, cy: 0.5 },
  };
  const sl = model.sleeveShapes && model.sleeveShapes[1];
  if (sl) T.cuff = { u: sl.cuff.mid[0] - 1.5, v: sl.cuff.mid[1] - 4, zoom: 2.5, cx: 0.5, cy: 0.5 };
  let order;
  if (trimmed) order = ['hem', 'neck', model.hasPlacket ? 'placket' : 'hem'];
  else if (patterned) order = ['neck', 'mid', 'hem'];
  else order = model.hasPlacket ? ['placket', 'neck', sl ? 'cuff' : 'shoulder'] : ['neck', 'shoulder', sl ? 'cuff' : 'neck'];
  const pick = order[seed % order.length];
  return T[pick] || T.neck;
}
