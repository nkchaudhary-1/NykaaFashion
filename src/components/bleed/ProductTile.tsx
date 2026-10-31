"use client";
import Link from "next/link";
import { Star } from "lucide-react";
import { SaveButton } from "@/components/product/SaveButton";
import { Badge } from "@/components/ui/Badge";
import { labelById } from "@/data/labels";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { captureFlip } from "@/lib/flip";
import { inr } from "@/lib/format";
import { Pic, Strip } from "./Wall";

/**
 * A product as a cell of the wall: the picture fills it; the heart sits in the corner; a flat strip at the foot carries the label, the name, the price (MRP struck, saving in green)
 * and the rating — everything a shopper decides on, visible without hovering, which is how phones see it. `reason` is the "why am I seeing this" chip in the feed.
 * The whole cell opens the product; the heart is a separate control (it never sits inside the link).
 */
export function ProductTile({ product: p, sizes, load, source = "wall", reason, feature }: { product: Product; sizes: string; load?: "eager"; source?: string; reason?: string; feature?: boolean }) {
  const label = labelById[p.labelId];
  const off = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  const href = `/p/${p.slug}`;
  const chip = reason ? <span className="inline-flex h-6 max-w-full items-center truncate bg-ink px-2.5 text-[10.5px] font-medium tracking-[0.02em] text-bone">{reason}</span> : null;
  return (
    <>
      <Link href={href} aria-hidden tabIndex={-1} draggable={false} data-cursor="View" onClick={(e) => captureFlip(p.id, e.currentTarget, 0, source)} className="absolute inset-0 block">
        <Pic imgKey={p.variants[0].images[0]} sizes={sizes} load={load} className={cn(p.soldOut && "opacity-60")} />
      </Link>
      <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">{p.soldOut ? <Badge tone="ink">Sold out</Badge> : p.isNew ? <Badge tone="light">New</Badge> : null}</div>
      <SaveButton product={p} source={source} className="absolute right-0 top-0" />
      <Strip chip={chip}>
        <Link href={href} draggable={false} onClick={(e) => captureFlip(p.id, e.currentTarget, 0, source)} className="block outline-offset-4">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-[10.5px] font-semibold uppercase leading-tight tracking-[0.12em]">
              {p.soldOut && <span className="sr-only">Sold out: </span>}
              {label.name}
            </span>
            {p.ratingCount >= 10 && (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] tabular-nums text-ink-2">
                <Star size={10} aria-hidden className="fill-ink stroke-ink" />
                <span className="sr-only">Rated </span>
                {p.rating.toFixed(1)}
                <span className="sr-only"> out of 5</span>
              </span>
            )}
          </span>
          <span className={cn("mt-0.5 block truncate text-ink-2", feature ? "text-[15px]" : "text-[13px]")}>{p.name}</span>
          <span className="mt-1 flex flex-wrap items-baseline gap-x-2 tabular-nums">
            <span className={cn("font-medium text-ink", feature ? "text-[16px]" : "text-[14px]")}>{inr(p.price)}</span>
            {off > 0 && (
              <>
                <span className="sr-only">, was {inr(p.mrp)}</span>
                <s aria-hidden className="text-[12px] text-ink-3">
                  {inr(p.mrp)}
                </s>
                <span className="text-[12px] font-medium text-emerald">{off}% off</span>
              </>
            )}
          </span>
        </Link>
      </Strip>
    </>
  );
}
