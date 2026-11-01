"use client";
import { getImageProps } from "next/image";
import { ArrowDown, ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { lum, wallOf } from "@/components/home/kit";
import { RevealText, Rise } from "@/components/motion/reveal";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { earlyAtMs, isLaunched, launchAtMs, type BrandLaunch } from "@/data/launches";
import { imgSrc } from "@/lib/img";
import { useLaunchTime } from "./clock";
import { Countdown } from "./Countdown";
import { headlineNodes } from "./headline";
import { NotifyButton } from "./Notify";
import { dateTimeLine, longDate, longestLine, offerEndMs, offerState, plainHeadline, shopHref, whenShort } from "./time";
import { Wordmark } from "./Wordmark";

/*
 * The featured-launch banner — the first screen of /new-and-next and of every brand's launch page.
 *
 * ≥1280px: one full-bleed picture (at least the screen under the header) with the copy laid on its calm wall at the left, where no figure reaches (the campaign pictures put
 * the subject right of centre): the brand, the eyebrow, the headline (sized from its own longest line, so any campaign headline fits five columns), the dek, the date with
 * the buttons, then the date with the large countdown beneath them. Below 1280px the picture comes first (4:5 on phones, 16:9 from 600px) and the same blocks follow on a flat
 * panel — in two columns from 1024px. One DOM copy of the text, so the page has one h1: the hub's is its eyebrow ("New & Next · …"), a brand page's is the headline.
 *
 * Everything switches on `isLaunched(launch, time)`: before launch the date, the countdown and "Notify me"; from launch "Now live", the offers' end date and "Shop now".
 * The picture is the page's LCP element: eager, high priority, never hidden — `.settle` eases it in on a layer inside the clipped frame.
 */
function BannerPicture({ launch }: { launch: BrandLaunch }) {
  const { wide, tall } = launch.images.hero;
  const alt = `${launch.brand.name} — ${plainHeadline(launch.headline)}`;
  const w = getImageProps({ src: imgSrc(wide), alt, fill: true, sizes: "100vw", loading: "eager" });
  const t = getImageProps({ src: imgSrc(tall), alt, fill: true, sizes: "100vw", loading: "eager", fetchPriority: "high" });
  // a password-protected deployment serves /img directly (next.config.ts): no srcSet then, so fall back to the plain URL
  const wideSet = w.props.srcSet ?? w.props.src;
  const { srcSet: tallSet, ...imgProps } = t.props;
  return (
    <picture>
      <source media="(min-width: 600px)" srcSet={wideSet} sizes="100vw" />
      {/* art direction (4:5 on phones, 16:9 from 600px) that next/image's single <Image> cannot express */}
      <img {...imgProps} srcSet={tallSet} alt={alt} className="object-cover" style={{ ...imgProps.style, objectPosition: "50% 38%" }} />
    </picture>
  );
}

/** What the eyebrow says: the authored line before launch, "Now live · category" after. */
export function stateEyebrow(launch: BrandLaunch, live: boolean) {
  if (!live) return launch.eyebrow ?? `Coming soon · ${launch.brand.category}`;
  return launch.eyebrow?.startsWith("Now") ? launch.eyebrow : `Now live · ${launch.brand.category}`;
}

function liveNote(l: BrandLaunch, time: number): string {
  const live = l.offers.filter((o) => offerState(l, o, time) === "live");
  const ends = live.map((o) => offerEndMs(l, o)).filter((e): e is number => e !== null);
  if (ends.length) return `Launch offers on until ${longDate(Math.min(...ends))}.`;
  return live.length ? "Launch offers are on now." : "Now on Nykaa Fashion.";
}

export function LaunchBanner({ launch, as }: { launch: BrandLaunch; as: "hub" | "page" }) {
  const time = useLaunchTime();
  const live = isLaunched(launch, time);
  const at = launchAtMs(launch);
  const early = earlyAtMs(launch);
  const wall = wallOf(launch.images.hero.wide);
  const shop = shopHref(launch, as === "page");
  // the secondary link goes to the preview before launch (when there is one), otherwise to the offers (when there are any)
  const more = !live && launch.previews.length > 0 ? { href: "#preview", label: "Preview the range" } : launch.offers.length > 0 ? { href: "#offers", label: "See the offers" } : null;
  const fit = longestLine(launch.headline, plainHeadline(launch.headline).length > 34 ? 3 : 2);
  const hub = as === "hub";
  const eyebrow = stateEyebrow(launch, live);
  // the wall's own colour decides between dark and light type on top of it (as the home hero does); the flat panel under the picture below 1280px is always light
  const dark = lum(wall) < 0.28;

  return (
    <section aria-label={hub ? "Featured launch" : `${launch.brand.name} launch`} className="relative" style={{ backgroundColor: wall }}>
      <div className="relative mx-auto xl:grid xl:min-h-[clamp(620px,calc(100svh-var(--header-h)),1000px)] xl:max-h-[75vw] xl:max-w-[1920px] xl:overflow-hidden">
        {/* the campaign picture */}
        <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-video xl:col-start-1 xl:row-start-1 xl:aspect-auto" style={{ backgroundColor: wall }}>
          <div data-nogrid className="settle absolute inset-0">
            <BannerPicture launch={launch} />
          </div>
        </div>

        {/* the copy: a flat panel under the picture, laid on its calm wall from 1280px */}
        <div className="relative bg-bone xl:col-start-1 xl:row-start-1 xl:bg-transparent">
          <div className={cn("container-x grid-main gap-y-7 pb-10 pt-8 text-ink sm:pb-14 sm:pt-10 xl:h-full xl:grid-rows-[auto_auto_auto_1fr] xl:content-start xl:gap-y-0 xl:pb-[clamp(2rem,3.4vw,3.75rem)] xl:pt-[clamp(2.25rem,4.2vw,4.75rem)]", dark && "xl:text-white")}>
            {/* brand, eyebrow, headline */}
            <div className="col-span-4 min-w-0 sm:col-span-12 lg:col-span-7 xl:col-span-5 xl:row-start-1">
              <Rise y={14}>
                <Wordmark launch={launch} className="text-[1.5rem] sm:text-[1.75rem] xl:text-[1.875rem]" />
              </Rise>
              <Rise as={hub ? "h1" : "p"} y={14} delay={60} className="eyebrow mt-4 text-ink-2 xl:mt-5 xl:text-inherit">
                {hub ? (
                  <>
                    New &amp; Next<span aria-hidden> · </span>
                    <span className="sr-only">: </span>
                    {eyebrow}
                  </>
                ) : (
                  eyebrow
                )}
              </Rise>
              <div className="mt-5 [container-type:inline-size] xl:mt-6">
                <RevealText
                  as={hub ? "h2" : "h1"}
                  delay={120}
                  className={cn("display-xl [--em-color:var(--color-pink-ink)] [--fs:clamp(2.75rem,12vw,4.5rem)] sm:[--fs:clamp(3.5rem,9.5vw,6.5rem)] xl:[--fs:clamp(3.25rem,7.2vw,7.75rem)]", dark && "xl:[--em-color:var(--color-pink-soft)]")}
                  style={{ fontSize: "min(var(--fs), calc(100cqw / (var(--fit) * 0.48)))", "--fit": fit } as CSSProperties}
                >
                  {headlineNodes(launch.headline)}
                </RevealText>
              </div>
            </div>

            {/* the announcement */}
            <div className="col-span-4 min-w-0 sm:col-span-12 lg:col-span-7 xl:col-span-4 xl:row-start-2 xl:mt-6">
              <Rise as="p" delay={380} className="max-w-[44ch] text-pretty text-[16px] leading-relaxed text-ink-2 xl:max-w-[min(36ch,calc(28vw-var(--edge)-1.5rem))] xl:text-inherit">
                {launch.dek}
              </Rise>
            </div>

            {/* the date and the countdown (under the buttons, on the wall, at 1280px+: the campaign pictures put the subject on the right) */}
            <div className="col-span-4 min-w-0 sm:col-span-12 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 xl:col-span-5 xl:col-start-1 xl:row-span-1 xl:row-start-4 xl:mt-10 xl:w-[min(100%,25rem)] xl:self-start xl:justify-self-start">
              <Rise delay={200}>
                <p className="text-[15px] font-medium sm:text-[16px]">{live ? `Launched ${dateTimeLine(at)}` : dateTimeLine(at)}</p>
                <p className="mt-1 min-h-[1.4em] text-[13px] text-ink-2 xl:text-inherit">{!live && early !== null ? `Members shop early — from ${whenShort(early)}` : launch.brand.origin ? `From ${launch.brand.origin} · ${launch.brand.category}` : launch.brand.category}</p>
                <Countdown
                  launch={launch}
                  className="mt-6 [--cd-max:3.75rem] sm:[--cd-max:5rem] xl:mt-7 xl:[--cd-max:5.25rem]"
                  liveContent={
                    <>
                      <span className="eyebrow block">Open to everyone</span>
                      <span className="mt-3 block font-medium leading-[0.9] tracking-[-0.05em]" style={{ fontSize: "var(--cd-fs)" }}>
                        Live now
                      </span>
                      <span className="mt-4 block text-[14px] text-ink-2 xl:text-inherit">{liveNote(launch, time)}</span>
                    </>
                  }
                />
              </Rise>
            </div>

            {/* what to do */}
            <div className="col-span-4 min-w-0 sm:col-span-12 lg:col-span-7 lg:col-start-1 lg:row-start-3 xl:col-span-4 xl:row-start-3 xl:mt-8">
              {/* not a scroll reveal: on a short screen these buttons sit at the fold, where the observer would leave them hidden until the page moved */}
              <div className="flex animate-fade-in flex-wrap items-center gap-x-7 gap-y-3 min-[1280px]:max-[1439px]:flex-col min-[1280px]:max-[1439px]:items-start" style={{ animationDelay: "480ms" }}>
                {live ? (
                  <LinkButton href={shop.href} size="lg" iconRight={<ArrowRight size={16} aria-hidden />} className={cn(dark && "xl:bg-bone xl:text-ink xl:hover:bg-white")}>
                    {shop.label}
                  </LinkButton>
                ) : (
                  <NotifyButton launch={launch} className={cn(dark && "xl:bg-bone xl:text-ink xl:hover:bg-white")} />
                )}
                {more && (
                  <a href={more.href} className="link-u tap inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]">
                    {more.label}
                    <ArrowDown size={14} aria-hidden />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

