import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { LabelMonogram } from "@/components/product/LabelMark";
import { interleave, labelStoryQuote, relatedEditTiles, type Feature } from "@/components/plp/features";
import { ProductListing } from "@/components/plp/ProductListing";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Img, SIZES } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { ListingPageSkeleton } from "@/components/ui/PageSkeletons";
import { labelById, labels } from "@/data/labels";
import { productsByLabel } from "@/data/queries";
import type { Label } from "@/data/types";
import { cn } from "@/lib/cn";
import { LabelTile } from "../_components/LabelTile";

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
    <Suspense fallback={<ListingPageSkeleton />}>
      <BrandContent params={props.params} />
    </Suspense>
  );
}

// ── The label's own colours, kept readable: a tone whose pair is below 4.5:1 is deepened toward ink until text on it passes AA.
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const mix = (a: string, b: string, t: number) => `#${rgb(a).map((v, i) => Math.round(v * (1 - t) + rgb(b)[i] * t).toString(16).padStart(2, "0")).join("")}`;
function bandColors(label: Label) {
  let bg = label.tone.bg;
  for (let t = 0.05; contrast(bg, label.tone.fg) < 4.5 && t <= 0.8; t += 0.05) bg = mix(label.tone.bg, "#16120f", t);
  return { bg, fg: label.tone.fg };
}

async function BrandContent({ params }: Pick<PageProps<"/brands/[slug]">, "params">) {
  const { slug } = await params;
  const label = labelById[slug];
  if (!label) notFound();
  const pool = productsByLabel(label.id);
  const siblings = labels.filter((l) => l.id !== label.id && (l.flags.hiddenGem === label.flags.hiddenGem && l.flags.luxe === label.flags.luxe && l.flags.houseOfNykaa === label.flags.houseOfNykaa)).slice(0, 4);
  const { bg, fg } = bandColors(label);
  const dark = lum(bg) < 0.28;
  // Two pieces from the label stand on the bottom edge of the band: its most prominent in-stock pieces, at their own 4:5.
  const shown = pool.filter((p) => !p.soldOut).slice(0, 2);
  const flags: string[] = [label.flags.hiddenGem && "Hidden Gem", label.flags.luxe && "Luxe", label.flags.houseOfNykaa && "House of Nykaa", label.flags.responsible && "Responsible"].filter((x): x is string => !!x);
  // Grid inserts (only when the label has enough pieces): its story as a quote, a hero piece, a related edit.
  const features: Feature[] = interleave<Feature>([labelStoryQuote(label)], [{ kind: "hero" }], relatedEditTiles(pool, 1));
  return (
    <>
      <div className="container-x pb-5 pt-6 sm:pb-6 sm:pt-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Labels", href: "/brands" }, { name: label.name }]} />
      </div>
      <header className={cn(dark && "on-dark")} style={{ background: bg, color: fg }}>
        <Grid className="container-x items-end">
          {/* cols 1–5: monogram, name, story, badges */}
          <Col span={{ base: 4, sm: 12, lg: 5 }} className="py-12 sm:py-14 lg:py-16">
            {/* the monogram is drawn in the band's colours, swapped, so it reads as a tile on the band */}
            <LabelMonogram label={{ ...label, tone: { bg: fg, fg: bg } }} size="lg" />
            <h1 className="display-lg mt-8 text-balance">{label.name}</h1>
            <p className="display-xs mt-4 max-w-[34ch]">{label.tagline}</p>
            <p className="mt-5 text-[13px] tabular-nums">{[label.origin, label.founded ? `est. ${label.founded}` : null, `${pool.length} pieces`].filter(Boolean).join(" · ")}</p>
            <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed">{label.story}</p>
            {flags.length > 0 && (
              <p className="mt-6 flex flex-wrap gap-1.5">
                {flags.map((f) => (
                  <Badge key={f} tone="light">
                    {f}
                  </Badge>
                ))}
              </p>
            )}
          </Col>
          {/* cols 6–12: two pieces side by side, standing on the band's bottom edge (4 + 3 columns; phones & tablets: edge to edge, 2 + 2) */}
          <Col span={{ base: 4, sm: 12, lg: 7 }} start={{ lg: 6 }} rowStart={{ lg: 1 }} className="-mx-[var(--gutter)] grid grid-cols-2 gap-x-[var(--gap)] self-end lg:mx-0 lg:grid-cols-7 lg:items-end">
            {shown.map((p, i) => (
              <Link key={p.id} href={`/p/${p.slug}`} aria-hidden tabIndex={-1} className={cn("group block overflow-hidden bg-sand", i === 0 ? "lg:col-span-4" : "lg:col-span-3")}>
                <Img imgKey={p.variants[0].images[0]} alt="" sizes={i === 0 ? "(min-width:1024px) 30vw, 50vw" : "(min-width:1024px) 23vw, 50vw"} ratio="4/5" load={i === 0 ? "high" : undefined} className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.03]" />
              </Link>
            ))}
          </Col>
        </Grid>
      </header>
      <Suspense fallback={<div className="container-x"><GridSkeleton count={8} /></div>}>
        <div className="pt-[var(--section-y)]">
          <ProductListing pool={pool} scopeKey={`brand:${label.id}`} source={`brand:${label.id}`} hide={["label"]} features={features} />
        </div>
      </Suspense>
      {siblings.length > 0 && (
        <Section tone="paper" y="md" className="mt-[var(--section-y)] border-t border-line" aria-labelledby="more-labels">
          <SectionHeading level={2} eyebrow="Keep exploring" title={<span id="more-labels">More labels like this.</span>} href="/brands" hrefLabel="All labels" />
          <Grid as="ul" className="mt-10 gap-y-10">
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
