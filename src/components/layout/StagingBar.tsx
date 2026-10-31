"use client";
import { BUILD_SHA, IS_STAGING, LIVE_URL } from "@/lib/channel";
import { LayoutSwitch } from "./LayoutSwitch";

/**
 * Marks the review site so it can never be mistaken for the live prototype: a flat marigold strip above everything, in the page flow (it scrolls away like the
 * announcement bar, so it cannot cover the header, a sheet or the phone navigation). It also carries the review switch between the two home layouts.
 * Renders nothing in a production build.
 */
export function StagingBar() {
  if (!IS_STAGING) return null;
  return (
    <section aria-label="Staging build" data-staging-bar className="bg-marigold text-ink">
      <div className="container-x flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-1.5 text-[12px] leading-snug sm:text-[12.5px]">
        <p className="min-w-0">
          <span className="mr-2 inline-block bg-ink px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-bone">Staging</span>
          <span className="font-medium">Review build — not the live site.</span>
          {BUILD_SHA && <span className="ml-2 tabular-nums opacity-70">{BUILD_SHA}</span>}
        </p>
        <div className="flex items-center gap-3">
          <span className="hidden font-medium sm:inline">Home layout</span>
          <LayoutSwitch />
          {LIVE_URL && (
            <a href={LIVE_URL} className="link-u hidden shrink-0 font-medium lg:inline">
              Open the live site
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
