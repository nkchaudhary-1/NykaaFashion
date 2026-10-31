"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Section } from "@/components/layout/Section";
import { SaveButton } from "@/components/product/SaveButton";
import { Badge } from "@/components/ui/Badge";
import { Img } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { isLaunched, launchAtMs, type BrandLaunch } from "@/data/launches";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";
import { useLaunchTime } from "./clock";
import { NotifyButton } from "./Notify";
import { rangeOf } from "./range";
import { openPiece } from "./sheet";
import { shopHref, shortDate } from "./time";

/*
 * PRODUCT PREVIEW — the range as an editorial mosaic: one large piece (5 columns) that stays in view (sticky) while two columns of smaller pieces — 4 and 3 columns wide,
 * each starting lower than the last — scroll past it, and a tile in the brand's own colours closing the shorter column. It is the opposite of the home page's Trending grid (a 6-column feature and four equal cards): sizes differ, and so
 * do the columns' starting heights.
 *
 * Before launch a piece is a button that opens the preview sheet on this page — it never links to /p/<piece> and never offers Add to bag (the server and the bag refuse it
 * too). Every piece has a wishlist heart (the site's own, so it lands on the Wishlist page), a "Preview" tag and "Opens 14 Nov". From launch day the same mosaic becomes
 * SHOP NOW: the pieces are plain links to their product pages.
 *
 * Below 1024px the columns dissolve (`display: contents`) and the pieces re-flow in their own order: one large, then two-up (phones) or three-up (tablets).
 */

/** CardPrice's three spans (price, struck MRP, saving). The real component is a <p>, which a button — the whole card is one — cannot contain. */
function PriceLine({ price, mrp }: { price: number; mrp: number }) {
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <span className="flex flex-wrap items-baseline gap-x-2.5 tabular-nums">
      <span className="text-[14px] font-medium text-ink">{inr(price)}</span>
      {off > 0 && (
        <>
          <span className="sr-only">, was {inr(mrp)}</span>
          <s aria-hidden className="text-[12.5px] font-normal text-ink-3">
            {inr(mrp)}
          </s>
          <span className="text-[12px] font-medium text-emerald">{off}% off</span>
        </>
      )}
    </span>
  );
}

export function PieceCard({ product: p, launch, live, lead, sizes }: { product: Product; launch: BrandLaunch; live: boolean; lead?: boolean; sizes: string }) {
  const at = launchAtMs(launch);
  const body = (
    <>
      <span className="relative block overflow-hidden bg-sand">
        <span data-nogrid className="block transition-transform duration-[1200ms] ease-expo group-hover/card:scale-[1.04] group-has-[:focus-visible]/card:scale-[1.04]">
          <Img imgKey={p.variants[0].images[0]} alt="" sizes={sizes} ratio="4/5" />
        </span>
        <Badge tone="light" className="absolute left-2 top-2">
          {live ? "New" : "Preview"}
        </Badge>
      </span>
      <span className="mt-4 block">
        <span className="block truncate text-[11px] font-medium uppercase leading-tight tracking-[0.14em] text-ink">{launch.brand.name}</span>
        <span className={cn("mt-1.5 block", lead ? "display-sm" : "line-clamp-2 text-[14px] font-normal leading-[1.35] text-ink-2")}>{p.name}</span>
        <span className="mt-2.5 block">
          <PriceLine price={p.price} mrp={p.mrp} />
        </span>
        {!live && <span className="mt-2 block text-[12px] text-ink-3">Opens {shortDate(at)}</span>}
      </span>
    </>
  );
  return (
    <article className="group/card relative">
      {live ? (
        <Link href={`/p/${p.slug}`} className="block outline-offset-4">
          {body}
        </Link>
      ) : (
        <button type="button" aria-label={`Preview ${p.name}`} aria-haspopup="dialog" onClick={() => openPiece(p.slug)} className="block w-full text-left outline-offset-4">
          {body}
        </button>
      )}
      {/* after the card's own button in the DOM, over the picture's corner */}
      <SaveButton product={p} source="launch-preview" className="absolute right-0 top-0" />
    </article>
  );
}

const SM_SPAN: Record<number, string> = { 4: "sm:col-span-4", 5: "sm:col-span-5", 8: "sm:col-span-8", 12: "sm:col-span-12" };

