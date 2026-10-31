"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Col, Grid, type Rows, type RowStart, type Span, type Start } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { Parallax } from "@/components/motion/Parallax";
import { Rise } from "@/components/motion/reveal";
import { Img } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { editById } from "@/data/edits";
import { editProducts } from "@/data/queries";
import { cn } from "@/lib/cn";
import { signal } from "@/stores/intent";
import { pad2, pieces, useMedia, WIDE_SCREEN } from "./kit";
import { Unveil } from "./Unveil";

/*
 * Curated destinations as tall panels. Each picture drifts a little against the scroll inside its frame (the frame never moves, so every panel stays on the grid),
 * every panel carries a numeral, and Luxe sits on the black surface. Two large panels, then three; the right-hand and middle ones start lower, so the rows are
 * staggered rather than ruled.
 */
interface Panel {
  id: string;
  span: Span;
  start?: Start;
  rowStart?: RowStart;
  rows?: Rows;
  /** frame ratio */
  ratio: string;
  /** vertical offset, from 1024px */
  drop?: string;
  amount: number;
  dark?: boolean;
}
const PANELS: Panel[] = [
  { id: "luxe", span: { base: 4, sm: 6, lg: 6 }, start: { lg: 1 }, rowStart: { lg: 1 }, ratio: "aspect-[4/5]", amount: 48, dark: true },
  { id: "hidden-gems", span: { base: 4, sm: 6, lg: 6 }, start: { lg: 7 }, rowStart: { lg: 1 }, ratio: "aspect-[4/5]", drop: "lg:mt-32", amount: 48 },
  { id: "responsible", span: { base: 2, sm: 4, lg: 4 }, start: { lg: 1 }, rowStart: { lg: 2 }, ratio: "aspect-[3/4]", amount: 32 },
  { id: "festive", span: { base: 2, sm: 4, lg: 4 }, start: { lg: 5 }, rowStart: { lg: 2 }, ratio: "aspect-[3/4]", drop: "lg:mt-20", amount: 32 },
  { id: "house-of-nykaa", span: { base: 4, sm: 4, lg: 4 }, start: { lg: 9 }, rowStart: { lg: 2 }, ratio: "aspect-[3/4]", amount: 32 },
];

export function FeaturedEdits() {
  // the drift must stay inside the picture's overscan (7% of the frame's height at each end): the frames are about half as tall below 1024px
  const wide = useMedia(WIDE_SCREEN);
  const computed = [
    ["/edits/new-in", "New in"],
    ["/edits/under-1500", "Under ₹1,500"],
    ["/edits/under-3000", "Under ₹3,000"],
    ["/edits/the-offer-edit", "The Offer Edit"],
  ];
  return (
    <Section tone="paper">
      <SectionHeading eyebrow="Curated destinations" title={<>Luxe, Hidden Gems <em>&amp; more</em></>} intro="Curated destinations on Nykaa Fashion — each with its own story, labels and a short list of pieces worth owning." href="/edits" hrefLabel="All destinations" size="lg" />
      <Grid className="mt-14 gap-y-14 sm:mt-20 lg:gap-y-20">
        {PANELS.map((pn, i) => {
          const e = editById[pn.id];
          const n = editProducts(e).length;
          return (
            <Col key={e.id} span={pn.span} start={pn.start} rowStart={pn.rowStart} className={pn.drop}>
              <Link href={`/edits/${e.id}`} onClick={() => signal("edit_open", { editId: e.id })} data-cursor="View" className={cn("group block", pn.dark && "on-dark bg-luxe text-bone")}>
                <Unveil>
                  <Parallax className={pn.ratio} amount={wide ? pn.amount : Math.round(pn.amount * 0.4)} scale={1.18}>
                    <Img imgKey={`scenes/edit-${e.id}-tall`} alt="" sizes={pn.span.lg === 6 ? "(min-width:1024px) 50vw, 100vw" : "(min-width:1024px) 33vw, (min-width:600px) 33vw, 50vw"} ratio="fill" className="h-full w-full" />
                  </Parallax>
                </Unveil>
                <Rise y={18} className={cn("block", pn.dark ? "p-5 sm:p-7" : "pt-5")}>
                  <span className="flex items-start justify-between gap-4">
                    <span className={cn("block min-w-0", pn.span.lg === 6 ? "display-md" : "display-sm")}>{e.title}</span>
                    <span aria-hidden className={cn("eyebrow shrink-0 tabular-nums", pn.dark ? "text-stone" : "text-ink-3")}>
                      {pad2(i + 1)}
                    </span>
                  </span>{" "}
                  <span className={cn("mt-3 block max-w-[38ch] text-[14px] leading-relaxed", pn.dark ? "text-stone" : "text-ink-2")}>{e.blurb}</span>{" "}
                  <span className="mt-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]">
                    {pieces(n)} <ArrowRight size={14} aria-hidden className="transition-transform duration-500 ease-expo group-hover:translate-x-1" />
                  </span>
                </Rise>
              </Link>
            </Col>
          );
        })}
      </Grid>
      <ul className="mt-20 grid grid-cols-2 border-t border-ink sm:mt-28 sm:grid-cols-4">
        {computed.map(([href, label]) => (
          <li key={href} className="border-b border-line">
            <Link href={href} className="group flex h-16 items-center justify-between gap-3 pr-4 text-[15px] font-medium transition-colors duration-300 hover:text-pink sm:h-20 sm:text-[17px]">
              {label}
              <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden className="shrink-0 transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
