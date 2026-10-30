// Lower-body garments (trousers, skirts) hung from a clip hanger by the waistband.
import { Curve, mirrorOutline, bandPath, offsetPath, polyD, lerp, clamp, smoothstep, f, boundsOfPts, unionBounds } from './geometry.mjs';
import { FoldField } from './folds.mjs';
import { mix, darken, lighten } from './color.mjs';
import { clipHangerPieces, pickHangerTone } from './hanger.mjs';
import { makeMaterial, clothPiece, hwTable, stitchLine, button } from './garment.mjs';
import { trimBand, tassels } from './trims.mjs';
import { ribDefs } from './upper.mjs';

export const WAIST_Y = 4.3; // top of the waistband (cm below the hanger apex)

/**
 * P = {
 *   outline: closed Curve (full) in cm, bounds,
 *   hwFn, hemV, field (FoldField), waistH (cm), waistHw,
 *   inner(): {inner, defs}, overlay(): string, extraPieces(): [...],
 * }
 */
export function lowerPieces(ctx, spec, shot, M, P) {
  const pieces = [];
  const tone = pickHangerTone(ctx, spec.color);
  pieces.push(...clipHangerPieces(ctx, { halfW: Math.max(15, P.waistHw - 1), tone, barY: WAIST_Y - 1.2, clipX: Math.min(12.5, P.waistHw - 4) }));
  // body
  const bodyPiece = clothPiece(M, { id: 'body', z: 10, d: P.outline.d(), bounds: P.outline.bounds(), field: P.field, inner: P.bodyInner?.inner || '', defs: P.bodyInner?.defs || '', bevelCm: 0.3, bevelH: 0.3, patTransform: undefined });
  if (P.overlay) bodyPiece.overlay = P.overlay;
  pieces.push(bodyPiece);
  if (P.extraPieces) pieces.push(...P.extraPieces);
  return pieces;
}

/** waistband strip (separate piece) with belt loops, shaped by a curve across the top */
export function waistbandPiece(M, { hw, h = 4.2, y0 = WAIST_Y, loops = [], color, trimInner = '', stitch = true, closure = 'button', back = false, elastic = false }) {
  const x = hw;
  const d = `M${f(-x)} ${f(y0)}H${f(x)}V${f(y0 + h)}H${f(-x)}Z`;
  let inner = '';
  if (stitch) inner += `<path d="M${f(-x)} ${f(y0 + 0.5)}H${f(x)}M${f(-x)} ${f(y0 + h - 0.5)}H${f(x)}" stroke="#000" stroke-opacity=".22" stroke-width=".07" stroke-dasharray=".32 .22"/>`;
  inner += `<path d="M${f(-x)} ${f(y0 + h)}H${f(x)}" stroke="#000" stroke-opacity=".34" stroke-width=".14"/>` + `<path d="M${f(-x)} ${f(y0 + h + 0.2)}H${f(x)}" stroke="#fff" stroke-opacity=".12" stroke-width=".1"/>`;
  for (const lx of loops) inner += `<rect x="${f(lx - 0.5)}" y="${f(y0 - 0.35)}" width="1.0" height="${f(h + 1.9)}" fill="${M.base}" stroke="#000" stroke-opacity=".38" stroke-width=".08"/>` + `<rect x="${f(lx - 0.5)}" y="${f(y0 - 0.35)}" width="1.0" height="${f(h + 1.9)}" fill="#000" fill-opacity=".05"/>`;
  inner += trimInner;
  return clothPiece(M, { id: 'waistband', z: 14, d, bounds: { x0: -x, y0, x1: x, y1: y0 + h }, inner, bevelCm: 0.2, bevelH: 0.28, edgeAo: 0.12, grid: 2, color, contact: { dx: 0.1, dy: 0.4, sigma: 0.35, strength: 0.34 }, noCast: false });
}

export function lowerKindFactory(buildFn, detailFn) {
  return {
    async front(ctx, spec) { return run(ctx, spec, 'front', buildFn, 0); },
    async alt(ctx, spec) { return run(ctx, spec, 'alt', buildFn, 3); },
    async detail(ctx, spec) {
      const model = buildFn(ctx, spec, 'front');
      const rng = ctx.rng.fork('detail');
      const t = detailFn(model, ctx, spec, rng);
      ctx.focusCamera(t.u, t.v, ctx.u * 9.5 * t.zoom, { rot: t.rot ?? rng.range(-0.05, 0.05), cx: t.cx ?? 0.5, cy: t.cy ?? 0.5 });
      await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.05 }, leaves: false });
      await (await import('./garment.mjs')).renderGarment(ctx, model, { wall: { dx: 1.2, dy: 1.6, sigma: 1.1 } });
      ctx.setDof(t.dof || { axis: 'diag', dx: 0.6, dy: 0.8, focus: 0.62, band: 0.14, falloff: 0.4, sigma: 6.5 });
    },
  };
}
async function run(ctx, spec, shot, buildFn, so) {
  const model = buildFn(ctx, spec, shot);
  ctx.fitCamera(model.bounds, { mx: 0.1, top: 0.06, bottom: 0.08, kmax: 10.5, ...(model.camera || {}) });
  await ctx.backdrop({ mode: 'wall', seedOffset: so });
  await (await import('./garment.mjs')).renderGarment(ctx, model);
}
