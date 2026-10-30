import { productById } from "@/data/catalog";
import { editsOf } from "@/data/queries";
import { nowMs } from "@/lib/clock";
import { createStore, useStore } from "@/lib/store";

// Simulated intent engine — PRD §6.4 "Session intent: unknown → browsing → deal-intent".
// Heuristics over localStorage signals; NOT machine learning. Labelled as simulated in the UI.

export type IntentMode = "cold" | "returning" | "deal";
export type IntentOverride = "auto" | IntentMode;

export interface IntentState {
  events: number;
  weights: { category: Record<string, number>; label: Record<string, number>; edit: Record<string, number>; tag: Record<string, number> };
  recent: string[];
  dealScore: number;
  override: IntentOverride;
  lastSignalAt: number;
}

export const INTENT_INITIAL: IntentState = {
  events: 0,
  weights: { category: {}, label: {}, edit: {}, tag: {} },
  recent: [],
  dealScore: 0,
  override: "auto",
  lastSignalAt: 0,
};

export const intentStore = createStore<IntentState>("nf.intent", INTENT_INITIAL, { version: 1 });
/** Deal intent lasts for the browser session (sessionStorage) — "promoted for the session" (PRD §6.3). */
export const dealStore = createStore<{ since: number } | null>("nf.deal", null, { persist: "session" });

export type SignalType = "pdp_view" | "product_save" | "add_to_bag" | "edit_open" | "story_open" | "filter_apply" | "search" | "discount_interaction" | "offers_visit" | "arrive_deal";

const bump = (m: Record<string, number>, k: string, by: number) => ({ ...m, [k]: Math.round(((m[k] ?? 0) + by) * 100) / 100 });

export function signal(type: SignalType, data: { productId?: string; editId?: string; category?: string; tags?: string[]; query?: string } = {}) {
  const now = nowMs();
  intentStore.set((s) => {
    const next: IntentState = { ...s, weights: { ...s.weights }, lastSignalAt: now };
    const addProduct = (id: string, w: number) => {
      const p = productById[id];
      if (!p) return;
      next.weights.category = bump(next.weights.category, p.categoryPath.slice(0, 2).join("/"), w);
      next.weights.label = bump(next.weights.label, p.labelId, w);
      for (const e of editsOf(p)) next.weights.edit = bump(next.weights.edit, e.id, w * 0.6);
      for (const t of p.tags.slice(0, 4)) next.weights.tag = bump(next.weights.tag, t, w * 0.25);
    };
    switch (type) {
      case "pdp_view":
        if (data.productId) {
          addProduct(data.productId, 1);
          next.recent = [data.productId, ...s.recent.filter((id) => id !== data.productId)].slice(0, 12);
        }
        next.events = s.events + 1;
        break;
      case "product_save":
        if (data.productId) addProduct(data.productId, 3);
        next.events = s.events + 2;
        break;
      case "add_to_bag":
        if (data.productId) addProduct(data.productId, 4);
        next.events = s.events + 2;
        break;
      case "edit_open":
        if (data.editId) next.weights.edit = bump(next.weights.edit, data.editId, 2);
        next.events = s.events + 1;
        break;
      case "story_open":
        if (data.editId) next.weights.edit = bump(next.weights.edit, data.editId, 1);
        for (const t of data.tags ?? []) next.weights.tag = bump(next.weights.tag, t, 0.5);
        next.events = s.events + 1;
        break;
      case "filter_apply":
        if (data.category) next.weights.category = bump(next.weights.category, data.category, 0.5);
        for (const t of data.tags ?? []) next.weights.tag = bump(next.weights.tag, t, 0.5);
        break;
      case "search":
        next.events = s.events + 1;
        break;
      case "discount_interaction":
        next.dealScore = s.dealScore + 2;
        break;
      case "offers_visit":
        next.dealScore = s.dealScore + 3;
        break;
      case "arrive_deal":
        next.dealScore = s.dealScore + 4;
        break;
    }
    return next;
  });
  if (type === "discount_interaction" || type === "offers_visit" || type === "arrive_deal") {
    if (!dealStore.get()) dealStore.set({ since: now });
  }
}

export function resolveMode(intent: IntentState, deal: { since: number } | null): IntentMode {
  if (intent.override !== "auto") return intent.override;
  if (deal) return "deal";
  if (intent.events >= 3) return "returning";
  return "cold";
}

export function useIntent() {
  const intent = useStore(intentStore);
  const deal = useStore(dealStore);
  return { intent, deal, mode: resolveMode(intent, deal) };
}

export const setIntentOverride = (override: IntentOverride) => intentStore.set((s) => ({ ...s, override }));

export function topKey(m: Record<string, number>): string | null {
  let best: string | null = null;
  let bw = 0;
  for (const [k, w] of Object.entries(m)) {
    if (w > bw) {
      best = k;
      bw = w;
    }
  }
  return best;
}
