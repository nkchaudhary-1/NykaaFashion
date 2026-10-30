"use client";
import { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { Disclosure } from "@/components/ui/Disclosure";
import { Img, SIZES } from "@/components/ui/Img";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { products } from "@/data/catalog";
import { labelById } from "@/data/labels";
import { CATEGORY_TILES, CELEBRATION_TILES, DIWALI_TILES, ICONIC_BRANDS, PRICE_TILES, SEO_BLOCKS } from "@/data/home-content";
import { photo } from "@/data/placeholders";
import { productsByLabel, productsInCategory } from "@/data/queries";
import type { Product } from "@/data/types";
import { imgEdge, imgSrc } from "@/lib/img";
import { searchProducts } from "@/lib/search";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";

const inStock = (list: Product[]) => list.filter((p) => !p.soldOut);
const hero = (p: Product | undefined) => p?.variants[0].images[0] ?? "scenes/cat-women";
const maxOff = (list: Product[]) => list.reduce((m, p) => Math.max(m, p.discount), 0);
const styles = (n: number) => `${n} ${n === 1 ? "style" : "styles"}`;

// ── Sale banner: three slides, copy on the calm left wall of the photograph ──────────────────────────────────
interface Slide {
  id: string;
  kicker: string;
  title: string;
  dek: string;
  cta: { label: string; href: string };
  cta2?: { label: string; href: string };
  wide: string;
  tall: string;
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
      },
      {
        id: "festive",
        kicker: "Festive & wedding",
        title: "Diwali-ready, head to toe",
        dek: "Kurta sets, zari, jhumkas and evening heels — everything for the celebrations ahead.",
        cta: { label: "Shop festive", href: "/edits/festive" },
        wide: "scenes/edit-festive-wide",
        tall: "scenes/edit-festive-tall",
      },
      {
        id: "new",
        kicker: "New arrivals",
        title: "The co-ord edit",
        dek: "Tailored sets, soft knits and clean basics for the new season.",
        cta: { label: "Shop new in", href: "/edits/new-in" },
        wide: photo("boucle-suit", "16x9-copy-left"),
        tall: photo("boucle-suit", "4x5"),
      },
    ];
  }, []);
}

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

