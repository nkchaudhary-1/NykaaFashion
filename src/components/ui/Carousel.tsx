"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";

/**
 * Horizontal carousel on the page grid. Items are sized from --pv (items per view) so that, at ≥1024px, an integer --pv
 * lands exactly on the 12-column grid (4 per view = 3 columns each). Fractional --pv on phones/tablets lets the next card peek.
 * Compose: <Carousel><SectionHeading><CarouselArrows /></SectionHeading><CarouselTrack …/></Carousel>
 */
const DENSITY = {
  /** product cards — 2.25 / 3.25 / 4 per view (3 grid columns each on desktop) */
  product: "[--pv:2.25] sm:[--pv:3.25] lg:[--pv:4]",
  /** small tiles (categories, labels) — 6 per view on desktop (2 columns each) */
  tile: "[--pv:2.4] sm:[--pv:4.3] lg:[--pv:6]",
  /** editorial cards — 3 per view on desktop (4 columns each) */
  wide: "[--pv:1.15] sm:[--pv:2.2] lg:[--pv:3]",
  /** feature panels — 2 per view on desktop (6 columns each) */
  feature: "[--pv:1.1] sm:[--pv:1.6] lg:[--pv:2]",
} as const;
export type CarouselDensity = keyof typeof DENSITY;

interface Ctl {
  ref: RefObject<HTMLUListElement | null>;
  id: string;
  measure: () => void;
  go: (dir: 1 | -1) => void;
}
interface Edge {
  start: boolean;
  end: boolean;
}
const CtlCtx = createContext<Ctl | null>(null);
const EdgeCtx = createContext<Edge>({ start: true, end: false });

export function Carousel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const id = useId();
  const [edge, setEdge] = useState<Edge>({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const next = { start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 };
    setEdge((e) => (e.start === next.start && e.end === next.end ? e : next));
  }, []);

  const go = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = first.getBoundingClientRect().width + gap;
    const perPage = Math.max(1, Math.floor((el.clientWidth + gap) / step + 0.05));
    el.scrollBy({ left: dir * perPage * step, behavior: "smooth" });
  }, []);

  const ctl = useMemo(() => ({ ref, id, measure, go }), [id, measure, go]);
  return (
    <CtlCtx.Provider value={ctl}>
      <EdgeCtx.Provider value={edge}>{children}</EdgeCtx.Provider>
    </CtlCtx.Provider>
  );
}

export function CarouselTrack({ label, density = "product", children, className, itemClassName }: { label: string; density?: CarouselDensity; children: ReactNode[]; className?: string; itemClassName?: string }) {
  const ctl = useContext(CtlCtx);
  const local = useRef<HTMLUListElement>(null);
  const ref = ctl?.ref ?? local;
  const measure = ctl?.measure;
  useEffect(() => {
    measure?.();
    const el = ref.current;
    if (!el || !measure) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, ref]);

  return (
    <ul
      ref={ref}
      id={ctl?.id}
      onScroll={measure}
      aria-label={label}
      data-carousel
      tabIndex={0}
      className={cn("snap-x-rail scrollbar-none bleed-r flex gap-x-[var(--gap)] overflow-x-auto outline-offset-[-2px]", DENSITY[density], className)}
    >
      {children.map((c, i) => (
        <li key={i} className={cn("shrink-0 basis-[calc((100%-(var(--pv)-1)*var(--gap))/var(--pv))]", itemClassName)}>
          {c}
        </li>
      ))}
    </ul>
  );
}

/** Flat square prev/next buttons. Desktop only — touch uses swipe. */
export function CarouselArrows({ className }: { className?: string }) {
  const ctl = useContext(CtlCtx);
  const edge = useContext(EdgeCtx);
  if (!ctl) return null;
  const btn = "inline-flex size-11 items-center justify-center border border-ink bg-transparent text-ink transition-colors hover:bg-ink hover:text-bone disabled:pointer-events-none disabled:border-line-strong disabled:text-line-strong";
  return (
    <div className={cn("hidden gap-2 lg:flex", className)}>
      <button type="button" aria-label="Previous" aria-controls={ctl.id} disabled={edge.start} onClick={() => ctl.go(-1)} className={btn}>
        <ArrowLeft size={18} strokeWidth={1.6} />
      </button>
      <button type="button" aria-label="Next" aria-controls={ctl.id} disabled={edge.end} onClick={() => ctl.go(1)} className={btn}>
        <ArrowRight size={18} strokeWidth={1.6} />
      </button>
    </div>
  );
}
