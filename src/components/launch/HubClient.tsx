"use client";
import { Suspense } from "react";
import { recentLaunches, upcomingLaunches } from "@/data/launches";
import { LaunchBanner } from "./Banner";
import { useLaunchTime } from "./clock";
import { ComingSoon } from "./ComingSoon";
import { Footnote } from "./Footnote";
import { LaunchClockControl } from "./LaunchClockControl";
import { NotifyHost } from "./Notify";
import { LaunchOffers } from "./Offers";
import { PieceFromUrl, PieceHost } from "./PieceSheet";
import { PreviewSection } from "./Preview";
import { RecentlyLaunched } from "./Recent";
import { LaunchTicker } from "./Ticker";
import { leadLaunch } from "./time";

/**
 * /new-and-next: the featured-launch banner, the Launch clock, a ticker, COMING SOON rows, EXCLUSIVE OFFERS, PRODUCT PREVIEW (SHOP NOW from launch day) and RECENTLY LAUNCHED.
 * Every section derives from one time — `useLaunchTime()`, which only changes when something launches or an offer starts or ends — so the page changes by itself, without a
 * reload, when the launch moment arrives (or when the Launch clock jumps there).
 */
export function HubClient() {
  const time = useLaunchTime();
  const lead = leadLaunch(time);
  const upcoming = upcomingLaunches(time);
  const recent = recentLaunches(time);
  const rows = upcoming.filter((l) => l.id !== lead?.id);
  const others = [...upcoming, ...recent].filter((l) => l.id !== lead?.id).slice(0, 5);
  return (
    <>
      {lead && <LaunchBanner key={`banner-${lead.id}`} launch={lead} as="hub" />}
      <LaunchClockControl />
      <LaunchTicker time={time} />
      <ComingSoon rows={rows} />
      {lead && <LaunchOffers key={`offers-${lead.id}`} launch={lead} others={others} />}
      {lead && <PreviewSection key={`preview-${lead.id}`} launch={lead} />}
      <RecentlyLaunched items={recent} />
      <Footnote />
      <NotifyHost />
      <PieceHost />
      <Suspense fallback={null}>
        <PieceFromUrl />
      </Suspense>
    </>
  );
}
