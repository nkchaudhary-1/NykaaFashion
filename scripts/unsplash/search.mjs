// Stage 1 — find candidates. For every group (or the ones asked for) run its queries against Unsplash's search API (cached), keep the usable results, fetch small
// thumbnails from the image CDN (not an API call) and lay them out as numbered contact sheets to look at.
//
//   node scripts/unsplash/search.mjs [--phase A|B] [--group id,id] [--limit 20] [--refresh] [--no-sheets]
//
// Output (all under .cache/unsplash, ignored by git):
//   search/<hash>.json         one API response per query (so re-running costs nothing)
//   candidates/<group>.json    the usable candidates in order — the numbers on the sheets are positions in this list (1-based)
//   thumbs/<id>.jpg            400 px thumbnails
//   sheets/<group>-<n>.jpg     numbered thumbnails, 20–30 per sheet (portrait 20 · squarish 25 · landscape 30); a green number = already picked
import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { GROUPS } from "./groups.mjs";
import { CACHE, api, apiCalls, cdn, exists, fetchBuffer, hash, isFree, readJson, reexecWithProxy, writeJson } from "./lib.mjs";
import { loadManifest } from "./manifest.mjs";
import { contactSheet } from "./sheet.mjs";

reexecWithProxy(); // reaches Unsplash through the environment's proxy when there is one (see lib.mjs)

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
};
const flag = (name) => process.argv.includes(name);
const REFRESH = flag("--refresh");
const LIMIT = Number(arg("--limit") ?? 20);
// a sheet's cells follow the photos' orientation, so a sheet stays about 1500 px on a side
const SHEET = { landscape: { cellH: 210, perSheet: 30 }, portrait: { cellH: 380, perSheet: 20 }, squarish: { cellH: 300, perSheet: 25 } };
const MAX_PER_PHOTOGRAPHER = 3;

const DIR = { search: join(CACHE, "search"), cand: join(CACHE, "candidates"), thumbs: join(CACHE, "thumbs"), sheets: join(CACHE, "sheets") };
for (const d of Object.values(DIR)) mkdirSync(d, { recursive: true });

// Names that mean a visible logo or lettering somewhere in the picture (Unsplash's own descriptions mention them).
const BRANDS = /\b(nike|adidas|puma|reebok|zara|gucci|prada|chanel|louis vuitton|dior|h&m|apple|starbucks|coca[- ]?cola|pepsi|levi'?s|converse|vans|new balance|under armou?r|supreme|balenciaga|fendi|burberry|versace|ralph lauren|tommy|calvin klein|lacoste|uniqlo|mcdonald'?s|amazon|google|samsung|nykaa|logo|billboard|sign)\b/i;

/** The few fields we keep from an API photo — enough to show, pick, credit and download it. */
const slim = (p) => ({
  id: p.id,
  w: p.width,
  h: p.height,
  color: p.color,
  alt: p.alt_description ?? p.description ?? "",
  urls: { raw: p.urls?.raw },
  page: p.links?.html,
  dl: p.links?.download_location,
  by: { name: p.user?.name, username: p.user?.username, page: p.user?.links?.html },
  premium: !!p.premium,
  plus: !!p.plus,
  sponsored: !!p.sponsorship,
  likes: p.likes ?? 0,
});

async function searchQuery(query, orientation) {
  const file = join(DIR.search, `${hash(`${query}|${orientation}`)}.json`);
  if (!REFRESH && exists(file)) return readJson(file);
  const res = await api("/search/photos", { query, orientation, content_filter: "high", order_by: "relevant", per_page: 30, page: 1 });
  const out = { query, orientation, at: new Date().toISOString(), total: res.total, results: (res.results ?? []).map(slim) };
  writeJson(file, out);
  return out;
}

/** Is this photo usable for the group's slot at all? (the picking by eye comes after) */
function usable(p, g) {
  if (!p.id || !p.dl || !isFree(p) || p.sponsored) return false;
  if (Math.max(p.w, p.h) < 2000) return false;
  const r = p.w / p.h;
  if (g.orientation === "portrait" && r > 0.95) return false;
  if (g.orientation === "landscape" && r < 1.2) return false;
  if (g.orientation === "squarish" && (r < 0.7 || r > 1.45)) return false;
  if (BRANDS.test(p.alt)) return false;
  return true;
}

async function candidatesFor(g) {
  const out = [];
  const seen = new Set();
  const byPhotographer = {};
  for (const q of g.queries) {
    if (out.length >= LIMIT) break; // enough already: the later queries are kept for when a group needs topping up
    const res = await searchQuery(q, g.orientation);
    for (const p of res.results) {
      if (out.length >= LIMIT) break;
      if (seen.has(p.id) || !usable(p, g)) continue;
      const who = p.by.username ?? "?";
      if ((byPhotographer[who] ?? 0) >= MAX_PER_PHOTOGRAPHER) continue;
      seen.add(p.id);
      byPhotographer[who] = (byPhotographer[who] ?? 0) + 1;
      out.push({ ...p, query: q });
    }
  }
  return out;
}

async function pool(items, n, fn) {
  let next = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (next < items.length) await fn(items[next++]);
    }),
  );
}

async function thumb(p) {
  const file = join(DIR.thumbs, `${p.id}.jpg`);
  if (exists(file)) return file;
  writeFileSync(file, await fetchBuffer(cdn(p, { w: 400, q: 70, fm: "jpg", fit: "max" })));
  return file;
}

const only = arg("--group")?.split(",");
const phase = arg("--phase");
const groups = GROUPS.filter((g) => (only ? only.includes(g.id) : phase ? g.phase === phase.toUpperCase() : true));
if (!groups.length) {
  console.error(`no group matches ${only ?? phase}. Known: ${GROUPS.map((g) => g.id).join(", ")}`);
  process.exit(1);
}
const manifest = loadManifest();

for (const g of groups) {
  const cands = await candidatesFor(g);
  writeJson(join(DIR.cand, `${g.id}.json`), cands);
  console.log(`\n${g.id.padEnd(13)} ${cands.length} candidates · want ${g.want} · ${g.title}`);
  if (cands.length < g.want * 2) console.log(`  ! thin: only ${cands.length} usable — add queries in groups.mjs or relax the brief`);
  if (flag("--no-sheets")) continue;
  const failed = [];
  await pool(cands, 6, async (p) => {
    try {
      await thumb(p);
    } catch (e) {
      failed.push(p.id);
      console.log(`  thumbnail failed for ${p.id}: ${e.message}`);
    }
  });
  const picked = new Set(manifest.groups[g.id] ?? []);
  const { cellH, perSheet } = SHEET[g.orientation];
  for (let s = 0; s * perSheet < cands.length; s++) {
    const part = cands.slice(s * perSheet, (s + 1) * perSheet);
    const cells = part.map((p, i) => ({ input: join(DIR.thumbs, `${p.id}.jpg`), label: s * perSheet + i + 1, sub: `${p.w}×${p.h} · ${(p.by.name ?? "").slice(0, 22)}`, mark: picked.has(p.id) }));
    const file = join(DIR.sheets, `${g.id}-${s + 1}.jpg`);
    writeFileSync(file, await contactSheet(cells, { cols: 5, cellW: 300, cellH }));
    console.log(`  sheet ${file}`);
  }
}
console.log(`\n${apiCalls()} API call(s) this run.`);
