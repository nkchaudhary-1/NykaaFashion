// Helpers for objects standing on a table (vases, bags, shoes, candles…).
import { Curve, f, lerp, clamp, polyD, tube } from './geometry.mjs';
import { mix, lighten, darken, shadowOf, highlightOf } from './color.mjs';

/**
 * Place an object (cm bounds, y down, base at b.y1) on the table: sets ctx.cam so the base sits at baseFrac*H and the
 * object fits within maxW / maxH fractions. Returns { baseY } in px.
 */
export function fitObject(ctx, b, { baseFrac = 0.8, maxW = 0.7, maxH = 0.68, kmax = 40, cx = 0.5, dx = 0 } = {}) {
  const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  const k = Math.min((ctx.W * maxW) / bw, (ctx.H * maxH) / bh, kmax * ctx.u);
  const baseY = ctx.H * baseFrac;
  const midx = (b.x0 + b.x1) / 2;
  ctx.cam = new (ctx.cam.constructor)({ k, tx: ctx.W * cx - midx * k + dx * ctx.W, ty: baseY - b.y1 * k, rot: 0 });
  return { baseY, k };
}

/** world cm -> film px for a point */
export const px = (ctx, u, v) => ctx.cam.fwd(u, v);

/** Surface-of-revolution profile helper. pts = [[h(0..1 from base), r]] ; returns { r(h), dr(h) } */
export function profile(pts, H) {
  const c = Curve.through(pts.map(([t, r]) => [t * H, r]));
  const N = 160, hs = [], rs = [];
  for (let i = 0; i <= N; i++) { const p = c.at(i / N); hs.push(p[0]); rs.push(p[1]); }
  const r = (h) => {
    if (h <= hs[0]) return rs[0];
    if (h >= hs[N]) return rs[N];
    let lo = 0, hi = N;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (hs[m] <= h) lo = m; else hi = m; }
    const t = (h - hs[lo]) / (hs[hi] - hs[lo] || 1);
    return rs[lo] + (rs[hi] - rs[lo]) * t;
  };
  const dr = (h) => (r(h + 0.15) - r(h - 0.15)) / 0.3;
  return { r, dr, c, H };
}

/** gradient-glaze albedo helpers */
export function glazeColors(color, color2) {
  const a = color, b = color2 || mix(color, '#ffffff', 0.25);
  return { a, b, dark: shadowOf(color, 0.5), light: highlightOf(color, 0.5) };
}

/**
 * Paint object models { pieces, bounds, baseY (cm), sc, groundIds? } standing on the table, in the order given:
 * rasterise albedos -> ground + contact shadow (from the pieces whose id starts with one of `shadowIds`) -> shade & draw in z order.
 */
export async function paintObjectModels(ctx, models, { shadowIds = ['sole', 'upper', 'body', 'front', 'side', 'top'], sx = 0.5, sy = 0.075, strength = 0.36 } = {}) {
  const k = ctx.cam.k;
  for (const m of models) {
    for (const p of m.pieces) p.layer = await ctx.albedo(p);
    const base = m.pieces.filter((p) => p.layer && shadowIds.some((id) => p.id.startsWith(id))).map((p) => p.layer);
    const [cxm, by] = ctx.cam.fwd((m.bounds.x0 + m.bounds.x1) / 2, m.baseY ?? 0);
    ctx.groundShadow(base, { baseY: by, sx, sy, sigma: 0.35, strength, wide: 1.8, wideStrength: 0.16 });
    ctx.contactEllipse(cxm, by - 1, (m.bounds.x1 - m.bounds.x0) * k * 0.45 * (m.contactScale ?? 1), 0.42 * k * (m.sc ?? 1), { strength: 0.5, sigma: 0.4 * k * (m.sc ?? 1) });
    for (const p of m.pieces.slice().sort((a, b) => a.z - b.z)) {
      if (!p.layer) continue;
      let normalFn = p.normalFn || null;
      if (p.sphere) {
        // analytic sphere (pearls, beads, cabochons): centre/radius in cm
        const [sx0, sy0] = ctx.cam.fwd(p.sphere.u, p.sphere.v), R = p.sphere.r * k, X0 = p.layer.x, Y0 = p.layer.y;
        normalFn = (ix, iy, out) => {
          const dx = (X0 + ix - sx0) / R, dy = (Y0 + iy - sy0) / R, q = Math.min(0.995, dx * dx + dy * dy), nz = Math.sqrt(1 - q);
          out[0] = dx; out[1] = dy; out[2] = nz;
        };
      }
      ctx.shadeAndDraw(p.layer, { mat: p.mat, field: p.field, gain: p.gain, normalFn, bevel: p.sphere ? null : { sigma: (p.bevelCm ?? 0.3) * k, h: p.bevelH ?? 0.26 }, edgeAo: p.edgeAo ?? 0.12, edgeSigma: 0.5 * k, contact: p.contact, grid: p.grid });
      if (p.overlay) await ctx.vector(p.overlay, { bounds: p.bounds });
    }
  }
}
