"use client";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";
import type { Breakdown } from "@/lib/pricing";

/** "₹ 2,399" — the live site sets a space after the rupee sign in the summary rows. */
const rs = (n: number) => inr(n).replace("₹", "₹ ");

/** A filled green check, drawn inline so it stays a flat circle. */
function CheckDot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={cn("size-[18px] shrink-0", className)}>
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <path d="M5.8 10.4l2.8 2.8 5.6-6" fill="none" className="stroke-white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** "Yay! You are saving ₹1,199." — green tint, green hairline. Screen readers get the plainer sentence. */
export function SavingsStrip({ amount, className }: { amount: number; className?: string }) {
  if (amount <= 0) return null;
  return (
    <p role="status" className={cn("flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-emerald/40 bg-emerald-tint px-3 py-2.5 text-[14px] text-ink", className)}>
      <CheckDot className="text-emerald" />
      <span aria-hidden>Yay! You are saving {inr(amount)}.</span>
      <span className="sr-only">You’re saving {inr(amount)} on this order</span>
    </p>
  );
}

/**
 * The Price Summary card of the live bag: title, "Prices are inclusive of all taxes", the rows, a bold "You Pay", and — when there
 * is a saving — the green "Yay!" strip. Rows appear only when they apply (a discount row only when something was discounted).
 * `title` renames the card (e.g. "Payment summary" on a placed order); `bare` drops the card chrome and the visible title (inside a disclosure that already has one).
 */
export function PriceSummary({ b, title = "Price Summary", as: H = "h2", bare, className, deliveryLabel, children }: { b: Breakdown; title?: string; as?: "h2" | "h3"; bare?: boolean; className?: string; deliveryLabel?: string; children?: ReactNode }) {
  const id = useId();
  const row = "flex items-baseline justify-between gap-4 py-2.5 text-[15px]";
  const afterCoupon = b.subtotal - b.couponDiscount;
  const reduced = b.productDiscount > 0 || b.couponDiscount > 0;
  return (
    <section aria-labelledby={id} className={cn(!bare && "rounded-[var(--radius-sm)] border border-line-strong bg-white p-4 sm:p-5", className)}>
      <H id={id} className={bare ? "sr-only" : "text-[20px] font-semibold leading-tight tracking-[-0.01em]"}>{title}</H>
      <p className={cn("text-[14px] text-ink-2", bare ? "mb-1" : "mt-1.5")}>Prices are inclusive of all taxes</p>
      <dl className="mt-3 tabular-nums">
        <div className={row}>
          <dt>Bag Total{b.itemCount ? ` (${b.itemCount} ${b.itemCount === 1 ? "item" : "items"})` : ""}</dt>
          <dd>{rs(b.mrpTotal)}</dd>
        </div>
        {b.productDiscount > 0 && (
          <div className={row}>
            <dt>Discount on MRP</dt>
            <dd className="text-emerald">-{rs(b.productDiscount)}</dd>
          </div>
        )}
        {b.couponDiscount > 0 && (
          <div className={row}>
            <dt>Coupon <span className="font-semibold tracking-[0.04em]">{b.couponCode}</span></dt>
            <dd className="text-emerald">-{rs(b.couponDiscount)}</dd>
          </div>
        )}
        {reduced && (
          <div className={row}>
            <dt>Sub Total</dt>
            <dd>{rs(afterCoupon)}</dd>
          </div>
        )}
        <div className={row}>
          <dt>{deliveryLabel ?? "Delivery"}</dt>
          <dd>{b.shipping === 0 ? <span className="font-medium text-emerald">Free</span> : rs(b.shipping)}</dd>
        </div>
        {b.codFee > 0 && (
          <div className={row}>
            <dt>Cash on delivery fee</dt>
            <dd>{rs(b.codFee)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-4 pb-1 pt-3 text-[18px] font-bold">
          <dt>You Pay</dt>
          <dd>{inr(b.total)}</dd>
        </div>
      </dl>
      <SavingsStrip amount={b.youSave} className="mt-3" />
      {children}
    </section>
  );
}
