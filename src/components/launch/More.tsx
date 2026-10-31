"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { RevealText, Rise } from "@/components/motion/reveal";
import { Img } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { earlyAtMs, isLaunched, launchAtMs, recentLaunches, upcomingLaunches, type BrandLaunch } from "@/data/launches";
import { cn } from "@/lib/cn";
import { useLaunchTime } from "./clock";
import { Countdown } from "./Countdown";
import { headlineNodes } from "./headline";
import { NotifyButton } from "./Notify";
import { clockShort, ist, longDate, shortDate } from "./time";
import { Wordmark } from "./Wordmark";

/** MORE LAUNCHES — the other brands (what is due first, then what has just arrived) as portraits on a rising stair: each one starts lower than the last. */
export function MoreLaunches({ current }: { current: BrandLaunch }) {
  const time = useLaunchTime();
  const list = [...upcomingLaunches(time), ...recentLaunches(time)].filter((l) => l.id !== current.id).slice(0, 3);
  if (!list.length) return null;
  return (
    <Section tone="bone" aria-labelledby="more-h" className="border-t border-line">
      <SectionHeading
        eyebrow="Keep going"
        title={
          <span id="more-h">
            More <em>launches.</em>
          </span>
        }
        size="lg"
        href="/new-and-next"
        hrefLabel="All launches"
      />
      <Grid as="ul" className="mt-12 gap-y-14 sm:mt-16 lg:items-start">
        {list.map((l, i) => (
          <Col as="li" key={l.id} span={{ base: 4, sm: 6, lg: 4 }} className={cn(i === 1 && "lg:mt-20", i === 2 && "lg:mt-40")}>
            <MoreTile launch={l} time={time} />
          </Col>
        ))}
      </Grid>
    </Section>
  );
}

function MoreTile({ launch, time }: { launch: BrandLaunch; time: number }) {
  const live = isLaunched(launch, time);
  const href = `/new-and-next/${launch.id}`;
  return (
    <Rise>
      <article className="group">
        <Link href={href} aria-hidden tabIndex={-1} data-cursor="View" className="block overflow-hidden bg-sand">
          <span data-nogrid className="block transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.04] group-focus-within:scale-[1.04]">
            <Img imgKey={launch.images.hero.tall} alt="" sizes="(min-width:1024px) 33vw, (min-width:600px) 50vw, 100vw" ratio="4/5" />
          </span>
        </Link>
        <p className="eyebrow mt-5 text-ink-3">{live ? `Now live · joined ${shortDate(launchAtMs(launch))}` : `Coming soon · ${shortDate(launchAtMs(launch))}`}</p>
        <h3 className="mt-4">
          <Wordmark launch={launch} className="text-[1.375rem]" />
        </h3>
        <p className="display-sm mt-3 max-w-[16ch] [--em-color:var(--color-pink-ink)]">{headlineNodes(launch.headline)}</p>
        <Link href={href} className="link-u tap group/cta mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]">
          View the launch
          <span className="sr-only"> of {launch.brand.name}</span>
          <ArrowRight size={14} aria-hidden className="transition-transform duration-300 ease-editorial group-hover/cta:translate-x-1" />
        </Link>
      </article>
    </Rise>
  );
}

/**
 * THE EARLY-ACCESS NOTE — a flat band on a brand's page before launch: when members get in (with its own countdown), or — for a brand without early access — a plain
 * promise to say when the doors open. Notify me either way. After launch it is gone.
 */
export function EarlyAccessNote({ launch }: { launch: BrandLaunch }) {
  const time = useLaunchTime();
  if (isLaunched(launch, time)) return null;
  const early = earlyAtMs(launch);
  const open = early !== null && time >= early;
  const when = early !== null ? ist(early) : null;
  return (
    <Section tone="sand" aria-labelledby="early-h">
      <Grid className="items-end gap-y-10">
        <Col span={{ base: 4, sm: 12, lg: 7 }}>
          <Rise as="p" y={14} className="eyebrow mb-5 text-ink-2">
            {early !== null ? "Early access" : "Be first to know"}
          </Rise>
          <RevealText as="h2" className="display-md">
            <span id="early-h">
              {early === null ? (
                <>
                  We’ll tell you the moment {launch.brand.name} <em>opens.</em>
                </>
              ) : open ? (
                <>
                  Early access is <em>open</em> to members now.
                </>
              ) : (
                <>
                  Members open the doors at {when ? clockShort(when) : ""} on {longDate(early)}.
                </>
              )}
            </span>
          </RevealText>
          <Rise as="p" delay={120} className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">
            {early !== null
              ? `Members can shop the whole ${launch.brand.name} debut before the public launch on ${longDate(launchAtMs(launch))}. Tell us where to reach you and we’ll message you when each door opens — one message each.`
              : `${launch.brand.name} launches on ${longDate(launchAtMs(launch))}. Tell us where to reach you and we’ll message you the moment it is open.`}
          </Rise>
          <Rise delay={200} className="mt-8">
            <NotifyButton launch={launch} />
          </Rise>
        </Col>
        {early !== null && !open && (
          <Col span={{ base: 4, sm: 12, lg: 4 }} start={{ lg: 9 }}>
            <Rise delay={160}>
              <p className="mb-5 text-[13px] text-ink-2">Early access opens in</p>
              <Countdown launch={launch} at={early} noun="early access" className="[--cd-max:3.25rem]" liveContent={<span className="eyebrow block">Open to members now</span>} />
            </Rise>
          </Col>
        )}
      </Grid>
    </Section>
  );
}
