"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";

/*
 * Who is signed in (asked of the server) and the login records (kept in this browser).
 *
 * The server is the authority on identity and role: the session cookie is signed and HttpOnly, /api/session says who it belongs to, and
 * /admin is refused to non-admins before it is served (src/proxy.ts). The login records are plain localStorage — one key per account,
 * written once per successful sign-in and never reset by a refresh or a sign-out. They are NOT secure: anyone who can open this
 * browser's developer tools can read, edit or delete them, and they only contain sign-ins made in this browser.
 */
export type Role = "admin" | "user";
export interface TeamUser {
  id: string;
  name: string;
  role: Role;
  title?: string;
}
export interface SessionState {
  status: "loading" | "out" | "in";
  user: TeamUser | null;
  /** all accounts (no passwords) — only sent to admins */
  accounts: TeamUser[];
}

export const roleLabel = (u: TeamUser) => (u.role === "admin" ? "Admin" : (u.title ?? "User"));

// ── session ──────────────────────────────────────────────────────────────────────────────────────────────────────
const LOADING: SessionState = { status: "loading", user: null, accounts: [] };
let session: SessionState = LOADING;
let asked: Promise<SessionState> | null = null;
const sessionSubs = new Set<() => void>();

/** Asks the server who is signed in. Once per page load; `force` asks again (right after a sign-in). */
export function loadSession(force = false): Promise<SessionState> {
  if (asked && !force) return asked;
  asked = fetch("/api/session", { cache: "no-store", credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : { user: null }))
    .then((d: { user: TeamUser | null; accounts?: TeamUser[] }) => (d.user ? { status: "in" as const, user: d.user, accounts: d.accounts ?? [] } : { status: "out" as const, user: null, accounts: [] }))
    .catch(() => ({ status: "out" as const, user: null, accounts: [] }))
    .then((next) => {
      session = next;
      sessionSubs.forEach((f) => f());
      return next;
    });
  return asked;
}

export function useTeamSession(): SessionState {
  useEffect(() => {
    void loadSession();
  }, []);
  return useSyncExternalStore(
    (cb) => (sessionSubs.add(cb), () => void sessionSubs.delete(cb)),
    () => session,
    () => LOADING,
  );
}

// ── login records ────────────────────────────────────────────────────────────────────────────────────────────────
export interface LoginEntry {
  /** ISO timestamp of the successful sign-in */
  at: string;
  /** the server's one-time id for that sign-in — what keeps a refresh from counting twice */
  event: string;
}
export interface LoginRecord {
  id: string;
  count: number;
  last: string | null;
  /** newest first */
  history: LoginEntry[];
}

const PREFIX = "nf.logins.v1.";
export const HISTORY_CAP = 500; // the count keeps counting; only the oldest history lines are dropped
const keyOf = (id: string) => PREFIX + id.toLowerCase();
const blank = (id: string): LoginRecord => ({ id, count: 0, last: null, history: [] });

let version = 0;
const recordSubs = new Set<() => void>();
const bump = () => {
  version++;
  recordSubs.forEach((f) => f());
};
if (typeof window !== "undefined") window.addEventListener("storage", (e) => (e.key === null || e.key.startsWith(PREFIX)) && bump()); // another tab wrote or cleared

