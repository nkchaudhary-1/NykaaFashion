import { useSyncExternalStore } from "react";

/** Fixed prototype "build day" — used for server renders and all seeded mock dates. */
export const EPOCH = Date.UTC(2026, 9, 30, 9, 30);
export const DAY = 86_400_000;

/** Current time for event handlers and effects. Never call during render (Cache Components forbids it). */
export const nowMs = () => Date.now();

const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 30_000);
  return () => clearInterval(id);
};

/** Render-safe "now": EPOCH on the server/hydration pass, minute-rounded wall clock afterwards. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => EPOCH,
  );
}
