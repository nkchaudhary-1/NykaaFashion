"use client";
import { ShoppingBag } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Overlay, OverlayBody, OverlayFooter, OverlayHeader } from "@/components/ui/Overlay";
import { BagLineRow } from "@/components/commerce/BagLine";
import { FreeShippingBar } from "@/components/commerce/FreeShippingBar";
import { inr } from "@/lib/format";
import { priceBag } from "@/lib/pricing";
import { useBag } from "@/stores/commerce";
import { setUI, useUI } from "@/stores/ui";

export function BagDrawer() {
  const { bagOpen } = useUI();
  const { lines, count, coupon } = useBag();
  const close = () => setUI({ bagOpen: false });
  const price = priceBag(lines, { coupon });
  return (
    <Overlay open={bagOpen} onClose={close} label="Shopping bag" side="right">
      <OverlayHeader title={count ? `Your bag · ${count}` : "Your bag"} />
      {lines.length === 0 ? (
        <OverlayBody className="flex flex-col items-center justify-center text-center">
          <ShoppingBag size={34} strokeWidth={1.2} className="text-ink-3" aria-hidden />
          <p className="display-xs mt-5">Your bag is empty</p>
          <p className="mt-2 max-w-[28ch] text-[14px] text-ink-3">Start with an edit — the pieces are chosen, not scrolled.</p>
          <LinkButton href="/edits" className="mt-6" onClick={close}>
            Explore the edits
          </LinkButton>
        </OverlayBody>
      ) : (
        <>
          <OverlayBody>
            <div className="-mx-5 -mt-5 mb-5 sm:-mx-6">
              <FreeShippingBar remaining={price.freeShippingRemaining} />
            </div>
            <ul>
              {lines.map((l) => (
                <BagLineRow key={l.id} line={l} compact onNavigate={close} />
              ))}
            </ul>
          </OverlayBody>
          <OverlayFooter>
            <dl className="mb-4 flex items-baseline justify-between text-[14px]">
              <dt className="text-ink-2">Subtotal</dt>
              <dd className="text-[18px] font-medium tabular-nums">{inr(price.subtotal)}</dd>
            </dl>
            <p className="mb-4 text-[12px] text-ink-3">Delivery, offers and taxes are shown at checkout.</p>
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
