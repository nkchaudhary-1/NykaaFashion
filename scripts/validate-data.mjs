// Cross-reference checks across all prototype data. Usage: node scripts/validate-data.mjs
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { products, productById, launchProducts, productBySlug } from "../src/data/catalog.ts";
import { launches, launchById } from "../src/data/launches.ts";
import { promos } from "../src/data/promos.ts";
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

// Pop-ups (src/data/promos.ts): a campaign must be complete, point somewhere that exists, and have its picture (and video) on disk.
{
  const meta = JSON.parse((await import("node:fs")).readFileSync(resolve(root, "src/data/generated/image-meta.json"), "utf8"));
  const KINDS = ["launch", "collection", "offer", "announcement", "notification"];
  const STATIC_PAGES = new Set(["/", "/offers", "/search", "/wishlist", "/brands", "/discover", "/edits", "/new-and-next", "/help", "/sitemap", "/credits"]);
  const INFO = new Set(["shipping", "terms", "privacy", "about", "careers", "press"]);
  const hrefOk = (href) => {
    if (!/^\/(?!\/)/.test(href)) return false;
    const path = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
    let m;
    if (STATIC_PAGES.has(path)) return true;
    if ((m = /^\/new-and-next\/([\w-]+)$/.exec(path))) return !!launchById[m[1]];
    if ((m = /^\/edits\/([\w-]+)$/.exec(path))) return !!editById[m[1]];
    if ((m = /^\/brands\/([\w-]+)$/.exec(path))) return !!labelById[m[1]];
    if ((m = /^\/p\/([\w-]+)$/.exec(path))) return !!productBySlug[m[1]];
    if ((m = /^\/info\/([\w-]+)$/.exec(path))) return INFO.has(m[1]);
    if (/^\/c\/.+/.test(path)) return !!categoryById[path.replace(/^\/c\//, "")];
    return false;
  };
  const seen = new Set();
  for (const c of promos) {
    const w = `promo ${c.id}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id)) err(`${w}: id must be a lowercase slug`);
    if (seen.has(c.id)) err(`${w}: duplicate id`);
    seen.add(c.id);
    if (!KINDS.includes(c.kind)) err(`${w}: kind must be one of ${KINDS.join(", ")}`);
    if (c.launchId) {
      if (!launchById[c.launchId]) err(`${w}: launchId ${c.launchId} is not a launch in launches.ts`);
    } else {
      if (!c.headline) err(`${w}: a campaign without launchId needs a headline`);
      if (!c.cta?.label || !c.cta?.href) err(`${w}: a campaign without launchId needs cta { label, href }`);
    }
    for (const cta of [c.cta, c.live?.cta]) if (cta && !hrefOk(cta.href)) err(`${w}: cta ${cta.href} does not point at a page that exists`);
    for (const k of ["startsAt", "endsAt"]) if (c[k] && (Number.isNaN(Date.parse(c[k])) || !/(Z|[+-]\d\d:\d\d)$/.test(c[k]))) err(`${w}: ${k} needs an ISO date with a time-zone offset`);
    if (c.startsAt && c.endsAt && !(Date.parse(c.startsAt) < Date.parse(c.endsAt))) err(`${w}: startsAt must be before endsAt`);
    for (const list of [c.routes?.include, c.routes?.exclude]) for (const r of list ?? []) if (!/^\/[\w\-/]*$/.test(r)) err(`${w}: route "${r}" must start with / (e.g. "/c", "/edits"; "/" is the home page only)`);
    for (const k of ["delaySeconds", "priority", "suppressDays", "liveDays"]) if (c[k] !== undefined && !(Number.isFinite(c[k]) && c[k] >= 0)) err(`${w}: ${k} must be a number ≥ 0`);
    if (!c.media?.alt || c.media.alt.length < 8) err(`${w}: media.alt must describe the picture`);
    if (c.media?.ratio && !["4/3", "1/1", "4/5"].includes(c.media.ratio)) err(`${w}: media.ratio must be 4/3, 1/1 or 4/5`);
    if (!meta[c.media?.image] || !existsSync(resolve(root, "public/img", `${c.media?.image}.webp`))) err(`${w}: picture ${c.media?.image} is missing (public/img + image-meta.json)`);
    if (c.media?.type === "video") {
      const v = c.media.video;
      if (!v?.mp4 && !v?.webm) err(`${w}: a video campaign needs media.video.mp4 and/or webm`);
      for (const f of [v?.mp4, v?.webm]) if (f && !existsSync(resolve(root, "public", f.replace(/^\//, "")))) err(`${w}: video file public${f} is missing`);
      if (v && !(v.mp4 && v.webm)) console.warn(`  ~ ${w}: give both mp4 and webm so every browser can play it`);
    } else if (c.media?.type !== "image") err(`${w}: media.type must be "image" or "video"`);
  }
  console.log(`pop-ups: ${promos.length} campaigns (${promos.filter((c) => c.media.type === "video").length} video)`);
}

// Unsplash photographs (scripts/unsplash): every picture drawn from one must have its photo in the manifest, that photo must have been reported to Unsplash
// (their API guideline for any photo chosen for use) and be credited on /credits; nothing credited may be unused. Empty until the first build.
{
  const fs = await import("node:fs");
  const read = (f, fallback) => {
    try {
      return JSON.parse(fs.readFileSync(resolve(root, f), "utf8"));
    } catch {
      return fallback;
    }
  };
  const meta = read("src/data/generated/image-meta.json", {});
  const manifest = read("scripts/unsplash/manifest.json", { photos: {}, groups: {} });
  const assigned = read("src/data/generated/photo-assignments.json", {});
  const credits = read("src/data/generated/photo-credits.json", []);
  const keys = Object.keys(assigned);
  for (const k of keys) {
    const id = assigned[k];
    if (!meta[k]) err(`photo-assignments: ${k} has no entry in image-meta.json`);
    if (!existsSync(resolve(root, "public/img", `${k}.webp`))) err(`photo-assignments: public/img/${k}.webp is missing`);
    if (!manifest.photos[id]) err(`photo-assignments: ${k} uses photo ${id}, which is not in scripts/unsplash/manifest.json`);
    else if (!manifest.photos[id].tracked) err(`photo ${id} is used on the site but was never reported to Unsplash — run  npm run unsplash:download`);
    else if (!/^https:\/\/images\.unsplash\.com\//.test(manifest.photos[id].raw ?? "")) err(`photo ${id}: not a free Unsplash photograph (${manifest.photos[id].raw})`);
  }
  const usedIds = new Set(Object.values(assigned));
  const creditIds = new Set(credits.map((c) => c.id));
  for (const id of usedIds) if (!creditIds.has(id)) err(`photo ${id} is used on the site but missing from photo-credits.json — run  npm run unsplash:build`);
  for (const id of creditIds) if (!usedIds.has(id)) err(`photo-credits.json credits ${id}, which no picture uses — run  npm run unsplash:build`);
  for (const c of credits) if (!c.name || !/^https:\/\/unsplash\.com\//.test(c.page ?? "") || !/utm_source=/.test(c.page)) err(`credit ${c.id}: needs the photographer's name and a link to the photo on unsplash.com with the utm tags`);
  console.log(`unsplash: ${usedIds.size} photographs placed (${keys.length} pictures) · ${Object.keys(manifest.photos).length} picked`);
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
