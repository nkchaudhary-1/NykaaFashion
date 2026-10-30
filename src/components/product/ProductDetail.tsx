"use client";
import Link from "next/link";
import { BellRing, Share2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Img } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { RatingLine } from "@/components/ui/Rating";
import { inStockVariantIndex } from "@/data/catalog";
import { labelById } from "@/data/labels";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { peekFlip, playFlip } from "@/lib/flip";
import { alternatives } from "@/lib/recs";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";
import { setUI, toast } from "@/stores/ui";
import { ColorPicker } from "./ColorSwatches";
import { DeliveryCheck } from "./DeliveryCheck";
import { Gallery } from "./Gallery";
import { LabelBadges } from "./LabelMark";
import { ProductCard } from "./ProductCard";
import { SaveButton } from "./SaveButton";
import { SizeSelector } from "./SizeSelector";
import { useProductSelection } from "./useSelection";

export function ProductDetail({ product }: { product: Product }) {
  const groupRef = useRef<HTMLDivElement>(null);
  const sel = useProductSelection(product, inStockVariantIndex(product), groupRef);
  const label = labelById[product.labelId];
  const v = product.variants[sel.variant];
  const heroRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [startShot, setStartShot] = useState(0);
  const [stickyOn, setStickyOn] = useState(false);

  // FLIP: if we arrived from a card, hide the hero until the transition starts and land on the same shot.
  useLayoutEffect(() => {
    const f = peekFlip(product.id);
    if (f && heroRef.current) {
      heroRef.current.style.visibility = "hidden";
      setStartShot(f.shot);
    }
  }, [product.id]);

  useEffect(() => {
    const f = peekFlip(product.id);
    track("pdp_view", { productId: product.id, source: f?.source ?? "direct" });
    signal("pdp_view", { productId: product.id });
    const el = heroRef.current;
    if (f && el) requestAnimationFrame(() => requestAnimationFrame(() => playFlip(product.id, el)));
  }, [product.id]);

  // Sticky add-to-bag: always on touch layouts; on desktop only once the main CTA has scrolled away.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      setStickyOn(!e.isIntersecting && (!desktop || e.boundingClientRect.top < 0));
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    document.documentElement.style.setProperty("--sticky-h", stickyOn && mobile ? "76px" : "0px");
    return () => {
      document.documentElement.style.removeProperty("--sticky-h");
    };
  }, [stickyOn]);

  const share = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: product.name });
      }
    } catch {
      /* user dismissed the share sheet */
    }
  }, [product.name]);

  const cta = sel.soldOutSize || product.soldOut ? "Notify me" : sel.size || product.sizes.length === 1 ? "Add to bag" : "Select a size";
  const act = () => (product.soldOut ? setUI({ notifyMe: { productId: product.id, size: sel.size ?? undefined } }) : sel.add("pdp"));
  const similar = product.soldOut ? alternatives(product, 3) : [];

  return (
    <div className="container-x pb-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 xl:gap-24">
        <Gallery key={sel.variant} images={v.images} name={product.name} colorName={v.colorName} heroRef={heroRef} startIndex={sel.variant === inStockVariantIndex(product) ? startShot : 0} />

        <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/brands/${label.id}`} className="eyebrow link-u text-ink">{label.name}</Link>
            <LabelBadges label={label} />
            {product.responsible && !label.flags.responsible && <Badge tone="emerald">Responsible</Badge>}
            {product.isNew && <Badge tone="outline">New</Badge>}
          </div>
          <div className="mt-4 flex items-start justify-between gap-4">
            <h1 className="display-md text-balance">{product.name}</h1>
            <button type="button" onClick={share} aria-label={`Share ${product.name}`} className="mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-sand">
              <Share2 size={19} strokeWidth={1.5} />
            </button>
          </div>
          <a href="#reviews" className="mt-3 inline-block">
            <RatingLine rating={product.rating} count={product.ratingCount} />
          </a>
          <div className="mt-5">
            <Price price={product.price} mrp={product.mrp} size="lg" className={cn(product.soldOut && "opacity-60")} />
            <p className="mt-1 text-[12px] text-ink-3">Inclusive of all taxes</p>
          </div>
          <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">{product.description}</p>

          <div className="mt-8 space-y-7">
            {product.variants.length > 1 && <ColorPicker product={product} value={sel.variant} onChange={sel.setVariant} />}
            {!product.soldOut && <SizeSelector product={product} sel={sel} groupRef={groupRef} />}
          </div>

          <div ref={ctaRef} className="mt-8 flex items-stretch gap-3">
            {product.soldOut ? (
              <Button full size="lg" variant="secondary" icon={<BellRing size={16} />} onClick={act}>
                Notify me
              </Button>
            ) : (
              <Button full size="lg" variant={sel.soldOutSize ? "secondary" : "primary"} onClick={act} icon={sel.soldOutSize ? <BellRing size={16} /> : undefined}>
                {cta}
              </Button>
            )}
            <SaveButton product={product} variant={sel.variant} source="pdp" tone="plain" size={22} className="size-[52px] shrink-0 border border-line-strong" />
          </div>
          {product.soldOut && (
            <p role="status" className="mt-4 border-l-2 border-ink pl-3 text-[13.5px] text-ink-2">
              This piece is sold out. Leave your number or email and we’ll tell you the moment it’s back — or start with something similar below.
            </p>
          )}

          {product.soldOut && similar.length > 0 && (
            <section aria-label="Similar pieces available now" className="mt-8">
              <p className="eyebrow mb-4 text-ink-3">Similar, available now</p>
              <ul className="grid grid-cols-3 gap-3">
                {similar.map((p) => (
                  <li key={p.id}>
                    <ProductCard product={p} source="pdp-oos-similar" hideQuickView sizes="160px" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-8">
            <DeliveryCheck />
          </div>

          {/* Decision-confidence block (PRD §5.5): fit, fabric and the label's story ahead of any spec dump. */}
          <section aria-labelledby="confidence" className="mt-8">
            <h2 id="confidence" className="sr-only">Fit, fabric and story</h2>
            <dl className="grid gap-5 border-b border-line pb-6 sm:grid-cols-3">
              <div>
                <dt className="eyebrow text-ink-3">Fit</dt>
                <dd className="mt-2 text-[13.5px] leading-snug text-ink">{product.fit}</dd>
                {product.modelNote && <dd className="mt-1 text-[12px] leading-snug text-ink-3">{product.modelNote}</dd>}
              </div>
              <div>
                <dt className="eyebrow text-ink-3">Fabric</dt>
                <dd className="mt-2 text-[13.5px] leading-snug text-ink">{product.fabric}</dd>
                <dd className="mt-1 text-[12px] leading-snug text-ink-3">{product.care[0]}</dd>
              </div>
              <div>
                <dt className="eyebrow text-ink-3">Made by</dt>
                <dd className="mt-2 text-[13.5px] leading-snug text-ink">{label.name}</dd>
                <dd className="mt-1 text-[12px] leading-snug text-ink-3">{label.origin}</dd>
              </div>
            </dl>
            <Disclosure title="Details" defaultOpen>
              <ul className="list-disc space-y-1.5 pl-4 marker:text-ink-3">
                {product.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </Disclosure>
            <Disclosure title="Care">
              <ul className="list-disc space-y-1.5 pl-4 marker:text-ink-3">
                {product.care.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Disclosure>
            <Disclosure title={`About ${label.name}`}>
              <p>{label.story}</p>
              <Link href={`/brands/${label.id}`} className="link-u mt-3 inline-block text-[12px] font-medium uppercase tracking-[0.1em] text-ink">
                See the label
              </Link>
            </Disclosure>
            <Disclosure title="Delivery & returns">
              <p>Standard delivery is free above ₹1,999. Returns and refunds are illustrative in this prototype — see <Link href="/info/returns" className="underline underline-offset-4">returns &amp; refunds</Link>.</p>
            </Disclosure>
          </section>
        </div>
      </div>

      <StickyBar product={product} variantName={v.colorName} image={v.images[0]} on={stickyOn} cta={cta} onClick={act} sizeChosen={!!sel.size || product.sizes.length === 1} size={sel.size} />
    </div>
  );
}

function StickyBar({ product, image, on, cta, onClick, variantName, size, sizeChosen }: { product: Product; image: string; on: boolean; cta: string; onClick: () => void; variantName: string; size: string | null; sizeChosen: boolean }) {
  return (
    <div
      aria-hidden={!on}
      className={cn(
        "fixed inset-x-0 z-[39] border-line bg-bone/95 backdrop-blur-md transition-[transform,top] duration-500 ease-editorial",
        "bottom-0 border-t pb-[env(safe-area-inset-bottom)] lg:bottom-auto lg:top-[var(--header-offset,var(--header-h))] lg:border-b lg:border-t-0 lg:pb-0",
        on ? "translate-y-0" : "translate-y-full lg:-translate-y-full lg:pointer-events-none",
      )}
    >
      <div className="container-x flex items-center gap-4 py-3">
        <div className="hidden w-11 shrink-0 lg:block">
          <Img imgKey={image} alt="" sizes="48px" ratio="4/5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="hidden truncate text-[14px] lg:block">{product.name}</p>
          <p className="hidden text-[12px] text-ink-3 lg:block">{variantName}{size && size !== "One size" ? ` · ${size}` : ""}</p>
          <Price price={product.price} mrp={product.mrp} size="md" className="lg:hidden" showSavings={false} />
          <p className="text-[12px] text-ink-3 lg:hidden">{sizeChosen ? (size && size !== "One size" ? `Size ${size}` : "One size") : "Select a size"}</p>
        </div>
        <div className="hidden lg:block">
          <Price price={product.price} mrp={product.mrp} size="md" />
        </div>
        <Button tabIndex={on ? 0 : -1} size="lg" onClick={onClick} className="min-w-[160px] shrink-0" variant={product.soldOut ? "secondary" : "primary"}>
          {cta}
        </Button>
      </div>
    </div>
  );
}
