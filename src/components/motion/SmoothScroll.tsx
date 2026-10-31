"use client";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Inertial scrolling (Lenis) for mouse and trackpad users. Off for touch screens and `prefers-reduced-motion`, so those keep the browser's own scrolling.
 * It steps aside while an overlay locks the page (data-scroll-lock), and each new route starts at the top without easing (or at the anchor its address names).
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

  // A new route starts at the top — unless the address names a place on the page (/#shop-by-category, /info/shipping#returns): then it starts there. Without this the reset to the top
  // ran after the browser had jumped to the anchor and every deep link landed at the top. The page is still settling when it loads (fonts, the banner's height once the header is
  // measured), so the jump is repeated a few times — and stops the moment the visitor scrolls, touches or presses a key.
  useEffect(() => {
    const l = lenis.current;
    if (!l) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = () => (id ? document.getElementById(id) : null);
    const header = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-offset")) || 0;
    const go = () => {
      const el = target();
      // an exact pixel position rather than the element: Lenis would also subtract the element's scroll-margin
      if (el) l.scrollTo(Math.max(0, el.getBoundingClientRect().top + window.scrollY - header()), { immediate: true, force: true });
      else if (!id) l.scrollTo(0, { immediate: true, force: true });
    };
    go();
    if (!id) return;
    const timers = [250, 700, 1400, 2400].map((ms) => window.setTimeout(go, ms));
    const stop = () => timers.forEach(window.clearTimeout);
    const events = ["wheel", "touchstart", "keydown", "mousedown"] as const;
    events.forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }));
    return () => {
      stop();
      events.forEach((e) => window.removeEventListener(e, stop));
    };
  }, [pathname]);

  return null;
}
