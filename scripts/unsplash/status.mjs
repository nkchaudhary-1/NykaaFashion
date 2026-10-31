// Where the curation stands. No API calls.   node scripts/unsplash/status.mjs
import { join } from "node:path";
import { readdirSync } from "node:fs";
import { CACHE, exists, readJson } from "./lib.mjs";
import { GROUPS } from "./groups.mjs";
import { loadManifest, pickedPhotos } from "./manifest.mjs";

const key = process.env.UNSPLASH_ACCESS_KEY;
const m = loadManifest();
const count = (dir) => {
  try {
    return readdirSync(join(CACHE, dir)).length;
  } catch {
    return 0;
  }
};
const picked = pickedPhotos(m);
console.log(`key        ${key ? "set" : "MISSING — add UNSPLASH_ACCESS_KEY to the environment and start a new session"}`);
console.log(`cache      ${CACHE.replace(process.cwd() + "/", "")}: ${count("search")} searches · ${count("thumbs")} thumbnails · ${count("sheets")} sheets · ${count("originals")} originals`);
console.log(`manifest   ${Object.keys(m.photos).length} photos · ${picked.filter((p) => p.tracked).length} reported to Unsplash · ${picked.filter((p) => p.focus).length} with a focus point · ${picked.filter((p) => p.anchors?.length).length} with pin anchors\n`);
console.log(`${"group".padEnd(14)}${"phase".padEnd(7)}${"cand".padEnd(6)}${"picked".padEnd(9)}${"tracked".padEnd(9)}originals`);
for (const g of GROUPS) {
  const ids = m.groups[g.id] ?? [];
  const cands = readJson(join(CACHE, "candidates", `${g.id}.json`), []).length;
  const t = ids.filter((id) => m.photos[id]?.tracked).length;
  const o = ids.filter((id) => exists(join(CACHE, "originals", `${id}.jpg`))).length;
  console.log(`${g.id.padEnd(14)}${g.phase.padEnd(7)}${String(cands || "–").padEnd(6)}${`${ids.length}/${g.want}`.padEnd(9)}${String(t).padEnd(9)}${o}`);
}
const strays = Object.keys(m.groups).filter((g) => !GROUPS.some((x) => x.id === g));
if (strays.length) console.log(`\n! groups in the manifest that groups.mjs does not know: ${strays.join(", ")}`);
