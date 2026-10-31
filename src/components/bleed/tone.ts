import type { Label } from "@/data/types";

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * A label's own colours for a flat tile, kept legible: where its brand pair is below 4.5:1 (large display type needs 3:1, but small lines on the same tile need 4.5:1)
 * the tile takes the neutral ink-on-bone pair instead — the same rule the monograms follow (app/brands/_components/labelTone.ts).
 */
export function legibleTone(label: Label): { bg: string; fg: string } {
  return contrast(label.tone.bg, label.tone.fg) >= 4.5 ? label.tone : { bg: "var(--color-ink)", fg: "var(--color-bone)" };
}
