import type { IntentMode } from "@/stores/intent";

// Adaptive home composition — PRD §5.1 / §6.1: "System reorders home modules from intent signal
// (cold → curation; returning → rail; deal-intent → discount promoted). The sale banner is first in every mode.
export type HomeModuleId = "hero" | "pricestrip" | "coupons" | "categories" | "celebration" | "brands" | "diwali" | "newin" | "edits" | "trending" | "look" | "rail" | "stories" | "brand" | "offers" | "seo";

// Modules follow the live Nykaa Fashion homepage stack (sale banner → category tiles → Celebration-ready Categories → Iconic Brands →
// Build Diwali wardrobe → SEO copy) with the curated destinations (Luxe, Hidden Gems, Style Files) kept in view instead of behind "More".
export const HOME_MODULES: Array<{ id: HomeModuleId; name: string }> = [
  { id: "hero", name: "Sale banner" },
  { id: "pricestrip", name: "Price shortcuts" },
  { id: "categories", name: "Shop by category" },
  { id: "coupons", name: "Offers for you" },
  { id: "celebration", name: "Celebration-ready categories" },
  { id: "brands", name: "Iconic brands" },
  { id: "diwali", name: "Build Diwali wardrobe" },
  { id: "newin", name: "New arrivals" },
  { id: "edits", name: "Luxe, Hidden Gems & more" },
  { id: "trending", name: "Most wanted" },
  { id: "look", name: "Shop the look" },
  { id: "rail", name: "Picked for you" },
  { id: "stories", name: "Style Files" },
  { id: "brand", name: "House of Nykaa spotlight" },
  { id: "offers", name: "Offer band" },
  { id: "seo", name: "More about Nykaa Fashion" },
];

export interface HomeSlot {
  id: HomeModuleId;
  /** deal module shown at full prominence */
  promoted?: boolean;
}

export function composeHome(mode: IntentMode): HomeSlot[] {
  const ids = (list: HomeModuleId[]): HomeSlot[] => list.map((id) => ({ id }));
  switch (mode) {
    case "returning":
      return ids(["hero", "rail", "categories", "pricestrip", "coupons", "celebration", "brands", "newin", "diwali", "edits", "trending", "look", "brand", "stories", "seo"]);
    case "deal":
      // The banner always leads the page — it is the home page's signature and already a discount surface. Deal intent promotes the offer band to the slot right under it.
      return [{ id: "hero" }, { id: "offers", promoted: true }, ...ids(["rail", "categories", "coupons", "celebration", "brands", "diwali", "newin", "edits", "trending", "look", "stories", "brand", "seo"])];
    default:
      return ids(["hero", "pricestrip", "categories", "coupons", "celebration", "brands", "diwali", "newin", "edits", "trending", "look", "stories", "brand", "seo"]);
  }
}

export const MODE_COPY: Record<IntentMode, { name: string; blurb: string }> = {
  cold: { name: "Cold start", blurb: "No history yet — the sale banner, price shortcuts and category tiles lead." },
  returning: { name: "Returning", blurb: "Signals found — a “picked for you” rail rises to second place." },
  deal: { name: "Deal intent", blurb: "Offer interaction detected — the offer band rises to second place, right under the banner, for this session." },
};
