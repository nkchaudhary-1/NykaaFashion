// Finds elements that stick out past the viewport (horizontal overflow) on every route, at several widths.
//   node scripts/qa/overflow.cjs [baseUrl] [--widths 390,820,1280]
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const wi = process.argv.indexOf("--widths");
const WIDTHS = wi > -1 ? process.argv[wi + 1].split(",").map(Number) : [360, 390, 820, 1280];
const PAGES = [
  "/", "/discover", "/discover/the-block-print-revival", "/edits", "/edits/hidden-gems", "/edits/the-offer-edit", "/c/women", "/c/women/dresses", "/c/home/cushions",
  "/p/poppy-smocked-midi-dress", "/p/satin-corset-top", "/p/sequin-slip-mini", "/search?q=kurta", "/search?q=zzzz", "/brands", "/brands/ajrakh-and-ash", "/offers", "/wishlist", "/bag",
  "/login", "/help", "/prototype", "/info/shipping",
];
const AUTHED = ["/account", "/account/orders", "/account/orders/nf-26100377", "/account/addresses"];

const probe = () => {
  const vw = document.documentElement.clientWidth;
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (p !== document.body && ["auto", "scroll", "hidden", "clip"].includes(ox)) return true;
    }
    return false;
  };
  const out = new Map();
  document.querySelectorAll("body *").forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.position === "fixed" || cs.display === "none" || cs.visibility === "hidden") return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.right <= vw + 1 || clipped(el)) return;
    const key = `${el.tagName.toLowerCase()}.${String(el.className).split(" ").filter(Boolean).slice(0, 3).join(".")}`;
    if (!out.has(key)) out.set(key, Math.round(r.right));
  });
  return { vw, scrollW: document.documentElement.scrollWidth, items: Array.from(out.entries()).slice(0, 5) };
};

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 700, hasTouch: w < 700 });
    const page = await ctx.newPage();
    const run = async (path) => {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(450);
      const r = await page.evaluate(probe);
      if (r.items.length || r.scrollW > r.vw + 1) {
        bad++;
        console.log(`✗ ${w}px ${path}  (scrollWidth ${r.scrollW} > ${r.vw})\n    ${r.items.map(([k, right]) => `${k} → ${right}px`).join("\n    ")}`);
      }
    };
    for (const p of PAGES) await run(p);
    await page.goto(BASE + "/login", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Use the demo account/ }).click();
    await page.getByRole("button", { name: "Send code" }).click();
    await page.getByLabel("One-time code").fill("123456");
    await page.waitForURL(/\/account$/);
    for (const p of AUTHED) await run(p);
    // overlays
    for (const [name, open] of [["search", async () => { await page.goto(BASE + "/", { waitUntil: "networkidle" }); await page.keyboard.press("/"); }], ["bag drawer", async () => { await page.goto(BASE + "/", { waitUntil: "networkidle" }); await page.getByRole("button", { name: /^Bag/ }).first().click(); }]]) {
      await open();
      await page.waitForTimeout(700);
      const r = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]');
        if (!d) return { items: [], scrollW: 0, vw: 0 };
        const vw = document.documentElement.clientWidth; const bad = [];
        d.querySelectorAll("*").forEach((el) => { const b = el.getBoundingClientRect(); if (b.width && b.right > vw + 1) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")} → ${Math.round(b.right)}px`); });
        return { items: bad.slice(0, 4).map((k) => [k, 0]), scrollW: d.scrollWidth, vw };
      });
      if (r.items.length) { bad++; console.log(`✗ ${w}px overlay:${name}\n    ${r.items.map(([k]) => k).join("\n    ")}`); }
      await page.keyboard.press("Escape");
    }
    await ctx.close();
  }
  console.log(bad ? `\n${bad} overflow finding(s)` : "\nNo horizontal overflow at any width");
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
