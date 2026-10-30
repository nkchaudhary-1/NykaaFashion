"use client";
import { Ruler } from "lucide-react";
import type { RefObject } from "react";
import { sizeGuideKey } from "@/data/content";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { setUI } from "@/stores/ui";
import type { Selection } from "./useSelection";

/**
 * Size picker: square cells on a flowing grid (6 across in the 4-column buy box, fewer when the box is narrower), one radio per size.
 * A sold-out size stays selectable — choosing it turns the button into "Notify me" — and is struck through with a flat SVG diagonal.
 */
export function SizeSelector({ product, sel, groupRef, compact }: { product: Product; sel: Selection; groupRef: RefObject<HTMLDivElement | null>; compact?: boolean }) {
  const v = product.variants[sel.variant];
  const guide = sizeGuideKey(product.categoryPath, product.sizes);
  const oneSize = product.sizes.length === 1;
  const scope = `${product.id}-${compact ? "q" : "p"}`;
  if (oneSize) {
    const out = (v.stock[product.sizes[0]] ?? 0) === 0;
    return (
      <div>
        <p className="text-[13px] text-ink-2">
          Size: <span className="font-medium text-ink">One size</span>
          {out && <span className="ml-2 font-medium text-danger">· Sold out in this colour</span>}
        </p>
        {!out && sel.stock !== null && sel.stock <= 3 && <p className="mt-1.5 text-[12.5px] font-medium text-amber">Only {sel.stock} left</p>}
      </div>
    );
  }
  return (
    <div key={sel.shake} className={cn(sel.error && "animate-shake")}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p id={`size-label-${scope}`} className="text-[13px] text-ink-2">
          Select size{sel.size && <>: <span className="font-medium text-ink">{sel.size}</span></>}
        </p>
        {guide && (
          <button type="button" onClick={() => setUI({ sizeGuide: { productId: product.id } })} className="link-u tap inline-flex items-center gap-1.5 py-1 text-[12.5px] font-medium text-ink">
            <Ruler size={14} aria-hidden /> Size guide
          </button>
        )}
      </div>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={`size-label-${scope}`}
        aria-describedby={sel.error ? `size-err-${product.id}` : undefined}
        className={cn("grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-2", sel.error && "outline outline-1 outline-offset-4 outline-danger")}
      >
        {product.sizes.map((s) => {
          const qty = v.stock[s] ?? 0;
          const out = qty === 0;
          const selected = sel.size === s;
          return (
            <label key={s} className="relative block cursor-pointer">
              <input type="radio" name={`size-${scope}`} value={s} checked={selected} onChange={() => sel.choose(s)} className="peer sr-only" aria-label={`Size ${s}${out ? ", sold out" : qty <= 3 ? `, only ${qty} left` : ""}`} />
              <span
                className={cn(
                  "relative flex aspect-square items-center justify-center overflow-hidden border px-1 text-[13px] tabular-nums transition-colors duration-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink",
                  selected ? "border-ink bg-ink text-bone" : out ? "border-line text-ink-3 hover:border-ink-3" : "border-line-strong text-ink hover:border-ink",
                )}
              >
                {s}
                {/* sold out: one flat diagonal, drawn as a line so it stays crisp at any cell size */}
                {out && (
                  <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full opacity-50">
                    <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  </svg>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {sel.error && (
        <p id={`size-err-${product.id}`} role="alert" className="mt-3 text-[13px] font-medium text-danger">
          Select a size to add this to your bag.
        </p>
      )}
      {!sel.error && sel.size && sel.stock !== null && (
        <p className={cn("mt-3 text-[12.5px] font-medium", sel.stock === 0 ? "text-danger" : "text-amber", sel.stock > 3 && "hidden")}>
          {sel.stock === 0 ? `Size ${sel.size} is sold out in ${v.colorName} — we can let you know when it’s back.` : `Only ${sel.stock} left in ${sel.size}`}
        </p>
      )}
    </div>
  );
}
