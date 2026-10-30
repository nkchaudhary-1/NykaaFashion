import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OffersTracker } from "@/components/editorial/Trackers";
import { OfferCodes } from "@/components/commerce/OfferCodes";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductListing } from "@/components/plp/ProductListing";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { editById } from "@/data/edits";
import { editProducts } from "@/data/queries";

export const metadata: Metadata = { title: "Offers", description: "The Offer Edit — genuine markdowns and coupon codes." };

export default function OffersPage() {
  const pool = editProducts(editById["the-offer-edit"]);
  return (
    <>
      <OffersTracker />
      <PageHeader crumbs={[{ name: "Home", href: "/" }, { name: "Offers" }]} eyebrow="The Offer Edit" title={<>Fewer sales. <em>Better ones.</em></>} intro="A discount appears only where a price has genuinely moved. Browse the markdowns, or take a code to your bag." />
      <section aria-labelledby="codes" className="container-x pb-14">
        <h2 id="codes" className="eyebrow mb-4 text-ink-3">Coupon codes · simulated</h2>
        <OfferCodes />
        <p className="mt-4 text-[13px] text-ink-3">
          Shortcuts: <Link href="/edits/under-1500" className="link-u text-ink">Under ₹1,500</Link> · <Link href="/edits/under-3000" className="link-u text-ink">Under ₹3,000</Link> · <Link href="/edits/hidden-gems" className="link-u text-ink">Browse Hidden Gems instead</Link>
        </p>
      </section>
      <Suspense fallback={<div className="container-x"><GridSkeleton count={8} /></div>}>
        <ProductListing pool={pool} scopeKey="offers" source="offers" hide={["offers"]} />
      </Suspense>
    </>
  );
}
