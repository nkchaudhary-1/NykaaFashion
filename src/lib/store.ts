import { useSyncExternalStore } from "react";

type Listener = () => void;

export interface Store<T> {
  key: string;
  get: () => T;
  getServer: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (l: Listener) => () => void;
  reset: () => void;
}

interface Options<T> {
  persist?: "local" | "session" | false;
  version?: number;
  migrate?: (raw: unknown, fromVersion: number) => T | null;
}

const registry: Array<Store<unknown>> = [];

/**
 * Tiny external store with optional localStorage/sessionStorage persistence.
 * - Server snapshot is always `initial`, so SSR and hydration markup match.
 * - Client state is hydrated lazily on first subscribe/get.
 */
export function createStore<T>(key: string, initial: T, opts: Options<T> = {}): Store<T> {
  const persist = opts.persist === undefined ? "local" : opts.persist;
  const version = opts.version ?? 1;
  let state = initial;
  let hydrated = persist === false;
  const listeners = new Set<Listener>();

  const storage = (): Storage | null => {
    if (typeof window === "undefined" || persist === false) return null;
    try {
      return persist === "session" ? window.sessionStorage : window.localStorage;
    } catch {
      return null;
    }
  };

  const read = (): T => {
    const s = storage();
    if (!s) return initial;
    try {
      const raw = s.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw) as { v?: number; d?: unknown };
      if (parsed?.v !== version) return opts.migrate?.(parsed?.d, parsed?.v ?? 0) ?? initial;
      return parsed.d as T;
    } catch {
      return initial;
    }
  };

  const write = () => {
    const s = storage();
    if (!s) return;
    try {
      s.setItem(key, JSON.stringify({ v: version, d: state }));
    } catch {
      /* quota or privacy mode — keep working in memory */
    }
  };

  const emit = () => listeners.forEach((l) => l());

  const hydrate = () => {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    state = read();
    if (persist === "local") {
      window.addEventListener("storage", (e) => {
        if (e.key === key) {
          state = read();
          emit();
        }
      });
    }
  };

  const store: Store<T> = {
    key,
    get: () => {
      hydrate();
      return state;
    },
    getServer: () => initial,
    set: (next) => {
      hydrate();
      const value = typeof next === "function" ? (next as (p: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      write();
      emit();
    },
    subscribe: (l) => {
      hydrate();
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    reset: () => {
      hydrate();
      state = initial;
      try {
        storage()?.removeItem(key);
      } catch {
        /* ignore */
      }
      emit();
    },
  };
  registry.push(store as Store<unknown>);
  return store;
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

/** Derive a value from a store. Prefer selectors that return primitives so consumers stay referentially stable. */
export function useStoreSelector<T, S>(store: Store<T>, select: (s: T) => S): S {
  return select(useStore(store));
}

/** True after the first client render — use to avoid flashing empty states before localStorage is read. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Clears every persisted store (local + session) — wired to "Reset all data" in the prototype panel. */
export function resetAllStores() {
  registry.forEach((s) => s.reset());
}
