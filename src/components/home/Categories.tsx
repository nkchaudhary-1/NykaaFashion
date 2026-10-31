"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { Rise } from "@/components/motion/reveal";
import { Img } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CATEGORY_TILES } from "@/data/home-content";
import { productsInCategory } from "@/data/queries";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { FINE_POINTER, heroImg, inStock, pad2, styles, useMedia, WIDE_SCREEN } from "./kit";

/*
 * Shop by category as an index: oversized names with a numeral and the style count, and — from 1024px — one large sticky 4:5 picture on the right that cross-fades to
 * the category under the pointer. The same links serve every input: the pointer (hover), the keyboard (focus moves the picture too) and touch screens at 1024px+
 * (the row in the middle of the screen drives the picture). Phones and tablets get picture tiles instead of rows.
 */
export function CategoryTiles() {
  const tiles = CATEGORY_TILES.map((t) => {
    const pool = inStock(t.cat.flatMap((c) => productsInCategory(c)));
    return { ...t, img: heroImg(pool.sort((a, b) => a.rank - b.rank)[0]), n: pool.length };
  });
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false); // other rows only dim once somebody has pointed at one
  const [armed, setArmed] = useState(false); // the sticky picture's other seven pictures are only requested once the list is close to the screen
  const wide = useMedia(WIDE_SCREEN);
  const fine = useMedia(FINE_POINTER);
  const list = useRef<HTMLOListElement>(null);

  // touch screens at 1024px+: the row crossing the middle of the screen shows its picture
  useEffect(() => {
    if (!wide || fine) return;
    const rows = list.current?.querySelectorAll<HTMLElement>("[data-row]");
    if (!rows?.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.row));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, [wide, fine]);

  useEffect(() => {
    const el = list.current;
    if (!wide || !el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setArmed(true), io.disconnect()), { rootMargin: "300px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [wide]);

  const point = (i: number) => () => {
    setActive(i);
    setEngaged(true);
  };
  const on = tiles[active];

  return (
    <Section tone="paper">
      <SectionHeading eyebrow="Shop by category" title={<>What are you <em>looking for?</em></>} size="lg" />
      <Grid className="mt-12 gap-y-10 sm:mt-16">
        <Col span={{ base: 4, sm: 12, lg: 7 }}>
          <ol ref={list} className="grid-main gap-y-10 lg:block" onMouseLeave={() => setEngaged(false)}>
            {tiles.map((t, i) => (
              <Rise as="li" key={t.id} delay={(i % 2) * 70} className="col-span-2 sm:col-span-3 lg:col-auto">
                <Link
                  href={t.href}
                  data-row={i}
                  onClick={() => track("home_module_click", { moduleType: "categories", via: t.id })}
                  onMouseEnter={point(i)}
                  onFocus={point(i)}
                  onBlur={() => setEngaged(false)}
                  className="group block lg:border-t lg:border-ink lg:py-5"
                >
                  {/* tiles below 1024px */}
                  <span className="block overflow-hidden bg-sand lg:hidden">
                    <Img imgKey={t.img} alt="" sizes="(min-width:600px) 25vw, 50vw" ratio="4/5" imgClassName="transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.04]" />
                  </span>
                  <span className="mt-3 flex items-baseline justify-between gap-3 lg:mt-0 lg:grid lg:grid-cols-7 lg:gap-x-[var(--gap)]">
                    <span aria-hidden className="eyebrow hidden tabular-nums text-ink-3 lg:col-span-1 lg:block">
                      {pad2(i + 1)}
                    </span>
                    <span className={cn("min-w-0 text-[17px] font-medium leading-tight tracking-[-0.02em] transition-colors duration-500 ease-editorial lg:col-span-4 lg:display-lg", engaged && i !== active ? "text-ink-3" : "text-ink")}>{t.name}</span>{" "}
                    <span className="flex shrink-0 items-center gap-2 text-[13px] text-ink-3 lg:col-span-2 lg:justify-self-end">
                      {styles(t.n)}
                      <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden className="hidden transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 lg:block" />
                    </span>
                  </span>
                </Link>
              </Rise>
            ))}
          </ol>
        </Col>

        {/* the sticky picture (≥1024px): every category stacked, the active one is shown */}
        <Col span={{ lg: 5 }} start={{ lg: 8 }} rowStart={{ lg: 1 }} className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-offset)+1.5rem)] transition-[top] duration-500 ease-expo">
            <Link href={on.href} aria-hidden tabIndex={-1} data-cursor="View" onClick={() => track("home_module_click", { moduleType: "categories", via: on.id })} className="relative block aspect-[4/5] overflow-hidden bg-sand">
              {tiles.map((t, i) => (
                (i === 0 || armed) && <span key={t.id} data-nogrid className={cn("absolute inset-0 block transition-[opacity,transform] duration-[1100ms] ease-expo", i === active ? "scale-100 opacity-100" : "scale-[1.06] opacity-0")}>
                  <Img imgKey={t.img} alt="" sizes="(min-width:1024px) 38vw, 1px" ratio="fill" className="absolute inset-0 h-full w-full" />
                </span>
              ))}
            </Link>
            <p aria-hidden className="eyebrow mt-4 flex items-center justify-between text-ink-3">
              <span className="tabular-nums">
                {pad2(active + 1)} / {pad2(tiles.length)}
              </span>
              <span>{on.name}</span>
            </p>
          </div>
        </Col>
      </Grid>
    </Section>
  );
}
