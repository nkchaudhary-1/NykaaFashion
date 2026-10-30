"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Img, SIZES } from "@/components/ui/Img";
import { useScrollLock } from "@/lib/a11y";
import { cn } from "@/lib/cn";
import { imgAvg, imgSrc } from "@/lib/img";
import { useHydrated } from "@/lib/store";
import { createPortal } from "react-dom";

const SHOT_NAMES = ["front view", "back view", "fabric detail", "styled view"];

/**
 * PDP gallery (PRD §5.5/§7.1). One scroll-snap track serves touch (swipe, dots always visible) and
 * fine pointers (arrows, thumbnails, hover-zoom, dots only on hover). Click opens a lightbox.
 * `heroRef` is the FLIP target for the card → PDP transition.
 */
export function Gallery({ images, name, colorName, heroRef, startIndex = 0 }: { images: string[]; name: string; colorName: string; heroRef: RefObject<HTMLDivElement | null>; startIndex?: number }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(startIndex);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const raf = useRef(0);
  const alt = (i: number) => `${name} in ${colorName} — ${SHOT_NAMES[i] ?? `view ${i + 1}`}`;

  const goTo = useCallback((i: number, smooth = true) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(images.length - 1, i));
    el.scrollTo({ left: n * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
    setIndex(n);
  }, [images.length]);

  // Land on the shot the shopper was looking at on the card (FLIP carries the current shot).
  useEffect(() => {
    if (startIndex > 0) goTo(startIndex, false);
  }, [startIndex, goTo]);

  const onScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = track.current;
      if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
    });
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--ox", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--oy", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[72px_minmax(0,1fr)]">
      {/* thumbnails (≥ sm) */}
      <ul className="order-2 hidden gap-3 sm:order-1 sm:flex sm:flex-col" aria-label="Product images">
        {images.map((k, i) => (
          <li key={k}>
            <button type="button" onClick={() => goTo(i)} aria-label={`Show ${SHOT_NAMES[i] ?? `image ${i + 1}`}`} aria-current={index === i} className={cn("relative block w-full overflow-hidden outline-offset-2 transition-opacity", index === i ? "ring-1 ring-ink ring-offset-2 ring-offset-bone" : "opacity-70 hover:opacity-100")}>
              <Img imgKey={k} alt="" sizes={SIZES.thumb} ratio="4/5" />
            </button>
          </li>
        ))}
      </ul>

      <div className="group/gal relative order-1 min-w-0 sm:order-2" ref={heroRef}>
        <div
          ref={track}
          onScroll={onScroll}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            e.preventDefault();
            goTo(index + (e.key === "ArrowRight" ? 1 : -1));
          }}
          role="group"
          aria-roledescription="carousel"
          aria-label={`${name} images — use arrow keys to browse`}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain focus-visible:outline-offset-[-3px] [@media(hover:hover)_and_(pointer:fine)]:overflow-x-hidden">
          {images.map((k, i) => (
            <div
              key={k}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${images.length}`}
              className="zoomable relative w-full shrink-0 snap-center overflow-hidden"
              onPointerMove={onMove}
              onPointerEnter={(e) => e.pointerType === "mouse" && e.currentTarget.setAttribute("data-zoom", "1")}
              onPointerLeave={(e) => e.currentTarget.removeAttribute("data-zoom")}
              onClick={() => setLightbox(i)}
            >
              <Img imgKey={k} alt={alt(i)} sizes="(min-width:1024px) 52vw, (min-width:600px) 80vw, 100vw" ratio="4/5" priority={i === 0} />
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setLightbox(index)} aria-label="Open image full screen" className="absolute right-3 top-3 hidden size-11 items-center justify-center rounded-full bg-white/85 text-ink opacity-0 backdrop-blur transition-opacity hover:bg-white focus-visible:opacity-100 group-hover/gal:opacity-100 lg:inline-flex">
          <ZoomIn size={19} strokeWidth={1.6} />
        </button>

        {images.length > 1 && (
          <>
            <button type="button" aria-label="Previous image" disabled={index === 0} onClick={() => goTo(index - 1)} className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink opacity-0 backdrop-blur transition-opacity hover:bg-white focus-visible:opacity-100 disabled:hidden group-hover/gal:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:inline-flex">
              <ChevronLeft size={21} />
            </button>
            <button type="button" aria-label="Next image" disabled={index === images.length - 1} onClick={() => goTo(index + 1)} className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink opacity-0 backdrop-blur transition-opacity hover:bg-white focus-visible:opacity-100 disabled:hidden group-hover/gal:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:inline-flex">
              <ChevronRight size={21} />
            </button>
            {/* dots: always on touch, hover/focus only on desktop (PRD §7.1) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:transition-opacity [@media(hover:hover)_and_(pointer:fine)]:group-focus-within/gal:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover/gal:opacity-100">
              {images.map((_, i) => (
                <button key={i} type="button" tabIndex={-1} aria-hidden onClick={() => goTo(i)} className="pointer-events-auto inline-flex h-6 w-5 items-center justify-center">
                  <span className={cn("h-1.5 rounded-full transition-all duration-300", i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/35")} />
                </button>
              ))}
            </div>
            <p className="sr-only" aria-live="polite">
              Image {index + 1} of {images.length}
            </p>
          </>
        )}
      </div>

      <Lightbox images={images} index={lightbox} alt={alt} onClose={(last) => (setLightbox(null), last !== undefined && goTo(last, false))} />
    </div>
  );
}

function Lightbox({ images, index, alt, onClose }: { images: string[]; index: number | null; alt: (i: number) => string; onClose: (lastIndex?: number) => void }) {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return createPortal(<AnimatePresence>{index !== null && <LightboxInner key="lb" images={images} start={index} alt={alt} onClose={onClose} />}</AnimatePresence>, document.body);
}

function LightboxInner({ images, start, alt, onClose }: { images: string[]; start: number; alt: (i: number) => string; onClose: (lastIndex?: number) => void }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const ref = useRef<HTMLDivElement>(null);
  useScrollLock(true);
  const prev = useCallback(() => (setI((n) => Math.max(0, n - 1)), setZoom(false)), []);
  const next = useCallback(() => (setI((n) => Math.min(images.length - 1, n + 1)), setZoom(false)), [images.length]);
  const close = useCallback(() => onClose(i), [onClose, i]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keydown", h);
      opener?.focus?.({ preventScroll: true });
    };
  }, [close, prev, next]);

  const key = images[i];
  return (
    <motion.div ref={ref} role="dialog" aria-modal="true" aria-label="Product images" tabIndex={-1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-[80] flex flex-col bg-paper outline-none">
      <div className="flex h-16 shrink-0 items-center justify-between px-4">
        <p className="text-[13px] tabular-nums text-ink-3" aria-live="polite">
          {i + 1} / {images.length}
        </p>
        <button type="button" onClick={close} aria-label="Close full screen view" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-sand">
          <X size={22} strokeWidth={1.5} />
        </button>
      </div>
      <div
        className={cn("relative min-h-0 flex-1 overflow-hidden", zoom ? "cursor-zoom-out" : "cursor-zoom-in")}
        onClick={() => setZoom((z) => !z)}
        onPointerMove={(e) => {
          if (!zoom) return;
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
        }}
        style={{ backgroundColor: imgAvg(key) }}
      >
        <Image src={imgSrc(key)} alt={alt(i)} fill sizes="100vw" priority className="object-contain transition-transform duration-300 ease-editorial" style={{ transform: zoom ? "scale(2.2)" : "none", transformOrigin: origin }} />
      </div>
      {images.length > 1 && (
        <>
          <button type="button" aria-label="Previous image" disabled={i === 0} onClick={prev} className="absolute left-3 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow disabled:hidden">
            <ChevronLeft size={22} />
          </button>
          <button type="button" aria-label="Next image" disabled={i === images.length - 1} onClick={next} className="absolute right-3 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow disabled:hidden">
            <ChevronRight size={22} />
          </button>
        </>
      )}
      <p className="shrink-0 py-3 text-center text-[12px] text-ink-3">Click to {zoom ? "zoom out" : "zoom in"} · ← → to browse · Esc to close</p>
    </motion.div>
  );
}
