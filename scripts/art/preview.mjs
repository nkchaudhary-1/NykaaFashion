#!/usr/bin/env node
// Contact-sheet builder.
//   node scripts/art/preview.mjs <manifest.json> --out <sheet.png> [--cols 6] [--only …] [--cell 300] [--concurrency 4]
// Renders every job at reduced size and tiles them, labelling each cell with its `out` id.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from './lib/pool.mjs';
import { sharp } from './lib/raster.mjs';
import { matchOnly } from './lib/args.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) { const t = argv[i]; if (t.startsWith('--')) a[t.slice(2)] = argv[++i]; else a._.push(t); }
  return a;
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args._[0] || !args.out) { console.log('usage: node scripts/art/preview.mjs <manifest.json> --out <sheet.png> [--cols 6] [--only …] [--cell 300] [--concurrency 4]'); process.exit(1); }
  const manifest = JSON.parse(fs.readFileSync(path.resolve(args._[0]), 'utf8'));
  const jobs = (manifest.jobs || []).filter((j) => matchOnly(args.only, j.out) && (j.spec || j.scene));
  if (!jobs.length) { console.log('no jobs matched'); return; }
  const cols = Math.max(1, parseInt(args.cols || '6', 10));
  const cellW = parseInt(args.cell || '300', 10);
  const conc = Math.max(1, parseInt(args.concurrency || '4', 10));
  const pool = new Pool(path.join(HERE, 'worker.mjs'), conc);
  const t0 = Date.now();
  const tiles = new Array(jobs.length);
  let done = 0;
  await Promise.all(jobs.map(async (job, i) => {
    const aspect = (job.h || 1250) / (job.w || 1000);
    const w = Math.round(cellW * 1.0), h = Math.round(cellW * aspect);
    try {
      // render at 2x the cell size so downsampling keeps the grain/detail honest, capped for speed
      const rw = Math.min(job.w || 1000, cellW * 2), rh = Math.round(rw * aspect);
      const r = await pool.run({ type: 'raw', job, w: rw, h: rh });
      let buf = await sharp(Buffer.from(r.png)).resize(w, h, { kernel: 'lanczos3' }).png().toBuffer();
      if (r.pins && r.pins.length) { // debug: draw pin dots (white ring, dark core) so placement can be checked by eye
        const dots = r.pins.map((p) => `<circle cx="${(p.x * w).toFixed(1)}" cy="${(p.y * h).toFixed(1)}" r="9" fill="#e11d48" stroke="#fff" stroke-width="3"/>`).join('');
        buf = await sharp(buf).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${dots}</svg>`), left: 0, top: 0 }]).png().toBuffer();
      }
      tiles[i] = { buf, w, h };
    } catch (e) { console.error(`! ${job.out}: ${String(e.message).split('\n')[0]}`); tiles[i] = null; }
    if (process.stdout.isTTY) process.stdout.write(`\r${++done}/${jobs.length}  `); else ++done;
  }));
  await pool.close();
  const gap = 14, label = 26;
  const rowsN = Math.ceil(jobs.length / cols);
  const cellH = Math.max(...tiles.filter(Boolean).map((t) => t.h));
  const W = cols * cellW + (cols + 1) * gap, H = rowsN * (cellH + label) + (rowsN + 1) * gap;
  let text = '';
  const comps = [];
  jobs.forEach((job, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const x = gap + c * (cellW + gap), y = gap + r * (cellH + label + gap);
    if (tiles[i]) comps.push({ input: tiles[i].buf, left: x, top: y });
    text += `<text x="${x}" y="${y + cellH + 17}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="12" fill="#4a4540">${esc(job.out)}</text>`;
  });
  const bg = sharp({ create: { width: W, height: H, channels: 3, background: '#EFEBE4' } });
  const labels = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${text}</svg>`);
  const out = path.resolve(args.out);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await bg.composite([...comps, { input: labels, left: 0, top: 0 }]).png().toFile(out);
  console.log(`\nwrote ${out}  (${jobs.length} cells, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
