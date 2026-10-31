import type { CSSProperties, ReactNode } from "react";
import { Rise } from "@/components/motion/reveal";

/**
 * Scroll reveal for grids and lists (kept for the existing call sites): a thin wrapper over the shared reveal system in components/motion —
 * the block rises and fades once as it enters the viewport, with an optional per-column stagger via `delay`.
 * SSR output is fully visible, so no-JS, bots and reduced-motion visitors see everything.
 */
export function Reveal({ children, delay = 0, y = 28, className, as: Tag = "div", style }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "li" | "section" | "article"; style?: CSSProperties }) {
  return (
    <Rise as={Tag} className={className} delay={delay} y={y} style={style}>
      {children}
    </Rise>
  );
}
