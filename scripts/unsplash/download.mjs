// Stage 3 — download what was picked. For every picked photo:
//   1. tell Unsplash we are using it (the photo's download_location, one API call, once — their API guideline for any photo chosen for use)
//   2. keep a 2400 px original in .cache/unsplash/originals (from the image CDN: not an API call, not committed) for the build to cut from
// Resumable: tracked photos and cached originals are skipped, and the manifest is saved after every tracking call.
//
//   node scripts/unsplash/download.mjs [--group id,id] [--used] [--no-track] [--size 2400]
//   --used   only the photographs a build has actually placed on the site (photo-assignments.json): spare picks are neither fetched nor reported — on a demo key every report costs one of 50 calls an hour
import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { ASSIGNMENTS_JSON, CACHE, api, apiCalls, cdn, exists, fetchBuffer, originalPath, readJson, reexecWithProxy } from "./lib.mjs";
import { loadManifest, pickedPhotos, saveManifest } from "./manifest.mjs";

reexecWithProxy(); // reaches Unsplash through the environment's proxy when there is one (see lib.mjs)

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
};
const SIZE = Number(arg("--size") ?? 2400);
const NO_TRACK = process.argv.includes("--no-track");
const only = arg("--group")?.split(",");
const ORIGINALS = join(CACHE, "originals");
mkdirSync(ORIGINALS, { recursive: true });

const m = loadManifest();
const used = process.argv.includes("--used") ? new Set(Object.values(readJson(ASSIGNMENTS_JSON, {}))) : null;
const photos = pickedPhotos(m).filter((p) => (!only || p.groups.some((g) => only.includes(g))) && (!used || used.has(p.id)));
if (!photos.length) {
  console.log("nothing picked yet (scripts/unsplash/pick.mjs)");
  process.exit(0);
}

// originals first (free), then the tracking calls (counted) — so a spent budget never blocks the pictures
let fetched = 0;
for (const p of photos) {
  if (exists(originalPath(p.id))) continue;
  writeFileSync(originalPath(p.id), await fetchBuffer(cdn(p, { w: SIZE, q: 85, fm: "jpg", fit: "max", cs: "srgb" })));
  fetched++;
}
console.log(`${photos.length} photos · ${fetched} original(s) downloaded, ${photos.length - fetched} already cached`);

let tracked = 0;
if (!NO_TRACK) {
  for (const p of photos) {
    if (p.tracked) continue;
    await api(p.dl);
    m.photos[p.id].tracked = new Date().toISOString().slice(0, 10);
    saveManifest(m);
    tracked++;
    if (tracked % 10 === 0) console.log(`  … ${tracked} tracked`);
  }
}
const left = photos.filter((p) => !m.photos[p.id].tracked).length;
console.log(`${tracked} download(s) reported to Unsplash${left ? `; ${left} still to report (run again)` : "; every picked photo is reported"} · ${apiCalls()} API call(s) this run`);
