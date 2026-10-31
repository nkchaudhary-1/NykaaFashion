"use client";
import { Suspense } from "react";
import { ProductListing } from "@/components/plp/ProductListing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { launchAtMs, type BrandLaunch } from "@/data/launches";
import { rangeOf } from "./range";
import { shortDate } from "./time";

/**
 * SHOP NOW on a brand's page, from launch day: the range as the site's own product listing (filters, sort, "Show more" — the very component the category, edit and brand pages
 * use), inside Suspense because it reads the address. `#shop` is the anchor every "Shop now" on the hub points at. A brand that is already in the catalogue lists its catalogue products.
 */
export function LaunchShop({ launch }: { launch: BrandLaunch }) {
  const pool = rangeOf(launch);
  if (!pool.length) return null;
  return (
    <section id="shop" aria-labelledby="shop-h" className="scroll-mt-24 pb-4 pt-[var(--section-y)]">
      <div className="container-x mb-12">
        <SectionHeading
          level={2}
          size="lg"
          eyebrow={`On sale since ${shortDate(launchAtMs(launch))}`}
          title={
            <span id="shop-h">
              Shop <em>{launch.brand.name}.</em>
            </span>
          }
          intro={launch.brand.tagline}
        />
      </div>
      <Suspense fallback={<div className="container-x"><GridSkeleton count={8} /></div>}>
        <ProductListing pool={pool} scopeKey={`launch:${launch.id}`} source={`launch:${launch.id}`} hide={["label"]} categoryScope={[]} resultsHeading={false} />
      </Suspense>
    </section>
  );
}
