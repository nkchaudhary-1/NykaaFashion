// Render context: one per image. Owns the float film buffer, the camera, the shared light pool,
// the backdrop, the shadow system and the finishing pass (tone, vignette, grain, depth of field).
import { Rng, hashStr } from './prng.mjs';
import { clamp, lerp, smoothstep, f } from './geometry.mjs';
import { fbm, hash2 } from './noise.mjs';
import { parse, mix, shadowOf, luma, rgb01 } from './color.mjs';
import { Camera, shadeLayer } from './shade.mjs';
import { makeTexture } from './texture.mjs';
import { rasterize, svgWindow, over, alphaToMask, castShadow, blur, blurRgb, Layer, sharp } from './raster.mjs';

let UID = 0;

export class Ctx {
  constructor({ w, h, spec }) {
    this.W = w; this.H = h; this.spec = spec;
    this.u = Math.min(w / 1000, h / 1250);           // px per reference unit (1000x1250 frame)
    this.rng = new Rng(((spec.seed ?? 1) * 2654435761) ^ hashStr(String(spec.kind) + ':' + String(spec.shot || 'front')));
    this.film = new Float32Array(w * h * 3);
    this.cam = new Camera({ k: 9, tx: w / 2, ty: 0 });
    this.product = new Float32Array(w * h);           // union alpha of everything product-ish
    this.lightMod = null;                             // film-sized window-light/leaf modulation (1 = lit)
    this.layers = new Map();
    this.bg = spec.bg || '#EFE8DD';
    const bgRgb = rgb01(this.bg), sh = rgb01(shadowOf(this.bg, 0.62));
    this.shadowTint = [Math.min(1, sh[0] / bgRgb[0]), Math.min(1, sh[1] / bgRgb[1]), Math.min(1, sh[2] / bgRgb[2])];
    this.dof = null;
    this.pool = (x, y) => this.poolAt(x, y);
    this.mode = 'wall';
    this.horizon = 0.7;
  }

  id(p = 'i') { return `${p}${++UID}`; }

  /**
   * Scene support: a child context shares this film / product mask / light with its parent but carries its own spec,
   * rng and camera. `place` = { cx, cy, height, rot } (fractions of the canvas) pins the item's bounding box on the canvas;
   * backdrops are skipped (the scene paints one shared backdrop) and every drawn layer is also recorded in `itemMask`.
   */
  child(spec, place, extra = {}) {
    const c = Object.create(this);
    c.spec = spec;
    c.rng = new Rng(((spec.seed ?? 1) * 2654435761) ^ hashStr(String(spec.kind) + ':' + String(spec.shot || 'front')));
    c.place = place;
    c.itemMask = new Float32Array(this.W * this.H);
    c.cam = new Camera({ k: 9, tx: this.W / 2, ty: 0 });
    c.backdrop = async () => {};
    c.shadeAndDraw = function (layer, o = {}) { Ctx.prototype.shadeAndDraw.call(this, layer, o); alphaToMask(layer, this.W, this.H, this.itemMask); };
    Object.assign(c, extra);
    return c;
  }

