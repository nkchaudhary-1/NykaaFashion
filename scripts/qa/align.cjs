// Layout sanity audit — the defects the grid audit cannot see: text drawn over other text, text clipped by its own box, text outside the page edges,
// columns that spread their content apart (a big void between a heading and what follows), and pictures stretched out of proportion.
//   node scripts/qa/align.cjs [baseUrl] [--widths 390,820,1024,1440] [--routes /,/c/women] [--verbose]
// Runs in the settled state (reduced motion). Exit code 1 on any finding.
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const flag = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const WIDTHS = flag("--widths", "390,820,1024,1440").split(",").map(Number);
const VERBOSE = process.argv.includes("--verbose");
const PUBLIC = [
  "/", "/discover", "/discover/the-block-print-revival", "/discover/quiet-luxe-the-case-for-fewer-better-things", "/edits", "/edits/luxe", "/edits/hidden-gems", "/edits/the-offer-edit", "/edits/festive", "/edits/responsible",
  "/c/women", "/c/women/dresses", "/c/men", "/c/kids", "/c/home/cushions", "/p/poppy-smocked-midi-dress", "/p/satin-corset-top", "/p/sequin-slip-mini", "/search?q=kurta", "/search?q=zzzz",
  "/brands", "/brands/ajrakh-and-ash", "/brands/puma", "/offers", "/wishlist", "/bag", "/login", "/help", "/prototype", "/info/shipping", "/sitemap", "/404-not-a-page",
];
const AUTHED = ["/account", "/account/orders", "/account/orders/nf-26100377", "/account/addresses"];
const ROUTES = flag("--routes", "") ? flag("--routes", "").split(",") : PUBLIC;

