"use client";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Inertial scrolling (Lenis) for mouse and trackpad users. Off for touch screens and `prefers-reduced-motion`, so those keep the browser's own scrolling.
 * It steps aside while an overlay locks the page (data-scroll-lock), and each new route starts at the top without easing.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(pointer: coarse)").matches) return;
    // allowNestedScroll: drawers, dialogs, menus and carousels that scroll on their own keep native wheel behaviour
    const l = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, smoothWheel: true, allowNestedScroll: true });
    lenis.current = l;
    let raf = requestAnimationFrame(function tick(t) {
      l.raf(t);
      raf = requestAnimationFrame(tick);
    });
    const sync = () => (document.documentElement.dataset.scrollLock === "true" ? l.stop() : l.start());
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-scroll-lock"] });
    sync();
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
      l.destroy();
      lenis.current = null;
    };
  }, []);

  useEffect(() => {
    lenis.current?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
