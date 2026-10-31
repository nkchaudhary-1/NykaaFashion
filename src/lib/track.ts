import { createStore } from "./store";

// PRD §8.1 event taxonomy — logged locally (no network) so the Prototype panel can show them.
export type EventName =
  | "home_module_view"
  | "home_module_click"
  | "collection_open"
  | "editorial_story_open"
  | "pdp_view"
  | "product_save"
  | "add_to_bag"
  | "filter_apply"
  | "search"
  | "intent_signal_change"
  | "personalized_rail_view"
  | "personalized_rail_click"
  | "checkout_step"
  | "order_placed"
  | "notify_me"
  | "promo_view"
  | "promo_click"
  | "promo_dismiss";

export interface TrackedEvent {
  id: number;
  name: EventName;
  props: Record<string, string | number | boolean | undefined>;
  at: number;
}

export const eventsStore = createStore<TrackedEvent[]>("nf.events", [], { version: 1 });

/** Call from effects/handlers only. */
export function track(name: EventName, props: TrackedEvent["props"] = {}) {
  eventsStore.set((prev) => {
    const id = prev.length ? prev[prev.length - 1].id + 1 : 1;
    return [...prev.slice(-199), { id, name, props, at: Date.now() }];
  });
  if (process.env.NODE_ENV !== "production") console.debug("[track]", name, props);
}
