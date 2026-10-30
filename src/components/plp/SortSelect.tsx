"use client";
import { ChevronDown } from "lucide-react";
import { useId } from "react";
import { SORTS, type SortKey } from "@/lib/filters";
import { cn } from "@/lib/cn";

export function SortSelect({ value, onChange, className, variant = "inline" }: { value: SortKey; onChange: (s: SortKey) => void; className?: string; variant?: "inline" | "pill" }) {
  const id = useId();
  const current = SORTS.find((s) => s.id === value)!;
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <label htmlFor={id} className={cn(variant === "inline" ? "mr-2 text-[13px] text-ink-3" : "sr-only")}>
        Sort by
      </label>
      {variant === "inline" ? (
        <div className="relative">
          <select id={id} value={value} onChange={(e) => onChange(e.target.value as SortKey)} className="h-11 appearance-none border border-line-strong bg-white pl-4 pr-10 text-[13.5px] text-ink hover:border-ink focus:border-ink focus:outline-none">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      ) : (
        <div className="relative flex h-12 items-center gap-1.5 px-5 text-[12px] font-medium uppercase tracking-[0.1em]">
          Sort{value !== "curated" && <span className="text-ink-3 normal-case tracking-normal">· {current.label.split(":")[0]}</span>}
          <ChevronDown size={14} aria-hidden />
          <select id={id} value={value} onChange={(e) => onChange(e.target.value as SortKey)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
