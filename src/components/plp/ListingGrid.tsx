"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { CELL, CardRise, GRID_CLASS } from "@/components/product/ProductGrid";
import { Img, SIZES } from "@/components/ui/Img";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import type { Product } from "@/data/types";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";
import type { Feature } from "./features";
import type { Cell } from "./plan";
import { themeSurface } from "./surfaces";

/**
 * The listing grid: 4-up cards (3-up on tablets, 2-up on phones) with feature inserts placed by `planCells` so every row
 * stays complete. Features are explicitly placed (column + row) at tablet and desktop, which lets the cards flow around
 * them in DOM order; on phones a feature is a full row. The first row is on screen when the page opens, so it is never
 * hidden; every later card rises by its column.
 */
export function ListingGrid({ cells, source }: { cells: Cell[]; source: string }) {
  return (
    <ul className={GRID_CLASS}>
      {cells.map((c) =>
        c.type === "card" ? (
          <li key={c.product.id} data-card={c.index} className={CELL}>
            <CardRise index={c.index} first={c.index < 4} className="h-full">
              <ProductCard product={c.product} source={source} load={c.index < 4 ? "eager" : undefined} />
            </CardRise>
          </li>
        ) : (
          <li
            key={c.key}
            data-feature
            style={{ "--rs": c.tablet?.row, "--rl": c.desktop?.row } as CSSProperties}
            className={cn(
              "min-w-0",
              c.phone ? "col-span-4" : "max-sm:hidden",
              c.tablet ? cn("sm:col-span-8 sm:row-span-2 sm:[grid-row-start:var(--rs)]", c.tablet.side === "L" ? "sm:col-start-1" : "sm:col-start-5") : "sm:max-lg:hidden",
              c.desktop ? cn("lg:col-span-6 lg:row-span-2 lg:[grid-row-start:var(--rl)]", c.desktop.side === "L" ? "lg:col-start-1" : "lg:col-start-7") : "lg:hidden",
            )}
          >
            <Reveal className="h-full" y={36}>
              <FeatureBody feature={c.feature} product={c.product} source={source} />
            </Reveal>
          </li>
        ),
      )}
    </ul>
  );
}

function FeatureBody({ feature, product, source }: { feature: Feature; product?: Product; source: string }) {
  if (feature.kind === "hero") {
    if (!product) return null;
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ProductCard product={product} source={`${source}:feature`} sizes={SIZES.half} fill className="flex-1" />
      </div>
    );
  }
  if (feature.kind === "tile") {
    const open = feature.editId
      ? () => {
          signal("edit_open", { editId: feature.editId });
          track("collection_open", { editId: feature.editId, source: `${source}:feature` });
        }
      : undefined;
    // a big silent picture (it fills the 6 × 2 box the grid gives it) with its caption on the page below, not over the picture
    return (
      <Link href={feature.href} onClick={open} className="group flex h-full flex-col">
        <div className="relative aspect-[5/4] overflow-hidden bg-sand sm:aspect-auto sm:min-h-0 sm:flex-1">
          <div data-nogrid className="absolute inset-0 transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.04] group-focus-visible:scale-[1.04]">
            <Img imgKey={feature.imgKey} alt="" sizes={SIZES.half} ratio="fill" position={feature.position ?? "50% 35%"} className="absolute inset-0 h-full" />
          </div>
        </div>
        <div className="flex items-start justify-between gap-6 pt-4">
          <div className="min-w-0">
            <p className="display-sm">{feature.title}</p>
            {feature.meta && <p className="mt-2.5 line-clamp-2 max-w-[46ch] text-[14px] leading-snug text-ink-2">{feature.meta}</p>}
          </div>
          <ArrowUpRight size={24} strokeWidth={1.4} aria-hidden className="mt-1 shrink-0 transition-transform duration-500 ease-expo group-hover:-translate-y-1 group-hover:translate-x-1" />
        </div>
      </Link>
    );
  }
  const surface = themeSurface(feature.tone);
  return (
    <div className={cn("flex h-full min-h-[300px] flex-col justify-between gap-8 p-6 sm:p-8 lg:p-12", surface.cls, surface.dark && "on-dark")}>
      {feature.eyebrow && <p className="eyebrow">{feature.eyebrow}</p>}
      <div>
        <p className="display-md max-w-[16ch]">{feature.title}</p>
        <p className="mt-5 line-clamp-6 max-w-[46ch] text-[15px] leading-relaxed">{feature.text}</p>
      </div>
      {feature.href && (
        <Link href={feature.href} className="link-u tap group inline-flex items-center gap-2 self-start text-[12px] font-semibold uppercase tracking-[0.09em]">
          {feature.cta ?? "Read more"}
          <ArrowRight size={15} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
