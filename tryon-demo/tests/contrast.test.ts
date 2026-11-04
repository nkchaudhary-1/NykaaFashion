// WCAG AA, computed from the REAL tokens in globals.css (not a copy), so a palette edit can't silently regress.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const token = (name: string): string => {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `token --color-${name} not found in globals.css`);
  return m[1];
};

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground, background, minimum ratio, where it is used]
const TEXT: Array<[string, string, string]> = [
  ["ink", "paper", "headline / body on the page"],
  ["ink", "card", "headings on the panel and cards"],
  ["ink-2", "paper", "secondary copy on the page"],
  ["ink-2", "card", "secondary copy on the panel"],
  ["ink-3", "paper", "footer labels, tertiary copy"],
  ["ink-3", "card", "consent note, error detail"],
  ["ink", "tint", "text over tinted image wells"],
  ["paper", "ink", "primary button label; selected pill"],
  ["on-stage", "stage", "text on the dark live panel"],
  ["on-stage-2", "stage", "secondary text on the dark live panel"],
  ["ink", "on-stage", "stage button label"],
  ["on-sim", "sim", "Simulation badge"],
];
const NON_TEXT: Array<[string, string, string]> = [
  ["focus", "paper", "focus ring on the page"],
  ["focus", "card", "focus ring on the panel"],
  ["focus-stage", "stage", "focus ring on the dark stage"],
  ["signal", "stage", "camera-on dot (also labelled in words)"],
  ["ink", "card", "selected card outline"],
];

describe("WCAG AA contrast of the design tokens", () => {
  for (const [fg, bg, use] of TEXT) {
    it(`text: ${fg} on ${bg} >= 4.5:1 — ${use}`, () => {
      const r = ratio(token(fg), token(bg));
      assert.ok(r >= 4.5, `${fg} on ${bg} is ${r.toFixed(2)}:1`);
    });
  }
  for (const [fg, bg, use] of NON_TEXT) {
    it(`non-text: ${fg} on ${bg} >= 3:1 — ${use}`, () => {
      const r = ratio(token(fg), token(bg));
      assert.ok(r >= 3, `${fg} on ${bg} is ${r.toFixed(2)}:1`);
    });
  }
});
