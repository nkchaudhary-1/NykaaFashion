#!/usr/bin/env node
// Garment rigs for the on-device tracker. Each garment is rendered by the parent repo's art engine exactly like its
// product shot, but with no backdrop and no hanger, and with each PART composited separately by the engine's own
// piece ids: torso (body, collar, placket, pockets…), viewer-left sleeve, viewer-right sleeve. Each part becomes a transparent
// WebP; the anchor points the warp pins to the body (neck, shoulders, torso sides, hem corners, sleeve elbows and
// cuffs) are measured from the masks. Output: public/garments/parts/*.webp plus a snippet for src/data/garments.ts.
//
//   node scripts/make-cutouts.mjs [--sheet /tmp/rigs.png]
//
// Needs the art engine (../../scripts/art) with its deps resolvable from there:
//   ln -sfn "$(pwd)/node_modules" ../node_modules   # from tryon-demo/, once; remove afterwards
//
// Real photography replaces all of this: cut the photo into the same three transparent parts (Figma), drop them in
// public/garments/parts, and set the part boxes + anchors by hand (fractions of the full cutout, 0..1).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ART = resolve(here, "../../scripts/art");
const imp = (p) => import(pathToFileURL(resolve(ART, p)).href);
const { Ctx } = await imp("lib/ctx.mjs");
const { getKind } = await imp("kinds/index.mjs");
const { alphaToMask, sharp } = await imp("lib/raster.mjs");

const args = process.argv.slice(2);
const sheetIdx = args.indexOf("--sheet");
const SHEET = sheetIdx >= 0 ? args[sheetIdx + 1] : null;
const OUT = resolve(here, "../public/garments/parts");
const TARGET_H = 1000;
const HANGER = new Set(["hanger", "hook", "peg"]);
const PARTS = ["torso", "sleeveL", "sleeveR"];
const partOf = (id) => (id === "sleeve-1" ? 1 : id === "sleeve1" ? 2 : 0);

mkdirSync(OUT, { recursive: true });
const manifest = JSON.parse(readFileSync(resolve(here, "garments.manifest.json"), "utf8"));

/**
 * Render one spec with each PART composited into its own film (premultiplied over black) with its own alpha mask.
 * The body therefore keeps the pixels that the sleeve heads cover in the product shot, so no notch appears when a
 * sleeve rotates away on a raised arm. Hanger pieces are skipped entirely.
 */
async function render(spec, w, h) {
  const ctx = new Ctx({ w, h, spec: { ...spec, shot: "front" } });
  ctx.backdrop = async () => {}; // films stay black; the masks are the alpha
  const films = PARTS.map(() => new Float32Array(w * h * 3));
  const masks = PARTS.map(() => new Float32Array(w * h));
  const pieceOf = new Map();
  let currentPart = 0;
  const albedo = ctx.albedo.bind(ctx);
  ctx.albedo = async (piece) => {
    const layer = await albedo(piece);
    if (layer) pieceOf.set(layer, piece);
    return layer;
  };
  ctx.shadeAndDraw = function (layer, o) {
    const piece = pieceOf.get(layer);
    if (piece && HANGER.has(piece.id)) return; // not drawn, not shadowed, not in any mask
    currentPart = partOf(piece?.id ?? "body");
    const main = this.film;
    this.film = films[currentPart];
    try {
      Ctx.prototype.shadeAndDraw.call(this, layer, o);
    } finally {
      this.film = main;
    }
    alphaToMask(layer, w, h, masks[currentPart]);
  };
  // Vector overlays (buttons, zips) are drawn right after their piece: route them to the same part.
  ctx.vector = async function (inner, opts) {
    const main = this.film;
    this.film = films[currentPart];
    try {
      return await Ctx.prototype.vector.call(this, inner, opts);
    } finally {
      this.film = main;
    }
  };
  const kind = getKind(spec.kind);
  await kind.front(ctx, { ...spec, shot: "front" });
  const rgbs = films.map((film) => {
    ctx.film = film;
    return ctx.finish({ grain: 0, vignette: 0 });
  });
  return { rgbs, masks };
}

const bboxOf = (test, w, h) => {
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (test(x, y)) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
};

