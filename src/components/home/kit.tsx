"use client";
import { useMemo, useSyncExternalStore } from "react";
import type { Product } from "@/data/types";
import { imgEdge } from "@/lib/img";

/** Small helpers the home modules share: wording, data picks, and an SSR-safe media-query hook. */

export const styles = (n: number) => `${n} ${n === 1 ? "style" : "styles"}`;
export const pieces = (n: number) => `${n} ${n === 1 ? "piece" : "pieces"}`;
export const pad2 = (n: number) => String(n).padStart(2, "0");

export const inStock = (list: Product[]) => list.filter((p) => !p.soldOut);
/** The first picture of a product — the stand-in for a category / brand / edit when it has no picture of its own. */
export const heroImg = (p: Product | undefined) => p?.variants[0].images[0] ?? "scenes/cat-women";
export const maxOff = (list: Product[]) => list.reduce((m, p) => Math.max(m, p.discount), 0);

/** Relative luminance of a #rrggbb colour (0 = black, 1 = white). */
export const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** The calm wall colour of a wide scene (what a flat panel next to it should match). */
export const wallOf = (key: string, fallback = "#c5ac97") => imgEdge(key)?.wall[0] ?? fallback;

export const FINE_POINTER = "(hover: hover) and (pointer: fine)";
export const WIDE_SCREEN = "(min-width: 1024px)";
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const queries = new Map<string, MediaQueryList>();
const mql = (query: string) => {
  let m = queries.get(query);
  if (!m) queries.set(query, (m = window.matchMedia(query)));
  return m;
};

/** A media query as state. False on the server and for the hydration pass, then the live value (no mismatch, no flash of the wrong layout in markup that is CSS-driven). */
export function useMedia(query: string): boolean {
  const subscribe = useMemo(
    () => (notify: () => void) => {
      const m = mql(query);
      m.addEventListener("change", notify);
      return () => m.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => mql(query).matches,
    () => false,
  );
}
