// Flags rendered images that are flat, near-black, blown-out or suspiciously small, and checks pins and files agree with meta.
//   node scripts/qa/image-audit.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const imgDir = join(root, "public/img");
const meta = JSON.parse(readFileSync(join(root, "src/data/generated/image-meta.json"), "utf8"));

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : p.endsWith(".webp") && files.push(p);
  }
})(imgDir);

const rows = [];
for (const f of files) {
  const key = f.slice(imgDir.length + 1, -5);
  const s = await sharp(f).stats();
  const px = s.channels.slice(0, 3);
  rows.push({
    key,
    mean: +(px.reduce((a, c) => a + c.mean, 0) / 3).toFixed(1),
    sd: +(px.reduce((a, c) => a + c.stdev, 0) / 3).toFixed(1),
    kb: Math.round(statSync(f).size / 1024),
  });
}

const problems = [];
for (const r of rows) {
  if (r.sd < 11) problems.push(`flat (sd ${r.sd}): ${r.key}`);
  if (r.mean < 22) problems.push(`near-black (mean ${r.mean}): ${r.key}`);
  if (r.mean > 240) problems.push(`blown-out (mean ${r.mean}): ${r.key}`);
  if (r.kb < 6) problems.push(`tiny (${r.kb} KB): ${r.key}`);
  if (!meta[r.key]) problems.push(`no meta entry: ${r.key}`);
}
for (const k of Object.keys(meta)) if (!rows.some((r) => r.key === k)) problems.push(`meta without file: ${k}`);
for (const [k, m] of Object.entries(meta)) for (const p of m.pins ?? []) if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) problems.push(`pin outside frame: ${k} ${p.id}`);

const kb = rows.map((r) => r.kb).sort((a, b) => a - b);
console.log(`images ${rows.length} · size KB min/median/p95/max ${kb[0]}/${kb[kb.length >> 1]}/${kb[Math.floor(kb.length * 0.95)]}/${kb.at(-1)} · total ${(kb.reduce((a, b) => a + b, 0) / 1024).toFixed(1)} MB`);
console.log(problems.length ? `\n${problems.length} problem(s):\n  ${problems.join("\n  ")}` : "\nNo flat, black, blown-out or orphaned images.");
process.exit(problems.length ? 1 : 0);
