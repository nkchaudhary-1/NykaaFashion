// Stage 5 — look at what was built (nothing is accepted unseen), and read positions off a photo.
//
//   node scripts/unsplash/review.mjs <key prefix>          contact sheets of the built pictures whose key starts with it:  scenes/edit  ·  launches/vrisa  ·  products/twd  ·  promo
//   node scripts/unsplash/review.mjs pool:<group>          every product picture the build made from a group's photos:  pool:p-dress
//   node scripts/unsplash/review.mjs --photo <id> [<id>…]  a large preview of a picked photo with a 10 % grid, its focus (+) and anchors (numbered), to read coordinates from
//   options: --all (also the pictures still cut from the two supplied photographs) · --cols N
// Sheets go to .cache/unsplash/review/. Shoppable pins are drawn as yellow dots with the product they name. A label is the key (after its prefix); the caption is the photo behind it ( ⇄ = mirrored, ⤢ = backdrop extended ).
import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { ASSIGNMENTS_JSON, CACHE, originalPath, readJson, root } from "./lib.mjs";
import { loadManifest } from "./manifest.mjs";
import { contactSheet } from "./sheet.mjs";

const IMG = process.env.UNSPLASH_OUT ?? join(root, "public/img");
const META = process.env.UNSPLASH_META ?? join(root, "src/data/generated/image-meta.json");
const OUT = join(CACHE, "review");
mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const manifest = loadManifest();

if (args[0] === "--photo") {
  const ids = args.slice(1).filter((a) => !a.startsWith("--"));
  if (!ids.length) {
    console.error("usage: review.mjs --photo <id> [<id> …]");
    process.exit(1);
  }
  for (const id of ids) {
    const p = manifest.photos[id];
    if (!p) {
      console.error(`${id} is not in the manifest`);
      continue;
    }
    const base = await sharp(originalPath(id)).rotate().resize(900, 900, { fit: "inside" }).jpeg({ quality: 88 }).toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = base.info;
    const line = (x1, y1, x2, y2, big) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-opacity="${big ? 0.75 : 0.45}" stroke-width="1"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-opacity="0.25" stroke-width="1" transform="translate(1 1)"/>`;
    const lab = (x, y, t, anchor = "start") => `<text x="${x}" y="${y}" font-family="Inter, DejaVu Sans, sans-serif" font-size="13" font-weight="700" text-anchor="${anchor}" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">${t}</text>`;
    let svg = "";
    for (let i = 1; i < 10; i++) {
      svg += line((W * i) / 10, 0, (W * i) / 10, H, i === 5) + line(0, (H * i) / 10, W, (H * i) / 10, i === 5);
      svg += lab((W * i) / 10 + 3, 14, `.${i}`) + lab(3, (H * i) / 10 - 3, `.${i}`);
    }
    if (p.focus) svg += `<circle cx="${p.focus[0] * W}" cy="${p.focus[1] * H}" r="9" fill="none" stroke="#ff2d7a" stroke-width="3"/>${line(p.focus[0] * W - 16, p.focus[1] * H, p.focus[0] * W + 16, p.focus[1] * H, true)}${line(p.focus[0] * W, p.focus[1] * H - 16, p.focus[0] * W, p.focus[1] * H + 16, true)}`;
    (p.anchors ?? []).forEach(([x, y, pid], i) => (svg += `<circle cx="${x * W}" cy="${y * H}" r="11" fill="#ffd400" stroke="#000" stroke-width="2"/>${lab(x * W, y * H + 5, i + 1, "middle").replace('fill="#fff" stroke="#000"', 'fill="#000" stroke="none"')}${pid ? lab(x * W + 15, y * H + 5, pid) : ""}`));
    const file = join(OUT, `photo-${id}.jpg`);
    writeFileSync(file, await sharp(base.data).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg}</svg>`) }]).jpeg({ quality: 88 }).toBuffer());
    console.log(`${file}   ${p.w}×${p.h} · focus ${p.focus ? p.focus.join(",") : "auto"} · ${p.anchors?.length ?? 0} anchors${p.extend ? " · extend" : ""} · ${p.by?.name ?? ""}`);
  }
  process.exit(0);
}

const target = args.find((a) => !a.startsWith("--") && a !== val("--cols"));
if (!target) {
  console.error("usage: review.mjs <key prefix> | pool:<group> | --photo <id> …   (see the header of this file)");
  process.exit(1);
}
const meta = readJson(META, {});
const assigned = readJson(ASSIGNMENTS_JSON, {});
const plan = readJson(join(CACHE, "plan.json"), {});
const pool = target.startsWith("pool:") ? target.slice(5) : null;
const keys = Object.keys(meta)
  .filter((k) => (pool ? plan[k]?.group === pool : k.startsWith(target)))
  .filter((k) => flag("--all") || assigned[k])
  .sort();
if (!keys.length) {
  console.log(`nothing built from Unsplash matches ${target}${flag("--all") ? "" : " (use --all to include the pictures still cut from the two supplied photographs)"}`);
  process.exit(0);
}
// a sheet holds one shape of picture (wide 16:9 · 3:2 · tall or square), so a cell never crops what it shows
const shapeOf = (k) => {
  const r = meta[k].w / meta[k].h;
  return r > 1.7 ? "wide" : r > 1.3 ? "land" : "tall";
};
const slug = target.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
const strip = pool ? "products/" : target;
for (const shape of ["wide", "land", "tall"]) {
  const ofShape = keys.filter((k) => shapeOf(k) === shape);
  if (!ofShape.length) continue;
  const ratio = shape === "wide" ? 16 / 9 : shape === "land" ? 3 / 2 : 4 / 5;
  const cols = Number(val("--cols") ?? (shape === "tall" ? 5 : 3));
  const cellW = Math.floor((1500 - 6 * (cols + 1)) / cols);
  const cellH = Math.round(cellW / ratio);
  const perSheet = cols * Math.max(1, Math.floor(1500 / (cellH + 6)));
  for (let s = 0; s * perSheet < ofShape.length; s++) {
    const part = ofShape.slice(s * perSheet, (s + 1) * perSheet);
    const cells = part.map((k) => ({
      input: join(IMG, `${k}.webp`),
      label: k.replace(strip, "").slice(0, 30),
      sub: assigned[k] ? `${plan[k]?.photo ?? assigned[k]}${plan[k]?.flip ? " ⇄" : ""}${plan[k]?.extended ? " ⤢" : ""} · ${plan[k]?.group ?? ""}` : "supplied photograph (fallback)",
      mark: !!assigned[k],
      dots: (meta[k].pins ?? []).map((p) => ({ x: p.x, y: p.y, label: p.id })),
    }));
    const file = join(OUT, `${slug}-${shape}-${s + 1}.jpg`);
    writeFileSync(file, await contactSheet(cells, { cols, cellW, cellH, fit: "cover", labelSize: 13 }));
    console.log(`${file}   (${part.length} ${shape} pictures)`);
  }
}
