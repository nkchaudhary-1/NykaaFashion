import type { Product } from "@/data/types";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { ProductCard } from "./ProductCard";

/** Listing pages share the row with a 250px filter rail: 2 → 3 → 4 → 5 columns. */
export const LISTING_GRID = "grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-4 lg:gap-x-5 lg:gap-y-12 xl:grid-cols-4 2xl:grid-cols-5";
export const GRID_CLASS = "grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-12";

export function ProductGrid({ products, source = "grid", eagerCount = 4, className, columnsClass, variantFor }: { products: Product[]; source?: string; eagerCount?: number; className?: string; columnsClass?: string; variantFor?: (p: Product) => number }) {
  return (
    <ul className={cn(columnsClass ?? GRID_CLASS, className)}>
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <Reveal delay={(i % 4) * 70} className="h-full">
            <ProductCard product={p} source={source} load={i < eagerCount ? "eager" : undefined} variant={variantFor?.(p) ?? 0} />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
