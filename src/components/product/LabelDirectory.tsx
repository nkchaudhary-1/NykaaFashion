"use client";
import Link from "next/link";
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
 * The A–Z directory. Desktop: a sticky letter rail on columns 1–2, the labels in three text columns on 4–6 / 7–9 / 10–12
 * (CSS columns with the grid gap, so they land exactly on the page columns). Phones and tablets: the letters become a scrolling row.
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
      <SectionHeading eyebrow="A–Z" title={<span id="az">Every label.</span>} />
      <Tabs items={FILTERS.map((x) => ({ ...x, count: labels.filter((l) => x.id === "all" || l.flags[x.id as keyof typeof l.flags]).length }))} value={f} onChange={setF} label="Filter labels" variant="pill" className="mt-10 pb-1" />
      <Grid className="mt-10 gap-y-8 sm:mt-14">
        <Col span={{ base: 4, sm: 12, lg: 2 }} className="lg:sticky lg:top-[calc(var(--header-offset,var(--header-h))+24px)] lg:self-start lg:transition-[top] lg:duration-500">
          <nav aria-label="Jump to letter">
            <ul className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
              {groups.map(([letter]) => (
                <li key={letter} className="shrink-0">
                  <a href={`#l-${letter}`} className="tap inline-flex size-11 items-center justify-center border border-transparent text-[15px] font-medium transition-colors hover:border-ink lg:h-9 lg:w-full lg:justify-start lg:border-0 lg:hover:underline lg:hover:decoration-1 lg:hover:underline-offset-4">
                    {letter}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Col>
        <Col span={{ base: 4, sm: 12, lg: 9 }} start={{ lg: 4 }} rowStart={{ lg: 1 }}>
          <div className="columns-1 [column-gap:var(--gap)] sm:columns-2 lg:columns-3">
            {groups.map(([letter, list]) => (
              <section key={letter} aria-labelledby={`l-${letter}`} className="mb-10 break-inside-avoid">
                <h3 id={`l-${letter}`} className="display-xs border-b border-ink pb-3">
                  {letter}
                </h3>
                <ul>
                  {list.map((l) => (
                    <li key={l.id} className="border-b border-line">
                      <Link href={`/brands/${l.id}`} className="group flex items-start gap-4 py-4">
                        <LabelMonogram label={legible(l)} size="sm" className="shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-medium leading-tight tracking-[-0.01em] group-hover:underline group-hover:underline-offset-4">{l.name}</span>
                          <span className="mt-1 block truncate text-[13px] text-ink-2">{l.tagline}</span>
                          <LabelBadges label={l} className="mt-2" />
                        </span>
                        <span className="shrink-0 text-right text-[12px] tabular-nums leading-tight text-ink-3">
                          {COUNT[l.id] ?? 0}
                          <br />
                          products
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Col>
      </Grid>
    </Section>
  );
}
