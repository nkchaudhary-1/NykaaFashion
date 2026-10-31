// Grid-alignment audit: every sizeable image must start and end on a column line of the page grid (or bleed to the viewport
// edge). The column lines are measured from a real .container-x.grid-main probe, so this tests the CSS as shipped.
//   node scripts/qa/grid.cjs [baseUrl] [--routes /,/c/women] [--widths 390,820,1280,1728]
// Exempt: images inside carousels ([data-carousel]), dialogs/drawers, or anything marked [data-nogrid].
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3200";
const flag = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const WIDTHS = flag("--widths", "390,820,1280,1728").split(",").map(Number);
const DEFAULT_ROUTES = [
  "/", "/discover", "/discover/the-block-print-revival", "/edits", "/edits/hidden-gems", "/c/women", "/c/women/dresses", "/p/poppy-smocked-midi-dress",
  "/search?q=kurta", "/brands", "/brands/ajrakh-and-ash", "/offers", "/wishlist", "/bag", "/login", "/help",
];
const ROUTES = flag("--routes", DEFAULT_ROUTES.join(",")).split(",");
const TOL = 1.6;

const probe = (tol) => {
  const vw = document.documentElement.clientWidth;
  const n = vw < 600 ? 4 : 12;
  const host = document.createElement("div");
  host.className = "container-x grid-main";
  host.style.cssText = "position:absolute;left:0;right:0;top:0;visibility:hidden;pointer-events:none;height:1px";
  for (let i = 0; i < n; i++) { const c = document.createElement("div"); c.style.height = "1px"; host.appendChild(c); }
  document.body.appendChild(host);
  const cols = Array.from(host.children).map((c) => c.getBoundingClientRect());
  host.remove();
  const starts = cols.map((r) => r.left), ends = cols.map((r) => r.right);
  const near = (a, list) => list.some((b) => Math.abs(a - b) <= tol);
  const bad = [];
  document.querySelectorAll("img").forEach((img) => {
    if (img.closest("[data-carousel], [role=dialog], [data-nogrid], [aria-hidden=true][data-overlay]")) return;
    const cs = getComputedStyle(img);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    // measure the box the image lives in (next/image fills a wrapper), falling back to the image itself
    const box = img.parentElement && img.parentElement.tagName !== "PICTURE" ? img.parentElement : img.closest("picture")?.parentElement ?? img;
    const r = img.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    const rect = Math.abs(b.width - r.width) < 2 || b.width < r.width ? r : b;
    if (rect.width < 96 || rect.height < 72) return;
    if (rect.bottom < 0 || rect.top > 1e5) return;
    let p = img; let hidden = false;
    for (; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === "none" || s.visibility === "hidden") { hidden = true; break; } }
    if (hidden) return;
    const left = rect.left, right = rect.right;
    const okL = near(left, starts) || Math.abs(left) <= tol;
    const okR = near(right, ends) || Math.abs(right - vw) <= tol;
    if (!okL || !okR) {
      const cls = String(img.className).split(/\s+/).filter(Boolean).slice(0, 3).join(".");
      const par = String(img.parentElement?.className || "").split(/\s+/).filter(Boolean).slice(0, 4).join(".");
      bad.push({ x: `${Math.round(left * 10) / 10}→${Math.round(right * 10) / 10}`, w: Math.round(rect.width), src: (img.currentSrc || img.src || "").split("/").slice(-1)[0].slice(0, 40), cls, par, l: okL, r: okR });
    }
  });
  return { starts: starts.map((x) => Math.round(x * 10) / 10), ends: ends.map((x) => Math.round(x * 10) / 10), bad };
};

(async () => {
  const browser = await chromium.launch();
  let findings = 0;
  for (const w of WIDTHS) {
    const mobile = w < 700;
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" }); // settled state: reveals and parallax are exercised by motion.cjs
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: "networkidle" });
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
      await page.waitForTimeout(350);
      const r = await page.evaluate(probe, TOL);
      if (r.bad.length) {
        findings += r.bad.length;
        console.log(`✗ ${w}px ${route}   (columns start at ${r.starts.slice(0, 4).join(", ")}…)`);
        for (const b of r.bad.slice(0, 8)) console.log(`    ${b.x} (w ${b.w})${b.l ? "" : " ←off"}${b.r ? "" : " →off"}  ${b.src}  [${b.cls}]  in ${b.par}`);
      }
    }
    await ctx.close();
  }
  await browser.close();
  console.log(findings ? `\n${findings} image(s) off the column grid` : "\nEvery image sits on the column grid at every width");
  process.exit(findings ? 1 : 0);
})();
