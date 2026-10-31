"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Expand, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Img } from "@/components/ui/Img";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useFocusTrap, useScrollLock } from "@/lib/a11y";
import { cn } from "@/lib/cn";
import { imgSrc } from "@/lib/img";
import { useHydrated } from "@/lib/store";

const SHOT_NAMES = ["front view", "back view", "fabric detail", "styled view"];
// 6 of the 12 columns on desktop (next to a 1-column thumbnail rail), 6 on tablets, full bleed on phones. The desktop size is generous
// on purpose: the hover zoom shows the picture at 2× and should stay sharp.
const MAIN_SIZES = "(min-width:1024px) 62vw, (min-width:600px) 52vw, 100vw";
/** From 1024px with a mouse the pictures are laid on top of one another and crossfade; everywhere else the track scrolls (swipe, snap). */
const STACKED = "(min-width: 64rem) and (hover: hover) and (pointer: fine)";

/**
 * PDP gallery (PRD §5.5/§7.1): a vertical thumbnail rail (with ▲ ▼) beside one large picture on desktop — the pictures lie on top of one another and
 * crossfade — and, on tablets and phones, a full-width swipe track with a flat dash indicator and a live "Image 2 of 3" line. One focusable group serves
 * touch (swipe), mice (thumbnails, ▲ ▼, hover-zoom) and the keyboard (← → browse, Enter opens the lightbox). Click opens the lightbox. `heroRef` is the
 * FLIP target for the card → PDP transition.
 */
