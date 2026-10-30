"use client";
import Link from "next/link";
import { Eye, Heart } from "lucide-react";
import { useState } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { ChipLink } from "@/components/ui/Chip";
import { Img } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { labelById } from "@/data/labels";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { captureFlip } from "@/lib/flip";
import { inr, titleCase } from "@/lib/format";
import { styleWith } from "@/lib/recs";
import { track } from "@/lib/track";
import { toggleWishlist, wishlistStore } from "@/stores/commerce";
import { setUI, toast } from "@/stores/ui";
import { SaveButton } from "./SaveButton";

/**
 * "Complete the look" (PRD §5.5 styling context) on a 6 / 6 split: a shoppable look board on the left — this piece and the pieces that
 * share its occasion as a 2 × 2 of numbered photos — and the matching list on the right (name, price, save, quick view, the total).
 * Phones stack heading → board → list; tablets run the board as one row of four.
 */
export function CompleteTheLook({ product }: { product: Product }) {
  const pieces = styleWith(product, 3);
  const [active, setActive] = useState<number | null>(null);
  if (pieces.length === 0) return null;
  const look = [product, ...pieces];
  const total = look.reduce((n, p) => n + p.price, 0);
  // what the pieces have in common: tags (other than the category itself) that this piece shares with the rest of the look, most-shared first
  const occasions = product.tags
    .filter((t) => !product.categoryPath.includes(t))
    .map((t) => ({ t, n: pieces.filter((p) => p.tags.includes(t)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)
    .map((x) => x.t);
  // with an odd number of photos the board's last cell holds the total, so the board is always a complete rectangle
  const totalInBoard = look.length % 2 === 1;
  const saveAll = () => {
    const saved = new Set(wishlistStore.get().map((i) => i.productId));
    let n = 0;
    for (const p of look) {
      if (saved.has(p.id)) continue;
      toggleWishlist(p.id, 0, "look");
      n++;
    }
    track("product_save", { source: "complete-the-look", count: n });
    toast({ title: n ? `Saved ${n} pieces to your wishlist` : "Already in your wishlist", action: { label: "View", href: "/wishlist" } });
  };
  const save = (
    <Button variant="secondary" icon={<Heart size={15} />} onClick={saveAll}>
      Save the look
    </Button>
  );
  // two photos fill the row at 6 columns each on tablets; three or four sit four-across at 3 columns
  const cell = look.length === 2 ? "col-span-2 sm:col-span-6 lg:col-span-3" : "col-span-2 sm:col-span-3 lg:col-span-3";

  return (
    <Section tone="paper" aria-labelledby="ctl" className="border-y border-line">
      <Grid className="gap-y-10">
        <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 7 }} rowStart={{ lg: 1 }}>
          <p className="eyebrow mb-4 text-ink-3">Styling</p>
          <h2 id="ctl" className="display-md">
            Complete the look.
          </h2>
          <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">Pieces that share an occasion and a point of view with this one.</p>
          {occasions.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-[13px] font-semibold text-ink">Shop by occasion</p>
              <ul className="flex flex-wrap gap-2" aria-label="Occasions this look suits">
                {occasions.map((t) => (
                  <li key={t}>
                    <ChipLink href={`/search?q=${encodeURIComponent(t)}`}>{titleCase(t)}</ChipLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Col>

        <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 1 }} rowStart={{ lg: 1 }} rows={{ lg: 2 }}>
          <ul aria-label="The look, in photographs" className="grid grid-cols-4 gap-[var(--gap)] sm:grid-cols-12 lg:grid-cols-6">
            {look.map((p, i) => {
              const img = <Img imgKey={p.variants[0].images[0]} alt="" sizes="(min-width:1024px) 25vw, (min-width:600px) 25vw, 50vw" ratio="4/5" className={cn("transition-opacity duration-300", active !== null && active !== i && "opacity-55")} />;
              return (
                <li key={p.id} className={cn("relative", cell)}>
                  {i === 0 ? (
                    img
                  ) : (
                    <Link href={`/p/${p.slug}`} aria-hidden tabIndex={-1} draggable={false} onClick={(e) => captureFlip(p.id, e.currentTarget, 0, "complete-the-look")} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} className="block">
                      {img}
                    </Link>
                  )}
                  <span aria-hidden className="pointer-events-none absolute left-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-white text-[12px] font-medium tabular-nums text-ink">
                    {i + 1}
                  </span>
                </li>
              );
            })}
            {totalInBoard && (
              <li className={cn("flex aspect-[4/5] flex-col justify-between overflow-hidden bg-ink p-4 text-bone sm:p-5 lg:p-6", cell)}>
                <p className="eyebrow">The whole look</p>
                <div>
                  <p className="display-sm tabular-nums">{inr(total)}</p>
                  <p className="mt-2 text-[13px] text-bone">{look.length} pieces, one occasion.</p>
                  {/* the tile is only two columns wide on phones, so this button is a compact, tile-width one */}
                  <button type="button" onClick={saveAll} className="on-dark mt-5 inline-flex h-11 w-full items-center justify-center gap-2 bg-white px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink transition-colors hover:bg-sand lg:text-[12px] lg:tracking-[0.08em]">
                    <Heart size={14} aria-hidden className="hidden lg:block" /> Save the look
                  </button>
                </div>
              </li>
            )}
          </ul>
        </Col>

        <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 7 }} rowStart={{ lg: 2 }} className="lg:self-end">
          <ol aria-label="Pieces in this look" className="border-t border-line">
            {look.map((p, i) => (
              <li key={p.id} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line py-4 sm:flex-nowrap">
                <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-ink text-[12px] font-medium tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">
                    {i === 0 && <span className="font-normal text-ink-3">This piece · </span>}
                    {labelById[p.labelId].name}
                  </p>
                  {i === 0 ? (
                    <p className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-ink-2">{p.name}</p>
                  ) : (
                    <Link href={`/p/${p.slug}`} onClick={(e) => captureFlip(p.id, e.currentTarget, 0, "complete-the-look")} className="mt-0.5 line-clamp-2 block text-[14px] leading-snug text-ink-2 transition-colors hover:text-pink-ink">
                      {p.name}
                    </Link>
                  )}
                </div>
                {/* phones: the price drops under the name so long names keep their line; wider: it sits between name and actions */}
                <Price price={p.price} mrp={p.mrp} size="md" showSavings={false} className="order-last w-full shrink-0 pl-11 sm:order-none sm:w-auto sm:pl-0" />
                {i > 0 && (
                  <div className="flex shrink-0 items-center">
                    <SaveButton product={p} source="complete-the-look" tone="plain" size={18} />
                    <button type="button" aria-label={`Quick view ${p.name}`} onClick={() => setUI({ quickView: { productId: p.id } })} className="inline-flex size-10 items-center justify-center text-ink transition-colors hover:bg-sand [@media(pointer:coarse)]:size-11">
                      <Eye size={18} strokeWidth={1.6} aria-hidden />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
          {!totalInBoard && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-[14px] text-ink-2">
                The whole look: <strong className="text-[18px] font-medium tabular-nums text-ink">{inr(total)}</strong>
              </p>
              {save}
            </div>
          )}
        </Col>
      </Grid>
    </Section>
  );
}
