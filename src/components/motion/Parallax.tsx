"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (notify: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
};
/** false on the server and during hydration (so the markup matches), then the visitor's real setting. */
const useReduced = () => useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);

/**
 * Moves its content against the scroll (±amount px across its time on screen) inside a clipped frame, with a slight over-scale so the edges never show.
 * The frame keeps its layout box; the moving layer is exempt from the grid audit (data-nogrid). Still (no movement, no over-scale) for reduced motion.
 */
export function Parallax({ children, amount = 70, scale = 1.14, className, innerClassName }: { children: ReactNode; amount?: number; scale?: number; className?: string; innerClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const travel = reduce ? 0 : amount;
  const y = useTransform(scrollYProgress, [0, 1], [-travel, travel]);
  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div data-nogrid className={cn("absolute inset-0", innerClassName)} style={{ y, scale: reduce ? 1 : scale }}>
        {children}
      </motion.div>
    </div>
  );
}
