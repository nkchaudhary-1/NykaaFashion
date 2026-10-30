import type { Metadata } from "next";
import { Suspense } from "react";
import { OffersTracker } from "@/components/editorial/Trackers";
import { OfferCodes } from "@/components/commerce/OfferCodes";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { interleave, type Feature } from "@/components/plp/features";
import { ProductListing } from "@/components/plp/ProductListing";
import { ChipLink } from "@/components/ui/Chip";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { editById } from "@/data/edits";
import { editProducts } from "@/data/queries";

export const metadata: Metadata = { title: "Offers", description: "The Offer Edit — genuine markdowns and coupon codes." };

const SHORTCUTS = [
  { href: "/edits/under-1500", label: "Under ₹1,500" },
  { href: "/edits/under-3000", label: "Under ₹3,000" },
  { href: "/edits/hidden-gems", label: "Browse Hidden Gems instead" },
];

export default function OffersPage() {
  const pool = editProducts(editById["the-offer-edit"]);
  // Grid inserts: the deepest markdowns as hero pieces (the pool is sorted by discount), with the computed price edits between them.
  const tiles: Feature[] = ["under-1500", "under-3000"].map((id) => ({ kind: "tile", href: `/edits/${id}`, imgKey: `scenes/edit-${id}-tall`, title: editById[id].title, meta: editById[id].blurb, editId: id }));
  const features = interleave<Feature>([{ kind: "hero" }, { kind: "hero" }], tiles);
  return (
    <>
      <OffersTracker />
      <PageHeader crumbs={[{ name: "Home", href: "/" }, { name: "Offers" }]} eyebrow="The Offer Edit" title={<>Fewer sales. <em>Better ones.</em></>} intro="A discount appears only where a price has genuinely moved. Browse the markdowns, or take a code to your bag." />
      <Section y="none" className="pb-[var(--section-y)]" aria-labelledby="codes">
        <h2 id="codes" className="mb-5 text-[20px] font-semibold tracking-[-0.01em]">
          Coupon codes <span className="ml-1 text-[14px] font-normal text-ink-3">· simulated</span>
        </h2>
        <OfferCodes
          aside={
            <nav aria-label="Shortcuts" className="flex h-full flex-col justify-center gap-4 rounded-[var(--radius-sm)] border border-line-strong bg-sand p-5 sm:p-6">
              <p className="text-[17px] font-semibold">Shortcuts</p>
              <ul className="flex flex-wrap gap-2">
                {SHORTCUTS.map((s) => (
                  <li key={s.href}>
                    <ChipLink href={s.href}>{s.label}</ChipLink>
                  </li>
                ))}
              </ul>
            </nav>
          }
        />
      </Section>
      <Section y="none" className="border-t border-line pb-10 pt-[var(--section-y)] sm:pb-12">
        <SectionHeading level={2} eyebrow="The Offer Edit" title="The markdowns." />
      </Section>
      <Suspense fallback={<div className="container-x"><GridSkeleton count={8} /></div>}>
        <ProductListing pool={pool} scopeKey="offers" source="offers" hide={["offers"]} features={features} />
      </Suspense>
    </>
  );
}
