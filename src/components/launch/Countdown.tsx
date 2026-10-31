"use client";
import type { CSSProperties, ReactNode } from "react";
import { launchAtMs, type BrandLaunch } from "@/data/launches";
import { cn } from "@/lib/cn";
import { useLaunchClock } from "./clock";
import { dateTimeLine, remaining, remainingSentence, two } from "./time";

const CELLS = [
  ["days", "Days", "d"],
  ["hours", "Hours", "h"],
  ["minutes", "Minutes", "m"],
  ["seconds", "Seconds", "s"],
] as const;

/**
 * The countdown to a launch. `poster` is typographic and flat — four ruled cells (Days · Hours · Minutes · Seconds) of tabular numerals set as large as their
 * container allows (container-query units, capped by `--cd-max`); `compact` is one line of small numerals for list rows.
 *
 * It is a `role="timer"`: the numerals are decorative (aria-hidden) and a visually-hidden sentence — "Launches in 14 days, 1 hour and 2 minutes" — carries the
 * meaning, changing once a minute, so nothing is announced every second. Until the browser's clock has been read the numerals are dashes (the server renders a
 * fixed prototype time, and a number that jumps on hydration is worse than none). When the time is up the numerals fade out and `liveContent` (default "Live now")
 * fades in, in the same box — the page does not reload and nothing moves.
 */
export function Countdown({ launch, variant = "poster", liveContent, className, at: to, noun = "launch" }: { launch: BrandLaunch; variant?: "poster" | "compact"; liveContent?: ReactNode; className?: string; /** count down to this moment instead of the launch (early access) */ at?: number; /** what happens then: "launch" or "early access" */ noun?: string }) {
  const { now, ready } = useLaunchClock();
  const at = to ?? launchAtMs(launch);
  const left = at - now;
  const live = ready && left <= 0;
  const r = remaining(ready ? left : 0);
  const name = launch.brand.name;
  const early = noun !== "launch";
  const sentence = !ready
    ? early ? `${name} early access opens ${dateTimeLine(at)}.` : `${name} launches ${dateTimeLine(at)}.`
    : live
      ? early ? `${name} early access is open now.` : `${name} is live now.`
      : early ? `${name} early access opens in ${remainingSentence(left)}.` : `${name} launches in ${remainingSentence(left)}.`;
  const label = `Countdown to the ${name} ${noun}`;

  if (variant === "compact") {
    return (
      <span role="timer" aria-label={label} className={cn("relative inline-flex items-baseline", className)}>
        <span aria-hidden className={cn("inline-flex items-baseline gap-x-3 tabular-nums transition-[opacity,visibility] duration-700 ease-editorial", live ? "invisible opacity-0" : "visible opacity-100")}>
          {CELLS.map(([key, , short]) => (
            <span key={key} className="inline-flex items-baseline gap-0.5">
              <span className="text-[17px] font-medium leading-none tracking-[-0.03em]">{ready ? two(r[key]) : "––"}</span>
              <span className="eyebrow normal-case tracking-normal">{short}</span>
            </span>
          ))}
        </span>
        <span aria-hidden={!live || undefined} className={cn("absolute inset-0 inline-flex items-baseline whitespace-nowrap text-[15px] font-semibold transition-[opacity,visibility] duration-700 ease-editorial", live ? "visible opacity-100" : "invisible opacity-0")}>
          {liveContent ?? "Live now"}
        </span>
        <span className="sr-only">{sentence}</span>
      </span>
    );
  }

  // poster: a query container, so the numerals fill four cells of whatever width the layout gives them
  return (
    <div role="timer" aria-label={label} className={cn("[container-type:inline-size]", className)}>
      <div className="grid" style={{ "--cd-fs": "min(var(--cd-max, 5.5rem), calc((100cqw - 3 * var(--gap)) / 5))" } as CSSProperties}>
        <div aria-hidden className={cn("col-start-1 row-start-1 grid grid-cols-4 gap-x-[var(--gap)] transition-[opacity,visibility] duration-700 ease-editorial", live ? "invisible opacity-0" : "visible opacity-100")}>
          {CELLS.map(([key, name]) => (
            <div key={key} className="min-w-0 border-t border-current pt-3">
              <span className="eyebrow block">{name}</span>
              <span className="mt-3 block font-medium leading-[0.9] tracking-[-0.05em] tabular-nums" style={{ fontSize: "var(--cd-fs)" }}>
                {ready ? two(r[key]) : "––"}
              </span>
            </div>
          ))}
        </div>
        <div aria-hidden={!live || undefined} className={cn("col-start-1 row-start-1 min-w-0 border-t border-current pt-3 transition-[opacity,visibility] duration-700 ease-editorial", live ? "visible opacity-100" : "invisible opacity-0")}>
          {liveContent ?? (
            <>
              <span className="eyebrow block">Now</span>
              <span className="mt-3 block font-medium leading-[0.9] tracking-[-0.05em]" style={{ fontSize: "var(--cd-fs)" }}>
                Live now
              </span>
            </>
          )}
        </div>
      </div>
      <span className="sr-only">{sentence}</span>
    </div>
  );
}