export function PreviewSection({ launch, here }: { launch: BrandLaunch; here?: boolean }) {
  const time = useLaunchTime();
  const live = isLaunched(launch, time);
  const all = rangeOf(launch);
  if (!all.length) return null;
  const pieces = all.slice(0, 7);
  const [first, ...rest] = pieces;
  const at = launchAtMs(launch);
  const shop = shopHref(launch, here);

  // the closing tile goes under whichever column is shorter, and always comes last in reading order
  const left = rest.filter((_, i) => i % 2 === 0);
  const right = rest.filter((_, i) => i % 2 === 1);
  const tileRight = left.length > right.length;
  const lastRowSm = (rest.length - 1) % 3; // pieces in the last three-up row on tablets (the second piece sits beside the large one)
  const tileSm = lastRowSm === 0 ? 12 : (3 - lastRowSm) * 4;
  const tileBase = rest.length % 2 === 1 ? "col-span-2" : "col-span-4";

  const slot = (p: Product, i: number) => (
    <div key={p.id} style={{ order: i + 1 }} className={cn("col-span-2", SM_SPAN[i === 0 ? 5 : 4], "lg:col-auto")}>
      <PieceCard product={p} launch={launch} live={live} sizes={i % 2 === 0 ? "(min-width:1024px) 33vw, (min-width:600px) 33vw, 50vw" : "(min-width:1024px) 25vw, (min-width:600px) 33vw, 50vw"} />
    </div>
  );
  const tile = (
    <div key="tile" style={{ order: pieces.length }} className={cn(tileBase, SM_SPAN[tileSm], "lg:col-auto")}>
      <RangeTile launch={launch} live={live} count={all.length} here={here} href={here ? shop.href : `/new-and-next/${launch.id}`} shopHref={shop.href} />
    </div>
  );
  const leftNodes = [...left.map((p) => slot(p, rest.indexOf(p))), ...(tileRight ? [] : [tile])];
  const rightNodes = [...right.map((p) => slot(p, rest.indexOf(p))), ...(tileRight ? [tile] : [])];

  const heading: ReactNode = live ? (
    <>
      Shop the <em>range.</em>
    </>
  ) : (
    <>
      A first <em>look.</em>
    </>
  );
  return (
    <Section tone="paper" id="preview" aria-labelledby="preview-h" className="scroll-mt-24 border-y border-line">
      <SectionHeading
        eyebrow={live ? "Shop now" : "Product preview"}
        title={<span id="preview-h">{heading}</span>}
        size="lg"
        intro={live ? `The ${launch.brand.name} debut is on sale now. Pick a piece to see it in full.` : `Save what you love before the doors open — pieces wait on your Wishlist and go on sale ${shortDate(at)}. Pick one for a closer look.`}
        href={live ? shop.href : here ? undefined : `/new-and-next/${launch.id}`}
        hrefLabel={live ? "Shop all" : "See the whole range"}
      />
      <div className="grid-main mt-12 gap-y-10 sm:mt-16 lg:items-start lg:gap-y-0">
        <div style={{ order: 0 }} className="col-span-4 sm:col-span-7 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:sticky lg:top-[calc(var(--header-offset)+1.5rem)] lg:self-start">
          <PieceCard product={first} launch={launch} live={live} lead sizes="(min-width:1024px) 42vw, (min-width:600px) 58vw, 100vw" />
        </div>
        <div className="contents lg:col-span-4 lg:col-start-6 lg:row-start-1 lg:flex lg:flex-col lg:gap-y-14 lg:pt-14">{leftNodes}</div>
        <div className="contents lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:flex lg:flex-col lg:gap-y-14 lg:pt-40">{rightNodes}</div>
      </div>
    </Section>
  );
}

/** The mosaic's closing tile, in the brand's own colours: the size of the range, and the way on (see all · shop all · be reminded). */
function RangeTile({ launch, live, count, here, href, shopHref: shopTo }: { launch: BrandLaunch; live: boolean; count: number; here?: boolean; href: string; shopHref: string }) {
  const { bg, fg } = launch.brand.tone;
  const at = launchAtMs(launch);
  const style = { backgroundColor: bg, color: fg };
  const frame = "flex aspect-[4/5] flex-col justify-between p-4 sm:aspect-auto sm:min-h-[22rem] sm:p-6 lg:aspect-[4/5] lg:min-h-0";
  const figure = (
    <span className="block">
      <span className="block font-medium leading-[0.85] tracking-[-0.06em] tabular-nums [font-size:clamp(3.75rem,7vw,7rem)]">{count}</span>
      <span className="mt-3 block text-[15px] leading-snug">{count === 1 ? "piece" : "pieces"} in the {live ? "range" : "debut range"}</span>
    </span>
  );
  if (here && !live) {
    // on the brand's own page the way on is to be reminded
    return (
      <div className={frame} style={style}>
        <span className="eyebrow block">Opens {shortDate(at)}</span>
        {figure}
        <span className="block">
          <NotifyButton launch={launch} size="md" />
        </span>
      </div>
    );
  }
  return (
    <Link href={live ? shopTo : href} className={cn(frame, "group")} style={style}>
      <span className="eyebrow block">{live ? "On sale now" : `Opens ${shortDate(at)}`}</span>
      {figure}
      <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]">
        {live ? "Shop all" : "See the whole range"}
        <ArrowRight size={14} aria-hidden className="transition-transform duration-500 ease-expo group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
