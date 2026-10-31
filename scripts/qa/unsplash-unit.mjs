// The Unsplash curation toolkit (scripts/unsplash) against a local stand-in for api.unsplash.com and images.unsplash.com — no key, no network, nothing in the repo is touched.
//   node scripts/qa/unsplash-unit.mjs
// Covers: search (filters, per-photographer cap, top-up queries, caching), contact sheets, picking, downloading (tracking calls, originals, resumability), the hourly
// limit and error paths, a wrong key, and the free-licence check.
import http from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const KEY = "test-key";
let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok || !detail ? "" : `\n      ${detail}`}`);
};

// ── the stand-in ───────────────────────────────────────────────────────────────────────────────────────────────
const state = { search: 0, download: 0, cdn: 0, fail403: 0, fail500: 0, budget: Infinity };
const hue = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;

function photosFor(query, orientation, base) {
  const slug = query.toLowerCase().replace(/[^a-z]+/g, "-");
  const n = /ceramic tableware/.test(query) ? 6 : 30; // a thin first query, so the next one has to top the group up
  return Array.from({ length: n }, (_, i) => {
    const portrait = orientation === "portrait" || (orientation === "squarish" && i % 2 === 0);
    const id = `${slug}-${i}`;
    const p = {
      id,
      width: portrait ? 2400 : 3600,
      height: portrait ? 3600 : 2400,
      color: "#a1b2c3",
      alt_description: `a photo number ${i} of ${query}`,
      likes: 100 - i,
      urls: { raw: `${base}/cdn/${id}?ixid=abc&fx=${0.35 + (i % 5) * 0.08}&fy=0.45` },
      links: { html: `https://unsplash.com/photos/${id}`, download_location: `${base}/photos/${id}/download?ixid=abc` },
      user: { name: `Photographer ${i % 8}`, username: `ph${i % 8}`, links: { html: `https://unsplash.com/@ph${i % 8}` } },
    };
    if (i === 1) p.urls.raw = `https://plus.unsplash.com/premium_photo-${id}`; // Unsplash+: never usable
    if (i === 2) p.sponsorship = { sponsor: { name: "A Brand" } }; // an advertisement
    if (i === 3) (p.width = 1200), (p.height = 800); // too small to cut from
    if (i === 4) p.alt_description = "white Nike shoes on a wall"; // a brand in the picture
    return p;
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const base = `http://127.0.0.1:${server.address().port}`;
  const send = (status, body, headers = {}) => {
    res.writeHead(status, { "content-type": typeof body === "string" ? "text/plain" : "application/json", ...headers });
    res.end(typeof body === "string" ? body : JSON.stringify(body));
  };
  if (url.pathname.startsWith("/cdn/")) {
    state.cdn++;
    const id = url.pathname.slice(5);
    const portrait = !/-(landscape)/.test(id);
    const w = Math.min(Number(url.searchParams.get("w") ?? 800), 800);
    const h = Math.round(w * (portrait ? 1.5 : 0.6667));
    const fx = Number(url.searchParams.get("fx") ?? 0.5), fy = Number(url.searchParams.get("fy") ?? 0.5);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="hsl(${hue(id)},35%,72%)"/><ellipse cx="${fx * w}" cy="${fy * h}" rx="${w * 0.1}" ry="${h * 0.3}" fill="#b03060"/></svg>`;
    res.writeHead(200, { "content-type": "image/jpeg" });
    return res.end(await sharp(Buffer.from(svg)).jpeg().toBuffer());
  }
  // the API: every call is counted and needs the key
  if (req.headers.authorization !== `Client-ID ${KEY}`) return send(401, { errors: ["OAuth error: The access token is invalid"] });
  if (state.fail403 > 0) {
    state.fail403--;
    return send(403, "Rate Limit Exceeded");
  }
  if (state.fail500 > 0) {
    state.fail500--;
    return send(503, "try later");
  }
  const left = state.budget === Infinity ? 50 : --state.budget;
  const headers = { "x-ratelimit-remaining": String(Math.max(0, left)) };
  if (state.budget !== Infinity && state.budget <= 0) state.budget = 50; // the next hour starts
  if (url.pathname === "/search/photos") {
    state.search++;
    const q = url.searchParams.get("query") ?? "";
    const results = photosFor(q, url.searchParams.get("orientation") ?? "landscape", base);
    return send(200, { total: results.length, total_pages: 1, results }, headers);
  }
  const m = /^\/photos\/([^/]+)\/download$/.exec(url.pathname);
  if (m) {
    state.download++;
    return send(200, { url: `${base}/cdn/${m[1]}` }, headers);
  }
  return send(404, { errors: ["not found"] });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// ── run a script as a child (the stand-in lives in this process, so it must not block) ─────────────────────────────
const work = mkdtempSync(join(tmpdir(), "nf-unsplash-"));
const env = { ...process.env, UNSPLASH_API: BASE, UNSPLASH_ACCESS_KEY: KEY, UNSPLASH_ALLOW_HOST: "127.0.0.1", UNSPLASH_CACHE: join(work, "cache"), UNSPLASH_MANIFEST: join(work, "manifest.json") };
const run = (script, args = [], extra = {}) =>
  new Promise((resolveRun) => {
    const child = spawn(process.execPath, [join(root, "scripts/unsplash", script), ...args], { cwd: root, env: { ...env, ...extra } });
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => resolveRun({ code, out, err }));
  });
const json = (p) => JSON.parse(readFileSync(p, "utf8"));
const meta = async (f) => (existsSync(f) ? sharp(f).metadata() : {});
const cache = (...p) => join(work, "cache", ...p);

try {
  console.log("Unsplash toolkit (against a local stand-in)");

  // search ───────────────────────────────────────────────────────────────────────────────────────────────────────
  let r = await run("search.mjs", ["--group", "s-festive,p-saree,l-kiln"]);
  check("search exits cleanly", r.code === 0, r.err || r.out.slice(-300));
  check("one API call for each of the first two groups, two for the group whose first query was thin", state.search === 4, `search calls: ${state.search}`);
  const festive = existsSync(cache("candidates", "s-festive.json")) ? json(cache("candidates", "s-festive.json")) : [];
  check("20 candidates for a group", festive.length === 20, String(festive.length));
  check("Unsplash+, sponsored, too-small and brand-named photos are left out", !festive.some((p) => /premium|sponsor/.test(p.urls.raw) || p.id.endsWith("-1") || p.id.endsWith("-2") || p.id.endsWith("-3") || p.id.endsWith("-4")), festive.map((p) => p.id.slice(-2)).join(" "));
  const perPh = festive.reduce((a, p) => ((a[p.by.username] = (a[p.by.username] ?? 0) + 1), a), {});
  check("at most three photos per photographer", Math.max(...Object.values(perPh)) <= 3, JSON.stringify(perPh));
  check("candidates keep what is needed to pick and credit them", festive.every((p) => p.id && p.dl && p.urls.raw && p.by.name && p.page));
  const kiln = json(cache("candidates", "l-kiln.json"));
  check("a thin first query is topped up by the next one", kiln.length === 20 && new Set(kiln.map((p) => p.query)).size === 2, kiln.map((p) => p.query).join("|").slice(0, 120));
  const sheet = await meta(cache("sheets", "s-festive-1.jpg"));
  check("a contact sheet of 20 numbered thumbnails, cells shaped for landscape photos (5 × 4 of 300 × 210)", sheet.width === 5 * 300 + 6 * 6 && sheet.height === 4 * 210 + 5 * 6, `${sheet.width}×${sheet.height}`);
  const saree = await meta(cache("sheets", "p-saree-1.jpg"));
  check("portrait groups get taller cells (5 × 4 of 300 × 380)", saree.width === 5 * 300 + 6 * 6 && saree.height === 4 * 380 + 5 * 6, `${saree.width}×${saree.height}`);
  check("thumbnails were cached", readdirSync(cache("thumbs")).length >= 50, String(readdirSync(cache("thumbs")).length));
  const before = state.search;
  r = await run("search.mjs", ["--group", "s-festive,p-saree,l-kiln"]);
  check("running it again costs no API calls (cached)", r.code === 0 && state.search === before, `${state.search - before} new calls`);

  // pick ─────────────────────────────────────────────────────────────────────────────────────────────────────────
  r = await run("pick.mjs", ["s-festive", "3@.66,.45", "7", "12@.4,.5"]);
  check("pick records three photos", r.code === 0 && /3\/3/.test(r.out), r.err || r.out);
  let m = json(env.UNSPLASH_MANIFEST);
  check("the group keeps the order picked; focus is stored", m.groups["s-festive"].join() === [festive[2].id, festive[6].id, festive[11].id].join() && m.photos[festive[2].id].focus.join() === "0.66,0.45" && !m.photos[festive[6].id].focus);
  check("the manifest carries photographer, links and download location", Boolean(m.photos[festive[2].id].by.name && m.photos[festive[2].id].page && m.photos[festive[2].id].dl && m.photos[festive[2].id].raw));
  r = await run("pick.mjs", ["--anchors", festive[2].id, ".5,.4", ".5,.7"]);
  m = json(env.UNSPLASH_MANIFEST);
  check("anchors can be set", r.code === 0 && m.photos[festive[2].id].anchors.length === 2, r.err);
  r = await run("pick.mjs", ["s-festive", "99"]);
  check("a number that is not on the sheets is refused", r.code !== 0 && /not on the sheets/.test(r.err), r.err);
  r = await run("pick.mjs", ["--focus", festive[6].id, "1.4,0.5"]);
  check("a focus outside the photo is refused", r.code !== 0 && /fractions/.test(r.err), r.err);
  r = await run("pick.mjs", ["s-nonsense", "1"]);
  check("an unknown group is refused", r.code !== 0 && /unknown group/.test(r.err), r.err);
  await run("pick.mjs", ["l-kiln", "1", "2"]);
  r = await run("pick.mjs", ["--drop", "l-kiln", "2"]);
  m = json(env.UNSPLASH_MANIFEST);
  check("a pick can be dropped (by position), and its photo leaves the manifest when no group holds it", r.code === 0 && m.groups["l-kiln"].length === 1 && !m.photos[kiln[1].id], r.err || r.out);

  // download ──────────────────────────────────────────────────────────────────────────────────────────────────────
  r = await run("download.mjs", ["--size", "600"]);
  check("download exits cleanly", r.code === 0, r.err || r.out);
  check("each picked photo was reported to Unsplash once", state.download === 4, `download calls: ${state.download}`);
  const orig = await meta(cache("originals", `${festive[2].id}.jpg`));
  check("the original is in the cache (size from the CDN, not the API's claim)", orig.format === "jpeg" && orig.width === 600, `${orig.format} ${orig.width}`);
  m = json(env.UNSPLASH_MANIFEST);
  check("tracked photos are marked with the date", /^\d{4}-\d\d-\d\d$/.test(m.photos[festive[2].id].tracked));
  const dl = state.download, cdn0 = state.cdn;
  r = await run("download.mjs", ["--size", "600"]);
  check("running it again reports nothing and fetches nothing", r.code === 0 && state.download === dl && state.cdn === cdn0, `${state.download - dl} calls, ${state.cdn - cdn0} fetches`);
  await run("pick.mjs", ["s-festive", "15"]);
  r = await run("download.mjs", ["--size", "600", "--no-track"]);
  m = json(env.UNSPLASH_MANIFEST);
  check("--no-track fetches the original but makes no API call", r.code === 0 && state.download === dl && existsSync(cache("originals", `${festive[14].id}.jpg`)) && !m.photos[festive[14].id].tracked);
  r = await run("download.mjs", ["--size", "600"]);
  check("the one left untracked is reported on the next normal run", r.code === 0 && state.download === dl + 1, `${state.download - dl} calls`);

  // limits and errors ────────────────────────────────────────────────────────────────────────────────────────────
  state.budget = 2; // two calls left this "hour"
  const s0 = state.search;
  r = await run("search.mjs", ["--group", "s-cat-women,s-cat-men,s-cat-kids", "--no-sheets"]);
  check("an exhausted hourly budget is waited out, not failed on", r.code === 0 && state.search - s0 === 3 && /renew/.test(r.out), `${state.search - s0} calls, code ${r.code}\n${r.err || r.out.slice(-300)}`);
  state.fail403 = 1;
  const s1 = state.search;
  r = await run("search.mjs", ["--group", "s-cat-home", "--no-sheets"]);
  check("a rate-limit 403 is waited out and retried", r.code === 0 && state.search - s1 === 1, r.err || r.out.slice(-200));
  state.fail500 = 1;
  const s2 = state.search;
  r = await run("search.mjs", ["--group", "s-offers", "--no-sheets"]);
  check("a 5xx is retried", r.code === 0 && state.search - s2 === 1, r.err || r.out.slice(-200));
  r = await run("search.mjs", ["--group", "s-luxe", "--no-sheets"], { UNSPLASH_ACCESS_KEY: "wrong" });
  check("a wrong key stops with a message that says what to do", r.code !== 0 && /UNSPLASH_ACCESS_KEY/.test(r.err), r.err.slice(0, 200));
  r = await run("search.mjs", ["--group", "nope"]);
  check("an unknown group is refused", r.code !== 0 && /no group matches/.test(r.err), r.err);

  // status ───────────────────────────────────────────────────────────────────────────────────────────────────────
  r = await run("status.mjs");
  check("status lists the groups with picked / want", r.code === 0 && /s-festive\s+A\s+20\s+4\/3\s+4\s+4/.test(r.out) && /key\s+set/.test(r.out), r.err || r.out.slice(0, 400));

  // the free-licence rule ────────────────────────────────────────────────────────────────────────────────────────
  const { isFree } = await import(`${join(root, "scripts/unsplash/lib.mjs")}?plain`);
  check("isFree: Unsplash's own CDN yes; Unsplash+, a flagged photo and any other host no", isFree({ urls: { raw: "https://images.unsplash.com/photo-1" } }) && !isFree({ urls: { raw: "https://plus.unsplash.com/premium_photo-1" } }) && !isFree({ premium: true, urls: { raw: "https://images.unsplash.com/photo-1" } }) && !isFree({ urls: { raw: "https://example.com/a.jpg" } }) && !isFree({}));
} finally {
  server.close();
  rmSync(work, { recursive: true, force: true });
}
console.log(failures ? `\n${failures} check(s) failed` : "\nUnsplash toolkit checks OK");
process.exit(failures ? 1 : 0);
