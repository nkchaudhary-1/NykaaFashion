// WCAG contrast check for design-token text/background pairs, read straight from src/app/globals.css so it cannot go stale.
//   node scripts/contrast.mjs        (exit code 1 if any pair is below 4.5:1)
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const T = Object.fromEntries([...css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2].toLowerCase()]));

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground, background] — every combination the UI actually draws as text. `brand` (the logo magenta) is artwork, not text, so it is not listed.
const pairs = [
  ["ink", "bone"], ["ink-2", "bone"], ["ink-3", "bone"], ["pink", "bone"], ["emerald", "bone"], ["blue", "bone"], ["danger", "bone"], ["amber", "bone"], ["white", "luxe"], ["bone", "luxe"], ["bone", "ink"],
  ["ink", "white"], ["ink", "paper"], ["ink", "sand"], ["ink-2", "white"], ["ink-2", "sand"], ["ink-3", "white"], ["ink-3", "paper"], ["ink-3", "sand"],
  ["white", "navy"], ["white", "ink"], ["white", "maroon"], ["white", "luxe"], ["gold", "luxe"],
  ["pink", "white"], ["pink", "paper"], ["pink", "sand"], ["pink", "pink-tint"], ["white", "pink"], ["pink-ink", "white"], ["pink-ink", "pink-tint"], ["white", "pink-ink"],
  ["emerald", "white"], ["emerald", "paper"], ["emerald", "sand"], ["emerald", "emerald-tint"],
  ["blue", "white"], ["blue", "sand"], ["blue", "blue-tint"],
  ["amber", "amber-tint"], ["amber", "white"], ["danger", "white"], ["danger", "danger-tint"],
  ["gem", "white"], ["gem", "gem-tint"], ["white", "gem"], ["gold-ink", "gold-tint"], ["gold-ink", "white"],
  ["resp", "white"], ["resp", "resp-tint"], ["white", "resp"], ["festive", "white"], ["white", "festive"], ["festive", "festive-tint"],
];

let bad = 0;
for (const [f, b] of pairs) {
  if (!T[f] || !T[b]) { console.log(`SKIP  token missing: ${!T[f] ? f : b}`); continue; }
  const r = ratio(T[f], T[b]);
  const ok = r >= 4.5;
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}  ${f} ${T[f]} on ${b} ${T[b]}`);
}
console.log(bad ? `\n${bad} pair(s) below 4.5:1` : "\nAll pairs ≥ 4.5:1");
process.exit(bad ? 1 : 0);
