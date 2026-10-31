import { EMPTY_MEMORY, type PromoMemory } from "@/lib/promo";
import { createStore } from "@/lib/store";

/*
 * What this browser has done with the pop-ups (src/lib/promo.ts reads it): which campaigns were dismissed or opened, and when. localStorage, like every
 * other store, so it survives refreshes and new tabs, syncs between tabs, and "Reset all data" in the prototype panel clears it with the rest.
 */
export const promoStore = createStore<PromoMemory>("nf.promo", EMPTY_MEMORY);
/** Campaigns shown during this visit (the tab's session) — a visit shows at most two. */
export const promoVisitStore = createStore<{ shown: string[] }>("nf.promo.visit", { shown: [] }, { persist: "session" });
/** A campaign the prototype panel asked for ("Show now"): shown straight away, whatever the rules say. Not persisted. */
export const promoForceStore = createStore<{ id: string | null }>("nf.promo.force", { id: null }, { persist: false });

export const dismissPromo = (id: string, at = Date.now()) => promoStore.set((m) => ({ ...m, dismissed: { ...m.dismissed, [id]: at }, lastDismissAt: at }));
export const engagePromo = (id: string, at = Date.now()) => promoStore.set((m) => ({ ...m, engaged: { ...m.engaged, [id]: at } }));
export const markPromoShown = (id: string) => promoVisitStore.set((s) => (s.shown.includes(id) ? s : { shown: [...s.shown, id] }));
export const showPromoNow = (id: string) => promoForceStore.set({ id });
/** Forget every dismissal and open, start a fresh visit, and drop a forced campaign. */
export const resetPromos = () => {
  promoStore.reset();
  promoVisitStore.reset();
  promoForceStore.set({ id: null });
};
