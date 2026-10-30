// WCAG contrast check for design-token text/background pairs. Usage: node scripts/contrast.mjs
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const T = { bone: '#f5f1ea', paper: '#fbf9f5', white: '#ffffff', sand: '#ebe4d9', ink: '#16120f', ink2: '#4a433c', ink3: '#675e54', pink: '#e80071', pinkInk: '#ac0057', pinkTint: '#fbe6ef', emerald: '#0b6a4b', emeraldTint: '#e0efe7', amber: '#7d4f08', amberTint: '#f6e9cc', danger: '#b0221a', dangerTint: '#fcebe9', gem: '#a2432a', gemTint: '#f2dfd4', goldInk: '#7a5c24', goldTint: '#efe5d0', gold: '#b69255', luxe: '#1c1814', resp: '#4d6646', respTint: '#e1e9db', festive: '#7a1936', festiveTint: '#f4dedb', marigold: '#e3a31a' };
const pairs = [
  ['ink', 'bone'], ['ink2', 'bone'], ['ink3', 'bone'], ['ink3', 'paper'], ['ink3', 'white'], ['ink3', 'sand'],
  ['pinkInk', 'bone'], ['pinkInk', 'white'], ['pinkInk', 'pinkTint'], ['white', 'pink'], ['white', 'pinkInk'], ['ink', 'pink'],
  ['emerald', 'bone'], ['emerald', 'white'], ['emerald', 'emeraldTint'], ['amber', 'amberTint'], ['amber', 'bone'],
  ['danger', 'bone'], ['danger', 'white'], ['danger', 'dangerTint'], ['gem', 'bone'], ['gem', 'gemTint'], ['white', 'gem'],
  ['goldInk', 'goldTint'], ['goldInk', 'bone'], ['gold', 'luxe'], ['white', 'luxe'], ['resp', 'bone'], ['resp', 'respTint'], ['white', 'resp'],
  ['festive', 'bone'], ['white', 'festive'], ['marigold', 'festive'], ['festive', 'festiveTint'], ['bone', 'ink'], ['white', 'ink'],
];
let bad = 0;
for (const [f, b] of pairs) {
  const r = ratio(T[f], T[b]);
  const ok = r >= 4.5; if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}  ${f} on ${b}`);
}
console.log(bad ? `\n${bad} pair(s) below 4.5:1` : '\nAll pairs ≥ 4.5:1');
