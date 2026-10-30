"use client";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { useMemo, type MouseEvent } from "react";
import { EditTile } from "@/components/editorial/EditTile";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { CELL } from "@/components/product/ProductGrid";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { Img, SIZES } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { productById } from "@/data/catalog";
import { primaryEdits } from "@/data/edits";
import { labelById } from "@/data/labels";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { plural } from "@/lib/format";
import { popular, similarTo } from "@/lib/recs";
import { useHydrated } from "@/lib/store";
import { removeFromWishlist, useWishlist, type WishlistItem } from "@/stores/commerce";
import { setUI, toast } from "@/stores/ui";

/** Things like what you saved — one per saved piece in turn, never something already saved, padded with what is popular. */
function moreLike(ids: string[]): Product[] {
  const saved = new Set(ids);
  const out: Product[] = [];
  const push = (p: Product) => {
    if (!saved.has(p.id) && !out.some((o) => o.id === p.id)) out.push(p);
  };
  const per = ids.map((id) => productById[id]).filter(Boolean).map((p) => similarTo(p, 6, (x) => !saved.has(x.id)));
  for (let i = 0; i < 6; i++) for (const list of per) if (list[i]) push(list[i]);
  popular(12).forEach(push);
  return out.slice(0, 8);
}

/** "My wishlist · 6 products" — the live heading: a semibold title with a small grey count. */
function Heading({ count }: { count?: number }) {
  return (
    <div className="container-x pb-6 pt-8 sm:pb-8 sm:pt-10">
      <h1 className="flex flex-wrap items-baseline gap-x-2.5 text-[26px] font-semibold leading-tight tracking-[-0.015em]">
        My wishlist
        {count !== undefined && count > 0 && <span className="text-[14px] font-normal tracking-normal text-ink-3">· {plural(count, "product")}</span>}
      </h1>
    </div>
  );
}

const cardBtn = "inline-flex h-9 w-full items-center justify-center rounded-[var(--radius-sm)] border border-line-strong bg-white text-[14px] font-semibold text-ink transition-colors hover:border-ink [@media(pointer:coarse)]:h-11";

/**
 * A wishlist card as on the live site: a 1px-bordered tile, the image with a small round ✕ at its top-right, the brand in regular
 * weight, a one-line title, the price with its struck MRP and green saving, and a full-width outline "Move to Bag" inside the card.
 * The saved colour is the one shown. (Sold-out pieces offer "Notify me" instead.)
 */
function WishlistCard({ product: p, item, eager }: { product: Product; item: WishlistItem; eager?: boolean }) {
  const v = p.variants[Math.min(item.variant, p.variants.length - 1)];
  const href = `/p/${p.slug}`;
  // The card (and this button with it) is about to leave: hand focus to its neighbour's ✕, or to the page when it was the last one.
  const remove = (e: MouseEvent<HTMLButtonElement>) => {
    const li = e.currentTarget.closest("li");
    const next = li?.nextElementSibling ?? li?.previousElementSibling;
    const target = (next?.querySelector<HTMLElement>('button[aria-label^="Remove"]') ?? document.getElementById("main")) as HTMLElement | null;
    removeFromWishlist(p.id);
    toast({ title: "Removed from wishlist", description: p.name });
    requestAnimationFrame(() => target?.focus({ preventScroll: true }));
  };
  return (
    <article className="flex h-full flex-col border border-line bg-white">
      <div className="relative">
        <Link href={href} aria-hidden tabIndex={-1} draggable={false} className="block">
          <Img imgKey={v.images[0]} alt="" sizes={SIZES.card} ratio="4/5" load={eager ? "eager" : undefined} className={cn(p.soldOut && "opacity-60")} />
        </Link>
        {p.soldOut && <Badge tone="ink" className="absolute left-2 top-2">Sold out</Badge>}
        {/* a round grey ✕ (inline radius: a circle by nature; the global control radius would otherwise win over a utility class) */}
        <button
          type="button"
          aria-label={`Remove ${p.name} from wishlist`}
          onClick={remove}
          style={{ borderRadius: "50%" }}
          className="tap absolute right-2 top-2 inline-flex size-7 items-center justify-center bg-sand text-ink-2 transition-colors hover:bg-stone hover:text-ink"
        >
          <X size={14} strokeWidth={2.2} aria-hidden />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <Link href={href} draggable={false} className="block min-w-0 outline-offset-4">
          <p className="truncate text-[14px] text-ink">{p.soldOut && <span className="sr-only">Sold out: </span>}{labelById[p.labelId].name}</p>
          <h3 className="mt-0.5 truncate text-[13px] font-normal text-ink-2">{p.name}</h3>
          <Price price={p.price} mrp={p.mrp} size="sm" className="mt-1.5" />
        </Link>
        <div className="mt-auto pt-3">
          {p.soldOut ? (
            <button type="button" className={cardBtn} onClick={() => setUI({ notifyMe: { productId: p.id } })}>Notify me</button>
          ) : (
            <button type="button" className={cardBtn} onClick={() => setUI({ quickView: { productId: p.id, variant: item.variant } })}>Move to Bag</button>
          )}
        </div>
      </div>
    </article>
  );
}

