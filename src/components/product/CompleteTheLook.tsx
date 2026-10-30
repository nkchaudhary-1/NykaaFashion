"use client";
import { Heart, Plus } from "lucide-react";
import { Fragment } from "react";
import { Button } from "@/components/ui/Button";
import { SIZES } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Product } from "@/data/types";
import { inr } from "@/lib/format";
import { styleWith } from "@/lib/recs";
import { track } from "@/lib/track";
import { toggleWishlist, wishlistStore } from "@/stores/commerce";
import { toast } from "@/stores/ui";
import { ProductCard } from "./ProductCard";

/** "Complete the look" (PRD §5.5 styling context): complementary pieces matched on occasion, each a quick-add away. */
export function CompleteTheLook({ product }: { product: Product }) {
  const pieces = styleWith(product, 3);
  if (pieces.length === 0) return null;
  const look = [product, ...pieces];
  const total = look.reduce((n, p) => n + p.price, 0);
  const saveAll = () => {
    const saved = new Set(wishlistStore.get().map((i) => i.productId));
    let n = 0;
    for (const p of look) {
      if (saved.has(p.id)) continue;
      toggleWishlist(p.id, 0, "look");
      n++;
    }
    track("product_save", { source: "complete-the-look", count: n });
    toast({ title: n ? `Saved ${n} pieces to your wishlist` : "Already in your wishlist", action: { label: "View", href: "/wishlist" } });
  };
  return (
    <section aria-labelledby="ctl" className="container-x py-16 sm:py-24">
      <SectionHeading level={2} eyebrow="Styling" title={<span id="ctl">Complete the look.</span>} intro="Pieces that share an occasion and a point of view with this one." />
      <ul className="mt-10 grid grid-cols-2 items-start gap-x-3 gap-y-8 lg:grid-cols-[repeat(4,minmax(0,1fr))] lg:gap-x-5">
        {look.map((p, i) => (
          <Fragment key={p.id}>
            <li className="relative">
              {i === 0 && <p className="eyebrow absolute -top-6 left-0 text-ink-3">This piece</p>}
              <ProductCard product={p} source="complete-the-look" sizes={SIZES.cardWide} hideQuickView={i === 0} />
              {i < look.length - 1 && (
                <span aria-hidden className="absolute -right-3 top-[34%] z-10 hidden size-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-line-strong bg-bone lg:inline-flex">
                  <Plus size={13} />
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <p className="text-[14px] text-ink-2">
          The whole look: <strong className="text-[18px] font-medium tabular-nums text-ink">{inr(total)}</strong>
        </p>
        <Button variant="secondary" icon={<Heart size={15} />} onClick={saveAll}>
          Save the look
        </Button>
      </div>
    </section>
  );
}
