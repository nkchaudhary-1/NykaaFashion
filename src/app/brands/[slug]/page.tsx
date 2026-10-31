import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { RevealText, Rise } from "@/components/motion/reveal";
import { Section } from "@/components/layout/Section";
import { LabelBadges, LabelMonogram } from "@/components/product/LabelMark";
import { interleave, labelStoryNote, relatedEditTiles, type Feature } from "@/components/plp/features";
import { ProductListing } from "@/components/plp/ProductListing";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Img, SIZES } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { ListingSkeleton } from "@/components/plp/PageSkeletons";
import { labelById, labels } from "@/data/labels";
import { productsByLabel } from "@/data/queries";
import { LabelTile } from "../_components/LabelTile";
import { legible } from "../_components/labelTone";

export function generateStaticParams() {
  return labels.map((l) => ({ slug: l.id }));
}
export async function generateMetadata({ params }: PageProps<"/brands/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const l = labelById[slug];
  return l ? { title: l.name, description: l.tagline } : {};
}

export default function BrandPage(props: PageProps<"/brands/[slug]">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <BrandContent params={props.params} />
    </Suspense>
  );
}

async function BrandContent({ params }: Pick<PageProps<"/brands/[slug]">, "params">) {
  const { slug } = await params;
  const label = labelById[slug];
  if (!label) notFound();
  const pool = productsByLabel(label.id);
  const siblings = labels.filter((l) => l.id !== label.id && (l.flags.hiddenGem === label.flags.hiddenGem && l.flags.luxe === label.flags.luxe && l.flags.houseOfNykaa === label.flags.houseOfNykaa)).slice(0, 4);
  // The big picture: the label's most prominent piece that is in stock.
  const shown = pool.filter((p) => !p.soldOut).slice(0, 1);
  // Grid inserts (only when the label has enough pieces): its story as an info panel, a hero piece, a related edit.
  const features: Feature[] = interleave<Feature>([labelStoryNote(label)], [{ kind: "hero" }], relatedEditTiles(pool, 1));
  return (
    <>
      <header className="container-x pb-[var(--section-y)] pt-6 sm:pt-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Labels", href: "/brands" }, { name: label.name }]} className="mb-10 sm:mb-14" />
        {/* the label's name at poster scale across all twelve columns, then its story (columns 1–5) beside one big picture of a piece (columns 7–12) */}
        <RevealText as="h1" className="display-xl min-w-0">
          {label.name}
        </RevealText>
        <Grid className="mt-10 items-start gap-y-10 border-t border-line pt-8 sm:mt-14 sm:pt-10">
          <Col span={{ base: 4, sm: 12, lg: 5 }} className="order-2 lg:order-1" rowStart={{ lg: 1 }}>
            <Rise>
              <LabelMonogram label={legible(label)} size="md" />
              <p className="display-sm mt-8 max-w-[22ch]">{label.tagline}</p>
              <dl className="mt-8 grid grid-cols-3 gap-x-[var(--gap)] border-t border-line pt-5">
                {[
                  ["Based in", label.origin ?? "—"],
                  ["Since", label.founded ? String(label.founded) : "—"],
                  ["Pieces", String(pool.length)],
                ].map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="eyebrow text-ink-3">{k}</dt>
                    <dd className="mt-2 text-[14px] tabular-nums leading-snug">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-8 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">{label.story}</p>
              <LabelBadges label={label} className="mt-6" />
            </Rise>
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 7 }} rowStart={{ lg: 1 }} className="order-1 -mx-[var(--gutter)] sm:mx-0 lg:order-2">
            {shown[0] && (
              <Link href={`/p/${shown[0].slug}`} aria-hidden tabIndex={-1} data-cursor="View" className="group relative block aspect-[4/5] overflow-hidden bg-sand sm:aspect-[16/10] lg:aspect-[4/5]">
                <div data-nogrid className="absolute inset-0 transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.04]">
                  <Img imgKey={shown[0].variants[0].images[0]} alt="" sizes="(min-width:1024px) 50vw, 100vw" ratio="fill" load="preload" position="50% 30%" className="absolute inset-0 h-full" />
                </div>
              </Link>
            )}
          </Col>
        </Grid>
      </header>
      <Suspense fallback={<div className="container-x"><GridSkeleton count={8} /></div>}>
        <div className="border-t border-line pt-[var(--section-y)]">
          <ProductListing pool={pool} scopeKey={`brand:${label.id}`} source={`brand:${label.id}`} hide={["label"]} features={features} />
        </div>
      </Suspense>
      {siblings.length > 0 && (
        <Section tone="paper" y="md" className="mt-[var(--section-y)] border-t border-line" aria-labelledby="more-labels">
          <SectionHeading level={2} size="lg" eyebrow="Keep exploring" title={<span id="more-labels">More labels like this.</span>} href="/brands" hrefLabel="All labels" />
          <Grid as="ul" className="mt-12 gap-y-12">
            {siblings.map((l) => (
              <Col as="li" key={l.id} span={{ base: 2, sm: 6, lg: 3 }}>
                <LabelTile label={l} sizes={SIZES.cardWide} />
              </Col>
            ))}
          </Grid>
        </Section>
      )}
    </>
  );
}
