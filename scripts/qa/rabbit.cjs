// "Keep exploring" — the endless feed and the rabbit hole around it (src/components/feed, src/lib/feed.ts, src/lib/scroll-memory.ts).
// Home and every product page end in a feed that never runs out; each piece says why it is there; the feed loads itself three times and then waits for a tap (so the footer stays reachable);
// its order is fixed while you look at it; and going back from a product returns you to the same tile (Next 16 keeps visited pages alive — this guards that it stays true). Run for both home layouts.
//   node scripts/qa/rabbit.cjs [baseUrl]
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
let failures = 0;
const step = async (name, fn) => {
  try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0].slice(0, 300)}`); }
};
const must = (c, m) => { if (!c) throw new Error(m); };
// blocks of the feed → how many pieces it holds (even blocks open with a feature; every second feature is a story or an edit that takes no piece)
const entriesFor = (blocks) => { let n = 0; for (let i = 0; i < blocks; i++) n += i % 2 === 1 ? 12 : Math.floor(i / 2) % 2 === 1 ? 8 : 9; return n; };

(async () => {
  const browser = require("./quiet.cjs")(await chromium.launch());
  const errors = [];
  const open = async (layout, { mobile = false, reduce = true, url = "/" } = {}) => {
    const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, reducedMotion: reduce ? "reduce" : "no-preference", ...(mobile ? { isMobile: true, hasTouch: true } : {}) });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 160)));
    await page.goto(BASE + `${url}${url.includes("?") ? "&" : "?"}layout=${layout}`, { waitUntil: "networkidle" });
    return { ctx, page };
  };
  const feed = (page, id = "home") => page.locator(`[data-feed="${id}"]`);
  const tiles = (page, id = "home") => feed(page, id).locator("[data-feed-tile]");
  const toEnd = (page, id = "home") => page.evaluate((i) => { const f = document.querySelector(`[data-feed="${i}"]`); window.scrollTo(0, f.getBoundingClientRect().bottom + scrollY - innerHeight + 160); }, id);

  for (const layout of ["bleed", "classic"]) {
    console.log(`Keep exploring — home, ${layout} layout`);
    let { ctx, page } = await open(layout);
    await tiles(page).first().waitFor({ timeout: 10000 });

    await step("the feed comes after the page's modules, before the SEO copy, and opens with its first two blocks", async () => {
      const order = await page.locator("[data-module]").evaluateAll((els) => els.map((e) => e.getAttribute("data-module")));
      must(order.at(-2) === "feed" && order.at(-1) === "seo", `modules end ${order.slice(-3).join(", ")}`);
      must((await tiles(page).count()) === entriesFor(2), `${await tiles(page).count()} pieces at the start (expected ${entriesFor(2)})`);
    });
    await step("every piece says why it is there", async () => {
      const texts = await tiles(page).evaluateAll((els) => els.map((e) => e.innerText.split("\n").map((l) => l.trim()).filter(Boolean)));
      const bad = texts.filter((lines) => !lines.some((l) => /^(New in|Popular right now|Under ₹1,999|\d+% off|Because you browse .+|More from .+|From an edit you like|Matches your taste|Completes the look|Similar to this|Also .+|Popular with this look)$/.test(l)));
      must(bad.length === 0, `${bad.length} pieces without a reason, e.g. ${JSON.stringify(bad[0])}`);
    });
    await step("it is labelled as a simulation", async () => must((await feed(page).getByText("Simulated").count()) >= 1, "no Simulated tag"));

    await step("reaching the end loads more — three times by itself — and then waits for the button", async () => {
      const goal = entriesFor(2 + 3 * 2);
      for (let i = 0; i < 14; i++) { await toEnd(page); await page.waitForTimeout(450); if ((await tiles(page).count()) >= goal) break; }
      must((await tiles(page).count()) === goal, `${await tiles(page).count()} pieces after scrolling (expected ${goal})`);
      for (let i = 0; i < 3; i++) { await toEnd(page); await page.waitForTimeout(500); }
      must((await tiles(page).count()) === goal, `it kept loading on its own (${await tiles(page).count()})`);
      const status = await feed(page).locator('[role="status"]').innerText();
      must(new RegExp(`^${goal} styles so far`).test(status.trim()), `status says “${status.trim()}”`);
    });
    await step("the button loads two more blocks (keyboard: Enter), and the footer is still reachable", async () => {
      const before = await tiles(page).count();
      const btn = feed(page).getByRole("button", { name: /Keep exploring/ });
      await btn.focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction((n) => document.querySelectorAll('[data-feed="home"] [data-feed-tile]').length > n, before, { timeout: 5000 });
      must((await tiles(page).count()) === entriesFor(10), `${await tiles(page).count()} pieces after the button (expected ${entriesFor(10)})`);
      await feed(page).getByRole("link", { name: "Skip to the footer" }).click();
      await page.waitForFunction(() => { const r = document.getElementById("footer")?.getBoundingClientRect(); return !!r && r.top < innerHeight && r.bottom > 0; }, null, { timeout: 5000 });
    });
    await step("loads are logged (feed_view, feed_load_more)", async () => {
      const names = await page.evaluate(() => JSON.parse(localStorage.getItem("nf.events") || "{}").d?.map((e) => e.name) ?? []);
      must(names.includes("feed_view") && names.filter((n) => n === "feed_load_more").length >= 4, `events: ${[...new Set(names)].join(", ")}`);
    });
    await ctx.close();

    ({ ctx, page } = await open(layout));
    await tiles(page).first().waitFor({ timeout: 10000 });
    await step("the order is fixed while you look: saving a piece does not reshuffle the feed", async () => {
      const hrefs = () => tiles(page).evaluateAll((els) => els.slice(0, 10).map((e) => e.querySelector('a[href^="/p/"]')?.getAttribute("href")));
      const before = await hrefs();
      await tiles(page).nth(3).getByRole("button", { name: /Save .* to wishlist/ }).first().click();
      await page.waitForTimeout(500);
      must(JSON.stringify(await hrefs()) === JSON.stringify(before), "the order changed after a save");
    });
    await ctx.close();
  }

  console.log("Keep exploring — back goes back to the same place");
  for (const [label, mobile, reduce] of [["desktop (smooth scroll)", false, false], ["phone (touch)", true, true]]) {
    for (const layout of ["bleed", "classic"]) {
      const { ctx, page } = await open(layout, { mobile, reduce });
      await tiles(page).first().waitFor({ timeout: 10000 });
      await step(`${label}, ${layout}: after scrolling down the feed and opening a piece, Back returns to the same tile and the same length`, async () => {
        for (let i = 0; i < 6; i++) { await toEnd(page); await page.waitForTimeout(450); }
        const n = await tiles(page).count();
        must(n > entriesFor(2), "the feed did not grow");
        const tile = tiles(page).nth(Math.floor(n / 2));
        await tile.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        const y0 = await page.evaluate(() => Math.round(scrollY));
        const href = await tile.locator('a[href^="/p/"]:not([aria-hidden="true"])').first().getAttribute("href");
        await tile.locator('a[href^="/p/"]:not([aria-hidden="true"])').first().click();
        await page.waitForURL(/\/p\//);
        await page.waitForTimeout(600);
        await page.goBack();
        await page.waitForURL((u) => u.pathname === "/");
        await tiles(page).first().waitFor({ timeout: 10000 });
        await page.waitForFunction((y) => Math.abs(window.scrollY - y) < 60, y0, { timeout: 6000 }).catch(() => {});
        const y1 = await page.evaluate(() => Math.round(scrollY));
        must(Math.abs(y1 - y0) < 60, `scroll position ${y1}px, expected about ${y0}px`);
        must((await tiles(page).count()) >= n, `the feed rebuilt to ${await tiles(page).count()} pieces, was ${n}`);
        must(await page.locator(`[data-feed="home"] a[href="${href}"]`).first().isVisible(), `the tile ${href} is not on screen after going back`);
      });
      await ctx.close();
    }
  }

  console.log("Keep exploring — product pages: there is always one more thing");
  {
    const { ctx, page } = await open("bleed", { url: "/p/poppy-smocked-midi-dress" });
    let slug = "poppy-smocked-midi-dress";
    for (let hop = 1; hop <= 3; hop++) {
      await step(`hop ${hop}: ${slug} ends in a feed seeded by it — it has a reason on every piece and a way on`, async () => {
        const id = `pdp-${slug}`;
        await tiles(page, id).first().waitFor({ timeout: 10000 });
        must((await tiles(page, id).count()) >= 12, `${await tiles(page, id).count()} pieces`);
        const reasons = await tiles(page, id).evaluateAll((els) => els.slice(0, 12).map((e) => e.innerText.split("\n").map((l) => l.trim()).filter(Boolean)));
        const bad = reasons.filter((lines) => !lines.some((l) => /^(Completes the look|More from .+|Similar to this|Also .+|Popular with this look)$/.test(l)));
        must(bad.length === 0, `${bad.length} pieces with a reason that is not about this product, e.g. ${JSON.stringify(bad[0])}`);
        const next = tiles(page, id).nth(2 + hop).locator('a[href^="/p/"]:not([aria-hidden="true"])').first();
        const href = await next.getAttribute("href");
        await next.scrollIntoViewIfNeeded();
        await next.click();
        await page.waitForURL((u) => u.pathname === href);
        must(href !== `/p/${slug}`, "the feed led back to the same product");
        slug = href.replace("/p/", "");
      });
    }
    await ctx.close();
  }

  await step("no console or page errors", async () => must(errors.length === 0, errors.slice(0, 3).join(" | ")));
  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nKeep-exploring checks OK");
  process.exit(failures ? 1 : 0);
})();
