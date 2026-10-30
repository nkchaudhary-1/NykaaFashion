"use client";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

/** Accessible tablist (roving tabindex + arrow keys). Panels are rendered by the caller. */
/** With `panelId` this is a real tablist (caller renders the matching role="tabpanel"); without it, a group of toggle buttons (filters). */
export function Tabs({ items, value, onChange, label, className, variant = "underline", panelId }: { items: TabItem[]; value: string; onChange: (id: string) => void; label: string; className?: string; variant?: "underline" | "pill"; panelId?: string }) {
  const base = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const j = e.key === "Home" ? 0 : items.length - 1;
      refs.current[j]?.focus();
      onChange(items[j].id);
    }
    if (!dir) return;
    e.preventDefault();
    const j = (i + dir + items.length) % items.length;
    refs.current[j]?.focus();
    onChange(items[j].id);
  };
  return (
    <div role={panelId ? "tablist" : "group"} aria-label={label} className={cn("scrollbar-none flex gap-1 overflow-x-auto", variant === "underline" && "border-b border-line", className)}>
      {items.map((t, i) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            {...(panelId
              ? { role: "tab", id: `${base}-${t.id}`, "aria-selected": active, "aria-controls": panelId, tabIndex: active ? 0 : -1, onKeyDown: (e: KeyboardEvent) => onKey(e, i) }
              : { "aria-pressed": active })}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-[13px] font-medium transition-colors",
              variant === "underline"
                ? cn("after:absolute after:inset-x-3 after:bottom-0 after:h-px after:origin-left after:bg-ink after:transition-transform after:duration-300", active ? "text-ink after:scale-x-100" : "text-ink-3 after:scale-x-0 hover:text-ink")
                : cn("border", active ? "border-ink bg-ink text-bone" : "border-line-strong text-ink-2 hover:border-ink"),
            )}
          >
            {t.label}
            {t.count !== undefined && <span className={cn("text-[11px] tabular-nums", active ? "opacity-70" : "text-ink-3")}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
export type { ReactNode };
