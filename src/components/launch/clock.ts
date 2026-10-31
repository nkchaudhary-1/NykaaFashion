import { useCallback, useSyncExternalStore } from "react";
import { CLOCK_COOKIE, clockOffset } from "@/data/launches";
import { EPOCH } from "@/lib/clock";
import { readClockCookie } from "@/lib/launch-clock";
import { stateTime } from "./time";

/*
 * The launch clock. One tiny external store shared by every component on the page:
 *   • server and hydration pass: EPOCH (the prototype's fixed build time) — nothing reads the real clock while rendering, so Cache Components is satisfied;
 *   • after mount: the real time plus a simulated offset, ticking once a second from ONE interval no matter how many countdowns are on screen.
 * The offset lives in the `nf_launch_offset` cookie (path=/, SameSite=Lax, one day), the same cookie the server proxy reads — so when the Launch clock control
 * moves the page, the server's guard on /p/<piece> agrees with what the page shows. Setting it updates every subscriber in the same tick.
 */
interface Snap {
  now: number;
  offset: number;
  /** false on the server and during hydration, true once the browser's clock has been read */
  ready: boolean;
}
const SERVER: Snap = { now: EPOCH, offset: 0, ready: false };

let snap: Snap = SERVER;
let syncedAt = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const subs = new Set<() => void>();

function read(offset: number): Snap {
  const t = Date.now();
  syncedAt = t;
  return { now: t + offset, offset, ready: true };
}
const emit = () => subs.forEach((f) => f());

function tick() {
  // the cookie is the source of truth (another tab may have moved the clock, or it may have expired): follow it
  const offset = clockOffset(readClockCookie());
  snap = read(offset);
  emit();
}
function subscribe(cb: () => void) {
  subs.add(cb);
  if (!timer) {
    snap = read(clockOffset(readClockCookie()));
    timer = setInterval(tick, 1000);
  }
  return () => {
    subs.delete(cb);
    if (!subs.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
function getSnapshot(): Snap {
  // nobody is ticking (the first render after a navigation): refresh a stale reading, at most once a second, so the first paint is not a minute old
  if (!timer && Date.now() - syncedAt > 1000) snap = read(clockOffset(readClockCookie()));
  return snap;
}
const getServerSnapshot = () => SERVER;

function writeCookie(offset: number) {
  try {
    document.cookie = offset === 0 ? `${CLOCK_COOKIE}=; path=/; max-age=0; SameSite=Lax` : `${CLOCK_COOKIE}=${offset}; path=/; max-age=86400; SameSite=Lax`;
  } catch {
    /* cookies blocked: the clock still moves for this page view */
  }
}

/** Moves the clock to `offset` ms from the real time (0 = real time) and returns the offset that was applied. Event handlers only. */
export function setLaunchOffset(offset: number): number {
  const next = clockOffset(String(offset));
  writeCookie(next);
  snap = read(next);
  emit();
  return next;
}
/** Moves the clock so that "now" is `target` (a timestamp) and returns the offset that was applied. Event handlers only: it reads the real time. */
export const setLaunchClockTo = (target: number) => setLaunchOffset(target - Date.now());

/** The preset last chosen on the Launch clock and the offset it produced — only so its chip can show as pressed while the clock still stands where it put it. */
let lastPreset: { id: string; offset: number } | null = null;
export const rememberPreset = (id: string, offset: number) => {
  lastPreset = { id, offset };
};
export const presetAt = (offset: number): string | null => (lastPreset && lastPreset.offset === offset ? lastPreset.id : null);

/**
 * `now` (the launch clock, once a second), the simulated `offset`, whether the browser's clock has been read (`ready`) and setters.
 * Use it where the seconds matter (countdowns, the clock's readout); use `useLaunchTime()` for everything that only depends on what has launched.
 */
export function useLaunchClock() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setOffset = useCallback((offset: number) => setLaunchOffset(offset), []);
  const setTo = useCallback((target: number) => setLaunchClockTo(target), []);
  const reset = useCallback(() => setLaunchOffset(0), []);
  return { now: s.now, offset: s.offset, ready: s.ready, setOffset, setTo, reset };
}

/** false on the server and during hydration, true once the browser's clock has been read (changes once). */
export function useLaunchReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot().ready,
    () => false,
  );
}

/**
 * The time to decide launch state at: the latest moment at or before `now` at which anything on these pages changes (a launch, an offer starting or ending …).
 * It only changes when something flips, so a section that reads it does not re-render every second — and `isLaunched(launch, time)` answers exactly as it would at `now`.
 */
export function useLaunchTime(): number {
  return useSyncExternalStore(
    subscribe,
    () => stateTime(getSnapshot().now),
    () => stateTime(EPOCH),
  );
}
