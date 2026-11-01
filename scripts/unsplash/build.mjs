// Stage 4 — cut every picture on the site from the picked photographs.
//   node scripts/unsplash/build.mjs [--only scenes/,launches/vrisa] [--plan] [--tracked-only]
//
// Keys, sizes and the metadata the UI reads (average colour, blur preview, wall/floor colours, shoppable pins) stay exactly as they are — only the pixels change — so no
// component needs to know. A key with no photo behind it (its group has nothing picked yet) keeps the picture it has. Writes:
//   public/img/<key>.webp                           the pictures (webp, quality lowered until each fits its size budget)
//   src/data/generated/image-meta.json              avg · blur · edge (wall / floor colours) · pins, recomputed for what was cut
//   src/data/generated/photo-assignments.json       key → photo id, for everything cut from Unsplash (scripts/placeholders/fill.mjs leaves these keys alone)
//   src/data/generated/photo-credits.json           what /credits shows: the photographs placed on the site, by photographer
//   .cache/unsplash/plan.json                       the windows used (for scripts/unsplash/review.mjs)
//
// Products share their pool's photos (slots.mjs). A product's front / close / detail views are three windows onto ONE photo, so a gallery shows one garment; each colour
// variant takes the photo whose centre colour is nearest the variant's colour (a usage penalty spreads photos over neighbouring cards). Windows are placed around each photo's
// focus point (manifest.mjs), never leave the photo, and are never enlarged beyond 1.5×. Sarees and other Indian wear are never mirrored.
// Wide banners put the subject right of centre (copy is on the left); a photo flagged `extend` gets its plain backdrop continued to make room (the seamless extension the
// studio photographs use), and every wide banner's copy area is measured: a heading must keep 3:1 contrast against what is behind it.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { defById, productById } from "../../src/data/catalog.ts";
import { extendCanvas, rng } from "../placeholders/lib.mjs";
import { ASSIGNMENTS_JSON, CACHE, CREDITS_JSON, UTM, exists, originalPath, readJson, root, writeJson } from "./lib.mjs";
import { loadManifest } from "./manifest.mjs";
import { H01, clamp, contrastRatio, cropAround, deltaE, hexToRgb, jitter, pinsFor, relLum } from "./crop.mjs";
import { BUDGET_KB, COPY_AREA, FRAMING, LAUNCH_GROUP, PLACEHOLDER_PHOTOS, PROMO_PHOTOS, SCENE_PHOTOS, WIDE_SUBJECT_AT, poolsOf, styleOf, usedFor } from "./slots.mjs";

const IMG = process.env.UNSPLASH_OUT ?? join(root, "public/img");
const META = process.env.UNSPLASH_META ?? join(root, "src/data/generated/image-meta.json");
const PLAN_JSON = join(CACHE, "plan.json");
const MAX_SCALE = 1.5; // output px per source px: beyond this a window turns soft
const MIN_Q = 62;
const START_Q = { product: 76, tall: 82, wide: 80, land: 82, promo: 78 };
const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(name);
  return i > -1 ? argv[i + 1] : null;
};
const ONLY = (arg("--only") ?? "").split(",").filter(Boolean);
const PLAN_ONLY = argv.includes("--plan");
const TRACKED_ONLY = argv.includes("--tracked-only"); // only photographs already reported to Unsplash (what an interim deploy may use while reports wait for the hourly API budget)
const warnings = [];
const notes = [];
const warn = (key, msg) => warnings.push(`${key}: ${msg}`);

