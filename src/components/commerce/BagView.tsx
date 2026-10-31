"use client";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { BagLineRow } from "@/components/commerce/BagLine";
import { BuyBar } from "@/components/commerce/BuyBar";
import { CouponOffers, CouponsAndOffers } from "@/components/commerce/CouponBox";
import { FreeShippingBar } from "@/components/commerce/FreeShippingBar";
import { PriceSummary } from "@/components/commerce/PriceSummary";
import { TrustStrip } from "@/components/commerce/TrustStrip";
import { Col, Grid } from "@/components/layout/Grid";
import { ListingHeader } from "@/components/plp/ListingHeader";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { EditTile } from "@/components/editorial/EditTile";
import { LinkButton } from "@/components/ui/Button";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { SIZES } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SimulatedNotice } from "@/components/ui/Simulated";
import { Skeleton } from "@/components/ui/Skeleton";
import { productById } from "@/data/catalog";
import { editById } from "@/data/edits";
import type { Product } from "@/data/types";
import { priceBag } from "@/lib/pricing";
import { popular, styleWith } from "@/lib/recs";
import { useHydrated, useStore } from "@/lib/store";
import { useBag, wishlistStore } from "@/stores/commerce";

const CRUMBS = [{ name: "Home", href: "/" }, { name: "Bag" }];

/** Two complements for what is in the bag — one per line in turn (never something already bagged), padded with what is popular. */
function complementsFor(ids: string[]): Product[] {
  const inBag = new Set(ids);
  const out: Product[] = [];
  const push = (p: Product) => {
    if (!inBag.has(p.id) && !out.some((o) => o.id === p.id)) out.push(p);
  };
  const per = ids.map((id) => productById[id]).filter(Boolean).map((p) => styleWith(p, 3));
  for (let i = 0; i < 3; i++) for (const list of per) if (list[i]) push(list[i]);
  popular(10).forEach(push);
  return out.slice(0, 2);
}

export function BagView() {
  const ready = useHydrated();
  const { lines, count, coupon } = useBag();
  const wishlist = useStore(wishlistStore);
  const price = priceBag(lines, { coupon });
  const blocked = lines.some((l) => l.stock === 0);
  const hasLines = ready && lines.length > 0;
  const key = lines.map((l) => l.productId).join(",");
  const complements = useMemo(() => complementsFor(key ? key.split(",") : []), [key]);

  // Below 1024px the buy bar sticks above the bottom navigation; tell the toast region how tall it is so toasts stack above it.
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current;
    if (!hasLines || !el) return;
    const mq = window.matchMedia("(max-width: 1023.98px)");
    const set = () => document.documentElement.style.setProperty("--sticky-h", mq.matches ? `${el.offsetHeight}px` : "0px");
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    mq.addEventListener("change", set);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", set);
      document.documentElement.style.removeProperty("--sticky-h");
    };
  }, [hasLines]);

  if (!ready) {
    return (
      <>
        <ListingHeader title="Your bag" crumbs={CRUMBS} />
        <BagSkeleton />
      </>
    );
  }

  if (lines.length === 0) {
    const saved = wishlist.map((w) => productById[w.productId]).filter(Boolean).slice(0, 8);
    return (
      <>
        <ListingHeader title="Your bag" crumbs={CRUMBS} />
        <EmptyBag saved={saved} />
      </>
    );
  }

  return (
    <>
      <ListingHeader title="Your bag" crumbs={CRUMBS} count={count} noun="pieces" intro="Offers and delivery are worked out below — nothing is charged." />

      {/* 8 / 4 — lines, then coupons and offers, on the left; a sticky Price Summary on the right (it spans both rows so it stays in view).
          Below 1024px the order is the live bag's: lines → Coupons and Offers → Price Summary → the buy bar. */}
      <div className="container-x pb-[var(--section-y)]">
        <Grid className="gap-y-10">
          <Col span={{ base: 4, sm: 12, lg: 8 }} start={{ lg: 1 }} rowStart={{ lg: 1 }}>
            <FreeShippingBar remaining={price.freeShippingRemaining} />
            <ul aria-label="Items in your bag" className="mt-4 border-t border-line">
              {lines.map((l) => (
                <BagLineRow key={l.id} line={l} />
              ))}
            </ul>
            <Link href="/edits" className="link-u tap mt-5 inline-flex items-center gap-2 text-[15px] font-semibold text-pink">
              Continue shopping <ArrowRight size={16} aria-hidden />
            </Link>
          </Col>

          <Col span={{ base: 4, sm: 6, lg: 8 }} start={{ lg: 1 }} rowStart={{ lg: 2 }}>
            <CouponsAndOffers lines={lines} applied={coupon} error={price.couponError} viewAll={{ href: "#offers" }} withInput />
            <CouponOffers lines={lines} applied={coupon} error={price.couponError} className="mt-10" />
          </Col>

          <Col span={{ base: 4, sm: 6, lg: 4 }} start={{ lg: 9 }} rowStart={{ lg: 1 }} rows={{ lg: 2 }}>
            <aside aria-label="Order summary" className="space-y-4 lg:sticky lg:top-[calc(var(--header-offset)+16px)] lg:transition-[top] lg:duration-500 lg:ease-editorial">
              <PriceSummary b={price} />
              {blocked && (
                <p role="alert" className="text-[13px] font-medium text-danger">
                  Remove the unavailable item to continue to checkout.
                </p>
              )}
              <div className="hidden lg:block">
                <LinkButton href="/checkout" size="lg" full aria-label="Checkout · Proceed to Buy" aria-disabled={blocked || undefined} tabIndex={blocked ? -1 : undefined} onClick={(e) => blocked && e.preventDefault()} iconRight={<ArrowRight size={16} aria-hidden />}>
                  Proceed to Buy
                </LinkButton>
              </div>
              <p className="flex items-center gap-1.5 text-[12.5px] text-ink-3 lg:justify-center">
                <ShieldCheck size={14} aria-hidden /> Simulated checkout — no payment is taken
              </p>
              <TrustStrip />
              <SimulatedNotice>Coupons, delivery fees and totals are computed with the prototype’s mock rules.</SimulatedNotice>
            </aside>
          </Col>
        </Grid>

        {/* phones & tablets: the savings toggle, the amount to pay and "Proceed to Buy" stay on screen, just above the bottom navigation */}
        <div ref={bar} className="sticky bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] z-30 -mx-[var(--gutter)] mt-10 border-t border-line-strong lg:hidden">
          <BuyBar price={price} blocked={blocked} />
        </div>
      </div>

      {/* Panel + 2 features: a different rhythm from the rails around it */}
      {complements.length > 0 && (
        <Section tone="paper" className="border-y border-line">
          <Grid className="gap-y-10">
            <Col span={{ base: 4, sm: 12, lg: 4 }} className="flex flex-col">
              <p className="eyebrow text-ink-3">Goes with your bag</p>
              <h2 className="display-md mt-5">Complete your order.</h2>
              <p className="mt-4 max-w-[36ch] text-[15px] leading-relaxed text-ink-2">Pieces chosen to sit with what you’ve picked — same occasions, same eye for detail.</p>
              <LinkButton href="/edits" variant="secondary" size="lg" className="mt-8 self-start" iconRight={<ArrowRight size={16} />}>
                Explore the edits
              </LinkButton>
            </Col>
            {complements.map((p) => (
              <Col key={p.id} span={{ base: 2, sm: 6, lg: 4 }}>
                <ProductCard product={p} source="bag-complete" sizes={SIZES.half} />
              </Col>
            ))}
          </Grid>
        </Section>
      )}
      <RecentlyViewed />
    </>
  );
}

