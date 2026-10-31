// The Unsplash build (scripts/unsplash/build.mjs) on made-up photographs: a plain backdrop with a coloured "subject" whose position is known, so every window can be checked.
//   node scripts/qa/unsplash-build-unit.mjs
// Everything is written to a temporary folder (UNSPLASH_OUT / _META / _ASSIGNMENTS / _CREDITS / _MANIFEST / _CACHE); nothing in the repository is touched.
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { defById, productById } from "../../src/data/catalog.ts";
import { cropAround, deltaE, hexToRgb, pinsFor, where } from "../unsplash/crop.mjs";
import { poolsOf } from "../unsplash/slots.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok || !detail ? "" : `\n      ${detail}`}`);
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// ── pure geometry ──────────────────────────────────────────────────────────────────────────────────────────────
console.log("Unsplash build: geometry");
{
  const b = cropAround(3600, 2400, 0.8, { fx: 0.5, fy: 0.5 });
  check("a 4:5 window on a landscape photo is its full height, centred", near(b.height, 2400, 1) && near(b.width, 1920, 1) && near(b.left, 840, 1) && near(b.top, 0, 1), JSON.stringify(b));
  const c = cropAround(2400, 3600, 0.8, { zoom: 2, fx: 0.5, fy: 0.9 });
  check("a window never leaves the photograph (it slides back inside)", c.top + c.height <= 3600 + 1e-6 && c.left >= 0, JSON.stringify(c));
  const d = cropAround(3600, 2400, 16 / 9, { fx: 0.45, fy: 0.5, atX: 0.68 });
  check("a window the width of the photograph cannot move the subject", near(d.left, 0, 1e-6), JSON.stringify(d));
  const e = cropAround(1000, 1500, 0.8, { zoom: 4, minWidth: 600 });
  check("zoom is relaxed so a window is never narrower than minWidth (no enlarging beyond the limit)", e.width >= 599, String(e.width));
  const w = where({ left: 600, top: 0, width: 960, height: 1200 }, 1800, 1200, [0.5, 0.4]);
  check("where() maps a photo point into the window (and mirrors with flip)", near(w.x, 0.3125, 1e-6) && near(w.y, 0.4, 1e-6) && near(where({ left: 600, top: 0, width: 960, height: 1200 }, 1800, 1200, [0.5, 0.4], true).x, 0.6875, 1e-6));
  const pins = pinsFor({ left: 600, top: 0, width: 960, height: 1200 }, 1800, 1200, [[0.5, 0.4], [0.95, 0.4], [0.62, 0.6]], 3);
  check("pins use anchors inside the window, skip those outside, and fill from the fixed spread", pins.length === 3 && pins[0].source === "anchor" && pins[1].source === "anchor" && pins[2].source === "fallback", JSON.stringify(pins));
  check("colour distance: the same colour is 0, red to blue is large", deltaE([200, 30, 30], [200, 30, 30]) === 0 && deltaE([200, 30, 30], [30, 30, 200]) > 60);
}