// ── the library ────────────────────────────────────────────────────────────────────────────────────────────────
const manifest = loadManifest();
const PLACEHOLDERS = manifest.slots.placeholders ?? PLACEHOLDER_PHOTOS; // a library may re-map the home banners and the pop-ups (manifest.mjs → slots)
const PROMOS = manifest.slots.promo ?? PROMO_PHOTOS;
const have = new Map(); // id → photo with an original in the cache
const missing = new Set();
for (const [group, ids] of Object.entries(manifest.groups))
  for (const id of ids) {
    if (have.has(id) || missing.has(id)) continue;
    if (!manifest.photos[id]) continue;
    if (TRACKED_ONLY && !manifest.photos[id].tracked) continue;
    if (exists(originalPath(id))) have.set(id, { id, ...manifest.photos[id] });
    else missing.add(id);
  }
if (missing.size) console.log(`! ${missing.size} picked photo(s) have no original in the cache — run  npm run unsplash:download  (${[...missing].slice(0, 4).join(", ")}${missing.size > 4 ? ", …" : ""})`);
const photosIn = (group) => (manifest.groups[group] ?? []).map((id) => have.get(id)).filter(Boolean);

/** Dimensions, a probable focus point (sharp's attention strategy) and the colour at the middle of the subject — from a small decode of each photo. */
async function probe(p) {
  const file = originalPath(p.id);
  const md = await sharp(file).metadata();
  const swap = (md.orientation ?? 1) >= 5; // EXIF orientation 5–8 turns the picture on its side
  const [width, height] = swap ? [md.height, md.width] : [md.width, md.height];
  p.pw = width;
  p.ph = height;
  const small = await sharp(file).rotate().resize(300, 300, { fit: "cover", position: sharp.strategy.attention }).toBuffer({ resolveWithObject: true });
  const scale = Math.max(300 / width, 300 / height);
  p.auto = [clamp((-(small.info.cropOffsetLeft ?? 0) + (small.info.attentionX ?? 150)) / (width * scale), 0.25, 0.75), clamp((-(small.info.cropOffsetTop ?? 0) + (small.info.attentionY ?? 150)) / (height * scale), 0.25, 0.75)];
  const [fx, fy] = p.focus ?? p.auto;
  const thumb = await sharp(file).rotate().resize(120, 120, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = thumb;
  const x0 = Math.round(clamp(fx - 0.12, 0, 0.76) * info.width), x1 = Math.round(clamp(fx + 0.12, 0.24, 1) * info.width);
  const y0 = Math.round(clamp(fy - 0.12, 0, 0.76) * info.height), y1 = Math.round(clamp(fy + 0.16, 0.28, 1) * info.height);
  const sum = [0, 0, 0];
  let n = 0;
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      for (let c = 0; c < 3; c++) sum[c] += data[(y * info.width + x) * 3 + c];
      n++;
    }
  p.colour = sum.map((v) => v / Math.max(1, n));
}
for (const p of have.values()) await probe(p);
const focusOf = (p) => p.focus ?? p.auto;
const isLandscape = (p) => p.pw / p.ph >= 1.25;

// ── the plan: for every key, which photo and which window ──────────────────────────────────────────────────────
const meta = JSON.parse(readFileSync(META, "utf8"));
const keys = Object.keys(meta).filter((k) => k !== "promo/vrisa-teaser");
const plans = new Map();

// products: each colour variant takes the photo of its pool whose centre colour is nearest, spreading photos over neighbouring cards
const usage = {};
const assign = new Map(); // "<product>/v<n>" → { group, photo }
for (const prod of Object.values(productById)) {
  const def = defById[prod.id];
  const group = def && poolsOf(def).find((g) => photosIn(g).length);
  if (!group) continue;
  const pool = photosIn(group);
  prod.variants.forEach((v, i) => {
    const want = hexToRgb(v.colorHex);
    let best = null;
    for (const photo of pool) {
      const score = deltaE(photo.colour, want) + 14 * (usage[photo.id] ?? 0) + 6 * H01(`${prod.id}|${photo.id}`);
      if (!best || score < best.score) best = { photo, score };
    }
    usage[best.photo.id] = (usage[best.photo.id] ?? 0) + 1;
    assign.set(`${prod.id}/v${i + 1}`, { group, photo: best.photo });
  });
}

