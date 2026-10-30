// Wooden hanger + wire hook + wall peg (and a clip hanger for skirts/trousers). Returns "solid" pieces in cm space.
import { Curve, mirrorOutline, tube, polyD, ellipseD, f } from './geometry.mjs';
import { mix, darken, lighten, luma } from './color.mjs';
import { FoldField } from './folds.mjs';

export const HANGER_TONES = {
  beech: '#C79E72', walnut: '#6B4A35', ash: '#D9C3A1', black: '#2B2724', white: '#E8E1D4', brass: '#B88A44',
};

/** pick a hanger tone that contrasts with the backdrop and the garment */
export function pickHangerTone(ctx, garmentColor) {
  const L = luma(ctx.bg);
  const gl = garmentColor ? luma(garmentColor) : 0.5;
  if (ctx.spec.hanger && HANGER_TONES[ctx.spec.hanger]) return HANGER_TONES[ctx.spec.hanger];
  if (L < 0.3) return HANGER_TONES.ash;
  const r = ctx.rng.fork('hanger').next();
  if (gl > 0.72) return r < 0.5 ? HANGER_TONES.walnut : HANGER_TONES.beech;
  return r < 0.55 ? HANGER_TONES.beech : r < 0.8 ? HANGER_TONES.ash : HANGER_TONES.walnut;
}

/**
 * Hanger centred on x=0, apex at y=0. halfW: half-length of the arms (cm); drop: arm slope drop at the tips.
 * Returns pieces: peg (z0), hook (z1), arms (z6).
 */
export function hangerPieces(ctx, { halfW = 18.4, drop = 5.4, tone = HANGER_TONES.beech, pegTone = null, hookTone = '#8E8A84', z = 6, showPeg = true } = {}) {
  const pieces = [];
  const th = 1.9;
  // arms: arched bar, thick at the centre, tapering to rounded tips
  const half = [[0, -0.35], [halfW * 0.2, drop * 0.2 - 0.3], [halfW * 0.5, drop * 0.55 - 0.2], [halfW * 0.82, drop * 0.88], [halfW + 0.35, drop + 0.5, 'c'],
    [halfW + 0.2, drop + 1.35, 'c'], [halfW * 0.82, drop * 0.88 + 1.55], [halfW * 0.5, drop * 0.55 + 1.7], [halfW * 0.2, drop * 0.2 + 1.85], [0, th]];
  const arms = mirrorOutline(half);
  const ab = arms.bounds();
  pieces.push({
    id: 'hanger', z, d: arms.d(), bounds: ab, fill: tone, inner: '', defs: '',
    mat: { amb: 0.38, wrap: 0.2, spec: 0.28, shin: 22, rim: 0, tex: { type: 'wood', amp: 0.08, bump: 0.02 } },
    bevelCm: 0.42, bevelH: 0.5, edgeAo: 0.1, texSwap: true, contact: { dx: 0.2, dy: 0.3, sigma: 0.3, strength: 0.3 }, hanger: true,
  });
  // hook wire: stem up to the peg, small curl over it
  const rail = !!ctx.rail; // scene hung from a rail: straight wire up to the rod, no wall peg
  if (rail) showPeg = false;
  const hookC = rail ? Curve.through([[0, 0.6], [0, -2.8], [0.02, -5.2], [0.28, -6.5], [0.9, -6.95]])
    : Curve.through([[0, 0.6], [0, -2.6], [0.05, -4.6], [0.9, -6.5], [2.4, -7.2], [3.5, -6.2], [3.4, -4.6]]);
  const { L, R } = tube(hookC, rail ? 0.5 : 0.34, { n: 40 });
  pieces.push({
    id: 'hook', z: 1, d: polyD([...L, ...R.slice().reverse()]), bounds: hookC.bounds(), pad: 1.5, fill: hookTone, inner: '', defs: '',
    mat: { amb: 0.3, wrap: 0.1, spec: 0.9, shin: 40, metal: 0.8, tex: { type: 'none', amp: 0, bump: 0 } },
    bevelCm: 0.12, bevelH: 0.3, edgeAo: 0.0, contact: { dx: 0.2, dy: 0.3, sigma: 0.25, strength: 0.25 },
  });
  if (showPeg) {
    const pc = pegTone || mix(tone, '#d9c9b0', 0.35);
    pieces.push({
      id: 'peg', z: 2, d: ellipseD(1.6, -4.7, 1.45, 1.45), bounds: { x0: 0, y0: -6.4, x1: 3.3, y1: -3 }, pad: 1.5, fill: pc, inner: '', defs: '',
      mat: { amb: 0.32, wrap: 0.15, spec: 0.5, shin: 26, tex: { type: 'wood', amp: 0.05, bump: 0 } },
      bevelCm: 0.95, bevelH: 1.1, edgeAo: 0.0, contact: { dx: 0.5, dy: 0.7, sigma: 0.5, strength: 0.4 },
    });
  }
  return pieces;
}

