import { DAY_MS, isLaunched, launchAtMs, launchById } from "../data/launches.ts";
import { promos, type PromoCampaign, type PromoKind, type PromoMedia } from "../data/promos.ts";

/*
 * Which pop-up (if any) belongs on this page right now. Pure functions — no React, no storage, no clock of their own — so the rules are unit-tested
 * in Node (scripts/qa/promo-unit.mjs) and the component (components/promo/PromoPip.tsx) only has to ask.
 *
 * The rules are written to keep a pop-up from ever feeling like an interruption:
 *  • one window at a time, never on checkout / bag / login / account / admin / prototype pages (and not on product, help or info pages unless a
 *    campaign asks for them);
 *  • a dismissed campaign stays away for `suppressDays` (7), one that was opened (clicked) for twice that;
 *  • after ANY dismissal nothing else is shown for 24 hours, and a visit shows at most two different campaigns;
 *  • only an "urgent" campaign (priority ≥ 100) ignores the last two — an announcement that must be seen.
 */
export const COOLDOWN_MS = 24 * 3_600_000;
export const DEFAULT_SUPPRESS_DAYS = 7;
export const MAX_PER_VISIT = 2;
export const URGENT = 100;
export const DEFAULT_LIVE_DAYS = 7;
export const DEFAULT_DELAY = 6;

/** Pages that never show a pop-up. */
export const NEVER_ON = ["/checkout", "/bag", "/login", "/account", "/admin", "/prototype", "/__"];
/** Pages that show one only when a campaign lists them in `routes.include`. */
export const ONLY_IF_LISTED = ["/p", "/help", "/info"];

export interface PromoMemory {
  /** campaign id → when (ms) it was dismissed */
  dismissed: Record<string, number>;
  /** campaign id → when (ms) it was opened */
  engaged: Record<string, number>;
  lastDismissAt: number | null;
}
export const EMPTY_MEMORY: PromoMemory = { dismissed: {}, engaged: {}, lastDismissAt: null };

/** What the window shows: a campaign with its launch-driven copy filled in for this moment. */
export interface PromoView {
  id: string;
  kind: PromoKind;
  /** "live" once a launch campaign's brand is on sale */
  state: "default" | "countdown" | "live";
  eyebrow: string;
  headline: string;
  /** one line under the headline: the campaign's `body`, or the countdown */
  meta?: string;
  cta: { label: string; href: string };
  media: PromoMedia;
  delaySeconds: number;
}

export const KIND_LABEL: Record<PromoKind, string> = {
  launch: "New launch",
  collection: "Upcoming collection",
  offer: "Members’ offer",
  announcement: "Good to know",
  notification: "For you",
};

// ── routes ───────────────────────────────────────────────────────────────────────────────────────────────────────
/** "/" matches the home page only; any other pattern matches that path and everything under it. */
export function routeMatches(pattern: string, pathname: string): boolean {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (pattern === "/") return path === "/";
  const p = pattern.replace(/\/+$/, "");
  return path === p || path.startsWith(`${p}/`);
}
const matchesAny = (patterns: string[] | undefined, pathname: string) => !!patterns?.some((p) => routeMatches(p, pathname));

/** The only route rule a forced (`?promo=`) pop-up still obeys: transactional pages stay quiet. */
export const isQuietRoute = (pathname: string) => NEVER_ON.some((p) => routeMatches(p, pathname));

export function routeAllowed(c: PromoCampaign, pathname: string): boolean {
  if (isQuietRoute(pathname)) return false;
  if (matchesAny(c.routes?.exclude, pathname)) return false;
  if (c.routes?.include) return matchesAny(c.routes.include, pathname);
  return !ONLY_IF_LISTED.some((p) => routeMatches(p, pathname));
}

// ── words ────────────────────────────────────────────────────────────────────────────────────────────────────────
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
/** "13d 22h", "5h 12m", "42m" — what is left before a moment. */
export function timeLeft(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d >= 1) return `${d}d ${h}h`;
  return h >= 1 ? `${h}h ${m % 60}m` : `${m}m`;
}

// ── a campaign, for this moment ──────────────────────────────────────────────────────────────────────────────────
/** True while the campaign's own dates allow it (and, for a launch campaign, while it has something to say). */
export function inWindow(c: PromoCampaign, now: number): boolean {
  if (c.startsAt && now < Date.parse(c.startsAt)) return false;
  if (c.endsAt && now >= Date.parse(c.endsAt)) return false;
  return true;
}

