// Cross-reference checks across all prototype data. Usage: node scripts/validate-data.mjs
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { products, productById } from "../src/data/catalog.ts";
import { labelById } from "../src/data/labels.ts";
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