// ── fixtures ───────────────────────────────────────────────────────────────────────────────────────────────────
const hslRgb = (h, s, l) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min((n + h / 30) % 12 - 3, Math.min(9 - ((n + h / 30) % 12), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
};
const work = mkdtempSync(join(tmpdir(), "nf-unsplash-build-"));
const dirs = { img: join(work, "img"), cache: join(work, "cache") };
mkdirSync(join(dirs.cache, "originals"), { recursive: true });
const photos = {};
const groups = {};
async function photo(id, group, w, h, { fx = 0.5, fy = 0.5, hue = 0, anchors, extend } = {}) {
  const rgb = hslRgb(hue, 0.65, 0.42);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#d9cfc4"/><ellipse cx="${fx * w}" cy="${fy * h}" rx="${w * 0.07}" ry="${h * 0.22}" fill="rgb(${rgb})"/></svg>`;
  writeFileSync(join(dirs.cache, "originals", `${id}.jpg`), await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer());
  photos[id] = { w, h, color: "#d9cfc4", alt: `fixture ${id}`, raw: `https://images.unsplash.com/${id}`, page: `https://unsplash.com/photos/${id}`, dl: `https://api.unsplash.com/photos/${id}/download`, by: { name: `Photographer ${id.slice(0, 2)}`, username: `ph_${id}`, page: `https://unsplash.com/@ph_${id}` }, focus: [fx, fy], ...(anchors ? { anchors } : {}), ...(extend ? { extend: true } : {}), tracked: "2026-11-01", rgb };
  (groups[group] ??= []).push(id);
}
const P = [1200, 1800], L = [1800, 1200];
await photo("cw1", "s-cat-women", ...P, { fx: 0.5, fy: 0.45, hue: 330 });
await photo("cw2", "s-cat-women", ...P, { fx: 0.4, fy: 0.5, hue: 300 });
await photo("fe1", "s-festive", ...L, { fx: 0.45, fy: 0.5, hue: 20, extend: true }); // subject left of centre, plain backdrop, flagged to extend
await photo("fe2", "s-festive", ...L, { fx: 0.7, fy: 0.5, hue: 40 });
await photo("lx1", "s-luxe", ...L, { fx: 0.45, fy: 0.5, hue: 50 }); // not flagged: the subject cannot move right
await photo("dw1", "s-diwali", ...L, { fx: 0.6, fy: 0.5, hue: 10, anchors: [[0.5, 0.4], [0.62, 0.6], [0.45, 0.7]] });
await photo("dw2", "s-diwali", ...L, { fx: 0.5, fy: 0.5, hue: 25 }); // no anchors: pins fall back, and the build says so
await photo("dw3", "s-diwali", ...L, { fx: 0.55, fy: 0.5, hue: 35 });
await photo("vr1", "l-vrisa", ...L, { fx: 0.72, fy: 0.5, hue: 340 });
await photo("vr2", "l-vrisa", ...P, { fx: 0.5, fy: 0.5, hue: 350 });
await photo("vr3", "l-vrisa", ...P, { fx: 0.5, fy: 0.45, hue: 355 });
await photo("vr4", "l-vrisa", ...P, { fx: 0.5, fy: 0.5, hue: 5 });
await photo("vr5", "l-vrisa", ...L, { fx: 0.6, fy: 0.5, hue: 15 });
await photo("he1", "l-hearth", ...P, { fx: 0.5, fy: 0.5, hue: 30 });
await photo("he2", "l-hearth", ...P, { fx: 0.5, fy: 0.5, hue: 35 });
await photo("pk1", "p-kurta-set", ...P, { fx: 0.5, fy: 0.5, hue: 0 });
await photo("pk2", "p-kurta-set", ...P, { fx: 0.5, fy: 0.5, hue: 120 });
await photo("pk3", "p-kurta-set", ...P, { fx: 0.5, fy: 0.5, hue: 220 });
await photo("pd1", "p-dress", ...P, { fx: 0.5, fy: 0.5, hue: 280 });
// (no photo for p-bag, s-cat-men or l-halden: those keys must keep their pictures)
const manifest = join(work, "manifest.json");
writeFileSync(manifest, JSON.stringify({ photos: Object.fromEntries(Object.entries(photos).map(([k, { rgb, ...p }]) => [k, p])), groups }));
copyFileSync(join(root, "src/data/generated/image-meta.json"), join(work, "meta.json"));
const meta0 = JSON.parse(readFileSync(join(work, "meta.json"), "utf8"));

const env = { ...process.env, UNSPLASH_OUT: dirs.img, UNSPLASH_META: join(work, "meta.json"), UNSPLASH_ASSIGNMENTS: join(work, "assign.json"), UNSPLASH_CREDITS: join(work, "credits.json"), UNSPLASH_MANIFEST: manifest, UNSPLASH_CACHE: dirs.cache };
const run = (args = []) =>
  new Promise((res) => {
    const child = spawn(process.execPath, [join(root, "scripts/unsplash/build.mjs"), ...args], { cwd: root, env });
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => res({ code, out, err }));
  });
const json = (f) => JSON.parse(readFileSync(join(work, f), "utf8"));
const img = (key) => join(dirs.img, `${key}.webp`);

/** Where the subject (a colour) sits in a built picture, as fractions of its size. */
async function subjectAt(key, rgb) {
  const { data, info } = await sharp(img(key)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < info.height; y += 2)
    for (let x = 0; x < info.width; x += 2) {
      const i = (y * info.width + x) * 3;
      if (Math.hypot(data[i] - rgb[0], data[i + 1] - rgb[1], data[i + 2] - rgb[2]) < 40) (sx += x), (sy += y), n++;
    }
  return n < 20 ? null : { x: sx / n / info.width, y: sy / n / info.height, n };
}

