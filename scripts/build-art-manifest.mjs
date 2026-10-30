// Builds the render manifest for the art engine from catalogue + scene data.
//   node scripts/build-art-manifest.mjs            → src/data/generated/art-manifest.json
//   node scripts/build-art-manifest.mjs --print    → summary only
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defs } from "../src/data/catalog-defs.ts";
import { hashString } from "../src/data/catalog.ts";
import { scenes } from "../src/data/scenes.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defById = Object.fromEntries(defs.map((d) => [d.id, d]));

const BG = {
  women: ["#efe6da", "#ebd8cf", "#e6dccb", "#e3d6c8", "#eadbd3"],
  men: ["#e4e1d8", "#dcdfdc", "#e6ddd0", "#d9ddd9"],
  kids: ["#f2e6c9", "#e9dfcf", "#e3e8d6", "#f0dcd2"],
  home: ["#e8dfd0", "#e3d8c6", "#ebe2d3"],
  acc: ["#e9dfd3", "#e0d4c4", "#d9d1c4", "#ecdcd3"],
};
const ACC_KINDS = new Set(["earrings", "necklace", "bangles", "bag", "sneaker", "heel", "flat", "boot"]);
const pickBg = (d) => {
  if (d.bg) return d.bg;
  const set = ACC_KINDS.has(d.art.kind) ? BG.acc : BG[d.path.split("/")[0]] ?? BG.women;
  return set[hashString(d.id) % set.length];
};

const seed = (...parts) => hashString(parts.join(":")) % 1_000_000;

// Garment kinds hang from a rail; everything else stands on the floor line.
const HANG = new Set(["dress", "kurta", "kurta-set", "saree", "top", "tee", "shirt", "trousers", "skirt", "jacket", "sweater", "lehenga", "anarkali", "dupatta", "jumpsuit", "coord", "shorts"]);
const SCALE = {
  dress: (a) => ({ maxi: 1, midi: 0.9, mini: 0.72 })[a.length] ?? 0.9,
  kurta: (a) => ({ calf: 0.92, knee: 0.82, short: 0.7 })[a.length] ?? 0.82,
  "kurta-set": () => 1,
  saree: () => 0.5,
  top: () => 0.5, tee: () => 0.52, shirt: () => 0.58, sweater: () => 0.58, jacket: () => 0.62,
  trousers: (a) => (a.length === "crop" ? 0.7 : 0.86),
  skirt: (a) => ({ maxi: 0.9, midi: 0.72, mini: 0.5 })[a.length] ?? 0.66,
  sneaker: () => 0.2, heel: () => 0.22, flat: () => 0.18, boot: () => 0.3,
  bag: (a) => (a.style === "tote" ? 0.34 : a.style === "potli" ? 0.22 : 0.28),
  earrings: () => 0.13, necklace: () => 0.22, bangles: () => 0.14,
  cushion: () => 0.3, throw: () => 0.3, vase: (a) => (a.style === "amphora" ? 0.42 : 0.3), candle: () => 0.2, bowl: () => 0.2, bedding: () => 0.34, frame: () => 0.4,
};

function productSpec(d, vi, shot) {
  const [, hex, , c2, pattern] = d.v[vi];
  const spec = { ...d.art, color: hex, shot, seed: seed(d.id, vi, shot), bg: pickBg(d) };
  if (c2) spec.color2 = c2;
  if (pattern) spec.pattern = pattern;
  return spec;
}

const jobs = [];
for (const d of defs) {
  d.v.forEach((_, vi) => {
    const shots = vi === 0 ? ["front", "alt", "detail"] : ["front", "alt"];
    for (const shot of shots) {
      jobs.push({ out: `products/${d.id}/v${vi + 1}-${shot}`, w: 1000, h: 1250, spec: productSpec(d, vi, shot) });
    }
  });
}

const FLOOR = 0.88;
const TOP = 0.1;
for (const s of scenes) {
  const items = s.items.map((it) => {
    const d = defById[it.product];
    if (!d) throw new Error(`scene ${s.key}: unknown product ${it.product}`);
    const vi = Math.min((it.v ?? 1) - 1, d.v.length - 1);
    const spec = productSpec(d, vi, "front");
    spec.bg = s.bg;
    const kind = d.art.kind;
    const hang = HANG.has(kind);
    const height = Math.min(0.92, it.height * (SCALE[kind]?.(d.art) ?? 0.6) * (s.scale ?? 1));
    const cy = hang ? TOP + height / 2 : FLOOR - height / 2;
    const out = { spec, cx: it.cx, cy: round(cy), height: round(height), anchor: hang ? "hang" : "floor", z: it.z };
    if (it.rot) out.rot = it.rot;
    if (it.pin) out.pin = it.product;
    return out;
  });
  jobs.push({
    out: `scenes/${s.key}`,
    w: s.w,
    h: s.h,
    scene: { bg: s.bg, bg2: s.bg2, motif: s.motif, motifColor: s.motifColor, safe: s.safe, rail: items.some((i) => i.anchor === "hang"), floorY: FLOOR, topY: TOP, items },
  });
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

const manifest = { generatedFrom: "src/data/catalog-defs.ts + src/data/scenes.ts", jobs };
if (process.argv.includes("--print")) {
  const counts = jobs.reduce((m, j) => ((m[j.out.split("/")[0]] = (m[j.out.split("/")[0]] || 0) + 1), m), {});
  console.log("jobs:", jobs.length, counts);
} else {
  const file = resolve(root, "src/data/generated/art-manifest.json");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(manifest));
  console.log(`wrote ${file} — ${jobs.length} jobs`);
}
