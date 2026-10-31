import type { Product } from "@/data/types";
import { Rise } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";
import { ProductCard } from "./ProductCard";

/**
 * The product grid on the page grid. Every product is one cell: 2-up on phones (2 of the 4 columns), 3-up on tablets
 * (4 of 12), 4-up on desktop (3 of 12) — so a listing lines up with every 4-up carousel on the site.
 * `GRID_CLASS` is the container, `CELL` the per-product span; compose feature tiles with their own `col-span-*` / `row-span-*`.
 */
export const GRID_CLASS = "grid-main gap-y-12 lg:gap-y-20";
export const LISTING_GRID = GRID_CLASS;
export const CELL = "col-span-2 min-w-0 sm:col-span-4 lg:col-span-3";

/*
 * Cards rise in as they enter the viewport, staggered by COLUMN (not by item index): the delay is `column × 85ms`, where the column is worked out per
 * breakpoint from the cell's position (2-up, 3-up, 4-up) — so row 20 arrives exactly as quickly as row 1. Class names are spelled out for Tailwind.
 */
const COL_BASE = ["[--c:0]", "[--c:1]"] as const;
const COL_SM = ["sm:[--c:0]", "sm:[--c:1]", "sm:[--c:2]"] as const;
const COL_LG = ["lg:[--c:0]", "lg:[--c:1]", "lg:[--c:2]", "lg:[--c:3]"] as const;
/** Classes that set `--rt-delay` from the cell's column at the current breakpoint (index = the cell's position in the grid). */
export const columnStagger = (i: number) => cn("[--rt-delay:calc(var(--c)*85ms)]", COL_BASE[i % 2], COL_SM[i % 3], COL_LG[i % 4]);

/** A card's entrance: the first row is already on screen when the page opens, so it is never hidden; every later card rises by its column. */
export function CardRise({ index, first, children, className }: { index: number; first?: boolean; children: React.ReactNode; className?: string }) {
  if (first) return <div className={className}>{children}</div>;
  return (
    <Rise y={36} className={cn(columnStagger(index), className)}>
      {children}
    </Rise>
  );
}

export function ProductGrid({ products, source = "grid", eagerCount = 4, className, columnsClass, cellClass, variantFor }: { products: Product[]; source?: string; eagerCount?: number; className?: string; columnsClass?: string; cellClass?: string; variantFor?: (p: Product) => number }) {
  return (
    <ul className={cn(columnsClass ?? GRID_CLASS, className)}>
      {products.map((p, i) => (
        <li key={p.id} className={cellClass ?? CELL}>
          <CardRise index={i} first={i < eagerCount} className="h-full">
            <ProductCard product={p} source={source} load={i < eagerCount ? "eager" : undefined} variant={variantFor?.(p) ?? 0} />
          </CardRise>
        </li>
      ))}
    </ul>
  );
}
