// Captures the real site, state by state, for the launch video (docs/LAUNCH_VIDEO.md).
// It drives a running production build (scripts/qa/prod.sh 3100) with Playwright and writes, to --out:
//   • JPEG stills at 2× — the hero, tall strips of single home modules (header hidden, everything settled), states (dialogs, pop-up, returning / deal intent), product and
//     New & Next pages, and tablet / phone captures
//   • geometry.json — the page rectangles of tiles, chips and buttons inside those stills, so the video can point at exact things (outline a tile, click a button)
// Nothing is mocked: every picture is the page as the browser draws it. The same two supplied photographs are the only imagery.
//   node scripts/video/capture.cjs [baseUrl] [--out <dir>] [--only hero,bleed-feed]
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const flag = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const OUT = path.resolve(flag("--out", path.join(__dirname, "out", "shots")));
const ONLY = flag("--only", "") ? new Set(flag("--only", "").split(",")) : null;
fs.mkdirSync(OUT, { recursive: true });

let geometry = {};
let manifest = {};
if (ONLY && fs.existsSync(path.join(OUT, "geometry.json"))) ({ geometry, manifest } = JSON.parse(fs.readFileSync(path.join(OUT, "geometry.json"), "utf8")));
const want = (name) => !ONLY || ONLY.has(name);
const log = (...a) => console.log("  ", ...a);

// everything the pages hide until it is scrolled to or animated in is shown at once; motion is off, so nothing moves while a still is taken
const SETTLE_CSS = "html.js [data-reveal], html.js [data-reveal] .rt-i { transition: none !important; opacity: 1 !important; transform: none !important; } *, *::before, *::after { animation: none !important; caret-color: transparent !important; } .nf-cursor { display: none !important; }";
// page chrome that floats over a strip (sticky header, phone navigation) is taken out of the picture; the header is captured on its own
const STRIP_CSS = "header.sticky, nav[aria-label='Primary mobile'], div[class*='z-[39]'] { display: none !important; }";

const PREFS = (layout) => `try { localStorage.setItem("nf.prefs", JSON.stringify({ v: 1, d: { announceDismissed: true, slowNetwork: false, failNext: false, failModule: null, homeLayout: ${JSON.stringify(layout)}, recentSearches: [], savedStories: [], notify: [], newsletter: null, reviews: [], helpful: [], messages: [] } })); } catch (e) {}`;
const QUIET = `try { sessionStorage.setItem("nf.promo.visit", JSON.stringify({ v: 1, d: { shown: ["qa-quiet-1", "qa-quiet-2"] } })); } catch (e) {}`;
const INTENT = (override) => `try { localStorage.setItem("nf.intent", JSON.stringify({ v: 1, d: { events: 6, weights: { category: { "women/dresses": 3, "women/indianwear": 2 }, label: { "twenty-dresses": 3, "gajra-gang": 2 }, edit: {}, tag: { festive: 2 } }, recent: ["twd-01", "aja-01", "gaj-01", "lik-01", "til-01"], dealScore: 0, override: ${JSON.stringify(override)}, lastSignalAt: 0 } })); } catch (e) {}`;

async function open(browser, { w = 1440, h = 810, dpr = 2, mobile = false, layout = "classic", intent = null, quiet = true }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, reducedMotion: "reduce", ...(mobile ? { isMobile: true, hasTouch: true } : {}) });
  await ctx.addInitScript(PREFS(layout));
  if (quiet) await ctx.addInitScript(QUIET);
  if (intent) await ctx.addInitScript(INTENT(intent));
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log("page error:", String(e).slice(0, 120)));
  return { ctx, page };
}

async function settle(page, { strip = false, wait = 900 } = {}) {
  await page.addStyleTag({ content: SETTLE_CSS + (strip ? STRIP_CSS : "") });
  await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((e) => e.setAttribute("data-in", "")));
  // lazy pictures far down the page: ask for them now and wait until every one has arrived
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = "eager"; });
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 15000); }))));
  });
  await page.waitForTimeout(wait);
}

async function go(page, url, opts) {
  await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(500);
  await settle(page, opts);
}

