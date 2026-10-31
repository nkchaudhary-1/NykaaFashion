"use client";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * A template (unlike a layout) mounts afresh on every navigation, which makes it the place for the page-to-page transition: the incoming page fades in.
 * The first load is left alone (so the server-rendered page is never hidden), and visitors who prefer reduced motion get no fade.
 * Web Animations API rather than CSS classes: nothing to hydrate, nothing left behind on the element afterwards.
 */
let firstMount = true; // module state is per browser tab; effects never run on the server

export default function Template({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (firstMount) {
      firstMount = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
  }, []);
  return <div ref={ref}>{children}</div>;
}
