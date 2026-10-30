"use client";
import { Heart, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { EditTile } from "@/components/editorial/EditTile";
import { Col, Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { CELL, GRID_CLASS } from "@/components/product/ProductGrid";
import { Button, LinkButton } from "@/components/ui/Button";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { SIZES } from "@/components/ui/Img";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { productById } from "@/data/catalog";
import { primaryEdits } from "@/data/edits";
import type { Product } from "@/data/types";
import { plural } from "@/lib/format";
import { popular, similarTo } from "@/lib/recs";
import { useHydrated } from "@/lib/store";
import { removeFromWishlist, useWishlist } from "@/stores/commerce";
import { setUI, toast } from "@/stores/ui";

const CRUMBS = [{ name: "Home", href: "/" }, { name: "Wishlist" }];
const HEADER = "pb-8 sm:pb-10";

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

export function WishlistView() {
  const ready = useHydrated();
  const items = useWishlist();
  const rows = items.map((i) => ({ item: i, product: productById[i.productId] })).filter((r) => r.product);
  const key = rows.map((r) => r.product.id).join(",");
  const more = useMemo(() => moreLike(key ? key.split(",") : []), [key]);

  if (!ready) {
    return (
      <>
        <PageHeader title="Your wishlist" size="md" crumbs={CRUMBS} className={HEADER} />
        <div className="container-x pb-[var(--section-y)]" role="status" aria-label="Loading your wishlist">
          <div className={GRID_CLASS}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={CELL}>
                <CardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (rows.length === 0) return <EmptyWishlist />;

  return (
    <>
      <PageHeader
        title="Your wishlist"
        size="md"
        crumbs={CRUMBS}
        className={HEADER}
        intro={`${plural(rows.length, "saved piece")}, kept on this device. Pick a size to move one to your bag — sold-out pieces can notify you.`}
      />

      {/* Uniform 4-up grid: span-3 cards on desktop, 3-up on tablets, 2-up on phones — the same cells as every listing */}
      <div className="container-x pb-[var(--section-y)]">
        <h2 className="sr-only">Saved pieces</h2>
        <ul className={GRID_CLASS}>
          {rows.map(({ item, product }, i) => (
            <li key={product.id} className={CELL}>
              <Reveal delay={(i % 4) * 70} className="h-full">
                <ProductCard
                  product={product}
                  variant={item.variant}
                  source="wishlist"
                  load={i < 4 ? "eager" : undefined}
                  hideQuickView
                  footer={
                    <div className="mt-3 flex gap-2">
                      {product.soldOut ? (
                        <Button variant="secondary" size="sm" full onClick={() => setUI({ notifyMe: { productId: product.id } })}>
                          Notify me
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" full onClick={() => setUI({ quickView: { productId: product.id, variant: item.variant } })}>
                          Move to bag
                        </Button>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${product.name} from wishlist`}
                        onClick={() => (removeFromWishlist(product.id), toast({ title: "Removed from wishlist", description: product.name }))}
                        className="tap inline-flex size-9 shrink-0 items-center justify-center border border-line-strong text-ink-2 transition-colors hover:border-danger hover:text-danger [@media(pointer:coarse)]:size-11"
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>
                  }
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>

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
    </>
  );
}

/** Nothing saved: a horizontal message band, three edits as 4 / 4 / 4 tiles, then a rail of what is popular. */
function EmptyWishlist() {
  const picks = popular(8);
  return (
    <>
      <PageHeader title="Your wishlist" size="md" crumbs={CRUMBS} className={HEADER} />
      <div className="container-x">
        <Grid className="items-center gap-y-8 bg-pink-tint px-0 py-8 sm:py-10">
          <Col span={{ base: 4, sm: 12, lg: 6 }} className="px-6 sm:px-10">
            <Heart size={36} strokeWidth={1.1} aria-hidden className="text-pink" />
            <h2 className="display-md mt-6">Nothing saved yet</h2>
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
