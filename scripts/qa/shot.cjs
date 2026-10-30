// Screenshot + health check. Usage:
//   node scripts/qa/shot.cjs <url> <out.png> [--w 1440] [--h 900] [--full] [--wait 600] [--scroll 800] [--mobile] [--eval "js"] [--click "selector"]
// Prints console errors / page errors / failed requests so every shot doubles as a runtime check.
const { chromium } = require("playwright");
const args = process.argv.slice(2);
const [url, out] = args;
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(`--${k}`);
(async () => {
  const mobile = flag("mobile");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: +opt("w", mobile ? 390 : 1440), height: +opt("h", mobile ? 844 : 900) },
    deviceScaleFactor: +opt("dpr", 1),
    isMobile: mobile, hasTouch: mobile,
    reducedMotion: flag("reduced") ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  const problems = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) problems.push(`[console.${m.type()}] ${m.text().slice(0, 300)}`); });
  page.on("pageerror", (e) => problems.push(`[pageerror] ${String(e).slice(0, 300)}`));
  page.on("requestfailed", (r) => problems.push(`[requestfailed] ${r.url().slice(0, 140)} ${r.failure()?.errorText}`));
  page.on("response", (r) => { if (r.status() >= 400) problems.push(`[http ${r.status()}] ${r.url().slice(0, 140)}`); });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch((e) => problems.push(`[goto] ${e.message}`));
  if (flag("sweep") || flag("full")) {
    // Scroll through the page so scroll-reveal (IntersectionObserver) content is shown, then return to top.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(90); }
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
  }
  if (opt("click")) { await page.click(opt("click")); }
  if (opt("eval")) { await page.evaluate(opt("eval")); }
  if (opt("scroll")) { await page.evaluate((y) => window.scrollTo(0, y), +opt("scroll")); }
  await page.waitForTimeout(+opt("wait", 700));
  if (out) await page.screenshot({ path: out, fullPage: flag("full") });
  const title = await page.title();
  console.log(`title: ${title}`);
  console.log(problems.length ? problems.join("\n") : "no console/page/network problems");
  await browser.close();
})();
