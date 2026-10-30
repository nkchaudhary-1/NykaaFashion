// Scene compositor: one shared studio backdrop (paper wall + tonal motif + floor + optional rail) with several product
// "items" rendered through the normal kind code on child contexts, so lighting, shadows and grain match single shots.
//   scene = { bg, motif: arch|window|circle|steps|stripe|none, motifColor, safe: left|right|none, rail, floorY, topY,
//             items: [{ spec, cx, cy, height, anchor: hang|floor, z, rot, pin }] }
// cy is the bbox centre and height the bbox height as fractions of the canvas; hang items hang from the rail (hook meets
// the rod), floor items stand on floorY. Pins (normalised) are the visible body point of every item that carries `pin`.
import { Ctx } from './ctx.mjs';
import { hashStr } from './prng.mjs';
import { clamp, smoothstep, f } from './geometry.mjs';
import { parse, mix, lighten, darken, luma, rgb01 } from './color.mjs';
import { rasterize, svgWindow, blur, castShadow } from './raster.mjs';
import { getKind } from '../kinds/index.mjs';

/** alpha mask (0..1) of an SVG body drawn in film px */
async function maskOf(W, H, body, defs = '') {
  const L = await rasterize(svgWindow(0, 0, W, H, body, defs), 0, 0, W, H);
  return L.a;
}

/** multiply the film towards `color` where mask > 0 (keeps the paper light pool, mottling and window light) */
function tintFilm(ctx, mask, color, { relief = 0, sigma = 2, sgn = 1, amount = 1 } = {}) {
  const { W, H, film } = ctx;
  const bg = rgb01(ctx.bg), c = rgb01(color);
  const ratio = [0, 1, 2].map((i) => clamp(c[i] / Math.max(bg[i], 0.05), 0.35, 2.2));
  let h = null;
  if (relief) h = blur(mask, W, H, sigma);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, m = mask[i] * amount;
      let rl = 0;
      if (h && x > 0 && y > 0 && x < W - 1 && y < H - 1) {
        const gx = h[i + 1] - h[i - 1], gy = h[i + W] - h[i - W];
        rl = sgn * (0.6 * gx + 0.8 * gy) * relief;
      }
      if (m <= 0.002 && rl === 0) continue;
      const o = i * 3;
      film[o] *= (1 + m * (ratio[0] - 1)) * (1 + rl);
      film[o + 1] *= (1 + m * (ratio[1] - 1)) * (1 + rl);
      film[o + 2] *= (1 + m * (ratio[2] - 1)) * (1 + rl);
    }
  }
}

function motifRange(scene, W) {
  if (scene.safe === 'left') return [0.37 * W, 0.985 * W];
  if (scene.safe === 'right') return [0.015 * W, 0.63 * W];
  return [0.06 * W, 0.94 * W];
}

