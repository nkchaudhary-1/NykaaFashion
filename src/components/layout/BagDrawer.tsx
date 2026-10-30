"use client";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Overlay, OverlayBody, OverlayFooter, OverlayHeader } from "@/components/ui/Overlay";
import { BagLineRow } from "@/components/commerce/BagLine";
import { FreeShippingBar } from "@/components/commerce/FreeShippingBar";
import { inr } from "@/lib/format";
import { priceBag } from "@/lib/pricing";
import { useBag } from "@/stores/commerce";
import { setUI, useUI } from "@/stores/ui";

const SHORTCUTS = [
  { href: "/edits/new-in", label: "New in" },
  { href: "/edits/hidden-gems", label: "Hidden Gems" },
  { href: "/edits/the-offer-edit", label: "The Offer Edit" },
];

/** Flat right drawer: one ink border (from Overlay), compact line rows, a footer that always shows the subtotal and the way to checkout. */
export function BagDrawer() {
  const { bagOpen } = useUI();
  const { lines, count, coupon } = useBag();
  const close = () => setUI({ bagOpen: false });
  const price = priceBag(lines, { coupon });
  return (
    <Overlay open={bagOpen} onClose={close} label="Shopping bag" side="right">
      <OverlayHeader title={count ? `Your bag · ${count}` : "Your bag"} sub={count ? `${count === 1 ? "1 piece" : `${count} pieces`}, saved on this device` : undefined} />
      {lines.length === 0 ? (
        <OverlayBody className="flex flex-col">
          <ShoppingBag size={34} strokeWidth={1.1} className="text-ink" aria-hidden />
          <p className="display-xs mt-6">Your bag is empty</p>
          <p className="mt-2 max-w-[30ch] text-[14px] leading-relaxed text-ink-3">Start with an edit — the pieces are chosen, not scrolled.</p>
          <LinkButton href="/edits" className="mt-6 self-start" onClick={close}>
            Explore the edits
          </LinkButton>
          <p className="eyebrow mt-10 text-ink-3">Or start with</p>
          <ul className="mt-3 border-t border-line">
            {SHORTCUTS.map((s) => (
              <li key={s.href}>
                <Link href={s.href} onClick={close} className="group flex h-12 items-center justify-between border-b border-line text-[14px] font-medium transition-colors hover:bg-sand">
                  <span className="pl-1">{s.label}</span>
                  <ArrowRight size={15} aria-hidden className="mr-1 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </OverlayBody>
      ) : (
        <>
          <OverlayBody>
            <div className="-mx-5 -mt-5 mb-5 sm:-mx-6">
              <FreeShippingBar remaining={price.freeShippingRemaining} className="px-5 py-3.5 sm:px-6" />
            </div>
            <ul aria-label="Items in your bag">
              {lines.map((l) => (
                <BagLineRow key={l.id} line={l} compact onNavigate={close} />
              ))}
            </ul>
          </OverlayBody>
          <OverlayFooter>
            <dl className="flex items-baseline justify-between text-[14px]">
              <dt className="text-ink-2">Subtotal</dt>
              <dd className="text-[20px] font-medium tabular-nums">{inr(price.subtotal)}</dd>
            </dl>
            <p className="mb-4 mt-1 text-[12px] text-ink-3">Delivery, offers and taxes are shown at checkout.</p>
            <div className="grid grid-cols-2 gap-3">
              <LinkButton href="/bag" variant="secondary" size="lg" onClick={close}>
                View bag
              </LinkButton>
              <LinkButton href="/checkout" size="lg" onClick={close}>
                Checkout
              </LinkButton>
            </div>
          </OverlayFooter>
        </>
      )}
    </Overlay>
  );
}