function planProduct(key, W, H) {
  const m = /^products\/([^/]+)\/v(\d+)-(\w+)$/.exec(key);
  const a = m && assign.get(`${m[1]}/v${m[2]}`);
  if (!a) return null;
  const style = styleOf(a.group);
  const fr = FRAMING[style.kind][m[3]] ?? FRAMING[style.kind].front;
  const f = focusOf(a.photo);
  return {
    photo: a.photo, group: a.group, role: m[3], ratio: W / H,
    fx: clamp(f[0] + jitter(m[1], "x", 0.025), 0.05, 0.95), fy: clamp(f[1] + fr.dy + jitter(m[1], "y", 0.02), 0.05, 0.95), atX: 0.5, atY: 0.5,
    zoom: fr.zoom * (1 + jitter(key, "z", 0.04)),
    flip: style.flip && H01(`${m[1]}|${m[2]}|flip`) < 0.5, // the same for all three views, so a gallery is one picture turned or not
  };
}

function planScene(key, W, H) {
  const m = /^scenes\/(.+?)(?:-(tall|wide|1|2))?$/.exec(key);
  const base = m && key.replace(/^scenes\//, "").replace(/-(tall|wide|1|2)$/, "");
  const rule = base && SCENE_PHOTOS[base];
  const list = rule ? photosIn(rule[0]) : [];
  if (!list.length) return null;
  const idx = rule.slice(1);
  const pick = (i) => list[(idx[i] ?? idx[0] ?? 0) % list.length];
  const kind = m[2] ?? "tall";
  let photo = pick(0);
  let zoom = 1;
  if (kind === "wide") photo = [pick(0), pick(1), pick(2)].find(isLandscape) ?? pick(0);
  else if (kind === "1") photo = idx.length > 1 ? pick(1) : pick(0);
  else if (kind === "2") {
    photo = idx.length > 2 ? pick(2) : idx.length > 1 ? pick(1) : pick(0);
    if (photo === pick(idx.length > 1 ? 1 : 0)) zoom = 1.35; // not enough photos for a different frame: a closer look at the same one
  }
  return windowPlan(photo, rule[0], kind === "wide" ? "wide" : kind, W, H, zoom);
}

function planLaunch(key, W, H) {
  const m = /^launches\/([^/]+)\/([\w-]+)$/.exec(key);
  const group = m && LAUNCH_GROUP[m[1]];
  const list = group ? photosIn(group) : [];
  if (!list.length) return null;
  const wideP = list.find(isLandscape) ?? list[0];
  const tallP = list.find((p) => !isLandscape(p) && p !== wideP) ?? list.find((p) => p !== wideP) ?? wideP;
  const rest = list.filter((p) => p !== wideP && p !== tallP);
  const frames = rest.length ? rest : [tallP, wideP];
  const role = m[2];
  const n = { g1: 0, g2: 1, g3: 2 }[role];
  if (role === "hero-wide") return windowPlan(wideP, group, "wide", W, H, 1);
  if (role === "hero-tall") return windowPlan(tallP, group, "front", W, H, tallP === wideP ? 1.15 : 1);
  if (role === "g4") return windowPlan(wideP, group, "land", W, H, 1);
  if (n === undefined) return null;
  const frame = frames[n % frames.length];
  return windowPlan(frame, group, frame.closeup ? "front" : ["front", "alt", "detail"][n], W, H, 1); // a photo that is already a close-up is used whole
}

function planPromo(key, W, H) {
  const m = /^promo\/([\w-]+)$/.exec(key);
  const rule = m && PROMOS[m[1]];
  const list = rule ? photosIn(rule[0]) : [];
  if (!list.length) return null;
  return windowPlan(list[rule[1] % list.length], rule[0], "promo", W, H, 1.1);
}

/** The home banners (placeholders/<subject>-<ratio>): the copy-left ratio puts the subject right of the copy, 16:9 and 3:2 are whole frames, the rest are portrait or square windows. */
function planPlaceholder(key, W, H) {
  const m = /^placeholders\/([a-z-]+?)-(3x4|4x5|1x1|16x9-copy-left|16x9|9x16|3x2)$/.exec(key);
  const rule = m && PLACEHOLDERS[m[1]];
  const list = rule ? photosIn(rule[0]) : [];
  if (!list.length) return null;
  const photo = list[rule[1] % list.length];
  if (m[2] === "16x9-copy-left") return windowPlan(photo, rule[0], "wide", W, H, 1);
  return windowPlan(photo, rule[0], m[2] === "16x9" || m[2] === "3x2" ? "land" : "tall", W, H, 1);
}

/** A window for scenes, launches and pop-ups: wide banners place the subject right of centre, everything else centres it. */
function windowPlan(photo, group, role, W, H, zoom) {
  const f = focusOf(photo);
  const style = styleOf(group);
  const fr = FRAMING[style.kind][role];
  const wide = role === "wide";
  return {
    photo, group, role, ratio: W / H, wide,
    fx: f[0], fy: clamp(f[1] + (fr?.dy ?? 0), 0.05, 0.95), atX: wide ? WIDE_SUBJECT_AT : 0.5, atY: 0.5,
    zoom: zoom * (fr?.zoom ?? 1), flip: false,
  };
}

for (const key of keys) {
  const { w: W, h: H } = meta[key];
  const plan = (key.startsWith("products/") ? planProduct : key.startsWith("scenes/") ? planScene : key.startsWith("launches/") ? planLaunch : key.startsWith("promo/") ? planPromo : key.startsWith("placeholders/") ? planPlaceholder : () => null)(key, W, H);
  if (plan) plans.set(key, plan);
}

// ── coverage ───────────────────────────────────────────────────────────────────────────────────────────────────
const groupOfKey = (k) => (k.startsWith("products/") ? "products/" : k.split("/")[0] + "/");
const cover = {};
for (const k of keys) {
  const c = (cover[groupOfKey(k)] ??= { all: 0, planned: 0 });
  c.all++;
  if (plans.has(k)) c.planned++;
}
const report = () => {
  console.log(Object.entries(cover).map(([g, c]) => `  ${g.padEnd(11)} ${String(c.planned).padStart(3)} / ${c.all}${c.planned < c.all ? "  (the rest keep their current picture)" : ""}`).join("\n"));
};
if (PLAN_ONLY) {
  console.log(`${have.size} photos in the library; planned pictures:`);
  report();
  process.exit(0);
}

// ── cutting ────────────────────────────────────────────────────────────────────────────────────────────────────
const kindOfKey = (key, W, H) => (key.startsWith("products/") ? "product" : key.startsWith("promo/") ? "promo" : W / H > 1.7 ? "wide" : W / H > 1.3 ? "land" : "tall");
const toHex = ([r, g, b]) => `#${[r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
const rawOpts = (W, H) => ({ raw: { width: W, height: H, channels: 3 } });

async function decode(photo) {
  const { data, info } = await sharp(originalPath(photo.id)).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (!photo.extend) return { raw: data, pw: info.width, ph: info.height, ow: info.width, oh: info.height, map: (p) => p, extended: false };
  // continue the plain backdrop on every side (at most 1400 px tall, so it stays quick), so a banner has room to put the subject where it wants it
  const scale = Math.min(1, 1400 / info.height);
  const sw = Math.round(info.width * scale), sh = Math.round(info.height * scale);
  const small = await sharp(data, rawOpts(info.width, info.height)).resize(sw, sh, { kernel: "lanczos3" }).raw().toBuffer();
  const pad = Math.round(Math.max(sw, sh) * 0.5);
  const ext = extendCanvas(Float32Array.from(small), sw, sh, 0.5, rng(Math.floor(H01(photo.id) * 1e9)), pad);
  return { raw: Buffer.from(Uint8ClampedArray.from(ext.data).buffer), pw: ext.w, ph: ext.h, ow: sw, oh: sh, pad, map: ([x, y]) => [(x * sw + pad) / ext.w, (y * sh + pad) / ext.h], extended: true };
}

async function regionStats(out, W, H, area) {
  const left = Math.round(area.x0 * W), top = Math.round(area.y0 * H);
  const width = Math.max(1, Math.round((area.x1 - area.x0) * W)), height = Math.max(1, Math.round((area.y1 - area.y0) * H));
  const { data, info } = await sharp(out, rawOpts(W, H)).extract({ left, top, width, height }).resize({ width: Math.min(64, width), fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
  const lum = [];
  const sum = [0, 0, 0];
  for (let i = 0; i < data.length; i += 3) {
    lum.push(relLum([data[i], data[i + 1], data[i + 2]]));
    for (let c = 0; c < 3; c++) sum[c] += data[i + c];
  }
  lum.sort((a, b) => a - b);
  const n = lum.length;
  return { rgb: sum.map((v) => v / n), p10: lum[Math.floor(n * 0.1)], p90: lum[Math.min(n - 1, Math.floor(n * 0.9))] };
}

/**
 * A wide banner's heading sits on the top-left of the picture in white or ink, whichever the wall's colour calls for (the site's rule, home/kit.tsx). If neither would keep 3:1
 * against the lightest (white type) or darkest (ink) tenth of that area, the whole picture is given a small uniform exposure change — the least that works, between ×0.7 and ×1.35 —
 * so the text stays readable. A uniform change, not an overlay: nothing is painted on the picture.
 */
async function fitCopy(out, W, H) {
  const judge = (w) => {
    const dark = relLum(w.rgb) < 0.28;
    return { dark, worst: dark ? contrastRatio(1, w.p90) : contrastRatio(w.p10, 0.012) };
  };
  const wall = await regionStats(out, W, H, COPY_AREA);
  const j = judge(wall);
  if (j.worst >= 3) return { out, wall, factor: 1, ...j };
  for (const f of [0.94, 1.06, 0.88, 1.12, 0.82, 1.2, 0.76, 1.3, 0.7, 1.35]) {
    const adj = await sharp(out, rawOpts(W, H)).modulate({ brightness: f }).raw().toBuffer();
    const w2 = await regionStats(adj, W, H, COPY_AREA);
    const j2 = judge(w2);
    if (j2.worst >= 3) return { out: adj, wall: w2, factor: f, ...j2 };
  }
  return { out, wall, factor: 1, ...j };
}

async function encode(out, W, H, kind) {
  const budget = BUDGET_KB[kind] * 1024;
  let q = START_Q[kind];
  let buf = await sharp(out, rawOpts(W, H)).webp({ quality: q, effort: 4 }).toBuffer();
  while (buf.length > budget && q > MIN_Q) {
    q -= 4;
    buf = await sharp(out, rawOpts(W, H)).webp({ quality: q, effort: 4 }).toBuffer();
  }
  if (buf.length > budget) warn("size", `a ${kind} picture stays at ${(buf.length / 1024).toFixed(0)} KB at quality ${q} (budget ${BUDGET_KB[kind]} KB)`);
  return buf;
}

const jobs = [...plans.entries()].filter(([k]) => !ONLY.length || ONLY.some((o) => k.startsWith(o))).sort(([ka, a], [kb, b]) => (a.photo.id < b.photo.id ? -1 : a.photo.id > b.photo.id ? 1 : ka < kb ? -1 : 1));
const assignments = readJson(ASSIGNMENTS_JSON, {});
const windows = readJson(PLAN_JSON, {});
let cut = 0;
let src = null;
let srcId = null;
for (const [key, plan] of jobs) {
  const { w: W, h: H } = meta[key];
  const old = meta[key];
  if (srcId !== plan.photo.id) {
    src = await decode(plan.photo);
    srcId = plan.photo.id;
  }
  const [fx, fy] = src.map([plan.fx, plan.fy]);
  let zoom = plan.zoom;
  if (src.extended) {
    // on an extended canvas a window is sized as it would be on the photograph itself (so the subject keeps its scale); a wide banner takes 35 % more, which is the room made for the copy
    const baseCanvas = Math.min(src.pw, src.ph * plan.ratio);
    // sideways only: the photograph's own top and bottom are never stretched (a figure cut by the bottom edge would smear), so a window is never taller than the photograph
    const wanted = plan.wide ? Math.min(1.35 * src.ow, plan.ratio * src.oh) : Math.min(src.ow, src.oh * plan.ratio) / plan.zoom;
    zoom = Math.max(1, baseCanvas / Math.min(wanted, baseCanvas));
  }
  const box = cropAround(src.pw, src.ph, plan.ratio, { fx, fy, atX: plan.atX, atY: plan.atY, zoom, minWidth: W / MAX_SCALE });
  if (src.extended && box.height <= src.oh) box.top = clamp(box.top, src.pad, src.pad + src.oh - box.height); // …and it stays inside the photograph's own rows
  if (plan.wide && !src.extended && plan.photo.pw / plan.photo.ph < 1.25) warn(key, `a portrait photo (${plan.photo.id}) in a wide slot: the subject cannot move right of the copy — flag it with  pick.mjs --extend ${plan.photo.id}  if its backdrop is plain, or choose a landscape photo`);
  if (plan.wide) {
    const at = (fx * src.pw - box.left) / box.width;
    if (at < 0.55) warn(key, `the subject sits at ${Math.round(at * 100)} % of the banner's width — the copy on the left would run over it. Choose a photo with the subject on the right, or flag a plain-backdrop photo with  pick.mjs --extend ${plan.photo.id}`);
  }
  const L = clamp(Math.round(box.left), 0, src.pw - 1), T = clamp(Math.round(box.top), 0, src.ph - 1); // rounded separately, a window could overshoot the photograph by a pixel
  const area = { left: L, top: T, width: Math.max(1, Math.min(Math.round(box.width), src.pw - L)), height: Math.max(1, Math.min(Math.round(box.height), src.ph - T)) };
  let img = sharp(src.raw, rawOpts(src.pw, src.ph)).extract(area).resize(W, H, { kernel: "lanczos3" });
  if (plan.flip) img = img.flop();
  if (box.width / W > 1.4) img = img.sharpen({ sigma: 0.6, m1: 0.4, m2: 0.6 }); // a large photo shrunk to a thumbnail needs a touch of sharpening
  let out = await img.raw().toBuffer();
  let fit = null;
  if (old.edge && W / H > 1.7 && /(-wide|-copy-left|\/hero-wide)$/.test(key)) {
    fit = await fitCopy(out, W, H); // banners that carry a heading (not the plain 16:9 frame)
    out = fit.out;
    if (fit.factor !== 1) notes.push(`${key}: exposure ×${fit.factor} so the ${fit.dark ? "white" : "dark"} heading keeps ${fit.worst.toFixed(1)}:1 over the picture`);
    else if (fit.worst < 3) warn(key, `the copy area is too busy for ${fit.dark ? "white" : "dark"} type: ${fit.worst.toFixed(1)}:1 at its ${fit.dark ? "brightest" : "darkest"} tenth even after an exposure change — choose a calmer photo or move its focus`);
  }
  const kind = kindOfKey(key, W, H);
  const file = join(IMG, `${key}.webp`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, await encode(out, W, H, kind));

  const all = await sharp(out, rawOpts(W, H)).stats();
  const m = { w: W, h: H, avg: toHex(all.channels.map((c) => c.mean)) };
  if (old.pins?.length) {
    const anchors = (plan.photo.anchors ?? []).map(src.map);
    const pins = pinsFor(box, src.pw, src.ph, anchors, old.pins.length, plan.flip);
    if (pins.some((p) => p.source === "fallback")) warn(key, `${pins.filter((p) => p.source === "fallback").length} pin(s) on fallback positions — set the photo's anchors:  pick.mjs --anchors ${plan.photo.id} x,y,productId x,y,productId …`);
    const spare = old.pins.map((p) => p.id).filter((id) => !pins.some((q) => q.id === id)); // the products the picture was meant to point at, for pins that name none
    m.pins = pins.map((p) => ({ id: p.id ?? spare.shift() ?? old.pins[0].id, x: +p.x.toFixed(4), y: +p.y.toFixed(4) }));
  }
  if (old.edge) {
    const wall = fit?.wall ?? null; // the heading's area, after any exposure change
    const strip = async (x0, x1, y0, y1) => toHex((await regionStats(out, W, H, { x0, x1, y0, y1 })).rgb);
    m.edge = {
      wall: [wall ? toHex(wall.rgb) : await strip(0, 0.04, 0.3, 0.5), await strip(0.96, 1, 0.3, 0.5)],
      floor: [await strip(0, 0.04, 0.9, 0.98), await strip(0.96, 1, 0.9, 0.98)],
      floorY: old.edge.floorY ?? 0.82,
    };
  }
  if (old.blur) m.blur = `data:image/webp;base64,${(await sharp(out, rawOpts(W, H)).resize(16, Math.max(2, Math.round((16 * H) / W))).webp({ quality: 25 }).toBuffer()).toString("base64")}`;
  meta[key] = m;
  assignments[key] = plan.photo.id;
  windows[key] = { photo: plan.photo.id, group: plan.group, role: plan.role, box: [box.left, box.top, box.width, box.height].map(Math.round), flip: plan.flip, extended: src.extended };
  cut++;
  if (cut % 100 === 0) console.log(`… ${cut}`);
}

