"use client";
import Link from "next/link";
import { ArrowRight, ChevronRight, ShoppingBag, X } from "lucide-react";
import { BagLineRow } from "@/components/commerce/BagLine";
import { BuyBar } from "@/components/commerce/BuyBar";
import { CouponsAndOffers } from "@/components/commerce/CouponBox";
import { FreeShippingBar } from "@/components/commerce/FreeShippingBar";
import { PriceSummary } from "@/components/commerce/PriceSummary";
import { TrustStrip } from "@/components/commerce/TrustStrip";
import { LinkButton } from "@/components/ui/Button";
import { Overlay, OverlayBody } from "@/components/ui/Overlay";
import { priceBag } from "@/lib/pricing";
import { useBag } from "@/stores/commerce";
import { setUI, useUI } from "@/stores/ui";

const SHORTCUTS = [
  { href: "/edits/new-in", label: "New in" },
  { href: "/edits/hidden-gems", label: "Hidden Gems" },
  { href: "/edits/the-offer-edit", label: "The Offer Edit" },
];

/**
 * The mini-bag, after the live bag drawer: a header with the close ✕ on the left, the lines, "Coupons and Offers" with the best coupon,
 * the Price Summary and a grey trust strip — all in one scrolling body — and a bar that never leaves the bottom: the green
 * "You'll save" toggle, the amount to pay with "Your Savings", and "Proceed to Buy". One hairline border (from Overlay), no shadow.
 */
export function BagDrawer() {
  const { bagOpen } = useUI();
  const { lines, count, coupon } = useBag();
  const close = () => setUI({ bagOpen: false });
  const price = priceBag(lines, { coupon });
  const blocked = lines.some((l) => l.stock === 0);
  return (
    <Overlay open={bagOpen} onClose={close} label="Shopping bag" side="right" hideClose>
      {/* a div, not <header>: inside a dialog a <header> would count as a second banner landmark */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <button type="button" onClick={close} aria-label="Close" className="tap inline-flex size-11 shrink-0 items-center justify-center text-ink transition-colors hover:bg-sand">
          <X size={28} strokeWidth={1.3} aria-hidden />
        </button>
        <h2 className="flex min-w-0 flex-1 items-baseline gap-2.5 text-[26px] font-semibold leading-none tracking-[-0.015em]">
          Bag
          {count > 0 && <span className="text-[15px] font-normal tracking-normal text-ink-2">{count} {count === 1 ? "Item" : "Items"}</span>}
        </h2>
        {count > 0 && (
          <Link href="/bag" onClick={close} className="link-u tap inline-flex shrink-0 items-center gap-0.5 text-[15px] font-semibold text-pink">
            View bag <ChevronRight size={17} strokeWidth={2.2} aria-hidden />
          </Link>
        )}
      </div>

      {lines.length === 0 ? (
        <OverlayBody className="flex flex-col">
          <ShoppingBag size={34} strokeWidth={1.1} className="text-ink" aria-hidden />
          <p className="mt-6 text-[20px] font-semibold tracking-[-0.01em]">Your bag is empty</p>
          <p className="mt-2 max-w-[32ch] text-[15px] leading-relaxed text-ink-2">Start with an edit — the pieces are chosen, not scrolled.</p>
          <LinkButton href="/edits" size="lg" className="mt-6 self-start" onClick={close}>
            Explore the edits
          </LinkButton>
          <p className="mt-10 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-3">Or start with</p>
          <ul className="mt-3 border-t border-line">
            {SHORTCUTS.map((s) => (
              <li key={s.href}>
                <Link href={s.href} onClick={close} className="group flex h-12 items-center justify-between border-b border-line text-[15px] font-medium transition-colors hover:bg-sand">
                  <span className="pl-1">{s.label}</span>
                  <ArrowRight size={16} aria-hidden className="mr-1 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </OverlayBody>
      ) : (
        <>
          <OverlayBody flush>
            <FreeShippingBar remaining={price.freeShippingRemaining} className="px-4 py-3 sm:px-5" />
            <ul aria-label="Items in your bag" className="px-4 sm:px-5">
              {lines.map((l) => (
                <BagLineRow key={l.id} line={l} compact onNavigate={close} />
              ))}
            </ul>
            <CouponsAndOffers lines={lines} applied={coupon} error={price.couponError} viewAll={{ href: "/bag#offers", onClick: close }} className="mx-4 mt-5 sm:mx-5" />
            <PriceSummary b={price} className="mx-4 mt-6 sm:mx-5" />
            <TrustStrip className="mt-6" />
          </OverlayBody>
          <BuyBar price={price} blocked={blocked} onNavigate={close} className="shrink-0 border-t border-line" />
        </>
      )}
    </Overlay>
  );
}
