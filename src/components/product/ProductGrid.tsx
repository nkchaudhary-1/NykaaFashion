import type { Product } from "@/data/types";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { ProductCard } from "./ProductCard";

/**
 * The product grid on the page grid. Every product is one cell: 2-up on phones (2 of the 4 columns), 3-up on tablets
 * (4 of 12), 4-up on desktop (3 of 12) — so a listing lines up with every 4-up carousel on the site.
 * `GRID_CLASS` is the container, `CELL` the per-product span; compose feature tiles with their own `col-span-*` / `row-span-*`.
 */
export const GRID_CLASS = "grid-main gap-y-10 lg:gap-y-14";
export const LISTING_GRID = GRID_CLASS;
export const CELL = "col-span-2 min-w-0 sm:col-span-4 lg:col-span-3";

export function ProductGrid({ products, source = "grid", eagerCount = 4, className, columnsClass, cellClass, variantFor }: { products: Product[]; source?: string; eagerCount?: number; className?: string; columnsClass?: string; cellClass?: string; variantFor?: (p: Product) => number }) {
  return (
    <ul className={cn(columnsClass ?? GRID_CLASS, className)}>
      {products.map((p, i) => (
        <li key={p.id} className={cellClass ?? CELL}>
          <Reveal delay={(i % 4) * 70} className="h-full">
            <ProductCard product={p} source={source} load={i < eagerCount ? "eager" : undefined} variant={variantFor?.(p) ?? 0} />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
