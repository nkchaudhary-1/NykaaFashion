"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { track } from "@/lib/track";
import type { HomeModuleId } from "@/lib/home";
import type { IntentMode } from "@/stores/intent";

/** Animates adaptive re-ordering (position only — no content distortion) and logs home_module_view once per mode. */
export function ModuleShell({ id, position, mode, children, className }: { id: HomeModuleId; position: number; mode: IntentMode; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef<string | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const key = `${id}:${mode}`;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && seen.current !== key) {
          seen.current = key;
          track("home_module_view", { moduleType: id, position, intentState: mode });
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id, mode, position]);
  return (
    <motion.section ref={ref} layout="position" data-module={id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], layout: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }} className={className}>
      {children}
    </motion.section>
  );
}
