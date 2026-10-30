// Procedural drape: a height field h(u,v) in cm built from ridge segments, panel domes and wrinkle noise.
// The shader differentiates it, so folds shade like real cloth (lit left flank, shaded right flank).
import { clamp, smoothstep } from './geometry.mjs';
import { fbm } from './noise.mjs';

export class FoldField {
  constructor(seed = 1) {
    this.seed = seed;
    this.ridges = [];
    this.domes = [];
    this.noises = [];
    this.bands = [];
    this.blobs = [];
    this.curves = [];
  }

  /** A fold line from a to b (cm) with optional bow, width/amplitude varying along its length. */
  ridge(o) {
    const [ax, ay] = o.a, [bx, by] = o.b;
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    this.ridges.push({
      ax, ay, ex: dx / len, ey: dy / len, nx: -dy / len, ny: dx / len, len,
      bow: o.bow ?? 0, s0: o.s0 ?? 1, s1: o.s1 ?? o.s0 ?? 1, a0: o.a0 ?? 0.3, a1: o.a1 ?? o.a0 ?? 0.3,
      fade0: o.fade0 ?? o.fade ?? 0.25, fade1: o.fade1 ?? o.fade ?? 0.25, p: o.p ?? 2,
      wob: o.wob ?? 0, wobF: o.wobF ?? 2.3, ph: o.ph ?? 0,
    });
    return this;
  }

  /** Panel dome: amp*(1-(du/hw)^2)^pow, faded in/out over v0..v1. hw is a number or fn(v). */
  dome(o) {
    this.domes.push({ cu: o.cu ?? 0, hw: o.hw, v0: o.v0, v1: o.v1, amp: o.amp, pow: o.pow ?? 1.2, in: o.in ?? 4, out: o.out ?? 6 });
    return this;
  }

  /** anisotropic wrinkle noise (fu,fv = cycles per cm) */
  noise(o) {
    this.noises.push({ amp: o.amp, fu: o.fu, fv: o.fv, oct: o.oct ?? 3, seed: o.seed ?? this.seed, v0: o.v0 ?? -1e9, v1: o.v1 ?? 1e9, soft: o.soft ?? 3 });
    return this;
  }

  /** soft horizontal crease/band (e.g. waist pull) centred at v */
  band(o) { this.bands.push({ v: o.v, w: o.w ?? 1.5, amp: o.amp ?? 0.2, u0: o.u0 ?? -1e9, u1: o.u1 ?? 1e9 }); return this; }

