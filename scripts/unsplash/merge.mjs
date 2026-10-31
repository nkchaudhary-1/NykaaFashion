// Merge picks made elsewhere into the manifest — for curating in parallel: each helper picks into its own file (UNSPLASH_MANIFEST=/tmp/picks-a.json node scripts/unsplash/pick.mjs …),
// then one process merges them, so no two writers ever touch scripts/unsplash/manifest.json at once.
//   node scripts/unsplash/merge.mjs /tmp/picks-a.json /tmp/picks-b.json …
// Photos are added (a photo already in the manifest keeps its focus / anchors / extend flag / tracked date); each group takes the new photos after the ones it already has, in order.
import { readJson } from "./lib.mjs";
import { loadManifest, saveManifest } from "./manifest.mjs";
import { groupById } from "./groups.mjs";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: merge.mjs <manifest.json> …");
  process.exit(1);
}
const m = loadManifest();
let photos = 0;
let places = 0;
for (const f of files) {
  const other = readJson(f, null);
  if (!other) {
    console.error(`cannot read ${f}`);
    process.exit(1);
  }
  for (const [id, p] of Object.entries(other.photos ?? {})) {
    if (!m.photos[id]) (m.photos[id] = p), photos++;
    else m.photos[id] = { ...p, ...m.photos[id] }; // what is already here wins
  }
  for (const [g, ids] of Object.entries(other.groups ?? {})) {
    if (!groupById[g]) {
      console.error(`${f}: unknown group ${g}`);
      process.exit(1);
    }
    for (const id of ids) if (!(m.groups[g] ?? []).includes(id)) ((m.groups[g] ??= []).push(id), places++);
  }
}
saveManifest(m);
console.log(`merged ${files.length} file(s): ${photos} new photo(s), ${places} new place(s) in groups; manifest now has ${Object.keys(m.photos).length} photos`);
