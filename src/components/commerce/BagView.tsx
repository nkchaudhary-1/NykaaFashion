"use client";
import Link from "next/link";
import { ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";
import { BagLineRow } from "@/components/commerce/BagLine";
import { CouponBox } from "@/components/commerce/CouponBox";
import { FreeShippingBar } from "@/components/commerce/FreeShippingBar";
import { PriceSummary } from "@/components/commerce/PriceSummary";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { ProductRail } from "@/components/product/Rail";
import { LinkButton } from "@/components/ui/Button";
import { SimulatedNotice } from "@/components/ui/Simulated";
import { EmptyState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { productById } from "@/data/catalog";
import { inr } from "@/lib/format";
import { priceBag } from "@/lib/pricing";
import { popular } from "@/lib/recs";
import { useHydrated, useStore } from "@/lib/store";
import { useBag, wishlistStore } from "@/stores/commerce";

export function BagView() {
  const ready = useHydrated();
  const { lines, coupon } = useBag();
  const wishlist = useStore(wishlistStore);
  const price = priceBag(lines, { coupon });
  const blocked = lines.some((l) => l.stock === 0);

  if (!ready) {
    return (
      <div className="container-x grid gap-12 pb-16 lg:grid-cols-[minmax(0,1fr)_400px]" role="status" aria-label="Loading your bag">
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="aspect-[4/5] w-[110px]" />
              <div className="flex-1 space-y-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/3" /></div>
            </div>
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (lines.length === 0) {
    const saved = wishlist.map((w) => productById[w.productId]).filter(Boolean).slice(0, 8);
    return (
      <>
        <EmptyState
          visual={<ShoppingBag size={44} strokeWidth={1} className="mx-auto text-ink-3" aria-hidden />}
          title="Your bag is empty"
          text="Nothing here yet. Start from an edit, or pick up where you left off."
          actions={
            <>
              <LinkButton href="/edits" size="lg">Explore the edits</LinkButton>
              <LinkButton href="/discover" variant="secondary" size="lg">Read the Style Files</LinkButton>
            </>
          }
        />
        <div className="container-x pb-20">
          <h2 className="display-sm mb-8">{saved.length ? "From your wishlist" : "Popular right now"}</h2>
          <ProductRail products={saved.length ? saved : popular(8)} label={saved.length ? "From your wishlist" : "Popular right now"} source="bag-empty" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container-x grid gap-12 pb-16 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-20">
        <div>
          <FreeShippingBar remaining={price.freeShippingRemaining} />
          <ul className="mt-6">
            {lines.map((l) => (
              <BagLineRow key={l.id} line={l} />
            ))}
          </ul>
          <Link href="/edits" className="link-u mt-6 inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em]">
            Continue shopping <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        <aside aria-label="Order summary" className="space-y-5 lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <CouponBox lines={lines} applied={coupon} error={price.couponError} />
          <section aria-labelledby="sum-h" className="border border-line bg-paper p-5">
            <h2 id="sum-h" className="mb-3 text-[14px] font-medium">Order summary</h2>
            <PriceSummary b={price} />
            {blocked && <p role="alert" className="mt-4 text-[13px] font-medium text-danger">Remove the unavailable item to continue to checkout.</p>}
            <LinkButton href="/checkout" size="lg" full className="mt-5" aria-disabled={blocked} tabIndex={blocked ? -1 : undefined} onClick={(e) => blocked && e.preventDefault()} iconRight={<ArrowRight size={16} />}>
              Checkout · {inr(price.total)}
            </LinkButton>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-ink-3"><ShieldCheck size={14} aria-hidden /> Simulated checkout — no payment is taken</p>
          </section>
          <SimulatedNotice>Coupons, delivery fees and totals are computed with the prototype’s mock rules.</SimulatedNotice>
        </aside>
      </div>
      <RecentlyViewed />
    </>
  );
}