/** Anchor detection on full-resolution masks. All results are fractions of the crop box. */
function detectAnchors(masks, w, h, crop) {
  const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : Math.max(...masks.map((m) => m[y * w + x])));
  const isPart = (x, y, p) => x >= 0 && y >= 0 && x < w && y < h && masks[p][y * w + x] > 0.5;
  const rowFirst = (y, p) => {
    for (let x = crop.x0; x <= crop.x1; x++) if (isPart(x, y, p)) return x;
    return null;
  };
  const rowLast = (y, p) => {
    for (let x = crop.x1; x >= crop.x0; x--) if (isPart(x, y, p)) return x;
    return null;
  };
  const rowCentroid = (y0, y1, p) => {
    let sx = 0,
      sy = 0,
      n = 0;
    for (let y = Math.max(crop.y0, y0); y <= Math.min(crop.y1, y1); y++)
      for (let x = crop.x0; x <= crop.x1; x++)
        if (isPart(x, y, p)) {
          sx += x;
          sy += y;
          n++;
        }
    return n ? { x: sx / n, y: sy / n } : null;
  };
  const lowestRow = (p) => {
    for (let y = crop.y1; y >= crop.y0; y--) for (let x = crop.x0; x <= crop.x1; x++) if (isPart(x, y, p)) return y;
    return null;
  };
  const H = crop.y1 - crop.y0 + 1;

  let top = crop.y0;
  while (top < crop.y1 && !PARTS.some((_, p) => rowFirst(top, p) !== null)) top++;

  // shoulders: the torso's outermost pixels just under the top (the seam where the sleeve meets the body). Scale and
  // the torso warp come from these. sleeveTop: the top of each sleeve (its cap apex) — the sleeve bone pivots there,
  // so a raised arm swings the whole sleeve, cap included, without a notch or an epaulette.
  const ys = Math.min(crop.y1, top + Math.round(0.045 * H));
  const sl = rowFirst(ys, 0) ?? crop.x0;
  const sr = rowLast(ys, 0) ?? crop.x1;
  const shoulderL = { x: sl, y: ys };
  const shoulderR = { x: sr, y: ys };
  const sleeveTop = (p, fallback) => {
    let y = crop.y0;
    while (y < crop.y1 && rowFirst(y, p) === null) y++;
    if (y >= crop.y1) return fallback;
    const c = rowCentroid(y, y + Math.round(0.015 * H), p);
    return c ? { x: Math.round(c.x), y: Math.round(c.y) } : fallback;
  };
  const sleeveTopL = sleeveTop(1, shoulderL);
  const sleeveTopR = sleeveTop(2, shoulderR);
  const xc = Math.round((sl + sr) / 2);

  // neck: first solid pixel down the centre column (any part)
  let yn = crop.y0;
  while (yn < crop.y1 && A(xc, yn) <= 0.5) yn++;
  const neck = { x: xc, y: yn };

  // hem: the torso's lowest row; corners = torso extent a little above it (hems curve)
  const hemY = lowestRow(0) ?? crop.y1;
  const yh = Math.max(ys + 1, hemY - Math.round(0.012 * H));
  const hemL = { x: rowFirst(yh, 0) ?? sl, y: hemY };
  const hemR = { x: rowLast(yh, 0) ?? sr, y: hemY };

  // torso sides at chest height
  const yside = Math.round(ys + 0.3 * (hemY - ys));
  const sideL = { x: rowFirst(yside, 0) ?? sl, y: yside };
  const sideR = { x: rowLast(yside, 0) ?? sr, y: yside };

  // sleeve bones: shoulder (shared with the torso seam) -> elbow (sleeve centroid at the mid row) -> cuff (lowest rows' centroid)
  const bone = (p, sh) => {
    const cuffY = lowestRow(p);
    if (cuffY === null) return null;
    const cuff = rowCentroid(cuffY - Math.round(0.015 * H), cuffY, p) ?? { x: sh.x, y: cuffY };
    const ym = Math.round((sh.y + cuff.y) / 2);
    const elbow = rowCentroid(ym - 2, ym + 2, p) ?? { x: (sh.x + cuff.x) / 2, y: ym };
    return { elbow, cuff };
  };
  const bL = bone(1, sleeveTopL);
  const bR = bone(2, sleeveTopR);
  const px = {
    neck,
    shoulderL,
    shoulderR,
    sideL,
    sideR,
    hemL,
    hemR,
    sleeveTopL,
    sleeveTopR,
    elbowL: bL?.elbow ?? { x: sl, y: (ys + hemY) / 2 },
    elbowR: bR?.elbow ?? { x: sr, y: (ys + hemY) / 2 },
    cuffL: bL?.cuff ?? { x: sl, y: hemY },
    cuffR: bR?.cuff ?? { x: sr, y: hemY },
  };
  const W = crop.x1 - crop.x0 + 1;
  const norm = Object.fromEntries(
    Object.entries(px).map(([k, p]) => [k, { x: +((p.x - crop.x0) / W).toFixed(4), y: +((p.y - crop.y0) / H).toFixed(4) }]),
  );
  return { px, norm };
}

