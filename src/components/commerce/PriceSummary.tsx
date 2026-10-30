import { Tag } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";
import type { Breakdown } from "@/lib/pricing";

/** Itemised price breakdown. Discount rows appear only when there is a discount (PRD §6.1). */
export function PriceSummary({ b, className, deliveryLabel, children }: { b: Breakdown; className?: string; deliveryLabel?: string; children?: ReactNode }) {
  const row = "flex items-baseline justify-between gap-4 py-1.5 text-[14px]";
  return (
    <div className={cn("tabular-nums", className)}>
      <dl>
      <div className={row}>
        <dt className="text-ink-2">Bag total{b.itemCount ? ` (${b.itemCount} ${b.itemCount === 1 ? "item" : "items"})` : ""}</dt>
        <dd>{inr(b.mrpTotal)}</dd>
      </div>
      {b.productDiscount > 0 && (
        <div className={row}>
          <dt className="text-ink-2">Discount on MRP</dt>
          <dd className="text-emerald">− {inr(b.productDiscount)}</dd>
        </div>
      )}
      {b.couponDiscount > 0 && (
        <div className={row}>
          <dt className="text-ink-2">Coupon <span className="text-[12.5px] font-medium tracking-[0.08em] text-ink">{b.couponCode}</span></dt>
          <dd className="text-emerald">− {inr(b.couponDiscount)}</dd>
        </div>
      )}
      <div className={row}>
        <dt className="text-ink-2">{deliveryLabel ?? "Delivery"}</dt>
        <dd>{b.shipping === 0 ? <span className="font-medium text-emerald">Free</span> : inr(b.shipping)}</dd>
      </div>
      {b.codFee > 0 && (
        <div className={row}>
          <dt className="text-ink-2">Cash on delivery fee</dt>
          <dd>{inr(b.codFee)}</dd>
        </div>
      )}
      <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-ink pt-4">
        <dt className="text-[15px] font-medium">Total</dt>
        <dd className="text-[20px] font-medium">{inr(b.total)}</dd>
      </div>
      </dl>
      <p className="mt-1 text-right text-[12px] text-ink-3">Inclusive of all taxes</p>
      {b.youSave > 0 && (
        <p className="mt-4 flex items-center gap-2 bg-pink-tint px-3.5 py-3 text-[13.5px] font-semibold text-pink-ink">
          <Tag size={15} strokeWidth={1.8} aria-hidden className="shrink-0" />
          <span>You’re saving {inr(b.youSave)} on this order</span>
        </p>
      )}
      {children}
    </div>
  );
}
