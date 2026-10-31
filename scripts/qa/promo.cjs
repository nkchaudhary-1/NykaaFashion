// Pop-ups (PiP), end to end: when they appear, what they say, image and video behaviour (muted autoplay, pause, reduced motion, data saver), the dismissal
// rules (a closed pop-up stays closed; nothing else interrupts for a day), where they never appear, how they sit on phone / tablet / desktop, the prototype
// controls, the launch-day switch, and the design rules (flat, one typeface) and axe on the window itself.
//   node scripts/qa/promo.cjs [baseUrl] [--user-id X --user-pw Y]     (a production server; scripts/qa/prod.sh builds one. The credentials are for a gated server.)
// Timing matters here (campaigns appear 5–10 s into a page), so this takes about two minutes.
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const flag = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const LOGIN = flag("--user-id") ? { id: flag("--user-id"), pw: flag("--user-pw") } : null;
let axePath = null;
try { axePath = require.resolve("axe-core/axe.min.js"); } catch {}
let failures = 0;
const step = async (name, fn) => { try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0].slice(0, 280)}`); } };
const must = (c, m) => { if (!c) throw new Error(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const errors = [];
const watch = (page) => {
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|status of (401|403|404)/.test(m.text()) && errors.push(m.text().slice(0, 160)));
};
let browser;
/** A new visitor: own storage, signed in if the server needs it. */
async function visitor(opts = {}, init) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  page.setDefaultNavigationTimeout(90000); // a development server compiles each route the first time
  watch(page);
  if (LOGIN) {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    if (await page.locator("#uid").count()) {
      await page.fill("#uid", LOGIN.id); await page.fill("#pw", LOGIN.pw);
      await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/__gate")), page.click("button[type=submit]")]);
    }
  }
  return { ctx, page };
}
const win = (page, id) => page.locator(id ? `[data-promo="${id}"]` : "[data-promo]");
const memory = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("nf.promo") || "null")?.d ?? null);
const box = (loc) => loc.evaluate((el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; });
const goto = (page, path) => page.goto(BASE + path, { waitUntil: "networkidle" });
const videoState = (page) => page.locator("[data-promo] video").evaluate((v) => ({ paused: v.paused, muted: v.muted, loop: v.loop, playsInline: v.playsInline, t: v.currentTime, src: v.currentSrc, ready: v.readyState, autoplayAttr: v.autoplay }));

(async () => {
  browser = await chromium.launch();
  console.log(`Pop-ups — ${BASE}`);

  // ── 1 · a calm arrival ────────────────────────────────────────────────────────────────────────────────────────
  let v1;
  await step("home: nothing for the first seconds, then the launch video appears; it takes no focus and says what it is", async () => {
    v1 = await visitor();
    await goto(v1.page, "/");
    await sleep(2000);
    must((await win(v1.page).count()) === 0, "the pop-up was there after 2 seconds (it should wait about 5)");
    await win(v1.page, "vrisa-teaser").waitFor({ timeout: 12000 });
    const p = win(v1.page, "vrisa-teaser");
    const name = await p.getAttribute("aria-label");
    must(/Promotion: Vrisa arrives 14 November/.test(name), `accessible name: ${name}`);
    must((await p.evaluate((el) => el.tagName)) === "ASIDE", "not an <aside> (complementary landmark)");
    const t = await p.innerText();
    must(/new launch/i.test(t) && /Vrisa arrives 14 November/.test(t) && /Launches in \d+d \d+h/.test(t) && /get notified/i.test(t), `text: ${t}`);
    must(await v1.page.evaluate(() => document.activeElement === document.body || document.activeElement?.id === "main" || !document.querySelector("[data-promo]")?.contains(document.activeElement)), "the pop-up took focus");
    must((await p.locator("a[href='/new-and-next/vrisa']").count()) >= 1, "no link to the launch page");
    must((await p.getByRole("button", { name: "Close promotion" }).count()) === 1, "no Close button");
  });

  await step("desktop placement: bottom-right corner, 264px wide, under 40% of the screen height, clear of the header", async () => {
    await sleep(800); // the entrance slides up 20px over half a second: measure it at rest
    const b = await box(win(v1.page, "vrisa-teaser"));
    must(Math.abs(b.w - 264) < 2 && Math.abs(900 - b.b - 24) < 2 && Math.abs(1440 - b.r - 24) < 2, `box ${JSON.stringify(b)}`);
    must(b.h <= 360 && b.t > 160, `height ${Math.round(b.h)}, top ${Math.round(b.t)}`);
    const close = await box(win(v1.page).getByRole("button", { name: "Close promotion" }));
    must(close.w >= 44 && close.h >= 44, `Close hit area ${close.w}×${close.h}`);
  });

  await step("video: muted, looping, inline, and actually playing; Pause / Play work", async () => {
    await sleep(1200);
    const s = await videoState(v1.page);
    must(s.muted && s.loop && s.playsInline, `attributes: ${JSON.stringify(s)}`);
    must(!s.paused && s.t > 0.3, `not playing: ${JSON.stringify(s)}`);
    must(/\.(mp4|webm)$/.test(s.src), `source: ${s.src}`);
    const pause = win(v1.page).getByRole("button", { name: "Pause video" });
    await pause.click();
    must((await videoState(v1.page)).paused && (await win(v1.page).getByRole("button", { name: "Play video" }).count()) === 1, "Pause did not pause");
    await win(v1.page).getByRole("button", { name: "Play video" }).click();
    await sleep(500);
    must(!(await videoState(v1.page)).paused, "Play did not resume");
    must((await win(v1.page).getByRole("button", { name: /mute/i }).count()) === 0, "a mute button for a clip with no sound");
  });

  await step("the design rules hold on the window: no shadow, gradient, filter or blend; Inter only; square corners; every control reachable", async () => {
    const bad = await win(v1.page).evaluate((root) => {
      const out = [];
      for (const el of [root, ...root.querySelectorAll("*:not(source)")]) { // <source> is never rendered
        const cs = getComputedStyle(el);
        const n = `${el.tagName.toLowerCase()}${el.getAttribute("aria-label") ? `[${el.getAttribute("aria-label")}]` : ""}`;
        if (cs.boxShadow !== "none") out.push(`${n} shadow ${cs.boxShadow}`);
        if (cs.backgroundImage !== "none") out.push(`${n} background-image`);
        if (cs.filter !== "none" || (cs.backdropFilter && cs.backdropFilter !== "none")) out.push(`${n} filter`);
        if (!/Inter/.test(cs.fontFamily)) out.push(`${n} font ${cs.fontFamily}`);
        if (el !== root && parseFloat(cs.borderTopLeftRadius) > 0) out.push(`${n} radius ${cs.borderTopLeftRadius}`);
      }
      return out;
    });
    must(bad.length === 0, bad.slice(0, 4).join(" | "));
  });

  // ── 2 · closing it ────────────────────────────────────────────────────────────────────────────────────────────
  await step("keyboard: Tab reaches the link and Close in order; Escape inside the window closes it and moves focus to the page", async () => {
    await v1.page.locator("[data-promo] a").last().focus();
    await v1.page.keyboard.press("Tab");
    must((await v1.page.evaluate(() => document.activeElement?.getAttribute("aria-label"))) === "Close promotion", "Tab from the link did not reach Close");
    await v1.page.keyboard.press("Escape");
    await win(v1.page).waitFor({ state: "detached", timeout: 3000 });
    must(await v1.page.evaluate(() => document.activeElement?.id === "main"), "focus was dropped to the top of the page");
    const m = await memory(v1.page);
    must(m?.dismissed?.["vrisa-teaser"] && m.lastDismissAt, `memory: ${JSON.stringify(m)}`);
  });

  await step("once closed it stays closed — reload, another page, another tab — and nothing else interrupts either", async () => {
    const other = await v1.ctx.newPage();
    watch(other);
    await Promise.all([v1.page.reload({ waitUntil: "networkidle" }), goto(other, "/c/women")]);
    await sleep(11500); // longer than any campaign's delay
    must((await win(v1.page).count()) === 0 && (await win(other).count()) === 0, "a pop-up appeared after one was closed");
    await other.close();
    await v1.ctx.close();
  });

  // ── 3 · opening it ────────────────────────────────────────────────────────────────────────────────────────────
  await step("clicking opens the campaign page, the pop-up leaves, and an opened campaign does not come back", async () => {
    const { ctx, page } = await visitor();
    await goto(page, "/");
    await win(page, "vrisa-teaser").waitFor({ timeout: 12000 });
    await Promise.all([page.waitForURL(/\/new-and-next\/vrisa/), win(page).locator("a").last().click()]);
    await page.waitForLoadState("networkidle");
    await win(page).waitFor({ state: "detached", timeout: 3000 }).catch(() => { throw new Error("the pop-up stayed over the page it pointed at"); });
    const m = await memory(page);
    must(m?.engaged?.["vrisa-teaser"] && !m.lastDismissAt, `memory: ${JSON.stringify(m)}`);
    await goto(page, "/");
    await sleep(6500);
    must((await win(page, "vrisa-teaser").count()) === 0, "an opened campaign came straight back");
    await ctx.close();
  });

  // ── 4 · across pages ──────────────────────────────────────────────────────────────────────────────────────────
  await step("moving between pages it is meant for keeps the same window; a page it is not meant for swaps it for that page's campaign", async () => {
    const { ctx, page } = await visitor();
    await goto(page, "/");
    await win(page, "vrisa-teaser").waitFor({ timeout: 12000 });
    await win(page).evaluate((el) => { el.__marker = "same-element"; });
    await Promise.all([page.waitForURL(/\/brands$/), page.locator("footer a[href='/brands']").first().click()]);
    await sleep(1500);
    must((await win(page, "vrisa-teaser").count()) === 1 && (await win(page).evaluate((el) => el.__marker)) === "same-element", "the window was rebuilt when moving between two pages it belongs on");
    await Promise.all([page.waitForURL(/\/c\/women$/), page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Women", exact: true }).click()]);
    await sleep(1200);
    must((await win(page, "vrisa-teaser").count()) === 0, "the launch video stayed on a page it is not meant for");
    await win(page, "halden-preview").waitFor({ timeout: 12000 });
    must(/Preview the range/i.test(await win(page).innerText()), "the collection pop-up has the wrong call to action");
    await ctx.close();
  });

  // ── 5 · where it never appears ────────────────────────────────────────────────────────────────────────────────
  await step("never on bag, checkout, login, account — or product, help and info pages — and a forced pop-up still stays off the transactional ones", async () => {
    const paths = ["/bag", "/checkout", "/login", "/account", "/p/poppy-smocked-midi-dress", "/help", "/info/shipping"];
    const seen = await Promise.all(paths.map(async (path) => {
      const { ctx, page } = await visitor();
      await goto(page, path);
      await sleep(11500);
      const n = await win(page).count();
      await ctx.close();
      return n ? path : null;
    }));
    must(seen.every((x) => !x), `a pop-up appeared on: ${seen.filter(Boolean).join(", ")}`);
    for (const path of ["/bag", "/checkout", "/login"]) {
      const { ctx, page } = await visitor();
      await goto(page, `${path}?promo=vrisa-teaser`);
      await sleep(2500);
      must((await win(page).count()) === 0, `forcing a pop-up worked on ${path}`);
      await ctx.close();
    }
  });

  // ── 6 · dialogs ───────────────────────────────────────────────────────────────────────────────────────────────
  await step("a dialog holds it back until it closes; one that opens over it pauses the video and covers it", async () => {
    const { ctx, page } = await visitor();
    await goto(page, "/");
    await page.getByRole("button", { name: /^Cart/ }).first().click();
    await page.getByRole("dialog").waitFor();
    await sleep(7500);
    must((await win(page).count()) === 0, "the pop-up appeared behind an open drawer");
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await win(page, "vrisa-teaser").waitFor({ timeout: 9000 });
    await sleep(800);
    must(!(await videoState(page)).paused, "video not playing");
    await page.getByRole("button", { name: /^Cart/ }).first().click();
    await page.getByRole("dialog").waitFor();
    await sleep(500);
    must((await videoState(page)).paused, "the video kept playing under a drawer");
    const c = await box(win(page));
    const top = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest("[data-promo]"), [c.l + c.w / 2, c.t + c.h / 2]);
    must(!top, "the pop-up is above the drawer's scrim");
    await page.keyboard.press("Escape");
    await sleep(700);
    must(!(await videoState(page)).paused, "the video did not resume after the drawer closed");
    await ctx.close();
  });

  // ── 7 · motion and data ───────────────────────────────────────────────────────────────────────────────────────
  await step("reduced motion: no autoplay — the still picture and a Play button; Play works", async () => {
    const { ctx, page } = await visitor({ reducedMotion: "reduce" });
    await goto(page, "/?promo=vrisa-teaser");
    await win(page, "vrisa-teaser").waitFor({ timeout: 6000 });
    await sleep(900);
    must((await videoState(page)).paused, "the video autoplayed for a visitor who prefers reduced motion");
    await win(page).getByRole("button", { name: "Play video" }).click();
    await sleep(600);
    must(!(await videoState(page)).paused, "Play did not start the video");
    await ctx.close();
  });
  await step("data saver on: no autoplay either", async () => {
    const { ctx, page } = await visitor({}, `Object.defineProperty(Navigator.prototype, "connection", { get() { return { saveData: true, effectiveType: "3g" }; } });`);
    await goto(page, "/?promo=vrisa-teaser");
    await win(page, "vrisa-teaser").waitFor({ timeout: 6000 });
    await sleep(900);
    must((await videoState(page)).paused, "autoplay ignored the data saver");
    await ctx.close();
  });

  await step("an image campaign: picture, no video controls, link to its page", async () => {
    const { ctx, page } = await visitor();
    await goto(page, "/c/women/dresses?promo=first-order");
    await win(page, "first-order").waitFor({ timeout: 6000 });
    const p = win(page);
    must((await p.locator("video").count()) === 0 && (await p.locator("img").count()) >= 1, "an image campaign without an <img>");
    must((await p.getByRole("button", { name: /video|mute/i }).count()) === 0, "video controls on a still");
    const t = await p.innerText();
    must(/₹300 off your first order/.test(t) && /FIRSTEDIT/.test(t) && /see the offer/i.test(t), `text: ${t}`);
    must((await p.locator("a[href='/offers']").count()) >= 1, "no link to /offers");
    const alt = await p.locator("img").first().getAttribute("alt");
    must(alt && alt.length > 8, "the picture has no description");
    await ctx.close();
  });

  // ── 8 · launch day ────────────────────────────────────────────────────────────────────────────────────────────
  await step("a launch campaign follows the launch clock: 'Now live → Shop now' on launch day, gone a week later", async () => {
    const launchAt = Date.parse("2026-11-14T11:00:00+05:30");
    const { ctx, page } = await visitor();
    const host = new URL(BASE).hostname;
    await ctx.addCookies([{ name: "nf_launch_offset", value: String(launchAt - Date.now() + 3_600_000), domain: host, path: "/" }]);
    await goto(page, "/?promo=vrisa-teaser");
    await win(page, "vrisa-teaser").waitFor({ timeout: 6000 });
    const t = await win(page).innerText();
    must(/now live/i.test(t) && /Vrisa is here/.test(t) && /shop now/i.test(t), `launch day text: ${t}`);
    must((await win(page).locator("a[href='/new-and-next/vrisa#shop']").count()) >= 1, "Shop now does not point at the shop");
    await ctx.addCookies([{ name: "nf_launch_offset", value: String(launchAt - Date.now() + 8 * 86_400_000), domain: host, path: "/" }]);
    await goto(page, "/?promo=vrisa-teaser");
    await sleep(2500);
    must((await win(page).count()) === 0, "the launch pop-up was still there a week after launch");
    await ctx.close();
  });

  // ── 9 · the prototype controls ────────────────────────────────────────────────────────────────────────────────
  await step("prototype panel: pick a campaign → Show now; closing it is remembered; Bring them all back clears that", async () => {
    const { ctx, page } = await visitor();
    await goto(page, "/");
    await page.locator("footer").getByRole("button", { name: /Prototype controls/ }).first().click();
    const dlg = page.getByRole("dialog", { name: "Prototype controls" });
    await dlg.waitFor();
    await dlg.getByLabel("Show a campaign now").selectOption("delivery-notice");
    await dlg.getByRole("button", { name: "Show now" }).click();
    await dlg.waitFor({ state: "detached" });
    await win(page, "delivery-notice").waitFor({ timeout: 5000 }); // not a campaign for the home page — forced
    await win(page).getByRole("button", { name: "Close promotion" }).click();
    await win(page).waitFor({ state: "detached" });
    must(!!(await memory(page))?.dismissed?.["delivery-notice"], "the dismissal was not remembered");
    await page.locator("footer").getByRole("button", { name: /Prototype controls/ }).first().click();
    await page.getByRole("dialog", { name: "Prototype controls" }).getByRole("button", { name: "Bring them all back" }).click();
    const after = await memory(page);
    must(!after || Object.keys(after.dismissed).length === 0, `Bring them all back did not clear the dismissals: ${JSON.stringify(after)}`);
    await ctx.close();
  });

  // ── 10 · phone and tablet ─────────────────────────────────────────────────────────────────────────────────────
  await step("phone: a docked mini window above the bottom bar — square thumbnail, text beside it, Close ≥ 44px, no sideways scroll", async () => {
    const { ctx, page } = await visitor({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await goto(page, "/?promo=vrisa-teaser");
    await win(page, "vrisa-teaser").waitFor({ timeout: 6000 });
    await sleep(700);
    const b = await box(win(page));
    const nav = await box(page.getByRole("navigation", { name: "Primary mobile" }));
    must(b.h <= 100 && b.h >= 70, `height ${Math.round(b.h)}`);
    must(Math.abs(b.l - 12) < 2 && Math.abs(390 - b.r - 12) < 2, `gutters ${Math.round(b.l)} / ${Math.round(390 - b.r)}`);
    must(nav.t - b.b >= 8 && nav.t - b.b <= 20, `gap above the bottom bar: ${Math.round(nav.t - b.b)}`);
    const thumb = await box(win(page).locator("a[aria-hidden='true']").first());
    must(Math.abs(thumb.w - thumb.h) < 1.5 && thumb.w < 90, `thumbnail ${Math.round(thumb.w)}×${Math.round(thumb.h)}`);
    const close = await box(win(page).getByRole("button", { name: "Close promotion" }));
    must(close.w >= 44 && close.h >= 44, `Close ${close.w}×${close.h}`);
    must((await page.evaluate(() => document.documentElement.scrollWidth)) <= 391, "sideways scroll with the pop-up open");
    const clipped = await win(page).evaluate((root) => [...root.querySelectorAll("span")].filter((s) => s.scrollWidth > s.clientWidth + 1 && !getComputedStyle(s).textOverflow.includes("ellipsis") && getComputedStyle(s).display !== "inline").map((s) => s.textContent.slice(0, 20)));
    must(clipped.length === 0, `clipped text: ${clipped.join(", ")}`);
    await win(page).getByRole("button", { name: "Close promotion" }).tap();
    await win(page).waitFor({ state: "detached", timeout: 3000 });
    await ctx.close();
  });
  await step("tablet: a small window in the corner, 200px wide, above the bottom bar", async () => {
    const { ctx, page } = await visitor({ viewport: { width: 820, height: 1000 }, isMobile: true, hasTouch: true });
    await goto(page, "/c/women?promo=halden-preview");
    await win(page, "halden-preview").waitFor({ timeout: 6000 });
    await sleep(700);
    const b = await box(win(page));
    const nav = await box(page.getByRole("navigation", { name: "Primary mobile" }));
    must(Math.abs(b.w - 200) < 2 && Math.abs(820 - b.r - 16) < 2 && nav.t - b.b >= 8, `box ${JSON.stringify(b)}; bar top ${nav.t}`);
    await ctx.close();
  });
  await step("no sideways scroll with the pop-up open at 360 / 390 / 820 / 1280", async () => {
    for (const w of [360, 390, 820, 1280]) {
      const { ctx, page } = await visitor({ viewport: { width: w, height: 900 }, isMobile: w < 700, hasTouch: w < 700 });
      await goto(page, "/?promo=vrisa-teaser");
      await win(page, "vrisa-teaser").waitFor({ timeout: 6000 });
      await sleep(600);
      must((await page.evaluate(() => document.documentElement.scrollWidth)) <= w + 1, `overflow at ${w}`);
      await ctx.close();
    }
  });

  // ── 11 · accessibility ────────────────────────────────────────────────────────────────────────────────────────
  await step("axe finds nothing on the window, desktop and phone (with the whole page around it)", async () => {
    if (!axePath) throw new Error("axe-core is not installed (npm i --no-save axe-core)");
    for (const [label, opts] of [["desktop", {}], ["phone", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
      const { ctx, page } = await visitor({ reducedMotion: "reduce", ...opts });
      await goto(page, "/?promo=vrisa-teaser");
      await win(page, "vrisa-teaser").waitFor({ timeout: 6000 });
      await sleep(600);
      await page.addScriptTag({ path: axePath });
      const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }));
      must(r.violations.length === 0, `${label}: ${r.violations.map((x) => `${x.id} ×${x.nodes.length} ${x.nodes[0].target.join(" ").slice(0, 80)}`).join(" | ")}`);
      await ctx.close();
    }
  });

  must(errors.length === 0, `console errors: ${errors.join(" | ")}`);
  await browser.close();
  console.log(failures ? `\n${failures} pop-up check(s) failed` : "\nPop-ups OK");
  process.exit(failures ? 1 : 0);
})();
