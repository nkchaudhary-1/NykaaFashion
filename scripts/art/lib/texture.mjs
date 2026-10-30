// Procedural micro-textures, evaluated per pixel in *cm space* so they scale with the camera.
// Each factory returns fn(u, v) -> value roughly in [-1, 1].  `k` = px per cm (to keep the weave above Nyquist).
import { hash2, vnoise, fbm } from './noise.mjs';

const TAU = Math.PI * 2;

export function makeTexture(type, { seed = 1, k = 9 } = {}) {
  const minPitch = 1.7 / k; // never finer than ~1.7px
  switch (type) {
    case 'weave': { // plain weave: cotton, poplin
      const p = Math.max(0.05, minPitch);
      return (u, v) => {
        const a = u / p, b = v / p, ia = Math.floor(a), ib = Math.floor(b);
        const fa = a - ia, fb = b - ib;
        const warp = hash2(ia, 0, seed) - 0.5, weft = hash2(0, ib, seed + 3) - 0.5;
        const over = (ia + ib) & 1;
        const bump = over ? Math.sin(Math.PI * fa) : Math.sin(Math.PI * fb);
        return (warp + weft) * 0.28 + (over ? 0.5 : -0.5) * bump * 0.45 + (hash2(ia, ib, seed + 9) - 0.5) * 1.1 + (vnoise(u * 0.7, v * 0.7, seed) - 0.5) * 0.5;
      };
    }
    case 'slub': { // linen: uneven yarns
      const p = Math.max(0.07, minPitch);
      return (u, v) => {
        const a = u / p, b = v / p, ia = Math.floor(a), ib = Math.floor(b);
        const warp = vnoise(b * 0.07, ia * 5.3, seed) - 0.5;
        const weft = vnoise(a * 0.07, ib * 5.3, seed + 5) - 0.5;
        const thin = (hash2(ia, ib, seed + 2) - 0.5) * 0.55;
        const gate = (((ia + ib) & 1) ? 0.3 : -0.3);
        return warp * 2.0 + weft * 2.0 + thin + gate * 0.4;
      };
    }
    case 'fine': { // silk / satin: very fine long streaks
      const p = Math.max(0.03, minPitch);
      return (u, v) => {
        const ia = Math.floor(u / p);
        return (hash2(ia, 0, seed) - 0.5) * 1.2 + (vnoise(u * 3.0, v * 0.35, seed) - 0.5) * 0.7;
      };
    }
    case 'twill': { // denim: diagonal rib
      const p = Math.max(0.1, minPitch * 1.2);
      return (u, v) => {
        const a = u / p, b = v / p;
        const rib = Math.sin(TAU * (a - b) / 3.4);
        const ia = Math.floor(a), ib = Math.floor(b);
        const fleck = hash2(ia, ib, seed) > 0.93 ? 1 : 0;
        return rib * 0.55 + (hash2(ia, ib, seed + 1) - 0.5) * 0.7 + (vnoise(u * 2.2, v * 0.7, seed) - 0.5) * 0.5 + fleck * 0.7;
      };
    }
    case 'knit': { // jersey / rib knit
      const pw = Math.max(0.24, minPitch * 2.2), ph = pw * 0.8;
      return (u, v) => {
        const a = u / pw, b = v / ph;
        const ia = Math.floor(a), fa = a - ia, ib = Math.floor(b), fb = b - ib;
        const vleg = Math.abs(fa - 0.5 - (fb - 0.5) * 0.0) * 2; // 0 centre .. 1 edge
        const chev = Math.sin(Math.PI * Math.min(1, (fb + 0.35 * Math.abs(fa - 0.5) * 2) % 1));
        return (Math.cos(TAU * a) * 0.55 + chev * 0.55 - 0.3) + (hash2(ia, ib, seed) - 0.5) * 0.45 - vleg * 0.1;
      };
    }
    case 'rib': { // vertical ribs
      const pw = Math.max(0.26, minPitch * 2.4);
      return (u, v) => Math.cos(TAU * u / pw) * 0.8 + (vnoise(u * 5, v * 1.5, seed) - 0.5) * 0.5;
    }
    case 'pebble': { // leather grain – worley F1
      const cell = Math.max(0.075, minPitch * 1.8);
      return (u, v) => {
        const a = u / cell, b = v / cell, ia = Math.floor(a), ib = Math.floor(b);
        let d1 = 9;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
          const cx = ia + i + hash2(ia + i, ib + j, seed) , cy = ib + j + hash2(ia + i, ib + j, seed + 7);
          const dd = (a - cx) * (a - cx) + (b - cy) * (b - cy);
          if (dd < d1) d1 = dd;
        }
        return 1 - Math.min(1, Math.sqrt(d1)) * 1.9 + (vnoise(u * 1.5, v * 1.5, seed) - 0.5) * 0.3;
      };
    }
    case 'pile': { // velvet
      const p = Math.max(0.09, minPitch);
      return (u, v) => (hash2(Math.floor(u / p), Math.floor(v / p), seed) - 0.5) * 1.1 + (fbm(u * 1.2, v * 1.2, 2, seed) - 0.5) * 1.0;
    }
    case 'wool': {
      const p = Math.max(0.09, minPitch);
      return (u, v) => (fbm(u * 5, v * 5, 3, seed) - 0.5) * 1.8 + (hash2(Math.floor(u / p), Math.floor(v / p), seed) - 0.5) * 0.9;
    }
    case 'wood': { // grain running along v
      return (u, v) => {
        const w = fbm(u * 0.9, v * 0.12, 3, seed) * 6;
        const g = Math.sin(TAU * (u * 2.4 + w));
        return g * 0.5 + (vnoise(u * 20, v * 1.2, seed) - 0.5) * 0.7;
      };
    }
    case 'grit': { // terracotta / paper
      const p = Math.max(0.06, minPitch * 0.9);
      return (u, v) => (hash2(Math.floor(u / p), Math.floor(v / p), seed) - 0.5) * 1.3 + (fbm(u * 0.9, v * 0.9, 4, seed) - 0.5) * 1.4;
    }
    case 'none':
    default:
      return null;
  }
}
