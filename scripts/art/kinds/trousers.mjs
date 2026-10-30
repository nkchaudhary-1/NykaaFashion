// Trousers: straight / wide / tapered / flared / palazzo / jogger / cargo; ankle / full / crop. Jeans = fabric "denim".
import { Curve, mirrorOutline, lerp, f, offsetPath, bandPath, unionBounds } from '../lib/geometry.mjs';
import { FoldField } from '../lib/folds.mjs';
import { mix, darken, lighten } from '../lib/color.mjs';
import { makeMaterial, clothPiece, hwTable, stitchLine, button } from '../lib/garment.mjs';
import { lowerPieces, waistbandPiece, lowerKindFactory, WAIST_Y } from '../lib/lower.mjs';
import { ribDefs } from '../lib/upper.mjs';
import { trimBand } from '../lib/trims.mjs';

const LEG = {
  straight: { hem: 19, knee: 21, xc: 10.4 }, wide: { hem: 28, knee: 25, xc: 14 }, tapered: { hem: 14.5, knee: 20, xc: 9.6 },
  flared: { hem: 30, knee: 20, xc: 12.4 }, palazzo: { hem: 38, knee: 30, xc: 19 }, jogger: { hem: 13.5, knee: 21.5, xc: 10.0 }, cargo: { hem: 20, knee: 23, xc: 10.8 },
};
const LENGTH = { crop: 88, ankle: 99, full: 108 };

