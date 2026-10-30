"use client";
import { Ruler } from "lucide-react";
import type { RefObject } from "react";
import { sizeGuideKey } from "@/data/content";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { setUI } from "@/stores/ui";
import type { Selection } from "./useSelection";

export function SizeSelector({ product, sel, groupRef, compact }: { product: Product; sel: Selection; groupRef: RefObject<HTMLDivElement | null>; compact?: boolean }) {
  const v = product.variants[sel.variant];
  const guide = sizeGuideKey(product.categoryPath, product.sizes);
  const oneSize = product.sizes.length === 1;
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
      <div className="mb-2.5 flex items-center justify-between">
        <p id={`size-label-${product.id}-${compact ? "q" : "p"}`} className="text-[13px] text-ink-2">
          Select size{sel.size && <>: <span className="font-medium text-ink">{sel.size}</span></>}
        </p>
        {guide && (
          <button type="button" onClick={() => setUI({ sizeGuide: { productId: product.id } })} className="link-u tap inline-flex items-center gap-1.5 py-2 text-[12.5px] font-medium text-ink">
            <Ruler size={14} aria-hidden /> Size guide
          </button>
        )}
      </div>
      <div ref={groupRef} role="radiogroup" aria-labelledby={`size-label-${product.id}-${compact ? "q" : "p"}`} aria-describedby={sel.error ? `size-err-${product.id}` : undefined} className={cn("flex flex-wrap gap-2", sel.error && "outline outline-1 outline-offset-4 outline-danger")}>
        {product.sizes.map((s) => {
          const qty = v.stock[s] ?? 0;
          const out = qty === 0;
          const selected = sel.size === s;
          return (
            <label key={s} className="relative cursor-pointer">
              <input type="radio" name={`size-${product.id}-${compact ? "q" : "p"}`} value={s} checked={selected} onChange={() => sel.choose(s)} className="peer sr-only" aria-label={`Size ${s}${out ? ", sold out" : qty <= 3 ? `, only ${qty} left` : ""}`} />
              <span
                className={cn(
                  "relative flex h-11 min-w-12 items-center justify-center border px-3 text-[13px] tabular-nums transition-colors duration-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink",
                  selected ? "border-ink bg-ink text-bone" : out ? "border-line text-ink-3 hover:border-ink-3" : "border-line-strong text-ink hover:border-ink",
                  out && !selected && "overflow-hidden",
                )}
              >
                {s}
                {out && <span aria-hidden className={cn("absolute inset-0", "bg-[linear-gradient(to_top_right,transparent_calc(50%-0.5px),currentColor_calc(50%-0.5px),currentColor_calc(50%+0.5px),transparent_calc(50%+0.5px))] opacity-45")} />}
              </span>
            </label>
          );
        })}
      </div>
      {sel.error && (
        <p id={`size-err-${product.id}`} role="alert" className="mt-2.5 text-[13px] font-medium text-danger">
          Select a size to add this to your bag.
        </p>
      )}
      {!sel.error && sel.size && sel.stock !== null && (
        <p className={cn("mt-2.5 text-[12.5px] font-medium", sel.stock === 0 ? "text-danger" : "text-amber", sel.stock > 3 && "hidden")}>
          {sel.stock === 0 ? `Size ${sel.size} is sold out in ${v.colorName} — we can let you know when it’s back.` : `Only ${sel.stock} left in ${sel.size}`}
        </p>
      )}
    </div>
  );
}
