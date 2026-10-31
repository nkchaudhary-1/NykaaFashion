"use client";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { SaveButton } from "@/components/product/SaveButton";
import { Img, type LoadHint } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { productById } from "@/data/catalog";
import { labelById } from "@/data/labels";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";
import { imgPins, imgSize } from "@/lib/img";
import { setUI } from "@/stores/ui";

/**
 * Editorial image with shoppable pins (PRD §5.2). A pin opens quick view in place, so the reader
 * can add to bag or save without leaving the story.
 */
export function ShoppableImage({ imgKey, alt, sizes, load, ratio, className, position, onPinOpen }: { imgKey: string; alt: string; sizes: string; load?: LoadHint; ratio?: string; className?: string; position?: string; onPinOpen?: (productId: string) => void }) {
  return (
    <div className={cn("relative", className)}>
      <Img imgKey={imgKey} alt={alt} sizes={sizes} load={load} ratio={ratio} position={position} className="h-full w-full" />
      <PinLayer imgKey={imgKey} onPinOpen={onPinOpen} position={position} />
    </div>
  );
}

/** An `object-position` such as "70% 30%" as [0.7, 0.3] (two values: x then y; anything else is the centre). */
function focal(position?: string): [number, number] {
  const [x = "50%", y = "50%"] = (position ?? "").trim().split(/\s+/);
  const n = (v: string) => (v.endsWith("%") ? Math.min(1, Math.max(0, parseFloat(v) / 100)) : v === "left" || v === "top" ? 0 : v === "right" || v === "bottom" ? 1 : 0.5);
  return [n(x), n(y)];
}

/**
 * The pins for one image, positioned over a `relative` parent that is the image's box. Split out so art-directed heroes can layer two sets.
 *
 * Pins are flat: a white circle with a 1px ink border and a plus, no shadow, no pulse. Positions are pure CSS (container
 * query units), so they stay on the right spot when the image is cropped by `object-fit: cover` — pass the same
 * `position` that the image uses. When the box has the image's own ratio this is exactly `left: x%; top: y%`.
 *
 * Hit areas: the visible circle stays 24px, the button around it is 44px on touch (32px with a mouse) — but never larger than the
 * distance to the nearest other pin, so two pins that sit close on a phone get two separate targets instead of overlapping ones.
 * (`--m` is that distance in image-heights; the displayed image is `max(100cqh, 100cqw / ratio)` tall.)
 */
