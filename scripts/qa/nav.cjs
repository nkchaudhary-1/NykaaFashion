// Navigation checks: top bar (desktop + phone), mega menus, menu drawer, shop sheet, bottom navigation, search, counts.
//   node scripts/qa/nav.cjs [baseUrl]
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
let failures = 0;
async function step(name, fn) {
  try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0].slice(0, 220)}`); }
}
const must = (c, m) => { if (!c) throw new Error(m); };
const settle = (p, ms = 450) => p.waitForTimeout(ms);

(async () => {
  const browser = await chromium.launch();

  // ── Desktop ──────────────────────────────────────────────
  console.log("Desktop 1440×900");
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 140)));
    await page.goto(BASE + "/", { waitUntil: "networkidle" });

    await step("logo links home; primary nav lists Edits, Discover, Women, Men, Kids, Home", async () => {
      const nav = page.getByRole("navigation", { name: "Primary" });
      for (const n of ["Edits", "Discover", "Women", "Men", "Kids", "Home"]) must(await nav.getByRole("link", { name: n, exact: true }).count() === 1, `missing nav link ${n}`);
      must((await page.getByRole("link", { name: /Nykaa Fashion — home/ }).first().getAttribute("href")) === "/", "logo href");
    });

    await step("search button opens the dialog, Esc closes it and returns focus", async () => {
      const btn = page.getByRole("button", { name: /Search labels, edits, styles/ }).first();
      await btn.click();
      await page.getByRole("dialog", { name: "Search" }).waitFor();
      must(await page.getByRole("combobox").first().evaluate((el) => el === document.activeElement), "search input not focused");
      await page.keyboard.press("Escape");
      await page.getByRole("dialog", { name: "Search" }).waitFor({ state: "detached" });
      await settle(page, 200);
      must(await btn.evaluate((el) => el === document.activeElement), "focus did not return to the search button");
    });

    await step("“/” opens search; typing + ArrowDown + Enter navigates", async () => {
      await page.keyboard.press("/");
      await page.getByRole("dialog", { name: "Search" }).waitFor();
      await page.keyboard.type("kurta", { delay: 25 });
      await page.getByRole("option").first().waitFor();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await page.waitForURL(/\/(search|p|brands|c|edits)\//, { timeout: 8000 }).catch(() => {});
      must(!/\/$/.test(new URL(page.url()).pathname) || /search/.test(page.url()), "did not navigate away from home");
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
    });

    await step("hovering Women opens the mega menu; a category link navigates and closes it", async () => {
      await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Women", exact: true }).hover();
      await page.locator("#mega-panel").waitFor();
      const link = page.locator("#mega-panel").getByRole("link", { name: /^Dresses/ }).first();
      await link.click();
      await page.waitForURL(/\/c\/women\/dresses/);
      await page.locator("#mega-panel").waitFor({ state: "detached" });
    });

    await step("current section is marked aria-current in the nav", async () => {
      must((await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Women", exact: true }).getAttribute("aria-current")) === "page", "Women not aria-current on /c/women/dresses");
    });

    await step("keyboard: focusing Men opens its panel, Tab enters it, Esc closes and keeps focus on Men", async () => {
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      const men = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Men", exact: true });
      await men.focus();
      await page.locator("#mega-panel").waitFor();
      await page.keyboard.press("Tab");
      must(await page.evaluate(() => !!document.activeElement?.closest("#mega-panel")), "Tab did not move focus into the panel");
      await page.keyboard.press("Escape");
      await page.locator("#mega-panel").waitFor({ state: "detached" });
      must(await men.evaluate((el) => el === document.activeElement), "focus not back on Men after Esc");
    });

    await step("Edits mega menu lists the five edits + computed edits", async () => {
      await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Edits", exact: true }).hover();
      await page.locator("#mega-panel").waitFor();
      for (const t of ["Hidden Gems", "Luxe", "The Responsible Edit", "Festive & Wedding", "House of Nykaa"]) must(await page.locator("#mega-panel").getByRole("link", { name: new RegExp(t.replace("&", "&")) }).count() > 0, `missing ${t}`);
      await page.mouse.move(700, 600);
      await page.locator("#mega-panel").waitFor({ state: "detached" });
    });

    await step("New in and Offers links work", async () => {
      await page.getByRole("link", { name: "New in", exact: true }).first().click();
      await page.waitForURL(/\/edits\/new-in/);
      await page.getByRole("link", { name: "Offers", exact: true }).first().click();
      await page.waitForURL(/\/offers/);
    });

    await step("wishlist count appears on the header action; Wishlist opens the page", async () => {
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /^Save .* to wishlist/ }).first().click();
      await page.getByRole("button", { name: /^Wishlist, 1 item/ }).waitFor({ timeout: 4000 });
      await page.getByRole("button", { name: /^Wishlist/ }).click();
      await page.waitForURL(/\/wishlist/);
    });

    await step("Bag opens the drawer on desktop; Esc closes and returns focus", async () => {
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      const bag = page.getByRole("button", { name: /^Bag/ }).first();
      await bag.click();
      await page.getByRole("dialog", { name: "Shopping bag" }).waitFor();
      await page.keyboard.press("Escape");
      await page.getByRole("dialog", { name: "Shopping bag" }).waitFor({ state: "detached" });
      await settle(page, 200);
      must(await bag.evaluate((el) => el === document.activeElement), "focus did not return to Bag");
    });

    await step("header steps away on scroll down and returns on scroll up", async () => {
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      const top = () => page.locator("header").first().evaluate((el) => Math.round(el.getBoundingClientRect().top));
      await page.mouse.wheel(0, 900); await settle(page, 700);
      must((await top()) < -20, `header still visible after scrolling down (top ${await top()})`);
      await page.mouse.wheel(0, -300); await settle(page, 700);
      must((await top()) >= 0, `header did not come back on scroll up (top ${await top()})`);
    });

    await step("no bottom navigation on desktop", async () => {
      must(!(await page.getByRole("navigation", { name: "Primary mobile" }).isVisible()), "bottom nav visible on desktop");
    });

    await step("no uncaught page errors", async () => must(errors.length === 0, errors.join(" | ")));
    await ctx.close();
  }

  // ── Phone ────────────────────────────────────────────────
  console.log("Phone 390×844");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 140)));
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const bottom = page.getByRole("navigation", { name: "Primary mobile" });

    await step("top bar: menu · logo · account, then a full-width search field", async () => {
      await page.getByRole("button", { name: "Open menu" }).waitFor();
      await page.getByRole("link", { name: /Nykaa Fashion — home/ }).first().waitFor();
      await page.getByRole("button", { name: /Sign in or create account/ }).first().waitFor();
      const box = await page.getByRole("button", { name: /Search labels, edits, styles/ }).first().boundingBox();
      must(box && box.width > 340, `search field not full width (${box?.width})`);
    });

    await step("bottom nav: Home · Shop · Edits · Wishlist · Bag, Home is current", async () => {
      for (const n of ["Home", "Shop", "Edits", "Wishlist", "Bag"]) must(await bottom.getByText(n, { exact: true }).count() > 0, `missing ${n}`);
      must((await bottom.getByRole("link", { name: /^Home/ }).getAttribute("aria-current")) === "page", "Home not current");
      const b = await bottom.boundingBox();
      must(b && Math.abs(b.y + b.height - 844) < 2, "bottom nav is not pinned to the bottom edge");
      must(b.height >= 56, `bottom nav too short (${b.height})`);
    });

    await step("menu drawer opens, traps focus, Esc closes and restores focus", async () => {
      const open = page.getByRole("button", { name: "Open menu" });
      await open.click();
      await page.getByRole("dialog", { name: "Menu" }).waitFor();
      for (let i = 0; i < 40; i++) { await page.keyboard.press("Tab"); if (!(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')))) throw new Error("focus escaped the menu drawer"); }
      await page.keyboard.press("Escape");
      await page.getByRole("dialog", { name: "Menu" }).waitFor({ state: "detached" });
      await settle(page, 250);
      must(await open.evaluate((el) => el === document.activeElement), "focus did not return to the menu button");
    });

    await step("menu drawer: department disclosure → category link navigates and closes the drawer", async () => {
      await page.getByRole("button", { name: "Open menu" }).click();
      const dlg = page.getByRole("dialog", { name: "Menu" });
      await dlg.getByRole("button", { name: /^Women/ }).click();
      await dlg.getByRole("link", { name: /^Dresses/ }).first().click();
      await page.waitForURL(/\/c\/women\/dresses/);
      await page.getByRole("dialog", { name: "Menu" }).waitFor({ state: "detached" });
    });

    await step("Shop opens the category sheet; tabs switch department; links navigate", async () => {
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      await bottom.getByRole("button", { name: /^Shop/ }).click();
      const sheet = page.getByRole("dialog", { name: "Shop" });
      await sheet.waitFor();
      await sheet.getByRole("tab", { name: "Men", exact: true }).click();
      await sheet.getByRole("link", { name: /Shop all men/i }).click();
      await page.waitForURL(/\/c\/men/);
      await page.getByRole("dialog", { name: "Shop" }).waitFor({ state: "detached" });
    });

    await step("Edits / Wishlist / Bag tabs go to their pages and show as current", async () => {
      for (const [name, re] of [["Edits", /\/edits$/], ["Wishlist", /\/wishlist/], ["Bag", /\/bag/]]) {
        await bottom.getByRole("link", { name: new RegExp(`^${name}`) }).click();
        await page.waitForURL(re);
        await settle(page, 250);
        must((await bottom.getByRole("link", { name: new RegExp(`^${name}`) }).getAttribute("aria-current")) === "page", `${name} not marked current`);
      }
    });

    await step("saving a piece updates the Wishlist badge in the bottom nav", async () => {
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      const before = await bottom.getByRole("link", { name: /^Wishlist/ }).innerText();
      await page.getByRole("button", { name: /^Save .* to wishlist/ }).first().click();
      await settle(page, 400);
      const after = await bottom.getByRole("link", { name: /^Wishlist/ }).innerText();
      must(before !== after && /\d/.test(after), `badge did not change ("${before}" → "${after}")`);
    });

    await step("bottom nav is hidden on the product page and on checkout", async () => {
      await page.goto(BASE + "/p/poppy-smocked-midi-dress", { waitUntil: "networkidle" });
      must(!(await bottom.isVisible()), "bottom nav visible on PDP");
      // checkout needs a signed-in user with something in the bag
      await page.getByRole("radio", { name: /^Size M/ }).click();
      await page.getByRole("button", { name: "Add to bag" }).first().click();
      await settle(page, 500);
      await page.goto(BASE + "/login", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /Use the demo account/ }).click();
      await page.getByRole("button", { name: "Send code" }).click();
      await page.getByLabel("One-time code").fill("123456");
      await page.waitForURL(/\/account$/);
      await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
      must(/\/checkout/.test(page.url()), `expected /checkout, got ${page.url()}`);
      must(!(await bottom.isVisible()), "bottom nav visible on checkout");
    });

    await step("search field opens the overlay", async () => {
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /Search labels, edits, styles/ }).first().click();
      await page.getByRole("dialog", { name: "Search" }).waitFor();
    });

    await step("no uncaught page errors", async () => must(errors.length === 0, errors.join(" | ")));
    await ctx.close();
  }

  await browser.close();
  console.log(failures ? `\n${failures} navigation check(s) failed` : "\nAll navigation checks passed");
  process.exit(failures ? 1 : 0);
})();
