"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Img, SIZES } from "@/components/ui/Img";
import { Overlay, OverlayBody } from "@/components/ui/Overlay";
import { Price } from "@/components/ui/Price";
import { RatingLine } from "@/components/ui/Rating";
import { productById } from "@/data/catalog";
import { labelById } from "@/data/labels";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { setUI, useUI } from "@/stores/ui";
import { ColorPicker } from "./ColorSwatches";
import { SaveButton } from "./SaveButton";
import { SizeSelector } from "./SizeSelector";
import { useProductSelection } from "./useSelection";

export function QuickViewHost() {
  const { quickView } = useUI();
  const product = quickView ? productById[quickView.productId] : null;
  const close = () => setUI({ quickView: null });
  return (
    <Overlay open={!!product} onClose={close} label={product ? `Quick view: ${product.name}` : "Quick view"} side="center" panelClassName="sm:w-[min(94vw,880px)] sm:max-h-[90dvh]">
      {product && <QuickViewBody key={`${product.id}-${quickView?.variant ?? 0}`} product={product} initialVariant={quickView?.variant ?? 0} />}
    </Overlay>
  );
}

/** Two equal halves (6 + 6 of the 12 columns) on a flat dialog: the shot on the left, the same buy controls as the product page on the right. Stacked on phones. */
function QuickViewBody({ product, initialVariant }: { product: Product; initialVariant: number }) {
  const groupRef = useRef<HTMLDivElement>(null);
  const sel = useProductSelection(product, initialVariant, groupRef);
  const [shot, setShot] = useState(0);
  const label = labelById[product.labelId];
  const v = product.variants[sel.variant];
  const at = Math.min(shot, v.images.length - 1);
  const close = () => setUI({ quickView: null });
  return (
    <OverlayBody flush>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="bg-sand">
          {/* phones keep the whole garment in view: the box is capped at under half the screen and the shot is letterboxed on the flat average colour */}
          <Img imgKey={v.images[at]} alt={`${product.name} in ${v.colorName}`} sizes={SIZES.half} ratio="4/5" load="eager" className="max-sm:max-h-[44dvh]" imgClassName="max-sm:object-contain" />
          {v.images.length > 1 && (
            <div className="flex items-center justify-between gap-4 border-t border-line bg-paper px-4 sm:px-5">
              <p aria-live="polite" className="text-[12px] tabular-nums text-ink-3">
                Image {at + 1} of {v.images.length}
              </p>
              <div className="flex gap-1.5">
                {v.images.map((_, i) => (
                  <button key={i} type="button" aria-label={`Show image ${i + 1} of ${v.images.length}`} aria-pressed={at === i} onClick={() => setShot(i)} className="flex h-11 w-9 items-center">
                    <span className={cn("block h-[3px] w-full transition-colors", at === i ? "bg-pink" : "bg-line-strong")} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-5 p-5 sm:p-8">
          <div className="pr-10 sm:pr-8">
            <Link href={`/brands/${label.id}`} onClick={close} className="tap text-[17px] font-semibold leading-tight text-ink transition-colors hover:text-pink-ink">
              {label.name}
            </Link>
            <h2 className="mt-1.5 text-[16px] font-normal leading-snug text-ink-2">{product.name}</h2>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
              <Price price={product.price} mrp={product.mrp} size="lg" />
              <RatingLine rating={product.rating} count={product.ratingCount} />
            </div>
          </div>
          {product.variants.length > 1 && <ColorPicker product={product} value={sel.variant} onChange={(i) => (sel.setVariant(i), setShot(0))} />}
          <SizeSelector product={product} sel={sel} groupRef={groupRef} compact />
          <div className="flex items-stretch gap-2">
            {sel.soldOutSize ? (
              <Button full size="lg" variant="secondary" onClick={() => sel.add("quickview")}>
                Notify me
              </Button>
            ) : (
              <Button full size="lg" onClick={() => sel.add("quickview")}>
                Add to bag
              </Button>
            )}
            <SaveButton product={product} variant={sel.variant} source="quickview" tone="plain" size={22} className="size-[52px] shrink-0 border border-ink" />
          </div>
          <LinkButton href={`/p/${product.slug}`} variant="ghost" size="md" full iconRight={<ArrowRight size={15} />} onClick={close}>
            View full details
          </LinkButton>
        </div>
      </div>
    </OverlayBody>
  );
}
