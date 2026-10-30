"use client";
import { Fragment, useEffect, useRef, type RefObject } from "react";
import { Img } from "@/components/ui/Img";
import { SIZE_GUIDES, sizeGuideKey } from "@/data/content";
import type { Product } from "@/data/types";
import { prefersReducedMotion } from "@/lib/a11y";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { setUI } from "@/stores/ui";
import { Swatch } from "./ColorSwatches";
import { inUnit, isLengthColumn, sizeGuideBridge, sizeUnitStore } from "./SizeGuideDialog";
import type { Selection } from "./useSelection";

/**
 * Colour picker in the same voice as the size picker: a bold legend with the chosen colour beside it, then one round swatch per colour
 * (a radio each, named by its colour). Used by the product page and the quick view.
 */
export function ColourChooser({ product, value, onChange, compact }: { product: Product; value: number; onChange: (i: number) => void; compact?: boolean }) {
  return (
    <fieldset>
      <legend className={cn("mb-2 font-semibold text-ink", compact ? "text-[15px]" : "text-[18px]")}>
        Colour<span className="text-[14px] font-normal text-ink-2">: {product.variants[value].colorName}</span>
      </legend>
      <div className="flex flex-wrap gap-x-1 gap-y-0">
        {product.variants.map((c, i) => (
          <label key={c.id} className="relative inline-flex size-11 cursor-pointer items-center justify-center">
            <input type="radio" name={`color-${product.id}${compact ? "-q" : ""}`} className="peer sr-only" checked={value === i} onChange={() => onChange(i)} aria-label={c.colorName} />
            <Swatch hex={c.colorHex} selected={value === i} size={28} />
            <span aria-hidden className="absolute inset-0 rounded-full outline-offset-0 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ink" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Size picker as on the live site: "Select Size" with a raspberry "Size Guide" link (it opens the drawer), then pill chips — one radio per
 * size, selected = dark border. A sold-out size stays selectable (choosing it turns the button into "Notify me") and is struck through
 * with a flat SVG diagonal. Once a size is chosen the page shows what that size measures and what the model wears.
 */
export function SizeSelector({ product, sel, groupRef, compact }: { product: Product; sel: Selection; groupRef: RefObject<HTMLDivElement | null>; compact?: boolean }) {
  const v = product.variants[sel.variant];
  const key = sizeGuideKey(product.categoryPath, product.sizes);
  const guide = key ? SIZE_GUIDES[key] : null;
  const unit = useStore(sizeUnitStore);
  const oneSize = product.sizes.length === 1;
  const scope = `${product.id}-${compact ? "q" : "p"}`;
  const wrap = useRef<HTMLDivElement>(null);
  // A blocked "add" shakes the picker. It is driven by the Web Animations API rather than a re-keyed subtree, so the radio that was just
  // focused keeps focus (a remount would drop it and the shopper would have to Tab back in).
  useEffect(() => {
    if (!sel.shake || prefersReducedMotion()) return;
    wrap.current?.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-6px)", offset: 0.2 },
        { transform: "translateX(5px)", offset: 0.4 },
        { transform: "translateX(-3px)", offset: 0.6 },
        { transform: "translateX(2px)", offset: 0.8 },
        { transform: "translateX(0)" },
      ],
      { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }, [sel.shake]);

  if (oneSize) {
    const out = (v.stock[product.sizes[0]] ?? 0) === 0;
    return (
      <div>
        <p className="text-[14px] text-ink-2">
          Size: <span className="font-semibold text-ink">One size</span>
          {out && <span className="ml-2 font-medium text-danger">· Sold out in this colour</span>}
        </p>
        {!out && sel.stock !== null && sel.stock <= 3 && <p className="mt-1.5 text-[12.5px] font-medium text-amber">Only {sel.stock} left</p>}
      </div>
    );
  }

  const openGuide = () => {
    sizeGuideBridge.set({ current: sel.size, pick: sel.choose });
    setUI({ sizeGuide: { productId: product.id } });
  };

  // what the chosen size measures, in the unit the shopper reads (the guide is authored in cm)
  const row = guide && sel.size ? guide.rows.find((r) => r[0] === sel.size) : undefined;
  const measures = guide && row ? guide.columns.slice(1).map((c, i) => ({ label: c, value: isLengthColumn(c) ? `${inUnit(row[i + 1], unit)} ${unit}` : row[i + 1] })) : [];

  return (
    <div ref={wrap}>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <p id={`size-label-${scope}`} className={cn("font-semibold text-ink", compact ? "text-[15px]" : "text-[18px]")}>
          Select Size{sel.size && <span className="text-[14px] font-normal text-ink-2">: {sel.size}</span>}
        </p>
        {guide && (
          <button type="button" onClick={openGuide} className="link-u tap py-1 text-[14px] font-semibold text-pink hover:text-pink-ink">
            Size Guide
          </button>
        )}
      </div>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={`size-label-${scope}`}
        aria-describedby={sel.error ? `size-err-${product.id}` : undefined}
        className={cn("flex flex-wrap gap-2.5", sel.error && "outline outline-1 outline-offset-4 outline-danger")}
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
                  "relative flex h-10 min-w-16 items-center justify-center overflow-hidden whitespace-nowrap rounded-full border px-4 text-[13.5px] transition-colors duration-200 [@media(pointer:coarse)]:h-11 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink",
                  selected ? "border-ink font-semibold text-ink" : out ? "border-line text-ink-3 hover:border-ink-3" : "border-line-strong text-ink-2 hover:border-ink",
                )}
              >
                {s}
                {/* sold out: one flat diagonal, drawn as a line so it stays crisp at any chip size (the chip's rounding clips its ends) */}
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

      {/* the chosen size: measurements and the model, as on the live page */}
      {!compact && sel.size && (measures.length > 0 || product.modelNote) && (
        <div className="mt-4 space-y-3">
          {measures.length > 0 && (
            <p aria-label={`Size ${sel.size} measures`} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[var(--radius-md)] bg-sand px-3.5 py-2 text-[12.5px] text-ink-2">
              {measures.map((m, i) => (
                <Fragment key={m.label}>
                  {i > 0 && <span aria-hidden>•</span>}
                  <span>
                    {m.label} <b className="font-semibold text-ink">{m.value}</b>
                  </span>
                </Fragment>
              ))}
            </p>
          )}
          {product.modelNote && (
            <div className="flex items-center gap-3.5 border border-line bg-paper p-3">
              <div className="w-10 shrink-0">
                <Img imgKey={v.images[0]} alt="" sizes="48px" ratio="4/5" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink">Model details</p>
                <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{product.modelNote}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
