/* Launch video — scenes 4–9: keep exploring, a home that adapts, New & Next and the pop-up, the phone, the proof, the end card. */
(function () {
  const { W, H, K, E, seg, lerp, clamp, scene, el, put, shot, geo, words, rise, fall, strips, pan, outline, cursor, svgImg } = Stage;
  const px = (v) => v * K;
  const HDR = 109 * K;
  const WORDMARK = "/public/brand/nykaa-fashion-logo.svg";
  const stickyTop = (root) => shot("header", root, { style: { zIndex: 8 } }); // pinned at the top of a scrolled page
  const piece = (a, t) => { let v = a[0][1]; for (let i = 0; i < a.length - 1; i++) { if (t >= a[i][0] && t <= a[i + 1][0]) v = lerp(a[i][1], a[i + 1][1], seg(t, a[i][0], a[i + 1][0], E.sineInOut)); else if (t > a[i + 1][0]) v = a[i + 1][1]; } return v; };

  // ── 4 · keep exploring ───────────────────────────────────────────────────────────────────────────────────────────────────────
  scene("s4-explore", 16.4, (root) => {
    // 4a: the title, flat raspberry
    const intro = el("div", { cls: "fill", style: { background: "var(--pink)", color: "#fff" } }, root);
    const w1 = words(intro, "Keep exploring.", { cls: "display", style: { position: "absolute", left: "96px", top: "290px", fontSize: "230px", color: "#fff" } });
    const sub = el("div", { text: "There is always one more thing.", style: { position: "absolute", left: "100px", top: "640px", fontSize: "54px", letterSpacing: "-0.02em", color: "#fff" } }, intro);

    // 4b: the home feed
    const feedLayer = el("div", { cls: "fill" }, root);
    const FROM = px(210), TO = px(210) + 1760, T0 = 2.1, T1 = 8.3;
    const feed = pan(feedLayer, "bleed-feed", { top: HDR, from: FROM, to: TO, t0: T0, t1: T1, ease: E.sineInOut });
    stickyTop(feedLayer);
    const tiles = geo("bleed-feed");
    // three reasons to point at: the first of each kind that crosses the lower half of the screen
    const pick = (re, lo, hi) => tiles.find((x) => x.chip && re.test(x.reason) && px(x.chip.y) > lo && px(x.chip.y) < hi);
    const chosen = [pick(/^More from/, FROM + 250, FROM + 800), pick(/^Because you browse/, FROM + 800, FROM + 1300), pick(/^More from/, FROM + 1250, FROM + 1900)].filter(Boolean);
    const screenY = (c, t) => px(c.chip.y) - lerp(FROM, TO, seg(t, T0, T1, E.sineInOut)) + HDR;
    const when = (c) => { for (let t = T0; t <= T1; t += 0.03) if (screenY(c, t) <= 600) return t; return T1 - 0.5; };
    const outs = chosen.map((c, i) => ({ o: outline(feed.box, { x: px(c.chip.x), y: px(c.chip.y), w: px(c.chip.w), h: px(c.chip.h) }, { pad: 7, ...(i === 0 ? { label: "Why you’re seeing it", labelAt: "above" } : {}) }), t0: when(c) }));

    // 4c: the product page and its feed
    const pdpTop = el("div", { cls: "fill" }, root);
    shot("pdp-top", pdpTop);
    const pdpFeedLayer = el("div", { cls: "fill" }, root);
    const FP = px(140);
    const pf = pan(pdpFeedLayer, "pdp-feed", { top: HDR, from: FP, to: FP + 420, t0: 9.9, t1: 12.7, ease: E.sineInOut });
    stickyTop(pdpFeedLayer);
    const pt = geo("pdp-feed");
    const p1 = pt.find((x) => x.chip && /^More from/.test(x.reason)), p2 = pt.find((x) => x.chip && /^Completes/.test(x.reason));
    const po1 = outline(pf.box, { x: px(p1.chip.x), y: px(p1.chip.y), w: px(p1.chip.w), h: px(p1.chip.h) }, { pad: 7, label: "Seeded by this product", labelAt: "above" });
    const po2 = outline(pf.box, { x: px(p2.chip.x), y: px(p2.chip.y), w: px(p2.chip.w), h: px(p2.chip.h) }, { pad: 7 });
    const target = pt[3]; // the piece that gets opened
    const cur = cursor(pdpFeedLayer, [{ t: 11.6, x: 1500, y: 800 }, { t: 12.9, x: px(target.x + target.w * 0.5), y: HDR + px(target.y + target.h * 0.4) - (FP + 420), click: true }]);
    const pdp2 = el("div", { cls: "fill" }, root);
    shot("pdp2-top", pdp2);
    // the chain of hops
    const chain = el("div", { style: { position: "absolute", right: "96px", top: "160px", display: "flex", alignItems: "center", gap: "12px" } }, root);
    const hops = ["Hop 1", "Hop 2", "Hop 3 →"].map((txt, i) => el("div", { cls: "chip" + (i === 1 ? " pink" : ""), text: txt, style: { position: "relative", fontSize: "26px", padding: "16px 22px" } }, chain));

    // 4d: back
    const backLayer = el("div", { cls: "fill" }, root);
    const back = pan(backLayer, "bleed-feed", { top: HDR, from: TO, to: TO, t0: 0, t1: 1 });
    stickyTop(backLayer);
    const lastTile = tiles.find((x) => px(x.y) > TO + 250 && px(x.y) < TO + 520 && x.w > 200) || tiles[10];
    const bo = outline(back.box, { x: px(lastTile.x), y: px(lastTile.y), w: px(lastTile.w), h: px(lastTile.h) }, { pad: 8, label: "Same tile, same place", labelAt: "above" });
    const backChip = el("div", { cls: "chip", text: "← Back", style: { fontSize: "28px", padding: "18px 26px", left: "1500px", top: "210px" } }, backLayer);

    const cap = strips(root, [
      { t0: 2.5, t1: 8.1, eyebrow: "04 · Keep exploring", title: "Every piece says why it’s <span class='em'>there.</span>", sub: "Picked from what you looked at and saved — on this device." },
      { t0: 8.6, t1: 9.9, eyebrow: "Product page", title: "Open a piece…" },
      { t0: 10.3, t1: 14.1, eyebrow: "…and every page ends in a feed", title: "Open one. There’s <span class='em'>always</span> another.", sub: "Each product seeds the next feed." },
      { t0: 14.6, t1: 16.3, eyebrow: "No lost place", title: "Back returns you to the same tile." },
    ]);
    return (t) => {
      intro.style.visibility = t < 2.4 ? "visible" : "hidden";
      rise(w1, t, 0.25, { stagger: 0.12 });
      put(sub, { y: (1 - seg(t, 1.0, 1.7)) * 24, o: seg(t, 1.0, 1.7) });
      feedLayer.style.visibility = t >= 2.0 && t < 8.9 ? "visible" : "hidden";
      feed.update(t);
      put(feedLayer, { o: seg(t, 2.05, 2.4) * (1 - seg(t, 8.5, 8.9)) });
      outs.forEach(({ o, t0 }) => o.show(t, t0, t0 + 1.9));
      const aTop = seg(t, 8.5, 8.9) * (1 - seg(t, 10.0, 10.4));
      pdpTop.style.visibility = aTop > 0 ? "visible" : "hidden";
      put(pdpTop, { o: aTop });
      const aFeed = seg(t, 10.0, 10.4) * (1 - seg(t, 13.2, 13.6));
      pdpFeedLayer.style.visibility = aFeed > 0 ? "visible" : "hidden";
      put(pdpFeedLayer, { o: aFeed });
      pf.update(t);
      po1.show(t, 10.7, 12.6);
      po2.show(t, 11.3, 12.6);
      cur(t);
      const aP2 = seg(t, 13.2, 13.6) * (1 - seg(t, 14.4, 14.8));
      pdp2.style.visibility = aP2 > 0 ? "visible" : "hidden";
      put(pdp2, { o: aP2 });
      hops.forEach((c, i) => { const a = seg(t, [9.0, 13.3, 13.9][i], [9.4, 13.7, 14.3][i]); put(c, { y: (1 - a) * 16, o: a * (1 - seg(t, 14.4, 14.8)) }); });
      const aB = seg(t, 14.4, 14.8);
      backLayer.style.visibility = aB > 0 ? "visible" : "hidden";
      put(backLayer, { o: aB });
      back.update(t);
      bo.show(t, 15.0, 1e9);
      put(backChip, { x: 0, y: 0, o: seg(t, 14.7, 15.1) });
      cap(t);
    };
  });

  // ── 5 · a home that adapts ───────────────────────────────────────────────────────────────────────────────────────────────────
  scene("s5-adapts", 8.2, (root) => {
    el("div", { cls: "eyebrow", text: "05 · Adapts to the shopper", style: { position: "absolute", left: "100px", top: "86px", color: "var(--pink)" } }, root);
    const t1 = words(root, "Home that", { cls: "display", style: { position: "absolute", left: "96px", top: "132px", fontSize: "168px" } });
    const t2 = words(root, "*adapts.*", { cls: "display", style: { position: "absolute", left: "96px", top: "290px", fontSize: "168px" } });
    const modes = [
      { name: "First visit", note: "Banner, categories, then price shortcuts." },
      { name: "Returning", note: "“Pick up where you left off” rises to third." },
      { name: "Deal hunting", note: "The offer band is promoted to third." },
    ];
    const rowEls = modes.map((m, i) => {
      const r = el("div", { style: { position: "absolute", left: "96px", top: 560 + i * 104 + "px", width: "640px", height: "92px" } }, root);
      const mk = el("div", { style: { position: "absolute", left: "0", top: "30px", width: "30px", height: "30px", background: "var(--pink)", transformOrigin: "0 50%" } }, r);
      const nm = el("div", { text: m.name, style: { position: "absolute", left: "52px", top: "0", fontSize: "62px", letterSpacing: "-0.035em", fontWeight: "500", lineHeight: "1.2" } }, r);
      return { r, mk, nm };
    });
    const notes = modes.map((m) => el("div", { text: m.note, style: { position: "absolute", left: "100px", top: "890px", width: "640px", fontSize: "30px", lineHeight: "1.35", color: "var(--ink2)" } }, root));
    const sim = el("div", { cls: "chip", text: "Simulated · this device’s signals only", style: { left: "100px", top: "980px", fontSize: "19px" } }, root);

    // the page's modules, as real crops
    const X = 860, WD = 1000, SH = 200, GAP = 18, Y0 = 92;
    const f = WD / 1440; // css → stage px
    const sc = WD / (1440 * K);
    const mod = (name, label, cropTop, hot) => {
      const box = el("div", { cls: "abs", style: { left: X + "px", top: "0", width: WD + "px", height: SH + "px", overflow: "hidden", background: "var(--sand)", border: "1px solid var(--line)", willChange: "transform" } }, root);
      shot(name, box, { scale: sc, style: { top: -cropTop * f + "px" } });
      el("div", { cls: "chip" + (hot ? " pink" : ""), text: label, style: { left: "0", top: "0", fontSize: "19px", padding: "9px 13px" } }, box);
      return box;
    };
    const m = {
      banner: mod("hero", "Sale banner", 110),
      cats: mod("bleed-categories", "Shop by category", 36),
      price: mod("bleed-price", "Price shortcuts", 40),
      trail: mod("bleed-trail", "Pick up where you left off", 0, true),
      offers: mod("bleed-offers", "The offer band", 0, true),
    };
    const frame = el("div", { style: { position: "absolute", left: X - 8 + "px", top: Y0 + 2 * (SH + GAP) - 8 + "px", width: WD + 16 + "px", height: SH + 16 + "px", border: "5px solid var(--pink)" } }, root);
    el("div", { cls: "chip pink", text: "3rd", style: { left: "-5px", top: "-52px" } }, frame);
    const slotY = (i) => Y0 + i * (SH + GAP);
    // where each module is in each mode (slot index, or null = away)
    const place = { banner: [0, 0, 0], cats: [1, 1, 1], price: [2, 3, 3], trail: [null, 2, null], offers: [null, null, 2] };
    const sw1 = 2.7, sw2 = 5.0;
    return (t) => {
      rise(t1, t, 0.2, { stagger: 0.1 });
      rise(t2, t, 0.45, { stagger: 0.1 });
      const mode = t < sw1 ? 0 : t < sw2 ? 1 : 2;
      rowEls.forEach(({ r, mk, nm }, i) => { const on = mode === i; r.style.opacity = on ? "1" : "0.28"; put(mk, { sx: on ? 1 : 0.0001 }); nm.style.color = "var(--ink)"; });
      notes.forEach((n, i) => { const a = i === mode ? seg(t, [0.9, sw1 + 0.2, sw2 + 0.2][i], [1.4, sw1 + 0.7, sw2 + 0.7][i]) : 0; put(n, { o: a, y: (1 - a) * 12 }); });
      put(sim, { o: seg(t, 1.0, 1.5) });
      Object.keys(m).forEach((k, n) => {
        const box = m[k];
        const a = seg(t, 0.4 + n * 0.1, 1.2 + n * 0.1, E.expoOut);
        const slots = place[k];
        const at = (md) => slots[md];
        // current and previous slot, eased across the switch times
        const prog = mode === 0 ? 0 : mode === 1 ? seg(t, sw1, sw1 + 0.9, E.expoInOut) : seg(t, sw2, sw2 + 0.9, E.expoInOut);
        const from = at(Math.max(0, mode - 1)), to = at(mode);
        let y, x = 0, o = 1;
        const yOf = (s) => (s === null ? slotY(2) : slotY(s));
        if (mode === 0) { y = yOf(to); if (to === null) { x = 1100; o = 0; } }
        else if (from === null && to === null) { y = yOf(null); x = 1100; o = 0; }
        else if (from === null && to !== null) { y = yOf(to); x = (1 - prog) * 1100; o = prog; }
        else if (from !== null && to === null) { y = yOf(from); x = prog * 1100; o = 1 - prog; }
        else { y = lerp(yOf(from), yOf(to), prog); }
        put(box, { x, y: y + (1 - a) * 40, o: o * a });
      });
      const pulse = Math.max(seg(t, sw1, sw1 + 0.5) * (1 - seg(t, sw1 + 0.5, sw1 + 1.2)), seg(t, sw2, sw2 + 0.5) * (1 - seg(t, sw2 + 0.5, sw2 + 1.2)));
      put(frame, { o: seg(t, 1.2, 1.7), s: 1 + 0.012 * pulse });
    };
  });

  // ── 6 · New & Next and the pop-up ─────────────────────────────────────────────────────────────────────────────────────────────
  scene("s6-newnext", 8.0, (root) => {
    const hub = el("div", { cls: "fill" }, root);
    const hubImg = shot("nn-hub", hub);
    const gh = geo("nn-hub");
    const o1 = outline(hub, { x: px(gh.timer.x), y: px(gh.timer.y), w: px(gh.timer.w), h: px(gh.timer.h) }, { label: "Counts down to launch day", labelAt: "above", pad: 12 });
    const o2 = outline(hub, { x: px(gh.notify.x), y: px(gh.notify.y), w: px(gh.notify.w), h: px(gh.notify.h) }, { label: "Notify me", labelAt: "above", pad: 10 });
    const brand = el("div", { cls: "fill" }, root);
    const brandImg = shot("nn-brand", brand);
    const brandChip = el("div", { cls: "chip", text: "One template, every brand", style: { left: "0", top: "0", fontSize: "24px", padding: "14px 20px" } }, brand);
    const pip = el("div", { cls: "fill" }, root);
    shot("pip", pip);
    const gp = geo("pip");
    const o3 = outline(pip, { x: px(gp.x), y: px(gp.y), w: px(gp.w), h: px(gp.h) }, { label: "A floating promo — quiet on bag, checkout and login", labelAt: "above", pad: 10 });
    const cap = strips(root, [
      { t0: 0.4, t1: 3.5, eyebrow: "06 · New & Next", title: "Brand launches, with a live <span class='em'>countdown.</span>", sub: "Early access, offers and a Notify me button — from one data file." },
      { t0: 5.7, t1: 7.8, eyebrow: "Pop-ups", title: "A promo that knows when to stay quiet." },
    ]);
    return (t) => {
      const push = seg(t, 0, 3.8, E.sineInOut);
      put(hubImg, { s: lerp(1, 1.04, push), origin: "70% 40%" });
      hub.style.visibility = t < 3.9 ? "visible" : "hidden";
      o1.show(t, 0.9, 2.1);
      o2.show(t, 2.1, 3.5);
      const a = seg(t, 3.5, 3.9) * (1 - seg(t, 5.5, 5.9));
      brand.style.visibility = a > 0 ? "visible" : "hidden";
      put(brand, { o: a });
      put(brandImg, { s: lerp(1.02, 1, seg(t, 3.5, 5.9, E.sineInOut)), origin: "50% 50%" });
      put(brandChip, { x: 1920 - 96 - brandChip.offsetWidth, y: 190, o: seg(t, 4.0, 4.4) * (1 - seg(t, 5.3, 5.6)) });
      const b = seg(t, 5.5, 5.9);
      pip.style.visibility = b > 0 ? "visible" : "hidden";
      put(pip, { o: b });
      o3.show(t, 6.2, 1e9);
      cap(t);
    };
  });

  // ── 7 · the phone ────────────────────────────────────────────────────────────────────────────────────────────────────────────
  scene("s7-mobile", 10.0, (root) => {
    el("div", { cls: "eyebrow", text: "07 · Mobile first", style: { position: "absolute", left: "100px", top: "52px", color: "var(--pink)" } }, root);
    const title = words(root, "Built for the phone *first.*", { cls: "display", style: { position: "absolute", left: "96px", top: "88px", fontSize: "104px" } });
    const sub = el("div", { text: "Two-up walls. Bottom sheets. Thumb-reach navigation.", style: { position: "absolute", left: "100px", top: "212px", fontSize: "30px", letterSpacing: "-0.01em", color: "var(--ink3)" } }, root);
    const S = 0.84, SW = 390 * S, SH = 844 * S, BZ = 13, TOP = 308;
    const phones = [{ cx: 400, label: "Home" }, { cx: 960, label: "Categories" }, { cx: 1520, label: "Product, then its feed" }].map((p) => {
      const x = p.cx - SW / 2 - BZ;
      const frame = el("div", { cls: "phone", style: { left: "0", top: "0", width: SW + 2 * BZ + "px", height: SH + 2 * BZ + "px", borderRadius: "50px", willChange: "transform" } }, root);
      const screen = el("div", { cls: "screen", style: { left: BZ + "px", top: BZ + "px", width: SW + "px", height: SH + "px", borderRadius: "38px" } }, frame);
      el("div", { cls: "eyebrow", text: p.label, style: { position: "absolute", left: "0", top: "-44px", width: "100%", textAlign: "center", color: "var(--ink3)", fontSize: "20px" } }, frame);
      return { frame, screen, x };
    });
    const place = (parent, name, top) => shot(name, parent, { scale: S / K, style: { top: top + "px" } });
    const A = el("div", { cls: "abs", style: { left: "0", top: "0", width: SW + "px", willChange: "transform" } }, phones[0].screen);
    let ao = 0; [["phone-hero", 844], ["phone-categories", 896], ["phone-price", 374], ["phone-trending", 1593]].forEach(([n, h]) => { place(A, n, ao * S); ao += h; });
    const Bwall = el("div", { cls: "abs", style: { left: "0", top: "0", width: SW + "px", willChange: "transform" } }, phones[1].screen);
    place(Bwall, "phone-categories", 0);
    const Bsheet = el("div", { cls: "abs", style: { left: "0", top: "0", width: SW + "px" } }, phones[1].screen);
    place(Bsheet, "phone-sheet", 0);
    const C = el("div", { cls: "abs", style: { left: "0", top: "0", width: SW + "px", willChange: "transform" } }, phones[2].screen);
    place(C, "phone-pdp", 0);
    place(C, "phone-pdp-feed", 844 * S);
    const keysA = [[0, 0], [1.6, 0], [3.2, 844 + 120], [4.6, 844 + 120], [6.4, 844 + 896 + 10], [7.4, 844 + 896 + 10], [9.4, 844 + 896 + 374 + 660]];
    const keysC = [[0, 0], [2.4, 0], [4.4, 844 - 30], [9.4, 844 + 1500]];
    const keysB = [[0, 0], [3.0, 0]];
    return (t) => {
      rise(title, t, 0.2, { stagger: 0.09 });
      put(sub, { o: seg(t, 0.9, 1.5) });
      phones.forEach((p, i) => { const a = seg(t, 0.5 + i * 0.25, 1.5 + i * 0.25, E.expoOut); put(p.frame, { x: p.x, y: TOP + (1 - a) * 140, o: a }); });
      put(A, { y: -piece(keysA, t) * S });
      put(C, { y: -piece(keysC, t) * S });
      put(Bwall, { y: -piece(keysB, t) * S });
      const sheet = seg(t, 3.2, 3.7);
      put(Bsheet, { o: sheet });
    };
  });

  // ── 8 · the proof ────────────────────────────────────────────────────────────────────────────────────────────────────────────
  scene("s8-proof", 6.0, (root) => {
    root.classList.add("dark");
    root.style.background = "var(--luxe)";
    const title = words(root, "Checked where it *ships.*", { cls: "display", style: { position: "absolute", left: "96px", top: "110px", fontSize: "132px", color: "var(--bone)" } });
    const zero = el("div", { text: "0", style: { position: "absolute", right: "150px", top: "190px", fontSize: "760px", lineHeight: "0.8", letterSpacing: "-0.07em", fontWeight: "500", color: "var(--marigold)" } }, root);
    const zl = el("div", { text: "accessibility violations (axe)", style: { position: "absolute", right: "150px", top: "840px", fontSize: "34px", color: "var(--bone)", letterSpacing: "-0.01em" } }, root);
    // each line is something scripts/qa actually checks on the production build (PROJECT_STATUS.md, staging QA log) — nothing here is a promise about what was not run
    const items = ["Keyboard-tested: menus, search, dialogs", "Reduced motion, honoured", "Flat by rule: no shadows, gradients or blur", "No sideways scroll, at any width tested"];
    const fine = el("div", { text: "Automated checks on the production build: axe-core (WCAG 2.1 A/AA), keyboard, overflow and flat-design scripts. Not a full accessibility audit.", style: { position: "absolute", left: "100px", top: "968px", fontSize: "22px", letterSpacing: "-0.005em", color: "rgba(244,239,232,0.72)" } }, root);
    const rows = items.map((txt, i) => {
      const r = el("div", { style: { position: "absolute", left: "96px", top: 440 + i * 120 + "px", width: "1000px", height: "96px", display: "flex", alignItems: "center", gap: "28px", borderTop: "1px solid rgba(244,239,232,0.28)", willChange: "transform" } }, root);
      const ck = el("div", { style: { width: "56px", height: "56px", background: "var(--marigold)", position: "relative", flex: "none" } }, r);
      el("div", { style: { position: "absolute", left: "17px", top: "9px", width: "14px", height: "28px", borderRight: "6px solid var(--luxe)", borderBottom: "6px solid var(--luxe)", transform: "rotate(40deg)" } }, ck);
      el("div", { text: txt, style: { fontSize: "44px", letterSpacing: "-0.025em", color: "var(--bone)", fontWeight: "500" } }, r);
      return r;
    });
    return (t) => {
      rise(title, t, 0.2, { stagger: 0.1 });
      const z = seg(t, 0.6, 1.4, E.expoOut);
      put(zero, { y: (1 - z) * 60, o: z });
      put(zl, { o: seg(t, 1.2, 1.8) });
      put(fine, { o: seg(t, 3.0, 3.6) });
      rows.forEach((r, i) => { const a = seg(t, 1.0 + i * 0.4, 1.7 + i * 0.4, E.expoOut); put(r, { y: (1 - a) * 30, o: a }); });
    };
  });

  // ── 9 · the end ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  scene("s9-end", 6.0, (root) => {
    const logo = svgImg(WORDMARK, root, { left: "96px", top: "84px", height: "50px" });
    const l1 = words(root, "The *new look.*", { cls: "display", style: { position: "absolute", left: "96px", top: "340px", fontSize: "292px" } });
    const chips = ["Shop by category", "Full-bleed layout", "Keep exploring", "New & Next"].map((txt) => el("div", { cls: "chip", text: txt, style: { left: "0", top: "0", fontSize: "26px", padding: "16px 22px" } }, root));
    const note = el("div", { cls: "eyebrow", text: "Design prototype · sample data · not the real site", style: { position: "absolute", left: "100px", top: "962px", color: "var(--ink3)" } }, root);
    return (t) => {
      put(logo, { o: seg(t, 0.2, 0.8) });
      rise(l1, t, 0.35, { stagger: 0.12 });
      let x = 96;
      chips.forEach((c, i) => { const a = seg(t, 1.5 + i * 0.12, 2.1 + i * 0.12); put(c, { x, y: 800 + (1 - a) * 22, o: a }); x += c.offsetWidth + 14; });
      put(note, { o: seg(t, 2.4, 3.0) });
    };
  });
})();
