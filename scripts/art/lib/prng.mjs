// Seeded, deterministic random utilities. Never use Math.random in the art engine.

/** FNV-1a 32-bit string hash. */
export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Mix two 32-bit ints into one (avalanching). */
export function mix32(a, b) {
  let h = (a ^ Math.imul(b, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function mulberry32(a) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  constructor(seed = 1) {
    this.seed = seed >>> 0;
    this._f = mulberry32(this.seed);
  }
  next() { return this._f(); }
  range(a, b) { return a + (b - a) * this._f(); }
  int(a, b) { return Math.floor(a + (b - a + 1) * this._f()); }
  pick(arr) { return arr[Math.floor(this._f() * arr.length)]; }
  chance(p) { return this._f() < p; }
  sign() { return this._f() < 0.5 ? -1 : 1; }
  /** approx N(0,1) (sum of uniforms – cheap & bounded) */
  gauss() { return (this._f() + this._f() + this._f() + this._f() - 2) * 1.7320508; }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this._f() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /** Independent child stream so adding features never shifts other random draws. */
  fork(label) { return new Rng(mix32(this.seed, hashStr(String(label)))); }
}
