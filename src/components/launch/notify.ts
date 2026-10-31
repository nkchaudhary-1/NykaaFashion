import { useSyncExternalStore } from "react";

/*
 * "Notify me" reminders, simulated: { [launchId]: { contact, at } } as plain JSON in localStorage under `nf.launch.notify`. Nothing is sent anywhere.
 * A small external store (like the site's own, but unwrapped so the key reads as documented) so every button on the page reflects a reminder the moment it is
 * saved or undone — and so does another tab, through the `storage` event.
 */
const KEY = "nf.launch.notify";

export interface NotifyEntry {
  contact: string;
  at: number;
}
type NotifyMap = Record<string, NotifyEntry>;

const EMPTY: NotifyMap = {};
let state: NotifyMap = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function clean(v: unknown): NotifyMap {
  if (!v || typeof v !== "object" || Array.isArray(v)) return EMPTY;
  const out: NotifyMap = {};
  for (const [id, e] of Object.entries(v as Record<string, unknown>)) {
    const c = e as Partial<NotifyEntry> | null;
    if (c && typeof c.contact === "string" && c.contact) out[id] = { contact: c.contact, at: Number(c.at) || 0 };
  }
  return out;
}
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? clean(JSON.parse(raw)) : EMPTY;
  } catch {
    state = EMPTY; // storage blocked or unreadable: the reminder lives for this page view
  }
}
function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode: keep it in memory */
  }
}
const emit = () => subs.forEach((f) => f());

function onStorage(e: StorageEvent) {
  if (e.key !== KEY && e.key !== null) return;
  loaded = false;
  load();
  emit();
}
function subscribe(cb: () => void) {
  load();
  if (!subs.size) window.addEventListener("storage", onStorage);
  subs.add(cb);
  return () => {
    subs.delete(cb);
    if (!subs.size) window.removeEventListener("storage", onStorage);
  };
}

/** Saves a reminder for a launch. Event handlers only. */
export function saveNotify(launchId: string, contact: string) {
  load();
  state = { ...state, [launchId]: { contact, at: Date.now() } };
  persist();
  emit();
}
/** Removes a reminder. */
export function clearNotify(launchId: string) {
  load();
  const { [launchId]: _gone, ...rest } = state;
  void _gone;
  state = rest;
  persist();
  emit();
}

/** The saved reminder for a launch, or null. null on the server and during hydration. */
export function useNotified(launchId: string): NotifyEntry | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state[launchId] ?? null;
    },
    () => null,
  );
}

// ── which launch's Notify me dialog is open (one host per page) ──────────────────────────────────────────────────────
let target: string | null = null;
const tsubs = new Set<() => void>();
const tsubscribe = (cb: () => void) => {
  tsubs.add(cb);
  return () => void tsubs.delete(cb);
};
export const openNotify = (launchId: string) => {
  target = launchId;
  tsubs.forEach((f) => f());
};
export const closeNotify = () => {
  target = null;
  tsubs.forEach((f) => f());
};
export const useNotifyTarget = () =>
  useSyncExternalStore(
    tsubscribe,
    () => target,
    () => null,
  );

/** A mobile number (10 digits, 6–9 first; +91, 91 and spaces tolerated) or an email address. */
export function parseContact(raw: string): { ok: true; contact: string } | { ok: false; error: string } {
  const v = raw.trim();
  if (!v) return { ok: false, error: "Enter your email address or a 10-digit mobile number." };
  if (v.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? { ok: true, contact: v } : { ok: false, error: "That email address doesn’t look right — check it and try again." };
  const digits = v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? { ok: true, contact: digits } : { ok: false, error: "Enter a valid 10-digit mobile number or an email address." };
}
