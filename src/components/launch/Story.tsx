"use client";
import { Section } from "@/components/layout/Section";
import { RevealMedia, RevealText, Rise } from "@/components/motion/reveal";
import { Img } from "@/components/ui/Img";
import { launchAtMs, type BrandLaunch, type LaunchImage } from "@/data/launches";
import { cn } from "@/lib/cn";
import { longDate } from "./time";

/*
 * THE STORY — what the brand is, in its own words, with the campaign pictures composed as an editorial spread instead of a grid of equals. The pictures keep their own
 * ratios (portrait, square, tall, wide): the large one beside the text, a square dropped on its right, a tall one low on the left, the wide one closing the spread. A launch
 * with more pictures continues the pattern; one with fewer, or none, simply has a shorter spread — and a brand with neither story nor pictures has no section at all.
 */

/**
 * Where each picture sits on the 12 columns from 1024px (below that they follow in turn: portrait, a square and a tall one side by side — the tall one dropped — then the wide one).
 * The text takes the first four columns; the large portrait the next five; a square drops in on the right; a tall one sits low on the left under the text, and the wide
 * picture runs along the bottom. Offsets are large (≥ 6rem) or none.
 */
const SLOTS = [
  "col-span-4 sm:col-span-8 sm:col-start-5 lg:col-span-5 lg:col-start-5 lg:row-start-1", //                               the large portrait
  "col-span-2 sm:col-span-6 lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:mt-32", //                                    square, right, dropped
  "col-span-2 mt-12 sm:col-span-5 sm:col-start-8 sm:mt-0 lg:col-span-3 lg:col-start-1 lg:row-start-2 lg:mt-24", //        tall, left, low
  "col-span-4 sm:col-span-12 lg:col-span-8 lg:col-start-5 lg:row-start-2", //                                            the wide closing picture
  "col-span-2 sm:col-span-6 lg:col-span-4 lg:col-start-2 lg:row-start-3", //                                             a second pair, if there are more
  "col-span-2 mt-12 sm:col-span-5 sm:col-start-8 sm:mt-0 lg:col-span-5 lg:col-start-8 lg:row-start-3 lg:mt-20",
] as const;

export function LaunchStory({ launch }: { launch: BrandLaunch }) {
  const { story = [], images, brand } = launch;
  const pics = images.gallery.slice(0, SLOTS.length);
  if (!story.length && !pics.length) return null;
  return (
    <Section tone="bone" id="story" aria-labelledby="story-h" className="scroll-mt-24">
      <div className="grid-main items-start gap-y-14 lg:gap-y-20">
        <div className="col-span-4 min-w-0 sm:col-span-12 lg:col-span-4 lg:col-start-1 lg:row-start-1">
          <Rise as="p" y={14} className="eyebrow mb-5 text-ink-3">
            The story
          </Rise>
          <RevealText as="h2" className="display-md">
            <span id="story-h">{brand.tagline}</span>
          </RevealText>
          {story.map((para, i) => (
            <Rise as="p" key={i} delay={i * 80} className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-ink-2 first:mt-8">
              {para}
            </Rise>
          ))}
          <Rise as="dl" delay={120} className="mt-8 grid grid-cols-2 gap-x-[var(--gap)] gap-y-5 border-t border-line pt-5 text-[14px] sm:grid-cols-3">
            {[
              ["From", brand.origin],
              ["Category", brand.category],
              ["Launch", longDate(launchAtMs(launch))],
            ]
              .filter((r): r is [string, string] => !!r[1])
              .map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="eyebrow text-ink-3">{k}</dt>
                  <dd className="mt-2 leading-snug">{v}</dd>
                </div>
              ))}
          </Rise>
        </div>
        {pics.map((g, i) => (
          <Picture key={g.key} g={g} index={i} className={SLOTS[i]} />
        ))}
      </div>
    </Section>
  );
}

function Picture({ g, index, className }: { g: LaunchImage; index: number; className: string }) {
  return (
    <figure className={cn("min-w-0", className)}>
      <RevealMedia delay={(index % 2) * 90}>
        <Img imgKey={g.key} alt={g.alt} sizes={index === 0 ? "(min-width:1024px) 42vw, 100vw" : index === 3 ? "(min-width:1024px) 66vw, 100vw" : "(min-width:1024px) 28vw, 50vw"} />
      </RevealMedia>
      <figcaption aria-hidden className="mt-3 flex items-baseline gap-3 text-[12px] leading-snug text-ink-3">
        <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        <span className="min-w-0 max-w-[40ch]">{g.alt}</span>
      </figcaption>
    </figure>
  );
}