const results = [];
for (const job of manifest.jobs) {
  const w = job.w || 1000;
  const h = job.h || 1250;
  const { rgbs, masks } = await render(job.spec, w, h);

  // full crop box around everything, with a margin
  const b = bboxOf((x, y) => masks.some((m) => m[y * w + x] > 0.03), w, h);
  if (!b) throw new Error(`${job.out}: empty render`);
  const m = Math.round(0.02 * h);
  const crop = { x0: Math.max(0, b.x0 - m), y0: Math.max(0, b.y0 - m), x1: Math.min(w - 1, b.x1 + m), y1: Math.min(h - 1, b.y1 + m) };
  const cropW = crop.x1 - crop.x0 + 1;
  const cropH = crop.y1 - crop.y0 + 1;
  const scale = TARGET_H / cropH;
  const size = { w: Math.round(cropW * scale), h: TARGET_H };

  const anchors = detectAnchors(masks, w, h, crop);

  // one RGBA image per part, un-premultiplied against its black film
  const parts = {};
  const partImages = [];
  for (let p = 0; p < PARTS.length; p++) {
    const rgb = rgbs[p];
    const mask = masks[p];
    const rgba = new Uint8Array(w * h * 4);
    let any = false;
    for (let i = 0; i < w * h; i++) {
      const a = Math.min(1, Math.max(0, mask[i]));
      if (a < 0.004) continue;
      any = true;
      const o = i * 3;
      rgba[i * 4] = Math.min(255, Math.round(rgb[o] / a));
      rgba[i * 4 + 1] = Math.min(255, Math.round(rgb[o + 1] / a));
      rgba[i * 4 + 2] = Math.min(255, Math.round(rgb[o + 2] / a));
      rgba[i * 4 + 3] = Math.round(a * 255);
    }
    if (!any) continue;
    const pb = bboxOf((x, y) => rgba[(y * w + x) * 4 + 3] > 8, w, h);
    const pm = 3;
    const px0 = Math.max(crop.x0, pb.x0 - pm);
    const py0 = Math.max(crop.y0, pb.y0 - pm);
    const px1 = Math.min(crop.x1, pb.x1 + pm);
    const py1 = Math.min(crop.y1, pb.y1 + pm);
    const pw = px1 - px0 + 1;
    const ph = py1 - py0 + 1;
    const outW = Math.max(1, Math.round(pw * scale));
    const outH = Math.max(1, Math.round(ph * scale));
    const file = `${job.out}-${PARTS[p].replace("sleeveL", "sleeve-l").replace("sleeveR", "sleeve-r")}.webp`;
    const img = sharp(Buffer.from(rgba.buffer), { raw: { width: w, height: h, channels: 4 } })
      .extract({ left: px0, top: py0, width: pw, height: ph })
      .resize(outW, outH, { kernel: "lanczos3" });
    await img.clone().webp({ quality: 88, alphaQuality: 90, effort: 5 }).toFile(resolve(OUT, file));
    parts[PARTS[p]] = {
      file: `/garments/parts/${file}`,
      x: +((px0 - crop.x0) / cropW).toFixed(4),
      y: +((py0 - crop.y0) / cropH).toFixed(4),
      w: +(pw / cropW).toFixed(4),
      h: +(ph / cropH).toFixed(4),
    };
    partImages.push({ part: p, png: await img.clone().png().toBuffer(), left: Math.round((px0 - crop.x0) * scale), top: Math.round((py0 - crop.y0) * scale) });
    console.log(`${job.out} ${PARTS[p]}: ${outW}x${outH} -> ${file}`);
  }
  results.push({ id: job.out, size, parts, anchors, partImages });
}