/** Skirt / trouser hanger: wooden bar with two spring clips. Apex of the hook at y=0. */
export function clipHangerPieces(ctx, { halfW = 17, tone = HANGER_TONES.beech, hookTone = '#8E8A84', barY = 3.2, clipX = 11.5 } = {}) {
  const pieces = [];
  const bar = mirrorOutline([[0, barY - 0.55], [halfW * 0.5, barY - 0.45], [halfW, barY - 0.5, 'c'], [halfW + 0.2, barY + 0.25], [halfW, barY + 1.0, 'c'], [halfW * 0.5, barY + 1.05], [0, barY + 1.1]]);
  pieces.push({
    id: 'hanger', z: 6, d: bar.d(), bounds: bar.bounds(), fill: tone, inner: '', defs: '',
    mat: { amb: 0.38, wrap: 0.2, spec: 0.28, shin: 22, tex: { type: 'wood', amp: 0.08, bump: 0.02 } },
    bevelCm: 0.35, bevelH: 0.45, edgeAo: 0.1, texSwap: true, contact: { dx: 0.2, dy: 0.3, sigma: 0.3, strength: 0.3 },
  });
  const rail = !!ctx.rail;
  const hookC = rail ? Curve.through([[0, barY - 0.2], [0, -2.4], [0.02, -4.4], [0.28, -5.7], [0.9, -6.15]])
    : Curve.through([[0, barY - 0.2], [0, -2.0], [0.05, -4.0], [0.9, -5.9], [2.4, -6.6], [3.5, -5.6], [3.4, -4.0]]);
  const { L, R } = tube(hookC, rail ? 0.5 : 0.34, { n: 40 });
  pieces.push({
    id: 'hook', z: 1, d: polyD([...L, ...R.slice().reverse()]), bounds: hookC.bounds(), pad: 1.5, fill: hookTone, inner: '', defs: '',
    mat: { amb: 0.3, wrap: 0.1, spec: 0.9, shin: 40, metal: 0.8, tex: { type: 'none', amp: 0, bump: 0 } },
    bevelCm: 0.12, bevelH: 0.3, edgeAo: 0, contact: { dx: 0.2, dy: 0.3, sigma: 0.25, strength: 0.25 },
  });
  if (!rail) pieces.push({
    id: 'peg', z: 2, d: ellipseD(1.6, -4.0, 1.45, 1.45), bounds: { x0: 0, y0: -5.7, x1: 3.3, y1: -2.3 }, pad: 1.5, fill: mix(tone, '#d9c9b0', 0.35), inner: '', defs: '',
    mat: { amb: 0.32, wrap: 0.15, spec: 0.5, shin: 26, tex: { type: 'wood', amp: 0.05, bump: 0 } },
    bevelCm: 0.95, bevelH: 1.1, edgeAo: 0, contact: { dx: 0.5, dy: 0.7, sigma: 0.5, strength: 0.4 },
  });
  // clips (drawn in front of the cloth, z high)
  for (const sx of [-1, 1]) {
    const cx = sx * clipX;
    const jaw = `M${f(cx - 1.5)} ${f(barY + 0.9)}L${f(cx + 1.5)} ${f(barY + 0.9)}L${f(cx + 1.25)} ${f(barY + 4.6)}L${f(cx - 1.25)} ${f(barY + 4.6)}Z`;
    pieces.push({
      id: 'clip' + sx, z: 30, d: jaw, bounds: { x0: cx - 2, y0: barY, x1: cx + 2, y1: barY + 5 }, fill: '#9A9791', inner: '', defs: '',
      mat: { amb: 0.3, wrap: 0.1, spec: 0.8, shin: 36, metal: 0.75, tex: { type: 'none', amp: 0, bump: 0 } },
      bevelCm: 0.3, bevelH: 0.5, edgeAo: 0, contact: { dx: 0.2, dy: 0.3, sigma: 0.3, strength: 0.3 },
    });
  }
  return pieces;
}
