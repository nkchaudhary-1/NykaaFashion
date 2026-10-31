// "Shop by category" on the home page's second fold: the tile grid (12 tiles: 11 categories and the "all categories" tile), its responsive columns, every tile's content and link,
// and the dialog behind "View all categories" (every category by department; focus trap, Escape, focus return, a bottom sheet on phones).
//   node scripts/qa/categories.cjs [baseUrl]
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
let failures = 0;
const step = async (name, fn) => {
  try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0].slice(0, 260)}`); }
};
const must = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const browser = require("./quiet.cjs")(await chromium.launch());
  const errors = [];
  const open = async (viewport, mobile = false) => {
    const ctx = await browser.newContext({ viewport, ...(mobile ? { isMobile: true, hasTouch: true } : {}) });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 160)));
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator("[data-category-grid]").waitFor();
    await page.locator("[data-category-grid]").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1400); // the tiles rise in
    return { ctx, page };
  };
  const columns = (page) => page.locator("[data-category-grid] > li").evaluateAll((els) => {
    const shown = els.filter((e) => e.offsetParent !== null);
    const tops = shown.map((e) => Math.round(e.getBoundingClientRect().top + scrollY));
    return { shown: shown.length, perRow: tops.filter((t) => t === tops[0]).length };
  });

  console.log("Shop by category — desktop 1440×900");
  let { ctx, page } = await open({ width: 1440, height: 900 });

  await step("it is the second module of the home page, right under the banner", async () => {
    const order = await page.locator("[data-module]").evaluateAll((els) => els.map((e) => e.getAttribute("data-module")));
    must(order[0] === "hero" && order[1] === "categories", `modules: ${order.slice(0, 4).join(", ")}`);
  });

  await step("it starts right under the banner: nothing sits between them, and its heading is on screen after one scroll", async () => {
    const r = await page.evaluate(() => {
      const hero = document.querySelector('[data-module="hero"]').getBoundingClientRect();
      const cats = document.querySelector('[data-module="categories"]').getBoundingClientRect();
      return { gap: Math.round(cats.top - hero.bottom), catsTop: Math.round(cats.top + scrollY), vh: innerHeight };
    });
    must(Math.abs(r.gap) <= 2, `${r.gap} px between the banner and the category section`);
    must(r.catsTop < r.vh * 1.25, `the section starts ${r.catsTop} px down (viewport ${r.vh} px) — more than a screen and a quarter`);
  });

  await step("the address …/#shop-by-category jumps straight to the section (its heading is on screen on arrival)", async () => {
    const p2 = await ctx.newPage();
    await p2.goto(BASE + "/#shop-by-category", { waitUntil: "networkidle" });
    await p2.waitForTimeout(1600);
    const r = await p2.evaluate(() => {
      const h = [...document.querySelectorAll("h2")].find((e) => /Shop by/.test(e.textContent || ""));
      const b = h?.getBoundingClientRect();
      return b ? { top: Math.round(b.top), bottom: Math.round(b.bottom), vh: innerHeight } : null;
    });
    await p2.close();
    must(r && r.top >= 0 && r.bottom <= r.vh, `heading at ${JSON.stringify(r)}`);
  });

  await step("a heading, 12 tiles (11 categories + the all-categories tile), six across", async () => {
    must((await page.getByRole("heading", { name: /Shop by category/ }).count()) === 1, "no “Shop by category” heading");
    const c = await columns(page);
    must(c.shown === 12 && c.perRow === 6, `${c.shown} tiles, ${c.perRow} across`);
  });

  await step("every category tile shows its department, name, the saving and Shop now, and links to a real listing", async () => {
    const tiles = await page.locator("[data-category-grid] > li a").evaluateAll((as) => as.map((a) => ({ href: a.getAttribute("href"), text: a.innerText.replace(/\s+/g, " ").trim(), img: !!a.querySelector("img") })));
    must(tiles.length === 11, `${tiles.length} category links`);
    for (const t of tiles) {
      must(/^\/c\/(women|men|kids|home)\/[a-z-]+$/.test(t.href), `bad href ${t.href}`);
      must(/^(Women|Men|Kids|Home) .+ (Up to \d+% off|\d+ styles?) Shop now$/i.test(t.text), `tile text: “${t.text}”`);
      must(t.img, `${t.href} has no picture`);
    }
    for (const t of tiles) {
      const r = await ctx.request.get(BASE + t.href);
      must(r.status() === 200, `${t.href} answered ${r.status()}`);
    }
  });

  await step("a tile opens its category listing", async () => {
    await page.locator("[data-category-grid]").getByRole("link", { name: /Indianwear/ }).first().click();
    await page.waitForURL(/\/c\/women\/indianwear/);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator("[data-category-grid]").scrollIntoViewIfNeeded();
  });

  await step("“View all 23 categories” opens a dialog with every category, by department, each linking to its listing", async () => {
    const trigger = page.getByRole("button", { name: /View all 23 categories/ });
    await trigger.click();
    const dlg = page.getByRole("dialog", { name: "All categories" });
    await dlg.waitFor();
    must((await dlg.getByRole("heading", { level: 3 }).count()) === 4, "expected four departments");
    const links = await dlg.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    const leaves = new Set(links.filter((h) => /^\/c\/[a-z]+\/[a-z-]+$/.test(h)));
    must(leaves.size === 23, `${leaves.size} category links in the dialog (expected 23)`);
    for (const d of ["women", "men", "kids", "home"]) must(links.includes(`/c/${d}`), `no link to all of ${d}`);
    for (const h of ["Women", "Men", "Kids", "Home & Living"]) must((await dlg.getByRole("heading", { name: h, level: 3, exact: true }).count()) === 1, `no “${h}” section`);
    must(/23 categories across 4 departments/.test(await dlg.innerText()), "dialog subtitle");
  });

  await step("focus moves into the dialog and stays there (Tab × 40), Escape closes it and focus returns to the button", async () => {
    const inside = () => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
    must(await inside(), "focus did not enter the dialog");
    for (let i = 0; i < 40; i++) await page.keyboard.press("Tab");
    must(await inside(), "focus left the dialog");
    for (let i = 0; i < 8; i++) await page.keyboard.press("Shift+Tab");
    must(await inside(), "focus left the dialog backwards");
    await page.keyboard.press("Escape");
    await page.getByRole("dialog", { name: "All categories" }).waitFor({ state: "detached" });
    const name = await page.evaluate(() => document.activeElement?.textContent?.replace(/\s+/g, " ").trim());
    must(/View all 23 categories/.test(name ?? ""), `focus returned to “${name}”`);
  });

  await step("the all-categories tile opens it too; a category in the dialog navigates and closes it", async () => {
    await page.locator("[data-category-grid]").getByRole("button", { name: /All categories/ }).click();
    const dlg = page.getByRole("dialog", { name: "All categories" });
    await dlg.waitFor();
    await dlg.getByRole("link", { name: /^Bags/ }).click();
    await page.waitForURL(/\/c\/women\/bags/);
    must((await page.getByRole("dialog", { name: "All categories" }).count()) === 0, "dialog stayed open");
  });
  await ctx.close();

  for (const [label, w, h, across] of [["tablet 1100", 1100, 900, 4], ["tablet 820", 820, 1000, 3]]) {
    console.log(`Shop by category — ${label}`);
    ({ ctx, page } = await open({ width: w, height: h }));
    await step(`12 tiles, ${across} across, no sideways scroll`, async () => {
      const c = await columns(page);
      must(c.shown === 12 && c.perRow === across, `${c.shown} tiles, ${c.perRow} across`);
      must(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "page scrolls sideways");
    });
    await ctx.close();
  }

  console.log("Shop by category — phone 390×844");
  ({ ctx, page } = await open({ width: 390, height: 844 }, true));
  await step("five categories and the all-categories tile, two across", async () => {
    const c = await columns(page);
    must(c.shown === 6 && c.perRow === 2, `${c.shown} tiles, ${c.perRow} across`);
  });
  await step("the list opens as a bottom sheet that fills the width, scrolls, and fits the screen", async () => {
    await page.getByRole("button", { name: /View all 23 categories/ }).click();
    const dlg = page.getByRole("dialog", { name: "All categories" });
    await dlg.waitFor();
    await page.waitForTimeout(700);
    const b = await dlg.boundingBox();
    must(b && Math.abs(b.x) < 1 && Math.abs(b.width - 390) < 1 && b.y + b.height >= 843, `sheet at ${JSON.stringify(b)}`);
    must(b.height <= 844 * 0.92, `sheet is ${Math.round(b.height)} px tall`);
    must(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "page scrolls sideways with the sheet open");
    const scroller = dlg.locator(".overflow-y-auto").first();
    must(await scroller.evaluate((e) => e.scrollHeight > e.clientHeight), "the list does not scroll (23 categories should not fit)");
    await dlg.getByRole("link", { name: /^All kids/ }).scrollIntoViewIfNeeded();
    must(await dlg.getByRole("link", { name: /^All kids/ }).isVisible(), "the last departments cannot be reached");
    await page.keyboard.press("Escape");
    await dlg.waitFor({ state: "detached" });
  });
  await ctx.close();

  await step("no console or page errors", async () => must(errors.length === 0, errors.slice(0, 3).join(" | ")));
  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nShop-by-category checks OK");
  process.exit(failures ? 1 : 0);
})();
