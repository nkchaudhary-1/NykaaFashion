"use client";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { isLaunched, launchById, recentLaunches, upcomingLaunches } from "@/data/launches";
import { LaunchBanner } from "./Banner";
import { useLaunchTime } from "./clock";
import { Footnote } from "./Footnote";
import { LaunchClockControl } from "./LaunchClockControl";
import { EarlyAccessNote, MoreLaunches } from "./More";
import { NotifyHost } from "./Notify";
import { LaunchOffers } from "./Offers";
import { PieceFromUrl, PieceHost } from "./PieceSheet";
import { PreviewSection } from "./Preview";
import { LaunchShop } from "./Shop";
import { LaunchStory } from "./Story";

/**
 * /new-and-next/<brand>: the same components as the hub, driven by one launch. Before launch: banner with countdown, the story and campaign gallery, offers, the preview
 * mosaic, the early-access note, more launches. From launch day the preview becomes the range as a real listing (#shop) and the early-access note goes. Whatever a brand has
 * not got — a story, a gallery, previews — is simply left out.
 */
export function BrandClient({ id }: { id: string }) {
  const launch = launchById[id];
  const time = useLaunchTime();
  const live = isLaunched(launch, time);
  const others = [...upcomingLaunches(time), ...recentLaunches(time)].filter((l) => l.id !== id).slice(0, 5);
  return (
    <>
      <div className="container-x pb-5 pt-6 sm:pb-6 sm:pt-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "New & Next", href: "/new-and-next" }, { name: launch.brand.name }]} />
      </div>
      <LaunchBanner launch={launch} as="page" />
      <LaunchClockControl launch={launch} />
      <LaunchStory launch={launch} />
      <LaunchOffers launch={launch} others={others} />
      {live ? <LaunchShop launch={launch} /> : <PreviewSection launch={launch} here />}
      <EarlyAccessNote launch={launch} />
      <MoreLaunches current={launch} />
      <Footnote />
      <NotifyHost />
      <PieceHost />
      <Suspense fallback={null}>
        <PieceFromUrl />
      </Suspense>
    </>
  );
}
