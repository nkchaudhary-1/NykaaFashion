import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EditFeature } from "@/components/editorial/EditFeature";
import { Col, Grid } from "@/components/layout/Grid";
import { ListingHeader } from "@/components/plp/ListingHeader";
import { Section } from "@/components/layout/Section";
import { Rise } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { computedEdits, primaryEdits } from "@/data/edits";
import { editProducts } from "@/data/queries";

export const metadata: Metadata = { title: "Edits", description: "Curated destinations: Hidden Gems, Luxe, the Responsible Edit, Festive & Wedding and House of Nykaa." };

const products = (n: number) => `${n} ${n === 1 ? "product" : "products"}`;

/**
 * The index of edits as an asymmetric spread — a different rhythm from the Home mosaic: a 7 + 5 row, then 4 + 4 + 4. Each edit is a big silent picture with
 * its numeral, kicker, title and count on the page beneath it. Below, the computed edits are a typographic list: pointing at (or tabbing to) a row slides its title.
 */
export default function EditsIndex() {
  const [lead, second, ...rest] = primaryEdits;
  return (
    <>
      <ListingHeader crumbs={[{ name: "Home", href: "/" }, { name: "Edits" }]} eyebrow="Curated destinations" title={<><span className="block">Luxe, Hidden Gems</span> <em>&amp; more.</em></>} intro="Each destination has a story, a set of labels and a short list of things worth owning — the poster tiles under More in the navigation, in one place." />
      <Section y="none" className="pb-[var(--section-y)]">
        <Grid className="gap-y-14 lg:gap-y-20">
          {/* the first row is the page's first picture: never hidden for a reveal. The 7-column picture keeps its ratio and sets the row's height; the 5-column one fills it, so both end on the same line */}
          <Col span={{ base: 4, sm: 12, lg: 7 }}>
            <EditFeature edit={lead} index={0} imgKey={`scenes/edit-${lead.id}-wide`} ratio="6/5" position="72% 50%" load="eager" />
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 5 }}>
            <EditFeature edit={second} index={1} ratio="5/4" sizes="(min-width:1024px) 42vw, 100vw" load="eager" fill />
          </Col>
          {rest.map((e, i) => (
            <Col key={e.id} span={{ base: 4, sm: i < 2 ? 6 : 12, lg: 4 }}>
              <Rise y={36} delay={(i % 3) * 90}>
                <EditFeature edit={e} index={i + 2} size="md" ratio={i < 2 ? "4/5" : "16/10"} sizes="(min-width:1024px) 33vw, (min-width:600px) 50vw, 100vw" />
              </Rise>
            </Col>
          ))}
        </Grid>
      </Section>
      <Section tone="paper" y="md" className="border-t border-line" aria-labelledby="computed">
        <SectionHeading eyebrow="Computed — never hand-tagged" title={<span id="computed">Shortcuts by price &amp; date.</span>} />
        <Grid className="mt-12 gap-y-8 sm:mt-16">
          <Col span={{ base: 4, sm: 12 }}>
            <ul className="border-t border-ink">
              {computedEdits.map((e, i) => (
                <li key={e.id} className="group/row border-b border-line">
                  <Link href={`/edits/${e.id}`} className="group flex items-baseline gap-4 py-5 sm:gap-6 sm:py-6">
                    <span className="w-6 shrink-0 text-[11px] tabular-nums text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="eyebrow block text-ink-3">{e.kicker}</span>
                      <span className="display-sm mt-2 block transition-transform duration-500 ease-expo group-hover:translate-x-2 group-focus-visible:translate-x-2">{e.title}</span>
                      <span className="mt-2 block max-w-[46ch] text-[14px] leading-snug text-ink-2">{e.blurb}</span>
                    </span>
                    <span className="hidden shrink-0 text-[12px] tabular-nums text-ink-3 sm:block">{products(editProducts(e).length)}</span>
                    <ArrowUpRight size={20} strokeWidth={1.4} aria-hidden className="shrink-0 self-center transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </Col>
        </Grid>
      </Section>
    </>
  );
}
