"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { Rise } from "@/components/motion/reveal";
import { Img } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RECENT_DAYS, launchAtMs, type BrandLaunch } from "@/data/launches";
import { cn } from "@/lib/cn";
import { shopHref, shortDate } from "./time";
import { Wordmark } from "./Wordmark";

/**
 * RECENTLY LAUNCHED — brands that have just joined, as an asymmetric mosaic: the newest as a tall portrait on the left (7 columns), the next ones stacked beside it on a
 * narrower column that starts lower (up to three), and — when the stack is three high — a numeral under the portrait that fills the space the shorter column leaves. Any
 * further brands follow in a row. Each tile: the brand, "Joined Nykaa Fashion · 3 Oct", one line about it and Shop now (the brand's page on the site for a label that is
 * already in the catalogue, otherwise its launch page).
 */
export function RecentlyLaunched({ items }: { items: BrandLaunch[] }) {
  if (!items.length) return null;
  const [lead, ...rest] = items;
  const stack = rest.slice(0, 3);
  const more = rest.slice(3);
  return (
    <Section tone="bone" id="recent" aria-labelledby="recent-h" className="scroll-mt-24 border-t border-line">
      <SectionHeading
        eyebrow="Recently launched"
        title={
          <span id="recent-h">
            Just <em>arrived.</em>
          </span>
        }
        size="lg"
        intro="Brands that have joined Nykaa Fashion in the last few months — all on sale now."
      />
      <Grid className="mt-12 gap-y-14 sm:mt-16 lg:items-start">
        <Col span={{ base: 4, sm: 12, lg: stack.length ? 7 : 12 }} start={{ lg: 1 }} rowStart={{ lg: 1 }}>
          <Tile launch={lead} variant={stack.length ? "lead" : "solo"} />
          {stack.length === 3 && (
            <Rise className="mt-14 hidden border-t border-ink pt-6 lg:block">
              <p className="flex items-baseline gap-5">
                <span className="font-medium leading-[0.8] tracking-[-0.06em] tabular-nums [font-size:clamp(4.5rem,8vw,8rem)]">{items.length}</span>
                <span className="max-w-[24ch] text-[15px] leading-snug text-ink-2">
                  {items.length === 1 ? "brand has" : "brands have"} joined Nykaa Fashion in the last {RECENT_DAYS} days.
                </span>
              </p>
              <Link href="/brands" className="link-u tap mt-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]">
                All brands <ArrowRight size={14} aria-hidden />
              </Link>
            </Rise>
          )}
        </Col>
        {stack.length > 0 && (
          <Col span={{ base: 4, sm: 12, lg: 4 }} start={{ lg: 9 }} rowStart={{ lg: 1 }} className="grid gap-y-14 sm:grid-cols-2 sm:gap-x-[var(--gap)] lg:grid-cols-1 lg:pt-24">
            {stack.map((l) => (
              <Tile key={l.id} launch={l} variant="stack" />
            ))}
          </Col>
        )}
      </Grid>
      {more.length > 0 && (
        <Grid as="ul" className="mt-14 gap-y-12 border-t border-line pt-10 sm:mt-20">
          {more.map((l) => (
            <Col as="li" key={l.id} span={{ base: 4, sm: 6, lg: 4 }}>
              <Tile launch={l} variant="stack" />
            </Col>
          ))}
        </Grid>
      )}
    </Section>
  );
}

function Tile({ launch, variant }: { launch: BrandLaunch; variant: "lead" | "solo" | "stack" }) {
  const shop = shopHref(launch);
  const lead = variant !== "stack";
  return (
    <Rise>
      <article className="group">
        <Link href={shop.href} aria-hidden tabIndex={-1} data-cursor="View" className="block overflow-hidden bg-sand">
          <span data-nogrid className="block transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.03] group-focus-within:scale-[1.03]">
            {variant === "lead" ? (
              <>
                {/* portrait on phones and from 1024px (where it is the tall left half of the mosaic), landscape in between */}
                <Img imgKey={launch.images.hero.tall} alt="" sizes="(min-width:1024px) 58vw, 100vw" ratio="4/5" className="sm:hidden lg:block" />
                <Img imgKey={launch.images.hero.wide} alt="" sizes="(min-width:1024px) 1px, 100vw" ratio="16/9" position="62% 38%" className="hidden sm:block lg:hidden" />
              </>
            ) : variant === "solo" ? (
              <>
                <Img imgKey={launch.images.hero.tall} alt="" sizes="(min-width:600px) 1px, 100vw" ratio="4/5" className="sm:hidden" />
                <Img imgKey={launch.images.hero.wide} alt="" sizes="(min-width:600px) 100vw, 1px" ratio="21/9" position="62% 38%" className="hidden sm:block" />
              </>
            ) : (
              <Img imgKey={launch.images.hero.wide} alt="" sizes="(min-width:1024px) 33vw, (min-width:600px) 50vw, 100vw" ratio="3/2" position="62% 38%" />
            )}
          </span>
        </Link>
        <div className={cn("mt-5 flex flex-col", lead && "lg:mt-7")}>
          <p className="eyebrow text-ink-3">Joined Nykaa Fashion · {shortDate(launchAtMs(launch))}</p>
          <h3 className="mt-4">
            <Wordmark launch={launch} className={lead ? "text-[1.75rem] sm:text-[2.25rem]" : "text-[1.375rem] sm:text-[1.5rem]"} />
          </h3>
          <p className={cn("mt-3 max-w-[40ch] leading-snug text-ink-2", lead ? "text-[16px]" : "text-[14.5px]")}>{launch.brand.tagline}</p>
          <Link href={shop.href} className="link-u tap group/cta mt-5 inline-flex items-center gap-2 self-start text-[12px] font-semibold uppercase tracking-[0.09em]">
            Shop now
            <span className="sr-only"> {launch.brand.name}</span>
            <ArrowRight size={14} aria-hidden className="transition-transform duration-300 ease-editorial group-hover/cta:translate-x-1" />
          </Link>
        </div>
      </article>
    </Rise>
  );
}
