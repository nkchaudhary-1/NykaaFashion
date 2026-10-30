"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Img, type LoadHint } from "@/components/ui/Img";
import { productById } from "@/data/catalog";
import { labelById } from "@/data/labels";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";
import { imgPins } from "@/lib/img";
import { setUI } from "@/stores/ui";

/**
 * Editorial image with shoppable pins (PRD §5.2). A pin opens quick view in place, so the reader
 * can add to bag or save without leaving the story.
 */
export function ShoppableImage({ imgKey, alt, sizes, load, ratio, className, position, onPinOpen }: { imgKey: string; alt: string; sizes: string; load?: LoadHint; ratio?: string; className?: string; position?: string; onPinOpen?: (productId: string) => void }) {
  return (
    <div className={cn("relative", className)}>
      <Img imgKey={imgKey} alt={alt} sizes={sizes} load={load} ratio={ratio} position={position} className="h-full w-full" />
      <PinLayer imgKey={imgKey} onPinOpen={onPinOpen} />
    </div>
  );
}

/** The pins for one image, positioned over a `relative` parent that is the image's box. Split out so art-directed heroes can layer two sets. */
export function PinLayer({ imgKey, className, onPinOpen }: { imgKey: string; className?: string; onPinOpen?: (productId: string) => void }) {
  const pins = imgPins(imgKey);
  const [active, setActive] = useState<string | null>(null);
  if (!pins.length) return null;
  return (
    <ul className={cn("absolute inset-0 list-none", className)} aria-label="Shop the products in this image">
      {pins.map((pin) => {
        const p = productById[pin.id];
        if (!p) return null;
        const right = pin.x > 0.58;
        const shown = active === pin.id;
        return (
          <li key={pin.id} className="absolute" style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}>
            <button
              type="button"
              aria-label={`Shop ${p.name} by ${labelById[p.labelId].name}, ${inr(p.price)}`}
              onMouseEnter={() => setActive(pin.id)}
              onMouseLeave={() => setActive((a) => (a === pin.id ? null : a))}
              onFocus={() => setActive(pin.id)}
              onBlur={() => setActive((a) => (a === pin.id ? null : a))}
              onClick={() => (onPinOpen?.(pin.id), setUI({ quickView: { productId: pin.id } }))}
              className="group/pin absolute -left-[22px] -top-[22px] inline-flex size-11 items-center justify-center"
            >
              <span aria-hidden className="absolute size-7 animate-ping rounded-full bg-white/50 [animation-duration:2.6s]" />
              <span aria-hidden className="relative inline-flex size-6 items-center justify-center rounded-full bg-white text-ink shadow-[0_2px_10px_rgba(22,18,15,0.35)] transition-transform duration-300 ease-editorial group-hover/pin:scale-110">
                <Plus size={14} strokeWidth={2.2} className={cn("transition-transform duration-300", shown && "rotate-45")} />
              </span>
              <span
                role="presentation"
                className={cn("pointer-events-none absolute top-1/2 hidden w-max max-w-[210px] -translate-y-1/2 bg-white px-3 py-2 text-left shadow-lg transition-opacity duration-200 sm:block", right ? "right-full mr-2" : "left-full ml-2", shown ? "opacity-100" : "opacity-0")}
              >
                <span className="eyebrow block text-ink-3">{labelById[p.labelId].name}</span>
                <span className="mt-1 block truncate text-[13px] text-ink">{p.name}</span>
                <span className="mt-0.5 block text-[12.5px] font-medium tabular-nums text-ink">{inr(p.price)}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
