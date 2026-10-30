import type { IntentMode } from "@/stores/intent";

// Adaptive home composition — PRD §5.1 / §6.1: "System reorders home modules from intent signal
// (cold → curation; returning → rail; deal-intent → discount promoted)".
export type HomeModuleId = "hero" | "categories" | "newin" | "edits" | "trending" | "rail" | "occasion" | "stories" | "brand" | "offers";

export const HOME_MODULES: Array<{ id: HomeModuleId; name: string }> = [
  { id: "hero", name: "Editorial hero" },
  { id: "categories", name: "Shop by category" },
  { id: "newin", name: "New in by taste" },
  { id: "edits", name: "Featured edits" },
  { id: "trending", name: "Most wanted" },
  { id: "rail", name: "Picked for you" },
  { id: "occasion", name: "Festive edit" },
  { id: "stories", name: "Style Files" },
  { id: "brand", name: "Label spotlight" },
  { id: "offers", name: "Offer edit" },
];

export interface HomeSlot {
  id: HomeModuleId;
  /** deal module shown at full prominence */
  promoted?: boolean;
}

export function composeHome(mode: IntentMode): HomeSlot[] {
  switch (mode) {
    case "returning":
      return [{ id: "hero" }, { id: "rail" }, { id: "newin" }, { id: "edits" }, { id: "categories" }, { id: "trending" }, { id: "occasion" }, { id: "brand" }, { id: "stories" }, { id: "offers" }];
    case "deal":
      return [{ id: "offers", promoted: true }, { id: "hero" }, { id: "rail" }, { id: "categories" }, { id: "newin" }, { id: "edits" }, { id: "trending" }, { id: "occasion" }, { id: "stories" }, { id: "brand" }];
    default:
      // Cold start: curation first, discount demoted to one quiet module (assumption in PRD §9.5).
      return [{ id: "hero" }, { id: "categories" }, { id: "newin" }, { id: "edits" }, { id: "trending" }, { id: "occasion" }, { id: "stories" }, { id: "brand" }, { id: "offers" }];
  }
}

export const MODE_COPY: Record<IntentMode, { name: string; blurb: string }> = {
  cold: { name: "Cold start", blurb: "No history yet — curation leads, the offer edit is one quiet module." },
  returning: { name: "Returning", blurb: "Signals found — a “picked for you” rail rises to second place." },
  deal: { name: "Deal intent", blurb: "Offer interaction detected — the offer edit rises to the top for this session." },
};
