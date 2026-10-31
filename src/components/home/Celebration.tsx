"use client";
import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { Img } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CELEBRATION_TILES } from "@/data/home-content";
import { productsInCategory } from "@/data/queries";
import { track } from "@/lib/track";
import { heroImg, inStock, maxOff, pad2, styles } from "./kit";

/*
 * Celebration-ready categories: a large drag rail. Two tall 3:4 pictures per view on desktop (six columns each), the mouse follower turns into a "Drag" disc over the
 * rail, and a big numeral sits under each picture beside its title. The rail is a focusable scroll region (arrow keys) and swipes on touch.
 */
export function CelebrationTiles() {
  const tiles = CELEBRATION_TILES.map((t) => {
    const pool = inStock(productsInCategory(t.cat).filter((p) => p.tags.includes(t.occ)));
    return { ...t, img: heroImg(pool.sort((a, b) => b.discount - a.discount || a.rank - b.rank)[0]), n: pool.length, off: maxOff(pool) };
  });
  return (
    <Section tone="sand">
      <Carousel>
        <SectionHeading eyebrow="For the occasion" title={<>Celebration-ready <em>categories</em></>} intro="Pre-filtered by occasion — straight to the pieces that suit it." size="lg">
          <CarouselArrows />
        </SectionHeading>
        <div className="mt-12 sm:mt-16">
          <CarouselTrack label="Celebration-ready categories" density="feature" cursor="Drag">
            {tiles.map((t, i) => (
              <Link key={t.title} href={t.href} onClick={() => track("home_module_click", { moduleType: "celebration", via: t.title })} className="group block">
                <span className="block overflow-hidden bg-stone">
                  <Img imgKey={t.img} alt="" sizes="(min-width:1024px) 50vw, (min-width:600px) 62vw, 90vw" ratio="3/4" imgClassName="transition-transform duration-[1400ms] ease-expo group-hover:scale-[1.04] group-focus-visible:scale-[1.04]" />
                </span>
                <span className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-5 sm:mt-6 lg:grid-cols-6 lg:gap-x-[var(--gap)]">
                  <span aria-hidden className="display-lg block leading-[0.8] tabular-nums lg:col-span-2">
                    {pad2(i + 1)}
                  </span>
                  <span className="block min-w-0 lg:col-span-4">
                    <span className="display-sm block">{t.title}</span>{" "}
                    <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-3">
                      {styles(t.n)}
                      {t.off > 0 && <span className="font-semibold text-emerald">Up to {t.off}% off</span>}
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </CarouselTrack>
        </div>
      </Carousel>
    </Section>
  );
}
