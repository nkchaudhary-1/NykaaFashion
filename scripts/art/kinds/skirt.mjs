// Skirt: a-line / pleated / slip / tiered / pencil / wrap; mini / midi / maxi.
import { Curve, lerp, f, offsetPath, bandPath, unionBounds, clamp } from '../lib/geometry.mjs';
import { FoldField } from '../lib/folds.mjs';
import { mix, darken, lighten } from '../lib/color.mjs';
import { makeMaterial, clothPiece, hwTable, stitchLine, button } from '../lib/garment.mjs';
import { lowerPieces, waistbandPiece, lowerKindFactory, WAIST_Y } from '../lib/lower.mjs';
import { trimBand, tassels } from '../lib/trims.mjs';

const LEN = { mini: 40, midi: 74, maxi: 98 };
const HEM = {
  'a-line': { mini: 30, midi: 40, maxi: 50 }, pleated: { mini: 28, midi: 36, maxi: 44 }, slip: { mini: 23, midi: 26, maxi: 29 },
  tiered: { mini: 30, midi: 40, maxi: 47 }, pencil: { mini: 17, midi: 15.4, maxi: 15 }, wrap: { mini: 29, midi: 39, maxi: 47 },
};

export function buildSkirt(ctx, spec, shot) {
  const sty = HEM[spec.style] ? spec.style : 'a-line';
  const length = LEN[spec.length] ? spec.length : 'midi';
  const back = shot === 'alt';
  const M = makeMaterial(ctx, spec, { fabric: spec.fabric || (sty === 'slip' ? 'satin' : sty === 'pleated' ? 'chiffon' : 'cotton') });
  const rng = ctx.rng.fork('skirt-' + shot);
  const fabAmp = M.mat.foldAmp ?? 1, wr = M.mat.wrink ?? 0.5;
  const KV = spec.kids ? 0.6 : 1, KH = spec.kids ? 0.86 : 1;
  const wHw = 15.4 * KH, top = WAIST_Y;
  const hemY = WAIST_Y + LEN[length] * KV;
  const hemHw = HEM[sty][length] * KH;
  const drop = sty === 'pencil' ? 0.6 : sty === 'slip' ? 1.2 : sty === 'pleated' ? 2.2 : 3.4;
  const hc = hemY - drop;
  // side seam profile
  const side = [[wHw, top, 'c']];
  if (sty === 'pencil') side.push([lerp(wHw, 18.2, 0.55), top + 8], [18.6, top + 18], [lerp(18.6, hemHw, 0.5), lerp(top + 18, hc, 0.5)], [hemHw, hc - 0.8]);
  else if (sty === 'tiered') {
    const t1 = top + (hc - top) * 0.34, t2 = top + (hc - top) * 0.67;
    side.push([lerp(wHw, 21, 0.5), top + 8], [21.6, t1 - 0.6], [22.9, t1 + 0.6, 'c'], [lerp(23.2, hemHw * 0.78, 0.5), lerp(t1, t2, 0.6)], [hemHw * 0.78, t2 - 0.6], [hemHw * 0.78 + 1.5, t2 + 0.6, 'c'], [lerp(hemHw * 0.85, hemHw, 0.6), lerp(t2, hc, 0.6)], [hemHw, hc - 0.8]);
  } else {
    const flare = sty === 'slip' ? 1.1 : sty === 'pleated' ? 1.05 : 1.2;
    for (const t of [0.12, 0.3, 0.55, 0.8, 1]) side.push([lerp(wHw, hemHw, Math.pow(t, flare)), lerp(top, hc - 0.8, t)]);
  }
  // hem (right half): corner -> centre
  const wavy = sty === 'pleated' ? 0.9 : 0.5;
  const pleatN = 24;
  const field = new FoldField(rng.int(1, 1e6));
  const hwProv = hwTable(Curve.through([[-wHw, top, 'c'], ...side, [hemHw + 0.05, hc], [0, hemY], ...side.slice(1).reverse().map((p) => [-p[0], p[1], p[2]]).slice(0)], { closed: true }), { v0: 0, v1: hemY + 4 });
  field.dome({ hw: hwProv, v0: top, v1: hemY, amp: sty === 'pencil' ? 0.8 : 1.4, in: 4, out: 8, pow: 1.1 });
  if (sty === 'pleated') {
    // accordion pleats radiating from the waist: alternating ridges / valleys, crisp
    for (let i = 0; i < pleatN; i++) {
      const s = -0.96 + (1.92 * (i + 0.5)) / pleatN;
      const sg = i % 2 ? 1 : -1;
      field.ridge({ a: [s * wHw * 0.98, top + 4], b: [s * hwProv(hemY - 3) * 0.99, hemY - 1.5], s0: 0.55, s1: 0.5 + hemHw * 0.012, a0: 0.5 * sg, a1: (0.9 + 0.55 * (hemHw / 36)) * sg * fabAmp, p: 1.6, fade0: 0.08, fade1: 0.05, bow: rng.range(-0.15, 0.15) });
    }
  } else if (sty !== 'pencil') {
    const nf = sty === 'slip' ? 5 : sty === 'tiered' ? 7 : 8;
    for (let i = 0; i < nf; i++) {
      const s = -0.9 + (1.8 * (i + 0.5 + rng.range(-0.3, 0.3))) / nf;
      const sg = rng.chance(0.55) ? (i % 2 ? 1 : -1) : (i % 2 ? -1 : 1);
      field.ridge({ a: [s * wHw * 0.7, top + 6], b: [s * hwProv(hemY - 3) * 0.95 + rng.range(-1, 1), hemY - 1.5], s0: Math.max(0.9, wHw * 0.7 * 2 / nf * 0.26), s1: Math.max(1.5, hemHw * 1.9 / nf * 0.22) * rng.range(0.8, 1.3), a0: 0.05 * sg, a1: (sty === 'slip' ? 1.6 : 2.2) * rng.range(0.55, 1.2) * sg * fabAmp, bow: rng.range(-1.4, 1.4), fade0: rng.range(0.25, 0.45), fade1: 0.1, wob: rng.range(0.2, 0.7), wobF: rng.range(0.8, 1.6), ph: rng.range(0, 6.28) });
    }
  } else {
    for (const sx of [-1, 1]) field.blob({ u: sx * 9, v: top + 12, ru: 7, rv: 8, amp: 0.5 * fabAmp });
    for (const v of [top + 12, top + 17]) field.band({ v, w: 1.5, amp: 0.13 * fabAmp });
  }
  if (sty === 'tiered') for (const v of [top + (hc - top) * 0.34 + 0.4, top + (hc - top) * 0.67 + 0.5]) field.band({ v, w: 1.0, amp: -0.45 });
  field.noise({ amp: 0.14 * wr, fu: 0.2, fv: 0.06, oct: 3 });
  field.noise({ amp: 0.06 * wr, fu: 0.5, fv: 0.4, oct: 2 });
  const hemPts = [[hemHw + 0.05, hc], [hemHw * 0.955, hc + drop * 0.1], [hemHw * 0.74, hc + drop * 0.42], [hemHw * 0.42, hc + drop * 0.8], [0, hemY]].map((p, i, a) => (i === 0 || i === a.length - 1 ? p : [p[0], p[1] + wavy * field.h(p[0], p[1])]));
  const right = [...side, ...hemPts];
  const outline = Curve.through([[-wHw, top, 'c'], ...right, ...right.slice(1, -1).reverse().map((p) => [-p[0], p[1], p[2]])], { closed: true });
  const hw = hwTable(outline, { v0: 0, v1: hemY + 4 });

  // ---- details
  let inner = '', defs = '';
  const trim = spec.trim && spec.trim !== 'none' ? spec.trim : null;
  const c2 = spec.color2 || mix(spec.color, '#000', 0.25);
  const rightHem = hemPts.map((p) => [p[0], p[1]]);
  const hemFull = Curve.through([...rightHem.slice(1).reverse().map((p) => [-p[0], p[1]]), ...rightHem]);
  if (trim && ['contrast-border', 'gota', 'zari-border', 'lace'].includes(trim)) {
    const wd = { 'contrast-border': 2.4, gota: 2.0, 'zari-border': 3.6, lace: 3.0 }[trim];
    const tb = trimBand(trim, hemFull, { o0: -wd - 0.5, o1: -0.5, color: spec.color, color2: c2, n: 120 }); inner += tb.inner; defs += tb.defs;
  } else inner += stitchLine(hemFull, -1.0, { color: '#000', op: 0.18, w: 0.06 });
  if (sty === 'tiered') for (const v of [top + (hc - top) * 0.34, top + (hc - top) * 0.67]) inner += `<path d="M${f(-hw(v) - 1)} ${f(v)}Q0 ${f(v + 1.1)} ${f(hw(v) + 1)} ${f(v)}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width=".14"/><path d="M${f(-hw(v) - 1)} ${f(v + 0.35)}Q0 ${f(v + 1.45)} ${f(hw(v) + 1)} ${f(v + 0.35)}" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width=".1"/>`;
  if (sty === 'wrap') {
    // overlapping panel: diagonal edge from the waist (right) to the hem (left of centre), with a stitched edge
    const d = `M${f(wHw * 0.55)} ${f(top + 3.6)}Q${f(2)} ${f(top + 26)} ${f(-hw(hemY) * 0.34)} ${f(hc + 1)}`;
    inner += `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width=".18"/><path d="${d}" transform="translate(.3 0)" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width=".12"/><path d="${d}" transform="translate(-.55 0)" fill="none" stroke="#000" stroke-opacity=".2" stroke-width=".07" stroke-dasharray=".3 .22"/>`;
  }
  if (back) {
    inner += `<path d="M0 ${f(top + 3.6)}V${f(top + 18)}" stroke="#000" stroke-opacity=".3" stroke-width=".4"/><path d="M0 ${f(top + 3.6)}V${f(top + 18)}" stroke="#b9b3a7" stroke-opacity=".9" stroke-width=".26" stroke-dasharray=".14 .1"/>`;
    if (sty === 'pencil') inner += `<path d="M0 ${f(hemY - 20)}V${f(hemY - 0.5)}" stroke="#000" stroke-opacity=".45" stroke-width=".18"/>`;
  }
  const wb = waistbandPiece(M, { hw: wHw + 0.1, h: 3.8, loops: [], stitch: true, trimInner: !back ? `<rect x="-1.1" y="${f(WAIST_Y + 1.3)}" width="2.2" height="1.2" rx=".3" fill="${mix(spec.color, '#111', 0.35)}" stroke="#000" stroke-opacity=".3" stroke-width=".06"/>` : '' });
  const overlay = !back ? button(0, WAIST_Y + 1.9, 0.7, mix(spec.color, '#111', 0.3), { holes: 4 }) : '';
  const bodyPiece = { inner, defs };
  const extra = [wb];
  const parts = lowerPieces(ctx, spec, shot, M, { outline, hwFn: hw, field, waistHw: wHw, bodyInner: bodyPiece, overlay, extraPieces: extra });
  if (trim === 'tassel') {
    parts.find((p) => p.id === 'body').overlay = (parts.find((p) => p.id === 'body').overlay || '') + tassels(hemFull, { count: Math.round(hemHw / 3.4), color: c2, u0: 0.04, u1: 0.96, rng: rng.fork('tass') });
    parts.push({ id: 'tb', z: -1, d: 'M0 0', bounds: { x0: -hemHw, y0: hemY, x1: hemHw, y1: hemY + 6 }, fill: '#000', inner: '', defs: '', mat: M.mat, noCast: true });
  }
  return { pieces: parts, bounds: unionBounds(parts.map((p) => p.bounds)), field, hw, hemY, top, wHw, M, sty };
}

export default lowerKindFactory(buildSkirt, (model, ctx, spec, rng) => {
  const trimmed = spec.trim && spec.trim !== 'none';
  const w = (spec.seed | 0) % 3;
  if (trimmed || w === 0) return { u: model.hw(model.hemY) * 0.3, v: model.hemY - 6, zoom: 2.5, cy: 0.55 };
  if (w === 1) return { u: 4, v: WAIST_Y + 12, zoom: 3.0, cy: 0.45 };
  return { u: -4, v: lerp(WAIST_Y, model.hemY, 0.55), zoom: 2.4 };
});