  /** scene placement: scale so the bounds are `place.height` of the canvas tall, centred on (place.cx, place.cy) */
  _placeCam(b) {
    const p = this.place, bh = Math.max(1e-3, b.y1 - b.y0), bw = b.x1 - b.x0, M = 0.02;
    let k = (p.height * this.H) / bh;
    // keep the item inside [2%, 98%] of the frame: scale it down uniformly about its anchor (hook / base centre)
    const hpx = p.height * this.H, top = (p.cy - p.height / 2) * this.H, bottom = (p.cy + p.height / 2) * this.H;
    let s = 1;
    const halfMax = Math.min(p.cx - M, 0.98 - p.cx) * this.W;
    if ((bw * k) / 2 > halfMax) s = Math.min(s, Math.max(0.25, halfMax / ((bw * k) / 2)));
    if (p.anchor === 'hang' && bottom > (1 - M) * this.H) s = Math.min(s, ((1 - M) * this.H - top) / hpx);
    if (p.anchor === 'floor' && top < M * this.H) s = Math.min(s, (bottom - M * this.H) / hpx);
    let cyPx = p.cy * this.H;
    if (s < 0.985) {
      k *= s;
      const h2 = bh * k;
      cyPx = p.anchor === 'hang' ? top + h2 / 2 : p.anchor === 'floor' ? bottom - h2 / 2 : cyPx;
      console.warn(`! ${p.job || 'scene'}: ${this.spec.kind} scaled to ${Math.round(s * 100)}% to stay inside the frame`);
    }
    const rot = ((p.rot || 0) * Math.PI) / 180;
    const c0 = new Camera({ k, tx: 0, ty: 0, rot });
    const [px, py] = c0.fwd((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
    this.cam = new Camera({ k, tx: p.cx * this.W - px, ty: cyPx - py, rot });
    return this.cam;
  }

  /** mean colour of a film region as it will appear in the finished image (tone curve + vignette, no grain), '#rrggbb' */
  sampleFinal(x0, x1, y0, y1, { contrast = 0.2, vignette = 0.05 } = {}) {
    const { W, H, film } = this;
    x0 = Math.max(0, Math.floor(x0)); x1 = Math.min(W, Math.ceil(x1)); y0 = Math.max(0, Math.floor(y0)); y1 = Math.min(H, Math.ceil(y1));
    let sr = 0, sg = 0, sb = 0, n = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const o = (y * W + x) * 3;
        let r = film[o], g = film[o + 1], b = film[o + 2];
        const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const cv = contrast * (2 * L - 1) * L * (1 - L) * 2;
        r += cv; g += cv; b += cv;
        const t = L - 0.5;
        r += 0.010 * t; b -= 0.012 * t;
        const nx = (x / W - 0.5) * 2, ny = (y / H - 0.5) * 2;
        const vg = 1 - vignette * smoothstep(0.45, 1.5, Math.hypot(nx, ny * 0.9));
        r *= vg; g *= vg; b *= vg;
        sr += clamp(r * 0.975 + 0.012, 0, 1); sg += clamp(g * 0.975 + 0.012, 0, 1); sb += clamp(b * 0.975 + 0.012, 0, 1); n++;
      }
    }
    const h = (v) => Math.round((v / Math.max(n, 1)) * 255).toString(16).padStart(2, '0');
    return '#' + h(sr) + h(sg) + h(sb);
  }

  /** shared soft key-light pool (≈ ±6 % luminance): lit upper-left, falling off to the lower-right */
  poolAt(x, y) {
    const nx = x / this.W, ny = y / this.H;
    const dx = nx - 0.36, dy = (ny - 0.26) * 0.85;
    const r = Math.sqrt(dx * dx + dy * dy);
    return 1.032 - 0.105 * smoothstep(0.05, 1.0, r);
  }

  // ------------------------------------------------------------------ camera
  /** Fit cm-space bounds into the frame. Sets this.cam. */
  fitCamera(b, { mx = 0.1, top = 0.06, bottom = 0.08, kmax = 11, kmin = 2, biasY = 0 } = {}) {
    if (this.place) return this._placeCam(b);
    const availW = this.W * (1 - 2 * mx), availH = this.H * (1 - top - bottom);
    const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
    let k = Math.min(availW / bw, availH / bh, kmax * this.u);
    k = Math.max(k, kmin * this.u);
    const cx = (b.x0 + b.x1) / 2;
    const ty = this.H * top + (availH - bh * k) / 2 + biasY * this.H - b.y0 * k;
    this.cam = new Camera({ k, tx: this.W / 2 - cx * k, ty, rot: 0 });
    return this.cam;
  }
  /** Zoomed camera centred on a cm-space point. zoom multiplies the "fit" scale. */
  focusCamera(u, v, k, { rot = 0, cx = 0.5, cy = 0.5 } = {}) {
    const c = new Camera({ k, tx: 0, ty: 0, rot });
    const [px, py] = c.fwd(u, v);
    this.cam = new Camera({ k, tx: this.W * cx - px, ty: this.H * cy - py, rot });
    return this.cam;
  }

