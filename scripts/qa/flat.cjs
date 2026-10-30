// Design-rule audit on the rendered DOM: no shadows, no gradients, no blur/filters, one font family (Inter), square corners.
//   node scripts/qa/flat.cjs [baseUrl] [--routes /,/c/women] [--widths 390,1280] [--overlays]
// Exit code 1 on any shadow / gradient / filter / font finding. Radius findings are printed as warnings (avatars, swatches,
// pins, radios and count badges are allowed — everything else should be square).
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3200";
const flag = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const WIDTHS = flag("--widths", "390,1280").split(",").map(Number);
const DEFAULT_ROUTES = [
  "/", "/discover", "/discover/the-block-print-revival", "/edits", "/edits/hidden-gems", "/edits/the-offer-edit", "/c/women", "/c/women/dresses", "/c/home/cushions",
  "/p/poppy-smocked-midi-dress", "/p/satin-corset-top", "/search?q=kurta", "/search?q=zzzz", "/brands", "/brands/ajrakh-and-ash", "/offers", "/wishlist", "/bag", "/checkout",
  "/login", "/help", "/prototype", "/info/shipping", "/404-not-a-page",
];
const ROUTES = flag("--routes", DEFAULT_ROUTES.join(",")).split(",");
const OVERLAYS = process.argv.includes("--overlays");

const probe = () => {
  const splitTop = (str) => { const out = []; let depth = 0, cur = ""; for (const ch of str) { if (ch === "(") depth++; if (ch === ")") depth--; if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  const found = { shadow: new Map(), gradient: new Map(), filter: new Map(), font: new Map(), radius: new Map(), fonts: [], opsz: "" };
  const name = (el, pseudo) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${String(el.getAttribute("class") || "").split(/\s+/).filter(Boolean).slice(0, 4).join(".")}${pseudo || ""}`;
  const add = (map, key, extra) => { if (!map.has(key)) map.set(key, { n: 0, extra }); map.get(key).n++; };
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  document.querySelectorAll("body, body *").forEach((el) => {
    if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(el.tagName)) return;
    if (el.closest("nextjs-portal, [data-nextjs-dev-tools-button], [data-next-badge-root], #__next-build-watcher")) return; // dev-only overlay
    if (!visible(el)) return;
    for (const pseudo of [null, "::before", "::after"]) {
      const cs = getComputedStyle(el, pseudo);
      if (pseudo && (cs.content === "none" || cs.content === "normal")) continue;
      // Tailwind composes box-shadow from several (mostly transparent) layers — only a visible layer counts.
      const live = splitTop(cs.boxShadow || "").filter((l) => l !== "none" && !/^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)/.test(l));
      if (live.length) add(found.shadow, name(el, pseudo), live.join(", ").slice(0, 70));
      if (cs.textShadow && cs.textShadow !== "none") add(found.shadow, name(el, pseudo) + " (text)", cs.textShadow.slice(0, 60));
      if (cs.backgroundImage && /gradient\(/.test(cs.backgroundImage)) add(found.gradient, name(el, pseudo), cs.backgroundImage.slice(0, 70));
      if (cs.filter && cs.filter !== "none") add(found.filter, name(el, pseudo) + " filter", cs.filter);
      const bf = cs.backdropFilter || cs.webkitBackdropFilter;
      if (bf && bf !== "none") add(found.filter, name(el, pseudo) + " backdrop", bf);
      if (cs.mixBlendMode && cs.mixBlendMode !== "normal") add(found.filter, name(el, pseudo) + " blend", cs.mixBlendMode);
    }
    const cs = getComputedStyle(el);
    // fonts: only elements that directly hold text
    const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
    if (hasText) {
      const first = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      if (!/inter/i.test(first)) add(found.font, `${name(el)} → ${first}`, cs.fontFamily.slice(0, 60));
    }
    // corners
    const r = el.getBoundingClientRect();
    const rad = Math.max(...["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"].map((k) => parseFloat(cs[k]) || 0));
    if (rad >= 3) {
      const small = r.width <= 64 && r.height <= 64; // avatar / swatch / pin / radio / badge
      if (!small && el.tagName !== "IMG") add(found.radius, name(el), `${Math.round(r.width)}×${Math.round(r.height)} r=${Math.round(rad)}`);
    }
  });
  found.fonts = Array.from(new Set(Array.from(document.fonts).filter((f) => f.status === "loaded").map((f) => f.family.replace(/["']/g, ""))));
  found.opsz = getComputedStyle(document.body).fontVariationSettings;
  const ser = (m) => Array.from(m.entries()).map(([k, v]) => ({ k, n: v.n, extra: v.extra }));
  return { shadow: ser(found.shadow), gradient: ser(found.gradient), filter: ser(found.filter), font: ser(found.font), radius: ser(found.radius), fonts: found.fonts, opsz: found.opsz };
};

const fmt = (list) => list.slice(0, 6).map((x) => `      ${x.k} ×${x.n}  ${x.extra}`).join("\n");

(async () => {
  const browser = await chromium.launch();
  let hard = 0, warn = 0;
  for (const w of WIDTHS) {
    const mobile = w < 700;
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    const check = async (label) => {
      const r = await page.evaluate(probe);
      const bad = r.shadow.length + r.gradient.length + r.filter.length + r.font.length;
      const nonInter = r.fonts.filter((f) => !/inter/i.test(f));
      if (bad || nonInter.length) {
        hard++;
        console.log(`✗ ${w}px ${label}`);
        for (const [t, l] of [["shadow", r.shadow], ["gradient", r.gradient], ["filter/blur/blend", r.filter], ["font ≠ Inter", r.font]]) if (l.length) console.log(`    ${t}:\n${fmt(l)}`);
        if (nonInter.length) console.log(`    loaded font faces other than Inter: ${nonInter.join(", ")}`);
      }
      if (r.radius.length) { warn++; console.log(`  ~ ${w}px ${label} rounded (warning):\n${fmt(r.radius)}`); }
      if (!/opsz/.test(r.opsz) && label === ROUTES[0]) { hard++; console.log(`✗ body font-variation-settings is "${r.opsz}" — Inter Display (opsz 32) not applied`); }
    };
    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: "networkidle" });
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
      await page.waitForTimeout(400);
      await check(route);
    }
    if (OVERLAYS) {
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      const steps = [
        ["search overlay", async () => { await page.keyboard.press("/"); }],
        ["bag drawer", async () => { await page.getByRole("button", { name: /^Bag/ }).first().click(); }],
        ["mobile menu", async () => { await page.getByRole("button", { name: /open menu/i }).first().click(); }],
        ["shop sheet", async () => { await page.getByRole("button", { name: /^Shop$/ }).last().click(); }],
        ["mega menu", async () => { await page.getByRole("link", { name: "Women", exact: true }).first().hover(); }],
      ];
      for (const [label, open] of steps) {
        try {
          await page.goto(BASE + "/", { waitUntil: "networkidle" });
          await open();
          await page.waitForTimeout(700);
          await check(`overlay: ${label}`);
        } catch (e) { console.log(`  · ${w}px overlay ${label}: skipped (${String(e.message).split("\n")[0].slice(0, 90)})`); }
        await page.keyboard.press("Escape");
      }
    }
    await ctx.close();
  }
  await browser.close();
  console.log(hard ? `\n${hard} hard finding(s) — shadows / gradients / filters / fonts` : `\nFlat + single-font audit clean${warn ? ` (${warn} radius warning group(s))` : ""}`);
  process.exit(hard ? 1 : 0);
})();
