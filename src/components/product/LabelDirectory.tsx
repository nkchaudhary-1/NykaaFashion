"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Tabs } from "@/components/ui/Tabs";
import { labels } from "@/data/labels";
import { products } from "@/data/catalog";
import { legible } from "@/app/brands/_components/labelTone";
import { LabelBadges, LabelMonogram } from "./LabelMark";

const COUNT: Record<string, number> = {};
for (const p of products) COUNT[p.labelId] = (COUNT[p.labelId] ?? 0) + 1;

const FILTERS = [
  { id: "all", label: "All labels" },
  { id: "hiddenGem", label: "Hidden Gems" },
  { id: "luxe", label: "Luxe" },
  { id: "houseOfNykaa", label: "House of Nykaa" },
  { id: "responsible", label: "Responsible" },
];

/**
 * The A–Z index, set as type. A row of letters jumps to a group; each group is a giant letter in columns 1–3 (it stays in view while its labels scroll past
 * on desktop) and the labels as large rows in columns 4–12 — name in display type, tagline and badges beside it, the product count as a numeral, a hairline
 * between rows. Pointing at (or tabbing to) a row slides its name and darkens its rule.
 */
export function LabelDirectory() {
  const [f, setF] = useState("all");
  const groups = useMemo(() => {
    const list = labels.filter((l) => f === "all" || l.flags[f as keyof typeof l.flags]).sort((a, b) => a.name.localeCompare(b.name));
    const out: Record<string, typeof labels> = {};
    for (const l of list) (out[l.name[0].toUpperCase()] ??= []).push(l);
    return Object.entries(out);
  }, [f]);
  return (
    <Section y="md" aria-labelledby="az">
      <SectionHeading eyebrow="A–Z" title={<span id="az">Every label.</span>} size="lg" />
      <Tabs items={FILTERS.map((x) => ({ ...x, count: labels.filter((l) => x.id === "all" || l.flags[x.id as keyof typeof l.flags]).length }))} value={f} onChange={setF} label="Filter labels" variant="pill" className="mt-12 pb-1" />
      <nav aria-label="Jump to letter" className="mt-8 border-t border-ink">
        <ul className="scrollbar-none -mx-1 flex overflow-x-auto px-1 lg:flex-wrap">
          {groups.map(([letter]) => (
            <li key={letter} className="shrink-0">
              <a href={`#l-${letter}`} className="tap inline-flex size-11 items-center justify-center text-[15px] font-medium transition-colors duration-300 hover:text-pink">
                {letter}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-6">
        {groups.map(([letter, list]) => (
          <section key={letter} aria-labelledby={`l-${letter}`} className="border-t border-line">
            <Grid className="gap-y-2">
              <Col span={{ base: 4, sm: 12, lg: 3 }}>
                <h3 id={`l-${letter}`} className="display-xl pt-4 leading-[0.9] lg:sticky lg:top-[calc(var(--header-offset,var(--header-h))+16px)] lg:pt-6 lg:transition-[top] lg:duration-500">
                  {letter}
                </h3>
              </Col>
              <Col span={{ base: 4, sm: 12, lg: 9 }}>
                <ul>
                  {list.map((l) => (
                    <li key={l.id} className="border-b border-line transition-colors duration-500 last:border-b-0 hover:border-ink">
                      <Link href={`/brands/${l.id}`} className="group flex items-center gap-4 py-5 sm:gap-6 sm:py-7">
                        <LabelMonogram label={legible(l)} size="sm" className="shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="display-sm block transition-transform duration-500 ease-expo group-hover:translate-x-2 group-focus-visible:translate-x-2">{l.name}</span>
                          <span className="mt-1.5 block truncate text-[13px] text-ink-2">{l.tagline}</span>
                          <LabelBadges label={l} className="mt-3" />
                        </span>
                        <span className="shrink-0 text-right text-[12px] tabular-nums leading-tight text-ink-3">
                          {COUNT[l.id] ?? 0}
                          <br />
                          products
                        </span>
                        <ArrowUpRight size={20} strokeWidth={1.4} aria-hidden className="hidden shrink-0 transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Col>
            </Grid>
          </section>
        ))}
      </div>
    </Section>
  );
}
