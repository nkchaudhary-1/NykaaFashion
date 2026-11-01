/* The launch video's timeline engine (docs/LAUNCH_VIDEO.md).
 * A scene is `{ id, duration, build(root) → update(t) }`. `build` creates the DOM once; `update(t)` positions everything for time t (seconds) as a pure function of t — no clocks, no
 * transitions, no random — so the renderer can ask for any frame, in any order, on any worker, and get the same picture. Motion uses the product's own two curves
 * (expo-out for arrivals, in-out for moves). The site's pictures are the only imagery: stills captured from the real pages (scripts/video/capture.cjs).
 */
(function () {
  const W = 1920, H = 1080;
  const K = W / 1440; // a 1440 css px wide viewport of the site fills the frame exactly

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const E = {
    linear: (t) => t,
    expoOut: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    expoIn: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    expoInOut: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
    quartOut: (t) => 1 - Math.pow(1 - t, 4),
    quartIn: (t) => t * t * t * t,
    quartInOut: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    cubicInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  };
  /** eased progress of t through [a, b] */
  const seg = (t, a, b, ease = E.expoOut) => ease(clamp((t - a) / Math.max(1e-6, b - a)));

  const SCENES = [];
  const scene = (id, duration, build) => SCENES.push({ id, duration, build });

  let geometry = {};
  let manifest = {};
  let pending = [];

  /** a DOM element: el("div", { cls, style:{}, text, html, attrs:{} }, parent) */
  function el(tag, props = {}, parent) {
    const n = document.createElement(tag);
    if (props.cls) n.className = props.cls;
    if (props.style) Object.assign(n.style, props.style);
    if (props.text != null) n.textContent = props.text;
    if (props.html != null) n.innerHTML = props.html;
    if (props.attrs) for (const k in props.attrs) n.setAttribute(k, props.attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /** transform + opacity in one call (px, unitless scale, degrees) */
  function put(n, { x = 0, y = 0, s = 1, sx, sy, o, r = 0, origin } = {}) {
    n.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${r}deg) scale(${sx ?? s}, ${sy ?? s})`;
    if (o !== undefined) n.style.opacity = String(o);
    if (origin) n.style.transformOrigin = origin;
  }

  /** a captured still as an <img> whose box is the page's own css box scaled onto the stage (width in site css px × K) */
  function shot(name, parent, { scale = 1, style = {} } = {}) {
    const m = manifest[name];
    if (!m) throw new Error(`no still named ${name}`);
    const w = m.cssWidth * K * scale;
    const h = m.cssHeight * K * scale;
    const img = el("img", { style: { position: "absolute", left: 0, top: 0, width: w + "px", height: h + "px", ...style }, attrs: { src: `/shots/${m.file}`, alt: "" } }, parent);
    pending.push(new Promise((res) => { img.onload = img.onerror = res; }).then(() => (img.decode ? img.decode().catch(() => {}) : null)));
    img.__w = w; img.__h = h; img.__name = name;
    return img;
  }
  const geo = (name) => geometry[name];

  /** an SVG file from the product (the wordmark) */
  function svgImg(src, parent, style) {
    const img = el("img", { style: { position: "absolute", ...style }, attrs: { src, alt: "" } }, parent);
    pending.push(new Promise((res) => { img.onload = img.onerror = res; }));
    return img;
  }

  /** text as masked words (like the site's RevealText). `*word*` is the accent colour. Returns the inner spans in reading order. */
  function words(parent, text, { cls = "", style = {} } = {}) {
    const box = el("div", { cls, style: { whiteSpace: "nowrap", ...style } }, parent);
    const spans = [];
    let accent = false;
    text.split(/(\s+)/).forEach((tok) => {
      if (/^\s+$/.test(tok)) { el("span", { cls: "sp" }, box); return; }
      let part = tok;
      let lead = false;
      if (part.startsWith("*")) { accent = true; lead = true; part = part.slice(1); }
      const end = part.endsWith("*");
      if (end) part = part.slice(0, -1);
      const m = el("span", { cls: "mask" }, box);
      const s = el("span", { cls: accent ? "em" : "", text: part }, m);
      spans.push(s);
      if (end) accent = false;
      void lead;
    });
    return spans;
  }
  /** let the words of `spans` rise out of their masks one after another */
  function rise(spans, t, t0, { stagger = 0.07, dur = 0.95, ease = E.expoOut } = {}) {
    spans.forEach((s, i) => { const p = seg(t, t0 + i * stagger, t0 + i * stagger + dur, ease); s.style.transform = `translateY(${(1 - p) * 118}%)`; });
  }
  /** and out again */
  function fall(spans, t, t0, { stagger = 0.04, dur = 0.5, ease = E.quartIn } = {}) {
    spans.forEach((s, i) => { const p = seg(t, t0 + i * stagger, t0 + i * stagger + dur, ease); if (p > 0) s.style.transform = `translateY(${-p * 118}%)`; });
  }

  /** the caption strip(s) of a footage scene: [{ t0, t1, eyebrow, title, sub }] — slides in from the left edge, leaves the same way */
  function strips(root, items, { bottom = 72 } = {}) {
    const nodes = items.map((it) => {
      const n = el("div", { cls: "strip", style: { bottom: bottom + "px", willChange: "transform" } }, root);
      if (it.eyebrow) el("div", { cls: "eyebrow", text: it.eyebrow }, n);
      el("div", { cls: "t", html: it.title }, n);
      if (it.sub) el("div", { cls: "s", text: it.sub }, n);
      return n;
    });
    return (t) => items.forEach((it, i) => {
      const n = nodes[i];
      const on = t >= it.t0 - 0.01 && t <= it.t1 + 0.01;
      n.style.display = on ? "block" : "none";
      if (!on) return;
      const a = seg(t, it.t0, it.t0 + 0.75, E.expoOut);
      const b = seg(t, it.t1 - 0.5, it.t1, E.quartIn);
      put(n, { x: -(1 - a) * 105 * (n.offsetWidth / 100) - b * 105 * (n.offsetWidth / 100) });
    });
  }

  /** a tall still that scrolls inside the frame: `at(t)` is how far (stage px) it has moved. Children added with .add() travel with it. */
  function pan(root, name, { top = 0, scale = 1, from = 0, to = 0, t0 = 0, t1 = 1, ease = E.quartInOut, x = 0, clipTop = 0 } = {}) {
    const box = el("div", { cls: "abs", style: { left: x + "px", width: (manifest[name].cssWidth * K * scale) + "px", willChange: "transform" } }, root);
    const img = shot(name, box, { scale });
    const api = {
      box, img, w: img.__w, h: img.__h,
      add(n) { box.appendChild(n); return n; },
      pos(t) { return lerp(from, to, seg(t, t0, t1, ease)); },
      update(t) { put(box, { y: top - api.pos(t) }); },
    };
    void clipTop;
    return api;
  }

  /** the site's real header, held at the top of a scrolled page like the sticky bar it is */
  function header(root) {
    const m = manifest["header"];
    const n = shot("header", root, { style: { zIndex: 5 } });
    void m;
    return n;
  }

  /** a flat outline with a label chip; coordinates in the stage space of its parent */
  function outline(parent, { x, y, w, h }, { label, pad = 8, color, labelAt = "above" } = {}) {
    const box = el("div", { cls: "box", style: { width: w + pad * 2 + "px", height: h + pad * 2 + "px", transformOrigin: "0 0", ...(color ? { borderColor: color } : {}) } }, parent);
    let chip = null;
    if (label) chip = el("div", { cls: "chip pink", text: label }, box);
    const base = { x: x - pad, y: y - pad };
    return {
      box,
      show(t, t0, t1 = 1e9) {
        const a = seg(t, t0, t0 + 0.45, E.expoOut);
        const b = seg(t, t1, t1 + 0.35, E.quartIn);
        const o = a * (1 - b);
        box.style.display = o > 0.001 ? "block" : "none";
        put(box, { x: base.x, y: base.y, sx: 0.96 + 0.04 * a, sy: 0.96 + 0.04 * a, o });
        box.style.transformOrigin = "50% 50%";
        if (chip) {
          const ch = chip.offsetHeight || 44;
          const over = base.x - 5 + chip.offsetWidth - (W - 24); // keep the label inside the frame
          chip.style.left = (over > 0 ? -5 - over : -5) + "px";
          chip.style.top = labelAt === "above" ? -ch - 5 + "px" : h + pad * 2 + "px";
        }
      },
    };
  }

  /** the pointer: keys [{ t, x, y, click }] — eased moves, a pink ripple on every click */
  function cursor(root, keys) {
    const c = el("div", { cls: "cursor" }, root);
    c.innerHTML = '<svg viewBox="0 0 44 44" width="44" height="44"><path d="M8 4 L8 34 L16 27 L22 40 L28 37 L22 25 L33 25 Z" fill="#15120f" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>';
    const ripples = keys.filter((k) => k.click).map(() => el("div", { cls: "ripple" }, root));
    return (t) => {
      if (t < keys[0].t - 0.3 || t > keys[keys.length - 1].t + 0.9) { c.style.display = "none"; ripples.forEach((r) => (r.style.display = "none")); return; }
      c.style.display = "block";
      let x = keys[0].x, y = keys[0].y;
      for (let i = 0; i < keys.length - 1; i++) {
        if (t >= keys[i].t && t <= keys[i + 1].t) { const p = seg(t, keys[i].t, keys[i + 1].t, E.expoInOut); x = lerp(keys[i].x, keys[i + 1].x, p); y = lerp(keys[i].y, keys[i + 1].y, p); }
        else if (t > keys[i + 1].t) { x = keys[i + 1].x; y = keys[i + 1].y; }
      }
      const intro = seg(t, keys[0].t - 0.3, keys[0].t, E.expoOut);
      const outro = seg(t, keys[keys.length - 1].t + 0.4, keys[keys.length - 1].t + 0.9, E.quartIn);
      put(c, { x: x - 8, y: y - 4, s: 1 - 0.08 * 0, o: intro * (1 - outro) });
      let r = 0;
      keys.forEach((k, i) => {
        if (!k.click) return;
        const n = ripples[r++];
        const p = clamp((t - k.t) / 0.7);
        const on = p > 0 && p < 1;
        n.style.display = on ? "block" : "none";
        if (on) { const d = 30 + 130 * E.expoOut(p); n.style.width = d + "px"; n.style.height = d + "px"; put(n, { x: k.x - d / 2, y: k.y - d / 2, o: 1 - p }); }
        void i;
      });
    };
  }

  /** a number that counts up: returns text for time t */
  const count = (t, t0, t1, to, from = 0, ease = E.expoOut) => Math.round(lerp(from, to, seg(t, t0, t1, ease)));

  async function boot() {
    const g = await fetch("/shots/geometry.json").then((r) => r.json()).catch(() => ({ manifest: {}, geometry: {} }));
    manifest = g.manifest; geometry = g.geometry;
    window.__scenes = SCENES.map((s) => ({ id: s.id, duration: s.duration }));
    const stage = document.getElementById("stage");
    const built = {};
    window.__prepare = async (id) => {
      const s = SCENES.find((x) => x.id === id);
      if (!s) throw new Error("no scene " + id);
      if (!built[id]) {
        const root = el("div", { cls: "scene", attrs: { "data-scene": id } }, stage);
        pending = [];
        const update = s.build(root, { geo, manifest });
        built[id] = { root, update };
        await Promise.all(pending);
      }
      await document.fonts.ready;
      return true;
    };
    window.__render = (id, t) => {
      const b = built[id];
      if (!b) throw new Error("scene not prepared " + id);
      for (const k in built) built[k].root.style.display = k === id ? "block" : "none";
      b.update(t);
      return true;
    };
    window.__ready = true;
  }

  window.Stage = { W, H, K, clamp, lerp, E, seg, scene, el, put, shot, geo, svgImg, words, rise, fall, strips, pan, header, outline, cursor, count, boot, get manifest() { return manifest; } };
})();