const jpg = { type: "jpeg", quality: 92 };
async function still(page, name, clip) {
  const file = path.join(OUT, `${name}.jpg`);
  await page.screenshot({ path: file, ...jpg, ...(clip ? { clip, fullPage: true } : {}) });
  const vw = await page.evaluate(() => document.documentElement.clientWidth);
  manifest[name] = { file: `${name}.jpg`, cssWidth: clip ? clip.width : vw, cssHeight: clip ? clip.height : await page.evaluate(() => innerHeight) };
  log("still", name, `${manifest[name].cssWidth}×${manifest[name].cssHeight} css px`);
}

/** one home module (or any element) as a tall strip: the element's own box, header hidden */
async function moduleStrip(page, name, selector, { pad = 0, extra = null, max = 4600 } = {}) {
  const el = page.locator(selector).first();
  await el.waitFor({ timeout: 20000 });
  await el.scrollIntoViewIfNeeded();
  const box = await el.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: 0, y: r.top + scrollY, w: document.documentElement.clientWidth, h: r.height, left: r.left, top: r.top + scrollY }; });
  const h = Math.min(Math.ceil(box.h) + pad, max);
  await still(page, name, { x: 0, y: Math.floor(box.y), width: box.w, height: h });
  if (extra) geometry[name] = await page.evaluate(extra, { top: Math.floor(box.y) });
}

/** rectangles (page px, relative to the strip's top-left) of everything matching `sel`, with its visible text */
const tileRects = ({ top }, sel = "[data-category-grid] > li") =>
  [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null).map((e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left * 10) / 10, y: Math.round((r.top + scrollY - top) * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, text: e.innerText.replace(/\s+/g, " ").trim().slice(0, 80) }; });

