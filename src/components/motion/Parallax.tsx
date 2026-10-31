"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Moves its content against the scroll (±amount px across its time on screen) inside a clipped frame, with a slight over-scale so the edges never show.
 * The frame keeps its layout box; the moving layer is exempt from the grid audit (data-nogrid). Still for reduced motion.
 */
export function Parallax({ children, amount = 70, scale = 1.14, className, innerClassName }: { children: ReactNode; amount?: number; scale?: number; className?: string; innerClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-amount, amount]);
  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div data-nogrid className={cn("absolute inset-0", innerClassName)} style={reduce ? undefined : { y, scale }}>
        {children}
      </motion.div>
    </div>
  );
}
