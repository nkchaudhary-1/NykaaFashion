"use client";

import { useEffect, useId, useRef, useState } from "react";
import { copy } from "../copy.ts";
import { InfoIcon } from "./icons";

/**
 * "Simulation" — present whenever the panel is not showing real model output. Unmissable by design: solid colour
 * and a word, not an icon. The tooltip opens on hover, keyboard focus, or tap (iOS Safari does not focus buttons).
 */
export function SimBadge({ label = copy.labels.silhouette }: { label?: { badge: string; tooltip: string } }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <span ref={root} className="group relative inline-flex" data-testid="sim-badge">
      {/* The button is the 44px touch target; the visible pill sits inside it. */}
      <button
        type="button"
        aria-describedby={id}
        aria-expanded={open}
        aria-label={`${label.badge}. ${copy.sim.info}`}
        onClick={() => setOpen((o) => !o)}
        className="-my-1 inline-flex min-h-11 min-w-11 items-center rounded-full"
      >
        <span
          aria-hidden="true"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-sim px-3 py-1.5 text-[13px] font-semibold leading-none text-on-sim shadow-[0_1px_0_rgba(0,0,0,0.12)]"
        >
          {label.badge}
          <InfoIcon />
        </span>
      </button>
      <span
        id={id}
        role="tooltip"
        className={`absolute left-0 top-full z-30 mt-1 w-64 max-w-[calc(100vw-3rem)] rounded-2xl bg-ink px-3.5 py-3 text-[13px] leading-snug text-paper shadow-lg group-hover:block group-focus-within:block ${open ? "block" : "hidden"}`}
      >
        {label.tooltip}
      </span>
    </span>
  );
}
