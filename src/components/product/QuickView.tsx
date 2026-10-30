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

function QuickViewBody({ product, initialVariant }: { product: Product; initialVariant: number }) {
  const groupRef = useRef<HTMLDivElement>(null);
  const sel = useProductSelection(product, initialVariant, groupRef);
  const [shot, setShot] = useState(0);
  const label = labelById[product.labelId];
  const v = product.variants[sel.variant];
  const close = () => setUI({ quickView: null });
  return (
    <OverlayBody className="p-0 sm:p-0">
      <div className="grid sm:grid-cols-[1fr_1fr]">
        <div className="relative bg-sand">
          <Img imgKey={v.images[Math.min(shot, v.images.length - 1)]} alt={`${product.name} in ${v.colorName}`} sizes={SIZES.half} ratio="4/5" priority />
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {v.images.map((_, i) => (
              <button key={i} type="button" aria-label={`Show image ${i + 1} of ${v.images.length}`} aria-pressed={shot === i} onClick={() => setShot(i)} className="inline-flex size-6 items-center justify-center">
                <span className={cn("h-1.5 rounded-full transition-all", shot === i ? "w-6 bg-ink" : "w-1.5 bg-ink/40")} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5 p-5 pr-5 sm:p-8">
          <div>
            <Link href={`/brands/${label.id}`} onClick={close} className="eyebrow link-u text-ink-3">
              {label.name}
            </Link>
            <h2 className="display-sm mt-2">{product.name}</h2>
            <Price price={product.price} mrp={product.mrp} size="lg" className="mt-3" />
            <RatingLine rating={product.rating} count={product.ratingCount} className="mt-2" />
          </div>
          {product.variants.length > 1 && <ColorPicker product={product} value={sel.variant} onChange={(i) => (sel.setVariant(i), setShot(0))} />}
          <SizeSelector product={product} sel={sel} groupRef={groupRef} compact />
          <div className="mt-1 flex items-center gap-2">
            {sel.soldOutSize ? (
              <Button full size="lg" variant="secondary" onClick={() => sel.add("quickview")}>
                Notify me
              </Button>
            ) : (
              <Button full size="lg" onClick={() => sel.add("quickview")}>
                Add to bag
              </Button>
            )}
            <SaveButton product={product} variant={sel.variant} source="quickview" tone="plain" className="shrink-0 border border-line-strong" />
          </div>
          <LinkButton href={`/p/${product.slug}`} variant="ghost" size="md" full iconRight={<ArrowRight size={15} />} onClick={close}>
            View full details
          </LinkButton>
        </div>
      </div>
    </OverlayBody>
  );
}
