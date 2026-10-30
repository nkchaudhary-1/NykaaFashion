"use client";
import Link from "next/link";
import { BellRing, RotateCcw, Scissors, Share2, Tag, Truck } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Price } from "@/components/ui/Price";
import { RatingLine } from "@/components/ui/Rating";
import { coupons, FREE_SHIPPING_THRESHOLD } from "@/data/commerce";
import { inStockVariantIndex } from "@/data/catalog";
import { labelById } from "@/data/labels";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { peekFlip, playFlip } from "@/lib/flip";
import { inr } from "@/lib/format";
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

/** Height of the phone/tablet add-to-bag bar (without the safe-area inset) — also the offset toasts sit above. */
const STICKY_H = 72;
const colourSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * Buy box, sticky from 600px up while the viewport is tall enough to hold it. It follows the header (`--header-offset` is the header's
 * height, or 0 once it has stepped away on scroll) and, if a short window can't fit it, scrolls inside itself rather than hiding the button.
 * The small negative margin / padding pair keeps focus outlines from being clipped by that scroll container.
 */
const BUY_BOX = [
  "sm:self-start",
  "[@media(min-height:640px)]:sm:sticky",
  "[@media(min-height:640px)]:sm:top-[calc(var(--header-offset)+12px)]",
  "[@media(min-height:640px)]:sm:max-h-[calc(100svh-var(--header-offset)-24px)]",
  "[@media(min-height:640px)]:sm:overflow-y-auto",
  "[@media(min-height:640px)]:sm:-mx-1",
  "[@media(min-height:640px)]:sm:px-1",
  "[@media(min-height:640px)]:sm:scrollbar-none",
  "[@media(min-height:640px)]:sm:transition-[top,max-height]",
  "[@media(min-height:640px)]:sm:duration-500",
  "[@media(min-height:640px)]:sm:ease-editorial",
].join(" ");

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

  // Colour lives in the URL (?colour=madder) so a shared link opens on the same colour — read once on arrival, written on every switch.
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("colour");
    const i = want ? product.variants.findIndex((x) => colourSlug(x.colorName) === want) : -1;
    if (i >= 0) sel.setVariant(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- arrival only
  }, [product.id]);
  const switchColour = useCallback(
    (i: number) => {
      sel.setVariant(i);
      const url = new URL(window.location.href);
      if (i === inStockVariantIndex(product)) url.searchParams.delete("colour");
      else url.searchParams.set("colour", colourSlug(product.variants[i].colorName));
      window.history.replaceState(window.history.state, "", url);
    },
    [sel, product],
  );

  // Phones / tablets: the add-to-bag bar shows whenever the main button is out of view. From 1024px the buy box is always in reach.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStickyOn(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!stickyOn || !window.matchMedia("(max-width: 1023px)").matches) return;
    // Toasts sit above the bar, and the page gets room under it so the footer's last line is never covered.
    const root = document.documentElement;
    const body = document.body;
    const prev = body.style.paddingBottom;
    root.style.setProperty("--sticky-h", `${STICKY_H}px`);
    body.style.paddingBottom = `calc(${STICKY_H}px + env(safe-area-inset-bottom))`;
    return () => {
      root.style.removeProperty("--sticky-h");
      body.style.paddingBottom = prev;
    };
  }, [stickyOn]);

  const share = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return; // the shopper dismissed the share sheet
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard permission refused (or an insecure origin): fall back to a transient selection
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast({ title: "Link copied", description: product.name });
  }, [product.name]);

  const cta = sel.soldOutSize || product.soldOut ? "Notify me" : sel.size || product.sizes.length === 1 ? "Add to bag" : "Select a size";
  const act = () => (product.soldOut ? setUI({ notifyMe: { productId: product.id, size: sel.size ?? undefined } }) : sel.add("pdp"));
  const similar = product.soldOut ? alternatives(product, 2) : [];

  return (
    <>
      <section aria-label="Product" className="container-x pb-[var(--section-y)]">
        <Grid className="gap-y-8">
          {/* Gallery: full-bleed swipe track on phones, image grid on the page columns from 600px (6 columns, 8 from 1024px). */}
          <Col span={{ base: 4, sm: 6, lg: 8 }} start={{ sm: 1, lg: 1 }} rowStart={{ sm: 1, lg: 1 }} className="-mx-[var(--gutter)] sm:mx-0">
            <Gallery key={sel.variant} images={v.images} name={product.name} colorName={v.colorName} heroRef={heroRef} startIndex={sel.variant === inStockVariantIndex(product) ? startShot : 0} filler={<FactsPanel product={product} />} />
          </Col>

          <Col span={{ base: 4, sm: 6, lg: 4 }} start={{ sm: 7, lg: 9 }} rowStart={{ sm: 1, lg: 1 }} className={BUY_BOX}>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/brands/${label.id}`} className="eyebrow link-u tap text-ink">
                {label.name}
              </Link>
              <LabelBadges label={label} />
              {product.responsible && !label.flags.responsible && <Badge tone="emerald">Responsible</Badge>}
              {product.isNew && <Badge tone="outline">New</Badge>}
            </div>

            <div className="mt-3.5 flex items-start justify-between gap-4">
              <h1 className="display-sm">{product.name}</h1>
              <button type="button" onClick={share} aria-label={`Share ${product.name}`} className="inline-flex size-11 shrink-0 items-center justify-center border border-line-strong text-ink transition-colors hover:bg-ink hover:text-bone">
                <Share2 size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
              <Price price={product.price} mrp={product.mrp} size="lg" className={cn(product.soldOut && "opacity-60")} />
              <a href="#reviews" className="tap">
                <RatingLine rating={product.rating} count={product.ratingCount} />
              </a>
            </div>
            <p className="mt-1 text-[12px] text-ink-3">Inclusive of all taxes</p>
            <p className="mt-3.5 max-w-[46ch] text-[14px] leading-[1.55] text-ink-2">{product.description}</p>

            <div className="mt-4 space-y-5">
              {product.variants.length > 1 && <ColorPicker product={product} value={sel.variant} onChange={switchColour} />}
              {!product.soldOut && <SizeSelector product={product} sel={sel} groupRef={groupRef} />}
            </div>

            <div ref={ctaRef} className="mt-4 flex items-stretch gap-2">
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
              <p role="status" className="mt-4 border-l-2 border-ink pl-3 text-[13.5px] leading-snug text-ink-2">
                This piece is sold out. Leave your number or email and we’ll tell you the moment it’s back — or start with something similar below.
              </p>
            )}

            {product.soldOut && similar.length > 0 && (
              <section aria-label="Similar pieces available now" className="mt-8">
                <h2 className="eyebrow mb-4 text-ink-3">Similar, available now</h2>
                <ul className="grid grid-cols-4 gap-x-[var(--gap)] sm:grid-cols-6 lg:grid-cols-4">
                  {similar.map((p) => (
                    <li key={p.id} className="col-span-2 sm:col-span-3 lg:col-span-2">
                      <ProductCard product={p} source="pdp-oos-similar" hideQuickView sizes="(min-width:1024px) 16vw, 45vw" />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-4 space-y-4">
              <DeliveryCheck />
              <Offers product={product} />
              <TrustRow product={product} />
            </div>
          </Col>

          {/* Fit, fabric and shipping: flat accordions under the buy controls on phones, a 4 / 4 / 4 row under the gallery from 600px. */}
          <Col span={{ base: 4, sm: 12, lg: 12 }} start={{ sm: 1, lg: 1 }} rowStart={{ sm: 2, lg: 2 }} className="border-t border-line sm:mt-4 sm:grid sm:grid-cols-3 sm:items-start sm:gap-x-[var(--gap)]">
            <Disclosure title="Details">
              <ul className="list-disc space-y-1.5 pl-4 marker:text-ink-3">
                {product.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              {product.modelNote && <p className="mt-3 text-[13px] text-ink-3">{product.modelNote}.</p>}
            </Disclosure>
            <Disclosure title="Fabric & care">
              <p>{product.fabric}.</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-4 marker:text-ink-3">
                {product.care.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Disclosure>
            <Disclosure title="Shipping & returns">
              <p>
                Standard delivery is free above {inr(FREE_SHIPPING_THRESHOLD)}. Returns and refunds are illustrative in this prototype — see <Link href="/info/returns" className="underline underline-offset-4">returns &amp; refunds</Link>.
              </p>
            </Disclosure>
          </Col>
        </Grid>
      </section>

      <StickyBar product={product} on={stickyOn} cta={cta} onClick={act} size={sel.size} sizeChosen={!!sel.size || product.sizes.length === 1} />
    </>
  );
}

/** Fit, fabric and who made it — fills the empty half of the last image row when a colour has an even number of shots. */
function FactsPanel({ product }: { product: Product }) {
  const label = labelById[product.labelId];
  const row = "text-[12.5px] leading-snug text-ink lg:text-[13.5px]";
  const sub = "mt-1 text-[11.5px] leading-snug text-ink-3 lg:text-[12px]";
  return (
    <div className="flex h-full flex-col justify-between overflow-hidden bg-sand p-4 lg:p-7">
      <p className="eyebrow text-ink-3">The piece</p>
      <dl className="space-y-4 lg:space-y-6">
        <div>
          <dt className="eyebrow text-ink-3">Fit</dt>
          <dd className={cn("mt-2", row)}>{product.fit}</dd>
          {product.modelNote && <dd className={cn(sub, "hidden lg:block")}>{product.modelNote}</dd>}
        </div>
        <div>
          <dt className="eyebrow text-ink-3">Fabric</dt>
          <dd className={cn("mt-2", row)}>{product.fabric}</dd>
          <dd className={cn(sub, "hidden lg:block")}>{product.care[0]}</dd>
        </div>
        <div className="hidden lg:block">
          <dt className="eyebrow text-ink-3">Made by</dt>
          <dd className={cn("mt-2", row)}>{label.name}</dd>
          {label.origin && <dd className={sub}>{label.origin}</dd>}
        </div>
      </dl>
    </div>
  );
}

/** The one coupon that suits this piece best (label-specific first). Codes are the prototype's simulated ones. */
function Offers({ product }: { product: Product }) {
  const label = labelById[product.labelId];
  const [best] = coupons
    .filter((c) => !c.expired && (!c.appliesTo || label.flags[c.appliesTo]))
    .sort((a, b) => Number(!!b.appliesTo) - Number(!!a.appliesTo));
  if (!best) return null;
  return (
    <section aria-labelledby="offers-h" className="flex items-start gap-3 border-t border-line pt-4">
      <Tag size={16} aria-hidden className="mt-0.5 shrink-0" />
      <div className="min-w-0 text-[12.5px] leading-snug text-ink-2">
        <h2 id="offers-h" className="sr-only">
          Offer (simulated)
        </h2>
        <span className="font-medium tabular-nums tracking-[0.04em] text-ink">{best.code}</span> — {best.description} <span className="text-ink-3">Simulated.</span>
      </div>
    </section>
  );
}

function TrustRow({ product }: { product: Product }) {
  const label = labelById[product.labelId];
  const items = [
    { icon: Truck, text: `Free delivery above ${inr(FREE_SHIPPING_THRESHOLD)}` },
    { icon: RotateCcw, text: "Easy returns (illustrative)" },
    { icon: Scissors, text: label.origin ? `From ${label.origin}` : `By ${label.name}` },
  ];
  return (
    <ul aria-label="Good to know" className="grid grid-cols-3 gap-3 border-t border-line pt-4">
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-2 text-[11.5px] leading-[1.35] text-ink-2">
          <Icon size={16} strokeWidth={1.5} aria-hidden className="mt-px shrink-0 text-ink" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Phones & tablets: a flat bar on the bottom edge (the bottom nav steps aside on product pages). Hairline on top, solid bone, safe-area aware. */
function StickyBar({ product, on, cta, onClick, size, sizeChosen }: { product: Product; on: boolean; cta: string; onClick: () => void; size: string | null; sizeChosen: boolean }) {
  return (
    <div
      aria-hidden={!on}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[39] border-t border-line bg-bone pb-[env(safe-area-inset-bottom)] transition-[transform,visibility] duration-500 ease-editorial lg:hidden",
        on ? "visible translate-y-0" : "invisible translate-y-full",
      )}
    >
      <div className="container-x flex items-center gap-4" style={{ height: STICKY_H }}>
        <div className="min-w-0 flex-1">
          <Price price={product.price} mrp={product.mrp} size="md" showSavings={false} />
          <p className="mt-0.5 truncate text-[12px] text-ink-3">{sizeChosen ? (size && size !== "One size" ? `Size ${size}` : "One size") : "Select a size"}</p>
        </div>
        <Button tabIndex={on ? 0 : -1} size="lg" onClick={onClick} className="min-w-[160px] shrink-0" variant={product.soldOut ? "secondary" : "primary"}>
          {cta}
        </Button>
      </div>
    </div>
  );
}
