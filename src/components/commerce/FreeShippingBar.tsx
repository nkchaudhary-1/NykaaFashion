import { Truck } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/data/commerce";
import { inr } from "@/lib/format";

export function FreeShippingBar({ remaining }: { remaining: number }) {
  const done = remaining <= 0;
  const pct = Math.min(100, Math.round(((FREE_SHIPPING_THRESHOLD - remaining) / FREE_SHIPPING_THRESHOLD) * 100));
  return (
    <div className="bg-sand px-4 py-3.5">
      <p className="flex items-center gap-2 text-[13px] text-ink">
        <Truck size={16} aria-hidden />
        {done ? <span className="font-medium">You’ve unlocked free delivery</span> : <span>Add <strong className="font-semibold tabular-nums">{inr(remaining)}</strong> more for free delivery</span>}
      </p>
      <div role="progressbar" aria-label="Progress to free delivery" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="mt-2.5 h-1 overflow-hidden bg-line-strong/60">
        <div className="h-full bg-ink transition-[width] duration-700 ease-editorial" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