export function buildTrousers(ctx, spec, shot) {
  const sty = LEG[spec.leg] ? spec.leg : 'straight';
  const kids = !!spec.kids, KV = kids ? 0.62 : 1, KH = kids ? 0.84 : 1;
  const L = kids ? { hem: LEG[sty].hem * KH, knee: LEG[sty].knee * KH, xc: LEG[sty].xc * KH } : LEG[sty];
  const total = (LENGTH[spec.length] || LENGTH.ankle) * KV;
  const denim = spec.fabric === 'denim';
  const M = makeMaterial(ctx, spec, { fabric: denim ? 'denim' : spec.fabric || 'cotton' });
  const rng = ctx.rng.fork('trousers-' + shot);
  const men = spec.gender === 'men';
  const wHw = (men ? 18.4 : 16.6) * KH, hipHw = (men ? 21.2 : 20.8) * KH;
  const top = WAIST_Y + 4.2; // below the waistband
  const hemY = WAIST_Y + total;
  const crotchY = WAIST_Y + 31 * (kids ? 0.74 : 1);
  const fabAmp = M.mat.foldAmp ?? 1, wr = M.mat.wrink ?? 0.5;
  const kneeY = lerp(crotchY, hemY, 0.5);
  const hemOut = L.xc + L.hem / 2, hemIn = Math.max(0.4, L.xc - L.hem / 2);
  const kneeOut = L.xc + L.knee / 2 + (sty === 'flared' ? 0.5 : 0), kneeIn = Math.max(0.6, L.xc - L.knee / 2 + (sty === 'palazzo' ? 0 : 0.4));
  const pleats = !!spec.pleats;
  // full outline, clockwise from the waist-left: waist, right outer seam, hem, inner seam to crotch, left side mirrored
  const R = [[wHw, WAIST_Y, 'c'], [wHw + 1.8, WAIST_Y + 9 * KV], [hipHw, WAIST_Y + 20 * KV], [lerp(hipHw, kneeOut, 0.25), WAIST_Y + 34 * KV], [kneeOut, kneeY], [lerp(kneeOut, hemOut, 0.5), lerp(kneeY, hemY, 0.55)], [hemOut, hemY - 0.8, 'c']];
  const Hh = [[hemOut - 0.4, hemY], [lerp(hemOut, hemIn, 0.5), hemY + 0.5], [hemIn + 0.4, hemY - 0.1], [hemIn, hemY - 0.8, 'c']];
  const Ri = [[lerp(kneeIn, hemIn, 0.5), lerp(kneeY, hemY, 0.55)], [kneeIn, kneeY], [lerp(kneeIn, 1.1, 0.4), lerp(crotchY, kneeY, 0.45)], [0.6, crotchY + 2.4], [0, crotchY, 'c']];
  const right = [...R, ...Hh, ...Ri];
  const mirrored = right.slice(0, -1).reverse().map((p) => [-p[0], p[1], p[2]]);
  // closed: waist-left -> waist-right -> ... -> crotch -> ... -> waist-left
  const leftPts = right.slice(0, -1).reverse().map((p) => [-p[0], p[1], p[2]]);
  const outline = Curve.through([[-wHw, WAIST_Y, 'c'], ...right, ...leftPts], { closed: true });
  const hw = hwTable(Curve.through([...right.map((p) => [p[0], p[1], p[2]]), ...leftPts.slice(0)].length ? [[-wHw, WAIST_Y, 'c'], ...right, ...leftPts] : right, { closed: true }), { v0: 0, v1: hemY + 4 });

  // drape: each leg gets its own folds + knee/ankle creases
  const field = new FoldField(rng.int(1, 1e6));
  for (const sx of [-1, 1]) {
    const cx = sx * lerp(L.xc, 12, 0.3);
    field.curveRidge({ curve: Curve.through([[sx * 12, top + 8], [sx * lerp(L.xc, 12, 0.5), kneeY], [sx * L.xc, hemY]]), type: 'gauss', s: (u) => lerp(7, L.hem * 0.4, u), a: () => 1.5 * fabAmp, fade0: 0.06, fade1: 0.06 });
    for (let i = 0; i < 3; i++) {
      const o = (i - 1) * (L.knee * 0.26) + rng.range(-1.2, 1.2), sg = rng.chance(0.5) ? 1 : -1;
      field.ridge({ a: [sx * L.xc + o + sx * 1.5, top + 18], b: [sx * L.xc + o * 1.2 + sx * 0.5, hemY - 2], s0: 1.2, s1: 1.7, a0: 0.05 * sg, a1: rng.range(0.6, 1.5) * sg * fabAmp * (sty === 'palazzo' || sty === 'wide' || sty === 'flared' ? 1.5 : 1), bow: rng.range(-1, 1), fade0: 0.35, fade1: 0.1, wob: 0.3 });
    }
    // knee & thigh creases (horizontal pulls)
    field.band({ v: kneeY + 1, w: 1.4, amp: 0.1 * fabAmp, u0: sx > 0 ? 0 : -50, u1: sx > 0 ? 50 : 0 });
    field.band({ v: crotchY - 3, w: 1.2, amp: -0.1 * fabAmp, u0: sx > 0 ? 0 : -50, u1: sx > 0 ? 50 : 0 });
    // ankle stack for long trousers on narrow legs
    if (sty !== 'wide' && sty !== 'palazzo') field.band({ v: hemY - 4.5, w: 1.3, amp: 0.14 * fabAmp, u0: sx > 0 ? 0 : -50, u1: sx > 0 ? 50 : 0 });
    if (spec.ruched) for (let q = 1; q <= 5; q++) field.band({ v: hemY - 4.5 - q * 2.1, w: 0.8, amp: 0.34 * fabAmp, u0: sx > 0 ? 0 : -50, u1: sx > 0 ? 50 : 0 });
  }
  if (pleats) for (const sx of [-1, 1]) field.ridge({ a: [sx * 6.4, top + 1], b: [sx * (L.xc - 1), kneeY + 6], s0: 0.8, s1: 1.4, a0: 1.0, a1: 0.55, fade0: 0.05, fade1: 0.4 });
  field.noise({ amp: 0.14 * wr, fu: 0.22, fv: 0.07, oct: 3 });
  field.noise({ amp: 0.07 * wr, fu: 0.55, fv: 0.4, oct: 2 });

  // ---- details
  const orange = '#C9803A';
  const stitchC = denim ? orange : '#000', stitchOp = denim ? 0.95 : 0.2;
  const sdash = (d) => `<path d="${d}" fill="none" stroke="${stitchC}" stroke-opacity="${stitchOp}" stroke-width="${denim ? 0.14 : 0.07}" stroke-dasharray="${denim ? '.5 .26' : '.32 .22'}"/>`;
  let inner = '';
  const back = shot === 'alt';
  if (!back) {
    // fly + crotch stitch
    inner += `<path d="M0 ${f(top)}V${f(top + 12.5)}Q0 ${f(top + 16)} 2.6 ${f(top + 15.4)}" fill="none" stroke="#000" stroke-opacity=".42" stroke-width=".14"/>` + sdash(`M-.7 ${f(top)}V${f(top + 12.4)}Q-.5 ${f(top + 15.4)} 2.0 ${f(top + 14.9)}`);
    inner += `<path d="M0 ${f(top + 13)}L0 ${f(crotchY)}" stroke="#000" stroke-opacity=".3" stroke-width=".12"/>`;
    // front pockets: slanted from the waist to the side seam
    for (const sx of [-1, 1]) {
      const d = `M${f(sx * (wHw - 1.2))} ${f(top)}Q${f(sx * (wHw + 1.2))} ${f(top + 6)} ${f(sx * (hipHw - 0.2))} ${f(top + 12.8)}`;
      inner += `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".42" stroke-width=".16"/>` + `<path d="${d}" transform="translate(${sx * -0.35} 0.05)" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width=".1"/>` + sdash(d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, a, b) => `${(+a - sx * 0.7).toFixed(2)} ${(+b + 0.1).toFixed(2)}`));
    }
    if (denim) {
      for (const sx of [-1, 1]) inner += `<path d="M${f(sx * 8.2)} ${f(top + 12.4)}Q${f(sx * 5.8)} ${f(top + 12.7)} ${f(sx * 4.4)} ${f(top + 8)}" fill="none" stroke="${orange}" stroke-width=".13" stroke-dasharray=".4 .22"/>`;
    }
    if (sty === 'cargo') {
      for (const sx of [-1, 1]) {
        const u = sx * (L.xc + 3.2), v = kneeY - 9;
        inner += `<path d="M${f(u - 5.4)} ${f(v)}H${f(u + 5.4)}V${f(v + 12)}H${f(u - 5.4)}Z" fill="#000" fill-opacity=".14" transform="translate(.15 .35)"/>` +
          `<path d="M${f(u - 5.4)} ${f(v)}H${f(u + 5.4)}V${f(v + 12)}H${f(u - 5.4)}Z" fill="${M.base}"/>` + (M.pat.fill ? `<path d="M${f(u - 5.4)} ${f(v)}H${f(u + 5.4)}V${f(v + 12)}H${f(u - 5.4)}Z" fill="${M.pat.fill}"/>` : '') +
          `<path d="M${f(u - 5.4)} ${f(v)}H${f(u + 5.4)}V${f(v + 12)}H${f(u - 5.4)}Z" fill="none" stroke="#000" stroke-opacity=".4" stroke-width=".12"/>` +
          `<path d="M${f(u - 5.5)} ${f(v)}H${f(u + 5.5)}V${f(v + 4.6)}H${f(u - 5.5)}Z" fill="${M.base}" stroke="#000" stroke-opacity=".45" stroke-width=".14"/>` + (M.pat.fill ? `<path d="M${f(u - 5.5)} ${f(v)}H${f(u + 5.5)}V${f(v + 4.6)}H${f(u - 5.5)}Z" fill="${M.pat.fill}"/>` : '') +
          `<path d="M${f(u - 5)} ${f(v + 4.1)}H${f(u + 5)}" stroke="#000" stroke-opacity=".22" stroke-width=".06" stroke-dasharray=".3 .2"/>`;
      }
    }
    if (pleats) for (const sx of [-1, 1]) inner += `<path d="M${f(sx * 6.4)} ${f(top + 1)}Q${f(sx * 6.8)} ${f(top + 14)} ${f(sx * (L.xc - 1))} ${f(kneeY + 5)}" fill="none" stroke="#000" stroke-opacity=".24" stroke-width=".12"/>`;
    // inseam hint on inner legs
    for (const sx of [-1, 1]) inner += `<path d="M${f(sx * 0.9)} ${f(crotchY + 3)}Q${f(sx * L.xc * 0.2)} ${f(kneeY)} ${f(sx * hemIn)} ${f(hemY - 1.2)}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width=".1"/>`;
  } else {
    // back: seat seam, yoke, patch pockets
    inner += `<path d="M0 ${f(top)}V${f(crotchY + 2)}" stroke="#000" stroke-opacity=".28" stroke-width=".13"/>` + sdash(`M-.6 ${f(top)}V${f(crotchY)}`);
    for (const sx of [-1, 1]) {
      const u = sx * 9.2, v = top + 6;
      const d = `M${f(u - 4.6)} ${f(v)}H${f(u + 4.6)}V${f(v + 8)}L${f(u)} ${f(v + 10)}L${f(u - 4.6)} ${f(v + 8)}Z`;
      inner += `<path d="${d}" fill="#000" fill-opacity=".16" transform="translate(.12 .3)"/><path d="${d}" fill="${M.base}"/>` + (M.pat.fill ? `<path d="${d}" fill="${M.pat.fill}"/>` : '') + `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width=".12"/>` + sdash(d.replace(/H|V|L|M|Z/g, (m) => m));
      inner += `<path d="M${f(u - 4.2)} ${f(v + 0.7)}H${f(u + 4.2)}" stroke="${stitchC}" stroke-opacity="${stitchOp}" stroke-width="${denim ? 0.12 : 0.06}" stroke-dasharray=".4 .22"/>`;
    }
    if (sty === 'cargo') for (const sx of [-1, 1]) inner += `<path d="M${f(sx * (L.xc + 6.4))} ${f(kneeY - 8)}V${f(kneeY + 4)}" stroke="#000" stroke-opacity=".2" stroke-width=".1"/>`;
  }
  // hem details
  if (sty === 'jogger') {
    const defs = ribDefs('rib4', mix(spec.color, '#000', 0.05));
    for (const sx of [-1, 1]) {
      const x0 = sx > 0 ? hemIn : -hemOut, x1 = sx > 0 ? hemOut : -hemIn;
      inner += `<path d="M${f(x0 - 0.5)} ${f(hemY - 5.4)}H${f(x1 + 0.5)}V${f(hemY + 1)}H${f(x0 - 0.5)}Z" fill="url(#rib4)"/><path d="M${f(x0)} ${f(hemY - 5.4)}H${f(x1)}" stroke="#000" stroke-opacity=".3" stroke-width=".1"/>`;
    }
    var jDefs = defs;
  } else for (const sx of [-1, 1]) inner += `<path d="M${f(sx * (hemIn + 0.2))} ${f(hemY - 3.0)}H${f(sx * (hemOut - 0.2))}" stroke="${stitchC}" stroke-opacity="${stitchOp * 0.9}" stroke-width="${denim ? 0.13 : 0.06}" stroke-dasharray=".4 .24"/>`;
  const bodyInner = { inner, defs: jDefs || '' };

  // waistband + belt loops (+ jogger drawcord)
  const loops = [-wHw + 2, -9.5, -3.6 * 0, 9.5, wHw - 2].filter((x) => Math.abs(x) > 0.1 || back);
  const wbTrim = sty === 'jogger' ? `<path d="M-1.6 ${f(WAIST_Y + 2.4)}q-.8 5 -.5 8M1.6 ${f(WAIST_Y + 2.4)}q.8 5 .5 8" fill="none" stroke="${mix(spec.color, '#e8e0d0', 0.5)}" stroke-width=".26" stroke-linecap="round"/>` : (!back ? `<rect x="-1.1" y="${f(WAIST_Y + 1.5)}" width="2.2" height="1.2" rx=".3" fill="${denim ? '#b88a44' : mix(spec.color, '#111', 0.35)}" stroke="#000" stroke-opacity=".3" stroke-width=".06"/>` : '');
  const wb = waistbandPiece(M, { hw: wHw + 0.1, loops: sty === 'jogger' ? [] : loops, trimInner: wbTrim, stitch: true });
  const extra = [wb];
  const overlay = (!back && sty !== 'jogger' ? button(0, WAIST_Y + 2.1, 0.75, denim ? '#b88a44' : mix(spec.color, '#111', 0.3), { holes: 4 }) : '');
  const parts = lowerPieces(ctx, spec, shot, M, { outline, hwFn: hw, field, waistHw: wHw, bodyInner, overlay, extraPieces: extra });
  return { pieces: parts, bounds: unionBounds(parts.map((p) => p.bounds)), field, hw, hemY, kneeY, crotchY, wHw, M, L };
}

export default lowerKindFactory(buildTrousers, (model, ctx, spec, rng) => {
  const patterned = spec.pattern && spec.pattern !== 'solid';
  const w = (spec.seed | 0) % 3;
  if (patterned && w !== 0) return { u: model.L.xc * 0.6, v: model.kneeY - 4, zoom: 2.3 };
  if (w === 1) return { u: 6, v: WAIST_Y + 9, zoom: 2.9, cx: 0.5, cy: 0.45 };
  return { u: 5, v: WAIST_Y + 6, zoom: 3.0, cx: 0.5, cy: 0.45 };
});
