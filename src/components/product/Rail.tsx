"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SIZES } from "@/components/ui/Img";
import { cn } from "@/lib/cn";
import type { Product } from "@/data/types";
import { ProductCard } from "./ProductCard";

/** Horizontal snap rail with edge-bleed and desktop arrows. */
export function Rail({ children, label, className, itemClass = "w-[62vw] sm:w-[34vw] lg:w-[23vw] xl:w-[19.5vw] 2xl:w-[17vw]" }: { children: ReactNode[]; label: string; className?: string; itemClass?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);
  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);
  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.82, behavior: "smooth" });

  return (
    <div className={cn("group/rail relative", className)}>
      <ul ref={ref} onScroll={measure} aria-label={label} tabIndex={0} className="snap-x-rail scrollbar-none -mx-[var(--gutter)] flex gap-3 overflow-x-auto px-[var(--gutter)] pb-2 outline-offset-[-2px] sm:gap-4 lg:gap-5">
        {children.map((c, i) => (
          <li key={i} className={cn("shrink-0", itemClass)}>
            {c}
          </li>
        ))}
      </ul>
      <button type="button" aria-label="Scroll left" disabled={edge.start} onClick={() => go(-1)} className="absolute left-3 top-[34%] z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0 lg:inline-flex lg:opacity-0 lg:group-hover/rail:opacity-100 lg:focus-visible:opacity-100 lg:disabled:group-hover/rail:opacity-0">
        <ArrowLeft size={18} />
      </button>
      <button type="button" aria-label="Scroll right" disabled={edge.end} onClick={() => go(1)} className="absolute right-3 top-[34%] z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0 lg:inline-flex lg:opacity-0 lg:group-hover/rail:opacity-100 lg:focus-visible:opacity-100 lg:disabled:group-hover/rail:opacity-0">
        <ArrowRight size={18} />
      </button>
    </div>
  );
}

export function ProductRail({ products, label, source, reasons }: { products: Product[]; label: string; source: string; reasons?: Record<string, string> }) {
  return (
    <Rail label={label}>
      {products.map((p, i) => (
        <div key={p.id} className="flex h-full flex-col">
          <ProductCard product={p} source={source} sizes={SIZES.rail} priority={i < 2} />
          {reasons?.[p.id] && <p className="mt-1 text-[11.5px] leading-snug text-ink-3">{reasons[p.id]}</p>}
        </div>
      ))}
    </Rail>
  );
}
