"use client";
import Link from "next/link";
import { Eye } from "lucide-react";
import { useRef, useState, type FocusEvent, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Img, SIZES, type LoadHint } from "@/components/ui/Img";
import { labelById } from "@/data/labels";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { captureFlip } from "@/lib/flip";
import { inr } from "@/lib/format";
import { setUI } from "@/stores/ui";
import { SwatchRow } from "./ColorSwatches";
import { SaveButton } from "./SaveButton";

interface Props {
  product: Product;
  load?: LoadHint;
  /** analytics/FLIP source tag */
  source?: string;
  /** which colour to show (wishlist remembers the saved colour) */
  variant?: number;
  sizes?: string;
  ratio?: string;
  /** image takes whatever height the grid gives it (feature cards in mixed-size grids) */
  fill?: boolean;
  className?: string;
  hideQuickView?: boolean;
  /** extra content under the price (e.g. wishlist actions) */
  footer?: ReactNode;
  onOpen?: () => void;
}

/** The quiet price line: the price in medium weight, the struck MRP and the saving in green — only when a real discount exists (PRD §6.1). */
function CardPrice({ price, mrp }: { price: number; mrp: number }) {
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2.5 tabular-nums">
      <span className="text-[14px] font-medium text-ink">{inr(price)}</span>
      {off > 0 && (
        <>
          <span className="sr-only">, was {inr(mrp)}</span>
          <s aria-hidden className="text-[12.5px] font-normal text-ink-3">
            {inr(mrp)}
          </s>
          <span className="text-[12px] font-medium text-emerald">{off}% off</span>
        </>
      )}
    </p>
  );
}

/**
 * Taste-first product card (PRD §5.4), awards finish: a silent picture that scales ever so slowly under the pointer (inside its clipped frame, so the card
 * stays on the grid) and crossfades to the second shot, then a small uppercase brand, the name, a quiet price. Multi-shot: hover swaps on mouse, swipe on
 * touch, and a keyboard focus ring on any control inside the card does what the hover does. Save is always one tap.
 */
export function ProductCard({ product: p, load, source = "grid", variant = 0, sizes = SIZES.card, ratio = "4/5", fill, className, hideQuickView, footer, onOpen }: Props) {
  const label = labelById[p.labelId];
  const v = p.variants[Math.min(variant, p.variants.length - 1)];
  const [shot, setShot] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const hasAlt = v.images.length > 1;

  const onPointerDown = (e: RPointerEvent) => {
    if (e.pointerType !== "mouse") start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: RPointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || !hasAlt) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
      swiped.current = true;
      setShot((cur) => (dx < 0 ? Math.min(v.images.length - 1, cur + 1) : Math.max(0, cur - 1)));
    }
  };
  const open = (e: React.MouseEvent) => {
    if (swiped.current) {
      swiped.current = false;
      e.preventDefault();
      return;
    }
    captureFlip(p.id, box.current, shot, source);
    onOpen?.();
  };
  // keyboard: tabbing onto a control inside the card shows the second shot, like hovering it
  const onFocus = (e: FocusEvent) => {
    if (hasAlt && e.target.matches(":focus-visible")) setShot(1);
  };
  const onBlur = (e: FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setShot(0);
  };

  return (
    <article
      className={cn("group/card relative flex h-full flex-col", className)}
      onPointerEnter={(e) => e.pointerType === "mouse" && hasAlt && setShot(1)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setShot(0)}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div ref={box} className={cn("relative touch-pan-y overflow-hidden bg-sand", fill && "aspect-[4/5] sm:aspect-auto sm:min-h-0 sm:flex-1")} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        {/* Image link is a pointer convenience; the text link below is the one assistive tech announces. */}
        <Link href={`/p/${p.slug}`} aria-hidden tabIndex={-1} draggable={false} onClick={open} className={cn("block", fill && "absolute inset-0")}>
          {/* the moving layer: it scales inside the clipped frame (1.04 over 1.2 s) while the card is hovered or a control in it has keyboard focus */}
          <div data-nogrid className={cn("relative transition-transform duration-[1200ms] ease-expo group-hover/card:scale-[1.04] group-has-[:focus-visible]/card:scale-[1.04]", fill && "h-full")}>
            <Img imgKey={v.images[0]} alt="" sizes={sizes} load={load} ratio={fill ? "fill" : ratio} className={cn(fill && "h-full", p.soldOut && "opacity-60")} />
            {hasAlt && (
              <span className={cn("absolute inset-0 block transition-opacity duration-[800ms] ease-expo", shot > 0 ? "opacity-100" : "opacity-0")}>
                <Img imgKey={v.images[Math.min(1, v.images.length - 1)]} alt="" sizes={sizes} ratio={fill ? "fill" : ratio} className="h-full" />
              </span>
            )}
          </div>
        </Link>

        {/* status — text labels, never colour alone */}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          {p.soldOut ? <Badge tone="ink">Sold out</Badge> : p.isNew ? <Badge tone="light">New</Badge> : null}
          {p.responsible && !p.soldOut && <Badge tone="blue">Responsible</Badge>}
        </div>

        {/* touch shot dots */}
        {hasAlt && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1 [@media(hover:hover)]:hidden">
            {v.images.map((_, i) => (
              <span key={i} className={cn("h-[3px] transition-all duration-300", i === shot ? "w-4 bg-ink" : "w-2 bg-ink/35")} />
            ))}
          </div>
        )}

        <SaveButton product={p} variant={variant} source={source} className="absolute right-0 top-0" />

        {!hideQuickView && !p.soldOut && (
          <button
            type="button"
            aria-label={`Quick view ${p.name}`}
            onClick={() => setUI({ quickView: { productId: p.id, variant } })}
            className="absolute inset-x-0 bottom-0 hidden h-11 translate-y-full items-center justify-center gap-2 border-t border-line bg-bone text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition-transform duration-500 ease-expo hover:bg-paper focus-visible:translate-y-0 group-hover/card:translate-y-0 lg:flex"
          >
            <Eye size={14} aria-hidden /> Quick view
          </button>
        )}
      </div>

      <Link href={`/p/${p.slug}`} draggable={false} onClick={open} className={cn("flex flex-col pt-4 outline-offset-4", !fill && "flex-1")}>
        <p className="truncate text-[11px] font-medium uppercase leading-tight tracking-[0.14em] text-ink">
          {p.soldOut && <span className="sr-only">Sold out: </span>}
          {label.name}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-[14px] font-normal leading-[1.35] text-ink-2">{p.name}</h3>
        <div className="mt-auto pt-2.5">
          <CardPrice price={p.price} mrp={p.mrp} />
          <SwatchRow product={p} />
        </div>
      </Link>
      {footer}
    </article>
  );
}
