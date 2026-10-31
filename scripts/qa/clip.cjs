// Headline ink must not be cut off by its own reveal mask. Poster-scale headings are split into words, each inside an overflow:hidden mask (.rt-w) so it can rise into view; with the
// negative tracking of display type the last letter of a word (s, &, e …) reaches past its mask and was being cropped ("Tops & Tees" lost the right edge of every final "s").
// For every revealed heading on every route and width: render it settled, render it again with the masks open, and fail if the two differ.
// (Under prefers-reduced-motion the masks are not applied at all, so this runs with motion allowed.)
//   node scripts/qa/clip.cjs [baseUrl] [--widths 390,820,1024,1440,1728] [--routes /,/c/women]
const { chromium } = require("playwright");
const sharp = require("sharp");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const flag = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const WIDTHS = flag("--widths", "390,820,1024,1440,1728").split(",").map(Number);
const ROUTES = flag("--routes", "")
  ? flag("--routes", "").split(",")
  : [
      "/", "/discover", "/discover/the-block-print-revival", "/discover/diwali-dressed-slowly", "/edits", "/edits/luxe", "/edits/festive", "/edits/under-1500",
      "/c/women", "/c/women/tops", "/c/women/dresses", "/c/women/indianwear", "/c/men", "/c/men/shirts", "/c/kids", "/c/home/cushions", "/c/women/jewellery",
      "/search?q=kurta", "/brands", "/brands/ajrakh-and-ash", "/offers", "/wishlist", "/bag", "/help", "/info/shipping", "/info/about", "/sitemap", "/credits",
      "/new-and-next", "/new-and-next/vrisa", "/new-and-next/halden", "/prototype", "/404-not-a-page",
    ];

let failures = 0;
(async () => {
  const browser = await chromium.launch();
  let checked = 0;
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "no-preference", deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    // pop-ups are not what this checks
    await page.addInitScript(() => { try { sessionStorage.setItem("nf.promo.visit", JSON.stringify({ shown: ["vrisa-teaser", "halden-preview", "first-order", "delivery-notice"] })); localStorage.setItem("nf.promo", JSON.stringify({ dismissed: {}, engaged: {}, lastDismissAt: Date.now() })); } catch {} });
    for (const route of ROUTES) {
      try {
        await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 });
      } catch {
        continue;
      }
      await page.addStyleTag({ content: "html.js [data-reveal] , html.js [data-reveal] .rt-i { transition: none !important; opacity: 1 !important; transform: none !important; } *, *::before, *::after { animation: none !important; } .nf-cursor { display: none !important; }" });
      await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((e) => e.setAttribute("data-in", "")));
      const heads = await page.locator('[data-reveal="text"]:has(.rt-w)').count();
      for (let i = 0; i < heads; i++) {
        const h = page.locator('[data-reveal="text"]:has(.rt-w)').nth(i);
        if (!(await h.isVisible())) continue;
        await h.scrollIntoViewIfNeeded();
        const box = await h.boundingBox();
        if (!box || box.width < 40) continue;
        const pad = Math.ceil((await h.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))) * 0.3);
        const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(w, box.width + 2 * pad), height: box.height + 2 * pad };
        if (clip.y + clip.height > 900) continue; // a heading taller than the window cannot be framed; the others in the list cover the same class
        const closed = await page.screenshot({ clip });
        const open = await page.addStyleTag({ content: ".rt-w { overflow: visible !important; }" });
        const free = await page.screenshot({ clip });
        await open.evaluate((el) => el.remove());
        const a = await sharp(closed).raw().toBuffer();
        const b = await sharp(free).raw().toBuffer();
        let diff = 0;
        for (let k = 0; k < a.length; k += 3) if (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 60) diff++;
        checked++;
        if (diff > 6) {
          failures++;
          const text = (await h.innerText()).replace(/\s+/g, " ").slice(0, 40);
          console.log(`  ✗ ${w}px ${route}: “${text}” — ${diff} pixels of lettering are hidden by the word masks`);
        }
      }
    }
    await ctx.close();
  }
  await browser.close();
  console.log(failures ? `\n${failures} heading(s) are cropped (${checked} checked)` : `No cropped headline lettering (${checked} headings checked across ${ROUTES.length} routes × ${WIDTHS.length} widths)`);
  process.exit(failures ? 1 : 0);
})();