async function paintMotif(ctx, scene, floorY, topY) {
  const { W, H, u } = ctx;
  const kind = scene.motif;
  if (!kind || kind === 'none') return;
  const mc = scene.motifColor || mix(scene.bg, '#000', 0.08);
  const [xa, xb] = motifRange(scene, W);
  const mx = (xa + xb) / 2, fy = floorY * H;
  const sig = Math.max(1.4, 2.2 * u);
  if (kind === 'arch') {
    const top = Math.max(0.05 * H, (topY - 0.045) * H), ah = fy - top;
    const aw = Math.min((xb - xa) * 0.86, ah * 0.66), x0 = mx - aw / 2, x1 = mx + aw / 2, r = aw / 2;
    const d = `M${f(x0)} ${f(H + 20)}L${f(x0)} ${f(top + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x1)} ${f(top + r)}L${f(x1)} ${f(H + 20)}Z`;
    const m = await maskOf(W, H, `<path d="${d}" fill="#fff"/>`);
    tintFilm(ctx, m, mc, { relief: 1.5, sigma: sig * 1.9, sgn: -1, amount: 1.2 });
    // a lighter inner reveal line gives the niche some depth
    const ins = 0.045 * aw, d2 = `M${f(x0 + ins)} ${f(H + 20)}L${f(x0 + ins)} ${f(top + r)}A${f(r - ins)} ${f(r - ins)} 0 0 1 ${f(x1 - ins)} ${f(top + r)}L${f(x1 - ins)} ${f(H + 20)}Z`;
    const m2 = await maskOf(W, H, `<path d="${d2}" fill="none" stroke="#fff" stroke-width="${f(1.6 * u)}"/>`);
    tintFilm(ctx, m2, lighten(mc, 0.1), { amount: 0.55 });
  } else if (kind === 'circle') {
    const R = Math.min(0.3 * H, (xb - xa) * 0.46), cy = Math.min(0.43 * H, fy - R * 1.05);
    const m = await maskOf(W, H, `<circle cx="${f(mx)}" cy="${f(cy)}" r="${f(R)}" fill="#fff"/>`);
    tintFilm(ctx, m, mc, { relief: 1.5, sigma: sig * 1.8, sgn: 1, amount: 1.2 });
    const m2 = await maskOf(W, H, `<circle cx="${f(mx)}" cy="${f(cy)}" r="${f(R * 0.84)}" fill="none" stroke="#fff" stroke-width="${f(1.4 * u)}"/>`);
    tintFilm(ctx, m2, lighten(mc, 0.1), { amount: 0.4 });
  } else if (kind === 'window') {
    const dark = luma(scene.bg) < 0.3;
    const wh = Math.min(0.56 * H, fy - 0.1 * H - 0.12 * H);
    let ww = Math.min((xb - xa) * 0.7, wh * 0.78), wx = mx;
    // with two or more hanging pieces, put the window where its cross is not sliced by a garment: in the clear space beside the
    // group (narrower if need be); the garment extents are estimated from their bbox height and a per-kind aspect ratio
    const hung = (scene.items || []).filter((i) => i.anchor === 'hang');
    if (hung.length >= 2) {
      const ratio = { dress: 0.5, kurta: 0.62, 'kurta-set': 0.52, jacket: 0.92, shirt: 0.95, tee: 1.0, sweater: 1.1, trousers: 0.5, skirt: 0.85, saree: 0.72, top: 1.0 };
      const ext = hung.map((i) => { const hw = 0.5 * (ratio[i.spec.kind] ?? 0.7) * i.height * H + 0.012 * W; return [i.cx * W - hw, i.cx * W + hw]; });
      const L = Math.min(...ext.map((e) => e[0])), R = Math.max(...ext.map((e) => e[1]));
      const right = xb - (R + 0.01 * W), left = L - 0.01 * W - xa;
      const side = right >= left ? 'r' : 'l', space = Math.max(right, left);
      if (space >= 0.3 * ww) { ww = Math.min(ww, space * 0.94); wx = side === 'r' ? xb - space / 2 : xa + space / 2; }
      else {
        let best = -1e9;
        for (let c = xa + ww / 2; c <= xb - ww / 2 + 1; c += 0.01 * W) {
          const gap = Math.min(...ext.flatMap(([l, r]) => [Math.abs(c - l), Math.abs(c - r)]));
          const score = Math.min(gap, 0.1 * W) - Math.abs(c - mx) * 0.002;
          if (score > best) { best = score; wx = c; }
        }
      }
    }
    const x0 = wx - ww / 2, y0 = Math.max(0.07 * H, 0.1 * H), ft = Math.max(5, 0.016 * H);
    const frame = `<rect x="${f(x0)}" y="${f(y0)}" width="${f(ww)}" height="${f(wh)}" fill="#fff"/>`;
    const m = await maskOf(W, H, frame);
    const frameC = dark ? lighten(mc, 0.16) : darken(mc, 0.05);
    tintFilm(ctx, m, frameC, { relief: dark ? 1.6 : 1.3, sigma: sig * 1.4, sgn: -1 });
    // glass lighter than the frame (a warm daylight glow on dark walls), with a cross of mullions
    const gx = x0 + ft, gy = y0 + ft, gw = ww - 2 * ft, gh = wh - 2 * ft, mw = Math.max(3, ft * 0.55);
    const glass = `<rect x="${f(gx)}" y="${f(gy)}" width="${f(gw)}" height="${f(gh)}" fill="#fff"/>` +
      `<rect x="${f(gx + gw / 2 - mw / 2)}" y="${f(gy)}" width="${f(mw)}" height="${f(gh)}" fill="#000"/><rect x="${f(gx)}" y="${f(gy + gh * 0.42 - mw / 2)}" width="${f(gw)}" height="${f(mw)}" fill="#000"/>`;
    const mg = await maskOf(W, H, glass);
    tintFilm(ctx, mg, dark ? mix(scene.bg, '#d9c8a6', 0.34) : lighten(mc, 0.3), { amount: dark ? 0.95 : 0.85 });
    const bars = await maskOf(W, H, `<rect x="${f(gx + gw / 2 - mw / 2)}" y="${f(gy)}" width="${f(mw)}" height="${f(gh)}" fill="#fff"/><rect x="${f(gx)}" y="${f(gy + gh * 0.42 - mw / 2)}" width="${f(gw)}" height="${f(mw)}" fill="#fff"/>`);
    tintFilm(ctx, bars, dark ? lighten(mc, 0.08) : darken(mc, 0.06), { relief: 1.0, sigma: sig, sgn: 1 });
    const sill = await maskOf(W, H, `<rect x="${f(x0 - ft * 0.6)}" y="${f(y0 + wh)}" width="${f(ww + ft * 1.2)}" height="${f(ft * 0.8)}" fill="#fff"/>`);
    tintFilm(ctx, sill, dark ? lighten(mc, 0.12) : darken(mc, 0.05), { relief: 1.4, sigma: sig, sgn: 1 });
  } else if (kind === 'steps') {
    const n = 3, bw = (xb - xa) / n, hs = [0.17, 0.32, 0.47].map((v) => v * H * (W > H ? 0.95 : 1));
    let body = '';
    for (let i = 0; i < n; i++) body += `<rect x="${f(xa + i * bw)}" y="${f(fy - hs[i])}" width="${f(bw + 1)}" height="${f(hs[i])}" fill="#fff"/>`;
    const m = await maskOf(W, H, body);
    tintFilm(ctx, m, mc, { relief: 1.8, sigma: sig * 1.2, sgn: 1, amount: 1.15 });
  } else if (kind === 'stripe') {
    const n = 4, sw = Math.min(0.075 * W, (xb - xa) / (n * 2.2)), gap = (xb - xa - n * sw) / (n - 1 || 1);
    let body = '';
    for (let i = 0; i < n; i++) body += `<rect x="${f(xa + i * (sw + gap))}" y="${f(-4)}" width="${f(sw)}" height="${f(fy + 4)}" fill="#fff"/>`;
    const m = await maskOf(W, H, body);
    tintFilm(ctx, m, mc, { relief: 1.0, sigma: sig, sgn: 1, amount: 1.2 });
  }
}

