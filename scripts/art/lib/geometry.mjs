// Geometry: centripetal Catmull-Rom -> cubic Bézier curves, mirrored half-outlines,
// sampling, offset bands and a tiny path builder. Units are whatever the caller uses (we use cm).

export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rad = (d) => (d * Math.PI) / 180;
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
/** number formatting for SVG */
export const f = (n) => { const r = Math.round(n * 100) / 100; return Object.is(r, -0) ? '0' : String(r); };

const P = (p) => ({ x: p[0], y: p[1], c: p[2] === 'c' });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function crSegment(p0, p1, p2, p3, alpha, tension) {
  let t01 = Math.pow(dist(p0, p1), alpha), t12 = Math.pow(dist(p1, p2), alpha), t23 = Math.pow(dist(p2, p3), alpha);
  if (t01 < 1e-6) t01 = 1e-3; if (t12 < 1e-6) t12 = 1e-3; if (t23 < 1e-6) t23 = 1e-3;
  const m1x = (p1.x - p0.x) / t01 - (p2.x - p0.x) / (t01 + t12) + (p2.x - p1.x) / t12;
  const m1y = (p1.y - p0.y) / t01 - (p2.y - p0.y) / (t01 + t12) + (p2.y - p1.y) / t12;
  const m2x = (p2.x - p1.x) / t12 - (p3.x - p1.x) / (t12 + t23) + (p3.x - p2.x) / t23;
  const m2y = (p2.y - p1.y) / t12 - (p3.y - p1.y) / (t12 + t23) + (p3.y - p2.y) / t23;
  const k = (t12 / 3) * tension;
  return [
    [p1.x, p1.y],
    [p1.x + m1x * k, p1.y + m1y * k],
    [p2.x - m2x * k, p2.y - m2y * k],
    [p2.x, p2.y],
  ];
}

export class Curve {
  constructor(segs, closed = false) {
    this.segs = segs;
    this.closed = closed;
    this._tab = null;
  }

  /** Smooth curve through points. A point may be [x,y] or [x,y,'c'] (corner: no tangent continuity). */
  static through(pts, { closed = false, alpha = 0.5, tension = 1 } = {}) {
    const Q = pts.map(P);
    const n = Q.length;
    const segs = [];
    const cnt = closed ? n : n - 1;
    const refl = (a, b) => ({ x: 2 * b.x - a.x, y: 2 * b.y - a.y });
    for (let i = 0; i < cnt; i++) {
      const p1 = Q[i], p2 = Q[(i + 1) % n];
      let p0, p3;
      if (closed) {
        p0 = p1.c ? refl(p2, p1) : Q[(i - 1 + n) % n];
        p3 = p2.c ? refl(p1, p2) : Q[(i + 2) % n];
      } else {
        p0 = i === 0 || p1.c ? refl(p2, p1) : Q[i - 1];
        p3 = i + 2 >= n || p2.c ? refl(p1, p2) : Q[i + 2];
      }
      segs.push(crSegment(p0, p1, p2, p3, alpha, tension));
    }
    return new Curve(segs, closed);
  }

  /** Straight polyline as a Curve (for joins). */
  static line(a, b) {
    return new Curve([[a, [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3], [a[0] + (2 * (b[0] - a[0])) / 3, a[1] + (2 * (b[1] - a[1])) / 3], b]], false);
  }

  get start() { return this.segs[0][0]; }
  get end() { return this.segs[this.segs.length - 1][3]; }

  /** SVG path data. move:false omits the initial M (for joining curves into one path). */
  d({ move = true, close = false } = {}) {
    let s = move ? `M${f(this.segs[0][0][0])} ${f(this.segs[0][0][1])}` : '';
    for (const g of this.segs) s += `C${f(g[1][0])} ${f(g[1][1])} ${f(g[2][0])} ${f(g[2][1])} ${f(g[3][0])} ${f(g[3][1])}`;
    if (close || this.closed) s += 'Z';
    return s;
  }

  reversed() {
    return new Curve(this.segs.slice().reverse().map((g) => [g[3], g[2], g[1], g[0]]), this.closed);
  }

  _table() {
    if (this._tab) return this._tab;
    const pts = [], cum = [0];
    const N = 14;
    let acc = 0, prev = null;
    for (let i = 0; i < this.segs.length; i++) {
      for (let j = i === 0 ? 0 : 1; j <= N; j++) {
        const p = bez(this.segs[i], j / N);
        if (prev) acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
        pts.push(p); cum.push(acc); prev = p;
      }
    }
    cum.shift();
    this._tab = { pts, cum, len: acc };
    return this._tab;
  }

  get length() { return this._table().len; }

