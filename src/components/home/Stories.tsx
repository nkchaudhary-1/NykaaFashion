"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { RevealText } from "@/components/motion/reveal";
import { Img } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Story } from "@/data/types";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";
import { Unveil } from "./Unveil";

/*
 * Style Files as an asymmetric editorial grid: a seven-column lead (4:5) with a big title, and two smaller cards in the other five columns — the first starts lower
 * than the lead, the second steps two columns to the right — so the three never share a top or a left edge.
 */
function StoryMeta({ s, className }: { s: Story; className?: string }) {
  return (
    <p className={cn("eyebrow text-ink-3", className)}>
      {s.kicker} · {s.readMins} min
    </p>
  );
}

export function StoryStrip({ list }: { list: Story[] }) {
  const [first, ...others] = list;
  if (!first) return null;
  const open = (s: Story) => () => {
    signal("story_open", { editId: s.editId, tags: s.tags });
    track("editorial_story_open", { storyId: s.id, source: "home-stories" });
  };
  const small = others.slice(0, 2);
  return (
    <Section tone="bone">
      <SectionHeading size="lg" eyebrow="Style Files" title={<>Style inspiration, <em>shoppable</em></>} intro="Every image is shoppable, every look is built from pieces you can add without leaving the story." href="/discover" hrefLabel="Read all stories" splitAt={7} />
      <Grid className="mt-14 gap-y-14 sm:mt-20">
        <Col span={{ base: 4, sm: 12, lg: 7 }} start={{ lg: 1 }} rowStart={{ lg: 1 }} rows={{ lg: 2 }}>
          <Link href={`/discover/${first.id}`} onClick={open(first)} data-cursor="View" className="group block">
            <Unveil className="bg-sand">
              <Img imgKey={first.cover.tall} alt="" sizes="(min-width:1024px) 58vw, 100vw" ratio="4/5" imgClassName="transition-transform duration-[1400ms] ease-expo group-hover:scale-[1.03] group-focus-visible:scale-[1.03]" />
            </Unveil>
            <span className="mt-6 block">
              <StoryMeta s={first} />
              <RevealText as="h3" className="display-md mt-4 max-w-[16em]">
                {first.title}
              </RevealText>
              <span className="mt-4 block max-w-[52ch] text-[15px] leading-relaxed text-ink-2">{first.dek}</span>
              <span className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]">
                Read the story <ArrowRight size={14} aria-hidden className="transition-transform duration-500 ease-expo group-hover:translate-x-1" />
              </span>
            </span>
          </Link>
        </Col>
        {small.map((s, i) => (
          <Col key={s.id} span={{ base: 2, sm: 6, lg: 3 }} start={{ lg: i === 0 ? 8 : 10 }} rowStart={{ lg: i === 0 ? 1 : 2 }} className={i === 0 ? "lg:pt-24" : undefined}>
            <Link href={`/discover/${s.id}`} onClick={open(s)} data-cursor="View" className="group block">
              <Unveil delay={i * 120} className="bg-sand">
                <Img imgKey={s.cover.tall} alt="" sizes="(min-width:1024px) 25vw, (min-width:600px) 50vw, 50vw" ratio="4/5" imgClassName="transition-transform duration-[1400ms] ease-expo group-hover:scale-[1.04] group-focus-visible:scale-[1.04]" />
              </Unveil>
              <span className="mt-5 block">
                <StoryMeta s={s} />
                <RevealText as="h3" className="display-sm mt-3">
                  {s.title}
                </RevealText>
                <span className="mt-3 hidden text-[14px] leading-relaxed text-ink-2 sm:line-clamp-3 sm:block">{s.dek}</span>
              </span>
            </Link>
          </Col>
        ))}
      </Grid>
    </Section>
  );
}