// Snippet for garments.ts
console.log("\n// ── paste into src/data/garments.ts ──");
for (const r of results) {
  const a = r.anchors.norm;
  const pt = (k) => `${k}: { x: ${a[k].x}, y: ${a[k].y} }`;
  const part = (k) => (r.parts[k] ? `${k}: { file: "${r.parts[k].file}", x: ${r.parts[k].x}, y: ${r.parts[k].y}, w: ${r.parts[k].w}, h: ${r.parts[k].h} }` : null);
  console.log(`// ${r.id}`);
  console.log(`parts: { size: { w: ${r.size.w}, h: ${r.size.h} }, ${PARTS.map(part).filter(Boolean).join(", ")} },`);
  console.log(`anchors: { ${Object.keys(a).map(pt).join(", ")} },`);
}

// Debug sheet: parts tinted, anchors and sleeve bones drawn
if (SHEET) {
  const cellH = 520;
  const tiles = [];
  let x = 0;
  const tint = ["#ffffff", "#ff9a8a", "#8ab4ff"];
  for (const r of results) {
    const s = cellH / r.size.h;
    const cw = Math.round(r.size.w * s);
    const layers = [];
    for (const pi of r.partImages) {
      const meta = await sharp(pi.png).metadata();
      // sharp runs resize before composite whatever the call order: tint first (own pass), then shrink.
      const tintedFull = await sharp(pi.png)
        .composite([{ input: { create: { width: meta.width, height: meta.height, channels: 4, background: tint[pi.part] + "55" } }, blend: "atop" }])
        .png()
        .toBuffer();
      const tinted = await sharp(tintedFull)
        .resize(Math.max(1, Math.round(meta.width * s)), Math.max(1, Math.round(meta.height * s)))
        .png()
        .toBuffer();
      layers.push({ input: tinted, left: Math.round(pi.left * s), top: Math.round(pi.top * s) });
    }
    const a = r.anchors.norm;
    const P = (k) => [a[k].x * cw, a[k].y * cellH];
    const line = (k1, k2, col) => `<line x1="${P(k1)[0]}" y1="${P(k1)[1]}" x2="${P(k2)[0]}" y2="${P(k2)[1]}" stroke="${col}" stroke-width="3"/>`;
    const dots = Object.keys(a)
      .map((k) => `<circle cx="${P(k)[0]}" cy="${P(k)[1]}" r="5" fill="#ff2d55" stroke="#fff" stroke-width="2"/><text x="${P(k)[0] + 7}" y="${P(k)[1] + 4}" font-size="11" fill="#fff" font-family="sans-serif">${k}</text>`)
      .join("");
    const bones = line("sleeveTopL", "elbowL", "#ffd60a") + line("elbowL", "cuffL", "#ffd60a") + line("sleeveTopR", "elbowR", "#ffd60a") + line("elbowR", "cuffR", "#ffd60a");
    const overlay = Buffer.from(`<svg width="${cw}" height="${cellH}" xmlns="http://www.w3.org/2000/svg">${bones}${dots}</svg>`);
    let tw = cw;
    let th = cellH;
    for (const l of layers) {
      const meta = await sharp(l.input).metadata();
      tw = Math.max(tw, l.left + meta.width);
      th = Math.max(th, l.top + meta.height);
    }
    const tile = await sharp({ create: { width: tw, height: th, channels: 4, background: "#6b7280" } })
      .composite([...layers, { input: overlay }])
      .extract({ left: 0, top: 0, width: cw, height: cellH })
      .png()
      .toBuffer();
    tiles.push({ input: tile, left: x, top: 0 });
    x += cw + 10;
  }
  await sharp({ create: { width: x, height: cellH, channels: 4, background: "#374151" } }).composite(tiles).png().toFile(SHEET);
  console.log(`\nsheet -> ${SHEET}`);
}
writeFileSync(
  resolve(OUT, "README.md"),
  "Generated by scripts/make-cutouts.mjs from scripts/garments.manifest.json: each garment as three transparent parts (torso, viewer-left sleeve, viewer-right sleeve) with no backdrop and no hanger, used by the on-device tracker. Replace with real cutouts of the same names; part boxes and anchors live in src/data/garments.ts.\n",
);
