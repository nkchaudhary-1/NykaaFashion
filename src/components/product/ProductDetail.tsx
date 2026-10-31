"use client";
import Link from "next/link";
import { BadgePercent, BellRing, ClipboardList, Heart, Info, RotateCcw, Share2, Star, Store } from "lucide-react";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Img } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { coupons, FREE_SHIPPING_THRESHOLD } from "@/data/commerce";
import { inStockVariantIndex } from "@/data/catalog";
import { labelById } from "@/data/labels";
import { productsByLabel } from "@/data/queries";
import type { Label, Product } from "@/data/types";
import { saveWithFeedback } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { peekFlip, playFlip } from "@/lib/flip";
import { inr } from "@/lib/format";
import { alternatives } from "@/lib/recs";
import { track } from "@/lib/track";
import { useIsSaved } from "@/stores/commerce";
import { signal } from "@/stores/intent";
import { setUI, toast } from "@/stores/ui";
import { DeliveryCheck } from "./DeliveryCheck";
import { Gallery } from "./Gallery";
import { LabelMonogram } from "./LabelMark";
import { ProductCard } from "./ProductCard";
import { RatingReviews } from "./Reviews";
import { ColourChooser, SizeSelector } from "./SizeSelector";
import { useProductSelection } from "./useSelection";

/** Height of the phone/tablet add-to-bag bar (without the safe-area inset) — also the offset toasts sit above. */
const STICKY_H = 72;
const colourSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * The picture stays in view while the long information column scrolls past it (from 600px, when the window is tall enough to hold it).
 * It follows the header: `--header-offset` is the header's height, or 0 once the header has stepped away on scroll. On desktop the
 * add-to-bag bar hangs under the header once the main button has gone — `--pdp-bar` is its height, so the picture steps down beneath it.
 */
const STICKY_GALLERY = [
  "sm:self-start",
  "[@media(min-height:640px)]:sm:sticky",
  "[@media(min-height:640px)]:sm:top-[calc(var(--header-offset)+var(--pdp-bar,0px)+16px)]",
  "[@media(min-height:640px)]:sm:transition-[top]",
  "[@media(min-height:640px)]:sm:duration-500",
  "[@media(min-height:640px)]:sm:ease-editorial",
].join(" ");

