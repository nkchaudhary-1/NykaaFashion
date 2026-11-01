"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Col } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { Parallax } from "@/components/motion/Parallax";
import { RevealText, Rise } from "@/components/motion/reveal";
import { LinkButton } from "@/components/ui/Button";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { Img } from "@/components/ui/Img";
import { DIWALI_TILES } from "@/data/home-content";
import { photo } from "@/data/placeholders";
import { searchProducts } from "@/lib/search";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";
import { cn } from "@/lib/cn";
import { heroImg, lum, maxOff, pad2, styles, useMedia, wallOf, WIDE_SCREEN } from "./kit";

/*
 * Build Diwali wardrobe: a full-bleed feature (a full screen high on desktop) whose picture drifts against the scroll, the title at poster scale on the calm wall,
 * then a rail of the curated searches, three to a view. The picture is mirrored so its dark, warm blur is on the right (under the copy, in white type) and the figure with the lamp
 * on the left. Its own picture: a woman lighting a diya, from the owner's set (scripts/figma).
 */
const BAND = photo("diwali-band", "16x9-copy-left");

export function DiwaliWardrobe() {
  const wide = useMedia(WIDE_SCREEN); // the drift stays inside the overscan of the frame, which is shorter below 1024px
  const tiles = DIWALI_TILES.map((t) => {
    const r = searchProducts(t.q).results.filter((p) => !p.soldOut);
    return { ...t, img: heroImg(r[0]), n: r.length, off: maxOff(r), href: `/search?q=${encodeURIComponent(t.q)}` };
  }).filter((t) => t.n > 0);
  const wall = wallOf(BAND);
  const onDark = lum(wall) < 0.28; // the copy sits on the picture from 1024 px (white type when it is dark); below that, on a paper panel
  return (
    <>
      <div className="bg-sand lg:grid lg:min-h-[100svh]" style={{ backgroundColor: wall }}>
        <Parallax className="aspect-[4/5] sm:aspect-[16/10] lg:col-start-1 lg:row-start-1 lg:aspect-auto" amount={wide ? 52 : 26} scale={1.16}>
          <Img imgKey={BAND} alt="A woman in a marigold and maroon kurta holding a lit brass diya" sizes="100vw" ratio="fill" position="100% 40%" className="h-full w-full -scale-x-100" />
        </Parallax>
        <div className="relative z-10 bg-paper lg:pointer-events-none lg:col-start-1 lg:row-start-1 lg:bg-transparent">
          <div className="container-x py-12 [--fs:clamp(3rem,13vw,5rem)] sm:py-16 lg:grid-main lg:h-full lg:items-center lg:py-24 lg:[--fs:clamp(3.25rem,7.2vw,7.75rem)]">
            <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 7 }} rowStart={{ lg: 1 }} className={cn("lg:pointer-events-auto", onDark && "lg:text-white")}>
              <Rise as="p" y={14} className="eyebrow">
                Diwali edit
              </Rise>
              <RevealText as="h2" delay={80} className="display-xl mt-4 [&_em]:text-inherit lg:mt-5" style={{ fontSize: "var(--fs)", maxWidth: "5.8em" }}>
                Build Diwali <em>wardrobe</em>
              </RevealText>
              <Rise as="p" delay={380} className={cn("mt-5 max-w-[40ch] text-pretty text-[16px] leading-relaxed text-ink-2 lg:mt-7", onDark && "lg:text-white")}>
                Seasonal picks, curated by what you will actually wear — start with the feature look, then fill in the rest.
              </Rise>
              <Rise delay={480} className="mt-6 lg:mt-8">
                <LinkButton href="/edits/festive" size="lg" iconRight={<ArrowRight size={16} />} className={onDark ? "lg:bg-bone lg:text-ink lg:hover:bg-white lg:hover:text-ink" : undefined} onClick={() => signal("edit_open", { editId: "festive" })}>
                  Shop festive
                </LinkButton>
              </Rise>
            </Col>
          </div>
        </div>
      </div>

      <Section tone="paper">
        <Carousel>
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <Rise as="p" y={14} className="eyebrow text-ink-3">
                Seasonal picks
              </Rise>
              <RevealText as="h3" className="display-md mt-4 max-w-[18em]">
                Start with one piece you love, then build around it.
              </RevealText>
            </div>
            <CarouselArrows className="shrink-0" />
          </div>
          <div className="mt-10 sm:mt-14">
            <CarouselTrack label="Diwali wardrobe" density="wide">
              {tiles.map((t, i) => (
                <Link key={t.q} href={t.href} onClick={() => track("home_module_click", { moduleType: "diwali", via: t.q })} className="group block">
                  <span className="block overflow-hidden bg-sand">
                    <Img imgKey={t.img} alt="" sizes="(min-width:1024px) 33vw, (min-width:600px) 45vw, 85vw" ratio="4/5" imgClassName="transition-transform duration-[1400ms] ease-expo group-hover:scale-[1.04] group-focus-visible:scale-[1.04]" />
                  </span>
                  <span className="mt-4 flex items-baseline justify-between gap-4">
                    <span className="display-sm block min-w-0">{t.title}</span>{" "}
                    <span aria-hidden className="eyebrow shrink-0 tabular-nums text-ink-3">
                      {pad2(i + 1)}
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[13px] text-ink-3">{t.off > 0 ? <span className="font-semibold text-emerald">Up to {t.off}% off</span> : styles(t.n)}</span>
                </Link>
              ))}
            </CarouselTrack>
          </div>
        </Carousel>
      </Section>
    </>
  );
}
