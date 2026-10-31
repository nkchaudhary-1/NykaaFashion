"use client";
import { useEffect } from "react";

/**
 * Marks `[data-reveal]` elements as `data-in` once they scroll into view (see reveal.tsx and the Reveal section of globals.css).
 * Mounted once in the layout. Also tells the page that hydration happened, which cancels the inline script's "show everything" failsafe.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("hydrated");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).setAttribute("data-in", "");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -9% 0px", threshold: 0.08 },
    );
    const seen = new WeakSet<Element>();
    let raf = 0;
    const scan = () => {
      raf = 0;
      document.querySelectorAll("[data-reveal]:not([data-in])").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(scan);
    };
    scan();
    const mo = new MutationObserver(queue); // route changes, lazy modules, filters re-rendering a grid
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
