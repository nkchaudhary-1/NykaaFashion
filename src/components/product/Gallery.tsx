"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Img } from "@/components/ui/Img";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useFocusTrap, useScrollLock } from "@/lib/a11y";
import { cn } from "@/lib/cn";
import { imgAvg, imgSrc } from "@/lib/img";
import { useHydrated } from "@/lib/store";

const SHOT_NAMES = ["front view", "back view", "fabric detail", "styled view"];
// The first shot is the full gallery width (6 of 12 columns on tablets, 8 on desktop); the rest sit in pairs at half of that.
const HERO_SIZES = "(min-width:1024px) 62vw, (min-width:600px) 49vw, 100vw";
const PAIR_SIZES = "(min-width:1024px) 31vw, (min-width:600px) 25vw, 100vw";

/**
 * PDP gallery (PRD §5.5/§7.1) — one DOM, two layouts:
 *  · phones (< 600px): a full-bleed scroll-snap track with a flat dash indicator and a live "Image 2 of 3" line;
 *  · tablets and desktop: an image grid on the page columns — the first shot spans the whole gallery, the others sit in 4 + 4 pairs
 *    (3 + 3 on tablets); an odd shot out is paired with a flat facts panel (`filler`).
 * The wrapper is a focusable group: ← → step through the shots (swipe track on phones, scroll-to on the grid), Enter opens the lightbox.
 * `heroRef` is the FLIP target for the card → PDP transition (the whole track on phones, the first shot elsewhere).
 */