/** floor plane below floorY: a touch darker, with a soft contact line where the wall meets it */
function paintFloor(ctx, floorY) {
  const { W, H, film, u } = ctx, fy = floorY * H;
  for (let y = Math.max(0, Math.floor(fy - 4 * u)); y < H; y++) {
    const t = clamp((y - fy) / Math.max(1, H - fy), 0, 1), e = smoothstep(fy - 1.6 * u, fy + 1.6 * u, y);
    const edge = 0.06 * Math.exp(-Math.max(0, y - fy) / (0.012 * H));
    const k = 1 - e * (0.052 - 0.02 * t) - edge * e;
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 3;
      film[o] *= k; film[o + 1] *= k * 0.998; film[o + 2] *= k * 0.994;
    }
  }
}

async function drawRail(ctx, y, bg) {
  const { W, H, u } = ctx;
  const r = Math.max(4.2, 0.0072 * H);
  const tone = luma(bg) > 0.45 ? '#6F5C44' : '#B79B62';
  const y0 = Math.floor(y - r), hh = Math.ceil(2 * r);
  // soft shadow of the rod on the wall
  const sh = { x: 0, y: y0, w: W, h: hh, a: new Float32Array(W * hh).fill(1) };
  castShadow(ctx.film, W, H, sh, { dx: 1.1 * r, dy: 2.1 * r, sigma: 1.5 * r, strength: 0.2, tint: ctx.shadowTint });
  castShadow(ctx.film, W, H, sh, { dx: 0.3 * r, dy: 0.8 * r, sigma: 0.45 * r, strength: 0.16, tint: ctx.shadowTint });
  const gid = ctx.id('rl');
  const defs = `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(tone, 0.5)}"/><stop offset=".2" stop-color="${lighten(tone, 0.22)}"/><stop offset=".55" stop-color="${tone}"/><stop offset="1" stop-color="${darken(tone, 0.5)}"/></linearGradient>`;
  await ctx.vector(`<rect x="0" y="${f(y - r)}" width="${W}" height="${f(2 * r)}" fill="url(#${gid})"/><rect x="0" y="${f(y - r * 0.62)}" width="${W}" height="${f(Math.max(1, r * 0.2))}" fill="#fff" opacity=".42"/>`, { cm: false, defs });
}

