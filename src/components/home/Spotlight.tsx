"use client";
import { ArrowRight } from "lucide-react";
import { Col } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { RevealText, Rise } from "@/components/motion/reveal";
import { LabelBadges, LabelMonogram } from "@/components/product/LabelMark";
import { ProductCard } from "@/components/product/ProductCard";
import { LinkButton } from "@/components/ui/Button";
import { Img, SIZES } from "@/components/ui/Img";
import { labelById } from "@/data/labels";
import { productsByLabel } from "@/data/queries";
import { heroImg, pieces } from "./kit";
import { Unveil } from "./Unveil";

/*
 * Label spotlight as a tall split on a flat surface: the picture takes the left six columns and bleeds off the left edge of the screen (full width below 1024px),
 * the label's story sits in columns 8–12, and two of its pieces run along the lower right (columns 7–12, three each).
 */
export function BrandSpotlight({ labelId, excludeId, eyebrow = "House of Nykaa" }: { labelId: string; excludeId?: string; eyebrow?: string }) {
  const label = labelById[labelId];
  const all = productsByLabel(labelId).filter((p) => !p.soldOut && p.id !== excludeId);
  const items = all.slice(0, 2);
  return (
    <Section tone="sand" y="none" bleed>
      <div className="container-x grid-main gap-y-10 pb-14 lg:gap-y-0 lg:pb-0">
        <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 1 }} rowStart={{ lg: 1 }} rows={{ lg: 2 }} className="relative -mx-[var(--gutter)] aspect-[4/5] sm:aspect-[16/10] lg:-ml-[var(--edge)] lg:mx-0 lg:aspect-auto lg:min-h-[min(100svh,1000px)]">
          <Unveil className="absolute inset-0">
            <Img imgKey={heroImg(all[0])} alt="" sizes="(min-width:1024px) 55vw, 100vw" ratio="fill" position="50% 35%" className="h-full w-full" />
          </Unveil>
        </Col>
        <Col span={{ base: 4, sm: 12, lg: 5 }} start={{ lg: 8 }} rowStart={{ lg: 1 }} className="flex flex-col justify-end lg:pb-12 lg:pt-24">
          <Rise as="p" y={14} className="eyebrow text-ink-3">
            {eyebrow}
          </Rise>
          <div className="mt-6 flex items-center gap-5">
            <LabelMonogram label={label} size="lg" />
            <div className="min-w-0">
              <RevealText as="h2" className="display-md">
                {label.name}
              </RevealText>
              {label.origin && (
                <p className="mt-2 text-[13px] text-ink-3">
                  {label.origin}
                  {label.founded ? ` · est. ${label.founded}` : ""}
                </p>
              )}
            </div>
          </div>
          <LabelBadges label={label} className="mt-5" />
          <Rise as="p" delay={120} className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-ink-2">
            {label.story}
          </Rise>
          <Rise delay={200} className="mt-8">
            <LinkButton href={`/brands/${label.id}`} variant="secondary" size="lg" iconRight={<ArrowRight size={16} />}>
              Meet the label · {pieces(all.length)}
            </LinkButton>
          </Rise>
        </Col>
        {items.map((p, i) => (
          <Col key={p.id} span={{ base: 2, sm: 6, lg: 3 }} start={{ lg: i === 0 ? 7 : 10 }} rowStart={{ lg: 2 }} className="lg:pb-24">
            <Rise delay={i * 90} y={32} className="h-full">
              <ProductCard product={p} source="home-brand" sizes={SIZES.cardWide} />
            </Rise>
          </Col>
        ))}
      </div>
    </Section>
  );
}
