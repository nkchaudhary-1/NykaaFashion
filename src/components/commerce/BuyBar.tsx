"use client";
import { ArrowRight, ChevronUp, Info } from "lucide-react";
import { useId, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";
import type { Breakdown } from "@/lib/pricing";

/**
 * The bottom bar of the live bag, used by the mini-bag drawer and (below 1024px) the bag page:
 * a green "You'll save ₹X on this order" toggle that opens the saving breakdown, then the amount to pay with
 * "Your Savings ₹X" under it and a large navy "Proceed to Buy". The link's accessible name starts with "Checkout".
 */
export function BuyBar({ price, blocked, onNavigate, className }: { price: Breakdown; blocked?: boolean; onNavigate?: () => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  const saving = price.youSave > 0;
  return (
    <div className={cn("bg-white", className)}>
      {saving && (
        <>
          <button type="button" aria-expanded={open} aria-controls={panel} onClick={() => setOpen((o) => !o)} className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-none bg-emerald-tint px-4 py-2 text-[14px] text-emerald">
            <span>
              You’ll save <strong className="text-[16px] font-semibold tabular-nums">{inr(price.youSave)}</strong> on this order
            </span>
            <ChevronUp size={16} strokeWidth={2.2} aria-hidden className={cn("transition-transform duration-300", open && "rotate-180")} />
          </button>
          <div id={panel} hidden={!open} className="space-y-1.5 bg-emerald-tint px-4 pb-3 text-[13.5px] text-ink-2 tabular-nums">
            {price.productDiscount > 0 && (
              <p className="flex justify-between gap-4"><span>Discount on MRP</span><span className="text-emerald">-{inr(price.productDiscount)}</span></p>
            )}
            {price.couponDiscount > 0 && (
              <p className="flex justify-between gap-4"><span>Coupon {price.couponCode}</span><span className="text-emerald">-{inr(price.couponDiscount)}</span></p>
            )}
            {price.shipping === 0 && price.itemCount > 0 && (
              <p className="flex justify-between gap-4"><span>Delivery</span><span className="text-emerald">Free</span></p>
            )}
          </div>
        </>
      )}
      <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[18px] font-bold leading-tight tabular-nums">
            {inr(price.total)}
            <span title="Total payable, inclusive of all taxes" className="text-ink-3"><Info size={15} strokeWidth={1.6} aria-hidden /></span>
          </p>
          {saving && (
            <p className="mt-0.5 text-[14px] leading-tight text-emerald">
              Your Savings <strong className="text-[16px] font-semibold tabular-nums">{inr(price.youSave)}</strong>
            </p>
          )}
        </div>
        <LinkButton
          href="/checkout"
          size="lg"
          aria-label="Checkout · Proceed to Buy"
          aria-disabled={blocked || undefined}
          tabIndex={blocked ? -1 : undefined}
          onClick={(e) => (blocked ? e.preventDefault() : onNavigate?.())}
          iconRight={<ArrowRight size={16} aria-hidden />}
          className="min-w-[10.5rem] flex-1 sm:max-w-[16rem]"
        >
          Proceed to Buy
        </LinkButton>
      </div>
    </div>
  );
}
