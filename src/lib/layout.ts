import { IS_STAGING } from "@/lib/channel";
import { usePrefs } from "@/stores/ui";

/**
 * The home page comes in two layouts, switchable at any time (the staging bar, the Prototype panel, or `?layout=bleed` / `?layout=classic` on the address):
 *  • classic — the page as approved: sections on the page grid with margins and gutters, text under every picture.
 *  • bleed   — the full-bleed experiment (docs/BLEED_LAYOUT.md): pictures run edge to edge with no gutter and no margin, tiles touch, text sits on flat label strips.
 * Only the home page changes; every other route is the same in both.
 */
export type HomeLayout = "classic" | "bleed";

export const HOME_LAYOUTS: Array<{ id: HomeLayout; name: string; blurb: string }> = [
  { id: "classic", name: "Classic", blurb: "Sections on the page grid, with margins and gutters; text sits under each picture." },
  { id: "bleed", name: "Full-bleed", blurb: "Pictures run edge to edge with no gutter or margin between them; text sits on flat label strips." },
];

/** What a visitor who never chose gets: the approved layout on the live prototype, the experiment on the review site. */
export const DEFAULT_LAYOUT: HomeLayout = IS_STAGING ? "bleed" : "classic";

export const isHomeLayout = (v: unknown): v is HomeLayout => v === "classic" || v === "bleed";

/** The layout in force. Server render and hydration use the build's default; the visitor's stored choice (if any) applies from the first client render. */
export function useHomeLayout(): HomeLayout {
  const { homeLayout } = usePrefs();
  return isHomeLayout(homeLayout) ? homeLayout : DEFAULT_LAYOUT;
}