const probe = () => {
  const out = [];
  const name = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${String(el.getAttribute("class") || "").split(/\s+/).filter(Boolean).slice(0, 3).join(".")}`;
  const snippet = (el) => (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 36);
  const vw = document.documentElement.clientWidth;
  const skip = (el) => el.closest("nextjs-portal, [data-nextjs-dev-tools-button], [data-next-badge-root], .nf-cursor, .sr-only, [aria-hidden='true'], [inert], .marquee, [data-carousel], [data-nogrid], svg, canvas, #__next-build-watcher");
  // the part of a rectangle that is actually painted: clipped by every overflow:hidden|clip ancestor
  const visibleRect = (el, r) => {
    let { left, top, right, bottom } = r;
    for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (!/(hidden|clip)/.test(cs.overflowX + cs.overflowY)) continue;
      const b = p.getBoundingClientRect();
      if (/(hidden|clip)/.test(cs.overflowX)) { left = Math.max(left, b.left); right = Math.min(right, b.right); }
      if (/(hidden|clip)/.test(cs.overflowY)) { top = Math.max(top, b.top); bottom = Math.min(bottom, b.bottom); }
    }
    return right - left > 1 && bottom - top > 1 ? { left, top, right, bottom, width: right - left, height: bottom - top } : null;
  };
  const shown = (el) => { const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false; for (let p = el.parentElement; p; p = p.parentElement) { const c = getComputedStyle(p); if (c.display === "none" || c.visibility === "hidden" || Number(c.opacity) === 0) return false; } return true; };

  // 1. text boxes: one per text node, reduced to the painted part
  const boxes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || ["SCRIPT", "STYLE", "NOSCRIPT", "OPTION"].includes(el.tagName) || skip(el) || !shown(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    // line boxes carry slack above and below the ink (display type is set at line-height .9–1): compare the middle 70%
    const rects = [...range.getClientRects()].map((r) => visibleRect(el, { left: r.left, right: r.right, top: r.top + r.height * 0.15, bottom: r.bottom - r.height * 0.15 })).filter(Boolean);
    let fixed = false;
    for (let q = el; q && !fixed; q = q.parentElement) fixed = getComputedStyle(q).position === "fixed"; // the phone's bottom bar, toasts: they sit over content by design
    if (rects.length) boxes.push({ el, rects, fixed });
  }

  // 2. text drawn over other text
  const overlap = (a, b) => { const w = Math.min(a.right, b.right) - Math.max(a.left, b.left); const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 3 && h > 4 ? w * h : 0; };
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const A = boxes[i], B = boxes[j];
      if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el) || A.fixed !== B.fixed) continue;
      if (A.el.closest(".rt-w") && B.el.closest(".rt-w") && A.el.closest("[data-reveal]") === B.el.closest("[data-reveal]")) continue;
      let hit = 0;
      for (const ra of A.rects) { for (const rb of B.rects) hit = Math.max(hit, overlap(ra, rb)); }
      if (hit > 24) out.push({ kind: "text-over-text", a: `${name(A.el)} “${snippet(A.el)}”`, b: `${name(B.el)} “${snippet(B.el)}”`, area: Math.round(hit) });
    }
  }

  // 3. text outside the page edges
  for (const { el, rects } of boxes) {
    if (el.closest("[style*='overflow']") && false) continue;
    for (const r of rects) if (r.left < -1 || r.right > vw + 1) { out.push({ kind: "text-off-page", a: `${name(el)} “${snippet(el)}”`, left: Math.round(r.left), right: Math.round(r.right) }); break; }
  }

  // 4. text clipped by its own box (not ellipsis / line-clamp / reveal masks)
  document.querySelectorAll("body *").forEach((el) => {
    if (skip(el) || el.closest(".rt-w") || !shown(el)) return;
    const cs = getComputedStyle(el);
    if (!/(hidden|clip)/.test(cs.overflowX + cs.overflowY)) return;
    if (cs.textOverflow === "ellipsis" || cs.webkitLineClamp !== "none" && cs.webkitLineClamp !== "") return;
    if (!el.textContent.trim() || el.querySelector("img, picture, video") || el.clientWidth <= 2 || el.clientHeight <= 2) return;
    if (el.matches('[aria-label="Quick filters"]')) return; // by design: groups that do not fit on the line are clipped and inert (the drawer has them all)
    if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) out.push({ kind: "text-clipped", a: `${name(el)} “${snippet(el)}”`, scroll: `${el.scrollWidth}×${el.scrollHeight}`, box: `${el.clientWidth}×${el.clientHeight}` });
  });

  // 5. columns that spread their content apart
  document.querySelectorAll("body *").forEach((el) => {
    if (skip(el) || !shown(el)) return;
    const cs = getComputedStyle(el);
    if (!(cs.display === "flex" && cs.flexDirection === "column" && /space-(between|around|evenly)/.test(cs.justifyContent))) return;
    const kids = [...el.children].filter((k) => getComputedStyle(k).position !== "absolute" && k.getBoundingClientRect().height > 0);
    if (kids.length < 2) return;
    const used = kids.reduce((s, k) => s + k.getBoundingClientRect().height, 0);
    const free = el.getBoundingClientRect().height - used - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - (kids.length - 1) * (parseFloat(cs.rowGap) || 0);
    if (free > 120) out.push({ kind: "void-in-column", a: `${name(el)}`, free: Math.round(free) });
  });

  // 6. pictures stretched out of proportion
  document.querySelectorAll("img").forEach((img) => {
    if (!img.naturalWidth || !shown(img) || img.closest("[data-nogrid]")) return;
    const cs = getComputedStyle(img);
    if (cs.objectFit !== "fill") return;
    const r = img.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const drift = Math.abs(r.width / r.height / (img.naturalWidth / img.naturalHeight) - 1);
    if (drift > 0.04) out.push({ kind: "picture-stretched", a: `${name(img)} ${(img.currentSrc || img.src).split("/").pop().slice(0, 40)}`, drift: Math.round(drift * 100) + "%" });
  });
  // 7. rails that do not scroll but stop short of the edge (a handful of tiles hugging the left with a void beside them)
  document.querySelectorAll("[data-carousel]").forEach((rail) => {
    if (!shown(rail)) return;
    const items = [...rail.children];
    if (items.length < 2 || rail.scrollWidth > rail.clientWidth + 2) return;
    const box = rail.getBoundingClientRect();
    const last = items[items.length - 1].getBoundingClientRect();
    const itemW = items[0].getBoundingClientRect().width;
    if (box.right - last.right > itemW * 2.6) out.push({ kind: "rail-underfilled", a: `${rail.getAttribute("aria-label")}`, items: items.length, empty: Math.round(box.right - last.right) + "px" });
  });
  // 8. near-miss alignment: neighbours in one grid row whose top edges are almost — but not quite — on the same line
  document.querySelectorAll(".grid-main").forEach((g) => {
    const kids = [...g.children].filter(shown).map((k) => ({ k, r: k.getBoundingClientRect() })).filter((x) => x.r.height > 120 && x.r.width > 120);
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i].r, b = kids[j].r;
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 4) continue; // stacked, not side by side
        const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlap < 0.4 * Math.min(a.height, b.height)) continue;
        const dt = Math.abs(a.top - b.top);
        if (dt >= 3 && dt <= 40) out.push({ kind: "near-miss-top", a: name(kids[i].k), b: name(kids[j].k), off: Math.round(dt) + "px" });
      }
    }
  });
  return out;
};

(async () => {
  const browser = await chromium.launch();
  let total = 0;
  const tally = {};
  for (const w of WIDTHS) {
    const mobile = w < 700;
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const run = async (route) => {
      await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 120000 });
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 35)); } window.scrollTo(0, 0); });
      await page.waitForTimeout(500);
      const found = await page.evaluate(probe);
      // identical findings repeated by a list of cards are one finding
      const uniq = [...new Map(found.map((f) => [f.kind + (f.a || "").replace(/“.*”/, "") + (f.b || "").replace(/“.*”/, ""), f])).values()];
      if (uniq.length) {
        total += uniq.length;
        console.log(`✗ ${w}px ${route}`);
        for (const f of uniq.slice(0, VERBOSE ? 99 : 6)) { tally[f.kind] = (tally[f.kind] || 0) + 1; console.log(`    ${f.kind}: ${Object.entries(f).filter(([k]) => k !== "kind").map(([k, v]) => `${k}=${v}`).join("  ")}`); }
        if (uniq.length > 6 && !VERBOSE) console.log(`    … +${uniq.length - 6} more`);
      }
    };
    for (const r of ROUTES) await run(r);
    if (ROUTES === PUBLIC || flag("--routes", "") === "") {
      await page.goto(BASE + "/login", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /Use the demo account/ }).click();
      await page.getByRole("button", { name: "Send code" }).click();
      await page.getByLabel("One-time code").fill("123456");
      await page.waitForURL(/\/account$/);
      for (const r of AUTHED) await run(r);
    }
    await ctx.close();
  }
  await browser.close();
  console.log(total ? `\n${total} layout finding(s): ${JSON.stringify(tally)}` : "\nNo overlaps, clipping, off-page text, voids or stretched pictures");
  process.exit(total ? 1 : 0);
})();
