// Cross-reference checks across all prototype data. Usage: node scripts/validate-data.mjs
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { products, productById, launchProducts, productBySlug } from "../src/data/catalog.ts";
import { launches, launchById } from "../src/data/launches.ts";
import { labelById, labels } from "../src/data/labels.ts";
import { categoryById } from "../src/data/categories.ts";
import { edits, editById } from "../src/data/edits.ts";
import { stories } from "../src/data/stories.ts";
import { scenes, sceneByKey } from "../src/data/scenes.ts";
import { editProducts } from "../src/data/queries.ts";
import { TRENDING_SEARCHES } from "../src/data/content.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const err = (m) => errors.push(m);

for (const p of products) {
  if (!labelById[p.labelId]) err(`product ${p.id}: unknown label ${p.labelId}`);
  if (!categoryById[p.categoryPath.join("/")]) err(`product ${p.id}: unknown category ${p.categoryPath.join("/")}`);
  if (p.mrp < p.price) err(`product ${p.id}: mrp < price`);
}
for (const s of stories) {
  if (s.editId && !editById[s.editId]) err(`story ${s.id}: unknown edit ${s.editId}`);
  for (const id of s.productIds) if (!productById[id]) err(`story ${s.id}: unknown product ${id}`);
  for (const b of s.blocks) {
    if (b.t === "rail") for (const id of b.productIds) if (!productById[id]) err(`story ${s.id}: rail product ${id}`);
    if (b.t === "scene" && !sceneByKey[b.scene.replace(/^scenes\//, "")]) err(`story ${s.id}: scene ${b.scene} missing`);
  }
  for (const k of Object.values(s.cover)) if (!sceneByKey[k.replace(/^scenes\//, "")]) err(`story ${s.id}: cover scene ${k} missing`);
}
for (const sc of scenes) for (const it of sc.items) if (!productById[it.product]) err(`scene ${sc.key}: unknown product ${it.product}`);
for (const e of edits) {
  const n = editProducts(e).length;
  if (e.primary && n < 6) err(`edit ${e.id}: only ${n} products`);
  if (e.primary || e.id) {
    for (const k of [`edit-${e.id}-tall`, `edit-${e.id}-wide`]) if (!sceneByKey[k]) err(`edit ${e.id}: scene ${k} missing`);
  }
  console.log(`edit ${e.id.padEnd(16)} ${String(n).padStart(3)} products`);
}
for (const k of ["cat-women", "cat-men", "cat-kids", "cat-home", "auth-side"]) if (!sceneByKey[k]) err(`scene ${k} missing`);
console.log("trending searches:", TRENDING_SEARCHES.length);

// New & Next launches (src/data/launches.ts): everything a launch page needs must exist, so onboarding a brand cannot ship a broken page.
{
  const meta = JSON.parse((await import("node:fs")).readFileSync(resolve(root, "src/data/generated/image-meta.json"), "utf8"));
  const img = (k, where) => {
    if (!meta[k]) err(`${where}: image ${k} has no entry in image-meta.json`);
    if (!existsSync(resolve(root, "public/img", `${k}.webp`))) err(`${where}: public/img/${k}.webp is missing`);
  };
  const seen = new Set();
  for (const l of launches) {
    const w = `launch ${l.id}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(l.id)) err(`${w}: id must be a lowercase slug`);
    if (seen.has(l.id)) err(`${w}: duplicate id`);
    seen.add(l.id);
    if (Number.isNaN(Date.parse(l.launchAt))) err(`${w}: launchAt "${l.launchAt}" is not an ISO date`);
    else if (!/(Z|[+-]\d\d:\d\d)$/.test(l.launchAt)) err(`${w}: launchAt needs a time-zone offset, e.g. 2026-11-14T11:00:00+05:30`);
    if (l.earlyAccessAt && !(Date.parse(l.earlyAccessAt) < Date.parse(l.launchAt))) err(`${w}: earlyAccessAt must be before launchAt`);
    for (const f of ["name", "tagline", "category"]) if (!l.brand[f]) err(`${w}: brand.${f} is empty`);
    if (!l.headline || !l.dek) err(`${w}: headline and dek are required`);
    img(l.images.hero.wide, w);
    img(l.images.hero.tall, w);
    for (const g of l.images.gallery) { img(g.key, w); if (!g.alt) err(`${w}: gallery picture ${g.key} needs alt text`); }
    const offerIds = new Set();
    for (const o of l.offers) {
      if (offerIds.has(o.id)) err(`${w}: duplicate offer id ${o.id}`);
      offerIds.add(o.id);
      if (!["early-access", "discount", "shipping", "gift", "bonus"].includes(o.kind)) err(`${w}: offer ${o.id} has unknown kind ${o.kind}`);
      if (!["early", "launch"].includes(o.starts)) err(`${w}: offer ${o.id} starts must be "early" or "launch"`);
      if (o.starts === "early" && !l.earlyAccessAt) err(`${w}: offer ${o.id} starts "early" but the launch has no earlyAccessAt`);
      if (o.endsAt && Number.isNaN(Date.parse(o.endsAt))) err(`${w}: offer ${o.id} endsAt is not a date`);
    }
    if (l.cta && !l.cta.href.startsWith("/")) err(`${w}: cta.href must be a site path`);
    if (l.brand.labelId) {
      if (!labels.some((x) => x.id === l.brand.labelId)) err(`${w}: brand.labelId ${l.brand.labelId} is not a catalogue label`);
      if (l.previews.length) err(`${w}: a launch with brand.labelId sells the catalogue range — leave previews empty`);
      if (!products.some((p) => p.labelId === l.brand.labelId)) err(`${w}: catalogue label ${l.brand.labelId} has no products`);
    } else {
      if (l.previews.length < 3) err(`${w}: a brand without a catalogue label needs at least 3 previews (has ${l.previews.length})`);
      if (!labelById[l.id]) err(`${w}: no label was created for the brand`);
    }
    for (const d of l.previews) if (d.label !== l.id) err(`${w}: preview ${d.id} has label ${d.label}, expected ${l.id}`);
  }
  for (const p of launchProducts) {
    const where = `launch product ${p.id}`;
    if (!categoryById[p.categoryPath.join("/")]) err(`${where}: unknown category ${p.categoryPath.join("/")}`);
    if (products.some((x) => x.id === p.id)) err(`${where}: id clashes with a catalogue product`);
    if (productBySlug[p.slug] !== p) err(`${where}: slug ${p.slug} clashes with another product`);
    for (const v of p.variants) for (const k of v.images) img(k, where);
  }
  console.log(`launches: ${launches.length} (${launches.filter((l) => !l.brand.labelId).length} with their own range, ${launchProducts.length} preview pieces)`);
}

// Optional: check generated imagery exists on disk (after rendering).
if (process.argv.includes("--images")) {
  let missing = 0;
  for (const p of products) for (const v of p.variants) for (const k of v.images) if (!existsSync(resolve(root, "public/img", `${k}.webp`))) missing++;
  for (const sc of scenes) if (!existsSync(resolve(root, "public/img/scenes", `${sc.key}.webp`))) missing++;
  console.log("missing images:", missing);
  if (missing) err(`${missing} images missing`);
}

if (errors.length) {
  console.error("\n" + errors.map((e) => "✗ " + e).join("\n"));
  process.exit(1);
}
console.log(`\n✓ data OK — ${products.length} products, ${edits.length} edits, ${stories.length} stories, ${scenes.length} scenes`);
