#!/usr/bin/env node
// Art engine CLI.
//   node scripts/art/render.mjs <manifest.json> [--only id1,id2|prefix*] [--concurrency 4] [--out public/img]
//                               [--meta src/data/generated/image-meta.json] [--quality 80] [--skip-existing]
// Writes <out>/<job.out>.webp and merges image-meta.json ({ w, h, avg, pins?, blur? }).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from './lib/pool.mjs';
import { matchOnly } from './lib/args.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) {
      const k = t.slice(2);
      if (['skip-existing', 'quiet', 'help'].includes(k)) a[k] = true;
      else a[k] = argv[++i];
    } else a._.push(t);
  }
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args._[0]) {
    console.log('usage: node scripts/art/render.mjs <manifest.json> [--only id1,id2|prefix*] [--concurrency 4] [--out public/img] [--meta src/data/generated/image-meta.json] [--quality 80] [--skip-existing]');
    process.exit(args.help ? 0 : 1);
  }
  const manifestPath = path.resolve(args._[0]);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const outDir = path.resolve(args.out || path.join(ROOT, 'public/img'));
  const metaPath = path.resolve(args.meta || path.join(ROOT, 'src/data/generated/image-meta.json'));
  const conc = Math.max(1, parseInt(args.concurrency || '4', 10));
  const quality = parseInt(args.quality || '80', 10);

  const seen = new Set();
  let jobs = (manifest.jobs || []).filter((j) => {
    if (!j.out) throw new Error('every job needs an "out" id');
    if (seen.has(j.out)) { console.warn(`! duplicate out "${j.out}" – keeping the first`); return false; }
    seen.add(j.out);
    return matchOnly(args.only, j.out);
  });
  const total = jobs.length;
  if (!total) { console.log('no jobs matched'); return; }

  let meta = {};
  if (fs.existsSync(metaPath)) { try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch { meta = {}; } }
  const saveMeta = () => {
    fs.mkdirSync(path.dirname(metaPath), { recursive: true });
    const sorted = Object.fromEntries(Object.keys(meta).sort().map((k) => [k, meta[k]]));
    const tmp = metaPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(sorted, null, 1) + '\n');
    fs.renameSync(tmp, metaPath);
  };

  const pool = new Pool(path.join(HERE, 'worker.mjs'), conc);
  const t0 = Date.now();
  let done = 0, bytes = 0, skipped = 0, failed = [];
  const log = (s) => { if (!args.quiet) process.stdout.write(s); };

  await Promise.all(jobs.map(async (job) => {
    const file = path.join(outDir, job.out + '.webp');
    if (args['skip-existing'] && fs.existsSync(file) && meta[job.out]) { skipped++; done++; return; }
    try {
      const r = await pool.run({ type: 'job', job, opts: { quality } });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(r.webp));
      bytes += r.webp.length;
      const m = { w: r.w, h: r.h, avg: r.avg };
      if (r.pins) m.pins = r.pins;
      if (r.edge) m.edge = r.edge;
      if (r.blur) m.blur = r.blur;
      meta[job.out] = m;
    } catch (e) {
      failed.push([job.out, String(e.message || e).split('\n')[0]]);
      console.error(`\n! ${job.out}: ${String(e.message || e).split('\n').slice(0, 3).join(' | ')}`);
    }
    done++;
    if (done % 10 === 0) saveMeta();
    const el = (Date.now() - t0) / 1000;
    const msg = `${done}/${total}  ${(done / Math.max(el, 0.1)).toFixed(2)} img/s  eta ${Math.max(0, Math.round((total - done) / Math.max(done / el, 0.01)))}s`;
    if (process.stdout.isTTY) log(`\r${msg}   `); else if (done % 25 === 0 || done === total) log(msg + '\n');
  }));
  saveMeta();
  await pool.close();
  const el = (Date.now() - t0) / 1000;
  const rendered = total - skipped - failed.length;
  console.log(`\nrendered ${rendered}/${total} in ${el.toFixed(1)}s  avg ${(bytes / Math.max(rendered, 1) / 1024).toFixed(1)} KB  -> ${path.relative(process.cwd(), outDir) || '.'}  meta: ${path.relative(process.cwd(), metaPath)}${skipped ? `  (skipped ${skipped})` : ''}`);
  if (failed.length) { console.error(`${failed.length} failed`); process.exit(1); }
}
main().catch((e) => { console.error(e); process.exit(1); });
