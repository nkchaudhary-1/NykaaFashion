import type { ReactNode } from "react";

/** "Occasionwear, *redrawn.*" → ["Occasionwear, ", <em>redrawn.</em>] — the starred word is the accent (the display-* utilities colour <em>; `.on-dark` neutralises it). */
export function headlineNodes(headline: string): ReactNode[] {
  return headline
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, i) => (part.length > 2 && part.startsWith("*") && part.endsWith("*") ? <em key={i}>{part.slice(1, -1)}</em> : part));
}