export function Gallery({ images, name, colorName, heroRef, startIndex = 0, filler }: { images: string[]; name: string; colorName: string; heroRef: RefObject<HTMLDivElement | null>; startIndex?: number; filler?: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const tiles = useRef<Array<HTMLDivElement | null>>([]);
  const [index, setIndex] = useState(startIndex);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const raf = useRef(0);
  const phone = useMediaQuery("(max-width: 599px)");
  const alt = (i: number) => `${name} in ${colorName} — ${SHOT_NAMES[i] ?? `view ${i + 1}`}`;
  const last = images.length - 1;
  const pairedFiller = images.length > 1 && (images.length - 1) % 2 === 1;

  // FLIP target: on phones the whole swipe track (it can be showing any shot), otherwise the first shot.
  useLayoutEffect(() => {
    const wide = window.matchMedia("(min-width: 600px)").matches;
    heroRef.current = wide ? tiles.current[0] : track.current;
    return () => {
      heroRef.current = null;
    };
  }, [heroRef]);

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const n = Math.max(0, Math.min(last, i));
      const el = track.current;
      if (!el) return;
      if (window.matchMedia("(min-width: 600px)").matches) tiles.current[n]?.scrollIntoView({ block: "nearest", behavior: smooth ? "smooth" : "auto" });
      else el.scrollTo({ left: n * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
      setIndex(n);
    },
    [last],
  );

  // Land on the shot the shopper was looking at on the card (FLIP carries the current shot).
  useEffect(() => {
    if (startIndex > 0) goTo(startIndex, false);
  }, [startIndex, goTo]);

  const onScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = track.current;
      if (el && el.scrollWidth > el.clientWidth + 1) setIndex(Math.round(el.scrollLeft / el.clientWidth));
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
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

  return (
    <div className="group/gal relative">
      <div
        ref={track}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="group"
        aria-roledescription="gallery"
        aria-label={`${name} images — use arrow keys to browse`}
        data-carousel={phone ? "" : undefined}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain focus-visible:outline-offset-[-3px] sm:grid sm:grid-cols-6 sm:gap-[var(--gap)] sm:overflow-visible lg:grid-cols-8"
      >
        {images.map((k, i) => (
          <div
            key={k}
            ref={(el) => {
              tiles.current[i] = el;
            }}
            onClick={() => setLightbox(i)}
            className={cn("relative w-full shrink-0 cursor-zoom-in snap-center", i === 0 ? "sm:col-span-6 lg:col-span-8" : "sm:col-span-3 lg:col-span-4")}
          >
            <Img imgKey={k} alt={alt(i)} sizes={i === 0 ? HERO_SIZES : PAIR_SIZES} ratio="4/5" load={i === 0 ? "preload" : undefined} />
          </div>
        ))}
        {pairedFiller && filler && <div className="hidden aspect-[4/5] sm:col-span-3 sm:block lg:col-span-4">{filler}</div>}
      </div>

      <button
        type="button"
        onClick={() => setLightbox(index)}
        aria-label="Open image full screen"
        className="absolute right-3 top-3 z-10 hidden size-11 items-center justify-center border border-ink bg-white text-ink opacity-0 transition-[opacity,background-color,color] hover:bg-ink hover:text-bone focus-visible:opacity-100 group-hover/gal:opacity-100 lg:inline-flex"
      >
        <Expand size={18} strokeWidth={1.6} />
      </button>

      {images.length > 1 && (
        <div className="flex items-center justify-between gap-4 px-[var(--gutter)] pt-3 sm:block sm:p-0">
          {/* phones: a visible caption + flat dashes; wider screens keep the announcement for screen readers only */}
          <p aria-live="polite" className="text-[12px] tabular-nums text-ink-3 sm:sr-only">
            Image {index + 1} of {images.length}
          </p>
          <div aria-hidden className="flex gap-1.5 sm:hidden">
            {images.map((_, i) => (
              <button key={i} type="button" tabIndex={-1} onClick={() => goTo(i)} className="flex h-6 w-9 items-center">
                <span className={cn("block h-[3px] w-full transition-colors duration-300", i === index ? "bg-ink" : "bg-line-strong")} />
              </button>
            ))}
          </div>
        </div>
      )}

      <Lightbox images={images} index={lightbox} alt={alt} onClose={(at) => (setLightbox(null), at !== undefined && goTo(at, false))} />
    </div>
  );
}

function Lightbox({ images, index, alt, onClose }: { images: string[]; index: number | null; alt: (i: number) => string; onClose: (lastIndex?: number) => void }) {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return createPortal(<AnimatePresence>{index !== null && <LightboxInner key="lb" images={images} start={index} alt={alt} onClose={onClose} />}</AnimatePresence>, document.body);
}

/** Full-screen viewer: flat paper sheet, 1px rules, square controls. ← → browse, click toggles zoom, Esc closes; focus is trapped and handed back to the opener. */
function LightboxInner({ images, start, alt, onClose }: { images: string[]; start: number; alt: (i: number) => string; onClose: (lastIndex?: number) => void }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const ref = useRef<HTMLDivElement>(null);
  const lastIdx = images.length - 1;
  useScrollLock(true);
  useFocusTrap(ref, true, () => onClose(i));
  const go = useCallback((n: number) => {
    setI(Math.max(0, Math.min(lastIdx, n)));
    setZoom(false);
  }, [lastIdx]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(lastIdx);
  };

  const key = images[i];
  const arrow = "absolute top-1/2 z-10 inline-flex size-12 -translate-y-1/2 items-center justify-center border border-ink bg-white text-ink transition-colors hover:bg-ink hover:text-bone disabled:hidden";
  return (
    <motion.div ref={ref} onKeyDown={onKeyDown} role="dialog" aria-modal="true" aria-label="Product images" tabIndex={-1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-[80] flex flex-col bg-paper outline-none">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-[var(--gutter)]">
        <p className="text-[13px] tabular-nums text-ink-3" aria-live="polite">
          {i + 1} / {images.length}
        </p>
        <button type="button" data-autofocus onClick={() => onClose(i)} aria-label="Close full screen view" className="inline-flex size-11 items-center justify-center border border-ink text-ink transition-colors hover:bg-ink hover:text-bone">
          <X size={20} strokeWidth={1.6} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          className={cn("absolute inset-0 overflow-hidden", zoom ? "cursor-zoom-out" : "cursor-zoom-in")}
          onClick={() => setZoom((z) => !z)}
          onPointerMove={(e) => {
            if (!zoom) return;
            const r = e.currentTarget.getBoundingClientRect();
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
          }}
          style={{ backgroundColor: imgAvg(key) }}
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
