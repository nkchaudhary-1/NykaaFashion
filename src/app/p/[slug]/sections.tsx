import Link from "next/link";
import type { ReactNode } from "react";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { Img, SIZES } from "@/components/ui/Img";
import { products } from "@/data/catalog";
import { categories, categoryById } from "@/data/categories";
import { labelById } from "@/data/labels";
import { productsInCategory } from "@/data/queries";
import type { Product } from "@/data/types";
import { fromSameLabel, similarTo } from "@/lib/recs";

/**
 * The rails under the product, in the live page's order: Similar Products → Customers Also Viewed → More From {brand} → More From {category}.
 * Each section picks a different rhythm — a 4-up rail, a grey band of collage cards, a 4-up rail, a denser 6-up rail — and every rail keeps its
 * arrows in the heading (desktop) and swipes on touch.
 */

/** Section title on the page grid: the title in columns 1–6, controls (rail arrows) in 7–12. */
function RailHeading({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <div className="grid-main items-end gap-y-4">
      <h2 id={id} className="display-sm col-span-4 min-w-0 sm:col-span-12 lg:col-span-6 lg:row-start-1">
        {title}
      </h2>
      {children && <div className="col-span-4 flex items-center justify-end gap-6 sm:col-span-12 lg:col-span-6 lg:col-start-7 lg:row-start-1">{children}</div>}
    </div>
  );
}

/** Rail of product cards: heading + arrows + a swipeable track. `density="product"` is 4-up on desktop (3 columns each), `"tile"` 6-up (2 columns each). */
function Rail({ id, title, list, source, density = "product" }: { id: string; title: string; list: Product[]; source: string; density?: "product" | "tile" }) {
  return (
    <Carousel>
      <RailHeading id={id} title={title}>
        <CarouselArrows />
      </RailHeading>
      <div className="mt-6 sm:mt-8">
        <CarouselTrack label={title} density={density}>
          {list.map((p) => (
            <div key={p.id} className="flex h-full flex-col">
              <ProductCard product={p} source={source} sizes={density === "tile" ? SIZES.card : SIZES.rail} />
            </div>
          ))}
        </CarouselTrack>
      </div>
    </Carousel>
  );
}

/** Same-category pieces first, then the rest of the department. */
const similarOf = (p: Product) => similarTo(p, 8, (x) => x.categoryPath[0] === p.categoryPath[0]);
const sameCategory = (p: Product) => p.categoryPath.slice(0, 2).join("/");

// ── Similar Products: a 4-up rail, the heart on each image ──
export function SimilarProducts({ product }: { product: Product }) {
  const list = similarOf(product);
  if (list.length < 2) return null;
  return (
    <Section y="sm" tone="bone" aria-labelledby="similar" className="border-t border-line">
      <Rail id="similar" title="Similar Products" list={list} source="pdp-similar" />
    </Section>
  );
}

// ── Customers Also Viewed: a grey band of white collage cards, one per related category ──
const joinNames = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`);

export function CustomersAlsoViewed({ product }: { product: Product }) {
  const own = sameCategory(product);
  const groups = categories
    .filter((c) => c.parent === product.categoryPath[0])
    .map((c) => ({ c, items: productsInCategory(c.id).filter((p) => !p.soldOut && p.id !== product.id).sort((a, b) => a.rank - b.rank) }))
    .filter((g) => g.items.length >= 3)
    .sort((a, b) => Number(b.c.id === own) - Number(a.c.id === own) || b.items.length - a.items.length)
    .slice(0, 4);
  if (groups.length < 2) return null;
  return (
    <Section y="sm" tone="sand" aria-labelledby="also-viewed">
      <Carousel>
        <RailHeading id="also-viewed" title="Customers Also Viewed" />
        <div className="mt-6 sm:mt-8">
          <CarouselTrack label="Customers also viewed" density="product">
            {groups.map(({ c, items }) => {
              const names = [...new Set(items.map((p) => labelById[p.labelId].name))].slice(0, 3);
              return (
                <Link key={c.id} href={`/c/${c.id}`} className="group flex h-full flex-col bg-white p-3 transition-colors hover:bg-paper sm:p-4">
                  {/* one big picture and two small ones, the way the live cards collage a category */}
                  <div className="grid grid-cols-3 grid-rows-2 gap-2">
                    <div className="relative col-span-2 row-span-2 aspect-[4/5] overflow-hidden">
                      <Img imgKey={items[0].variants[0].images[0]} alt="" sizes={SIZES.rail} ratio="fill" className="absolute inset-0 h-full" />
                    </div>
                    {items.slice(1, 3).map((p) => (
                      <div key={p.id} className="relative overflow-hidden">
                        <Img imgKey={p.variants[0].images[0]} alt="" sizes="96px" ratio="fill" className="absolute inset-0 h-full" />
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[14px] font-bold leading-tight text-ink group-hover:text-pink">{categoryById[c.id]?.name ?? c.name}</p>
                  <p className="mt-1 line-clamp-1 text-[12.5px] text-ink-3">{joinNames(names)}</p>
                </Link>
              );
            })}
          </CarouselTrack>
        </div>
      </Carousel>
    </Section>
  );
}

// ── More From {brand}: a 4-up rail ──
export function MoreFromLabel({ product }: { product: Product }) {
  const label = labelById[product.labelId];
  const list = fromSameLabel(product, 8);
  if (list.length < 2) return null;
  return (
    <Section y="sm" tone="bone" aria-labelledby="more-label">
      <Rail id="more-label" title={`More From ${label.name}`} list={list} source="pdp-label" />
    </Section>
  );
}

// ── More From {category}: a denser 6-up rail, skipping what the rails above already show ──
export function MoreFromCategory({ product }: { product: Product }) {
  const cat = sameCategory(product);
  const shown = new Set([product.id, ...similarOf(product).map((p) => p.id), ...fromSameLabel(product, 8).map((p) => p.id)]);
  const list = products.filter((p) => !p.soldOut && sameCategory(p) === cat && !shown.has(p.id)).sort((a, b) => a.rank - b.rank).slice(0, 12);
  if (list.length < 3) return null;
  return (
    <Section y="sm" tone="paper" aria-labelledby="more-category" className="border-y border-line">
      <Rail id="more-category" title={`More From ${categoryById[cat]?.name ?? "this category"}`} list={list} source="pdp-category" density="tile" />
    </Section>
  );
}
