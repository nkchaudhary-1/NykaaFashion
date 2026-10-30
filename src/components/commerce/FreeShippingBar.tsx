import { Truck } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/data/commerce";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";

/** Flat strip: a sentence and a 4px progress bar toward free delivery. */
export function FreeShippingBar({ remaining, className = "px-4 py-3.5 sm:px-5" }: { remaining: number; className?: string }) {
  const done = remaining <= 0;
  const pct = Math.min(100, Math.round(((FREE_SHIPPING_THRESHOLD - remaining) / FREE_SHIPPING_THRESHOLD) * 100));
  return (
    <div className={cn("bg-pink-tint", className)}>
      <p className="flex items-center gap-2.5 text-[13px] text-ink">
        <Truck size={17} strokeWidth={1.6} aria-hidden className="shrink-0 text-pink" />
        {done ? <span className="font-medium">You’ve unlocked free delivery</span> : <span>Add <strong className="font-semibold tabular-nums">{inr(remaining)}</strong> more for free delivery</span>}
      </p>
      <div role="progressbar" aria-label="Progress to free delivery" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="mt-3 h-1 overflow-hidden bg-pink-soft">
        <div className="h-full bg-pink transition-[width] duration-700 ease-editorial" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