export function PinLayer({ imgKey, className, onPinOpen, position }: { imgKey: string; className?: string; onPinOpen?: (productId: string) => void; position?: string }) {
  const pins = imgPins(imgKey);
  const [active, setActive] = useState<number | null>(null);
  if (!pins.length) return null;
  const [w, h] = imgSize(imgKey);
  const r = w / h;
  const [fx, fy] = focal(position);
  // distance to the closest other pin: the side of the largest square that fits between them, in image heights
  const room = (i: number) => pins.reduce((m, q, j) => (j === i ? m : Math.min(m, Math.max(Math.abs(q.x - pins[i].x) * r, Math.abs(q.y - pins[i].y)))), 9);
  return (
    <ul className={cn("absolute inset-0 list-none [--hit:32px] [container-type:size] [@media(pointer:coarse)]:[--hit:44px]", className)} style={{ "--r": r, "--px": fx, "--py": fy } as CSSProperties} aria-label="Shop the products in this image">
      {pins.map((pin, i) => {
        const p = productById[pin.id];
        if (!p) return null;
        const right = pin.x > 0.58;
        const shown = active === i;
        return (
          <li
            key={`${pin.id}-${i}`}
            className="absolute left-[calc(100cqw*var(--px)+max(100cqw,100cqh*var(--r))*(var(--x)-var(--px)))] top-[calc(100cqh*var(--py)+max(100cqh,100cqw/var(--r))*(var(--y)-var(--py)))]"
            style={{ "--x": pin.x, "--y": pin.y, "--m": Math.round(room(i) * 1000) / 1000, zIndex: shown ? 20 : undefined } as CSSProperties}
          >
            <button
              type="button"
              aria-label={`Shop ${p.name} by ${labelById[p.labelId].name}, ${inr(p.price)}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive((a) => (a === i ? null : a))}
              onFocus={() => setActive(i)}
              onBlur={() => setActive((a) => (a === i ? null : a))}
              onClick={() => (onPinOpen?.(pin.id), setUI({ quickView: { productId: pin.id } }))}
              className="group/pin absolute left-0 top-0 inline-flex size-[clamp(24px,calc(max(100cqh,100cqw/var(--r))*var(--m)),var(--hit))] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            >
              <span aria-hidden className={cn("relative inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-ink transition-colors duration-200 group-hover/pin:bg-ink group-hover/pin:text-white", shown ? "bg-ink text-white" : "bg-white text-ink")}>
                <Plus size={14} strokeWidth={2} className={cn("transition-transform duration-300", shown && "rotate-45")} />
              </span>
              {/* Flat preview card — fine pointers on windows at least 600px wide (on touch a tap goes straight to quick view; in a narrower window it would reach past the edge). */}
              <span
                role="presentation"
                className={cn("pointer-events-none absolute top-1/2 hidden w-max max-w-[220px] -translate-y-1/2 border border-ink bg-white px-3 py-2.5 text-left transition-opacity duration-200 [@media(hover:hover)_and_(min-width:37.5rem)]:block", right ? "right-[calc(100%-4px)] mr-2" : "left-[calc(100%-4px)] ml-2", shown ? "opacity-100" : "opacity-0")}
              >
                <span className="eyebrow block text-ink-3">{labelById[p.labelId].name}</span>
                <span className="mt-1.5 block whitespace-normal text-[13px] font-medium leading-snug text-ink">{p.name}</span>
                <span className="mt-1 flex items-baseline justify-between gap-4 text-[12.5px] tabular-nums text-ink">
                  <span className="font-medium">{inr(p.price)}</span>
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em]">Quick view</span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * "Shop this look" — an always-visible product list for a shoppable image (it works on touch, where hover pins don't).
 * `layout="stack"` is one column of rows beside an image (three across when it sits under one on a tablet); `layout="strip"` puts the products
 * side by side from 768px, as many equal columns as there are products (2, 3 or 4), so each product takes whole page columns when the strip
 * sits in a 12- or 9-column block. Local to the editorial pages so the list can follow the story's grid.
 */
const STRIP_COLS = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" } as const;
export function LookList({ imgKey, title = "In this image", label, layout = "stack", className }: { imgKey: string | string[]; title?: string; label?: string; layout?: "stack" | "strip"; className?: string }) {
  const keys = Array.isArray(imgKey) ? imgKey : [imgKey];
  const ids = Array.from(new Set(keys.flatMap((k) => imgPins(k).map((p) => p.id)))).filter((id) => productById[id]);
  if (!ids.length) return null;
  return (
    <section aria-label={label ?? title} className={className}>
      <p className="eyebrow mb-3 text-ink-3">{title}</p>
      <ul className={cn("border-t border-ink", layout === "strip" ? cn("md:grid md:gap-x-[var(--gap)]", STRIP_COLS[Math.min(4, ids.length) as 1 | 2 | 3 | 4]) : "md:grid md:grid-cols-3 md:gap-x-[var(--gap)] lg:block")}>
        {ids.map((id) => (
          <LookItem key={id} id={id} />
        ))}
      </ul>
    </section>
  );
}

function LookItem({ id }: { id: string }) {
  const p = productById[id];
  return (
    <li className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-x-3 border-b border-line py-3">
      <Link href={`/p/${p.slug}`} className="block" tabIndex={-1} aria-hidden>
        <Img imgKey={p.variants[0].images[0]} alt="" sizes="64px" ratio="4/5" />
      </Link>
      <div className="min-w-0">
        <p className="eyebrow truncate text-ink-3">{labelById[p.labelId].name}</p>
        <Link href={`/p/${p.slug}`} className="link-u tap mt-1.5 line-clamp-2 text-[13.5px] leading-snug text-ink">
          {p.name}
        </Link>
        <Price price={p.price} mrp={p.mrp} size="sm" className="mt-1" />
        <div className="-ml-2.5 mt-0.5 flex items-center gap-1">
          <SaveButton product={p} source="look" tone="plain" size={18} className="size-9" />
          <button type="button" onClick={() => setUI({ quickView: { productId: id } })} aria-label={`Quick add ${p.name}`} className="inline-flex h-9 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-sand [@media(pointer:coarse)]:h-11">
            <Eye size={13} aria-hidden /> Quick add
          </button>
        </div>
      </div>
    </li>
  );
}
