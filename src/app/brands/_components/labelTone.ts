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
 * A label's monogram colours, kept legible: two labels' brand tones fall below 4.5:1 for their letters, so those draw the
 * monogram in the neutral token pair (navy on white-on-navy) instead. Returns a label ready for <LabelMonogram>.
 */
export function legible(label: Label): Label {
  return contrast(label.tone.bg, label.tone.fg) >= 4.5 ? label : { ...label, tone: { bg: "var(--color-ink)", fg: "var(--color-white)" } };
}
