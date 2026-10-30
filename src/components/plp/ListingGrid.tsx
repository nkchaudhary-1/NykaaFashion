"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { CELL, GRID_CLASS } from "@/components/product/ProductGrid";
import { BentoTile } from "@/components/ui/BentoTile";
import { SIZES } from "@/components/ui/Img";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import type { Product } from "@/data/types";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";
import type { Feature } from "./features";
import type { Cell } from "./plan";

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * The listing grid: 4-up cards (3-up on tablets, 2-up on phones) with feature inserts placed by `planCells` so every row
 * stays complete. Features are explicitly placed (column + row) at tablet and desktop, which lets the cards flow around
 * them in DOM order; on phones a feature is a full row.
 */
export function ListingGrid({ cells, source }: { cells: Cell[]; source: string }) {
  return (
    <ul className={GRID_CLASS}>
      {cells.map((c) =>
        c.type === "card" ? (
          <li key={c.product.id} data-card={c.index} className={CELL}>
            <Reveal delay={(c.index % 4) * 70} className="h-full">
              <ProductCard product={c.product} source={source} load={c.index < 4 ? "eager" : undefined} />
            </Reveal>
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
            <Reveal className="h-full">
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
    return (
      <div className="relative aspect-[5/4] h-full sm:aspect-auto">
        <BentoTile href={feature.href} imgKey={feature.imgKey} title={feature.title} meta={feature.meta} ratio="fill" sizes={SIZES.half} size="lg" position={feature.position ?? "50% 35%"} onClick={open} />
      </div>
    );
  }
  const dark = lum(feature.bg) < 0.28;
  const long = feature.text.length > 110;
  return (
    <figure className={cn("flex h-full min-h-[320px] flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10", dark && "on-dark")} style={{ background: feature.bg, color: feature.fg }}>
      {feature.eyebrow && <figcaption className="eyebrow">{feature.eyebrow}</figcaption>}
      <blockquote className={cn("max-w-[34ch]", long ? "text-[20px] font-medium leading-[1.25] tracking-[-0.018em] sm:text-[22px] lg:text-[24px]" : "display-sm")}>{long ? feature.text : `“${feature.text}”`}</blockquote>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[13px]">
        {feature.by && <p className="font-medium">{feature.by}</p>}
        {feature.href && (
          <Link href={feature.href} className="link-u tap group inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]">
            {feature.cta ?? "Read more"}
            <ArrowRight size={15} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </figure>
  );
}