/** pins: the visible body point of each pinned item (never on backdrop, never under a later item) */
function computePins(items, W, H) {
  const later = new Float32Array(W * H);
  const vis = new Array(items.length);
  for (let i = items.length - 1; i >= 0; i--) {
    const m = items[i].mask, v = new Uint8Array(W * H);
    for (let p = 0; p < v.length; p++) v[p] = m[p] > 0.55 && later[p] < 0.12 ? 1 : 0;
    for (let p = 0; p < v.length; p++) if (m[p] > later[p]) later[p] = m[p];
    vis[i] = v;
  }
  const out = [], placed = [];
  const minD = 0.07 * Math.min(W, H);
  items.forEach((it, i) => {
    if (!it.pin) return;
    const v = vis[i];
    let x0 = W, x1 = -1, y0 = H, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (v[y * W + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return;
    const garment = it.anchor === 'hang';
    const fr = garment ? [0.4, 0.45, 0.35, 0.5, 0.3, 0.56, 0.26] : [0.5, 0.44, 0.56, 0.38, 0.62, 0.3];
    let best = null;
    for (const q of fr) {
      const yc = Math.round(y0 + (y1 - y0) * q);
      // contiguous runs of visible pixels in a thin band around the row; take the run centre nearest the band centroid
      let sx = 0, n = 0;
      for (let y = yc - 2; y <= yc + 2; y++) for (let x = 0; x < W; x++) if (v[Math.max(0, Math.min(H - 1, y)) * W + x]) { sx += x; n++; }
      if (!n) continue;
      const cxm = sx / n;
      const runs = [];
      let s = -1;
      for (let x = 0; x <= W; x++) {
        const on = x < W && v[yc * W + x];
        if (on && s < 0) s = x;
        if (!on && s >= 0) { if (x - s >= 6) runs.push([s, x - 1]); s = -1; }
      }
      if (!runs.length) continue;
      runs.sort((a, b) => Math.abs((a[0] + a[1]) / 2 - cxm) - Math.abs((b[0] + b[1]) / 2 - cxm));
      for (const r of runs.slice(0, 3)) {
        const px = (r[0] + r[1]) / 2;
        if (placed.every((p) => Math.hypot(p[0] - px, p[1] - yc) > minD)) { best = [px, yc]; break; }
      }
      if (best) break;
    }
    if (!best) { // fall back: any visible pixel far from the other pins
      outer: for (let y = y0; y <= y1; y += 4) for (let x = x0; x <= x1; x += 4) if (v[y * W + x] && placed.every((p) => Math.hypot(p[0] - x, p[1] - y) > minD)) { best = [x, y]; break outer; }
    }
    if (!best) best = [(x0 + x1) / 2, (y0 + y1) / 2];
    placed.push(best);
    out.push({ id: it.pin, x: +(best[0] / W).toFixed(4), y: +(best[1] / H).toFixed(4) });
  });
  return out;
}

export async function renderScene(job) {
  const { w: W, h: H, scene } = job;
  const spec = { kind: 'scene', shot: 'scene', seed: hashStr(job.out || 'scene'), bg: scene.bg };
  const ctx = new Ctx({ w: W, h: H, spec });
  const floorY = scene.floorY ?? 0.88, topY = scene.topY ?? 0.1;
  { const t = ctx.shadowTint, a = (t[0] + t[1] + t[2]) / 3; ctx.shadowTint = t.map((v) => a + (v - a) * 0.5); }
  await ctx.backdrop({ mode: 'wall', shaft: { strength: 0.075 }, leaves: scene.safe === 'left' ? false : null, seedOffset: 5 });
  await paintMotif(ctx, scene, floorY, topY);
  paintFloor(ctx, floorY);
  if (scene.rail && scene.items.some((i) => i.anchor === 'hang')) await drawRail(ctx, topY * H, scene.bg);

  // wall / floor colours at both side edges as they will appear in the finished image (before any item is drawn)
  let edge = null;
  if (W >= 1500) {
    const cw = Math.max(2, Math.round(0.01 * W)), fin = { contrast: 0.2, vignette: 0.05 };
    const wy0 = 0.15 * H, wy1 = 0.8 * H, fy0 = Math.min(H - 2, (floorY + 0.04) * H), fy1 = Math.min(H, (floorY + 0.1) * H);
    edge = { wall: [ctx.sampleFinal(0, cw, wy0, wy1, fin), ctx.sampleFinal(W - cw, W, wy0, wy1, fin)], floor: [ctx.sampleFinal(0, cw, fy0, fy1, fin), ctx.sampleFinal(W - cw, W, fy0, fy1, fin)], floorY };
  }

  const order = scene.items.map((it, i) => ({ it, i })).sort((a, b) => (a.it.z ?? 0) - (b.it.z ?? 0) || a.i - b.i);
  const drawn = [];
  for (const { it } of order) {
    const sp = { ...it.spec, shot: it.spec.shot || 'front', bg: scene.bg };
    const place = { cx: it.cx, cy: it.cy, height: it.height, rot: it.rot || 0, anchor: it.anchor || 'floor', floorY, topY, job: job.out };
    const child = ctx.child(sp, place, { rail: !!scene.rail && place.anchor === 'hang' });
    const kind = getKind(sp.kind);
    const fn = kind.scene || kind.front;
    await fn(child, sp);
    drawn.push({ pin: it.pin, mask: child.itemMask, anchor: place.anchor });
  }
  const pins = computePins(drawn, W, H);
  const rgb = ctx.finish({ grain: 0.0105, vignette: 0.05, lightOnProduct: 0.3 });
  return { rgb, w: W, h: H, pins: pins.length ? pins : null, edge };
}
