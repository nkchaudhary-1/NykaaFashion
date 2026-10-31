import { DAY_MS, RECENT_DAYS, earlyAtMs, isLaunched, launchAtMs, launches, type BrandLaunch, type LaunchOffer } from "@/data/launches";

/*
 * New & Next — pure time and state helpers. Everything here is a function of (launch, now): no clock is read, so the same code runs on the server (with the
 * prototype's EPOCH), in the browser (with the launch clock) and in scripts. Dates are written in India time (IST, UTC+05:30) by arithmetic rather than Intl, so the
 * server and the browser always print the same text.
 */

const IST = 5.5 * 3_600_000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

export interface Ist {
  weekday: string;
  weekdayShort: string;
  day: number;
  month: string;
  monthShort: string;
  year: number;
  hour: number;
  minute: number;
  second: number;
}

export function ist(ms: number): Ist {
  const d = new Date(ms + IST);
  const weekday = WEEKDAYS[d.getUTCDay()];
  const month = MONTHS[d.getUTCMonth()];
  return { weekday, weekdayShort: weekday.slice(0, 3), day: d.getUTCDate(), month, monthShort: month.slice(0, 3), year: d.getUTCFullYear(), hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: d.getUTCSeconds() };
}

const pad2 = (n: number) => String(n).padStart(2, "0");
/** "11:00 am", "6:30 pm" */
export const clock12 = (p: Ist) => `${p.hour % 12 || 12}:${pad2(p.minute)} ${p.hour < 12 ? "am" : "pm"}`;
/** "6 pm", "11:30 am" — drops ":00" */
export const clockShort = (p: Ist) => `${p.hour % 12 || 12}${p.minute ? `:${pad2(p.minute)}` : ""} ${p.hour < 12 ? "am" : "pm"}`;

/** "Saturday 14 November" */
export const longDate = (ms: number) => {
  const p = ist(ms);
  return `${p.weekday} ${p.day} ${p.month}`;
};
/** "14 Nov" */
export const shortDate = (ms: number) => {
  const p = ist(ms);
  return `${p.day} ${p.monthShort}`;
};
/** "Fri 13 Nov, 6 pm" */
export const whenShort = (ms: number) => {
  const p = ist(ms);
  return `${p.weekdayShort} ${p.day} ${p.monthShort}, ${clockShort(p)}`;
};
/** "Saturday 14 November · 11:00 am IST" */
export const dateTimeLine = (ms: number) => `${longDate(ms)} · ${clock12(ist(ms))} IST`;
/** "Saturday 31 October 2026 · 3:42:10 pm IST" — the launch clock's readout */
export const readout = (ms: number) => {
  const p = ist(ms);
  return `${p.weekday} ${p.day} ${p.month} ${p.year} · ${p.hour % 12 || 12}:${pad2(p.minute)}:${pad2(p.second)} ${p.hour < 12 ? "am" : "pm"} IST`;
};

// ── countdown ────────────────────────────────────────────────────────────────────────────────────────────────────
export interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
export function remaining(ms: number): Remaining {
  const t = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(t / 86400), hours: Math.floor((t % 86400) / 3600), minutes: Math.floor((t % 3600) / 60), seconds: t % 60 };
}
const unit = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;
/** "14 days, 1 hour and 2 minutes" — minute precision on purpose: it is read by assistive technology and changes once a minute */
export function remainingSentence(ms: number): string {
  const { days, hours, minutes } = remaining(Math.floor(ms / 60_000) * 60_000);
  const parts = [days > 0 && unit(days, "day"), (days > 0 || hours > 0) && unit(hours, "hour"), unit(minutes, "minute")].filter(Boolean) as string[];
  if (days === 0 && hours === 0 && minutes === 0) return "less than a minute";
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
}
/** two digits: "05"; three or more stay as they are ("120") */
export const two = (n: number) => String(n).padStart(2, "0");

// ── offers ───────────────────────────────────────────────────────────────────────────────────────────────────────
export type OfferState = "live" | "soon" | "ended";
export const OFFER_KIND: Record<LaunchOffer["kind"], string> = { "early-access": "Early access", discount: "Launch offer", shipping: "Free delivery", gift: "Gift", bonus: "Special offer" };

export const offerStartMs = (l: BrandLaunch, o: LaunchOffer) => (o.starts === "early" ? (earlyAtMs(l) ?? launchAtMs(l)) : launchAtMs(l));
/** An offer ends at its `endsAt`; the early-access window closes when the doors open to everyone. */
export const offerEndMs = (l: BrandLaunch, o: LaunchOffer): number | null => (o.endsAt ? Date.parse(o.endsAt) : o.starts === "early" ? launchAtMs(l) : null);
export function offerState(l: BrandLaunch, o: LaunchOffer, now: number): OfferState {
  const end = offerEndMs(l, o);
  if (end !== null && now >= end) return "ended";
  return now >= offerStartMs(l, o) ? "live" : "soon";
}
/** "Members from Fri 13 Nov, 6 pm" · "From Sat 14 Nov, 11 am · until Sat 21 Nov" */
export function offerWhen(l: BrandLaunch, o: LaunchOffer): string {
  const start = whenShort(offerStartMs(l, o));
  const end = o.endsAt ? ist(Date.parse(o.endsAt)) : null;
  if (o.starts === "early") return `Members from ${start}`;
  return end ? `From ${start} · until ${end.weekdayShort} ${end.day} ${end.monthShort}` : `From ${start}`;
}
/** The figure an offer is shown with, set huge: "20%", "₹500", "Free", "6 pm". Decorative — the offer's title carries the same words. */
export function offerFigure(l: BrandLaunch, o: LaunchOffer): string {
  if (o.kind === "early-access") {
    const at = earlyAtMs(l);
    return at ? clockShort(ist(at)) : "Early";
  }
  const m = /(\d[\d,]*\s?%|₹\s?\d[\d,]*)/.exec(o.title);
  if (m) return m[1].replace(/\s+/g, "");
  if (/free/i.test(o.title) || o.kind === "shipping" || o.kind === "gift") return "Free";
  return o.kind === "bonus" ? "Plus" : "Offer";
}