const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
if (cut) {
  writeJson(META, sorted(meta));
  writeJson(ASSIGNMENTS_JSON, sorted(assignments));
  writeJson(PLAN_JSON, sorted(windows));
}

// ── credits: every photograph placed on the site, by photographer ──────────────────────────────────────────────
const link = (u) => (u ? `${u}${u.includes("?") ? "&" : "?"}${UTM}` : u);
const used = new Map();
for (const [key, id] of Object.entries(assignments)) {
  const p = manifest.photos[id];
  if (!p) continue;
  const pid = /^products\/([^/]+)\//.exec(key)?.[1];
  if (!used.has(id)) used.set(id, new Set());
  used.get(id).add(usedFor(key, pid && defById[pid]));
}
const credits = [...used.entries()]
  .map(([id, uses]) => {
    const p = manifest.photos[id];
    return { id, name: p.by?.name ?? "Unknown", username: p.by?.username ?? "", profile: link(p.by?.page), page: link(p.page), alt: p.alt ?? "", uses: [...uses].sort() };
  })
  .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
writeJson(CREDITS_JSON, credits);

console.log(`${cut} picture(s) cut from ${new Set(jobs.map(([, p]) => p.photo.id)).size} photo(s)${ONLY.length ? ` (only ${ONLY.join(", ")})` : ""}; the site now draws ${Object.keys(assignments).length} picture(s) from Unsplash`);
report();
console.log(`credits: ${credits.length} photo(s) by ${new Set(credits.map((c) => c.name)).size} photographer(s)`);
if (notes.length) console.log(`\n${notes.length} banner(s) given a uniform exposure change for heading contrast:\n${notes.map((w) => `  · ${w}`).join("\n")}`);
if (warnings.length) console.log(`\n${warnings.length} warning(s):\n${warnings.map((w) => `  ! ${w}`).join("\n")}`);