const SHORTCUTS = ["new-in", "hidden-gems", "the-offer-edit", "under-1500"];

/** Empty bag: a typographic message (columns 1–6) beside a 2×2 of edits (8–12), then a rail of what you saved (or what is popular). */
function EmptyBag({ saved }: { saved: Product[] }) {
  const list = saved.length ? saved : popular(8);
  const label = saved.length ? "From your wishlist" : "Popular right now";
  return (
    <>
      <div className="container-x pb-[var(--section-y)]">
        <Grid className="gap-y-14 border-t border-ink pt-10 sm:pt-14">
          <Col span={{ base: 4, sm: 12, lg: 6 }} className="flex flex-col gap-10 lg:sticky lg:top-[calc(var(--header-offset)+24px)] lg:self-start">
            <div>
              <p className="eyebrow text-ink-3">Nothing here yet</p>
              <h2 className="display-lg mt-6">Your bag is empty</h2>
              <p className="mt-6 max-w-[38ch] text-[15px] leading-relaxed text-ink-2">Start from an edit, or pick up where you left off.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/edits" size="lg">Explore the edits</LinkButton>
              <LinkButton href="/discover" variant="secondary" size="lg">Read the Style Files</LinkButton>
            </div>
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 5 }} start={{ lg: 8 }} className="grid grid-cols-2 gap-x-[var(--gap)] gap-y-8">
            {SHORTCUTS.map((id) => (
              <EditTile key={id} edit={editById[id]} source="bag-empty" ratio="4/5" sizes="(min-width:1024px) 20vw, 45vw" />
            ))}
          </Col>
        </Grid>
      </div>
      <Section tone="paper" className="border-y border-line">
        <Carousel>
          <SectionHeading size="lg" eyebrow={saved.length ? "Saved for later" : "Start here"} title={`${label}.`}>
            <CarouselArrows />
          </SectionHeading>
          <div className="mt-12">
            <CarouselTrack label={label} density="product">
              {list.map((p) => (
                <div key={p.id} className="flex h-full flex-col">
                  <ProductCard product={p} source="bag-empty" sizes={SIZES.rail} />
                </div>
              ))}
            </CarouselTrack>
          </div>
        </Carousel>
      </Section>
    </>
  );
}

function BagSkeleton() {
  return (
    <div className="container-x pb-16" role="status" aria-label="Loading your bag">
      <Grid className="gap-y-10">
        <Col span={{ base: 4, sm: 12, lg: 8 }}>
          <Skeleton className="h-[72px] w-full" />
          <div className="mt-6 border-t border-ink">
            {[0, 1].map((i) => (
              <div key={i} className="grid grid-cols-4 gap-x-[var(--gap)] border-b border-line py-6 sm:grid-cols-12 lg:grid-cols-8">
                <div className="col-span-1 sm:col-span-2">
                  <Skeleton className="aspect-[4/5]" />
                </div>
                <div className="col-span-3 space-y-3 sm:col-span-10 lg:col-span-6">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </Col>
        <Col span={{ base: 4, sm: 12, lg: 4 }} start={{ lg: 9 }} rowStart={{ lg: 1 }}>
          <Skeleton className="h-72 w-full" />
        </Col>
      </Grid>
    </div>
  );
}
