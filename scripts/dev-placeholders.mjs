// Writes lightweight tonal placeholder images for every manifest job that has no file yet,
// so UI work is never blocked on the art engine. Real renders (scripts/art) overwrite them in place.
//   node scripts/dev-placeholders.mjs [--force]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(resolve(root, "src/data/generated/art-manifest.json"), "utf8"));
const metaFile = resolve(root, "src/data/generated/image-meta.json");
const meta = existsSync(metaFile) ? JSON.parse(readFileSync(metaFile, "utf8")) : {};
const force = process.argv.includes("--force");

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const shade = (h, f) => "#" + hexToRgb(h).map((v) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, "0")).join("");

function svgFor(job) {
  const { w, h } = job;
  const bg = job.spec?.bg ?? job.scene?.bg ?? "#e9e0d3";
  let shapes = "";
  const garment = (cx, cy, hh, color, i = 0, kind = "dress") => {
    const gw = hh * (kind === "bag" || kind === "sneaker" || kind === "heel" ? 1.1 : 0.55);
    const x = cx - gw / 2, y = cy - hh / 2;
    return `<g><ellipse cx="${cx}" cy="${y + hh + 6}" rx="${gw * 0.5}" ry="${hh * 0.03}" fill="#000" opacity=".12"/>
      <path d="M${x + gw * 0.2} ${y} L${x + gw * 0.8} ${y} L${x + gw} ${y + hh} L${x} ${y + hh} Z" fill="url(#g${i})"/>
      <defs><linearGradient id="g${i}" x1="0" x2="1"><stop offset="0" stop-color="${shade(color, 1.1)}"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, 0.82)}"/></linearGradient></defs></g>`;
  };
  if (job.spec) {
    const s = job.spec;
    const hh = h * (s.shot === "detail" ? 1.1 : 0.7);
    shapes = garment(w / 2 + (s.shot === "alt" ? w * 0.02 : 0), h * 0.5, hh, s.color, 0, s.kind);
    if (s.shot === "detail") shapes += `<rect width="${w}" height="${h}" fill="url(#st)" opacity=".25"/><defs><pattern id="st" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 40L40 0" stroke="${s.color2 ?? "#fff"}" stroke-width="3"/></pattern></defs>`;
  } else {
    job.scene.items.forEach((it, i) => (shapes += garment(it.cx * w, it.cy * h, it.height * h, it.spec.color, i, it.spec.kind)));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="bg" cx=".5" cy=".35" r=".9"><stop offset="0" stop-color="${shade(bg, 1.05)}"/><stop offset="1" stop-color="${shade(bg, 0.93)}"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/>${shapes}</svg>`;
}

let wrote = 0;
for (const job of manifest.jobs) {
  const file = resolve(root, "public/img", `${job.out}.webp`);
  if (!force && existsSync(file)) continue;
  mkdirSync(dirname(file), { recursive: true });
  const img = sharp(Buffer.from(svgFor(job))).webp({ quality: 60 });
  const buf = await img.toBuffer();
  writeFileSync(file, buf);
  const { channels } = await sharp(buf).stats();
  const avg = "#" + channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, "0")).join("");
  meta[job.out] = { ...(meta[job.out] ?? {}), w: job.w, h: job.h, avg, placeholder: true };
  if (job.scene) meta[job.out].pins = job.scene.items.filter((i) => i.pin).map((i) => ({ id: i.pin, x: i.cx, y: i.cy }));
  wrote++;
}
writeFileSync(metaFile, JSON.stringify(meta));
console.log(`placeholders written: ${wrote} (of ${manifest.jobs.length})`);
