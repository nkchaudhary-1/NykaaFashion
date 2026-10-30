"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Disclosure({ title, children, defaultOpen = false, className, headingLevel = 3, meta }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; className?: string; headingLevel?: 2 | 3 | 4; meta?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const reduce = useReducedMotion();
  const H = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <div className={cn("border-b border-line", className)}>
      <H className="m-0">
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="flex min-h-12 w-full items-center justify-between gap-4 py-3 text-left text-[14px] font-medium text-ink">
          <span className="flex items-baseline gap-2">
            {title}
            {meta && <span className="text-[12px] font-normal text-ink-3">{meta}</span>}
          </span>
          <ChevronDown size={18} strokeWidth={1.6} aria-hidden className={cn("shrink-0 transition-transform duration-300 ease-editorial", open && "rotate-180")} />
        </button>
      </H>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={id} initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="pb-5 text-[14px] leading-relaxed text-ink-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
