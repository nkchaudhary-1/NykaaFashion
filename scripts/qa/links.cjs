// Link health: collect every internal link reachable from the header (department row, dropdowns, More tiles, Account menu), the mobile menu,
// shop sheet, footer and home page; request each one and report non-200 responses; then open every filtered listing link (those with a query
// string — What’s New, Sale, Western Wear, Luxe …) and report any that lands on an empty page.
//   node scripts/qa/links.cjs [baseUrl]
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
(async () => {
  const browser = await chromium.launch();
  const hrefs = new Map(); // href (with query) -> where seen
  const grab = async (page, where) => {
    const list = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")));
    for (const h of list) if (h && h.startsWith("/") && !h.startsWith("//") && !hrefs.has(h.split("#")[0])) hrefs.set(h.split("#")[0], where);
  };
  // desktop: home + each department row + each dropdown + More + Account
  let ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await grab(page, "home");
  const primary = page.getByRole("navigation", { name: "Primary" });
  for (const dept of ["Women", "Men", "Kids", "Home"]) {
    await primary.getByRole("link", { name: dept, exact: true }).hover();
    const row = page.getByRole("navigation", { name: `${dept} categories` });
    await row.waitFor();
    await grab(page, `row:${dept}`);
    const withPanel = row.locator("a[aria-haspopup='true']");
    for (let i = 0, n = await withPanel.count(); i < n; i++) {
      const t = withPanel.nth(i);
      const label = (await t.innerText()).trim();
      await t.hover();
      await page.waitForTimeout(260);
      await grab(page, `dropdown:${dept}:${label}`);
    }
  }
  await primary.getByRole("link", { name: "More", exact: true }).hover();
  await page.locator("#more-panel").waitFor();
  await page.waitForTimeout(250);
  await grab(page, "more");
  await page.mouse.move(20, 880);
  await page.getByRole("button", { name: /^Account/ }).first().hover();
  await page.waitForTimeout(300);
  await grab(page, "account-menu");
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

  // 1) every href resolves
  let bad = 0;
  const entries = Array.from(hrefs.entries());
  for (const [h, where] of entries) {
    const r = await fetch(BASE + h, { redirect: "manual" });
    if (r.status >= 400) { bad++; console.log(`✗ ${r.status} ${h}   (from ${where})`); }
  }
  console.log(`${entries.length} internal links checked${bad ? `, ${bad} broken` : " — all resolve"}`);

  // 2) filtered listings must not be empty
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await ctx.newPage();
  const listings = entries.filter(([h]) => /^\/(c|edits)\//.test(h) && h.includes("?"));
  let empty = 0;
  for (const [h, where] of listings) {
    await page.goto(BASE + h, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const n = await page.locator("main article").count();
    if (n === 0) { empty++; console.log(`✗ empty listing ${h}   (from ${where})`); }
  }
  console.log(`${listings.length} filtered listing links opened${empty ? `, ${empty} empty` : " — all show products"}`);
  await ctx.close();
  await browser.close();
  process.exit(bad || empty ? 1 : 0);
})();
