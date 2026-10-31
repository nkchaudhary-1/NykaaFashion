"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { Parallax } from "@/components/motion/Parallax";
import { Rise } from "@/components/motion/reveal";
import { Img } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { earlyAtMs, launchAtMs, type BrandLaunch } from "@/data/launches";
import { cn } from "@/lib/cn";
import { Countdown } from "./Countdown";
import { headlineNodes } from "./headline";
import { NotifyButton } from "./Notify";
import { clock12, ist, whenShort } from "./time";
import { Wordmark } from "./Wordmark";

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * COMING SOON as a calendar: one ruled row per upcoming brand — the day as a big numeral with its month, weekday and time, a wide campaign picture drifting inside its
 * frame, and the brand, its headline, a one-line description, a compact countdown and Notify me. The rows alternate (picture left, wide / picture right, narrower) so
 * the list has a rhythm; hairlines instead of boxes.
 */
export function ComingSoon({ rows }: { rows: BrandLaunch[] }) {
  return (
    <Section tone="bone" id="coming" aria-labelledby="coming-h">
      <SectionHeading
        eyebrow="Coming soon"
        title={
          <span id="coming-h">
            Mark the <em>calendar.</em>
          </span>
        }
        size="lg"
        intro="Every brand arriving next, with its launch date and a countdown. Tap Notify me and we’ll tell you the moment the doors open — members get in first."
      />
      {rows.length > 0 ? (
        <ol className="mt-12 sm:mt-16">
          {rows.map((l, i) => (
            <LaunchRow key={l.id} launch={l} index={i} total={rows.length} flip={i % 2 === 1} />
          ))}
        </ol>
      ) : (
        <Rise className="mt-12 border-t border-ink pt-8 sm:mt-16">
          <p className="display-md max-w-[18ch]">Nothing new is on the calendar yet.</p>
          <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">The next launch will appear here with its date and a countdown. In the meantime, see who has just joined.</p>
          <a href="#recent" className="link-u tap mt-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]">
            Recently launched <ArrowRight size={14} aria-hidden />
          </a>
        </Rise>
      )}
    </Section>
  );
}

function LaunchRow({ launch, index, total, flip }: { launch: BrandLaunch; index: number; total: number; flip: boolean }) {
  const at = launchAtMs(launch);
  const p = ist(at);
  const early = earlyAtMs(launch);
  const href = `/new-and-next/${launch.id}`;
  const { wide, tall } = launch.images.hero;
  return (
    <li className={cn("border-t border-ink pt-6 sm:pt-8 lg:pt-10", index > 0 && "mt-14 sm:mt-20 lg:mt-28")}>
      <Grid className="items-start gap-y-7">
        {/* the picture */}
        <Col span={{ base: 4, sm: 12, lg: flip ? 6 : 7 }} start={{ lg: flip ? 7 : 1 }} rowStart={{ lg: 1 }}>
          <Link href={href} aria-hidden tabIndex={-1} data-cursor="View" className="block">
            <Parallax className="aspect-[4/5] bg-sand sm:aspect-[16/10]" amount={34} scale={1.12}>
              <Img imgKey={tall} alt="" sizes="(min-width:600px) 1px, 100vw" ratio="fill" className="absolute inset-0 h-full sm:hidden" />
              <Img imgKey={wide} alt="" sizes={flip ? "(min-width:1024px) 50vw, 100vw" : "(min-width:1024px) 58vw, 100vw"} ratio="fill" position="64% 40%" className="absolute inset-0 hidden h-full sm:block" />
            </Parallax>
          </Link>
        </Col>

        {/* the date, the brand, the actions */}
        <Col span={{ base: 4, sm: 12, lg: flip ? 5 : 4 }} start={{ lg: flip ? 1 : 9 }} rowStart={{ lg: 1 }} className="flex flex-col">
          <Rise>
            <p className="eyebrow flex items-center justify-between gap-4 text-ink-3">
              <span className="tabular-nums" aria-hidden>
                {pad2(index + 1)} / {pad2(total)}
              </span>
              <span>{launch.brand.category}</span>
            </p>
            <time dateTime={launch.launchAt} className="mt-5 flex items-end gap-4 sm:mt-6 sm:gap-5">
              <span className="font-medium leading-[0.78] tracking-[-0.06em] tabular-nums [font-size:clamp(4.75rem,9vw,8.5rem)]">{p.day}</span>
              <span className="pb-1">
                <span className="eyebrow block">{p.monthShort}</span>
                <span className="mt-2 block text-[13px] leading-snug text-ink-2">
                  {p.weekday}
                  <br />
                  {clock12(p)} IST
                </span>
              </span>
            </time>
            {early !== null && <p className="mt-4 text-[13px] text-ink-2">Members shop early — from {whenShort(early)}</p>}
          </Rise>
          <Rise delay={80} className="mt-8 sm:mt-10">
            <Wordmark launch={launch} className="text-[1.125rem] sm:text-[1.25rem]" />
            <h3 className="display-sm mt-3 max-w-[16ch] [--em-color:var(--color-pink-ink)]">{headlineNodes(launch.headline)}</h3>
            <p className="mt-3 max-w-[40ch] text-[14.5px] leading-snug text-ink-2">{launch.brand.tagline}</p>
          </Rise>
          <Rise delay={140} className="mt-6 border-t border-line pt-4">
            <Countdown launch={launch} variant="compact" />
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <NotifyButton launch={launch} size="md" />
              <Link href={href} className="link-u tap group inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]">
                View the launch
                <ArrowRight size={14} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
              </Link>
            </div>
          </Rise>
        </Col>
      </Grid>
    </li>
  );
}