export function storageAvailable(): boolean {
  try {
    const k = "nf.logins.probe";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function readRecord(id: string): LoginRecord {
  try {
    const raw = window.localStorage.getItem(keyOf(id));
    if (!raw) return blank(id);
    const v = JSON.parse(raw) as Partial<LoginRecord>;
    if (typeof v.count !== "number" || !Array.isArray(v.history)) return blank(id);
    return { id, count: v.count, last: typeof v.last === "string" ? v.last : null, history: v.history.filter((h): h is LoginEntry => !!h && typeof h.at === "string" && typeof h.event === "string") };
  } catch {
    return blank(id);
  }
}

/** Adds one login record for a user — only ever called after the server has confirmed the sign-in. A repeated event id is ignored. */
export function recordLogin(user: TeamUser, event: string): "recorded" | "duplicate" | "unavailable" {
  try {
    const rec = readRecord(user.id);
    if (rec.history.some((h) => h.event === event)) return "duplicate";
    const at = new Date().toISOString();
    const next: LoginRecord = { id: user.id, count: rec.count + 1, last: at, history: [{ at, event }, ...rec.history].slice(0, HISTORY_CAP) };
    window.localStorage.setItem(keyOf(user.id), JSON.stringify(next));
    bump();
    return "recorded";
  } catch {
    return "unavailable";
  }
}

/** Admin control: forget one user's records, or everyone's. */
export function clearRecords(id?: string) {
  try {
    if (id) window.localStorage.removeItem(keyOf(id));
    else Object.keys(window.localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* storage unavailable: nothing to clear */
  }
  bump();
}

/** The records for the given account ids, kept in step with this browser's storage (this tab and other tabs). */
export function useLoginRecords(ids: string[]): LoginRecord[] {
  const v = useSyncExternalStore(
    (cb) => (recordSubs.add(cb), () => void recordSubs.delete(cb)),
    () => version,
    () => -1,
  );
  const key = ids.join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `v` is the storage version: reading again is the point
  return useMemo(() => (typeof window === "undefined" ? ids.map(blank) : ids.map(readRecord)), [key, v]);
}

// ── sign-ins this admin has issued (a list kept in this browser, for display only) ───────────────────────────────
/*
 * "Add user" asks the server for a Login ID + password that works on any device (src/lib/auth.ts). The server stores nothing, so this list —
 * who was added, and when their access ends — lives only in the browser it was added from. Losing it loses the list, not the access: the
 * sign-in keeps working until it expires, and "Show password" can recompute it from the Login ID and the expiry kept here.
 */
export interface IssuedUser {
  id: string;
  name: string;
  /** ISO — when the user was added */
  createdAt: string;
  /** ISO — when their access ends (on the hour) */
  expiresAt: string;
}
const ISSUED_KEY = "nf.team.issued.v1";
const ISSUED_CAP = 60;
const NO_ISSUED: IssuedUser[] = [];
const isIssued = (v: unknown): v is IssuedUser => !!v && typeof v === "object" && ["id", "name", "createdAt", "expiresAt"].every((k) => typeof (v as Record<string, unknown>)[k] === "string");

let issuedRaw: string | null = null;
let issuedList: IssuedUser[] = NO_ISSUED;
const issuedSubs = new Set<() => void>();
const bumpIssued = () => issuedSubs.forEach((f) => f());
if (typeof window !== "undefined") window.addEventListener("storage", (e) => (e.key === null || e.key === ISSUED_KEY) && bumpIssued());

/** Referentially stable until the stored text changes (what useSyncExternalStore needs). */
function issuedSnapshot(): IssuedUser[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(ISSUED_KEY);
  } catch {
    /* storage unavailable: an empty list */
  }
  if (raw !== issuedRaw) {
    issuedRaw = raw;
    try {
      const v: unknown = raw ? JSON.parse(raw) : [];
      issuedList = Array.isArray(v) ? v.filter(isIssued) : NO_ISSUED;
    } catch {
      issuedList = NO_ISSUED;
    }
  }
  return issuedList;
}
const writeIssued = (list: IssuedUser[]) => {
  try {
    window.localStorage.setItem(ISSUED_KEY, JSON.stringify(list.slice(0, ISSUED_CAP)));
  } catch {
    /* storage unavailable: the user was still added on the server, this list just cannot remember it */
  }
  bumpIssued();
};
/** Adds (or updates) a user in the list, newest first. */
export const saveIssued = (u: IssuedUser) => writeIssued([u, ...issuedSnapshot().filter((x) => x.id !== u.id)]);
/** Forgets a user in the list. This does NOT end their access. */
export const forgetIssued = (id: string) => writeIssued(issuedSnapshot().filter((x) => x.id !== id));

export function useIssuedUsers(): IssuedUser[] {
  return useSyncExternalStore(
    (cb) => (issuedSubs.add(cb), () => void issuedSubs.delete(cb)),
    issuedSnapshot,
    () => NO_ISSUED,
  );
}