try {
  console.log("\nUnsplash build: a library of made-up photographs");
  let r = await run(["--plan"]);
  check("--plan lists what would be built and writes nothing", r.code === 0 && /planned pictures/.test(r.out) && !existsSync(dirs.img), r.err || r.out);

  r = await run();
  check("the build exits cleanly", r.code === 0, r.err || r.out.slice(-600));
  const assign = json("assign.json");
  const meta = json("meta.json");
  const plan = JSON.parse(readFileSync(join(dirs.cache, "plan.json"), "utf8"));

  // scenes
  check("category tiles are cut (portrait) from their photos, at the declared size", ["scenes/cat-women", "scenes/auth-side"].every((k) => existsSync(img(k))));
  const sz = await sharp(img("scenes/cat-women")).metadata();
  check("the picture has the size the layout declares (1000 × 1250)", sz.width === 1000 && sz.height === 1250, `${sz.width}×${sz.height}`);
  check("keys with no photo behind them are not written (Men, Halden, bags)", !existsSync(img("scenes/cat-men")) && !existsSync(img("launches/halden/hero-wide")) && !Object.keys(assign).some((k) => /^products\/(?:sac|bag)/.test(k)), Object.keys(assign).filter((k) => k.startsWith("launches/halden")).join());

  // subject placement
  const wide = await subjectAt("scenes/edit-festive-wide", photos.fe1.rgb);
  check("a flagged plain-backdrop photo is extended so the subject sits right of the copy (≈ 68 % across)", wide && near(wide.x, 0.68, 0.06), JSON.stringify(wide));
  const tall = await subjectAt("scenes/edit-festive-tall", photos.fe1.rgb);
  check("its tall crop is centred on the subject at the photograph's own scale", tall && near(tall.x, 0.5, 0.05), JSON.stringify(tall));
  const plainWide = await subjectAt("scenes/edit-luxe-wide", photos.lx1.rgb);
  check("a photo that is not flagged keeps the subject where it is (45 %) and the build says the copy would run over it", plainWide && near(plainWide.x, 0.45, 0.05) && /edit-luxe-wide: the subject sits at 4\d % of the banner/.test(r.out), JSON.stringify(plainWide) + "\n" + r.out.slice(-500));
  const hero = await subjectAt("launches/vrisa/hero-wide", photos.vr1.rgb);
  check("a landscape photo whose subject is already on the right needs no help (≈ 72 %)", hero && near(hero.x, 0.72, 0.05), JSON.stringify(hero));
  check("a portrait photo in a wide slot is called out", /launches\/hearth-and-hue\/hero-wide: a portrait photo/.test(r.out), r.out.slice(-600));

  // metadata
  check("avg, edge (wall at the copy area) and blur are recomputed for a wide picture", /^#[0-9a-f]{6}$/.test(meta["scenes/edit-festive-wide"].avg) && /^#[0-9a-f]{6}$/.test(meta["scenes/edit-festive-wide"].edge.wall[0]) && meta["scenes/edit-festive-wide"].blur.startsWith("data:image/webp") && meta["scenes/edit-festive-wide"].edge.floorY === meta0["scenes/edit-festive-wide"].edge.floorY);
  check("the plain backdrop is calm: no copy-area contrast warning for it", !/edit-festive-wide: the copy area is too busy/.test(r.out), r.out.slice(-500));
  const pins = meta["scenes/story-diwali-tall"].pins;
  check("pins sit on the photo's anchors (and keep their product ids)", pins.length === 2 && pins[0].id === meta0["scenes/story-diwali-tall"].pins[0].id && near(pins[0].x, 0.3125, 0.02) && near(pins[0].y, 0.4, 0.02) && near(pins[1].x, 0.5375, 0.02) && near(pins[1].y, 0.6, 0.02), JSON.stringify(pins));
  check("a photo without anchors gets fallback pins and a warning that says how to fix it", /story-diwali-1: \d pin\(s\) on fallback positions/.test(r.out) && !/story-diwali-tall: \d pin/.test(r.out), r.out.slice(-700));

  // products
  const firstKurta = Object.values(productById).find((p) => poolsOf(defById[p.id])[0] === "p-kurta-set");
  const key1 = `products/${firstKurta.id}/v1-front`;
  const want = ["pk1", "pk2", "pk3"].map((id) => ({ id, d: deltaE(photos[id].rgb, hexToRgb(firstKurta.variants[0].colorHex)) })).sort((a, b) => a.d - b.d);
  check("a colour variant takes the photo of its pool nearest in colour (the first product, where nothing is used yet)", want[1].d - want[0].d > 8 ? plan[key1]?.photo === want[0].id : true, `${firstKurta.id} ${firstKurta.variants[0].colorHex} → ${plan[key1]?.photo}, nearest ${want[0].id} (${want[0].d.toFixed(0)} vs ${want[1].d.toFixed(0)})`);
  const kurtaPlans = Object.entries(plan).filter(([k, v]) => k.startsWith("products/") && v.group === "p-kurta-set");
  check("the kurta pool is spread over all its photos, and never mirrored", new Set(kurtaPlans.map(([, v]) => v.photo)).size === 3 && kurtaPlans.every(([, v]) => v.flip === false), [...new Set(kurtaPlans.map(([, v]) => v.photo))].join());
  const sareeProduct = Object.values(productById).find((p) => defById[p.id].art.kind === "saree");
  check("a pool with no photos falls back (sarees → kurta set pool) and is not mirrored", plan[`products/${sareeProduct.id}/v1-front`] && plan[`products/${sareeProduct.id}/v1-front`].flip === false && ["p-kurta-set", "p-dress"].includes(plan[`products/${sareeProduct.id}/v1-front`].group));
  const views = ["front", "alt", "detail"].map((s) => plan[`products/${firstKurta.id}/v1-${s}`]);
  check("the three views of a product are three windows onto one photograph (front wider than close wider than detail)", views.every(Boolean) && new Set(views.map((v) => v.photo)).size === 1 && views[0].box[2] > views[1].box[2] && views[1].box[2] > views[2].box[2], JSON.stringify(views.map((v) => v?.box)));
  const sizes = Object.keys(assign).filter((k) => k.startsWith("products/")).map((k) => statSync(img(k)).size / 1024);
  check("every product picture fits its 110 KB budget", sizes.length > 50 && Math.max(...sizes) <= 110, `${sizes.length} pictures, largest ${Math.max(...sizes).toFixed(0)} KB`);

  // credits and assignments
  const credits = json("credits.json");
  check("credits list each photographer once per photo, with links that carry the UTM tags", credits.length > 10 && credits.every((c) => /utm_source=nykaa_fashion_prototype&utm_medium=referral/.test(c.page) && /utm_medium=referral/.test(c.profile) && c.uses.length), JSON.stringify(credits[0]));
  check("credits say where each photo is used", credits.some((c) => c.uses.includes("Category pictures")) && credits.some((c) => c.uses.includes("Edits")) && credits.some((c) => c.uses.some((u) => u.startsWith("Product pictures"))) && credits.some((c) => c.uses.some((u) => u.startsWith("New & Next"))));
  check("assignments record the photo behind every cut picture", assign["scenes/cat-women"] === "cw1" && assign["scenes/auth-side"] === "cw2", JSON.stringify([assign["scenes/cat-women"], assign["scenes/auth-side"]]));

  // a partial build keeps everything else (and the credits stay complete)
  const before = statSync(img("scenes/edit-festive-tall")).mtimeMs;
  const nBefore = Object.keys(json("assign.json")).length;
  await new Promise((s) => setTimeout(s, 30));
  r = await run(["--only", "scenes/cat-women"]);
  check("--only rebuilds just the keys asked for", r.code === 0 && /1 picture\(s\) cut/.test(r.out) && statSync(img("scenes/edit-festive-tall")).mtimeMs === before, r.err || r.out.slice(0, 300));
  check("…and the assignments and credits still cover the whole site", Object.keys(json("assign.json")).length === nBefore && json("credits.json").length === credits.length);
  const again = JSON.stringify(json("meta.json")["scenes/cat-women"]);
  r = await run(["--only", "scenes/cat-women"]);
  check("building twice gives the same result (deterministic)", JSON.stringify(json("meta.json")["scenes/cat-women"]) === again);
} finally {
  if (process.env.KEEP_WORKDIR) console.log(`\n(kept) ${work}`);
  else rmSync(work, { recursive: true, force: true });
}
console.log(failures ? `\n${failures} check(s) failed` : "\nUnsplash build checks OK");
process.exit(failures ? 1 : 0);
