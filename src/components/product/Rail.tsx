"use client";
import type { ReactNode } from "react";
import { Carousel, CarouselArrows, CarouselTrack, type CarouselDensity } from "@/components/ui/Carousel";
import { SIZES } from "@/components/ui/Img";
import { cn } from "@/lib/cn";
import type { Product } from "@/data/types";
import { ProductCard } from "./ProductCard";

/**
 * A self-contained horizontal rail: flat arrows above (desktop), swipe on touch, items on the page grid (see ui/Carousel).
 * Sections that want the arrows in their own header compose <Carousel>, <CarouselArrows> and <CarouselTrack> directly.
 */
export function Rail({ children, label, className, density = "product", arrows = true }: { children: ReactNode[]; label: string; className?: string; density?: CarouselDensity; arrows?: boolean }) {
  return (
    <Carousel>
      <div className={className}>
        {arrows && <CarouselArrows className="mb-5 justify-end" />}
        <CarouselTrack label={label} density={density}>
          {children}
        </CarouselTrack>
      </div>
    </Carousel>
  );
}

export function ProductRail({ products, label, source, reasons, arrows }: { products: Product[]; label: string; source: string; reasons?: Record<string, string>; arrows?: boolean }) {
  return (
    <Rail label={label} arrows={arrows}>
      {products.map((p) => (
        <div key={p.id} className={cn("flex h-full flex-col")}>
          <ProductCard product={p} source={source} sizes={SIZES.rail} />
          {reasons?.[p.id] && <p className="mt-2 text-[12px] leading-snug text-ink-3">{reasons[p.id]}</p>}
        </div>
      ))}
    </Rail>
  );
}