/** Skeleton cards in the same shape while the list loads: image block, three bars, a button block. */
function WishlistSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div role="status" aria-label="Loading your wishlist" className="container-x pb-[var(--section-y)]">
      <ul className="grid-main gap-y-5">
        {Array.from({ length: n }).map((_, i) => (
          <li key={i} className={CELL}>
            <div aria-hidden className="border border-line bg-white">
              <Skeleton className="aspect-[4/5] w-full" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="mt-3 h-9 w-full" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "More to love": a rail of pieces like the saved ones. It takes the saved ids as one string, so it only recomputes when the list changes. */
function MoreToLove({ ids }: { ids: string }) {
  const more = useMemo(() => moreLike(ids ? ids.split(",") : []), [ids]);
  return (
    <Section tone="paper" className="border-y border-line">
      <Carousel>
        <SectionHeading eyebrow="Based on your saves" title="More to love.">
          <CarouselArrows />
        </SectionHeading>
        <div className="mt-10">
          <CarouselTrack label="More to love" density="product">
            {more.map((p) => (
              <div key={p.id} className="flex h-full flex-col">
                <ProductCard product={p} source="wishlist-more" sizes={SIZES.rail} />
              </div>
            ))}
          </CarouselTrack>
        </div>
      </Carousel>
    </Section>
  );
}

export function WishlistView() {
  const ready = useHydrated();
  const items = useWishlist();
  const rows = items.map((i) => ({ item: i, product: productById[i.productId] })).filter((r) => r.product);

  if (!ready) {
    return (
      <>
        <Heading />
        <WishlistSkeleton />
      </>
    );
  }

  if (rows.length === 0) return <EmptyWishlist />;

  return (
    <>
      <Heading count={rows.length} />

      {/* Uniform 4-up grid of bordered cards: span-3 on desktop, 3-up on tablets, 2-up on phones — the same cells as every listing */}
      <div className="container-x pb-[var(--section-y)]">
        <h2 className="sr-only">Saved pieces</h2>
        <ul className="grid-main gap-y-5">
          {rows.map(({ item, product }, i) => (
            <li key={product.id} className={CELL}>
              <WishlistCard product={product} item={item} eager={i < 4} />
            </li>
          ))}
        </ul>
      </div>

      <MoreToLove ids={rows.map((r) => r.product.id).join(",")} />
    </>
  );
}

/** Nothing saved: a horizontal message band, three edits as 4 / 4 / 4 tiles, then a rail of what is popular. */
function EmptyWishlist() {
  const picks = popular(8);
  return (
    <>
      <Heading />
      <div className="container-x">
        <Grid className="items-center gap-y-8 rounded-[var(--radius-md)] bg-pink-tint px-0 py-8 sm:py-10">
          <Col span={{ base: 4, sm: 12, lg: 6 }} className="px-6 sm:px-10">
            <Heart size={36} strokeWidth={1.1} aria-hidden className="text-pink" />
            <h2 className="mt-5 text-[28px] font-bold leading-tight tracking-[-0.025em]">Nothing saved yet</h2>
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 6 }} className="px-6 sm:px-10 lg:pl-0">
            <p className="max-w-[46ch] text-[15px] leading-relaxed text-ink-2">Tap the heart on anything you love and it will wait for you here. Start with an edit — someone has already done the choosing.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/discover" size="lg">Read the Style Files</LinkButton>
              <LinkButton href="/edits" variant="secondary" size="lg">Explore the edits</LinkButton>
            </div>
          </Col>
        </Grid>
      </div>

      <Section>
        <p className="eyebrow text-ink-3">Start here</p>
        <h2 className="display-sm mt-4">Three edits worth saving from.</h2>
        <Grid className="mt-10 gap-y-10 sm:mt-12">
          {primaryEdits.slice(0, 3).map((e) => (
            <Col key={e.id} span={{ base: 4, sm: 6, lg: 4 }}>
              <EditTile edit={e} source="wishlist-empty" sizes="(min-width:1024px) 33vw, (min-width:600px) 50vw, 100vw" />
            </Col>
          ))}
        </Grid>
      </Section>

      <Section tone="paper" className="border-y border-line">
        <Carousel>
          <SectionHeading eyebrow="Popular" title="Popular right now.">
            <CarouselArrows />
          </SectionHeading>
          <div className="mt-10">
            <CarouselTrack label="Popular right now" density="product">
              {picks.map((p) => (
                <div key={p.id} className="flex h-full flex-col">
                  <ProductCard product={p} source="wishlist-empty" sizes={SIZES.rail} />
                </div>
              ))}
            </CarouselTrack>
          </div>
        </Carousel>
      </Section>
    </>
  );
}
