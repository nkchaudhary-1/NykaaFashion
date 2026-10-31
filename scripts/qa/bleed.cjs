// The full-bleed home layout (docs/BLEED_LAYOUT.md): a wall of touching tiles from edge to edge of the screen.
// Checks the geometry that makes it the layout it claims to be — every wall runs from the left edge of the screen to the right, its tiles touch (no gap, no overlap, a complete
// rectangle) and the cells are the right shape at every width — then the content on the tiles, flat design, no sideways scroll, and the controls that switch layouts.
//   node scripts/qa/bleed.cjs [baseUrl]
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
let failures = 0;
const step = async (name, fn) => {
  try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0].slice(0, 300)}`); }
};
const must = (c, m) => { if (!c) throw new Error(m); };

// measured in the page: every visible wall — its box against the screen, and its tiles against each other
const measure = () => {
  const vw = document.documentElement.clientWidth;
  return [...document.querySelectorAll(".bleed-grid")]
    .filter((ul) => ul.getAttribute("aria-hidden") !== "true")
    .map((ul) => {
      const w = ul.getBoundingClientRect();
      const tiles = [...ul.children].filter((li) => li.offsetParent !== null).map((li) => {
        const r = li.getBoundingClientRect();
        return { l: r.left, t: r.top + scrollY, r: r.right, b: r.bottom + scrollY, kind: (li.className.match(/bleed-([bfqsw])\b/) || [])[1] };
      });
      const box = { l: Math.min(...tiles.map((t) => t.l)), t: Math.min(...tiles.map((t) => t.t)), r: Math.max(...tiles.map((t) => t.r)), b: Math.max(...tiles.map((t) => t.b)) };
      const area = tiles.reduce((s, t) => s + (t.r - t.l) * (t.b - t.t), 0);
      let overlap = 0;
      for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) {
        const x = Math.min(tiles[i].r, tiles[j].r) - Math.max(tiles[i].l, tiles[j].l);
        const y = Math.min(tiles[i].b, tiles[j].b) - Math.max(tiles[i].t, tiles[j].t);
        if (x > 0.6 && y > 0.6) overlap++;
      }
      const top0 = Math.round(tiles[0].t);
      const shape = tiles.filter((t) => t.kind === "b" || t.kind === "q").map((t) => (t.r - t.l) / (t.b - t.t));
      const label = ul.getAttribute("aria-label") || ul.hasAttribute("data-category-grid") ? "category" : ul.closest("section")?.getAttribute("aria-labelledby") || ul.closest("[data-module]")?.getAttribute("data-module") || "wall";
      return {
        label, n: tiles.length, left: Math.round(w.left * 10) / 10, right: Math.round(w.right * 10) / 10, vw,
        fill: Math.round((area / ((box.r - box.l) * (box.b - box.t))) * 1000) / 1000, overlap,
        across: tiles.filter((t) => Math.round(t.t) === top0).length, rows: Math.round((box.b - box.t) / (tiles[0].b - tiles[0].t)),
        badShape: shape.filter((s) => Math.abs(s - 0.8) > 0.012).length,
      };
    });
};

(async () => {
  const browser = require("./quiet.cjs")(await chromium.launch());
  const errors = [];
  const open = async (viewport, mobile = false, url = "/?layout=bleed") => {
    const ctx = await browser.newContext({ viewport, reducedMotion: "reduce", ...(mobile ? { isMobile: true, hasTouch: true } : {}) });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 160)));
    await page.goto(BASE + url, { waitUntil: "networkidle" });
    await page.locator(".bleed-grid").first().waitFor();
    await page.locator("[data-feed-tile]").first().waitFor({ timeout: 8000 }).catch(() => {}); // the feed fills in after hydration
    await page.waitForTimeout(300);
    return { ctx, page };
  };

  console.log("Full-bleed home — layout switching");
  let { ctx, page } = await open({ width: 1440, height: 900 });
  const staging = await page.locator("[data-staging-bar]").count();

  await step("?layout=bleed shows the wall, ?layout=classic returns the page grid, and each choice is remembered", async () => {
    must((await page.locator('[data-module="categories"] .bleed-wall').count()) === 1, "bleed: no wall in the category module");
    await page.goto(BASE + "/?layout=classic", { waitUntil: "networkidle" });
    await page.locator('[data-module="categories"]').waitFor();
    must((await page.locator(".bleed-wall").count()) === 0, "classic still shows walls");
    must((await page.locator('[data-module="categories"] [data-category-grid]').count()) === 1, "classic category grid missing");
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator('[data-module="categories"]').waitFor();
    must((await page.locator(".bleed-wall").count()) === 0, "the classic choice was not remembered");
    await page.goto(BASE + "/?layout=bleed", { waitUntil: "networkidle" });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator(".bleed-wall").first().waitFor();
  });

  await step(`a visitor who never chose gets this build's default (${staging ? "bleed on staging" : "classic on production"})`, async () => {
    const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    // NF_LAYOUT (when set) already stores a choice; this context has none
    const p2 = await c2.newPage();
    await p2.addInitScript(() => { try { localStorage.removeItem("nf.prefs"); } catch (e) {} });
    await p2.goto(BASE + "/", { waitUntil: "networkidle" });
    await p2.locator('[data-module="categories"]').waitFor();
    await p2.waitForTimeout(400);
    const walls = await p2.locator(".bleed-wall").count();
    await c2.close();
    must(staging ? walls > 0 : walls === 0, `${walls} walls on a build whose default should be ${staging ? "bleed" : "classic"}`);
  });

  await step("the Prototype panel has a Home layout switch and it changes the page", async () => {
    await page.goto(BASE + "/?layout=bleed", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Prototype controls/ }).first().click();
    const dlg = page.getByRole("dialog", { name: "Prototype controls" });
    await dlg.waitFor();
    const group = dlg.getByRole("radiogroup", { name: "Home page layout" });
    must((await group.getByRole("radio").count()) === 2, "expected two layouts");
    must((await group.getByRole("radio", { name: "Full-bleed" }).getAttribute("aria-checked")) === "true", "Full-bleed should be selected");
    await group.getByRole("radio", { name: "Classic" }).click();
    await page.waitForFunction(() => document.querySelectorAll(".bleed-wall").length === 0, null, { timeout: 5000 });
    await group.getByRole("radio", { name: "Full-bleed" }).click();
    await page.waitForFunction(() => document.querySelectorAll(".bleed-wall").length > 0, null, { timeout: 5000 });
    await page.keyboard.press("Escape");
  });

  if (staging) {
    await step("the staging bar carries the same switch", async () => {
      const bar = page.locator("[data-staging-bar]");
      must(/staging/i.test(await bar.innerText()), "no Staging label");
      const group = bar.getByRole("radiogroup", { name: "Home page layout" });
      await group.getByRole("radio", { name: "Classic" }).click();
      await page.waitForFunction(() => document.querySelectorAll(".bleed-wall").length === 0, null, { timeout: 5000 });
      await group.getByRole("radio", { name: "Full-bleed" }).click();
      await page.waitForFunction(() => document.querySelectorAll(".bleed-wall").length > 0, null, { timeout: 5000 });
    });
  } else {
    await step("a production build has no staging bar", async () => must((await page.locator("[data-staging-bar]").count()) === 0, "staging bar on a production build"));
  }

  console.log("Full-bleed home — modules and intent");
  await step("the bleed page is hero → categories → … → feed → SEO, with the category wall second", async () => {
    const order = await page.locator("[data-module]").evaluateAll((els) => els.map((e) => e.getAttribute("data-module")));
    must(order[0] === "hero" && order[1] === "categories", `starts ${order.slice(0, 3).join(", ")}`);
    must(order.includes("feed") && order.indexOf("feed") > order.indexOf("trending") && order.at(-1) === "seo", `feed/seo order: ${order.join(", ")}`);
    for (const m of ["pricestrip", "celebration", "brands", "newin", "edits", "trending"]) must(order.includes(m), `no ${m} module`);
  });
  await step("returning visitors get “pick up where you left off” third; deal intent promotes the offer band third", async () => {
    const seed = (override) => page.evaluate((o) => {
      localStorage.setItem("nf.intent", JSON.stringify({ v: 1, d: { events: 6, weights: { category: { "women/dresses": 3 }, label: { "twenty-dresses": 3 }, edit: {}, tag: {} }, recent: ["twd-01", "aja-01", "gaj-01", "lik-01"], dealScore: 0, override: o, lastSignalAt: 0 } }));
    }, override);
    await seed("returning");
    await page.goto(BASE + "/?layout=bleed", { waitUntil: "networkidle" });
    await page.locator('[data-module="trail"]').waitFor();
    let order = await page.locator("[data-module]").evaluateAll((els) => els.map((e) => e.getAttribute("data-module")));
    must(order[2] === "trail", `returning order: ${order.slice(0, 4).join(", ")}`);
    must((await page.locator('[data-module="trail"] a[href^="/p/"]').count()) >= 2, "the trail shows no pieces");
    await seed("deal");
    await page.goto(BASE + "/?layout=bleed", { waitUntil: "networkidle" });
    await page.locator('[data-module="offers"]').waitFor();
    order = await page.locator("[data-module]").evaluateAll((els) => els.map((e) => e.getAttribute("data-module")));
    must(order[2] === "offers", `deal order: ${order.slice(0, 4).join(", ")}`);
    await page.evaluate(() => localStorage.removeItem("nf.intent"));
  });
  await ctx.close();

  for (const [label, w, h, mobile, across, shown] of [["desktop 1440", 1440, 900, false, 6, 12], ["tablet 1100", 1100, 900, false, 4, 12], ["tablet 820", 820, 1000, false, 3, 12], ["phone 390", 390, 844, true, 2, 6]]) {
    console.log(`Full-bleed home — ${label}`);
    ({ ctx, page } = await open({ width: w, height: h }, mobile));

    await step("every wall runs edge to edge: from the left edge of the screen to the right", async () => {
      const walls = await page.evaluate(measure);
      must(walls.length >= 7, `only ${walls.length} walls`);
      for (const k of walls) must(Math.abs(k.left) <= 1 && Math.abs(k.right - k.vw) <= 1, `${k.label}: ${k.left}→${k.right} on a ${k.vw}px screen`);
    });
    await step("the tiles touch: no gap, no overlap, a complete rectangle (area filled = 100%)", async () => {
      for (const k of await page.evaluate(measure)) must(k.fill >= 0.998 && k.fill <= 1.002 && k.overlap === 0, `${k.label}: ${Math.round(k.fill * 1000) / 10}% filled, ${k.overlap} overlaps (${k.n} tiles)`);
    });
    await step("picture cells are 4:5", async () => {
      for (const k of await page.evaluate(measure)) must(k.badShape === 0, `${k.label}: ${k.badShape} cells are not 4:5`);
    });
    await step(`the category wall is ${across} across with ${shown} tiles`, async () => {
      const cat = (await page.evaluate(measure)).find((k) => k.label === "category");
      must(cat && cat.n === shown && cat.across === across, `${cat && cat.n} tiles, ${cat && cat.across} across`);
    });
    await step("label strips leave the picture most of the tile and never spill out", async () => {
      const bad = await page.evaluate(() => [...document.querySelectorAll(".bleed-tile [data-strip]")].filter((s) => {
        const t = s.closest(".bleed-tile").getBoundingClientRect();
        const r = s.getBoundingClientRect();
        return t.height > 0 && (r.height / t.height > 0.62 || r.bottom > t.bottom + 1 || r.left < t.left - 1 || r.right > t.right + 1);
      }).length);
      must(bad === 0, `${bad} strips cover more than 62% of their tile or spill out`);
    });
    await step("no sideways scroll", async () => must(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "the page scrolls sideways"));
    await ctx.close();
  }

  console.log("Full-bleed home — content and design rules (desktop 1440)");
  ({ ctx, page } = await open({ width: 1440, height: 900 }));
  await step("product tiles show label, name, price and the heart; the heart is not inside the link", async () => {
    const tile = page.locator('[data-module="newin"] .bleed-tile').first();
    const text = (await tile.innerText()).replace(/\s+/g, " ");
    must(/₹[\d,]+/.test(text), `no price in “${text.slice(0, 80)}”`);
    must((await tile.locator('a[href^="/p/"]').count()) >= 1, "no product link");
    must((await page.locator(".bleed-wall a button, .bleed-wall button a").count()) === 0, "a control is nested inside a link");
    const heart = tile.locator("button[aria-pressed]").first(); // its name flips from “Save …” to “Remove …” once saved
    must((await heart.getAttribute("aria-pressed")) === "false", "heart should start unsaved");
    await heart.click();
    must((await heart.getAttribute("aria-pressed")) === "true", "heart did not toggle");
    await heart.click();
  });
  await step("the flat tiles are real links with the saving on them (price, brands, edits, Diwali)", async () => {
    for (const [mod, re] of [["pricestrip", /under|min/i], ["brands", /Up to \d+% off|New arrivals/i], ["edits", /pieces?/i], ["diwali", /Up to \d+% off|styles?/i]]) {
      const links = await page.locator(`[data-module="${mod}"] .bleed-tile a`).evaluateAll((as) => as.map((a) => ({ href: a.getAttribute("href"), text: a.innerText.replace(/\s+/g, " ") })));
      must(links.length >= 4, `${mod}: ${links.length} tiles`);
      for (const l of links) must(l.href && re.test(l.text), `${mod}: “${l.text}” → ${l.href}`);
    }
  });
  await step("every link on the walls resolves", async () => {
    const hrefs = [...new Set(await page.locator(".bleed-wall a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href"))))].slice(0, 70);
    for (const h of hrefs) { const r = await ctx.request.get(BASE + h); must(r.status() === 200, `${h} answered ${r.status()}`); }
  });
  await step("flat design holds on the walls: no shadow, gradient, filter or blur", async () => {
    const found = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll(".bleed-wall, .bleed-wall *").forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.boxShadow !== "none" && !/rgba\(0, 0, 0, 0\)/.test(cs.boxShadow)) out.push(`shadow ${el.className}`);
        if (/gradient\(/.test(cs.backgroundImage)) out.push(`gradient ${el.className}`);
        if (cs.filter !== "none" || (cs.backdropFilter && cs.backdropFilter !== "none")) out.push(`filter ${el.className}`);
      });
      return out.slice(0, 3);
    });
    must(found.length === 0, found.join(" | "));
  });
  await step("keyboard: a wall's tiles are reachable by Tab, in reading order", async () => {
    await page.locator('[data-module="celebration"] .bleed-tile a').first().focus();
    const order = [];
    for (let i = 0; i < 4; i++) { order.push(await page.evaluate(() => document.activeElement?.getAttribute("href"))); await page.keyboard.press("Tab"); }
    must(new Set(order).size === 4 && order.every((h) => h && h.startsWith("/")), `focus order ${order.join(" ")}`);
  });
  await step("a tile opens its page", async () => {
    await page.locator('[data-module="trending"] .bleed-tile a[href^="/p/"]').first().click();
    await page.waitForURL(/\/p\//);
  });
  await ctx.close();

  await step("no console or page errors", async () => must(errors.length === 0, errors.slice(0, 3).join(" | ")));
  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nFull-bleed layout checks OK");
  process.exit(failures ? 1 : 0);
})();
