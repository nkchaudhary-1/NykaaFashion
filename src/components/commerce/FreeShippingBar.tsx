import { Truck } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/data/commerce";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";

/** Flat green strip: a sentence and a 4px progress bar toward free delivery (green = a saving, as everywhere on the bag). */
export function FreeShippingBar({ remaining, className = "px-4 py-3.5 sm:px-5" }: { remaining: number; className?: string }) {
  const done = remaining <= 0;
  const pct = done ? 100 : Math.max(0, Math.min(99, Math.floor(((FREE_SHIPPING_THRESHOLD - remaining) / FREE_SHIPPING_THRESHOLD) * 100)));
  return (
    <div className={cn("bg-emerald-tint", className)}>
      <p className="flex items-center gap-2.5 text-[14px] text-ink">
        <Truck size={18} strokeWidth={1.6} aria-hidden className="shrink-0 text-emerald" />
        {done ? <span className="font-semibold text-emerald">You’ve unlocked free delivery</span> : <span>Add <strong className="font-semibold tabular-nums">{inr(remaining)}</strong> more for free delivery</span>}
      </p>
      <div role="progressbar" aria-label="Progress to free delivery" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="mt-2.5 h-1 overflow-hidden bg-white">
        <div className="h-full bg-emerald transition-[width] duration-700 ease-editorial" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