// ── which brand leads, and the one clock the page reads ─────────────────────────────────────────────────────────────
/** A brand that has just launched keeps the hub's lead for its launch week; after that the hub moves on to the next brand that is due. */
export const LAUNCH_WEEK_DAYS = 7;

/**
 * The brand the hub leads with. The contract's `featuredLaunch` is "the next one due", which would hand the banner to the next brand at the very moment the
 * featured one goes live; the hub wants the opposite — the brand that has just launched is "Now live" for its launch week, and only then does the next brand take over.
 */
export function leadLaunch(now: number): BrandLaunch | null {
  const fresh = launches
    .filter((l) => isLaunched(l, now) && now - launchAtMs(l) <= LAUNCH_WEEK_DAYS * DAY_MS)
    .sort((a, b) => launchAtMs(b) - launchAtMs(a))[0];
  if (fresh) return fresh;
  const upcoming = launches.filter((l) => !isLaunched(l, now)).sort((a, b) => launchAtMs(a) - launchAtMs(b))[0];
  if (upcoming) return upcoming;
  return launches.filter((l) => isLaunched(l, now)).sort((a, b) => launchAtMs(b) - launchAtMs(a))[0] ?? null;
}

/**
 * Every moment at which something on these pages can change state (a launch, early access, an offer starting or ending, a brand leaving the lead or the "recent"
 * list). The page decides everything at the latest of these that has passed, so it re-renders when something flips — not every second.
 */
export const EVENT_TIMES: number[] = (() => {
  const t = new Set<number>();
  for (const l of launches) {
    const at = launchAtMs(l);
    t.add(at);
    t.add(at + LAUNCH_WEEK_DAYS * DAY_MS + 1);
    t.add(at + RECENT_DAYS * DAY_MS + 1);
    const early = earlyAtMs(l);
    if (early !== null) t.add(early);
    for (const o of l.offers) {
      t.add(offerStartMs(l, o));
      const end = offerEndMs(l, o);
      if (end !== null) t.add(end);
    }
  }
  return [...t].filter(Number.isFinite).sort((a, b) => a - b);
})();

/** The latest event at or before `now` (0 before the first). Predicates on launches only change at an event, so they give the same answer at this time as at `now`. */
export function stateTime(now: number): number {
  let lo = 0;
  let hi = EVENT_TIMES.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (EVENT_TIMES[mid] <= now) lo = mid + 1;
    else hi = mid;
  }
  return lo ? EVENT_TIMES[lo - 1] : 0;
}

/** The moment at which the launch clock's "1 week after launch" preset lands: a week after, or — when the launch-week offers end a little later — just after they have ended, so the "Ended" state can be seen. */
export function afterLaunchWeekMs(l: BrandLaunch): number {
  const at = launchAtMs(l);
  const week = at + 7 * DAY_MS;
  const ends = l.offers.map((o) => (o.endsAt ? Date.parse(o.endsAt) : NaN)).filter((e) => e > at && e <= at + 10 * DAY_MS);
  return ends.length ? Math.max(week, Math.max(...ends) + 60_000) : week;
}

/** The headline with `*word*` rendered as <em> is done by the component; this is the plain text (alt text, metadata, the sr-only sentences). */
export const plainHeadline = (h: string) => h.replace(/\*/g, "");
/** The longest line, in characters, once the headline is balanced over `lines` lines — what the banner sizes its type from. */
export function longestLine(headline: string, lines = 2): number {
  const words = plainHeadline(headline).split(/\s+/).filter(Boolean);
  if (words.length < 2) return words[0]?.length ?? 1;
  let best = Infinity;
  const widest = (a: string[]) => a.join(" ").length;
  if (lines <= 2 || words.length < 3) {
    for (let i = 1; i < words.length; i++) best = Math.min(best, Math.max(widest(words.slice(0, i)), widest(words.slice(i))));
  } else {
    for (let i = 1; i < words.length - 1; i++) for (let j = i + 1; j < words.length; j++) best = Math.min(best, Math.max(widest(words.slice(0, i)), widest(words.slice(i, j)), widest(words.slice(j))));
  }
  return best;
}

/** Where "Shop now" goes: the brand's own `cta`, the catalogue label's page, or the range on the launch page. */
export function shopHref(l: BrandLaunch, here?: boolean): { label: string; href: string } {
  if (l.cta) return l.cta;
  if (l.brand.labelId) return { label: "Shop now", href: `/brands/${l.brand.labelId}` };
  return { label: "Shop now", href: here ? "#shop" : `/new-and-next/${l.id}#shop` };
}
