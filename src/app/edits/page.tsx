import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EditFeature } from "@/components/editorial/EditTile";
import { Col, Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { computedEdits, primaryEdits } from "@/data/edits";
import { editProducts } from "@/data/queries";
import type { Edit } from "@/data/types";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Edits", description: "Curated destinations: Hidden Gems, Luxe, the Responsible Edit, Festive & Wedding and House of Nykaa." };

const products = (n: number) => `${n} ${n === 1 ? "product" : "products"}`;

/**
 * The index of edits as an asymmetric bento — a different rhythm from the Home mosaic: a 7 + 5 row, then 4 + 4 + 4.
 * Each tile fills the box its column gives it (an aspect ratio on phones and tablets, the row height on desktop).
 * Below it, the computed edits are a row of flat shortcut tiles.
 */
export default function EditsIndex() {
  const [lead, second, ...rest] = primaryEdits;
  return (
    <>
      <PageHeader crumbs={[{ name: "Home", href: "/" }, { name: "Edits" }]} eyebrow="Curated destinations" title={<><span className="block">Luxe, Hidden Gems</span> <em>&amp; more.</em></>} intro="Each destination has a story, a set of labels and a short list of things worth owning — the poster tiles under More in the navigation, in one place." />
      <Section y="none" className="pb-[var(--section-y)]">
        <Grid className="gap-y-[var(--gap)]">
          <Col span={{ base: 4, sm: 12, lg: 7 }} className="relative aspect-[5/4] sm:aspect-[16/9] lg:aspect-[7/6]">
            <EditFeature edit={lead} imgKey={`scenes/edit-${lead.id}-wide`} position="72% 50%" load="eager" />
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 5 }} className="relative aspect-[5/4] sm:aspect-[16/9] lg:aspect-auto">
            <EditFeature edit={second} sizes="(min-width:1024px) 42vw, 100vw" load="eager" />
          </Col>
          {rest.map((e, i) => (
            <Col key={e.id} span={{ base: 4, sm: i < 2 ? 6 : 12, lg: 4 }} className={cn("relative aspect-[5/4] lg:aspect-[4/5]", i < 2 ? "sm:aspect-[4/5]" : "sm:aspect-[16/9]")}>
              <EditFeature edit={e} size="md" sizes="(min-width:1024px) 33vw, (min-width:600px) 50vw, 100vw" />
            </Col>
          ))}
        </Grid>
      </Section>
      <Section tone="paper" y="md" className="border-t border-line" aria-labelledby="computed">
        <SectionHeading eyebrow="Computed — never hand-tagged" title={<span id="computed">Shortcuts by price &amp; date.</span>} />
        <ul className="grid-main mt-10 gap-y-[var(--gap)]">
          {computedEdits.map((e) => (
            <Col as="li" key={e.id} span={{ base: 2, sm: 3, lg: 3 }}>
              <ShortcutTile edit={e} />
            </Col>
          ))}
        </ul>
      </Section>
    </>
  );
}

function ShortcutTile({ edit }: { edit: Edit }) {
  return (
    <Link href={`/edits/${edit.id}`} className="group flex h-full min-h-[200px] flex-col justify-between gap-6 border border-line-strong p-4 transition-colors hover:border-ink hover:bg-sand sm:p-5">
      <div>
        <p className="eyebrow opacity-80">
          <span className="block leading-[1.3]">{edit.kicker}</span>
        </p>
        <h3 className="display-xs mt-3 sm:text-[22px]">{edit.title}</h3>
        <p className="mt-3 text-[13.5px] leading-snug opacity-90">{edit.blurb}</p>
      </div>
      <p className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.09em]">
        <span className="tabular-nums">{products(editProducts(edit).length)}</span>
        <ArrowRight size={16} aria-hidden className="text-pink transition-transform duration-300 group-hover:translate-x-1" />
      </p>
    </Link>
  );
}
