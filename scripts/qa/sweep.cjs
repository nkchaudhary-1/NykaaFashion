// Visual sweep: viewport-height screenshots down a page, at chosen widths, for eyeballing real imagery.
//   node scripts/qa/sweep.cjs <outDir> <baseUrl> <route>[,<route>…] [--widths 390,1280] [--segments 3] [--height 900]
// Files: <outDir>/<slug>-<width>-<segment>.png. Scrolls with real wheel steps so scroll-reveals have fired.
const { chromium } = require("playwright");
const { mkdirSync } = require("node:fs");
const { resolve } = require("node:path");

const [outArg, base, routesArg] = process.argv.slice(2);
if (!outArg || !base || !routesArg) {
  console.error("usage: sweep.cjs <outDir> <baseUrl> <route,route> [--widths 390,1280] [--segments 3] [--height 900]");
  process.exit(2);
}
const flag = (name, dflt) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : dflt; };
const WIDTHS = flag("--widths", "390,1280").split(",").map(Number);
const SEGMENTS = Number(flag("--segments", "3"));
const HEIGHT = Number(flag("--height", "900"));
const out = resolve(outArg);
mkdirSync(out, { recursive: true });
const slug = (r) => (r === "/" ? "home" : r.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/-$/, ""));

(async () => {
  const browser = await chromium.launch();
  for (const w of WIDTHS) {
    const mobile = w < 700;
    const ctx = await browser.newContext({ viewport: { width: w, height: mobile ? 844 : HEIGHT }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const problems = [];
    page.on("console", (m) => m.type() === "error" && problems.push(m.text().slice(0, 160)));
    page.on("pageerror", (e) => problems.push(String(e).slice(0, 160)));
    for (const route of routesArg.split(",")) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      const vh = page.viewportSize().height;
      for (let s = 0; s < SEGMENTS; s++) {
        await page.evaluate((y) => window.scrollTo(0, y), s * (vh - 80));
        await page.waitForTimeout(650);
        await page.screenshot({ path: `${out}/${slug(route)}-${w}-${s + 1}.png` });
      }
      console.log(`✓ ${w}px ${route}`);
    }
    if (problems.length) console.log(`  console problems at ${w}px:\n   ${[...new Set(problems)].join("\n   ")}`);
    await ctx.close();
  }
  await browser.close();
})();
