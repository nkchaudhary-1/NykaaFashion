"use client";
import { getImageProps } from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { Marquee } from "@/components/motion/Marquee";
import { RevealText, Rise } from "@/components/motion/reveal";
import { LinkButton } from "@/components/ui/Button";
import { products } from "@/data/catalog";
import { HOME_STATEMENT, HOME_TICKER } from "@/data/home-content";
import { photo } from "@/data/placeholders";
import { cn } from "@/lib/cn";
import { imgSrc } from "@/lib/img";
import { track } from "@/lib/track";
import { lum, maxOff, pad2, REDUCED_MOTION, useMedia, wallOf } from "./kit";

/*
 * The first screen. Three full-bleed pictures cross-fade; the active one settles into place (.settle). On desktop the picture fills the screen under the
 * header (min(100svh − header, 1000px), never under 600px) and the headline is set at poster scale on the calm wall of the photograph, top-left, so it never
 * crosses the figure. Below 1024px the picture comes first and the copy sits on a flat panel under it.
 * A big rolling index ("01 / 03") and three thin segments double as the auto-advance timer: the active segment fills over SLIDE_MS, pausing holds it.
 * The first slide's picture is the LCP element: eager, high priority, never hidden. Pictures of the other slides mount once the page has settled.
 */
const SLIDE_MS = 7000;

interface Slide {
  id: string;
  kicker: string;
  title: string;
  dek: string;
  cta: { label: string; href: string };
  cta2?: { label: string; href: string };
  wide: string;
  tall: string;
  /** object-position of the wide picture in the desktop frame */
  pos: string;
  /** width of the headline block in em, so each title breaks into two even lines */
  maxEm: number;
  /** headline size relative to the hero size (the shortest headline can be set larger) */
  scale: number;
  /** the picture has objects at the left edge of its calm wall: keep the supporting line narrow enough to stop before them */
  narrow?: boolean;
}

function useSlides(): Slide[] {
  return useMemo(() => {
    const best = maxOff(products);
    return [
      {
        id: "sale",
        kicker: "The season sale",
        title: `Up to ${best}% off`,
        dek: "Fresh markdowns on westernwear, indianwear, footwear and more — across every department.",
        cta: { label: "Shop the sale", href: "/offers" },
        cta2: { label: "Under ₹1,999", href: "/edits/under-1500" },
        wide: photo("kurta-set", "16x9-copy-left"),
        tall: photo("kurta-set", "4x5"),
        pos: "50% 40%",
        maxEm: 3.9,
        scale: 1.2,
      },
      {
        id: "festive",
        kicker: "Festive & wedding",
        title: "Diwali-ready, head to toe",
        dek: "Kurta sets, zari, jhumkas and evening heels — everything for the celebrations ahead.",
        cta: { label: "Shop festive", href: "/edits/festive" },
        wide: "scenes/edit-festive-wide",
        tall: "scenes/edit-festive-tall",
        pos: "50% 100%",
        maxEm: 5.4,
        scale: 0.92,
        narrow: true,
      },
      {
        id: "new",
        kicker: "New arrivals",
        title: "The co-ord edit",
        dek: "Tailored sets, soft knits and clean basics for the new season.",
        cta: { label: "Shop new in", href: "/edits/new-in" },
        wide: photo("boucle-suit", "16x9-copy-left"),
        tall: photo("boucle-suit", "4x5"),
        pos: "50% 40%",
        maxEm: 4.6,
        scale: 1.1,
      },
    ];
  }, []);
}

function SlidePicture({ s, first }: { s: Slide; first: boolean }) {
  const alt = `${s.title} — ${s.kicker}`;
  const wide = getImageProps({ src: imgSrc(s.wide), alt, fill: true, sizes: "100vw", loading: first ? "eager" : "lazy" });
  const tall = getImageProps({ src: imgSrc(s.tall), alt, fill: true, sizes: "100vw", loading: first ? "eager" : "lazy", fetchPriority: first ? "high" : undefined });
  const { srcSet: wideSet } = wide.props;
  const { srcSet: tallSet, ...imgProps } = tall.props;
  return (
    <picture>
      <source media="(min-width: 600px)" srcSet={wideSet} sizes="100vw" />
      {/* a plain <img> inside <picture>: art direction (4:5 on phones, 16:9 from 600px) that next/image's single <Image> cannot express */}
      <img {...imgProps} srcSet={tallSet} alt={alt} className="object-cover" style={{ ...imgProps.style, objectPosition: s.pos }} />
    </picture>
  );
}

