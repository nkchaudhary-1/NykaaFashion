"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { RevealText, Rise } from "@/components/motion/reveal";
import { Img, SIZES } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { editById } from "@/data/edits";
import { labelById } from "@/data/labels";
import { editProducts } from "@/data/queries";
import type { Product } from "@/data/types";
import { inr } from "@/lib/format";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";
import { pieces } from "./kit";

/*
 * The offer band, on ink. Demoted (the default): a headline and four hairline rows, each a shortcut with its figure at display size. Promoted (deal intent, second
 * on the page, right under the banner): the headline at poster scale and the best-discounted pieces under the rows.
 */
export function OfferModule({ promoted }: { promoted: boolean }) {
  const onSale = useMemo(() => editProducts(editById["the-offer-edit"]).filter((p) => !p.soldOut), []);
  const best = Math.max(...onSale.map((p) => p.discount));
  const click = (via: string) => {
    signal("discount_interaction");
    track("home_module_click", { moduleType: "offers", via });
  };
  const shortcuts = [
    { href: "/edits/the-offer-edit", label: `Up to ${best}% off`, sub: pieces(onSale.length), via: "up-to" },
    { href: "/edits/under-1500", label: "Under ₹1,500", sub: "Computed edit", via: "u1500" },
    { href: "/edits/under-3000", label: "Under ₹3,000", sub: "Computed edit", via: "u3000" },
    { href: "/offers", label: "All offers", sub: "Coupons & markdowns", via: "all" },
  ];
  const featured = onSale.slice(0, 4);
  return (
    <Section tone="ink" className="[&_em]:text-marigold">
      {promoted ? (
        <Grid className="items-end gap-y-8">
          <Col span={{ base: 4, sm: 12, lg: 9 }}>
            <Rise as="p" y={14} className="eyebrow text-marigold">
              You’re looking for offers
            </Rise>
            <RevealText as="h2" className="display-xl mt-5">
              The Offer <em>Edit.</em>
            </RevealText>
            <Rise as="p" delay={160} className="mt-6 max-w-[50ch] text-[16px] leading-relaxed text-bone">{`Genuine markdowns, up to ${best}% off — straight to the pieces. Curation is still one tap away.`}</Rise>
          </Col>
        </Grid>
      ) : (
        <SectionHeading onDark size="lg" eyebrow="The Offer Edit" title={<>Fewer sales. <em>Better</em> ones.</>} intro="Only genuine price moves — we show a discount where one exists, and nowhere else." />
      )}
      <ul className="mt-14 border-t border-ink-3 sm:mt-20">
        {shortcuts.map((s) => (
          <Rise as="li" key={s.href} y={20} className="border-b border-ink-3">
            <Link href={s.href} onClick={() => click(s.via)} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 py-6 sm:grid-cols-12 sm:gap-x-[var(--gap)] sm:py-8">
              <span className="display-md block min-w-0 transition-transform duration-500 ease-expo group-hover:translate-x-2 sm:col-span-8">{s.label}</span>{" "}
              <span className="hidden text-[13px] text-stone sm:col-span-3 sm:block sm:justify-self-end">{s.sub}</span>{" "}
              <ArrowUpRight size={26} strokeWidth={1.25} aria-hidden className="justify-self-end transition-transform duration-500 ease-expo group-hover:-translate-y-1 group-hover:translate-x-1 sm:col-span-1" />
            </Link>
          </Rise>
        ))}
      </ul>
      {promoted && (
        <ul className="grid-main mt-16 gap-y-10">
          {featured.map((p, i) => (
            <Col as="li" key={p.id} span={{ base: 2, sm: 6, lg: 3 }}>
              <Rise delay={i * 90} y={32}>
                <OfferCard product={p} />
              </Rise>
            </Col>
          ))}
        </ul>
      )}
    </Section>
  );
}

function OfferCard({ product: p }: { product: Product }) {
  return (
    <Link href={`/p/${p.slug}`} onClick={() => signal("discount_interaction")} className="group block">
      <div className="relative overflow-hidden">
        <Img imgKey={p.variants[0].images[0]} alt="" sizes={SIZES.cardWide} ratio="4/5" imgClassName="transition-transform duration-[1400ms] ease-expo group-hover:scale-[1.04] group-focus-visible:scale-[1.04]" />
        <span className="absolute left-0 top-0 inline-flex h-7 items-center bg-bone px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald">{p.discount}% off</span>
      </div>
      <p className="eyebrow mt-4 text-bone">{labelById[p.labelId].name}</p>
      <h3 className="mt-1.5 line-clamp-2 text-[14px] leading-snug">{p.name}</h3>
      <p className="mt-1.5 flex items-baseline gap-2 text-[14px] tabular-nums">
        <span className="font-medium">{inr(p.price)}</span>
        <s className="text-[12.5px] text-stone">{inr(p.mrp)}</s>
      </p>
    </Link>
  );
}