  // ------------------------------------------------------------------ backdrop
  /**
   * Seamless-paper studio backdrop.
   *  mode 'wall'    : plain wall (hanging garments)
   *  mode 'surface' : wall + table with a soft horizon (objects)
   * shaft: { angle, x, width, soft, strength, bars }  leaves: { ... } | false
   */
  async backdrop({ mode = 'wall', horizon = 0.7, shaft = true, leaves = null, seedOffset = 0 } = {}) {
    const { W, H, u, film } = this;
    this.mode = mode; this.horizon = horizon;
    const rng = this.rng.fork('backdrop' + seedOffset);
    const [br, bgc, bb] = parse(this.bg).map((v) => v / 255);
    const lm = new Float32Array(W * H).fill(1); // 1 = lit; shaft/leaf shadows subtract from it

    // ---- window-light shaft(s): soft-edged diagonal band(s)
    const sh = shaft === false ? null : {
      angle: rng.range(-24, -12), // degrees from vertical (negative = leaning right at top)
      pos: rng.range(0.52, 0.84), width: rng.range(0.16, 0.26), soft: rng.range(34, 58) * u, strength: rng.range(0.065, 0.095),
      bars: rng.chance(0.55) ? 2 : 1, gap: rng.range(0.2, 0.28),
      ...(typeof shaft === 'object' ? shaft : {}),
    };
    if (sh) {
      const th = (sh.angle * Math.PI) / 180, ca = Math.cos(th), sa = Math.sin(th);
      const cxp = W * sh.pos, cyp = H * 0.5;
      const centers = sh.bars === 2 ? [-sh.gap * W * 0.5, sh.gap * W * 0.5] : [0];
      const halfW = (sh.width * W) / (sh.bars === 2 ? 2.6 : 2);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const dx = x - cxp, dy = y - cyp;
          const t = dx * ca - dy * sa;            // across the band
          const s = dx * sa + dy * ca;            // along the band
          let m = 0;
          for (const c of centers) {
            const q = Math.abs(t - c);
            const e = clamp((halfW - q) / sh.soft + 0.5, 0, 1);
            m = Math.max(m, e * e * (3 - 2 * e));
          }
          // fade the band out along its length so it feels like a pool of light, not a stripe
          m *= 1 - smoothstep(0.35 * H, 0.95 * H, Math.abs(s));
          lm[y * W + x] -= m * sh.strength;
        }
      }
    }

    // ---- leaf / branch shadow
    const lf = leaves === null ? rng.chance(0.4) : leaves;
    if (lf) {
      const leafPlane = await this._leafShadow(rng.fork('leaf'), typeof lf === 'object' ? lf : {});
      for (let i = 0; i < W * H; i++) lm[i] -= leafPlane[i];
    }
    this.lightMod = lm;

    // ---- paint base
    const hy = horizon * H, hb = 22 * u;
    const ms = (1 - this.shadowTint[0] + 1 - this.shadowTint[1] + 1 - this.shadowTint[2]) / 3 || 1;
    const sc = this.shadowTint.map((t) => 0.45 + 0.55 * ((1 - t) / ms));
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        let p = this.poolAt(x, y);
        // low-frequency paper mottling
        p *= 1 + 0.016 * (fbm(x / (230 * u), y / (230 * u), 3, 11) - 0.5) * 2;
        if (mode === 'surface') {
          const m = smoothstep(hy - hb, hy + hb, y);
          p *= 1 + 0.045 * m - 0.07 * m * smoothstep(hy, H, y);
        }
        const dk = 1 - lm[i]; // shadow darkness, tinted warm so light-shadows share the cast-shadow hue
        film[i * 3] = br * p * (1 - dk * sc[0]); film[i * 3 + 1] = bgc * p * (1 - dk * sc[1]); film[i * 3 + 2] = bb * p * (1 - dk * sc[2]);
      }
    }
  }

  async _leafShadow(rng, o) {
    const { W, H, u } = this;
    const corner = o.corner || rng.pick(['tr', 'tr', 'r', 'tl']);
    const ax = corner === 'tl' ? -0.04 * W : W * 1.04, ay = corner === 'r' ? H * rng.range(0.22, 0.45) : -0.03 * H;
    const dirx = corner === 'tl' ? 1 : -1;
    const len = rng.range(0.55, 0.85) * Math.min(W, H) * 1.05;
    const ang = (corner === 'r' ? rng.range(8, 28) : rng.range(55, 75)) * (Math.PI / 180);
    const bx = ax + dirx * Math.cos(ang) * len, by = ay + Math.sin(ang) * len;
    const mx = (ax + bx) / 2 + dirx * rng.range(-0.08, 0.1) * len, my = (ay + by) / 2 - rng.range(0.02, 0.14) * len;
    const qpt = (t) => [(1 - t) * (1 - t) * ax + 2 * (1 - t) * t * mx + t * t * bx, (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * my + t * t * by];
    let svg = `<path d="M${f(ax)} ${f(ay)}Q${f(mx)} ${f(my)} ${f(bx)} ${f(by)}" stroke="#000" stroke-width="${f(3.5 * u)}" fill="none"/>`;
    const n = rng.int(9, 14);
    for (let i = 0; i < n; i++) {
      const t = 0.12 + (0.86 * i) / n + rng.range(-0.02, 0.02);
      const [px, py] = qpt(t);
      const [qx, qy] = qpt(Math.min(1, t + 0.02));
      const base = Math.atan2(qy - py, qx - px);
      const side = i % 2 ? 1 : -1;
      const a = base + side * rng.range(0.55, 1.15);
      const L = (1 - 0.55 * t) * rng.range(95, 150) * u, Wd = L * rng.range(0.26, 0.36);
      const cs = Math.cos(a), sn = Math.sin(a);
      svg += `<path transform="translate(${f(px)} ${f(py)}) rotate(${f((a * 180) / Math.PI + 90)})" d="M0 0C${f(Wd * 0.65)} ${f(-L * 0.25)} ${f(Wd * 0.6)} ${f(-L * 0.72)} 0 ${f(-L)}C${f(-Wd * 0.6)} ${f(-L * 0.72)} ${f(-Wd * 0.65)} ${f(-L * 0.25)} 0 0Z" fill="#000"/>`;
    }
    // a couple of terminal leaves
    const [tx, ty] = qpt(1);
    svg += `<path transform="translate(${f(tx)} ${f(ty)}) rotate(${f(rng.range(-30, 30) + (dirx > 0 ? 60 : -60))})" d="M0 0C14 -20 14 -60 0 -92C-14 -60 -14 -20 0 0Z" fill="#000"/>`;
    const L = await rasterize(svgWindow(0, 0, W, H, svg), 0, 0, W, H);
    const soft = blur(L.a, W, H, 7 * u), hard = blur(L.a, W, H, 2.6 * u);
    const out = new Float32Array(W * H);
    const s = o.strength ?? rng.range(0.07, 0.11);
    for (let i = 0; i < out.length; i++) out[i] = s * (0.65 * soft[i] + 0.5 * hard[i]);
    return out;
  }

  // ------------------------------------------------------------------ pieces
  /** px rect (clipped to film) for cm-space bounds + padding (cm) */
  rectFor(b, padCm = 1) {
    const cam = this.cam;
    const pts = [[b.x0 - padCm, b.y0 - padCm], [b.x1 + padCm, b.y0 - padCm], [b.x1 + padCm, b.y1 + padCm], [b.x0 - padCm, b.y1 + padCm]].map(([u, v]) => cam.fwd(u, v));
    const x0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[0])))), y0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[1]))));
    const x1 = Math.min(this.W, Math.ceil(Math.max(...pts.map((p) => p[0])))), y1 = Math.min(this.H, Math.ceil(Math.max(...pts.map((p) => p[1]))));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /**
   * Rasterise a piece's albedo (flat colour + pattern + trims), in cm space under the camera.
   * piece: { d, bounds, fill, inner, defs, pad }
   */
  async albedo(piece) {
    const r = this.rectFor(piece.bounds, piece.pad ?? 1.5);
    if (r.w <= 0 || r.h <= 0) return null;
    const cid = this.id('cp');
    // optional placement wrapper: d = "<<TF:transform>>pathdata" (used for rotated / mirrored multi-part objects)
    let d = piece.d, tf = '';
    const m = /^<<TF:([^>]*)>>/.exec(d);
    if (m) { tf = m[1]; d = d.slice(m[0].length); }
    const wrapIn = (x) => (tf ? `<g transform="${tf}">${x}</g>` : x);
    const body = `<g transform="${this.cam.matrix()}">${wrapIn(`<path d="${d}" fill="${piece.fill}"/><g clip-path="url(#${cid})">${piece.inner || ''}</g>`)}</g>`;
    const defs = `${piece.defs || ''}<clipPath id="${cid}"><path d="${d}"/></clipPath>`;
    const svg = svgWindow(r.x, r.y, r.w, r.h, body, defs);
    return rasterize(svg, r.x, r.y, r.w, r.h);
  }

  /** Shade + composite a rasterised layer. opts forwarded to shadeLayer; opts.shadow = tight contact shadow */
  shadeAndDraw(layer, o = {}) {
    const mat = o.mat;
    let tex = mat.tex && mat.tex.type !== 'none' ? makeTexture(mat.tex.type, { seed: (this.spec.seed | 0) + 7, k: this.cam.k }) : null;
    if (tex && o.texSwap) { const t0 = tex; tex = (u, v) => t0(v, u); }
    shadeLayer(layer, { cam: this.cam, pool: this.pool, tex, ...o });
    if (o.contact !== false) {
      const c = o.contact || {};
      castShadow(this.film, this.W, this.H, layer, {
        dx: (c.dx ?? 0.35) * this.cam.k, dy: (c.dy ?? 0.5) * this.cam.k, sigma: (c.sigma ?? 0.55) * this.cam.k,
        strength: c.strength ?? 0.34, tint: this.shadowTint,
      });
    }
    over(this.film, this.W, this.H, layer);
    alphaToMask(layer, this.W, this.H, this.product);
  }

  /** Drop a soft wall shadow for a union of layers (the garment hanging a few cm off the wall). */
  wallShadow(layers, { dx = 1.9, dy = 2.6, shear = -0.035, sigma = 1.7, strength = 0.3, ambient = 0.1 } = {}) {
    if (!layers || !layers.length) return; // nothing in frame (macro crops): an empty union would give a non-finite shear origin
    const { W, H, film } = this, k = this.cam.k;
    const mask = new Float32Array(W * H);
    for (const l of layers) alphaToMask(l, W, H, mask);
    const src = { x: 0, y: 0, w: W, h: H, a: mask };
    // wide ambient occlusion
    castShadow(film, W, H, src, { dx: dx * 0.35 * k, dy: dy * 0.3 * k, sigma: sigma * 2.6 * k, strength: ambient, tint: this.shadowTint });
    // main soft cast (shifts further with distance up the wall)
    const topY = Math.min(...layers.map((l) => l.y));
    castShadow(film, W, H, src, { dx: dx * k, dy: dy * k, shear, y0: topY + 200, sigma: sigma * k, strength, tint: this.shadowTint });
    // tight contact
    castShadow(film, W, H, src, { dx: dx * 0.28 * k, dy: dy * 0.3 * k, sigma: sigma * 0.32 * k, strength: strength * 0.8, tint: this.shadowTint });
  }

  /** Plain vector overlay in film px or cm space. */
  async vector(inner, { cm = true, bounds = null, defs = '' } = {}) {
    const r = bounds ? this.rectFor(bounds, 1) : { x: 0, y: 0, w: this.W, h: this.H };
    if (r.w <= 0 || r.h <= 0) return null; // entirely off-canvas (macro crops)
    const body = cm ? `<g transform="${this.cam.matrix()}">${inner}</g>` : inner;
    const layer = await rasterize(svgWindow(r.x, r.y, r.w, r.h, body, defs), r.x, r.y, r.w, r.h);
    over(this.film, this.W, this.H, layer);
    return layer;
  }

  /**
   * Shadow of an upright object cast on the table: the silhouette is laid down towards the right (and slightly towards
   * the viewer) from the base line, then blurred in two layers (tight + wide). baseY in px.
   */
  groundShadow(layers, { baseY, sx = 0.55, sy = 0.07, sigma = 0.5, strength = 0.34, wide = 2.4, wideStrength = 0.16, rows = null } = {}) {
    const { W, H, film } = this, k = this.cam.k;
    const plane = new Float32Array(W * H);
    for (const l of layers) {
      for (let j = 0; j < l.h; j++) {
        const y = l.y + j;
        if (y >= baseY) continue;
        const hgt = baseY - y;
        const Y = Math.round(baseY + hgt * sy);
        if (Y < 0 || Y >= H) continue;
        const shift = hgt * sx;
        for (let i = 0; i < l.w; i++) {
          const a = l.a[j * l.w + i];
          if (a <= 0.01) continue;
          const X = Math.round(l.x + i + shift);
          if (X < 0 || X >= W) continue;
          const o = Y * W + X;
          plane[o] = Math.min(1, Math.max(plane[o], a * 0.9) + a * 0.1);
        }
      }
    }
    // fill sparse gaps (shear leaves holes): vertical + horizontal smear
    const src = { x: 0, y: 0, w: W, h: H, a: plane };
    const fatten = blur(plane, W, H, 1.4);
    for (let i = 0; i < plane.length; i++) plane[i] = Math.min(1, fatten[i] * 3.0);
    castShadow(film, W, H, src, { sigma: wide * k, strength: wideStrength, tint: this.shadowTint });
    castShadow(film, W, H, src, { sigma: sigma * k, strength, tint: this.shadowTint });
  }

  /** soft elliptical contact shadow right under an object */
  contactEllipse(cx, cy, rx, ry, { strength = 0.5, sigma = 0.5 } = {}) {
    const { W, H, film } = this;
    const pad = Math.ceil(3 * sigma + 4);
    const x0 = Math.max(0, Math.floor(cx - rx - pad)), x1 = Math.min(W, Math.ceil(cx + rx + pad));
    const y0 = Math.max(0, Math.floor(cy - ry - pad)), y1 = Math.min(H, Math.ceil(cy + ry + pad));
    if (x1 <= x0 || y1 <= y0) return;
    const plane = new Float32Array((x1 - x0) * (y1 - y0));
    const w = x1 - x0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; plane[(y - y0) * w + (x - x0)] = q < 1 ? 1 : 0; }
    castShadow(film, W, H, { x: x0, y: y0, w, h: y1 - y0, a: plane }, { sigma, strength, tint: this.shadowTint });
  }

  // ------------------------------------------------------------------ finishing
  /** tilt-shift style depth of field: sharp near `focus` (0-1 along axis), blurring by `sigma` px away from it */
  setDof(o) { this.dof = o; }

  _applyDof() {
    const o = this.dof; if (!o) return;
    const { W, H, film } = this;
    const b1 = blurRgb(film, W, H, o.sigma * 0.45 * this.u), b2 = blurRgb(film, W, H, o.sigma * this.u);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let d;
        if (o.axis === 'x') d = Math.abs(x / W - o.focus);
        else if (o.axis === 'radial') d = Math.hypot((x / W - o.fx) * 1.0, (y / H - o.fy) * 0.8);
        else if (o.axis === 'diag') d = Math.abs((x / W) * o.dx + (y / H) * o.dy - o.focus);
        else d = Math.abs(y / H - o.focus);
        const t = smoothstep(o.band, o.band + (o.falloff ?? 0.3), d);
        const i = (y * W + x) * 3;
        const w2 = clamp((t - 0.45) / 0.55, 0, 1), w1 = clamp(t / 0.45, 0, 1) * (1 - w2);
        const w0 = 1 - w1 - w2;
        film[i] = film[i] * w0 + b1[i] * w1 + b2[i] * w2;
        film[i + 1] = film[i + 1] * w0 + b1[i + 1] * w1 + b2[i + 1] * w2;
        film[i + 2] = film[i + 2] * w0 + b1[i + 2] * w1 + b2[i + 2] * w2;
      }
    }
  }

  /** tone curve, split-toning, vignette, grain -> Uint8 RGB */
  finish({ grain = 0.011, vignette = 0.05, lightOnProduct = 0.38, contrast = 0.2 } = {}) {
    const { W, H, film } = this;
    this._applyDof();
    const rng = this.rng.fork('grain');
    const seed = rng.int(1, 1e6);
    const out = new Uint8Array(W * H * 3);
    const lm = this.lightMod, pr = this.product;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x, o = i * 3;
        let r = film[o], g = film[o + 1], b = film[o + 2];
        // window light also (weakly) falls across the product
        if (lm && pr[i] > 0.01) {
          const dk = (1 - lm[i]) * lightOnProduct * pr[i];
          r *= 1 - dk; g *= 1 - dk; b *= 1 - dk;
        }
        // S-curve + lifted blacks (matte film look)
        const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const cv = contrast * (2 * L - 1) * L * (1 - L) * 2;
        r += cv; g += cv; b += cv;
        // split tone: warm highlights, cool shadows
        const t = L - 0.5;
        r += 0.010 * t; b -= 0.012 * t;
        // vignette
        const nx = (x / W - 0.5) * 2, ny = (y / H - 0.5) * 2;
        const vg = 1 - vignette * smoothstep(0.45, 1.5, Math.hypot(nx, ny * 0.9));
        r *= vg; g *= vg; b *= vg;
        // lifted blacks / softened whites
        r = r * 0.975 + 0.012; g = g * 0.975 + 0.012; b = b * 0.975 + 0.012;
        // grain: tri-noise, strongest in the mids
        const n = (hash2(x, y, seed) + hash2(x + 4099, y + 77, seed) + hash2(x + 31, y + 9091, seed) - 1.5) * 1.15;
        const gw = grain * (0.55 + 1.3 * (1 - Math.abs(2 * L - 1)));
        r += n * gw; g += n * gw * 0.96; b += n * gw * 0.92;
        out[o] = clamp(Math.round(r * 255), 0, 255);
        out[o + 1] = clamp(Math.round(g * 255), 0, 255);
        out[o + 2] = clamp(Math.round(b * 255), 0, 255);
      }
    }
    return out;
  }
}