  /** point at arc-length fraction u in [0,1] */
  at(u) {
    const { pts, cum, len } = this._table();
    const target = clamp(u, 0, 1) * len;
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < target) lo = mid + 1; else hi = mid; }
    const i = Math.max(1, lo);
    const a = pts[i - 1], b = pts[i];
    const span = cum[i] - cum[i - 1] || 1;
    const t = (target - cum[i - 1]) / span;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }

  /** unit tangent at u */
  tangent(u) {
    const e = 0.004;
    const a = this.at(clamp(u - e, 0, 1)), b = this.at(clamp(u + e, 0, 1));
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  }
  /** unit normal (rotate tangent +90deg: in y-down space this points to the viewer's right of travel) */
  normal(u) { const t = this.tangent(u); return [-t[1], t[0]]; }

  /** n+1 equally spaced points */
  sample(n) { const out = []; for (let i = 0; i <= n; i++) out.push(this.at(i / n)); return out; }

  /** sub-curve between arc fractions, resampled smoothly */
  sub(u0, u1, n = 12) {
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(this.at(lerp(u0, u1, i / n)));
    return Curve.through(pts);
  }

  bounds() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of this._table().pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    return { x0, y0, x1, y1 };
  }
}

function bez(g, t) {
  const mt = 1 - t, a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t;
  return [a * g[0][0] + b * g[1][0] + c * g[2][0] + d * g[3][0], a * g[0][1] + b * g[1][1] + c * g[2][1] + d * g[3][1]];
}

/**
 * Build a closed, mirrored outline from a right-hand half.
 * `half` runs from the top-centre point down the right side to the bottom-centre point.
 * First/last points sit on the axis (x = cx) and are not duplicated.
 */
export function mirrorOutline(half, cx = 0) {
  const right = half.map((p) => [cx + p[0], p[1], p[2]]);
  const left = [];
  for (let i = half.length - 2; i >= 1; i--) left.push([cx - half[i][0], half[i][1], half[i][2]]);
  return Curve.through([...right, ...left], { closed: true });
}

/** Mirror a list of points about x=cx (returns new list, same order). */
export const mirrorPts = (pts, cx = 0) => pts.map((p) => [2 * cx - p[0], p[1], p[2]]);

/** Polygon (as a path string) of the band between offsets o0..o1 (cm, +ve = normal side) along a curve. */
export function bandPath(curve, o0, o1, { n = 40, u0 = 0, u1 = 1, w0, w1 } = {}) {
  const A = [], B = [];
  for (let i = 0; i <= n; i++) {
    const u = lerp(u0, u1, i / n), p = curve.at(u), nn = curve.normal(u);
    const k = i / n;
    const a = typeof o0 === 'function' ? o0(k) : o0, b = typeof o1 === 'function' ? o1(k) : o1;
    A.push([p[0] + nn[0] * a, p[1] + nn[1] * a]);
    B.push([p[0] + nn[0] * b, p[1] + nn[1] * b]);
  }
  return 'M' + A.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'L' + B.reverse().map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z';
}

/** Polyline path of an offset copy of a curve. */
export function offsetPath(curve, off, { n = 40, u0 = 0, u1 = 1 } = {}) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = lerp(u0, u1, i / n), p = curve.at(u), nn = curve.normal(u);
    const o = typeof off === 'function' ? off(i / n) : off;
    pts.push([p[0] + nn[0] * o, p[1] + nn[1] * o]);
  }
  return 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L');
}

/** Points along a curve with offset – for placing stitches/buttons etc. */
export function offsetPoints(curve, off, n, u0 = 0, u1 = 1) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const k = n > 0 ? i / n : 0.5; // n = 0 -> a single point at the middle of the range
    const u = lerp(u0, u1, k), p = curve.at(u), nn = curve.normal(u), t = curve.tangent(u);
    const o = typeof off === 'function' ? off(k) : off;
    pts.push({ x: p[0] + nn[0] * o, y: p[1] + nn[1] * o, tx: t[0], ty: t[1], nx: nn[0], ny: nn[1], u });
  }
  return pts;
}

/** Outline from a centreline + width profile (sleeves, straps, handles). Ends are flat (caller can round). */
export function tube(center, widthFn, { n = 36 } = {}) {
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, p = center.at(u), nn = center.normal(u);
    const w = (typeof widthFn === 'function' ? widthFn(u) : widthFn) / 2;
    L.push([p[0] - nn[0] * w, p[1] - nn[1] * w]);
    R.push([p[0] + nn[0] * w, p[1] + nn[1] * w]);
  }
  return { L, R };
}

export function polyD(pts, close = true) {
  return 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + (close ? 'Z' : '');
}

export function boundsOfPts(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  return { x0, y0, x1, y1 };
}
export function unionBounds(list) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const b of list) { if (!b) continue; x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1); }
  return { x0, y0, x1, y1 };
}

/** jitter points (hand-drawn irregularity) – rng must be a Rng */
export function jitterPts(pts, rng, amt) {
  return pts.map((p) => [p[0] + rng.range(-amt, amt), p[1] + rng.range(-amt, amt), p[2]]);
}

/** Ellipse as path (for when we need path data, not <ellipse>). */
export function ellipseD(cx, cy, rx, ry) {
  return `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;
}
