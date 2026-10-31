// The motion layer (awards branch): reveals, smooth scroll, follower cursor, drag rails, page fade — and that none of it can hide or block content.
//   node scripts/qa/motion.cjs [baseUrl]
// Runs with motion ON (the other audits run settled, with reduced motion). Needs a production server for stable timings (scripts/qa/prod.sh).
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
let failures = 0;
async function step(name, fn) {
  try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0].slice(0, 260)}`); }
}
const must = (c, m) => { if (!c) throw new Error(m); };
const classes = (page) => page.evaluate(() => document.documentElement.className);

// Reveal targets that can legitimately still be waiting: not laid out, or clipped away horizontally inside a rail.
const pending = () => {
  const out = [];
  document.querySelectorAll("[data-reveal]:not([data-in])").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (r.left >= innerWidth - 1 || r.right <= 1) return;
    const rail = el.closest("[data-carousel]");
    if (rail) { const rr = rail.getBoundingClientRect(); if (r.left >= rr.right - 1 || r.right <= rr.left + 1) return; }
    out.push(`${el.tagName.toLowerCase()}[${el.dataset.reveal}] ${(el.textContent || "").trim().slice(0, 30)}`);
  });
  return out;
};

(async () => {
  const browser = await chromium.launch();

  console.log(`Motion — desktop, motion on — ${BASE}`);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  await page.goto(BASE + "/", { waitUntil: "networkidle" });

  await step("page is marked js + hydrated; Lenis and the cursor are active for a mouse", async () => {
    await page.waitForFunction(() => document.documentElement.classList.contains("lenis") && document.documentElement.classList.contains("has-cursor"), null, { timeout: 4000 }).catch(() => {}); // both start in an effect, a beat after networkidle
    const c = await classes(page);
    for (const k of ["js", "hydrated", "lenis", "has-cursor"]) must(c.split(/\s+/).includes(k), `<html> is missing "${k}" (has: ${c})`);
  });

  await step("the first screen reveals on its own (h1 words settle, picture visible)", async () => {
    await page.waitForTimeout(1800);
    const r = await page.evaluate(() => {
      const h = document.querySelector("h1");
      const words = [...h.querySelectorAll(".rt-i")].map((w) => getComputedStyle(w).transform);
      const img = document.querySelector("main img");
      return { words: words.length, moving: words.filter((t) => t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)").length, hero: img ? getComputedStyle(img).opacity : "0" };
    });
    must(r.words === 0 || r.moving === 0, `${r.moving} of ${r.words} h1 words are still displaced after 1.8 s`);
    must(Number(r.hero) === 1, "first picture is not fully opaque");
  });

  await step("the mouse wheel scrolls the page (smoothed) and moves it a sensible distance", async () => {
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(1300);
    const y = await page.evaluate(() => scrollY);
    must(y > 450 && y < 1400, `scrollY after a 900px wheel turn = ${y}`);
  });

  await step("a nested scroller keeps the native wheel (drawers, dialogs, menus)", async () => {
    await page.evaluate(() => {
      const d = document.createElement("div");
      d.id = "qa-scroller";
      d.style.cssText = "position:fixed;left:40px;top:120px;width:240px;height:160px;overflow:auto;z-index:500;background:#fff";
      d.innerHTML = '<div style="height:900px">scroll me</div>';
      document.body.append(d);
    });
    const before = await page.evaluate(() => scrollY);
    await page.mouse.move(100, 200);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({ top: document.getElementById("qa-scroller").scrollTop, y: scrollY }));
    await page.evaluate(() => document.getElementById("qa-scroller")?.remove());
    must(r.top > 100, `nested scroller did not scroll (scrollTop ${r.top})`);
    must(Math.abs(r.y - before) < 5, `page scrolled too (${before} → ${r.y})`);
  });

  await step("scrolling the whole page reveals everything that is in the layout", async () => {
    for (let i = 0; i < 40; i++) {
      await page.mouse.wheel(0, 1100);
      await page.waitForTimeout(160);
      if (await page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 4)) break;
    }
    await page.waitForTimeout(1600);
    const left = await page.evaluate(pending);
    must(left.length === 0, `${left.length} reveal target(s) never revealed: ${left.slice(0, 4).join(" | ")}`);
  });

  await step("settled reveals are fully opaque and untransformed", async () => {
    const bad = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll("[data-reveal][data-in]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        const cs = getComputedStyle(el);
        if (el.dataset.reveal === "text") return;
        if (Number(cs.opacity) < 1 || (cs.transform !== "none" && cs.transform !== "matrix(1, 0, 0, 1, 0, 0)")) out.push(`${el.dataset.reveal} ${cs.opacity} ${cs.transform}`);
      });
      return out;
    });
    must(bad.length === 0, `${bad.length} still moving/translucent: ${bad.slice(0, 3).join(" | ")}`);
  });

  await step("the cursor follower becomes a labelled disc over [data-cursor] areas", async () => {
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(900);
    const target = page.locator("[data-cursor]").first();
    if (!(await target.count())) throw new Error("no [data-cursor] element on the home page");
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    await page.mouse.move(box.x + Math.min(box.width / 2, 200), box.y + Math.min(box.height / 2, 200));
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => { const c = document.querySelector(".nf-cursor"); return { kind: c.dataset.kind, text: c.textContent, on: c.hasAttribute("data-on") }; });
    must(r.on && r.kind === "label" && r.text.length > 0, `cursor state: ${JSON.stringify(r)}`);
  });

  await step("rails drag with the mouse, and the click that ends a drag does not open a card", async () => {
    const rail = page.locator("[data-carousel]").first();
    await rail.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const box = await rail.boundingBox();
    const url = page.url();
    const x0 = await rail.evaluate((el) => el.scrollLeft);
    const cx = box.x + box.width * 0.7;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 120, cy, { steps: 6 });
    await page.mouse.move(cx - 360, cy, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(600);
    const x1 = await rail.evaluate((el) => el.scrollLeft);
    must(x1 > x0 + 150, `rail did not follow the drag (${x0} → ${x1})`);
    must(page.url() === url, `a drag opened a link (${page.url()})`);
  });

  await step("navigating fades the new page in and starts it at the top", async () => {
    await page.evaluate(() => scrollTo(0, 0));
    await page.getByRole("link", { name: "Women", exact: true }).first().click();
    await page.waitForURL(/\/c\/women/);
    await page.waitForTimeout(1000);
    const r = await page.evaluate(() => ({ y: scrollY, running: document.getAnimations().filter((a) => a.effect?.target?.parentElement?.id === "main" && a.playState === "running").length, op: getComputedStyle(document.querySelector("#main > div")).opacity }));
    must(r.y === 0, `new page did not start at the top (${r.y})`);
    must(r.running === 0 && Number(r.op) === 1, `page fade unfinished: ${JSON.stringify(r)}`);
  });
  must(errors.length === 0, `console errors: ${errors.join(" | ")}`);
  await ctx.close();

  console.log("Motion — reduced motion");
  const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p2 = await rm.newPage();
  await p2.goto(BASE + "/", { waitUntil: "networkidle" });
  await step("no smooth scroll, no cursor, nothing hidden below the fold, ticker stands still", async () => {
    const c = await classes(p2);
    must(!c.includes("lenis") && !c.includes("has-cursor"), `reduced motion still has: ${c}`);
    const r = await p2.evaluate(() => {
      const hid = [...document.querySelectorAll("[data-reveal]")].filter((el) => Number(getComputedStyle(el).opacity) < 1 || (el.dataset.reveal === "text" && [...el.querySelectorAll(".rt-i")].some((w) => /matrix\(1, 0, 0, 1, 0, [1-9]/.test(getComputedStyle(w).transform)))).length;
      const m = document.querySelector(".marquee-track");
      return { hid, marquee: m ? getComputedStyle(m).animationName : "none" };
    });
    must(r.hid === 0, `${r.hid} reveal target(s) are hidden under reduced motion`);
    must(r.marquee === "none", `ticker still animates (${r.marquee})`);
  });
  await rm.close();

  console.log("Motion — touch");
  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p3 = await touch.newPage();
  await p3.goto(BASE + "/", { waitUntil: "networkidle" });
  await step("touch screens keep native scrolling and get no cursor", async () => {
    const c = await classes(p3);
    must(!c.includes("lenis") && !c.includes("has-cursor"), `touch device has: ${c}`);
    must(await p3.evaluate(() => getComputedStyle(document.querySelector(".nf-cursor")).display === "none"), "follower is displayed on a touch device");
  });
  await touch.close();

  console.log("Motion — failsafes");
  const nojs = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const p4 = await nojs.newPage();
  await p4.goto(BASE + "/", { waitUntil: "load" });
  await step("without JavaScript nothing is hidden", async () => {
    const r = await p4.evaluate(() => ({ js: document.documentElement.classList.contains("js"), hid: [...document.querySelectorAll("[data-reveal]")].filter((el) => Number(getComputedStyle(el).opacity) < 1).length, words: [...document.querySelectorAll(".rt-i")].filter((w) => /matrix\(1, 0, 0, 1, 0, [1-9]/.test(getComputedStyle(w).transform)).length }));
    must(!r.js && r.hid === 0 && r.words === 0, JSON.stringify(r));
  });
  await nojs.close();

  const broken = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p5 = await broken.newPage();
  await p5.route("**/_next/static/**/*.js", (r) => r.abort());
  await p5.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await step("if the scripts never load, the page shows itself after five seconds", async () => {
    must((await classes(p5)).includes("js"), "inline script did not set the js flag");
    await p5.waitForTimeout(7200); // the flag goes at 5 s; staggered reveals then finish their own transitions (delay + ~1 s)
    const r = await p5.evaluate(() => ({ js: document.documentElement.classList.contains("js"), hid: [...document.querySelectorAll("[data-reveal]")].filter((el) => Number(getComputedStyle(el).opacity) < 1).length }));
    must(!r.js && r.hid === 0, `failsafe did not release the page: ${JSON.stringify(r)}`);
  });
  await broken.close();

  await browser.close();
  console.log(failures ? `\n${failures} motion check(s) failed` : "\nMotion layer OK");
  process.exit(failures ? 1 : 0);
})();
