// New & Next: the launch pages end to end — entry points, countdown, Notify me, previews + wishlist, the pre-launch guards, the automatic switch to
// Shop now (via the prototype launch clock), the reusable brand template, and that nothing leaks into the existing listings.
//   node scripts/qa/launch.cjs [baseUrl]            (a production server; scripts/qa/prod.sh builds one)
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
let failures = 0;
const step = async (name, fn) => { try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0].slice(0, 260)}`); } };
const must = (c, m) => { if (!c) throw new Error(m); };
const PIECE = { name: "Zardozi Anarkali Set", slug: "zardozi-anarkali-set" };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  const text = () => page.locator("main").innerText();
  const setClock = async (name) => { await page.getByRole("group", { name: /Launch clock/ }).getByRole("button", { name }).click(); await page.waitForTimeout(500); };
  const notifyStore = () => page.evaluate(() => JSON.parse(localStorage.getItem("nf.launch.notify") || "{}"));
  console.log(`New & Next — ${BASE}`);

  await step("the header has a New & Next entry that opens the hub", async () => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: /New & Next/ }).click();
    await page.waitForURL(/\/new-and-next$/);
    must((await page.getByRole("heading", { level: 1 }).count()) === 1, "the hub must have exactly one h1");
  });

  await step("featured launch: Vrisa, the launch date and a countdown that ticks", async () => {
    const t = await text();
    must(/Vrisa/.test(t) && /14 November/.test(t), "featured brand or date missing");
    const timer = page.getByRole("timer").first();
    await timer.waitFor();
    const a = await page.locator("main").getByText(/^\d{2}$/).allInnerTexts();
    await page.waitForTimeout(2300);
    const b = await page.locator("main").getByText(/^\d{2}$/).allInnerTexts();
    must(a.join() !== b.join(), "the countdown did not change in 2 seconds");
  });

  await step("coming soon lists the other launches with dates and Notify me", async () => {
    const t = await text();
    must(/Halden & Co\./.test(t) && /Kiln & Linen/.test(t), "upcoming brands missing");
    must(/28/.test(t) && /Nov/i.test(t) && /12/.test(t) && /Dec/i.test(t), "launch dates missing");
    must((await page.getByRole("button", { name: /Notify me/ }).count()) >= 3, "each upcoming brand needs a Notify me button");
  });

  await step("Notify me: validates, saves (simulated, on this device), shows the state, and can be undone", async () => {
    await page.getByRole("button", { name: /Notify me/ }).first().click();
    const dlg = page.getByRole("dialog");
    await dlg.waitFor();
    await dlg.getByRole("button", { name: /^(Notify me|Remind me|Submit|Save)/ }).last().click();
    must((await dlg.getByRole("alert").count()) > 0 || /valid|enter/i.test(await dlg.innerText()), "no validation message for an empty contact");
    await dlg.getByRole("textbox").first().fill("someone@example.com");
    await dlg.getByRole("button", { name: /^(Notify me|Remind me|Submit|Save)/ }).last().click();
    await page.getByRole("dialog").waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
    const saved = await notifyStore();
    must(saved.vrisa && /someone@example.com/.test(saved.vrisa.contact), `nothing saved: ${JSON.stringify(saved)}`);
    await page.getByRole("button", { name: /You.ll be notified/ }).first().waitFor();
    await page.getByRole("button", { name: /Undo/ }).first().click();
    await page.waitForTimeout(300);
    must(!(await notifyStore()).vrisa, "Undo did not remove the reminder");
  });

  await step("exclusive offers: the launch offers and a copyable code", async () => {
    const t = await text();
    must(/Exclusive offers/i.test(t) && /20% off/.test(t) && /VRISA20/.test(t), "offers missing");
    must((await page.getByRole("button", { name: /Copy.*VRISA20|VRISA20/ }).count()) >= 1, "no copy button for the code");
  });

  await step("product preview: pieces open a sheet (no product-page link, no bag), hearts reach the Wishlist page", async () => {
    const section = page.locator("#preview");
    await section.scrollIntoViewIfNeeded();
    must((await section.locator("a[href^='/p/']").count()) === 0, "a pre-launch piece links to its product page");
    must((await section.getByRole("button", { name: /Add to bag/i }).count()) === 0, "a pre-launch piece offers Add to bag");
    await section.getByRole("button", { name: new RegExp(PIECE.name) }).first().click();
    const dlg = page.getByRole("dialog");
    await dlg.waitFor();
    must(new RegExp(PIECE.name).test(await dlg.innerText()), "the sheet does not show the piece");
    await dlg.getByRole("button", { name: /Save .* to wishlist/ }).click();
    await page.keyboard.press("Escape");
    await page.goto(BASE + "/wishlist", { waitUntil: "networkidle" });
    must(new RegExp(PIECE.name).test(await text()), "the saved preview is not on the Wishlist page");
  });

  await step("?piece= opens the sheet; the server keeps the product page closed until launch day", async () => {
    await page.goto(BASE + `/new-and-next/vrisa?piece=${PIECE.slug}`, { waitUntil: "networkidle" });
    await page.getByRole("dialog").waitFor();
    await page.goto(BASE + `/p/${PIECE.slug}`, { waitUntil: "networkidle" });
    must(page.url().includes(`/new-and-next/vrisa?piece=${PIECE.slug}`), `product page was reachable pre-launch (${page.url()})`);
  });

  await step("the bag refuses a pre-launch piece, whatever path led there", async () => {
    await page.goto(BASE + "/wishlist", { waitUntil: "networkidle" });
    const card = page.locator("li", { hasText: PIECE.name }).first();
    await card.getByRole("button", { name: /bag|size/i }).first().click();
    const dlg = page.getByRole("dialog");
    if (await dlg.count()) {
      const size = dlg.getByRole("radio").first();
      if (await size.count()) await size.click();
      await dlg.getByRole("button", { name: /add to bag/i }).first().click().catch(() => {});
    }
    await page.getByText(/Not on sale yet/).first().waitFor({ timeout: 5000 });
    const bag = await page.evaluate(() => JSON.parse(localStorage.getItem("nf.bag") || "{}"));
    must(!(bag.lines ?? []).some((l) => /vri-/.test(l.productId)), "a pre-launch piece is in the bag");
  });

  await step("launch day arrives: the page switches to Shop now by itself (launch clock → At launch)", async () => {
    await page.goto(BASE + "/new-and-next", { waitUntil: "networkidle" });
    await setClock(/At launch/);
    await page.getByText(/Now live/).first().waitFor();
    const t = await text();
    must(/Shop now/i.test(t), "no Shop now");
    must((await page.getByRole("link", { name: /Shop now|Shop Vrisa|Shop all/ }).count()) >= 1, "no Shop now link");
    must((await page.locator("#preview a[href^='/p/']").count()) >= 3 || (await page.locator("#shop a[href^='/p/']").count()) >= 3, "the range is not a list of product links on launch day");
  });

  await step("after launch a piece opens its real product page and can be added to the bag", async () => {
    await page.goto(BASE + `/p/${PIECE.slug}`, { waitUntil: "networkidle" });
    must(page.url().includes(`/p/${PIECE.slug}`) && (await page.getByRole("heading", { level: 1 }).innerText()).includes(PIECE.name), "product page not reachable after launch");
    await page.getByRole("radio", { name: /^M$/ }).first().click();
    await page.getByRole("button", { name: /add to bag/i }).first().click();
    await page.waitForTimeout(800);
    const bag = await page.evaluate(() => JSON.parse(localStorage.getItem("nf.bag") || "{}"));
    must((bag.lines ?? []).some((l) => l.productId === "vri-01"), "the piece did not reach the bag after launch");
  });

  await step("recently launched shows the catalogue brands and, after launch, Vrisa too", async () => {
    await page.goto(BASE + "/new-and-next", { waitUntil: "networkidle" });
    const t = await text();
    for (const b of ["H&M", "Cider", "Hearth & Hue", "Vrisa"]) must(t.includes(b), `recently launched is missing ${b}`);
    must((await page.locator("a[href='/brands/hm']").count()) >= 1, "H&M has no Shop now link to its brand page");
    await setClock(/Real time|Reset/);
    await page.getByRole("timer").first().waitFor();
  });

  await step("the template: an upcoming brand, a recent brand and an unknown brand", async () => {
    await page.goto(BASE + "/new-and-next/halden", { waitUntil: "networkidle" });
    must(/Halden & Co\./.test(await text()) && /28 November/.test(await text()), "Halden page");
    must((await page.getByRole("heading", { level: 1 }).count()) === 1, "one h1 on a brand page");
    await page.goto(BASE + "/new-and-next/hm", { waitUntil: "networkidle" });
    must(/H&M/.test(await text()) && /Shop/i.test(await text()), "H&M page");
    const res = await page.goto(BASE + "/new-and-next/no-such-brand", { waitUntil: "networkidle" });
    must(res.status() === 404, `unknown brand answered ${res.status()}`);
  });

  await step("the existing site is untouched: no launch brand in listings, search or the brands directory", async () => {
    await page.goto(BASE + "/c/women/indianwear", { waitUntil: "networkidle" });
    must(!/Zardozi Anarkali|Vrisa/.test(await page.locator("main").innerText()), "a launch piece is in a listing");
    await page.goto(BASE + "/search?q=anarkali", { waitUntil: "networkidle" });
    must(!/Zardozi Anarkali/.test(await page.locator("main").innerText()), "a launch piece is in search");
    await page.goto(BASE + "/brands", { waitUntil: "networkidle" });
    must(!/Vrisa|Halden|Kiln/.test(await page.locator("main").innerText()), "a launch brand is in the brands directory");
  });

  await step("phone: the hub works at 390px with no sideways scroll, and the menu has New & Next", async () => {
    const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const mp = await m.newPage();
    await mp.goto(BASE + "/", { waitUntil: "networkidle" });
    await mp.getByRole("button", { name: "Open menu" }).click();
    await mp.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: /New & Next/ }).click();
    await mp.waitForURL(/\/new-and-next$/);
    await mp.waitForLoadState("networkidle");
    must(/Vrisa/.test(await mp.locator("main").innerText()), "hub did not render on a phone");
    must((await mp.evaluate(() => document.documentElement.scrollWidth)) <= 391, "horizontal overflow on a phone");
    await m.close();
  });

  must(errors.length === 0, `console errors: ${errors.join(" | ")}`);
  await browser.close();
  console.log(failures ? `\n${failures} launch check(s) failed` : "\nNew & Next OK");
  process.exit(failures ? 1 : 0);
})();
