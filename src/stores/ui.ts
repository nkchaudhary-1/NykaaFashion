import type { Review } from "@/data/types";
import { createStore, useStore } from "@/lib/store";

// ── Ephemeral UI state ───────────────────────────────────────
export interface UIState {
  bagOpen: boolean;
  searchOpen: boolean;
  menuOpen: boolean;
  /** the phone/tablet navigation drawer (hamburger) */
  navOpen: boolean;
  protoOpen: boolean;
  /** the sign-in modal (components/account/LoginModal) */
  loginOpen: boolean;
  quickView: { productId: string; variant?: number } | null;
  sizeGuide: { productId: string } | null;
  notifyMe: { productId: string; size?: string } | null;
  reviewFor: string | null;
}
const UI_INITIAL: UIState = { bagOpen: false, searchOpen: false, menuOpen: false, navOpen: false, protoOpen: false, loginOpen: false, quickView: null, sizeGuide: null, notifyMe: null, reviewFor: null };
export const uiStore = createStore<UIState>("nf.ui", UI_INITIAL, { persist: false });
export const useUI = () => useStore(uiStore);
export const setUI = (patch: Partial<UIState>) => uiStore.set((p) => ({ ...p, ...patch }));
export const closeAllOverlays = () => uiStore.set(UI_INITIAL);

// ── Toasts ───────────────────────────────────────────────────
export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone?: "default" | "success" | "error";
  action?: { label: string; href?: string; onClick?: () => void };
  duration?: number;
}
export const toastStore = createStore<Toast[]>("nf.toasts", [], { persist: false });
let toastId = 0;
export function toast(t: Omit<Toast, "id">): number {
  const id = ++toastId;
  toastStore.set((p) => [...p.slice(-2), { ...t, id }]);
  setTimeout(() => dismissToast(id), t.duration ?? 4500);
  return id;
}
export const dismissToast = (id: number) => toastStore.set((p) => p.filter((t) => t.id !== id));

// ── Persisted prototype preferences ──────────────────────────
export interface Prefs {
  announceDismissed: boolean;
  /** Prototype control: add latency to simulated fetches */
  slowNetwork: boolean;
  /** Prototype control: next simulated fetch fails (shows inline retry) */
  failNext: boolean;
  /** Prototype control: hide a home module as if it failed to load (PRD §7.5 "Partial") */
  failModule: string | null;
  /** Prototype control: which home page layout to show. null = whatever this build opens on (src/lib/layout.ts). */
  homeLayout: "classic" | "bleed" | null;
  recentSearches: string[];
  savedStories: string[];
  notify: Array<{ productId: string; size?: string; contact: string; at: number }>;
  newsletter: string | null;
  reviews: Review[];
  helpful: string[];
  messages: Array<{ name: string; email: string; message: string; at: number }>;
}
export const PREFS_INITIAL: Prefs = {
  announceDismissed: false,
  slowNetwork: false,
  failNext: false,
  failModule: null,
  homeLayout: null,
  recentSearches: [],
  savedStories: [],
  notify: [],
  newsletter: null,
  reviews: [],
  helpful: [],
  messages: [],
};
export const prefsStore = createStore<Prefs>("nf.prefs", PREFS_INITIAL);
export const usePrefs = () => useStore(prefsStore);
export const setPrefs = (patch: Partial<Prefs>) => prefsStore.set((p) => ({ ...p, ...patch }));

export function addRecentSearch(q: string) {
  const v = q.trim();
  if (!v) return;
  prefsStore.set((p) => ({ ...p, recentSearches: [v, ...p.recentSearches.filter((s) => s.toLowerCase() !== v.toLowerCase())].slice(0, 6) }));
}
