// Stage 2 — record the picks. The numbers are the ones printed on the contact sheets (positions in .cache/unsplash/candidates/<group>.json).
//
//   node scripts/unsplash/pick.mjs <group> <n>[@x,y] …        add photos to a group, in this order (the first is the group's primary photo)
//   node scripts/unsplash/pick.mjs --drop <group> <id|n> …     remove from a group (n = its position in the group's list, see --list)
//   node scripts/unsplash/pick.mjs --focus <id> x,y            where the subject sits, as fractions of the photo (0–1)
//   node scripts/unsplash/pick.mjs --anchors <id> x,y x,y …    things to pin products on (garment, bag, jewellery …), photo fractions
//   node scripts/unsplash/pick.mjs --extend <id> [off]         a plain-backdrop photo the build may extend sideways (wide banners put the subject right of the copy)
//   node scripts/unsplash/pick.mjs --list [group]
//
// Example:  pick.mjs l-vrisa 4@.66,.5 9 12@.5,.4        picks #4 (subject right of centre), #9 and #12 (centred)
import { join } from "node:path";
import { CACHE, readJson } from "./lib.mjs";
import { groupById } from "./groups.mjs";
import { loadManifest, photosOf, saveManifest } from "./manifest.mjs";

const args = process.argv.slice(2);
const m = loadManifest();
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};
const fraction = (s) => {
  const [x, y] = String(s).split(",").map(Number);
  if (![x, y].every((v) => Number.isFinite(v) && v >= 0 && v <= 1)) fail(`"${s}" is not x,y as fractions between 0 and 1`);
  return [+x.toFixed(3), +y.toFixed(3)];
};
const known = (g) => groupById[g] ?? fail(`unknown group "${g}". Known: ${Object.keys(groupById).join(", ")}`);

function list(only) {
  for (const [g, ids] of Object.entries(m.groups)) {
    if (only && g !== only) continue;
    console.log(`${g}  ${ids.length}/${groupById[g]?.want ?? "?"}`);
    ids.forEach((id, i) => {
      const p = m.photos[id];
      console.log(`  ${String(i + 1).padStart(2)}  ${id}  ${p.w}×${p.h}  ${p.by?.name ?? ""}  focus ${p.focus ? p.focus.join(",") : "auto"}${p.anchors?.length ? `  anchors ${p.anchors.length}` : ""}${p.extend ? "  extend" : ""}  ${p.tracked ? "tracked" : "untracked"}`);
    });
  }
}

if (args[0] === "--list") {
  list(args[1]);
} else if (args[0] === "--focus") {
  const [, id, xy] = args;
  if (!m.photos[id]) fail(`no picked photo ${id}`);
  m.photos[id].focus = fraction(xy);
  saveManifest(m);
  console.log(`${id}: focus ${m.photos[id].focus.join(",")}`);
} else if (args[0] === "--extend") {
  const [, id, off] = args;
  if (!m.photos[id]) fail(`no picked photo ${id}`);
  if (off === "off") delete m.photos[id].extend;
  else m.photos[id].extend = true;
  saveManifest(m);
  console.log(`${id}: extend ${m.photos[id].extend ? "on" : "off"}`);
} else if (args[0] === "--anchors") {
  const [, id, ...xy] = args;
  if (!m.photos[id]) fail(`no picked photo ${id}`);
  m.photos[id].anchors = xy.map(fraction);
  saveManifest(m);
  console.log(`${id}: ${m.photos[id].anchors.length} anchors`);
} else if (args[0] === "--drop") {
  const [, g, ...which] = args;
  known(g);
  for (const w of which) {
    const id = /^\d+$/.test(w) ? m.groups[g]?.[Number(w) - 1] : w;
    if (!id || !m.groups[g]?.includes(id)) fail(`${w} is not in ${g}`);
    m.groups[g] = m.groups[g].filter((x) => x !== id);
    if (!Object.values(m.groups).some((ids) => ids.includes(id))) delete m.photos[id];
    console.log(`${g}: dropped ${id}`);
  }
  saveManifest(m);
} else {
  const [g, ...specs] = args;
  if (!g || !specs.length) fail("usage: pick.mjs <group> <n>[@x,y] …   (see the header of this file)");
  known(g);
  const cands = readJson(join(CACHE, "candidates", `${g}.json`), null) ?? fail(`no candidates for ${g}: run  npm run unsplash:search -- --group ${g}`);
  for (const spec of specs) {
    const [n, xy] = spec.split("@");
    const p = cands[Number(n) - 1];
    if (!p) fail(`#${n} is not on the sheets of ${g} (1–${cands.length})`);
    const keep = m.photos[p.id] ?? {};
    m.photos[p.id] = { w: p.w, h: p.h, color: p.color, alt: p.alt, raw: p.urls.raw, page: p.page, dl: p.dl, by: p.by, ...(keep.focus ? { focus: keep.focus } : {}), ...(keep.anchors ? { anchors: keep.anchors } : {}), ...(keep.extend ? { extend: true } : {}), ...(keep.tracked ? { tracked: keep.tracked } : {}) };
    if (xy) m.photos[p.id].focus = fraction(xy);
    m.groups[g] = [...(m.groups[g] ?? []).filter((x) => x !== p.id), p.id];
    console.log(`${g}: + #${n} ${p.id} (${p.w}×${p.h}, ${p.by.name})${xy ? ` focus ${xy}` : ""}`);
  }
  saveManifest(m);
  const have = photosOf(m, g).length;
  console.log(`${g}: ${have}/${groupById[g].want}`);
}
