// Factory for hanging-garment kinds: wraps a model builder into front / alt / detail shots.
import { renderGarment } from './garment.mjs';

/**
 * build(ctx, spec, shot) -> { pieces, bounds, ... }
 * opts.detail(model, ctx, spec) -> { u, v, zoom, rot?, cx?, cy?, dof? } focus targets (cm)
 * opts.camera: fitCamera options
 */
export function garmentKind(build, opts = {}) {
  const cam = { mx: 0.1, top: 0.06, bottom: 0.08, kmax: 10.5, ...(opts.camera || {}) };
  return {
    async front(ctx, spec) {
      const model = build(ctx, spec, 'front');
      ctx.fitCamera(model.bounds, { ...cam, ...(model.camera || {}) });
      await ctx.backdrop({ mode: 'wall' });
      await renderGarment(ctx, model);
    },
    async alt(ctx, spec) {
      const model = build(ctx, spec, 'alt');
      ctx.fitCamera(model.bounds, { ...cam, ...(model.camera || {}) });
      await ctx.backdrop({ mode: 'wall', seedOffset: 3 });
      await renderGarment(ctx, model);
    },
    async detail(ctx, spec) {
      const model = build(ctx, spec, 'front');
      const rng = ctx.rng.fork('detail');
      const t = opts.detail(model, ctx, spec, rng);
      ctx.focusCamera(t.u, t.v, ctx.u * 9.5 * t.zoom, { rot: t.rot ?? rng.range(-0.05, 0.05), cx: t.cx ?? 0.5, cy: t.cy ?? 0.5 });
      await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.05 }, leaves: false });
      await renderGarment(ctx, model, { wall: { dx: 1.2, dy: 1.6, sigma: 1.1 } });
      ctx.setDof(t.dof || { axis: 'diag', dx: 0.6, dy: 0.8, focus: 0.62, band: 0.14, falloff: 0.4, sigma: 6.5 });
    },
  };
}
