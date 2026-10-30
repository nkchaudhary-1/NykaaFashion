"use client";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/a11y";
import { cn } from "@/lib/cn";

/**
 * Scroll reveal (PRD §7.2): content already on the first screen stays at rest (no animation, no LCP delay);
 * content below the fold fades/rises once, with an optional per-column stagger via `delay`.
 * SSR output is fully visible, so no-JS and bots see everything.
 */
export function Reveal({ children, delay = 0, y = 20, className, as: Tag = "div", style }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "li" | "section" | "article"; style?: CSSProperties }) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"ssr" | "hidden" | "shown">("ssr");

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || el.getBoundingClientRect().top < window.innerHeight * 0.96) {
      setState("shown");
      return;
    }
    setState("hidden");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hidden = state === "hidden";
  return (
    <Tag
      ref={ref as never}
      className={cn(className)}
      style={{
        ...style,
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translate3d(0, ${y}px, 0)` : undefined,
        transition: state === "shown" ? `opacity 0.8s var(--ease-editorial) ${delay}ms, transform 0.8s var(--ease-editorial) ${delay}ms` : undefined,
      }}
    >
      {children}
    </Tag>
  );
}