/** One slide: the picture (settles when the slide becomes active) and its copy. The copy is remounted when its slide is re-entered, so the headline rises again. */
function SlideBody({ s, active, first, ready, epoch }: { s: Slide; active: boolean; first: boolean; ready: boolean; epoch: number }) {
  const H = first ? "h1" : "h2"; // one h1 per page: the first banner carries it
  const wall = wallOf(s.wide);
  const onDark = lum(wall) < 0.28;
  return (
    <div className="relative lg:h-full" style={{ "--wall": wall } as CSSProperties}>
      <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-video lg:absolute lg:inset-0 lg:aspect-auto" style={{ backgroundColor: wall }}>
        <div data-nogrid className={cn("absolute inset-0", active && "settle")}>
          {(first || ready || active) && <SlidePicture s={s} first={first} />}
        </div>
      </div>
      {/* copy: a flat panel under the picture on phones and tablets, an overlay on the calm wall from 1024px */}
      <div className="bg-bone lg:pointer-events-none lg:absolute lg:inset-0 lg:bg-transparent">
        <div className="container-x py-8 [--hero-fs:clamp(2.75rem,11vw,4.75rem)] sm:py-10 lg:grid-main lg:h-full lg:items-start lg:py-0 lg:pt-[clamp(2.5rem,5.2vw,5.5rem)] lg:[--hero-fs:clamp(3.25rem,7.2vw,7.75rem)]">
          <Col key={epoch} span={{ base: 4, sm: 12, lg: 6 }} className={cn("lg:pointer-events-auto", onDark ? "lg:text-white" : "text-ink")}>
            <Rise as="p" y={14} className="eyebrow" suppressHydrationWarning>
              {s.kicker}
            </Rise>
            <RevealText as={H} delay={80} suppressHydrationWarning className="display-xl mt-4 [&_em]:text-inherit lg:mt-5" style={{ fontSize: `calc(var(--hero-fs) * ${s.scale})`, maxWidth: `${s.maxEm}em` }}>
              {s.title}
            </RevealText>
            <Rise as="p" delay={420} suppressHydrationWarning className={cn("mt-5 max-w-[38ch] text-pretty text-[16px] leading-relaxed lg:mt-7", s.narrow && "lg:max-w-[min(38ch,calc(28vw-4rem))]", onDark ? "lg:text-white" : "text-ink-2")}>
              {s.dek}
            </Rise>
            <Rise delay={520} suppressHydrationWarning className="mt-6 flex flex-wrap items-center gap-3 lg:mt-8">
              <LinkButton href={s.cta.href} size="lg" iconRight={<ArrowRight size={16} />} onClick={() => track("home_module_click", { moduleType: "hero", via: s.id })}>
                {s.cta.label}
              </LinkButton>
              {s.cta2 && (
                <LinkButton href={s.cta2.href} variant={onDark ? "outline-light" : "secondary"} size="lg">
                  {s.cta2.label}
                </LinkButton>
              )}
            </Rise>
          </Col>
        </div>
      </div>
    </div>
  );
}

/** "01 / 03": the digits roll upwards inside a one-line mask. Decorative — each slide is already labelled "n of N". */
function HeroIndex({ i, total }: { i: number; total: number }) {
  return (
    <p aria-hidden className="flex items-baseline gap-2 tabular-nums">
      <span className="block h-[1em] overflow-hidden text-[clamp(2rem,3.4vw,3.25rem)] font-medium leading-none tracking-[-0.04em]">
        <span className="flex flex-col transition-transform duration-[900ms] ease-expo" style={{ transform: `translateY(${(-i * 100) / total}%)` }}>
          {Array.from({ length: total }, (_, n) => (
            <span key={n} className="block h-[1em]">
              {pad2(n + 1)}
            </span>
          ))}
        </span>
      </span>
      <span className="hidden whitespace-nowrap text-[13px] font-medium tracking-[0.08em] text-ink-2 sm:inline">/ {pad2(total)}</span>
    </p>
  );
}