export function Gallery({ images, name, colorName, heroRef, startIndex = 0 }: { images: string[]; name: string; colorName: string; heroRef: RefObject<HTMLDivElement | null>; startIndex?: number }) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  // the slide the shopper picked; until then the one the card was showing (FLIP carries its shot in as `startIndex`)
  const [picked, setPicked] = useState<number | null>(null);
  const index = picked ?? startIndex;
  const [lightbox, setLightbox] = useState<number | null>(null);
  const raf = useRef(0);
  const aim = useRef<number | null>(null); // the slide a ▲ ▼ / thumbnail / key press is scrolling to
  const settle = useRef(0);
  const stack = useMediaQuery(STACKED);
  const alt = (i: number) => `${name} in ${colorName} — ${SHOT_NAMES[i] ?? `view ${i + 1}`}`;
  const last = images.length - 1;
  const many = images.length > 1;

  // FLIP target: the picture area (the thumbnail rail stays put).
  useLayoutEffect(() => {
    heroRef.current = stage.current;
    return () => {
      heroRef.current = null;
    };
  }, [heroRef]);

  /** Moves the scroll-snap track to slide `n` (a DOM side effect only; the counter is state, set by `goTo` and `onScroll`). */
  const scrollTrack = useCallback((n: number, smooth: boolean) => {
    const el = track.current;
    if (!el) return;
    // While this scroll is in flight the track passes through the slides in between — scroll events must not pull the counter back to
    // the slide it started from (and a second ▲ ▼ press must step from where the first is heading).
    window.clearTimeout(settle.current);
    aim.current = smooth ? n : null;
    if (smooth) settle.current = window.setTimeout(() => (aim.current = null), 1200);
    el.scrollTo({ left: n * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const n = Math.max(0, Math.min(last, i));
      if (!stack) scrollTrack(n, smooth); // stacked pictures just crossfade: the new one fades in over the old, nothing scrolls
      setPicked(n);
    },
    [last, stack, scrollTrack],
  );

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      window.clearTimeout(settle.current);
    },
    [],
  );

  // Land on the shot the shopper was looking at on the card — once, on arrival (the counter already shows it: see `index`).
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current || startIndex === 0) return;
    landed.current = true;
    scrollTrack(startIndex, false);
  }, [startIndex, scrollTrack]);

  const onScroll = () => {
    if (stack) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = track.current;
      if (!el) return;
      const at = Math.round(el.scrollLeft / el.clientWidth);
      if (aim.current !== null) {
        if (at !== aim.current) return; // still travelling
        aim.current = null;
      }
      setPicked(at);
    });
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--ox", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--oy", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index + (e.key === "ArrowRight" ? 1 : -1));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      goTo(e.key === "Home" ? 0 : last);
    } else if (e.key === "Enter") {
      e.preventDefault();
      setLightbox(index);
    }
  };

  const rail = "inline-flex h-9 w-full items-center justify-center text-ink transition-colors hover:bg-sand disabled:pointer-events-none disabled:text-line-strong";
  // desktop pictures are as tall as the window allows (below the header), so the whole picture is in view while the information scrolls past
  const cap = stack ? "w-full max-h-[calc(100svh-var(--header-h)-2rem)]" : undefined;

  return (
    <div className="lg:grid lg:grid-cols-7 lg:gap-x-[var(--gap)]">
      {/* thumbnail rail (desktop) */}
      {many && (
        <div className="hidden lg:col-span-1 lg:block">
          <ul aria-label="Product images" className="flex flex-col gap-3">
            {images.map((k, i) => (
              <li key={k}>
                <button type="button" onClick={() => goTo(i)} aria-label={`Show ${SHOT_NAMES[i] ?? `image ${i + 1}`}`} aria-current={index === i} className={cn("relative block w-full overflow-hidden border transition-[border-color,opacity] duration-500 ease-expo", index === i ? "border-ink" : "border-transparent opacity-70 hover:opacity-100")}>
                  <Img imgKey={k} alt="" sizes="96px" ratio="4/5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex">
            <button type="button" aria-label="Previous image" disabled={index === 0} onClick={() => goTo(index - 1)} className={rail}>
              <ChevronUp size={20} strokeWidth={1.6} aria-hidden />
            </button>
            <button type="button" aria-label="Next image" disabled={index === last} onClick={() => goTo(index + 1)} className={rail}>
              <ChevronDown size={20} strokeWidth={1.6} aria-hidden />
            </button>
          </div>
        </div>
      )}

      <div className={cn("min-w-0", many ? "lg:col-span-6" : "lg:col-span-7")}>
        <div ref={stage} className="group/gal relative">
          <div
            ref={track}
            onScroll={onScroll}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="group"
            aria-roledescription="gallery"
            aria-label={`${name} images — use arrow keys to browse`}
            className={cn("scrollbar-none focus-visible:outline-offset-[-3px]", stack ? "grid overflow-hidden" : "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [@media(hover:hover)_and_(pointer:fine)]:overflow-x-hidden")}
          >
            {images.map((k, i) => (
              <div
                key={k}
                // the first shot is audited against the column grid; the ones waiting off-screen in the track are not
                {...(i > 0 ? { "data-nogrid": "" } : {})}
                className={cn("zoomable relative w-full overflow-hidden", stack ? cn("col-start-1 row-start-1 transition-opacity duration-[900ms] ease-expo", index === i ? "opacity-100" : "pointer-events-none opacity-0") : "shrink-0 snap-center")}
                onPointerMove={onMove}
                onPointerEnter={(e) => e.pointerType === "mouse" && e.currentTarget.setAttribute("data-zoom", "1")}
                onPointerLeave={(e) => e.pointerType === "mouse" && e.currentTarget.removeAttribute("data-zoom")}
                onClick={() => setLightbox(i)}
              >
                <Img imgKey={k} alt={alt(i)} sizes={MAIN_SIZES} ratio="4/5" load={i === 0 ? "preload" : undefined} className={cap} />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setLightbox(index)}
            aria-label="Open image full screen"
            className="absolute right-0 top-0 z-10 hidden size-11 items-center justify-center bg-bone text-ink opacity-0 transition-[opacity,background-color] duration-300 hover:bg-white focus-visible:opacity-100 group-hover/gal:opacity-100 lg:inline-flex"
          >
            <Expand size={18} strokeWidth={1.6} />
          </button>
        </div>

        {many && (
          <div className="flex items-center justify-between gap-4 px-[var(--gutter)] pt-3 sm:px-0 lg:pt-4">
            {/* phones and tablets: a visible caption + flat dashes; desktop shows a quiet numeral beside the thumbnail rail and keeps the announcement for screen readers */}
            <p aria-live="polite" className="text-[12px] tabular-nums text-ink-3 lg:sr-only">
              Image {index + 1} of {images.length}
            </p>
            <p aria-hidden className="hidden text-[11px] font-medium tabular-nums tracking-[0.16em] text-ink-3 lg:block">
              {String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
            </p>
            <div aria-hidden className="flex gap-1.5 lg:hidden">
              {images.map((_, i) => (
                <button key={i} type="button" tabIndex={-1} onClick={() => goTo(i)} className="flex h-6 w-9 items-center">
                  <span className={cn("block h-[3px] w-full transition-colors duration-300", i === index ? "bg-ink" : "bg-line-strong")} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Lightbox images={images} index={lightbox} alt={alt} onClose={(at) => (setLightbox(null), at !== undefined && goTo(at, false))} />
    </div>
  );
}

function Lightbox({ images, index, alt, onClose }: { images: string[]; index: number | null; alt: (i: number) => string; onClose: (lastIndex?: number) => void }) {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return createPortal(<AnimatePresence>{index !== null && <LightboxInner key="lb" images={images} start={index} alt={alt} onClose={onClose} />}</AnimatePresence>, document.body);
}

/** Full-screen viewer: flat sheet, 1px rules, square controls. ← → browse, click toggles zoom, Esc closes; focus is trapped and handed back to the opener. */
function LightboxInner({ images, start, alt, onClose }: { images: string[]; start: number; alt: (i: number) => string; onClose: (lastIndex?: number) => void }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const ref = useRef<HTMLDivElement>(null);
  const lastIdx = images.length - 1;
  useScrollLock(true);
  useFocusTrap(ref, true, () => onClose(i));
  const go = useCallback(
    (n: number) => {
      setI(Math.max(0, Math.min(lastIdx, n)));
      setZoom(false);
    },
    [lastIdx],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(lastIdx);
  };

  const key = images[i];
  const arrow = "absolute top-1/2 z-10 inline-flex size-12 -translate-y-1/2 items-center justify-center border border-ink bg-white text-ink transition-colors hover:bg-ink hover:text-white disabled:hidden";
  return (
    <motion.div ref={ref} onKeyDown={onKeyDown} role="dialog" aria-modal="true" aria-label="Product images" tabIndex={-1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-[80] flex flex-col bg-paper outline-none">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-[var(--gutter)]">
        <p className="text-[13px] tabular-nums text-ink-3" aria-live="polite">
          {i + 1} / {images.length}
        </p>
        <button type="button" data-autofocus onClick={() => onClose(i)} aria-label="Close full screen view" className="inline-flex size-11 items-center justify-center border border-ink text-ink transition-colors hover:bg-ink hover:text-white">
          <X size={20} strokeWidth={1.6} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          className={cn("absolute inset-0 overflow-hidden bg-sand", zoom ? "cursor-zoom-out" : "cursor-zoom-in")}
          onClick={() => setZoom((z) => !z)}
          onPointerMove={(e) => {
            if (!zoom) return;
            const r = e.currentTarget.getBoundingClientRect();
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
          }}
        >
          <Image src={imgSrc(key)} alt={alt(i)} fill sizes="100vw" loading="eager" className="object-contain transition-transform duration-300 ease-editorial" style={{ transform: zoom ? "scale(2.2)" : "none", transformOrigin: origin }} />
        </div>
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Previous image" disabled={i === 0} onClick={() => go(i - 1)} className={cn(arrow, "left-[var(--gutter)]")}>
              <ChevronLeft size={22} strokeWidth={1.6} />
            </button>
            <button type="button" aria-label="Next image" disabled={i === lastIdx} onClick={() => go(i + 1)} className={cn(arrow, "right-[var(--gutter)]")}>
              <ChevronRight size={22} strokeWidth={1.6} />
            </button>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-6 border-t border-line px-[var(--gutter)] py-3">
        <ul className="flex gap-2" aria-label="Choose image">
          {images.map((k, n) => (
            <li key={k}>
              <button type="button" onClick={() => go(n)} aria-label={`Show ${SHOT_NAMES[n] ?? `image ${n + 1}`}`} aria-current={n === i} className={cn("relative block w-11 overflow-hidden border transition-colors", n === i ? "border-ink" : "border-line hover:border-ink-3")}>
                <Img imgKey={k} alt="" sizes="48px" ratio="4/5" className={n === i ? undefined : "opacity-70"} />
              </button>
            </li>
          ))}
        </ul>
        <p className="hidden text-[12px] text-ink-3 sm:block">Click to {zoom ? "zoom out" : "zoom in"} · ← → to browse · Esc to close</p>
      </div>
    </motion.div>
  );
}
