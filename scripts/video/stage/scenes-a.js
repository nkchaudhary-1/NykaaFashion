/* Launch video — scenes 0–3: the open, the new look, shop by category, the two layouts. Every picture is a still captured from the real site (scripts/video/capture.cjs). */
(function () {
  const { W, H, K, E, seg, lerp, clamp, scene, el, put, shot, geo, words, rise, fall, strips, pan, outline, cursor, svgImg } = Stage;
  const px = (v) => v * K;
  const HDR = 109 * K; // the sticky header, in stage px (145)
  const HDR_TOP = 36 * K; // where it sits at scroll 0, under the black utility strip (48)
  const WORDMARK = "/public/brand/nykaa-fashion-logo.svg";

  /** the real header, riding the top of a scrolled page like the sticky bar it is */
  function stickyHeader(root, scrollAt) {
    const h = shot("header", root, { style: { zIndex: 8 } });
    return (t) => put(h, { y: Math.max(0, HDR_TOP - scrollAt(t)) });
  }

  // ── 0 · the open ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  scene("s0-open", 5.0, (root) => {
    const logo = svgImg(WORDMARK, root, { left: "96px", top: "84px", height: "46px" });
    const l1 = words(root, "A *new* *look*", { cls: "display", style: { position: "absolute", left: "96px", top: "262px", fontSize: "200px" } });
    const l2 = words(root, "for Nykaa Fashion.", { cls: "display", style: { position: "absolute", left: "96px", top: "470px", fontSize: "200px" } });
    const sub = el("div", { text: "India’s fashion, rebuilt around pictures.", style: { position: "absolute", left: "100px", top: "742px", fontSize: "46px", letterSpacing: "-0.02em", color: "var(--ink2)" } }, root);
    const tag = el("div", { cls: "eyebrow", text: "Design prototype · sample data", style: { position: "absolute", left: "100px", top: "962px", color: "var(--ink3)" } }, root);
    const hero = el("div", { cls: "fill", style: { willChange: "clip-path" } }, root);
    const img = shot("hero", hero);
    const boxes = [l1, l2].map((w) => w[0].parentElement.parentElement);
    return (t) => {
      boxes.forEach((b) => (b.style.visibility = t < 3.3 ? "visible" : "hidden")); // once they have left, they are gone
      rise(l1, t, 0.35);
      rise(l2, t, 0.62);
      put(sub, { y: (1 - seg(t, 1.5, 2.3)) * 24, o: seg(t, 1.5, 2.3) * (1 - seg(t, 2.6, 3.05)) });
      put(tag, { o: seg(t, 1.8, 2.5) * (1 - seg(t, 2.6, 3.05)) });
      fall(l1, t, 2.55);
      fall(l2, t, 2.65);
      put(logo, { o: seg(t, 0.15, 0.8) * (1 - seg(t, 2.6, 3.05)) });
      // the picture fills the frame: a card from the middle of the screen to edge-to-edge
      const p = seg(t, 3.3, 5.0, E.expoInOut);
      const cw = lerp(820, 1920, p), ch = lerp(461, 1080, p);
      const l = (1920 - cw) / 2, tp = (1080 - ch) / 2 + lerp(60, 0, p);
      hero.style.clipPath = `inset(${tp}px ${1920 - l - cw}px ${1080 - tp - ch}px ${l}px)`;
      hero.style.visibility = t >= 3.25 ? "visible" : "hidden";
      put(img, { s: lerp(1.3, 1, p), origin: "50% 74%" });
    };
  });

  // ── 1 · the new look ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
  scene("s1-newlook", 11.0, (root) => {
    const box = el("div", { cls: "abs", style: { width: "1920px", willChange: "transform" } }, root);
    shot("hero", box);
    shot("classic-intro", box, { style: { top: px(810) + "px" } });
    shot("classic-brands", box, { style: { top: px(810 + 596) + "px" } });
    const scrollAt = (t) => lerp(0, px(810 + 120), seg(t, 7.7, 10.7, E.quartInOut));
    const hdr = stickyHeader(root, scrollAt);

    // the 12-column grid of the page, laid over the banner (46 px margins, 24 px gutters, 90.3 px columns at 1440)
    const grid = el("div", { cls: "fill", style: { pointerEvents: "none" } }, root);
    const cols = Array.from({ length: 12 }, (_, i) => el("div", { style: { position: "absolute", top: "0", height: "1080px", left: px(46.08 + i * (90.32 + 24)) + "px", width: px(90.32) + "px", background: "var(--pink)", transformOrigin: "50% 0" } }, grid));
    const gridChip = el("div", { cls: "chip pink", text: "12 columns · 4 on phones", style: { left: px(46.08) + "px", top: "226px" } }, grid);

    // the tokens panel
    const panel = el("div", { style: { position: "absolute", left: "1300px", top: HDR + "px", width: "620px", height: 1080 - HDR + "px", background: "var(--bone)", borderLeft: "1px solid var(--line)", padding: "48px 56px" } }, root);
    el("div", { cls: "eyebrow", text: "Design tokens", style: { color: "var(--ink3)" } }, panel);
    el("div", { text: "Aa", style: { fontSize: "250px", lineHeight: "1", letterSpacing: "-0.06em", fontWeight: "500", marginTop: "6px", marginLeft: "-8px" } }, panel);
    el("div", { text: "Inter Display — the only typeface", style: { fontSize: "27px", marginTop: "-4px", letterSpacing: "-0.015em" } }, panel);
    const sw = [["Bone", "#f4efe8"], ["Paper", "#faf7f2"], ["Ink", "#15120f"], ["Raspberry", "#982854"], ["Marigold", "#ffb020"], ["Emerald", "#2e6e3a"]];
    const wrap = el("div", { style: { position: "relative", marginTop: "52px", height: "400px" } }, panel);
    const swatches = sw.map(([name, hex], i) => {
      const c = el("div", { style: { position: "absolute", left: (i % 3) * 176 + "px", top: Math.floor(i / 3) * 204 + "px", width: "150px" } }, wrap);
      el("div", { style: { width: "150px", height: "128px", background: hex, border: "1px solid var(--line)" } }, c);
      el("div", { text: name, style: { fontSize: "22px", marginTop: "10px", fontWeight: "500" } }, c);
      el("div", { text: hex, style: { fontSize: "19px", color: "var(--ink3)", letterSpacing: "0.04em" } }, c);
      return c;
    });
    el("div", { cls: "eyebrow", text: "Flat colour · 1px rules · square corners", style: { position: "absolute", left: "56px", bottom: "44px", color: "var(--ink3)", fontSize: "18px" } }, panel);

    const cap = strips(root, [
      { t0: 0.5, t1: 4.3, eyebrow: "01 · The new look", title: "Studio-paper warmth. <span class='em'>Poster-scale</span> type." },
      { t0: 4.9, t1: 7.6, eyebrow: "Flat colour. One typeface.", title: "No shadows. No gradients. <span class='em'>No blur.</span>" },
      { t0: 8.2, t1: 10.8, eyebrow: "Editorial, and commerce-first", title: "Big type. Clear prices. Clear offers." },
    ]);
    return (t) => {
      put(box, { y: -scrollAt(t) });
      hdr(t);
      // grid overlay
      cols.forEach((c, i) => {
        const a = seg(t, 2.1 + i * 0.045, 2.8 + i * 0.045, E.expoOut);
        const b = seg(t, 4.5, 4.9, E.quartIn);
        put(c, { sy: a, o: 0.14 * (1 - b) });
      });
      put(gridChip, { o: seg(t, 2.6, 3.1) * (1 - seg(t, 4.5, 4.9)) });
      // tokens panel
      const pin = seg(t, 4.7, 5.5, E.expoOut), pout = seg(t, 7.3, 7.9, E.quartIn);
      put(panel, { x: (1 - pin) * 640 + pout * 640 });
      swatches.forEach((s, i) => { const a = seg(t, 5.2 + i * 0.07, 5.8 + i * 0.07, E.expoOut); put(s, { y: (1 - a) * 30, o: a }); });
      cap(t);
    };
  });

  // ── 2 · shop by category ─────────────────────────────────────────────────────────────────────────────────────────────────────
  scene("s2-categories", 11.0, (root) => {
    const g = geo("classic-categories");
    const strip = pan(root, "classic-categories", { top: HDR, from: 0, to: 60, t0: 0, t1: 3.4, ease: E.sineInOut });
    const hdr = stickyHeader(root, () => 999);
    const tile0 = g.tiles[0];
    const o1 = outline(strip.box, { x: px(tile0.x), y: px(tile0.y), w: px(tile0.w), h: px(tile0.h * 0.74) }, { label: "Up to 24% off — worked out from the catalogue", labelAt: "above" });
    const btn = g.button;
    const bx = px(btn.x + btn.w / 2), by = HDR + px(btn.y + btn.h / 2) - 60;
    const o2 = outline(strip.box, { x: px(btn.x), y: px(btn.y), w: px(btn.w), h: px(btn.h) }, { label: "Opens the full list", labelAt: "below", pad: 12 });
    const cur = cursor(root, [{ t: 2.2, x: 1500, y: 880 }, { t: 3.3, x: bx, y: by, click: true }]);
    const dlg = el("div", { cls: "fill", style: { willChange: "transform, opacity" } }, root);
    shot("cat-dialog", dlg);
    const cap = strips(root, [
      { t0: 0.35, t1: 3.1, eyebrow: "02 · Shop by category", title: "Right under the banner.", sub: "Twelve tiles — each shows its saving." },
      { t0: 4.3, t1: 10.3, eyebrow: "All of it, one tap", title: "23 categories. <span class='em'>4 departments.</span>", sub: "Every line opens its listing." },
    ]);
    return (t) => {
      strip.update(t);
      hdr(t);
      o1.show(t, 1.0, 2.1);
      o2.show(t, 2.55, 3.5);
      cur(t);
      const a = seg(t, 3.5, 4.1, E.expoOut);
      dlg.style.visibility = a > 0 ? "visible" : "hidden";
      put(dlg, { s: lerp(1.035, 1, a), o: a, origin: "50% 45%" });
      cap(t);
    };
  });

  // ── 3 · two layouts ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  scene("s3-layouts", 16.0, (root) => {
    // 3b: classic against full-bleed, first tile rows aligned
    const cmp = el("div", { cls: "fill" }, root);
    const gc = geo("classic-categories"), gb = geo("bleed-categories");
    const rowTop = 372;
    const classicY = rowTop - px(gc.tiles[0].y), bleedY = rowTop - px(gb.tiles[0].y);
    const A = el("div", { cls: "fill", style: { overflow: "hidden" } }, cmp);
    const classic = el("div", { cls: "abs", style: { top: classicY + "px", width: "1920px" } }, A);
    shot("classic-categories", classic);
    // the gutters and margins of the classic page, as pink bars
    const row = gc.tiles.slice(0, 6);
    const edges = [[0, row[0].x], ...row.slice(0, 5).map((r, i) => [r.x + r.w, row[i + 1].x]), [row[5].x + row[5].w, 1440]];
    const bars = edges.map(([a, b]) => el("div", { style: { position: "absolute", left: px(a) + "px", width: px(b - a) + "px", top: px(row[0].y) + "px", height: px(row[0].h) + "px", background: "var(--pink)", transformOrigin: "50% 0" } }, classic));
    // the heading band is the same in both layouts, so it is drawn once, above both: the classic one is covered, and the wipe only changes the tiles
    el("div", { style: { position: "absolute", left: "0", top: "0", width: "1920px", height: Math.max(0, px(gc.tiles[0].y) - 4) + "px", background: "#faf7f2" } }, classic);
    const B = el("div", { cls: "fill", style: { overflow: "hidden", willChange: "clip-path" } }, cmp);
    const bleed = el("div", { cls: "abs", style: { top: bleedY + "px", width: "1920px" } }, B);
    shot("bleed-categories", bleed);
    const head = el("div", { cls: "abs", style: { top: bleedY + "px", width: "1920px", height: px(gb.tiles[0].y) - 2 + "px", overflow: "hidden", zIndex: 3 } }, cmp);
    shot("bleed-categories", head);
    const edge = el("div", { style: { position: "absolute", top: "0", width: "10px", height: "1080px", background: "var(--pink)", willChange: "transform" } }, cmp);
    const hdr2 = stickyHeader(cmp, () => 999);
    const gutChip = el("div", { cls: "chip pink", text: "46 px margins · 24 px gutters", style: { left: "0", top: rowTop - 96 + "px", fontSize: "24px", padding: "14px 20px" } }, cmp);
    const zeroChip = el("div", { cls: "chip", text: "0 margins · 0 gutters · tiles touch", style: { left: "0", top: rowTop - 96 + "px", fontSize: "24px", padding: "14px 20px" } }, cmp);

    // 3a: the second layout, as a switch
    const intro = el("div", { cls: "fill dark", style: { willChange: "clip-path" } }, root);
    const t1 = words(intro, "Try a *second* layout.", { cls: "display", style: { position: "absolute", left: "96px", top: "230px", fontSize: "170px", color: "var(--bone)" } });
    const sw = el("div", { style: { position: "absolute", left: "100px", top: "590px", width: "1040px", height: "124px", border: "2px solid var(--bone)" } }, intro);
    const pill = el("div", { style: { position: "absolute", left: "0", top: "0", width: "520px", height: "120px", background: "var(--bone)" } }, sw);
    const lab1 = el("div", { text: "Classic", style: { position: "absolute", left: "0", top: "0", width: "520px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "46px", fontWeight: "500" } }, sw);
    const lab2 = el("div", { text: "Full-bleed", style: { position: "absolute", left: "520px", top: "0", width: "520px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "46px", fontWeight: "500" } }, sw);
    const note = el("div", { text: "Same grid. Same data. Zero gap.", style: { position: "absolute", left: "100px", top: "770px", fontSize: "46px", letterSpacing: "-0.02em", color: "var(--bone)" } }, intro);
    const curA = cursor(intro, [{ t: 1.7, x: 1380, y: 940 }, { t: 2.9, x: 100 + 520 + 300, y: 590 + 66, click: true }]);

    // 3c: the full-bleed tour
    const tour = el("div", { cls: "fill" }, root);
    const mods = [["bleed-price", 476, "Price shortcuts"], ["bleed-brands", 776, "Brands, in their own colours"], ["bleed-edits", 776, "Curated destinations"], ["bleed-trending", 776, "One feature, eight more"]];
    const tourBox = el("div", { cls: "abs", style: { top: HDR + "px", width: "1920px", willChange: "transform" } }, tour);
    let off = 0;
    const offs = mods.map(([name, h]) => { const o = off; shot(name, tourBox, { style: { top: px(o) + "px" } }); off += h; return o; });
    const tourScroll = (t) => {
      const keys = [[10.4, offs[0]], [11.4, offs[0]], [12.1, offs[1]], [13.2, offs[1]], [13.9, offs[2]], [15.0, offs[2]], [15.6, offs[3] + 160]];
      let v = keys[0][1];
      for (let i = 0; i < keys.length - 1; i++) { if (t >= keys[i][0] && t <= keys[i + 1][0]) v = lerp(keys[i][1], keys[i + 1][1], seg(t, keys[i][0], keys[i + 1][0], E.quartInOut)); else if (t > keys[i + 1][0]) v = keys[i + 1][1]; }
      return px(v);
    };
    const hdr3 = stickyHeader(tour, () => 999);
    const chips = mods.map(([, , name]) => el("div", { cls: "chip", text: name, style: { left: "0", top: "0", fontSize: "24px", padding: "14px 20px" } }, tour));
    const capB = strips(root, [
      { t0: 5.2, t1: 10.0, eyebrow: "03 · Full-bleed", title: "Pictures run <span class='em'>edge to edge.</span>", sub: "No margins. No gutters. Tiles touch — on the same 12-column grid." },
      { t0: 10.9, t1: 15.5, eyebrow: "All the way down", title: "Flat colour blocks between the pictures.", sub: "Price, brand and edit tiles keep the rhythm." },
    ]);
    const chipAt = [[10.5, 12.2], [12.3, 13.9], [13.9, 15.1], [15.1, 16.0]];
    return (t) => {
      // phases
      const showCmp = t >= 4.2 && t < 10.5;
      cmp.style.visibility = showCmp ? "visible" : "hidden";
      tour.style.visibility = t >= 10.4 ? "visible" : "hidden";
      intro.style.visibility = t < 4.8 ? "visible" : "hidden";

      // 3a
      rise(t1, t, 0.35, { stagger: 0.09 });
      put(sw, { o: seg(t, 1.0, 1.6) });
      const click = seg(t, 2.9, 3.5, E.expoInOut);
      put(pill, { x: click * 520 });
      lab1.style.color = click > 0.5 ? "var(--bone)" : "var(--ink)";
      lab2.style.color = click > 0.5 ? "var(--ink)" : "var(--bone)";
      put(note, { y: (1 - seg(t, 3.5, 4.1)) * 20, o: seg(t, 3.5, 4.1) });
      curA(t);
      const leave = seg(t, 4.0, 4.8, E.expoInOut);
      intro.style.clipPath = `inset(0 0 ${leave * 1080}px 0)`;

      // 3b
      const bars_a = seg(t, 5.0, 5.9, E.expoOut);
      bars.forEach((b, i) => put(b, { sy: seg(t, 5.0 + i * 0.05, 5.7 + i * 0.05, E.expoOut), o: 0.88 }));
      const wipe = seg(t, 7.0, 8.3, E.expoInOut);
      const ex = lerp(-12, 1930, wipe);
      B.style.clipPath = `inset(0 ${Math.max(0, 1920 - ex)}px 0 0)`;
      put(edge, { x: ex - 5, o: wipe > 0.001 && wipe < 0.999 ? 1 : 0 });
      put(gutChip, { x: 1920 - 96 - gutChip.offsetWidth, y: 0, o: seg(t, 5.3, 5.8) * (1 - seg(t, 7.3, 7.7)) });
      put(zeroChip, { x: 1920 - 96 - zeroChip.offsetWidth, y: 0, o: seg(t, 8.0, 8.5) });
      void bars_a;
      capB(t);

      // 3c
      put(tourBox, { y: -tourScroll(t) });
      chips.forEach((c, i) => { const [a, b] = chipAt[i]; put(c, { x: 1920 - 96 - c.offsetWidth, y: HDR + 36, o: seg(t, a, a + 0.4) * (1 - seg(t, b - 0.3, b)) }); });
    };
  });
})();
