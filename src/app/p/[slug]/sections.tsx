import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { LabelMonogram } from "@/components/product/LabelMark";
import { ProductCard } from "@/components/product/ProductCard";
import { LinkButton } from "@/components/ui/Button";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { SIZES } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { editById } from "@/data/edits";
import { labelById } from "@/data/labels";
import type { Edit, Label, Product } from "@/data/types";
import { fromSameLabel, inSameEdit, similarTo } from "@/lib/recs";

// ── More from this label: a 4-up carousel (arrows in the heading), opening with the label itself ──
export function MoreFromLabel({ product }: { product: Product }) {
  const label = labelById[product.labelId];
  const items = fromSameLabel(product, 8);
  if (items.length === 0) return null;
  return (
    <Section tone="paper" aria-labelledby="more-label" className="border-y border-line">
      <Carousel>
        <SectionHeading level={2} eyebrow="The label behind it" title={<span id="more-label">More from {label.name}.</span>} intro={label.story} href={`/brands/${label.id}`} hrefLabel="Meet the label">
          <CarouselArrows />
        </SectionHeading>
        <div className="mt-10 sm:mt-14">
          <CarouselTrack label={`More from ${label.name}`} density="product">
            {[
              <LabelTile key="label" label={label} />,
              ...items.map((p) => (
                <div key={p.id} className="flex h-full flex-col">
                  <ProductCard product={p} source="pdp-label" sizes={SIZES.rail} />
                </div>
              )),
            ]}
          </CarouselTrack>
        </div>
      </Carousel>
    </Section>
  );
}

/** The label as the first card: its own two colours, monogram, one line of voice, one link. */
function LabelTile({ label }: { label: Label }) {
  return (
    <Link href={`/brands/${label.id}`} className="group flex aspect-[4/5] flex-col justify-between p-5 sm:p-6" style={{ background: label.tone.bg, color: label.tone.fg }}>
      <span className="eyebrow">The label</span>
      <LabelMonogram label={label} size="lg" className="-ml-1 self-start" />
      <span>
        <span className="display-xs block">{label.name}</span>
        <span className="mt-2 block text-[13.5px] leading-snug">{label.tagline}</span>
        <span className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]">
          Meet the label <ArrowRight size={15} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
        </span>
      </span>
    </Link>
  );
}

// ── In the same edit: a flat colour panel in the edit's identity colour (4 columns) beside two product cards (4 columns each) ──
const PANEL: Record<Edit["theme"], string> = {
  gem: "on-dark bg-gem text-bone",
  luxe: "on-dark bg-luxe text-bone",
  resp: "on-dark bg-resp text-bone",
  festive: "on-dark bg-festive text-bone",
  hon: "bg-pink-tint text-ink",
  ink: "on-dark bg-ink text-bone",
  sand: "bg-sand text-ink",
};
const DARK = new Set<Edit["theme"]>(["gem", "luxe", "resp", "festive", "ink"]);

export function EditBand({ product }: { product: Product }) {
  const same = inSameEdit(product, 2);
  if (!same) return null;
  const edit = editById[same.editId];
  return (
    <Section aria-labelledby="same-edit">
      <Grid className="gap-y-[var(--gap)]">
        <Col span={{ base: 4, sm: 12, lg: 4 }} className={`flex flex-col p-6 sm:p-8 ${PANEL[edit.theme]}`}>
          <p className="eyebrow">Curated · {edit.kicker}</p>
          <h2 className="display-sm mt-5">
            <span id="same-edit">In the {edit.title} edit.</span>
          </h2>
          <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed">{edit.blurb}</p>
          <LinkButton href={`/edits/${edit.id}`} variant={DARK.has(edit.theme) ? "inverse" : "secondary"} size="lg" className="mt-8 self-start sm:mt-auto" iconRight={<ArrowRight size={16} />}>
            Shop the edit
          </LinkButton>
        </Col>
        {same.items.map((p) => (
          <Col key={p.id} span={{ base: 2, sm: 6, lg: 4 }}>
            <ProductCard product={p} source="pdp-same-edit" sizes={SIZES.half} />
          </Col>
        ))}
      </Grid>
    </Section>
  );
}

// ── Similar pieces: a mixed-size grid — one feature (6 columns × 2 rows) beside four standard cards (3 columns) ──
export function SimilarGrid({ product }: { product: Product }) {
  const [feature, ...rest] = similarTo(product, 5, (x) => x.categoryPath[0] === product.categoryPath[0]);
  if (!feature) return null;
  return (
    <Section tone="paper" aria-labelledby="similar" className="border-y border-line">
      <SectionHeading level={2} eyebrow="More to consider" title={<span id="similar">Similar pieces.</span>} />
      <Grid className="mt-10 gap-y-10 sm:mt-14">
        <Col span={{ base: 4, sm: 6, lg: 6 }} rows={{ sm: 2, lg: 2 }} className="flex flex-col">
          <ProductCard product={feature} source="pdp-similar" sizes={SIZES.half} fill className="flex-1" />
        </Col>
        {rest.slice(0, 4).map((p) => (
          <Col key={p.id} span={{ base: 2, sm: 3, lg: 3 }}>
            <ProductCard product={p} source="pdp-similar" sizes={SIZES.cardWide} />
          </Col>
        ))}
      </Grid>
    </Section>
  );
}
