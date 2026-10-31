"use client";
import { ArrowDownUp, ChevronDown } from "lucide-react";
import { useId } from "react";
import { SORTS, type SortKey } from "@/lib/filters";
import { cn } from "@/lib/cn";

const SHORT: Record<SortKey, string> = { curated: "Curated", new: "New in", "price-asc": "Low to high", "price-desc": "High to low", rating: "Rating", discount: "Discount" };

/**
 * Sort control — a native <select>, so touch devices get the platform picker.
 * `inline` (tablet / desktop): "Sort by" + a flat 44px select. `button` (phones): sits beside Filter as an equal-width button.
 */
export function SortSelect({ value, onChange, className, variant = "inline" }: { value: SortKey; onChange: (s: SortKey) => void; className?: string; variant?: "inline" | "button" }) {
  const id = useId();
  const options = SORTS.map((s) => (
    <option key={s.id} value={s.id}>
      {s.label}
    </option>
  ));
  if (variant === "button") {
    return (
      <div className={cn("relative flex h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-ink px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink hover:bg-sand", className)}>
        <label htmlFor={id} className="sr-only">
          Sort by
        </label>
        <span className="flex min-w-0 items-center gap-2">
          <ArrowDownUp size={15} aria-hidden className="shrink-0" />
          <span className="truncate">
            Sort<span className="font-medium normal-case tracking-normal text-ink-2"> · {SHORT[value]}</span>
          </span>
        </span>
        <ChevronDown size={14} aria-hidden className="shrink-0" />
        <select id={id} value={value} onChange={(e) => onChange(e.target.value as SortKey)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
          {options}
        </select>
      </div>
    );
  }
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <label htmlFor={id} className="eyebrow mr-3 whitespace-nowrap text-ink-3">
        Sort by
      </label>
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value as SortKey)} className="h-11 appearance-none border border-line-strong bg-transparent pl-4 pr-10 text-[13.5px] text-ink transition-colors duration-300 hover:border-ink focus:border-ink">
          {options}
        </select>
        <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}
