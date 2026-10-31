"use client";
import { useMemo } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { SIZES } from "@/components/ui/Img";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { products } from "@/data/catalog";
import type { Product } from "@/data/types";

// ── Trending: mixed-size grid — one feature piece (6 columns × 2 rows) + four standard cards, rising in turn ──
function trendingPicks(): Product[] {
  const best = (top: string, skip: Set<string>) => products.filter((p) => !p.soldOut && p.categoryPath[0] === top && !skip.has(p.id)).sort((a, b) => a.rank - b.rank)[0];
  const used = new Set<string>();
  const out: Product[] = [];
  for (const top of ["women", "men", "home", "women", "kids"]) {
    const p = best(top, used);
    if (p) {
      used.add(p.id);
      out.push(p);
    }
  }
  return out;
}
export function TrendingGrid() {
  const [feature, ...rest] = useMemo(() => trendingPicks(), []);
  if (!feature) return null;
  return (
    <Section tone="bone">
      <SectionHeading size="lg" eyebrow="Trending now" title={<>Most wanted <em>right now</em></>} intro="The pieces added to wishlists most this week — from every department, in one grid." />
      <Grid className="mt-12 gap-y-10 sm:mt-16">
        <Col span={{ base: 4, sm: 6, lg: 6 }} rows={{ sm: 2, lg: 2 }} className="flex flex-col">
          <Reveal y={36} className="flex min-h-0 flex-1 flex-col">
            <ProductCard product={feature} source="home-trending" sizes={SIZES.half} fill className="flex-1" />
          </Reveal>
        </Col>
        {rest.slice(0, 4).map((p, i) => (
          <Col key={p.id} span={{ base: 2, sm: 3, lg: 3 }}>
            <Reveal y={36} delay={120 + i * 90} className="h-full">
              <ProductCard product={p} source="home-trending" sizes={SIZES.cardWide} />
            </Reveal>
          </Col>
        ))}
      </Grid>
    </Section>
  );
}
