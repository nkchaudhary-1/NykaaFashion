// Link health: collect every internal link reachable from the header, mega menus, mobile menu, shop sheet, footer and home page,
// then request each one and report non-200 responses.
//   node scripts/qa/links.cjs [baseUrl]
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
(async () => {
  const browser = await chromium.launch();
  const hrefs = new Map(); // href -> where seen
  const grab = async (page, where) => {
    const list = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")));
    for (const h of list) if (h && (h.startsWith("/") && !h.startsWith("//")) && !hrefs.has(h.split("#")[0])) hrefs.set(h.split("#")[0], where);
  };
  // desktop: home + each mega menu
  let ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await grab(page, "home");
  for (const n of ["More", "Women", "Men", "Kids", "Home"]) {
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: n, exact: true }).hover();
    await page.locator("#mega-panel").waitFor();
    await page.waitForTimeout(250);
    await grab(page, `mega:${n}`);
  }
  await ctx.close();
  // phone: menu drawer (all disclosures), shop sheet (all tabs)
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open menu" }).click();
  const dlg = page.getByRole("dialog", { name: "Menu" });
  await dlg.waitFor();
  for (const b of await dlg.locator("button[aria-expanded='false']").all()) await b.click().catch(() => {});
  await grab(page, "mobile-menu");
  await page.keyboard.press("Escape");
  await page.getByRole("navigation", { name: "Primary mobile" }).getByRole("button", { name: /^Shop/ }).click();
  const sheet = page.getByRole("dialog", { name: "Shop" });
  await sheet.waitFor();
  for (const t of ["Women", "Men", "Kids", "Home"]) { await sheet.getByRole("tab", { name: t, exact: true }).click(); await page.waitForTimeout(200); await grab(page, `shop-sheet:${t}`); }
  await ctx.close();
  // fetch every href
  let bad = 0;
  const entries = Array.from(hrefs.entries());
  for (const [h, where] of entries) {
    const r = await fetch(BASE + h, { redirect: "manual" });
    if (r.status >= 400) { bad++; console.log(`✗ ${r.status} ${h}   (from ${where})`); }
  }
  console.log(`${entries.length} internal links checked${bad ? `, ${bad} broken` : " — all resolve"}`);
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
