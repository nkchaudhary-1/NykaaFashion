import type { Edit } from "@/data/types";

/**
 * An edit's identity as a flat surface — token classes only, so the destinations follow the palette in globals.css.
 * House of Nykaa and the computed edits sit on the soft grey surface; the others take their identity colour with white text.
 */
const SURFACE: Record<Edit["theme"], { cls: string; dark: boolean }> = {
  gem: { cls: "bg-gem text-white", dark: true },
  luxe: { cls: "bg-luxe text-white", dark: true },
  resp: { cls: "bg-resp text-white", dark: true },
  festive: { cls: "bg-festive text-white", dark: true },
  hon: { cls: "bg-sand text-ink", dark: false },
  ink: { cls: "bg-navy text-white", dark: true },
  sand: { cls: "bg-sand text-ink", dark: false },
};

export const themeSurface = (theme: Edit["theme"]) => SURFACE[theme];
