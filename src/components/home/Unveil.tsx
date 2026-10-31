"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { REDUCED_MOTION, useMedia } from "./kit";

/**
 * A picture frame that is uncovered from its bottom edge while the picture settles from a slight over-scale — the same effect as the foundation's RevealMedia, but
 * the element that is watched is the outer frame, and only the layers inside it are clipped. (A frame that clips itself reports an empty intersection to the browser,
 * so a picture taller than the screen is never "seen" until its bottom edge is: exactly the large pictures this page is built around.)
 *
 * Progressive: the markup is fully visible until the page has hydrated; a frame is only hidden if it is still below the fold at that moment, and it is shown
 * again as soon as a tenth of it is on screen. Reduced motion, no JavaScript and a failed script all leave the picture as it is.
 */
export function Unveil({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const reduced = useMedia(REDUCED_MOTION);

  useEffect(() => {
    const el = box.current;
    if (!el || reduced) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already on screen, or above it: leave it as it is
    el.dataset.unveil = "hidden";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.unveil = "shown";
        io.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      delete el.dataset.unveil;
    };
  }, [reduced]);

  const wait = { transitionDelay: `${delay}ms` } as CSSProperties;
  return (
    <div ref={box} className={className}>
      <div className="h-full transition-[clip-path] duration-[1250ms] ease-expo [[data-unveil=hidden]_&]:[clip-path:inset(100%_0_0_0)] [[data-unveil=shown]_&]:[clip-path:inset(0_0_0_0)]" style={wait}>
        <div className={cn("h-full transition-[scale] duration-[1600ms] ease-expo [[data-unveil=hidden]_&]:scale-[1.14]")} style={wait}>
          {children}
        </div>
      </div>
    </div>
  );
}