  /**
   * Ridge/dome following a Curve. off(u) lateral offset (cm), s(u) width (cm), a(u) amplitude (cm).
   * type 'gauss' = fold, 'dome' = rounded tube (profile (1-q^2)^pow with s = half-width).
   */
  curveRidge(o) {
    const N = o.n ?? 48, curve = o.curve, u0 = o.u0 ?? 0, u1 = o.u1 ?? 1;
    const px = new Float32Array(N + 1), py = new Float32Array(N + 1), nx = new Float32Array(N + 1), ny = new Float32Array(N + 1);
    const sw = new Float32Array(N + 1), am = new Float32Array(N + 1), fd = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) {
      const u = u0 + ((u1 - u0) * i) / N, p = curve.at(u), n = curve.normal(u), off = typeof o.off === 'function' ? o.off(u) : (o.off ?? 0);
      px[i] = p[0] + n[0] * off; py[i] = p[1] + n[1] * off; nx[i] = n[0]; ny[i] = n[1];
      sw[i] = typeof o.s === 'function' ? o.s(u) : o.s; am[i] = typeof o.a === 'function' ? o.a(u) : o.a;
      const t = i / N;
      fd[i] = smoothstep(0, o.fade0 ?? 0.12, t) * (1 - smoothstep(1 - (o.fade1 ?? 0.12), 1, t));
    }
    this.curves.push({ N, px, py, nx, ny, sw, am, fd, type: o.type || 'gauss', pow: o.pow ?? 1.1 });
    return this;
  }

  /** elliptical Gaussian bump (bust, knee, puffed sleeve cap…) */
  blob(o) { this.blobs.push({ u: o.u, v: o.v, ru: o.ru, rv: o.rv ?? o.ru, amp: o.amp }); return this; }

  h(u, v) {
    let H = 0;
    for (let i = 0; i < this.blobs.length; i++) {
      const b = this.blobs[i];
      const du = (u - b.u) / b.ru, dv = (v - b.v) / b.rv, q = du * du + dv * dv;
      if (q < 9) H += b.amp * Math.exp(-q);
    }
    for (let i = 0; i < this.ridges.length; i++) {
      const r = this.ridges[i];
      const dx = u - r.ax, dy = v - r.ay;
      const t = (dx * r.ex + dy * r.ey) / r.len;
      if (t < -0.15 || t > 1.15) continue;
      const tc = t < 0 ? 0 : t > 1 ? 1 : t;
      let d = dx * r.nx + dy * r.ny - r.bow * 4 * tc * (1 - tc);
      if (r.wob) d -= r.wob * Math.sin(r.wobF * tc * 6.283 + r.ph);
      const s = r.s0 + (r.s1 - r.s0) * tc;
      const q = Math.abs(d) / s;
      if (q > 3.2) continue;
      const amp = r.a0 + (r.a1 - r.a0) * tc;
      const fd = smoothstep(-0.05, r.fade0, t) * (1 - smoothstep(1 - r.fade1, 1.05, t));
      H += amp * fd * (r.p === 2 ? Math.exp(-q * q) : Math.exp(-Math.pow(q, r.p)));
    }
    for (let i = 0; i < this.curves.length; i++) {
      const c = this.curves[i];
      // closest point on the polyline (projection per segment) -> smooth interpolated normal / width / amplitude
      let best = 1e9, bj = 0, bt = 0;
      for (let j = 0; j < c.N; j++) {
        const ex = c.px[j + 1] - c.px[j], ey = c.py[j + 1] - c.py[j];
        const l2 = ex * ex + ey * ey || 1e-9;
        let t = ((u - c.px[j]) * ex + (v - c.py[j]) * ey) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const dx = u - (c.px[j] + ex * t), dy = v - (c.py[j] + ey * t), d2 = dx * dx + dy * dy;
        if (d2 < best) { best = d2; bj = j; bt = t; }
      }
      const j0 = bj, j1 = bj + 1;
      // signed distance to the polyline (sign from the closest segment's normal) – C1-smooth, no normal-interpolation kinks
      const ex = c.px[j1] - c.px[j0], ey = c.py[j1] - c.py[j0];
      const cx = c.px[j0] + ex * bt, cy = c.py[j0] + ey * bt;
      const sg = ((u - cx) * -ey + (v - cy) * ex) >= 0 ? 1 : -1;
      const d = sg * Math.sqrt(best);
      const sw = c.sw[j0] + (c.sw[j1] - c.sw[j0]) * bt, am = c.am[j0] + (c.am[j1] - c.am[j0]) * bt, fd = c.fd[j0] + (c.fd[j1] - c.fd[j0]) * bt;
      const q = d / sw;
      if (c.type === 'dome') { if (q > -1 && q < 1) H += am * fd * Math.pow(1 - q * q, c.pow); }
      else if (q > -3.2 && q < 3.2) H += am * fd * Math.exp(-q * q);
    }
    for (let i = 0; i < this.domes.length; i++) {
      const d = this.domes[i];
      const hw = typeof d.hw === 'function' ? d.hw(v) : d.hw;
      if (!(hw > 0.1)) continue;
      const du = (u - d.cu) / hw;
      if (du <= -1 || du >= 1) continue;
      const ramp = smoothstep(d.v0, d.v0 + d.in, v) * (1 - smoothstep(d.v1 - d.out, d.v1, v));
      H += d.amp * ramp * Math.pow(1 - du * du, d.pow);
    }
    for (let i = 0; i < this.noises.length; i++) {
      const n = this.noises[i];
      const m = smoothstep(n.v0, n.v0 + n.soft, v) * (1 - smoothstep(n.v1 - n.soft, n.v1, v));
      if (m <= 0) continue;
      H += n.amp * m * (fbm(u * n.fu, v * n.fv, n.oct, n.seed) - 0.5) * 2;
    }
    for (let i = 0; i < this.bands.length; i++) {
      const b = this.bands[i];
      if (u < b.u0 || u > b.u1) continue;
      const q = (v - b.v) / b.w;
      if (q > 3 || q < -3) continue;
      H += b.amp * Math.exp(-q * q);
    }
    return H;
  }
}
