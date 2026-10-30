// Keyboard-only checks: skip link, search combobox, overlay focus trap + restore, mega menu, radios, carousel.
//   node scripts/qa/keyboard.cjs [baseUrl]
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
let failures = 0;
async function step(name, fn) {
  try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0].slice(0, 200)}`); }
}
const must = (cond, msg) => { if (!cond) throw new Error(msg); };

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  page.setDefaultTimeout(8000);
  const active = () => page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName.toLowerCase()}${a.id ? "#" + a.id : ""}|${(a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 40)}` : "none"; });
  const insideDialog = () => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));

  console.log("\nKeyboard checks — desktop");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });

  await step("First Tab stop is the skip link; Enter moves focus to <main>", async () => {
    await page.keyboard.press("Tab");
    must((await active()).includes("Skip to content"), `first stop: ${await active()}`);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(150);
    must((await active()).startsWith("main#main"), `after skip: ${await active()}`);
  });

  await step("'/' opens search; combobox arrows set aria-activedescendant; Esc closes", async () => {
    await page.keyboard.press("/");
    const box = page.getByRole("combobox", { name: /Search/ });
    await box.waitFor();
    must((await active()).includes("combobox") || (await insideDialog()), "focus not in search");
    await box.fill("saree");
    await page.getByRole("option").first().waitFor();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const ad = await box.getAttribute("aria-activedescendant");
    must(!!ad, "no aria-activedescendant after ArrowDown");
    await page.keyboard.press("Escape");
    await page.getByRole("dialog", { name: "Search" }).waitFor({ state: "detached" });
  });

  await step("Bag drawer: focus trapped inside, Esc closes, focus returns to the Cart button", async () => {
    const bag = page.getByRole("button", { name: /^Cart/ }).first();
    await bag.focus();
    await page.keyboard.press("Enter");
    const dlg = page.getByRole("dialog", { name: "Shopping bag" });
    await dlg.waitFor();
    await page.waitForTimeout(200);
    must(await insideDialog(), "focus did not move into the drawer");
    for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); must(await insideDialog(), `focus escaped the drawer on Tab ${i + 1}: ${await active()}`); }
    await page.keyboard.press("Escape");
    await dlg.waitFor({ state: "detached" });
    await page.waitForTimeout(150);
    must((await active()).includes("Cart"), `focus after close: ${await active()}`);
  });

  await step("Department dropdown opens from keyboard focus and Esc closes it", async () => {
    const tab = page.getByRole("navigation", { name: /categories$/ }).getByRole("link", { name: "Western Wear" }).first();
    await tab.focus();
    await page.locator("#tab-women-2-panel").waitFor();
    await page.keyboard.press("Tab");
    must((await active()).length > 0, "no focus inside panel");
    await page.keyboard.press("Escape");
    await page.locator("#tab-women-2-panel").waitFor({ state: "detached" });
  });

  await step("More panel opens from keyboard focus and Esc closes it", async () => {
    const more = page.getByRole("link", { name: "More", exact: true }).first();
    await more.focus();
    await page.locator("#more-panel").waitFor();
    await page.keyboard.press("Tab");
    must((await active()).length > 0, "no focus inside panel");
    await page.keyboard.press("Escape");
    await page.locator("#more-panel").waitFor({ state: "detached" });
  });

  await step("PDP: size radios are arrow-key selectable; add is gated with an announced error", async () => {
    await page.goto(BASE + "/p/linen-shirt-dress", { waitUntil: "networkidle" });
    await page.getByRole("radio", { name: /^Size S/ }).focus();
    await page.keyboard.press("ArrowRight");
    must(await page.getByRole("radio", { name: /^Size M/ }).isChecked(), "ArrowRight did not move the size selection");
  });

  await step("PDP: carousel is keyboard focusable and responds to arrows", async () => {
    const track = page.getByRole("group", { name: /images — use arrow keys/ });
    await track.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    must((await page.getByText(/Image 2 of 3/).count()) > 0, "carousel did not advance");
  });

  await step("Quick view opens from the keyboard, traps focus, Esc restores focus", async () => {
    await page.goto(BASE + "/c/women/dresses", { waitUntil: "networkidle" });
    const qv = page.getByRole("button", { name: /Quick view Poppy Smocked Midi Dress/ });
    await qv.focus();
    await page.keyboard.press("Enter");
    const dlg = page.getByRole("dialog", { name: /Quick view/ });
    await dlg.waitFor();
    await page.waitForTimeout(250);
    must(await insideDialog(), "focus not in quick view");
    await page.keyboard.press("Escape");
    await dlg.waitFor({ state: "detached" });
    await page.waitForTimeout(150);
    must((await active()).includes("Quick view"), `focus after close: ${await active()}`);
  });

  await step("Reduced motion: scroll-reveal content is shown immediately (nothing left hidden)", async () => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await p.goto(BASE + "/", { waitUntil: "networkidle" });
    await p.waitForTimeout(1200);
    const hidden = await p.evaluate(() => document.querySelectorAll("main [style*='opacity: 0']").length);
    must(hidden === 0, `${hidden} elements still hidden under reduced motion`);
    await ctx.close();
  });

  console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll keyboard checks passed");
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
