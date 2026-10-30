import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Suspense } from "react";
import { OffersTracker } from "@/components/editorial/Trackers";
import { OfferCodes } from "@/components/commerce/OfferCodes";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { interleave, type Feature } from "@/components/plp/features";
import { ProductListing } from "@/components/plp/ProductListing";
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
        <h2 id="codes" className="eyebrow mb-5 text-ink-3">
          Coupon codes · simulated
        </h2>
        <OfferCodes
          aside={
            <nav aria-label="Shortcuts" className="on-dark flex h-full min-h-[220px] flex-col justify-between gap-8 bg-ink p-5 text-bone sm:p-6">
              <p className="eyebrow">Shortcuts</p>
              <ul>
                {SHORTCUTS.map((s) => (
                  <li key={s.href} className="border-t border-bone/30 first:border-t-0">
                    <Link href={s.href} className="group flex min-h-12 items-center justify-between gap-4 text-[15px] font-medium">
                      <span className="link-u">{s.label}</span>
                      <ArrowRight size={16} aria-hidden className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
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