/** Full-bleed banner carousel: arrows, segmented progress, a pause control. Auto-advance stops on keyboard focus, on interaction, and with reduced motion. */
export function SaleHero() {
  const slides = useSlides();
  const total = slides.length;
  const reduced = useMedia(REDUCED_MOTION);
  const [i, setI] = useState(0);
  const [epoch, setEpoch] = useState<number[]>(() => slides.map(() => 0));
  // what the visitor asked for; until they ask, the banner rotates unless they prefer reduced motion
  const [intent, setIntent] = useState<"auto" | "play" | "pause">("auto");
  const playing = intent === "play" || (intent === "auto" && !reduced);
  const [hover, setHover] = useState(false);
  const [onScreen, setOnScreen] = useState(true); // a banner nobody can see does not rotate
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLElement>(null);
  const bars = useRef<Array<HTMLSpanElement | null>>([]);
  const timer = useRef<Animation | null>(null);

  const go = useCallback(
    (n: number) => {
      const next = (n + total) % total;
      if (next === i) return;
      setI(next);
      setEpoch((e) => e.map((v, k) => (k === next ? v + 1 : v)));
    },
    [i, total],
  );

  // the other slides' pictures wait until the first one has had the network to itself
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 1400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // one Web Animation per slide: it fills the active segment and, when it finishes, moves on
  useEffect(() => {
    const el = bars.current[i];
    if (!el) return;
    const a = el.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: SLIDE_MS, easing: "linear", fill: "both" });
    a.pause();
    a.onfinish = () => go(i + 1);
    timer.current = a;
    return () => {
      a.onfinish = null;
      a.cancel();
      if (timer.current === a) timer.current = null;
    };
  }, [i, go]);
  useEffect(() => {
    const a = timer.current;
    if (!a) return;
    if (playing && !hover && onScreen) a.play();
    else a.pause();
  }, [i, playing, hover, onScreen, go]);

  const stop = (n: number) => () => {
    setIntent("pause");
    go(n);
  };
  const ctl = "pointer-events-auto inline-flex size-11 items-center justify-center border border-ink bg-transparent text-ink transition-colors duration-300 hover:bg-ink hover:text-bone";

  return (
    <>
      <section
        ref={root}
        aria-roledescription="carousel"
        aria-label="Featured offers"
        className="relative bg-sand"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        // keyboard focus anywhere in the banner stops the rotation (a mouse click on the pause button must not)
        onFocusCapture={(e: FocusEvent) => e.target.matches(":focus-visible") && setIntent("pause")}
      >
        <div className="relative mx-auto lg:h-[clamp(600px,calc(100svh-var(--header-h)-2.25rem),1000px)] lg:max-h-[75vw] lg:max-w-[1920px] lg:overflow-hidden">
          <div className="grid lg:block lg:h-full">
            {slides.map((s, n) => (
              <div
                key={s.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${n + 1} of ${total}`}
                aria-hidden={n !== i ? true : undefined}
                // inert keeps off-screen slides out of the tab order and the accessibility tree
                {...(n !== i ? { inert: true } : {})}
                className={cn("col-start-1 row-start-1 transition-opacity duration-[900ms] ease-expo lg:absolute lg:inset-0", n === i ? "opacity-100" : "pointer-events-none opacity-0")}
              >
                <SlideBody s={s} active={n === i} first={n === 0} ready={ready} epoch={epoch[n]} />
              </div>
            ))}
          </div>

          {/* controls: on the container grid at the foot of the picture on desktop, in the flow under the copy panel below 1024px */}
          <div className="bg-bone lg:pointer-events-none lg:absolute lg:inset-x-0 lg:bottom-0 lg:bg-transparent">
            <div className="container-x flex items-center justify-between gap-4 pb-6 pt-1 lg:pb-7 lg:pt-0">
              <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                <HeroIndex i={i} total={total} />
                <div className="pointer-events-auto flex items-center">
                  {slides.map((s, n) => (
                    <button key={s.id} type="button" aria-label={`Show banner ${n + 1} of ${total}`} aria-current={n === i} onClick={stop(n)} className="tap group inline-flex h-11 w-9 items-center px-1 sm:w-16">
                      <span className="relative block h-px w-full bg-ink-3 transition-colors group-hover:bg-ink">
                        <span
                          ref={(el) => {
                            bars.current[n] = el;
                          }}
                          className={cn("absolute -top-px left-0 block h-[3px] w-full origin-left bg-ink", n !== i && "invisible")}
                          style={{ transform: n === i && !playing ? "scaleX(1)" : "scaleX(0)" }}
                        />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" aria-label={playing ? "Pause banner rotation" : "Resume banner rotation"} onClick={() => setIntent(playing ? "pause" : "play")} className={ctl}>
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button type="button" aria-label="Previous banner" onClick={stop(i - 1)} className={ctl}>
                  <ChevronLeft size={18} />
                </button>
                <button type="button" aria-label="Next banner" onClick={stop(i + 1)} className={ctl}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Ticker />
      <Statement />
    </>
  );
}

/** A slow ticker of the destinations on the site. Pure decoration (the same words are links further down), so it is hidden from assistive tech and holds no links. */
function Ticker() {
  return (
    <div aria-hidden className="border-y border-line bg-bone py-5 sm:py-7">
      <Marquee seconds={60} gap="2.75rem" className="display-md">
        {HOME_TICKER.map((w) => (
          <span key={w} className="flex shrink-0 items-center gap-[2.75rem] whitespace-nowrap">
            {w}
            <span className="block size-2 shrink-0 rotate-45 bg-ink" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}

/** One honest paragraph at display size, on the page colour. */
function Statement() {
  const { eyebrow, before, accent, after } = HOME_STATEMENT;
  return (
    <Section tone="bone" y="md" className="border-b border-line">
      <Grid className="gap-y-6">
        <Col span={{ base: 4, sm: 12, lg: 3 }} className="lg:pt-3">
          <Rise as="p" y={14} className="eyebrow text-ink-3" suppressHydrationWarning>
            {eyebrow}
          </Rise>
        </Col>
        <Col span={{ base: 4, sm: 12, lg: 9 }}>
          <RevealText as="p" className="display-lg" suppressHydrationWarning>
            {before}
            <em>{accent}</em>
            {after}
          </RevealText>
        </Col>
      </Grid>
    </Section>
  );
}