const sectionY = "mt-9 border-t border-line pt-9";
const h2 = "text-[19px] font-medium leading-tight tracking-[-0.02em]";

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

  // The add-to-bag bar shows whenever the main button is out of view: phones and tablets always, desktop once it has scrolled above the fold.
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
    if (!stickyOn || !window.matchMedia("(min-width: 1024px)").matches) return;
    const root = document.documentElement;
    root.style.setProperty("--pdp-bar", `${STICKY_H}px`);
    return () => {
      root.style.removeProperty("--pdp-bar");
    };
  }, [stickyOn]);
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
    await copyText(url);
    toast({ title: "Link copied", description: product.name });
  }, [product.name]);

  const cta = sel.soldOutSize || product.soldOut ? "Notify me" : sel.size || product.sizes.length === 1 ? "Add to bag" : "Select a size";
  const act = () => (product.soldOut ? setUI({ notifyMe: { productId: product.id, size: sel.size ?? undefined } }) : sel.add("pdp"));
  const similar = product.soldOut ? alternatives(product, 2) : [];
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const tags = productTags(product, label);

  return (
    <>
      <section aria-label="Product" className="container-x pb-[var(--section-y)]">
        <Grid className="gap-y-8">
          {/* Gallery: thumbnail rail + a large picture from 1024px (1 + 6 of the 12 columns), a full-width swipe track below; full bleed on phones. */}
          <Col span={{ base: 4, sm: 6, lg: 7 }} start={{ sm: 1, lg: 1 }} rowStart={{ sm: 1, lg: 1 }} className={cn("-mx-[var(--gutter)] sm:mx-0", STICKY_GALLERY)}>
            <Gallery key={sel.variant} images={v.images} name={product.name} colorName={v.colorName} heroRef={heroRef} startIndex={sel.variant === inStockVariantIndex(product) ? startShot : 0} />
          </Col>

          {/* Information: label → brand → title → rating → price, then size and bag, delivery, coupons, product information, reviews, the brand. */}
          <Col span={{ base: 4, sm: 6, lg: 5 }} start={{ sm: 7, lg: 8 }} rowStart={{ sm: 1, lg: 1 }} className="lg:pl-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {tags.length > 0 && (
                  <p className="eyebrow flex flex-wrap items-center gap-x-2.5 gap-y-1 text-blue">
                    {tags.map((t, i) => (
                      <Fragment key={t}>
                        {i > 0 && <span aria-hidden className="h-3 w-px bg-blue/40" />}
                        <span>{t}</span>
                      </Fragment>
                    ))}
                  </p>
                )}
                <Link href={`/brands/${label.id}`} className={cn("eyebrow tap block text-ink transition-colors duration-300 hover:text-pink", tags.length > 0 && "mt-5")}>
                  {label.name}
                </Link>
                <h1 className="display-md mt-3">{product.name}</h1>
              </div>
              <button type="button" onClick={share} aria-label={`Share ${product.name}`} className="inline-flex size-11 shrink-0 items-center justify-center text-ink transition-colors duration-300 hover:bg-sand">
                <Share2 size={18} strokeWidth={1.5} />
              </button>
            </div>

            <a href="#reviews" className="tap mt-5 inline-flex items-center gap-2 text-[13px] text-ink-2 transition-colors duration-300 hover:text-ink">
              <Star size={14} aria-hidden className="fill-ink text-ink" />
              <span className="font-medium tabular-nums text-ink">
                {product.rating.toFixed(1)}
                <span className="sr-only"> out of 5 stars</span>
              </span>
              <span aria-hidden className="h-3 w-px bg-line-strong" />
              <span className="link-u tabular-nums">Based on {product.ratingCount.toLocaleString("en-IN")} ratings</span>
            </a>

            <div className="mt-7">
              <p className="flex flex-wrap items-baseline gap-x-3 tabular-nums">
                <span className={cn("text-[30px] font-medium leading-none tracking-[-0.025em]", product.soldOut ? "text-ink-3" : "text-ink")}>{inr(product.price)}</span>
                {discount > 0 && (
                  <>
                    <span className="sr-only">, was {inr(product.mrp)}</span>
                    <span className="text-[15px] font-medium text-emerald">{discount}% off</span>
                  </>
                )}
              </p>
              <p className="mt-2.5 text-[12.5px] tabular-nums text-ink-3">
                {discount > 0 && (
                  <>
                    MRP <s>{inr(product.mrp)}</s>{" "}
                  </>
                )}
                Inclusive of all taxes
              </p>
            </div>

            <div className={sectionY}>
              {product.variants.length > 1 && (
                <div className="mb-6">
                  <ColourChooser product={product} value={sel.variant} onChange={switchColour} />
                </div>
              )}
              {!product.soldOut && <SizeSelector product={product} sel={sel} groupRef={groupRef} />}

              {/* a size container: in a narrow information column (the 6 + 6 split just above 600px) the wishlist button folds to its heart */}
              <div ref={ctaRef} className={cn("@container flex items-stretch gap-3", !product.soldOut && "mt-6")}>
                <WishlistButton product={product} variant={sel.variant} />
                {product.soldOut ? (
                  <Button full size="lg" variant="secondary" icon={<BellRing size={16} />} onClick={act}>
                    Notify me
                  </Button>
                ) : (
                  <Button full size="lg" variant={sel.soldOutSize ? "secondary" : "primary"} onClick={act} icon={sel.soldOutSize ? <BellRing size={16} /> : undefined}>
                    {cta}
                  </Button>
                )}
              </div>
              {product.soldOut && (
                <p role="status" className="mt-4 border-l-2 border-ink pl-3 text-[13.5px] leading-snug text-ink-2">
                  This piece is sold out. Leave your number or email and we’ll tell you the moment it’s back — or start with something similar below.
                </p>
              )}
              {product.soldOut && similar.length > 0 && (
                <section aria-label="Similar pieces available now" className="mt-8">
                  <h2 className={cn(h2, "mb-4")}>Similar, available now</h2>
                  <ul className="grid grid-cols-4 gap-x-[var(--gap)] sm:grid-cols-6 lg:grid-cols-6">
                    {similar.map((p) => (
                      <li key={p.id} className="col-span-2 sm:col-span-3">
                        <ProductCard product={p} source="pdp-oos-similar" hideQuickView sizes="(min-width:1024px) 22vw, 45vw" />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <div className={sectionY}>
              <DeliveryCheck price={product.price} />
            </div>

            <div className={sectionY}>
              <Coupons product={product} />
            </div>

            <div className={sectionY}>
              <ProductInformation product={product} label={label} />
            </div>

            <div className={sectionY}>
              <RatingReviews product={product} />
            </div>

            <div className={sectionY}>
              <AboutLabel label={label} />
            </div>
          </Col>
        </Grid>
      </section>

      <StickyBar product={product} image={v.images[0]} variantName={v.colorName} on={stickyOn} cta={cta} onClick={act} size={sel.size} sizeChosen={!!sel.size || product.sizes.length === 1} />
    </>
  );
}

/** The blue uppercase label line — what makes this piece special, from the sample data (flags, newness). */
function productTags(product: Product, label: Label): string[] {
  const out: string[] = [];
  if (label.flags.houseOfNykaa) out.push("Exclusive");
  if (product.responsible) out.push("Responsible");
  if (label.flags.hiddenGem) out.push("Hidden Gem");
  if (label.flags.luxe) out.push("Luxe");
  if (product.isNew) out.push("Latest Style");
  return out.slice(0, 3);
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // clipboard permission refused (or an insecure origin): fall back to a transient selection
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

/**
 * Outline heart button beside the bag button. The accessible name keeps "Save … to wishlist" / "Remove … from wishlist" after the visible words.
 * Its parent is a size container; when that row is narrower than 21rem the words drop out and the button becomes a 48px square.
 */
function WishlistButton({ product, variant }: { product: Product; variant: number }) {
  const saved = useIsSaved(product.id);
  const [pop, setPop] = useState(0);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Wishlisted: Remove ${product.name} from wishlist` : `Add to Wishlist: Save ${product.name} to wishlist`}
      onClick={() => {
        saveWithFeedback(product, variant, "pdp");
        setPop((n) => n + 1);
      }}
      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 border border-line-strong px-4 text-[14px] font-medium text-ink transition-colors duration-300 hover:border-ink @max-[21rem]:w-12 @max-[21rem]:px-0"
    >
      <Heart key={pop} size={18} strokeWidth={1.6} aria-hidden className={cn("transition-colors duration-200", saved ? "fill-pink stroke-pink" : "fill-transparent", pop > 0 && saved && "animate-pop")} />
      <span className="@max-[21rem]:sr-only">{saved ? "Wishlisted" : "Add to Wishlist"}</span>
    </button>
  );
}

/** Up to two coupons that apply to this piece, label-specific first: title and terms on top, the code and Copy Code on a dashed ticket edge. Simulated codes. */
function Coupons({ product }: { product: Product }) {
  const label = labelById[product.labelId];
  const [copied, setCopied] = useState<string | null>(null);
  const list = coupons
    .filter((c) => !c.expired && (!c.appliesTo || label.flags[c.appliesTo]))
    .sort((a, b) => Number(!!b.appliesTo) - Number(!!a.appliesTo))
    .slice(0, 2);
  if (list.length === 0) return null;
  const copy = async (code: string) => {
    await copyText(code);
    setCopied(code);
    signal("discount_interaction");
    toast({ title: `Code ${code} copied`, description: "Apply it in your bag — simulated coupon." });
    setTimeout(() => setCopied(null), 2200);
  };
  return (
    <section aria-labelledby="coupons-h" className="@container">
      <h2 id="coupons-h" className={cn(h2, "flex flex-wrap items-baseline gap-x-2")}>
        Coupons <span className="text-[13px] font-normal text-ink-3">{list.length} available · simulated</span>
      </h2>
      {/* side by side only when the column is wide enough to hold two tickets (a container query, so it follows the column, not the window) */}
      <ul className="mt-4 grid grid-cols-1 gap-3 @lg:grid-cols-2">
        {list.map((c) => (
          <li key={c.code} className="flex flex-col border border-line bg-paper">
            <div className="flex flex-1 items-start gap-3 p-3.5">
              <span className="inline-flex size-8 shrink-0 items-center justify-center text-pink">
                <BadgePercent size={22} strokeWidth={1.4} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-medium leading-tight">{c.title}</p>
                <p className="mt-1 line-clamp-3 text-[12.5px] leading-snug text-ink-3">{c.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-dashed border-line-strong px-3.5 py-2">
              <span className="text-[13px] font-medium tabular-nums tracking-[0.06em] text-ink-2">{c.code}</span>
              <button type="button" onClick={() => copy(c.code)} aria-label={`Copy code ${c.code}`} className="tap text-[14px] font-semibold text-pink transition-colors hover:text-pink-ink">
                {copied === c.code ? "Copied" : "Copy Code"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Four collapsed rows, each an icon + bold title + grey summary + chevron (the live page's "Product Information"). */
function ProductInformation({ product, label }: { product: Product; label: Label }) {
  const row = (Icon: typeof Info, title: string, sub: string): ReactNode => (
    <span className="flex items-start gap-3.5 py-1">
      <Icon size={20} strokeWidth={1.4} aria-hidden className="mt-0.5 shrink-0 text-ink-2" />
      <span className="flex flex-col text-left">
        <span className="text-[15px] font-medium text-ink">{title}</span>
        <span className="mt-0.5 text-[13.5px] font-normal text-ink-3">{sub}</span>
      </span>
    </span>
  );
  const list = "list-disc space-y-1.5 pl-5 marker:text-ink-3";
  return (
    <section aria-labelledby="info-h">
      <h2 id="info-h" className={h2}>
        Product Information
      </h2>
      <div className="mt-2 border-t border-line">
        <Disclosure headingLevel={3} title={row(ClipboardList, "Product details", "Care instructions, Pack contains")}>
          <ul className={list}>
            {product.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p className="mt-4 font-semibold text-ink">Care instructions</p>
          <ul className={cn(list, "mt-1.5")}>
            {product.care.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="mt-4">
            <span className="font-semibold text-ink">Pack contains:</span> 1 × {product.name}
          </p>
        </Disclosure>
        <Disclosure headingLevel={3} title={row(Info, "Know your product", "Description")}>
          <p>{product.description}</p>
          <p className="mt-3">
            <span className="font-semibold text-ink">Fit:</span> {product.fit}.
          </p>
          <p className="mt-1.5">
            <span className="font-semibold text-ink">Fabric:</span> {product.fabric}.
          </p>
          {product.modelNote && <p className="mt-1.5 text-ink-3">{product.modelNote}.</p>}
        </Disclosure>
        <Disclosure headingLevel={3} title={row(Store, "Vendor details", "Country of origin, Manufacturer details")}>
          <p>
            <span className="font-semibold text-ink">Brand:</span> {label.name}
          </p>
          {label.origin && (
            <p className="mt-1.5">
              <span className="font-semibold text-ink">Based in:</span> {label.origin}
            </p>
          )}
          <p className="mt-1.5">
            <span className="font-semibold text-ink">Country of origin:</span> India
          </p>
          <p className="mt-3 text-ink-3">Vendor details are sample content in this prototype.</p>
        </Disclosure>
        <Disclosure headingLevel={3} title={row(RotateCcw, "Return and exchange policy", "Know more about return and exchange")}>
          <p>
            Standard delivery is free above {inr(FREE_SHIPPING_THRESHOLD)}. Returns and refunds are illustrative in this prototype — see <Link href="/info/returns" className="font-semibold text-pink underline underline-offset-4 hover:text-pink-ink">returns &amp; refunds</Link>.
          </p>
        </Disclosure>
      </div>
    </section>
  );
}

/** "About {brand}": logo tile, the story clamped to two lines with read more, and the brand's customer-rating count (summed from the sample catalogue). */
function AboutLabel({ label }: { label: Label }) {
  const [more, setMore] = useState(false);
  const ratings = productsByLabel(label.id).reduce((n, p) => n + p.ratingCount, 0);
  const stat = ratings >= 100 ? `${(Math.floor(ratings / 100) * 100).toLocaleString("en-IN")}+` : String(ratings);
  return (
    <section aria-labelledby="about-h">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <h2 id="about-h" className={h2}>
            About {label.name}
          </h2>
          <p className={cn("mt-2.5 text-[13.5px] leading-relaxed text-ink-3", !more && "line-clamp-2")}>{label.story}</p>
          <button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)} className="link-u tap mt-1 text-[13.5px] font-semibold text-pink hover:text-pink-ink">
            {more ? "read less" : "read more"}
          </button>
        </div>
        <Link href={`/brands/${label.id}`} className="shrink-0 overflow-hidden border border-line">
          <span className="sr-only">See the brand {label.name}</span>
          <LabelMonogram label={label} size="md" />
        </Link>
      </div>
      <p className="mt-5">
        <span className="text-[22px] font-semibold tabular-nums">{stat}</span>
        <span className="block text-[12.5px] text-ink-3">Customer ratings</span>
      </p>
    </section>
  );
}

/** Phones & tablets: a flat bar on the bottom edge (the bottom nav steps aside on product pages). Desktop: a slim bar under the header once the main button has scrolled away. */
function StickyBar({ product, image, on, cta, onClick, variantName, size, sizeChosen }: { product: Product; image: string; on: boolean; cta: string; onClick: () => void; variantName: string; size: string | null; sizeChosen: boolean }) {
  return (
    <div
      aria-hidden={!on}
      className={cn(
        "fixed inset-x-0 z-[39] border-line bg-bone transition-[transform,top,opacity,visibility] duration-500 ease-editorial",
        "bottom-0 border-t pb-[env(safe-area-inset-bottom)] lg:bottom-auto lg:top-[var(--header-offset,var(--header-h))] lg:border-b lg:border-t-0 lg:pb-0",
        on ? "visible translate-y-0" : "invisible translate-y-full lg:-translate-y-full lg:opacity-0",
      )}
    >
      <div className="container-x flex items-center gap-4" style={{ height: STICKY_H }}>
        <div className="hidden w-10 shrink-0 lg:block">
          <Img imgKey={image} alt="" sizes="48px" ratio="4/5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="hidden truncate text-[14px] font-semibold lg:block">{product.name}</p>
          <p className="hidden truncate text-[12px] text-ink-3 lg:block">
            {variantName}
            {size && size !== "One size" ? ` · ${size}` : ""}
          </p>
          <Price price={product.price} mrp={product.mrp} size="md" showSavings={false} className="lg:hidden" />
          <p className="mt-0.5 truncate text-[12px] text-ink-3 lg:hidden">{sizeChosen ? (size && size !== "One size" ? `Size ${size}` : "One size") : "Select a size"}</p>
        </div>
        <div className="hidden lg:block">
          <Price price={product.price} mrp={product.mrp} size="md" />
        </div>
        <Button tabIndex={on ? 0 : -1} size="lg" onClick={onClick} className="min-w-[160px] shrink-0" variant={product.soldOut || cta === "Notify me" ? "secondary" : "primary"}>
          {cta}
        </Button>
      </div>
    </div>
  );
}
