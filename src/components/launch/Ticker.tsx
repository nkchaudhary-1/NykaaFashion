"use client";
import { Marquee } from "@/components/motion/Marquee";
import { DAY_MS, launchAtMs, recentLaunches, upcomingLaunches } from "@/data/launches";
import { shortDate } from "./time";

/** A slow ticker of what is coming and what has just arrived. Pure decoration (the same words are the rows below), so it is hidden from assistive tech and holds no links. */
export function LaunchTicker({ time }: { time: number }) {
  const upcoming = upcomingLaunches(time);
  const fresh = recentLaunches(time).filter((l) => time - launchAtMs(l) <= 30 * DAY_MS);
  const items: Array<{ text: string; label?: boolean }> = [];
  if (upcoming.length) {
    items.push({ text: "Coming soon", label: true });
    for (const l of upcoming) items.push({ text: `${l.brand.name} — ${shortDate(launchAtMs(l))}` });
  }
  if (fresh.length) {
    items.push({ text: "Now live", label: true });
    for (const l of fresh) items.push({ text: l.brand.name });
  }
  if (!items.length) items.push({ text: "New & Next", label: true }, { text: "Brand launches" }, { text: "Coming soon", label: true });
  // each copy of the row must be wider than the screen for the loop to be seamless
  const chars = items.reduce((n, i) => n + i.text.length, 0);
  const row = Array.from({ length: Math.max(1, Math.ceil(150 / chars)) }, () => items).flat();
  return (
    <div aria-hidden className="border-b border-line bg-bone py-5 sm:py-7">
      <Marquee seconds={52} gap="2.75rem" className="display-md">
        {row.map((it, i) => (
          <span key={i} className="flex shrink-0 items-center gap-[2.75rem] whitespace-nowrap">
            {it.label ? <em>{it.text}</em> : it.text}
            <span className="block size-2 shrink-0 rotate-45 bg-ink" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}