async function main() {
  const browser = await chromium.launch();
  const t0 = Date.now();

  // ── desktop, classic layout ─────────────────────────────────────────────────────────────────────
  if (want("hero") || want("classic")) {
    const { ctx, page } = await open(browser, { layout: "classic" });
    await go(page, "/");
    if (want("hero")) {
      await still(page, "hero");
      const hb = await page.evaluate(() => { const r = document.querySelector("header.sticky").getBoundingClientRect(); return { top: r.top, height: r.height }; });
      await still(page, "header", { x: 0, y: hb.top, width: 1440, height: Math.ceil(hb.height) });
      geometry.hero = { header: hb.height, headerTop: hb.top, viewport: [1440, 810] };
    }
    if (want("classic")) {
      await page.addStyleTag({ content: STRIP_CSS });
      await moduleStrip(page, "classic-categories", '[data-module="categories"]', {
        extra: ({ top }) => {
          const rel = (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY - top, w: r.width, h: r.height }; };
          const tiles = [...document.querySelectorAll("[data-category-grid] > li")].filter((e) => e.offsetParent !== null).map((e) => ({ ...rel(e), text: e.innerText.replace(/\s+/g, " ").trim().slice(0, 80) }));
          const button = [...document.querySelectorAll("button")].find((b) => /View all \d+ categories/.test(b.textContent || ""));
          return { tiles, button: button ? rel(button) : null, heading: rel(document.querySelector('[data-module="categories"] h2')) };
        },
      });
      await moduleStrip(page, "classic-intro", '[data-module="intro"]');
      await moduleStrip(page, "classic-brands", '[data-module="brands"]');
      await moduleStrip(page, "classic-edits", '[data-module="edits"]');
      // the all-categories dialog (a real click on the real button)
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator('[data-module="categories"]').scrollIntoViewIfNeeded();
      const btn = page.getByRole("button", { name: /View all 23 categories/ });
      await btn.click();
      await page.getByRole("dialog", { name: "All categories" }).waitFor();
      await page.waitForTimeout(1200);
      await still(page, "cat-dialog");
    }
    await ctx.close();
  }

  // ── desktop, full-bleed layout ──────────────────────────────────────────────────────────────────
  if (want("bleed")) {
    const { ctx, page } = await open(browser, { layout: "bleed" });
    await go(page, "/", { strip: true });
    await moduleStrip(page, "bleed-categories", '[data-module="categories"]', {
      extra: ({ top }) => {
        const rel = (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY - top, w: r.width, h: r.height }; };
        const tiles = [...document.querySelectorAll("[data-category-grid] > li")].filter((e) => e.offsetParent !== null).map((e) => ({ ...rel(e), text: e.innerText.replace(/\s+/g, " ").trim().slice(0, 80) }));
        const button = [...document.querySelectorAll("button")].find((b) => /View all \d+ categories/.test(b.textContent || ""));
        return { tiles, button: button ? rel(button) : null, heading: rel(document.querySelector('[data-module="categories"] h2')) };
      },
    });
    await moduleStrip(page, "bleed-price", '[data-module="pricestrip"]');
    await moduleStrip(page, "bleed-celebration", '[data-module="celebration"]');
    await moduleStrip(page, "bleed-brands", '[data-module="brands"]');
    await moduleStrip(page, "bleed-newin", '[data-module="newin"]');
    await moduleStrip(page, "bleed-edits", '[data-module="edits"]');
    await moduleStrip(page, "bleed-trending", '[data-module="trending"]');
    await ctx.close();
  }

  // ── the feed, for a visitor who has looked around (so the reasons are personal) ─────────────────
  if (want("feed") || want("bleed")) {
    const { ctx, page } = await open(browser, { layout: "bleed", intent: "returning" });
    await go(page, "/", { strip: true });
    const feed = page.locator('[data-feed="home"]');
    await feed.scrollIntoViewIfNeeded();
    await page.evaluate(() => { const f = document.querySelector('[data-feed="home"]'); window.scrollTo(0, f.getBoundingClientRect().bottom + scrollY - innerHeight + 160); });
    await page.waitForFunction(() => document.querySelectorAll('[data-feed="home"] [data-feed-tile]').length >= 40, null, { timeout: 15000 }).catch(() => {});
    await settle(page, { strip: true, wait: 1200 });
    await moduleStrip(page, "bleed-feed", '[data-feed="home"]', {
      max: 3400,
      extra: ({ top }) => [...document.querySelectorAll('[data-feed="home"] [data-feed-tile]')].map((e) => {
        const r = e.closest("li").getBoundingClientRect();
        const chip = e.querySelector("[data-strip] > span.inline-flex");
        const c = chip && chip.getBoundingClientRect();
        return { x: r.left, y: r.top + scrollY - top, w: r.width, h: r.height, reason: chip ? chip.textContent.trim() : "", chip: c ? { x: c.left, y: c.top + scrollY - top, w: c.width, h: c.height } : null, text: e.innerText.split("\n").map((l) => l.trim()).filter(Boolean).join(" · ").slice(0, 90) };
      }),
    });
    await ctx.close();
  }

  // ── desktop, intent states (full-bleed) ─────────────────────────────────────────────────────────
  if (want("states")) {
    for (const [intent, sel, name] of [["returning", '[data-module="trail"]', "bleed-trail"], ["deal", '[data-module="offers"]', "bleed-offers"]]) {
      const { ctx, page } = await open(browser, { layout: "bleed", intent });
      await go(page, "/", { strip: true });
      await moduleStrip(page, name, sel);
      await ctx.close();
    }
    const { ctx, page } = await open(browser, { layout: "classic", intent: "returning" });
    await go(page, "/", { strip: true });
    await moduleStrip(page, "classic-rail", '[data-module="rail"]');
    await ctx.close();
  }

  // ── product pages, New & Next, the pop-up ───────────────────────────────────────────────────────
  if (want("pages")) {
    const { ctx, page } = await open(browser, { layout: "bleed" });
    await go(page, "/p/poppy-smocked-midi-dress");
    await still(page, "pdp-top");
    await page.addStyleTag({ content: STRIP_CSS });
    await moduleStrip(page, "pdp-feed", '[data-feed^="pdp-"]', {
      max: 3000,
      extra: ({ top }) => [...document.querySelectorAll('[data-feed^="pdp-"] [data-feed-tile]')].slice(0, 24).map((e) => {
        const r = e.closest("li").getBoundingClientRect();
        const chip = e.querySelector("[data-strip] > span.inline-flex");
        const c = chip && chip.getBoundingClientRect();
        return { x: r.left, y: r.top + scrollY - top, w: r.width, h: r.height, reason: chip ? chip.textContent.trim() : "", chip: c ? { x: c.left, y: c.top + scrollY - top, w: c.width, h: c.height } : null };
      }),
    });
    await page.addStyleTag({ content: "header.sticky { display: block !important; }" });
    await page.evaluate(() => window.scrollTo(0, 0));
    await go(page, "/p/gingham-wrap-mini");
    await still(page, "pdp2-top");
    await go(page, "/new-and-next");
    await still(page, "nn-hub");
    geometry["nn-hub"] = await page.evaluate(() => { const r = (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }; const t = document.querySelector('[role="timer"]'); const n = [...document.querySelectorAll("button")].find((b) => /Notify me/.test(b.textContent || "")); return { timer: t ? r(t) : null, notify: n ? r(n) : null }; });
    await go(page, "/new-and-next/vrisa");
    await still(page, "nn-brand");
    geometry["nn-brand"] = await page.evaluate(() => { const r = (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }; const t = document.querySelector('[role="timer"]'); const n = [...document.querySelectorAll("button")].find((b) => /Notify me/.test(b.textContent || "")); return { timer: t ? r(t) : null, notify: n ? r(n) : null }; });
    await ctx.close();

    const pip = await open(browser, { layout: "bleed", quiet: false });
    await pip.page.goto(BASE + "/?promo=vrisa-teaser", { waitUntil: "networkidle" });
    await pip.page.locator("[data-promo]").first().waitFor({ timeout: 20000 }).catch(() => log("pop-up did not appear"));
    await settle(pip.page, { wait: 1800 });
    await still(pip.page, "pip");
    geometry.pip = await pip.page.evaluate(() => { const e = document.querySelector("[data-promo]"); const r = e && e.getBoundingClientRect(); return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null; });
    await pip.ctx.close();
  }

  // ── tablet and phone ────────────────────────────────────────────────────────────────────────────
  if (want("devices")) {
    {
      const { ctx, page } = await open(browser, { w: 820, h: 1180, layout: "bleed" });
      await go(page, "/", { strip: true });
      await moduleStrip(page, "tablet-categories", '[data-module="categories"]', { extra: tileRects });
      await ctx.close();
    }
    const { ctx, page } = await open(browser, { w: 390, h: 844, mobile: true, layout: "bleed" });
    await go(page, "/");
    await still(page, "phone-hero");
    await page.addStyleTag({ content: STRIP_CSS });
    await moduleStrip(page, "phone-categories", '[data-module="categories"]', { extra: tileRects });
    await moduleStrip(page, "phone-price", '[data-module="pricestrip"]');
    await moduleStrip(page, "phone-trending", '[data-module="trending"]');
    await page.evaluate(() => { const f = document.querySelector('[data-feed="home"]'); window.scrollTo(0, f.getBoundingClientRect().top + scrollY); });
    await page.waitForTimeout(900);
    await moduleStrip(page, "phone-feed", '[data-feed="home"]', { max: 3600 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.addStyleTag({ content: "header.sticky, nav[aria-label='Primary mobile'] { display: block !important; }" });
    await page.locator('[data-module="categories"]').scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /View all 23 categories/ }).click();
    await page.getByRole("dialog", { name: "All categories" }).waitFor();
    await page.waitForTimeout(1200);
    await still(page, "phone-sheet");
    await ctx.close();

    const p2 = await open(browser, { w: 390, h: 844, mobile: true, layout: "bleed" });
    await go(p2.page, "/p/poppy-smocked-midi-dress");
    await still(p2.page, "phone-pdp");
    await p2.page.addStyleTag({ content: STRIP_CSS });
    await moduleStrip(p2.page, "phone-pdp-feed", '[data-feed^="pdp-"]', { max: 3400 });
    await p2.ctx.close();
  }

  fs.writeFileSync(path.join(OUT, "geometry.json"), JSON.stringify({ manifest, geometry }, null, 1));
  await browser.close();
  console.log(`captured ${Object.keys(manifest).length} stills in ${Math.round((Date.now() - t0) / 1000)} s → ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
