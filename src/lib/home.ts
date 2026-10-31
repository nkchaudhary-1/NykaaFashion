import type { HomeLayout } from "@/lib/layout";
import type { IntentMode } from "@/stores/intent";

// Adaptive home composition — PRD §5.1 / §6.1: "System reorders home modules from intent signal
// (cold → curation; returning → rail; deal-intent → discount promoted). The sale banner is first and the category tiles second in every mode.
export type HomeModuleId = "hero" | "intro" | "pricestrip" | "coupons" | "categories" | "celebration" | "brands" | "diwali" | "newin" | "edits" | "trending" | "look" | "rail" | "stories" | "brand" | "offers" | "trail" | "feed" | "seo";

// Modules follow the live Nykaa Fashion homepage stack (sale banner → category tiles → Celebration-ready Categories → Iconic Brands →
// Build Diwali wardrobe → SEO copy) with the curated destinations (Luxe, Hidden Gems, Style Files) kept in view instead of behind "More".
export const HOME_MODULES: Array<{ id: HomeModuleId; name: string }> = [
  { id: "hero", name: "Sale banner" },
  { id: "categories", name: "Shop by category" },
  { id: "intro", name: "Ticker & statement" },
  { id: "pricestrip", name: "Price shortcuts" },
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
  { id: "trail", name: "Pick up where you left off" },
  { id: "feed", name: "Keep exploring (endless feed)" },
  { id: "seo", name: "More about Nykaa Fashion" },
];

export interface HomeSlot {
  id: HomeModuleId;
  /** deal module shown at full prominence */
  promoted?: boolean;
}

export function composeHome(mode: IntentMode, layout: HomeLayout = "classic"): HomeSlot[] {
  const ids = (list: HomeModuleId[]): HomeSlot[] => list.map((id) => ({ id }));
  if (layout === "bleed") return composeBleed(mode, ids);
  // The banner leads every mode and "Shop by category" is always the second fold — it starts right under the banner (the ticker and the statement that once sat between them are
  // their own module now, "intro", further down): whatever the visitor's intent, the way into the catalogue is right under the banner.
  // The endless feed ("Keep exploring") is the last module: the page never ends in a dead end.
  switch (mode) {
    case "returning":
      return ids(["hero", "categories", "rail", "intro", "pricestrip", "coupons", "celebration", "brands", "newin", "diwali", "edits", "trending", "look", "brand", "stories", "feed", "seo"]);
    case "deal":
      // Deal intent promotes the offer band to the slot right under the categories (still poster-scale, still with the best-discounted pieces).
      return [{ id: "hero" }, { id: "categories" }, { id: "offers", promoted: true }, ...ids(["intro", "rail", "pricestrip", "coupons", "celebration", "brands", "diwali", "newin", "edits", "trending", "look", "stories", "brand", "feed", "seo"])];
    default:
      return ids(["hero", "categories", "intro", "pricestrip", "coupons", "celebration", "brands", "diwali", "newin", "edits", "trending", "look", "stories", "brand", "feed", "seo"]);
  }
}

/**
 * The full-bleed composition: a wall of touching tiles, band after band. Same rules as the classic page — the banner first, the category tiles second in every mode —
 * and the same intent behaviour (returning: "pick up where you left off" rises to third; deal: the offer band does). The text-led editorial modules (Shop the look, Style Files,
 * the brand spotlight) are not on the wall: stories and edits arrive as tiles inside the endless feed instead.
 */
function composeBleed(mode: IntentMode, ids: (list: HomeModuleId[]) => HomeSlot[]): HomeSlot[] {
  switch (mode) {
    case "returning":
      return ids(["hero", "categories", "trail", "pricestrip", "coupons", "celebration", "brands", "newin", "diwali", "edits", "trending", "feed", "seo"]);
    case "deal":
      return [{ id: "hero" }, { id: "categories" }, { id: "offers", promoted: true }, ...ids(["pricestrip", "coupons", "celebration", "brands", "newin", "diwali", "edits", "trending", "feed", "seo"])];
    default:
      return ids(["hero", "categories", "pricestrip", "coupons", "celebration", "brands", "newin", "diwali", "edits", "trending", "feed", "seo"]);
  }
}

export const MODE_COPY: Record<IntentMode, { name: string; blurb: string }> = {
  cold: { name: "Cold start", blurb: "No history yet — the sale banner, the category tiles and price shortcuts lead." },
  returning: { name: "Returning", blurb: "Signals found — a “picked for you” rail rises to third place, right under the category tiles." },
  deal: { name: "Deal intent", blurb: "Offer interaction detected — the offer band rises to third place, right under the category tiles, for this session." },
};
