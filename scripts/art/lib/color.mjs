// Colour helpers. Colours travel as '#rrggbb' strings or [r,g,b] (0-255).

export function parse(c) {
  if (Array.isArray(c)) return c;
  let s = String(c).trim().replace('#', '');
  if (s.length === 3) s = s.split('').map((x) => x + x).join('');
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const h2 = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
export function hex(rgb) { return '#' + h2(rgb[0]) + h2(rgb[1]) + h2(rgb[2]); }
/** 0..1 floats */
export function rgb01(c) { const p = parse(c); return [p[0] / 255, p[1] / 255, p[2] / 255]; }
export function mix(a, b, t) {
  const A = parse(a), B = parse(b);
  return hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
export const lighten = (c, t) => mix(c, '#ffffff', t);
export const darken = (c, t) => mix(c, '#140e0a', t);
export function luma(c) { const [r, g, b] = rgb01(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }

export function toHsl(c) {
  const [r, g, b] = rgb01(c);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
export function fromHsl(h, s, l) {
  h = ((h % 1) + 1) % 1; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const f = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) return hex([l * 255, l * 255, l * 255]);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return hex([f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255]);
}
/** adjust in HSL: dh (turns), ds (mult), dl (add) */
export function adjust(c, { dh = 0, ds = 1, dl = 0 } = {}) {
  const [h, s, l] = toHsl(c);
  return fromHsl(h + dh, s * ds, l + dl);
}
/** deeper, richer version of a colour – what a shadow looks like on that cloth */
export function shadowOf(c, amt = 0.5) {
  const [h, s, l] = toHsl(c);
  return fromHsl(h - 0.012 * amt, Math.min(1, s * (1 + 0.35 * amt) + 0.04 * amt), l * (1 - 0.58 * amt));
}
/** airier, less saturated version – what a highlight looks like */
export function highlightOf(c, amt = 0.5) {
  const [h, s, l] = toHsl(c);
  return fromHsl(h + 0.008 * amt, s * (1 - 0.25 * amt), l + (1 - l) * 0.55 * amt);
}
export function isDark(c) { return luma(c) < 0.34; }
export function withAlpha(c, a) { return { fill: c, 'fill-opacity': a }; }