/** The campaign as the window shows it at `now`, or null when it has nothing to say (outside its dates; a launch campaign long after launch). */
export function resolveCampaign(c: PromoCampaign, now: number): PromoView | null {
  if (!inWindow(c, now)) return null;
  const base = { id: c.id, kind: c.kind, media: c.media, delaySeconds: c.delaySeconds ?? DEFAULT_DELAY };
  const launch = c.launchId ? launchById[c.launchId] : undefined;
  if (c.launchId && !launch) return null; // a campaign pointing at a launch that does not exist shows nothing (data:check reports it)
  if (!launch) {
    if (!c.headline || !c.cta) return null;
    return { ...base, state: "default", eyebrow: c.eyebrow ?? KIND_LABEL[c.kind], headline: c.headline, meta: c.body, cta: c.cta };
  }
  const at = launchAtMs(launch);
  if (!isLaunched(launch, now)) {
    return {
      ...base,
      state: "countdown",
      eyebrow: c.eyebrow ?? KIND_LABEL[c.kind],
      headline: c.headline ?? `${launch.brand.name} arrives ${dateFmt.format(at)}`,
      meta: c.body ?? `Launches in ${timeLeft(at - now)}`,
      cta: c.cta ?? { label: "Get notified", href: `/new-and-next/${launch.id}` },
    };
  }
  if (now >= at + (c.liveDays ?? DEFAULT_LIVE_DAYS) * DAY_MS) return null;
  return {
    ...base,
    state: "live",
    eyebrow: "Now live",
    headline: c.live?.headline ?? `${launch.brand.name} is here`,
    meta: `Launched ${dateFmt.format(at)}`,
    cta: c.live?.cta ?? { label: "Shop now", href: `/new-and-next/${launch.id}#shop` },
  };
}

// ── which one ────────────────────────────────────────────────────────────────────────────────────────────────────
export interface PickInput {
  /** "now" for launches and campaign dates: the real time plus the prototype launch clock's offset */
  now: number;
  /** the real time, for the dismissal and cool-down bookkeeping (those timestamps are real) */
  realNow: number;
  pathname: string;
  memory: PromoMemory;
  /** campaign ids already shown during this visit */
  shown: string[];
  /** a campaign id to show regardless of memory, limits and its own route list (the prototype panel and `?promo=`) — quiet pages still stay quiet */
  force?: string | null;
  /** the campaign on screen right now: kept if it is still allowed, so moving between pages does not swap it */
  keep?: string | null;
  campaigns?: PromoCampaign[];
}

export function pickPromo({ now, realNow, pathname, memory, shown, force, keep, campaigns = promos }: PickInput): PromoView | null {
  if (isQuietRoute(pathname)) return null;
  const views = campaigns.flatMap((c) => {
    const view = resolveCampaign(c, now);
    return view ? [{ c, view }] : [];
  });
  if (force) {
    const hit = views.find((x) => x.c.id === force);
    return hit ? hit.view : null;
  }

  const eligible = views.filter(({ c, view }) => {
    if (!routeAllowed(c, pathname)) return false;
    if (c.launchId && routeMatches("/new-and-next", pathname)) return false; // the launch pages are the destination already
    if (view.cta.href.split("#")[0] === (pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/")) return false; // never point at the page you are on
    const away = (c.suppressDays ?? DEFAULT_SUPPRESS_DAYS) * DAY_MS;
    const dismissed = memory.dismissed[c.id];
    if (dismissed !== undefined && realNow - dismissed < away) return false;
    const engaged = memory.engaged[c.id];
    if (engaged !== undefined && realNow - engaged < away * 2) return false;
    return true;
  });

  const cooling = memory.lastDismissAt !== null && realNow - memory.lastDismissAt < COOLDOWN_MS;
  const visitFull = shown.length >= MAX_PER_VISIT;
  const allowed = eligible.filter(({ c }) => (c.priority ?? 0) >= URGENT || (!cooling && (!visitFull || shown.includes(c.id))));
  if (!allowed.length) return null;
  const kept = keep ? allowed.find((x) => x.c.id === keep) : undefined;
  if (kept) return kept.view;
  // highest priority first; the order in the data breaks ties
  return allowed.map((x, i) => ({ ...x, i })).sort((a, b) => (b.c.priority ?? 0) - (a.c.priority ?? 0) || a.i - b.i)[0].view;
}
