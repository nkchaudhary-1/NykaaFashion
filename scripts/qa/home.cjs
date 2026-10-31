// Home page interactions: hero, bento tiles, carousels (arrows, tabs, keyboard), product cards, newsletter, footer.
//   node scripts/qa/home.cjs [baseUrl] [--mobile]
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const mobile = process.argv.includes("--mobile");
let failures = 0;
async function step(name, fn) {
  try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0].slice(0, 220)}`); }
}
const must = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  const home = async () => { await page.goto(BASE + "/", { waitUntil: "networkidle" }); };
  console.log(mobile ? "Home — phone 390×844" : "Home — desktop 1440×900");
  await home();

  await step("hero: one h1, sale banner CTAs, pause + next controls", async () => {
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    must((await page.getByRole("heading", { level: 1 }).count()) === 1, "home must have exactly one h1");
    const cta = page.getByRole("link", { name: /Shop the sale/ }).first();
    must((await cta.getAttribute("href")) === "/offers", "sale CTA");
    if (!mobile) {
      await page.getByRole("button", { name: "Pause banner rotation" }).click();
      await page.getByRole("button", { name: "Next banner" }).click();
      await page.getByRole("heading", { name: /Diwali-ready/ }).first().waitFor();
      await page.getByRole("button", { name: "Show banner 1 of 3" }).click();
    }
  });

  await step("hero art direction: the wide picture from 600px, the tall one on phones (holds for optimised and direct /img delivery)", async () => {
    await page.waitForFunction(() => document.querySelector("main picture img")?.currentSrc, null, { timeout: 8000 });
    const src = decodeURIComponent(await page.locator("main picture img").first().evaluate((i) => i.currentSrc));
    must(mobile ? /4x5|tall/.test(src) : /16x9|wide/.test(src), `hero is showing ${src.slice(0, 120)}`);
  });

  await step("category tiles navigate (Indianwear)", async () => {
    await page.getByRole("link", { name: /^Indianwear/ }).filter({ hasText: /styles/ }).first().click();
    await page.waitForURL(/\/c\/women\/indianwear/);
    await home();
  });

  await step("price shortcuts and celebration tiles deep-link into listings", async () => {
    await page.getByRole("link", { name: /Under ₹1,999/ }).first().click();
    await page.waitForURL(/\/edits\/under-1500/);
    await home();
    await page.getByRole("link", { name: /Evening dresses/ }).first().click();
    await page.waitForURL(/\/c\/women\/dresses\?occ=party/);
    await home();
  });

  await step("iconic brands tiles open a brand page", async () => {
    await page.getByRole("link", { name: /^Puma/ }).first().click();
    await page.waitForURL(/\/brands\/puma/);
    await home();
  });

  await step("‘Just landed’ tabs change the rail", async () => {
    const section = page.locator("section", { has: page.getByRole("heading", { name: "Just landed" }) });
    const first = async () => section.getByRole("tabpanel").locator("li").first().innerText();
    const before = await first();
    await section.getByRole("tab", { name: "Men", exact: true }).click();
    await page.waitForTimeout(250);
    const after = await first();
    must(before !== after, "rail did not change after choosing Men");
  });

  if (!mobile) {
    await step("carousel arrows scroll the rail; Previous starts disabled", async () => {
      const section = page.locator("section", { has: page.getByRole("heading", { name: "Just landed" }) });
      const prev = section.getByRole("button", { name: "Previous" });
      const next = section.getByRole("button", { name: "Next" });
      must(await prev.isDisabled(), "Previous should be disabled at the start");
      const track = section.getByRole("list", { name: "New in" });
      const x0 = await track.evaluate((el) => el.scrollLeft);
      await next.click();
      await page.waitForTimeout(700);
      const x1 = await track.evaluate((el) => el.scrollLeft);
      must(x1 > x0 + 100, `rail did not move (${x0} → ${x1})`);
      must(await prev.isEnabled(), "Previous should enable after scrolling");
    });
    await step("carousel track is a keyboard-scrollable region", async () => {
      const section = page.locator("section", { has: page.getByRole("heading", { name: "Just landed" }) });
      const track = section.getByRole("list", { name: "New in" });
      await track.evaluate((el) => (el.scrollLeft = 0));
      await track.focus();
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(400);
      must((await track.evaluate((el) => el.scrollLeft)) > 0, "ArrowRight did not scroll the rail");
    });
  } else {
    await step("carousel swipes (touch scroll) and next card peeks", async () => {
      const section = page.locator("section", { has: page.getByRole("heading", { name: "Just landed" }) });
      const track = section.getByRole("list", { name: "New in" });
      const m = await track.evaluate((el) => ({ cw: el.clientWidth, sw: el.scrollWidth, first: el.firstElementChild.getBoundingClientRect().width }));
      must(m.sw > m.cw + 40, "rail does not overflow");
      must(m.first < m.cw * 0.5, `first card is too wide to show a peek (${m.first} of ${m.cw})`);
    });
  }

  await step("product card: save toggles, quick view opens/closes (desktop)", async () => {
    await home();
    const save = page.getByRole("button", { name: /^Save .* to wishlist/ }).first();
    await save.click();
    await page.getByRole("button", { name: /^Remove .* from wishlist/ }).first().waitFor();
    await page.getByRole("button", { name: /^Remove .* from wishlist/ }).first().click();
    if (!mobile) {
      const card = page.locator("article").first();
      await card.hover();
      await card.getByRole("button", { name: /^Quick view/ }).click();
      await page.getByRole("dialog", { name: /Quick view/ }).waitFor();
      await page.keyboard.press("Escape");
      await page.getByRole("dialog", { name: /Quick view/ }).waitFor({ state: "detached" });
    }
  });

  await step("newsletter: invalid email is rejected, valid email is confirmed as simulated", async () => {
    await home();
    const input = page.getByLabel("The Style Files letter");
    await input.scrollIntoViewIfNeeded();
    await input.fill("nope");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await page.getByText("Enter a valid email address.").waitFor();
    await input.fill("aarohi@example.com");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await page.getByText(/Subscribed as aarohi@example.com \(simulated\)/).waitFor();
  });

  await step("footer: link columns work; Prototype controls opens the panel", async () => {
    await home();
    const footer = page.locator("footer");
    for (const [name, re] of [["Style Files", /\/discover/], ["Women’s Indianwear", /\/c\/women\/indianwear/], ["Help Center", /\/help/], ["Puma", /\/brands\/puma/]]) {
      await footer.getByRole("link", { name, exact: true }).first().click();
      await page.waitForURL(re);
      await home();
    }
    await footer.getByRole("button", { name: /Prototype controls/ }).click();
    await page.getByRole("dialog", { name: /Prototype/ }).waitFor();
    await page.keyboard.press("Escape");
  });

  await step("no console / page errors", async () => must(errors.length === 0, errors.slice(0, 3).join(" | ")));
  await browser.close();
  console.log(failures ? `\n${failures} home check(s) failed` : "\nAll home checks passed");
  process.exit(failures ? 1 : 0);
})();
