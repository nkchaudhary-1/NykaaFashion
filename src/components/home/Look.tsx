"use client";
import Link from "next/link";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { ShoppableImage } from "@/components/editorial/ShoppableImage";
import { Img } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { productById } from "@/data/catalog";
import { labelById } from "@/data/labels";
import type { Product, Story } from "@/data/types";
import { imgPins } from "@/lib/img";
import { setUI } from "@/stores/ui";
import { pad2 } from "./kit";

/*
 * Shop the look: a huge shoppable picture (eight columns, about 85% of the screen's height) with its hot-spot pins, and the pieces in it as a list in the other four
 * columns that stays on screen while the picture is in view. The crop is centred on the pins (object-position is shared with the pin layer, so they stay on their
 * spots). On tablets the list becomes three cards under the picture.
 */
export function ShopTheLook({ story }: { story: Story }) {
  const items = imgPins(story.cover.wide).map((p) => productById[p.id]).filter((p): p is Product => !!p);
  if (!items.length) return null;
  return (
    <Section tone="sand">
      <SectionHeading size="lg" eyebrow="Shop the look" title="Everything in the picture." intro="Tap a pin for a closer look, or pick a piece from the list — every look is built from things you can add without leaving the page." href={`/discover/${story.id}`} hrefLabel="Read the story" />
      <Grid className="mt-12 gap-y-8 sm:mt-16">
        <Col span={{ base: 4, sm: 12, lg: 8 }} className="relative aspect-[4/5] sm:aspect-[3/2] lg:aspect-auto lg:h-[clamp(560px,85svh,980px)]">
          <ShoppableImage imgKey={story.cover.wide} alt={`${story.title} — shop the pieces in this look`} sizes="(min-width:1024px) 66vw, 100vw" ratio="fill" position="58% 50%" className="h-full" />
        </Col>
        <Col span={{ base: 4, sm: 12, lg: 4 }} className="flex flex-col lg:sticky lg:top-[calc(var(--header-offset)+1.5rem)] lg:self-start lg:transition-[top] lg:duration-500 lg:ease-expo">
          <p className="eyebrow pb-4 text-ink-3">
            {story.kicker} · {story.title}
          </p>
          <ol aria-label="Pieces in this look" className="grid border-t border-ink sm:grid-cols-3 sm:gap-x-[var(--gap)] sm:border-t-0 lg:grid-cols-1 lg:border-t">
            {items.map((p, i) => (
              <li key={p.id} className="border-b border-line sm:border-b-0 lg:border-b">
                <div className="grid h-full grid-cols-4 gap-x-[var(--gap)] py-5 sm:grid-cols-1 sm:gap-y-3 sm:py-0 lg:grid-cols-4 lg:gap-y-0 lg:py-6">
                  <Link href={`/p/${p.slug}`} className="block overflow-hidden bg-sand" tabIndex={-1} aria-hidden>
                    <Img imgKey={p.variants[0].images[0]} alt="" sizes="(min-width:1024px) 8vw, (min-width:600px) 30vw, 22vw" ratio="4/5" />
                  </Link>
                  <div className="col-span-3 flex min-w-0 flex-col sm:col-span-1 lg:col-span-3">
                    <p className="eyebrow flex items-center gap-3 text-ink-3">
                      <span aria-hidden className="tabular-nums">
                        {pad2(i + 1)}
                      </span>
                      <span className="truncate">{labelById[p.labelId].name}</span>
                    </p>
                    <Link href={`/p/${p.slug}`} className="link-u mt-2 line-clamp-2 text-[16px] leading-snug">
                      {p.name}
                    </Link>
                    <Price price={p.price} mrp={p.mrp} size="md" className="mt-2" />
                    <button
                      type="button"
                      onClick={() => setUI({ quickView: { productId: p.id, variant: 0 } })}
                      className="tap mt-4 inline-flex h-10 items-center self-start border border-ink px-4 text-[11px] font-semibold uppercase tracking-[0.09em] transition-colors duration-300 hover:bg-ink hover:text-bone"
                      aria-label={`Quick view ${p.name}`}
                    >
                      Quick view
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Col>
      </Grid>
    </Section>
  );
}
