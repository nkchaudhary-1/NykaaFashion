// Spec -> WebP pipeline (used by render.mjs workers, preview.mjs and ad-hoc scripts).
import { Ctx } from './ctx.mjs';
import { sharp } from './raster.mjs';
import { getKind } from '../kinds/index.mjs';

/** Render one job to raw RGB (Uint8Array) + dimensions. */
export async function renderRaw(job) {
  const w = job.w || 1000, h = job.h || 1250;
  const spec = job.spec;
  if (!spec) throw new Error(`job ${job.out}: only "spec" jobs are supported in Phase A (scenes arrive in Phase B)`);
  if (!spec.kind) throw new Error(`job ${job.out}: spec.kind is required`);
  const kind = getKind(spec.kind);
  const shot = spec.shot || 'front';
  const ctx = new Ctx({ w, h, spec: { ...spec, shot } });
  const fn = kind[shot] || kind.front;
  if (!fn) throw new Error(`kind ${spec.kind} has no shot ${shot}`);
  await fn(ctx, { ...spec, shot });
  const rgb = ctx.finish({ ...(kind.finishOpts?.[shot] || {}), ...(job.finish || {}) });
  return { rgb, w, h, pins: ctx.pins || null };
}

export function meanColor(rgb) {
  let r = 0, g = 0, b = 0;
  const n = rgb.length / 3;
  for (let i = 0; i < rgb.length; i += 3) { r += rgb[i]; g += rgb[i + 1]; b += rgb[i + 2]; }
  const h = (v) => Math.round(v / n).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

/** Render + encode. Returns { webp, avg, w, h, blur?, pins? } */
export async function renderJob(job, { quality = 80, effort = 5 } = {}) {
  const { rgb, w, h, pins } = await renderRaw(job);
  const base = sharp(Buffer.from(rgb.buffer, rgb.byteOffset, rgb.byteLength), { raw: { width: w, height: h, channels: 3 } });
  const webp = await base.clone().webp({ quality: job.quality || quality, effort, smartSubsample: true }).toBuffer();
  const out = { webp, avg: meanColor(rgb), w, h };
  if (w >= 1200) {
    const b = await base.clone().resize({ width: 16 }).webp({ quality: 45 }).toBuffer();
    out.blur = 'data:image/webp;base64,' + b.toString('base64');
  }
  if (pins && pins.length) out.pins = pins;
  return out;
}
