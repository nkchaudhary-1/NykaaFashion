"use client";
import Link from "next/link";
import { Eye } from "lucide-react";
import { useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Img, SIZES } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { labelById } from "@/data/labels";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { captureFlip } from "@/lib/flip";
import { setUI } from "@/stores/ui";
import { SwatchRow } from "./ColorSwatches";
import { SaveButton } from "./SaveButton";

interface Props {
  product: Product;
  priority?: boolean;
  /** analytics/FLIP source tag */
  source?: string;
  /** which colour to show (wishlist remembers the saved colour) */
  variant?: number;
  sizes?: string;
  ratio?: string;
  className?: string;
  hideQuickView?: boolean;
  /** extra content under the price (e.g. wishlist actions) */
  footer?: ReactNode;
  onOpen?: () => void;
}

/**
 * Taste-first product card (PRD §5.4): image-forward, label above name, price with discount ONLY when one exists,
 * no sale chrome by default. Multi-shot: hover swaps on mouse, swipe on touch. Save is always one tap.
 */
export function ProductCard({ product: p, priority, source = "grid", variant = 0, sizes = SIZES.card, ratio = "4/5", className, hideQuickView, footer, onOpen }: Props) {
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

  return (
    <article className={cn("group/card relative flex h-full flex-col", className)}>
      <div
        ref={box}
        className="relative touch-pan-y overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerEnter={(e) => e.pointerType === "mouse" && hasAlt && setShot(1)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setShot(0)}
      >
        {/* Image link is a pointer convenience; the text link below is the one assistive tech announces. */}
        <Link href={`/p/${p.slug}`} aria-hidden tabIndex={-1} draggable={false} onClick={open} className="block">
          <Img imgKey={v.images[0]} alt="" sizes={sizes} priority={priority} ratio={ratio} className={cn(p.soldOut && "opacity-70 saturate-50")} />
          {hasAlt && (
            <span className={cn("absolute inset-0 block transition-opacity duration-500 ease-editorial", shot > 0 ? "opacity-100" : "opacity-0")}>
              <Img imgKey={v.images[Math.min(1, v.images.length - 1)]} alt="" sizes={sizes} ratio={ratio} className="h-full" />
            </span>
          )}
        </Link>

        {/* status — text labels, never colour alone */}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          {p.soldOut ? <Badge tone="ink">Sold out</Badge> : p.isNew ? <Badge tone="light">New</Badge> : null}
          {p.responsible && !p.soldOut && <Badge tone="emerald">Responsible</Badge>}
        </div>

        {/* touch shot dots */}
        {hasAlt && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1 [@media(hover:hover)]:hidden">
            {v.images.map((_, i) => (
              <span key={i} className={cn("h-1 rounded-full transition-all duration-300", i === shot ? "w-4 bg-ink" : "w-1 bg-ink/35")} />
            ))}
          </div>
        )}

        <SaveButton product={p} variant={variant} source={source} className="absolute right-1.5 top-1.5" />

        {!hideQuickView && !p.soldOut && (
          <button
            type="button"
            aria-label={`Quick view ${p.name}`}
            onClick={() => setUI({ quickView: { productId: p.id, variant } })}
            className="absolute inset-x-2 bottom-2 hidden h-10 translate-y-2 items-center justify-center gap-2 bg-white/95 text-[11px] font-medium uppercase tracking-[0.12em] text-ink opacity-0 shadow-sm backdrop-blur transition-[opacity,transform,background-color] duration-300 ease-editorial hover:bg-white focus-visible:translate-y-0 focus-visible:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100 lg:flex"
          >
            <Eye size={14} aria-hidden /> Quick view
          </button>
        )}
      </div>

      <Link href={`/p/${p.slug}`} draggable={false} onClick={open} className="flex flex-1 flex-col pt-3 outline-offset-4">
        <p className="eyebrow truncate text-ink-3">{p.soldOut && <span className="sr-only">Sold out: </span>}{label.name}</p>
        <h3 className="mt-1.5 line-clamp-2 text-[14px] font-normal leading-[1.3] text-ink">{p.name}</h3>
        <div className="mt-auto pt-1.5">
          <Price price={p.price} mrp={p.mrp} size="md" className={cn(p.soldOut && "opacity-60")} />
          <SwatchRow product={p} />
        </div>
      </Link>
      {footer}
    </article>
  );
}
