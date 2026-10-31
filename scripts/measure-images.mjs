// Registers pictures that are already on disk: measures size, average colour, edge colours (hero-wide pictures) and the blur preview (hero pictures)
// and writes them into src/data/generated/image-meta.json — what the app needs to place a picture without layout shift and to choose text colours over it.
// Use it when you replace a placeholder with real photography, or add a new brand's campaign pictures:
//   1. put the files at public/img/launches/<brand-id>/<name>.webp   (hero-wide, hero-tall, g1 … g6 — any names you list in src/data/launches.ts)
//   2. node scripts/measure-images.mjs launches/<brand-id>
//   usage: node scripts/measure-images.mjs <key-prefix>        e.g. launches/vrisa  or  products/vri-01
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import sharp from "sharp";
import { hex, regionHex, root } from "./placeholders/lib.mjs";

const prefix = process.argv[2];
if (!prefix) {
  console.error("usage: node scripts/measure-images.mjs <key-prefix>   e.g. launches/vrisa");
  process.exit(1);
}
const IMG = join(root, "public/img");
const META = join(root, "src/data/generated/image-meta.json");
const meta = JSON.parse(readFileSync(META, "utf8"));

const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : n.endsWith(".webp") ? [join(dir, n)] : []));
let base;
try {
  base = join(IMG, prefix);
  statSync(base);
} catch {
  base = null;
}
const files = base ? (statSync(base).isDirectory() ? walk(base) : [base]) : walk(IMG).filter((f) => relative(IMG, f).startsWith(prefix));
if (!files.length) {
  console.error(`no .webp pictures under public/img/${prefix}`);
  process.exit(1);
}

for (const file of files.sort()) {
  const key = relative(IMG, file).replace(/\.webp$/, "").split("\\").join("/");
  const img = sharp(file);
  const { width: w, height: h } = await img.metadata();
  const png = await img.png().toBuffer();
  const st = await sharp(png).stats();
  const m = { w, h, avg: hex(st.channels[0].mean, st.channels[1].mean, st.channels[2].mean) };
  if (/hero-wide$/.test(key)) {
    m.edge = {
      wall: [await regionHex(png, 0, h * 0.3, w * 0.04, h * 0.2), await regionHex(png, w * 0.96, h * 0.3, w * 0.04, h * 0.2)],
      floor: [await regionHex(png, 0, h * 0.9, w * 0.04, h * 0.08), await regionHex(png, w * 0.96, h * 0.9, w * 0.04, h * 0.08)],
      floorY: 0.82,
    };
  }
  if (/hero-/.test(key)) m.blur = `data:image/webp;base64,${(await sharp(png).resize(16, Math.max(2, Math.round((16 * h) / w))).webp({ quality: 25 }).toBuffer()).toString("base64")}`;
  if (meta[key]?.pins) m.pins = meta[key].pins; // pin positions are authored, never measured
  meta[key] = m;
  console.log(`${key}  ${w}×${h}  ${m.avg}${m.edge ? "  edge" : ""}${m.blur ? "  blur" : ""}`);
}
writeFileSync(META, JSON.stringify(Object.fromEntries(Object.entries(meta).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))), null, 1) + "\n");
console.log(`${files.length} picture(s) registered in src/data/generated/image-meta.json`);