function SlideBody({ s, active, first }: { s: Slide; active: boolean; first: boolean }) {
  const H = first ? "h1" : "h2"; // one h1 per page: the first banner carries it
  const wall = imgEdge(s.wide)?.wall[0] ?? "#f4f4f6";
  const onDark = lum(wall) < 0.28;
  const alt = `${s.title} — ${s.kicker}`;
  const wide = getImageProps({ src: imgSrc(s.wide), alt, fill: true, sizes: "100vw", loading: first ? "eager" : "lazy" });
  const tall = getImageProps({ src: imgSrc(s.tall), alt, fill: true, sizes: "100vw", loading: first ? "eager" : "lazy", fetchPriority: first ? "high" : undefined });
  const { srcSet: wideSet } = wide.props;
  const { srcSet: tallSet, ...imgProps } = tall.props;
  const text = onDark ? "text-white" : "text-ink";
  const copy = (
    <div className={text}>
      <p className="eyebrow">{s.kicker}</p>
      <H className="display-lg mt-4 [&_em]:text-inherit">{s.title}</H>
      <p className={`mt-5 max-w-[40ch] text-[16px] leading-relaxed ${onDark ? "text-white" : "text-ink-2"}`}>{s.dek}</p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <LinkButton href={s.cta.href} size="lg" iconRight={<ArrowRight size={16} />} onClick={() => track("home_module_click", { moduleType: "hero", via: s.id })}>
          {s.cta.label}
        </LinkButton>
        {s.cta2 && (
          <LinkButton href={s.cta2.href} variant={onDark ? "outline-light" : "secondary"} size="lg">
            {s.cta2.label}
          </LinkButton>
        )}
      </div>
    </div>
  );
  return (
    <div className="lg:absolute lg:inset-0" style={{ "--wall": wall } as CSSProperties}>
      <div className="relative aspect-[4/5] w-full sm:aspect-video lg:absolute lg:inset-0 lg:aspect-auto" style={{ backgroundColor: wall }}>
        <picture>
          <source media="(min-width: 600px)" srcSet={wideSet} sizes="100vw" />
          <img {...imgProps} srcSet={tallSet} alt={alt} className="object-cover lg:[object-position:50%_40%]" />
        </picture>
      </div>
      <div className="pointer-events-none hidden lg:absolute lg:inset-0 lg:block">
        <div className="container-x grid-main h-full items-center">
          <Col span={{ lg: 5 }} className="pointer-events-auto">
            {copy}
          </Col>
        </div>
      </div>
      <div className="bg-pink-tint lg:hidden">
        <div className="container-x py-8 sm:py-10">
          <div className="max-w-[560px] [&_.eyebrow]:text-pink-ink">
            <p className="eyebrow text-pink-ink">{s.kicker}</p>
            <H className="display-md mt-3 [&_em]:text-inherit">{s.title}</H>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{s.dek}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <LinkButton href={s.cta.href} size="lg" iconRight={<ArrowRight size={16} />} tabIndex={active ? 0 : -1}>
                {s.cta.label}
              </LinkButton>
              {s.cta2 && (
                <LinkButton href={s.cta2.href} variant="secondary" size="lg" tabIndex={active ? 0 : -1}>
                  {s.cta2.label}
                </LinkButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Full-bleed banner carousel: arrows, dots, a pause control (auto-advance stops on interaction and with reduced motion). */
export function SaleHero() {
  const slides = useSlides();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hover, setHover] = useState(false);
  const reduced = useRef(false);
  const go = useCallback((n: number) => setI((n + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setPlaying(false);
  }, []);
  useEffect(() => {
    if (!playing || hover) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [playing, hover, slides.length]);

  const ctl = "inline-flex size-11 items-center justify-center border border-ink bg-white text-ink transition-colors hover:bg-ink hover:text-white";
  return (
    <section aria-roledescription="carousel" aria-label="Featured offers" className="relative bg-sand" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocusCapture={() => setPlaying(false)}>
      <div className="relative mx-auto lg:h-[min(46vw,80vh,720px)] lg:min-h-[480px] lg:max-w-[1920px] lg:overflow-hidden">
        {slides.map((s, n) => (
          <div
            key={s.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${n + 1} of ${slides.length}`}
            aria-hidden={n !== i}
            // inert keeps off-screen slides out of the tab order and the accessibility tree
            {...(n !== i ? { inert: true } : {})}
            className={n === i ? "relative z-10 opacity-100 transition-opacity duration-500 lg:absolute lg:inset-0" : "absolute inset-x-0 top-0 z-0 opacity-0 transition-opacity duration-500 lg:inset-0"}
          >
            <SlideBody s={s} active={n === i} first={n === 0} />
          </div>
        ))}
        {/* controls sit on the container grid: arrows right, dots + pause left */}
        <div className="container-x pointer-events-none absolute inset-x-0 bottom-4 z-20 hidden items-center justify-between lg:flex">
          <div className="pointer-events-auto flex items-center gap-2">
            {slides.map((s, n) => (
              <button key={s.id} type="button" aria-label={`Show banner ${n + 1} of ${slides.length}`} aria-current={n === i} onClick={() => (setPlaying(false), go(n))} className="tap inline-flex h-11 items-center">
                <span className={`block h-1 transition-all ${n === i ? "w-10 bg-ink" : "w-5 bg-ink/35 hover:bg-ink/60"}`} />
              </button>
            ))}
            <button type="button" aria-label={playing ? "Pause banner rotation" : "Resume banner rotation"} onClick={() => setPlaying((p) => !p)} className={`${ctl} ml-2`}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
          <div className="pointer-events-auto flex gap-2">
            <button type="button" aria-label="Previous banner" onClick={() => (setPlaying(false), go(i - 1))} className={ctl}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" aria-label="Next banner" onClick={() => (setPlaying(false), go(i + 1))} className={ctl}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      {/* phones & tablets: dots under the copy panel */}
      <div className="container-x flex items-center gap-2 bg-pink-tint pb-5 lg:hidden">
        {slides.map((s, n) => (
          <button key={s.id} type="button" aria-label={`Show banner ${n + 1} of ${slides.length}`} aria-current={n === i} onClick={() => (setPlaying(false), go(n))} className="tap inline-flex h-11 items-center">
            <span className={`block h-1 transition-all ${n === i ? "w-10 bg-pink" : "w-5 bg-pink/30"}`} />
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Price shortcuts: flat pink tiles right under the banner ───────────────────────────────────────────────
export function PriceStrip() {
  const tiles = PRICE_TILES.map((t) => ({ ...t, n: products.filter((p) => !p.soldOut && (t.filter.maxPrice === undefined || p.price <= t.filter.maxPrice) && (t.filter.minDiscount === undefined || p.discount >= t.filter.minDiscount)).length }));
  return (
    <Section y="none" className="border-b border-line py-6 sm:py-8">
      <ul className="grid grid-cols-2 gap-[var(--gap)] sm:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} onClick={() => (signal("discount_interaction"), track("home_module_click", { moduleType: "price-strip", via: t.label }))} className="group flex h-full min-h-[84px] items-center justify-between gap-3 bg-pink-tint px-4 py-3 transition-colors hover:bg-pink hover:text-white sm:px-5">
              <span>
                <span className="block text-[17px] font-bold leading-tight tracking-[-0.01em]">{t.label}</span>
                <span className="mt-1 block text-[12.5px] text-ink-2 group-hover:text-white">{styles(t.n)}</span>
              </span>
              <ArrowRight size={18} aria-hidden className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ── Shop by category: ten live tiles (eight with stock here) in a 6-up carousel ───────────────────────────────
export function CategoryTiles() {
  const tiles = CATEGORY_TILES.map((t) => {
    const pool = inStock(t.cat.flatMap((c) => productsInCategory(c)));
    return { ...t, img: hero(pool.sort((a, b) => a.rank - b.rank)[0]), n: pool.length };
  });
  return (
    <Section y="sm">
      <Carousel>
        <SectionHeading eyebrow="Shop by category" title={<>What are you <em>looking for?</em></>}>
          <CarouselArrows />
        </SectionHeading>
        <div className="mt-8">
          <CarouselTrack label="Shop by category" density="tile">
            {tiles.map((t) => (
              <Link key={t.id} href={t.href} onClick={() => track("home_module_click", { moduleType: "categories", via: t.id })} className="group block">
                <div className="overflow-hidden bg-sand">
                  <Img imgKey={t.img} alt="" sizes={SIZES.tile} ratio="4/5" className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.04]" />
                </div>
                <p className="mt-3 text-[15px] font-semibold leading-tight">{t.name}</p>
                <p className="mt-1 text-[12.5px] text-ink-3">{styles(t.n)}</p>
              </Link>
            ))}
          </CarouselTrack>
        </div>
      </Carousel>
    </Section>
  );
}

// ── Celebration-ready Categories: occasion + offers deep links, four portrait tiles ───────────────────────────
export function CelebrationTiles() {
  const tiles = CELEBRATION_TILES.map((t) => {
    const pool = inStock(productsInCategory(t.cat).filter((p) => p.tags.includes(t.occ)));
    return { ...t, img: hero(pool.sort((a, b) => b.discount - a.discount || a.rank - b.rank)[0]), n: pool.length, off: maxOff(pool) };
  });
  return (
    <Section tone="sand" y="md">
      <SectionHeading eyebrow="For the occasion" title={<>Celebration-ready <em>categories</em></>} intro="Pre-filtered by occasion — straight to the pieces that suit it." />
      <Grid as="ul" className="mt-10 gap-y-[var(--gap)] sm:mt-12">
        {tiles.map((t, i) => (
          <Col as="li" key={t.title} span={{ base: 2, sm: 6, lg: 3 }}>
            <Reveal delay={(i % 4) * 70}>
              <Link href={t.href} onClick={() => track("home_module_click", { moduleType: "celebration", via: t.title })} className="group block bg-white">
                <div className="overflow-hidden bg-sand">
                  <Img imgKey={t.img} alt="" sizes={SIZES.cardWide} ratio="3/4" className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.03]" />
                </div>
                <div className="flex flex-col items-start gap-2 p-4 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold leading-tight">{t.title}</p>
                    <p className="mt-1 text-[12.5px] text-ink-3">{styles(t.n)}</p>
                  </div>
                  {t.off > 0 && <span className="shrink-0 text-[12px] font-bold uppercase tracking-[0.04em] text-pink-ink">Up to {t.off}% off</span>}
                </div>
              </Link>
            </Reveal>
          </Col>
        ))}
      </Grid>
    </Section>
  );
}

// ── Iconic Brands, Unreal Savings: a brand wall — typographic tiles stamped with the real discount ─────────────
export function IconicBrands() {
  const tiles = ICONIC_BRANDS.map((id) => {
    const label = labelById[id];
    const list = inStock(productsByLabel(id));
    return { id, name: label.name, hon: !!label.flags.houseOfNykaa, n: list.length, off: maxOff(list) };
  });
  return (
    <Section>
      <SectionHeading eyebrow="Brands" title={<>Iconic brands, <em>unreal savings</em></>} href="/brands" hrefLabel="All brands" />
      <Grid as="ul" className="mt-10 gap-y-[var(--gap)] sm:mt-12">
        {tiles.map((t, i) => (
          <Col as="li" key={t.id} span={{ base: 2, sm: 6, lg: 3 }}>
            <Reveal delay={(i % 4) * 60} className="h-full">
              <Link href={`/brands/${t.id}`} onClick={() => (signal("discount_interaction"), track("home_module_click", { moduleType: "brands", via: t.id }))} className={`group flex aspect-[4/3] h-full flex-col justify-between p-5 transition-colors sm:aspect-[16/10] lg:aspect-[4/3] ${t.hon ? "bg-pink-tint hover:bg-pink-soft" : "bg-sand hover:bg-stone"}`}>
                <span className="block">
                  <span className="block text-[clamp(1.125rem,2.1vw,1.75rem)] font-bold leading-[1.05] tracking-[-0.03em]">{t.name}</span>
                  {t.hon && <span className="mt-2 inline-block bg-pink px-2 py-1 text-[9.5px] font-bold uppercase leading-none tracking-[0.1em] text-white">House of Nykaa</span>}
                </span>
                <span>
                  <span className="block text-[13px] font-bold uppercase tracking-[0.05em] text-pink-ink">{t.off > 0 ? `Up to ${t.off}% off` : "New arrivals"}</span>
                  <span className="mt-1.5 flex items-center justify-between text-[12.5px] text-ink-2">
                    {styles(t.n)} <ArrowRight size={16} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            </Reveal>
          </Col>
        ))}
      </Grid>
    </Section>
  );
}

// ── Build Diwali wardrobe: a photographic feature (4 columns) + eight curated filter tiles (2 × 4 on 8 columns) ─
export function DiwaliWardrobe() {
  const tiles = DIWALI_TILES.map((t) => {
    const r = searchProducts(t.q).results.filter((p) => !p.soldOut);
    return { ...t, img: hero(r[0]), n: r.length, off: maxOff(r), href: `/search?q=${encodeURIComponent(t.q)}` };
  }).filter((t) => t.n > 0);
  return (
    <Section tone="pink-tint">
      <SectionHeading eyebrow="Diwali edit" title={<>Build Diwali <em>wardrobe</em></>} intro="Seasonal picks, curated by what you will actually wear — start with the feature look, then fill in the rest." href="/edits/festive" hrefLabel="Shop festive" />
      <Grid className="mt-10 gap-y-[var(--gap)] sm:mt-12">
        <Col span={{ base: 4, sm: 12, lg: 4 }} className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-auto">
          <Link href="/edits/festive" onClick={() => signal("edit_open", { editId: "festive" })} className="group absolute inset-0 block overflow-hidden bg-white">
            <Img imgKey={photo("kurta-set", "3x4")} alt="Festive look — printed kurta set with dupatta" sizes={SIZES.half} ratio="fill" position="50% 30%" className="absolute inset-0 h-full transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.03]" />
            <span className="absolute inset-x-0 bottom-0 flex min-h-16 items-center justify-between gap-3 bg-white px-4 py-3 transition-colors group-hover:bg-pink group-hover:text-white sm:px-6">
              <span>
                <span className="block text-[18px] font-bold leading-tight">The festive edit</span>
                <span className="block text-[12.5px] opacity-80">Kurta sets, dupattas, jewellery</span>
              </span>
              <ArrowRight size={20} aria-hidden />
            </span>
          </Link>
        </Col>
        <Col span={{ base: 4, sm: 12, lg: 8 }}>
          <ul className="grid grid-cols-2 gap-x-[var(--gap)] gap-y-[var(--gap)] sm:grid-cols-4">
            {tiles.slice(0, 8).map((t) => (
              <li key={t.q}>
                <Link href={t.href} onClick={() => track("home_module_click", { moduleType: "diwali", via: t.q })} className="group block bg-white">
                  <div className="overflow-hidden bg-sand">
                    <Img imgKey={t.img} alt="" sizes="(min-width:1024px) 14vw, (min-width:600px) 22vw, 44vw" ratio="1/1" className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.04]" />
                  </div>
                  <div className="p-3">
                    <p className="text-[14px] font-semibold leading-tight">{t.title}</p>
                    <p className="mt-1 text-[12px] text-ink-3">{t.off > 0 ? <span className="font-semibold text-pink-ink">Up to {t.off}% off</span> : styles(t.n)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Col>
      </Grid>
    </Section>
  );
}

// ── The long SEO copy of the live homepage, as a tidy two-column accordion ───────────────────────────────────
export function SeoBlocks() {
  return (
    <Section tone="sand" y="sm">
      <h2 className="eyebrow text-ink">More about Nykaa Fashion</h2>
      <div className="mt-6 grid gap-x-[var(--gap)] sm:grid-cols-2 lg:gap-x-[calc(var(--gap)*2)]">
        {[SEO_BLOCKS.slice(0, 3), SEO_BLOCKS.slice(3)].map((col, c) => (
          <div key={c} className="border-t border-line-strong">
            {col.map((b) => (
              <Disclosure key={b.title} title={<span className="text-[15px] font-semibold">{b.title}</span>} headingLevel={3}>
                <p className="max-w-[62ch] pb-2 text-[14px] leading-relaxed text-ink-2">{b.body}</p>
              </Disclosure>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}
