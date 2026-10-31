// The curated photo library: which Unsplash photos were picked, for which group, and what the build needs to know about each (where the subject sits, where the
// shoppable pins go). Committed — it is the record of the curation, and enough to rebuild every picture (originals are re-fetched from Unsplash's CDN into the cache).
//
//   photos[id] = { w, h, color, alt, raw, page, dl, by: { name, username, page }, focus?: [x, y], anchors?: [[x, y], …], extend?: true, tracked?: "YYYY-MM-DD" }
//   groups[groupId] = [id, …]            ordered — the first photo of a group is its primary one
//
// focus   = the middle of the subject as fractions of the photo (0–1); every window is placed around it. Default: the middle, a little above centre.
// anchors = things a visitor can point at (a garment, a bag, a piece of jewellery) as photo fractions; shoppable pins are placed on the ones inside each window.
// extend  = the photo's backdrop is plain: the build may continue it sideways so a wide banner can put the subject right of the copy.
import { join } from "node:path";
import { root, readJson, writeJson } from "./lib.mjs";

export const MANIFEST = process.env.UNSPLASH_MANIFEST ?? join(root, "scripts/unsplash/manifest.json");

export const loadManifest = () => {
  const m = readJson(MANIFEST, null) ?? {};
  return { photos: m.photos ?? {}, groups: m.groups ?? {} };
};

export const saveManifest = (m) => {
  const photos = Object.fromEntries(Object.entries(m.photos).sort(([a], [b]) => (a < b ? -1 : 1)));
  const groups = Object.fromEntries(Object.entries(m.groups).filter(([, ids]) => ids.length).sort(([a], [b]) => (a < b ? -1 : 1)));
  writeJson(MANIFEST, { photos, groups });
};

/** Photos of a group, in order, each with its id. */
export const photosOf = (m, group) => (m.groups[group] ?? []).map((id) => ({ id, ...m.photos[id] })).filter((p) => p.raw);

/** Every picked photo once, with the groups it was picked for. */
export const pickedPhotos = (m) => {
  const out = new Map();
  for (const [g, ids] of Object.entries(m.groups)) for (const id of ids) if (m.photos[id]) out.set(id, { id, ...m.photos[id], groups: [...(out.get(id)?.groups ?? []), g] });
  return [...out.values()];
};
