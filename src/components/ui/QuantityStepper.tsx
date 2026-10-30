"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export function QuantityStepper({ value, onChange, min = 1, max = 6, label, className }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string; className?: string }) {
  return (
    <div role="group" aria-label={`Quantity for ${label}`} className={cn("inline-flex h-10 items-center border border-line-strong bg-white", className)}>
      <button type="button" aria-label={`Decrease quantity of ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="inline-flex size-10 items-center justify-center text-ink transition-colors hover:bg-sand disabled:opacity-35 disabled:hover:bg-transparent">
        <Minus size={15} />
      </button>
      <span aria-live="polite" className="min-w-8 text-center text-[14px] tabular-nums">
        {value}
      </span>
      <button type="button" aria-label={`Increase quantity of ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="inline-flex size-10 items-center justify-center text-ink transition-colors hover:bg-sand disabled:opacity-35 disabled:hover:bg-transparent">
        <Plus size={15} />
      </button>
    </div>
  );
}
