// Cheap deterministic lattice noise (no allocation, no Math.random).
/** integer lattice hash -> [0,1)  (single multiply-xorshift round: fast enough for per-pixel use) */
export function hash2(i, j, seed = 0) {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

const sm = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/** smooth value noise in [0,1) */
export function vnoise(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = sm(x - xi), yf = sm(y - yi);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

/** fractal noise, ~[0,1] centred at .5 */
export function fbm(x, y, oct = 3, seed = 0, lac = 2, gain = 0.5) {
  let amp = 1, sum = 0, norm = 0, fx = x, fy = y;
  for (let o = 0; o < oct; o++) {
    sum += amp * vnoise(fx, fy, seed + o * 101);
    norm += amp;
    amp *= gain; fx *= lac; fy *= lac;
  }
  return sum / norm;
}

/** 1-D smooth noise in [0,1) */
export function noise1(x, seed = 0) { return vnoise(x, seed * 0.37 + 0.5, seed); }
