"use client";
import { Eye } from "lucide-react";
import Link from "next/link";
import { Col, Grid } from "@/components/layout/Grid";
import { Img } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { productById } from "@/data/catalog";
import { labelById } from "@/data/labels";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { imgPins } from "@/lib/img";
import { setUI } from "@/stores/ui";
import { SaveButton } from "@/components/product/SaveButton";

/**
 * "Shop this look" — an always-visible product list for a shoppable image (works on touch, where hover pins don't).
 * `row` (default) lays the pieces out across the page grid, 3 or 2 to a row, under a wide image;
 * `stack` is a single column for the 4-column side of an 8 + 4 look (and spreads across the page below desktop).
 */
export function LookStrip({ imgKey, title = "In this image", label, variant = "row", className }: { imgKey: string; title?: string; label?: string; variant?: "row" | "stack"; className?: string }) {
  const items = imgPins(imgKey)
    .map((p) => productById[p.id])
    .filter((p): p is Product => !!p);
  if (!items.length) return null;
  const stack = variant === "stack";
  const span = items.length === 2 ? 6 : 4;
  const list = items.map((p) => <LookItem key={p.id} product={p} stack={stack} />);
  // `stack` is one column beside an 8-column image on desktop; below that the pieces sit across the page like the row variant
  const across = items.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";
  return (
    <section aria-label={label ?? title} className={cn(!stack && "mt-4", className)}>
      <p className="eyebrow mb-3 text-ink-3">{title}</p>
      {stack ? (
        <ul className={cn("grid grid-cols-1 gap-x-[var(--gap)] gap-y-3 lg:grid-cols-1", across)}>{list}</ul>
      ) : (
        <Grid as="ul" className="gap-y-3">
          {items.map((p) => (
            <Col as="li" key={p.id} span={{ base: 4, sm: span === 6 ? 6 : 4, lg: span === 6 ? 6 : 4 }}>
              <LookItem product={p} stack={false} />
            </Col>
          ))}
        </Grid>
      )}
    </section>
  );
}

function LookItem({ product: p, stack }: { product: Product; stack: boolean }) {
  const content = (
    <div className="group relative flex h-full gap-3 border border-line-strong p-2.5 transition-colors hover:border-ink">
      <Link href={`/p/${p.slug}`} className={cn("shrink-0", stack ? "w-[72px]" : "w-[56px]")} tabIndex={-1} aria-hidden>
        <Img imgKey={p.variants[0].images[0]} alt="" sizes="96px" ratio="4/5" />
      </Link>
      <div className="min-w-0 flex-1 pr-1">
        <p className="eyebrow truncate text-ink-3">{labelById[p.labelId].name}</p>
        <Link href={`/p/${p.slug}`} className="link-u tap mt-1 line-clamp-2 text-[13.5px] leading-snug text-ink">
          {p.name}
        </Link>
        <Price price={p.price} mrp={p.mrp} size="sm" className="mt-1" />
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between">
        <SaveButton product={p} source="look" tone="plain" size={18} className="-mr-1.5 -mt-1.5 size-9" />
        <button type="button" onClick={() => setUI({ quickView: { productId: p.id } })} aria-label={`Quick add ${p.name}`} className="inline-flex h-9 items-center gap-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.1em] text-ink hover:underline [@media(pointer:coarse)]:h-11">
          <Eye size={13} aria-hidden /> Quick add
        </button>
      </div>
    </div>
  );
  return stack ? <li>{content}</li> : content;
}
