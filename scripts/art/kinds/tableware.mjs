// Bowl (bowl / mug) and candle (glass | ceramic | tin | pillar) on a table, built on the vase surface-of-revolution renderer.
import { mix, darken } from '../lib/color.mjs';
import { fitObject } from '../lib/object.mjs';
import { drawVase } from './vase.mjs';

const BOWL_SHAPE = { bowl: 'bowl', mug: 'mug', 'plate-stack': 'bowl', serving: 'bowl' };
const CANDLE_SHAPE = { glass: 'jar', ceramic: 'jar', tin: 'tin', pillar: 'pillar' };
const SIZES = { bowl: { H: 8.6, rt: 9.5 }, mug: { H: 10, rt: 4.35 }, jar: { H: 11, rt: 4.85 }, tin: { H: 7.4, rt: 5.9 }, pillar: { H: 15.5, rt: 3.7 } };

function make({ shapeOf, colors, secondary, detailK }) {
  const draw = (ctx, spec, shape, o = {}) => drawVase(ctx, spec, { shape, cx: 0, scale: 1, rng: ctx.rng.fork('tw'), ...colors(spec, shape), ...o });
  return {
    async front(ctx, spec) {
      const shape = shapeOf(spec), S = SIZES[shape];
      fitObject(ctx, { x0: -S.rt - 3, x1: S.rt + (shape === 'mug' ? 8 : 3), y0: -S.H - S.rt * 0.3 - 2, y1: 1 }, { baseFrac: 0.8, maxW: 0.76, maxH: 0.6, kmax: 60 });
      await ctx.backdrop({ mode: 'surface', horizon: 0.62 });
      await draw(ctx, spec, shape);
    },
    async alt(ctx, spec) {
      const shape = shapeOf(spec), S = SIZES[shape], sh2 = secondary(spec, shape), S2 = SIZES[sh2];
      const gap = S.rt + S2.rt * 0.55 + 1.2;
      fitObject(ctx, { x0: -S.rt * 1.1 - 2, x1: gap + S2.rt + (sh2 === 'mug' ? 7 : 2), y0: -Math.max(S.H, S2.H) - 4, y1: 1 }, { baseFrac: 0.8, maxW: 0.84, maxH: 0.56, kmax: 52 });
      await ctx.backdrop({ mode: 'surface', horizon: 0.62, seedOffset: 3 });
      await draw(ctx, { ...spec, seed: (spec.seed | 0) + 5 }, shape, { cx: 0 });
      const c2 = colors({ ...spec, color: spec.color2 || mix(spec.color, '#ffffff', 0.18), color2: spec.color }, sh2);
      await drawVase(ctx, { ...spec, seed: (spec.seed | 0) + 11 }, { shape: sh2, cx: gap, scale: sh2 === shape ? 0.84 : 1, rng: ctx.rng.fork('tw2'), ...c2 });
    },
    async detail(ctx, spec) {
      const shape = shapeOf(spec), S = SIZES[shape];
      const k = ctx.u * 9.5 * detailK(shape);
      ctx.focusCamera(-S.rt * 0.18, -S.H * 0.96, k, { rot: 0.03, cx: 0.5, cy: 0.5 });
      await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.05 }, leaves: false });
      await draw(ctx, spec, shape);
      ctx.setDof({ axis: 'diag', dx: 0.5, dy: 0.85, focus: 0.45, band: 0.1, falloff: 0.38, sigma: 7 });
    },
  };
}

export const bowl = make({
  shapeOf: (s) => BOWL_SHAPE[s.style] || 'bowl',
  colors: (s) => ({ color: s.color || '#E5DCCB', color2: s.color2 || darken(s.color || '#E5DCCB', 0.2), matte: false }),
  secondary: (s, shape) => (shape === 'mug' ? 'mug' : 'bowl'),
  detailK: (shape) => (shape === 'bowl' ? 3.6 : 4.8),
});

export const candle = make({
  shapeOf: (s) => CANDLE_SHAPE[s.vessel] || 'jar',
  colors: (s, shape) => ({
    color: s.color || '#A8651F', color2: s.color2,
    matte: shape === 'pillar' ? 'pillar' : (s.vessel === 'ceramic' || s.vessel === 'tin'),
  }),
  secondary: (s, shape) => (shape === 'pillar' ? 'tin' : shape === 'tin' ? 'jar' : 'pillar'),
  detailK: (shape) => (shape === 'pillar' ? 4.2 : 4.6),
});
