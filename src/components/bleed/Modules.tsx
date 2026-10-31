"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Fade } from "@/components/motion/reveal";
import { AllCategories } from "@/components/home/Categories";
import { heroImg, inStock, maxOff, pad2, pieces, styles } from "@/components/home/kit";
import { categories, categoryById, topCategories } from "@/data/categories";
import { editById } from "@/data/edits";
import { products } from "@/data/catalog";
import { CELEBRATION_TILES, DIWALI_TILES, ICONIC_BRANDS, PRICE_TILES, SHOP_BY_CATEGORY } from "@/data/home-content";
import { labelById } from "@/data/labels";
import { editProducts, productsByLabel, productsInCategory } from "@/data/queries";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { recentlyViewed } from "@/lib/recs";
import { searchProducts } from "@/lib/search";
import { useStore } from "@/lib/store";
import { track } from "@/lib/track";
import { intentStore, signal } from "@/stores/intent";
import { legibleTone } from "./tone";
import { ProductTile } from "./ProductTile";
import { Flat, Go, PhotoLink, Saving, Tile, Wall, WallHeading } from "./Wall";

/*
 * The full-bleed home modules (docs/BLEED_LAYOUT.md). Each is a heading on the page grid and then a wall — a band of touching tiles from edge to edge of the screen.
 * They show the same real data as their classic counterparts (the same categories, counts and "up to X% off" computed from the catalogue), so switching layout
 * never changes what the page promises, only how it is laid out.
 */

const S = {
  base: "(min-width:1280px) 17vw, (min-width:1024px) 25vw, (min-width:600px) 34vw, 50vw",
  quad: "(min-width:600px) 25vw, 50vw",
  feature: "(min-width:1280px) 34vw, (min-width:1024px) 50vw, (min-width:600px) 67vw, 100vw",
};
const link = "link-u tap group inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em] text-ink";
const band = "pt-12 sm:pt-16";

// ── Shop by category ──────────────────────────────────────────────────────────────────────────────────────
const ON_PHONE = 5; // categories a phone shows before the "all categories" tile (the wall must stay a whole number of rows: 2 across)

export function BleedCategories() {
  const [open, setOpen] = useState(false);
  const tiles = useMemo(
    () =>
      SHOP_BY_CATEGORY.map((id) => {
        const pool = inStock(productsInCategory(id));
        const node = categoryById[id];
        return { id, dept: categoryById[node.parent ?? id]?.name ?? "", name: node.name, href: `/c/${id}`, img: heroImg([...pool].sort((a, b) => a.rank - b.rank)[0]), n: pool.length, off: maxOff(pool) };
      }),
    [],
  );
  const total = categories.filter((c) => c.parent).length;
  const openAll = () => {
    track("home_module_click", { moduleType: "categories", via: "all" });
    setOpen(true);
  };
  return (
    <section id="shop-by-category" className={cn("scroll-mt-[var(--header-offset)] bg-paper", band)}>
      <WallHeading eyebrow="Women · Men · Kids · Home" title={<>Shop by <em>category</em></>}>
        <button type="button" onClick={openAll} aria-haspopup="dialog" className={link}>
          View all {total} categories
          <ArrowRight size={15} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
        </button>
      </WallHeading>
      <div className="mt-8 sm:mt-10">
        <Wall data-category-grid>
          {tiles.map((t, i) => (
            <Tile key={t.id} cell="b" delay={(i % 6) * 40} className={i >= ON_PHONE ? "hidden sm:block" : undefined}>
              <PhotoLink
                href={t.href}
                imgKey={t.img}
                sizes={S.base}
                load={i < 6 ? "eager" : undefined}
                onClick={() => track("home_module_click", { moduleType: "categories", via: t.id })}
                strip={
                  <>
                    <span className="eyebrow block text-ink-3">{t.dept}</span>
                    <span className="mt-0.5 flex items-center justify-between gap-2 text-[15px] font-medium leading-tight tracking-[-0.02em]">
                      <span className="min-w-0 truncate">{t.name}</span>
                      <Go />
                    </span>
                    <span className="mt-0.5 block">
                      <Saving off={t.off} fallback={styles(t.n)} />
                    </span>
                    <span className="sr-only">Shop now</span>
                  </>
                }
              />
            </Tile>
          ))}
          <Tile cell="b" delay={(SHOP_BY_CATEGORY.length % 6) * 40}>
            <button type="button" onClick={openAll} aria-haspopup="dialog" className="on-dark absolute inset-0 flex flex-col justify-between bg-ink p-3.5 text-left text-bone sm:p-4">
              <span className="eyebrow">Everything</span>
              <span className="block">
                <span className="display-xl block leading-[0.85] tabular-nums" style={{ fontSize: "clamp(3.5rem, 9cqw, 8rem)" }}>
                  {total}
                </span>
                <span className="mt-2 block text-[14px]">categories, {topCategories.length} departments</span>
              </span>
              <span className="block">
                <span className="eyebrow block">Browse</span>
                <span className="mt-0.5 flex items-center justify-between gap-2 text-[15px] font-medium tracking-[-0.02em]">
                  All categories <Go />
                </span>
                <span className="block text-[13px]">The full list, by department</span>
              </span>
            </button>
          </Tile>
        </Wall>
      </div>
      <AllCategories open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

// ── Pick up where you left off (returning visitors) ───────────────────────────────────────────────────────
export function BleedTrail() {
  const intent = useStore(intentStore);
  const items = recentlyViewed(intent, 6).slice(0, 5);
  if (items.length < 2) return null;
  return (
    <section aria-label="Pick up where you left off" className={cn("bg-bone", band)}>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Fade as="li" className="relative aspect-[4/5] overflow-hidden bg-ink text-bone">
          <div className="on-dark absolute inset-0 flex flex-col justify-between p-3.5 sm:p-4">
            <p className="eyebrow">Welcome back</p>
            <div>
              <h2 className="display-sm">Pick up where you left off</h2>
              <p className="mt-2 text-[13px]">{pieces(items.length)} you looked at on this device</p>
            </div>
          </div>
        </Fade>
        {items.map((p, i) => (
          <Fade as="li" key={p.id} delay={(i + 1) * 40} className="group/tile relative aspect-[4/5] overflow-hidden bg-sand">
            <ProductTile product={p} sizes={S.base} source="home-trail" />
          </Fade>
        ))}
      </ul>
    </section>
  );
}

// ── Price shortcuts: four flat tiles, the figure at poster scale ──────────────────────────────────────────
const PRICE_COLOURS: Array<{ bg: string; fg: string; light?: boolean }> = [
  { bg: "var(--color-ink)", fg: "var(--color-bone)" },
  { bg: "var(--color-pink)", fg: "var(--color-white)" },
  { bg: "var(--color-marigold)", fg: "var(--color-ink)", light: true },
  { bg: "var(--color-emerald)", fg: "var(--color-white)" },
];

export function BleedPrice() {
  const tiles = PRICE_TILES.map((t) => ({ ...t, n: products.filter((p) => !p.soldOut && (t.filter.maxPrice === undefined || p.price <= t.filter.maxPrice) && (t.filter.minDiscount === undefined || p.discount >= t.filter.minDiscount)).length }));
  return (
    <section aria-labelledby="bleed-price" className={band}>
      <WallHeading eyebrow="Price shortcuts" title={<span id="bleed-price">Shop by <em>price</em></span>} />
      <div className="mt-8 sm:mt-10">
        <Wall>
          {tiles.map((t, i) => {
            const [lead, ...rest] = t.label.split(" "); // "Under ₹1,999" → "Under" + the figure
            const c = PRICE_COLOURS[i % PRICE_COLOURS.length];
            return (
              <Tile key={t.label} cell="s" delay={i * 50}>
                <Flat href={t.href} bg={c.bg} fg={c.fg} light={c.light} onClick={() => (signal("discount_interaction"), track("home_module_click", { moduleType: "price-strip", via: t.label }))}>
                  <span className="flex items-start justify-between gap-3">
                    <span className="eyebrow">{lead}</span>
                    <ArrowUpRight size={20} strokeWidth={1.5} aria-hidden className="shrink-0 transition-transform duration-500 ease-expo group-hover/tile:-translate-y-0.5 group-hover/tile:translate-x-0.5" />
                  </span>{" "}
                  <span className="block">
                    <span className="display-lg block whitespace-nowrap leading-[0.9]" style={{ fontSize: "clamp(2rem, 6.4cqw, 6.5rem)" }}>
                      {rest.join(" ")}
                    </span>{" "}
                    <span className="mt-2 block text-[13px]">{styles(t.n)}</span>
                  </span>
                </Flat>
              </Tile>
            );
          })}
        </Wall>
      </div>
    </section>
  );
}

// ── Celebration-ready categories: four occasion tiles ─────────────────────────────────────────────────────
export function BleedCelebration() {
  const tiles = CELEBRATION_TILES.map((t) => {
    const pool = inStock(productsInCategory(t.cat).filter((p) => p.tags.includes(t.occ)));
    return { ...t, img: heroImg([...pool].sort((a, b) => b.discount - a.discount || a.rank - b.rank)[0]), n: pool.length, off: maxOff(pool) };
  });
  return (
    <section aria-labelledby="bleed-celebration" className={band}>
      <WallHeading eyebrow="For the occasion" title={<span id="bleed-celebration">Celebration-ready <em>categories</em></span>} />
      <div className="mt-8 sm:mt-10">
        <Wall>
          {tiles.map((t, i) => (
            <Tile key={t.title} cell="q" delay={i * 50}>
              <PhotoLink
                href={t.href}
                imgKey={t.img}
                sizes={S.quad}
                onClick={() => track("home_module_click", { moduleType: "celebration", via: t.title })}
                strip={
                  <>
                    <span className="eyebrow block text-ink-3">{pad2(i + 1)}</span>
                    <span className="mt-0.5 flex items-center justify-between gap-2 text-[15px] font-medium leading-tight tracking-[-0.02em] sm:text-[17px]">
                      <span className="min-w-0">{t.title}</span>
                      <Go />
                    </span>
                    <span className="mt-0.5 block text-[13px] text-ink-3">
                      {styles(t.n)}
                      {t.off > 0 && <span className="font-semibold text-emerald"> · Up to {t.off}% off</span>}
                    </span>
                  </>
                }
              />
            </Tile>
          ))}
        </Wall>
      </div>
    </section>
  );
}

// ── Iconic brands: eight flat tiles in each brand's own colours ───────────────────────────────────────────
export function BleedBrands() {
  const rows = ICONIC_BRANDS.map((id) => {
    const label = labelById[id];
    const list = inStock(productsByLabel(id));
    return { id, name: label.name, hon: !!label.flags.houseOfNykaa, tone: legibleTone(label), n: list.length, off: maxOff(list) };
  });
  return (
    <section aria-labelledby="bleed-brands" className={band}>
      <WallHeading eyebrow="Brands" title={<span id="bleed-brands">Iconic brands, <em>unreal savings</em></span>}>
        <Link href="/brands" className={link}>
          All brands <ArrowRight size={15} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
        </Link>
      </WallHeading>
      <div className="mt-8 sm:mt-10">
        <Wall>
          {rows.map((r, i) => (
            <Tile key={r.id} cell="s" delay={i * 40}>
              <Flat href={`/brands/${r.id}`} bg={r.tone.bg} fg={r.tone.fg} onClick={() => (signal("discount_interaction"), track("home_module_click", { moduleType: "brands", via: r.id }))}>
                <span className="flex items-start justify-between gap-3">
                  <span className="eyebrow">{r.hon ? "House of Nykaa" : "Brand"}</span>
                  <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden className="shrink-0 transition-transform duration-500 ease-expo group-hover/tile:-translate-y-0.5 group-hover/tile:translate-x-0.5" />
                </span>{" "}
                <span className="block">
                  <span className="display-md block leading-[0.95]" style={{ fontSize: "clamp(1.5rem, 4.4cqw, 3.5rem)" }}>
                    {r.name}
                  </span>{" "}
                  <span className="mt-2 block text-[13px] font-semibold">{r.off > 0 ? `Up to ${r.off}% off` : "New arrivals"}</span>
                </span>
              </Flat>
            </Tile>
          ))}
        </Wall>
      </div>
    </section>
  );
}

// ── Build Diwali wardrobe: eight curated searches as flat tiles ───────────────────────────────────────────
const DIWALI_COLOURS: Array<{ bg: string; fg: string; light?: boolean }> = [
  { bg: "var(--color-marigold)", fg: "var(--color-ink)", light: true },
  { bg: "var(--color-festive)", fg: "var(--color-white)" },
  { bg: "var(--color-ink)", fg: "var(--color-bone)" },
  { bg: "var(--color-sand)", fg: "var(--color-ink)", light: true },
];

export function BleedDiwali() {
  const tiles = useMemo(
    () =>
      DIWALI_TILES.map((t) => {
        const r = searchProducts(t.q).results.filter((p) => !p.soldOut);
        return { ...t, n: r.length, off: maxOff(r), href: `/search?q=${encodeURIComponent(t.q)}` };
      }).filter((t) => t.n > 0),
    [],
  );
  const even = tiles.length - (tiles.length % 4); // whole rows of four, so the band is a complete rectangle
  return (
    <section aria-labelledby="bleed-diwali" className={band}>
      <WallHeading eyebrow="Diwali edit" title={<span id="bleed-diwali">Build Diwali <em>wardrobe</em></span>}>
        <Link href="/edits/festive" onClick={() => signal("edit_open", { editId: "festive" })} className={link}>
          Shop festive <ArrowRight size={15} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
        </Link>
      </WallHeading>
      <div className="mt-8 sm:mt-10">
        <Wall>
          {tiles.slice(0, even).map((t, i) => {
            const c = DIWALI_COLOURS[(i + Math.floor(i / 4)) % DIWALI_COLOURS.length];
            return (
              <Tile key={t.q} cell="s" delay={(i % 4) * 40}>
                <Flat href={t.href} bg={c.bg} fg={c.fg} light={c.light} onClick={() => track("home_module_click", { moduleType: "diwali", via: t.q })}>
                  <span className="flex items-start justify-between gap-3">
                    <span className="eyebrow tabular-nums">{pad2(i + 1)}</span>
                    <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden className="shrink-0 transition-transform duration-500 ease-expo group-hover/tile:-translate-y-0.5 group-hover/tile:translate-x-0.5" />
                  </span>{" "}
                  <span className="block">
                    <span className="display-md block leading-[0.95]" style={{ fontSize: "clamp(1.5rem, 4.2cqw, 3.25rem)" }}>
                      {t.title}
                    </span>{" "}
                    <span className="mt-2 block text-[13px] font-semibold">{t.off > 0 ? `Up to ${t.off}% off` : styles(t.n)}</span>
                  </span>
                </Flat>
              </Tile>
            );
          })}
        </Wall>
      </div>
    </section>
  );
}

// ── Product walls ─────────────────────────────────────────────────────────────────────────────────────────
/** New in: twelve products, newest first, leaning to the visitor's taste once there are signals. */
export function BleedNewIn({ personalised }: { personalised: boolean }) {
  const intent = useStore(intentStore);
  const list = useMemo(() => {
    const taste = (p: Product) => (personalised ? (intent.weights.label[p.labelId] ?? 0) * 1.2 + (intent.weights.category[p.categoryPath.slice(0, 2).join("/")] ?? 0) : 0);
    return [...products]
      .filter((p) => !p.soldOut)
      .sort((a, b) => Number(b.isNew) * 3 + taste(b) - (Number(a.isNew) * 3 + taste(a)) || a.rank - b.rank)
      .slice(0, 12);
  }, [personalised, intent]);
  return (
    <section aria-labelledby="bleed-newin" className={band}>
      <WallHeading eyebrow={personalised ? "New in · by your taste" : "New in · editors’ picks"} title={<span id="bleed-newin">Just <em>landed</em></span>}>
        <Link href="/edits/new-in" className={link}>
          All new in <ArrowRight size={15} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
        </Link>
      </WallHeading>
      <div className="mt-8 sm:mt-10">
        <Wall>
          {list.map((p, i) => (
            <Tile key={p.id} cell="b" delay={(i % 6) * 40}>
              <ProductTile product={p} sizes={S.base} source="home-newin" />
            </Tile>
          ))}
        </Wall>
      </div>
    </section>
  );
}

/** Most wanted: one feature and eight more, one piece from each department in turn. */
export function BleedTrending() {
  const picks = useMemo(() => {
    const used = new Set<string>();
    const out: Product[] = [];
    for (const top of ["women", "men", "home", "women", "kids", "women", "men", "home", "women"]) {
      const p = products.filter((x) => !x.soldOut && x.categoryPath[0] === top && !used.has(x.id)).sort((a, b) => a.rank - b.rank)[0];
      if (p) {
        used.add(p.id);
        out.push(p);
      }
    }
    return out;
  }, []);
  if (picks.length < 9) return null;
  const [feature, ...rest] = picks;
  return (
    <section aria-labelledby="bleed-trending" className={band}>
      <WallHeading eyebrow="Trending now" title={<span id="bleed-trending">Most wanted <em>right now</em></span>} />
      <div className="mt-8 sm:mt-10">
        <Wall>
          <Tile cell="f">
            <ProductTile product={feature} sizes={S.feature} source="home-trending" feature />
          </Tile>
          {rest.map((p, i) => (
            <Tile key={p.id} cell="b" delay={(i % 4) * 40}>
              <ProductTile product={p} sizes={S.base} source="home-trending" />
            </Tile>
          ))}
        </Wall>
      </div>
    </section>
  );
}

// ── Curated destinations: one feature, four pictures and four flat computed edits ─────────────────────────
const EDIT_FLAT: Array<{ id: string; bg: string; fg: string; light?: boolean }> = [
  { id: "new-in", bg: "var(--color-marigold)", fg: "var(--color-ink)", light: true },
  { id: "under-1500", bg: "var(--color-pink)", fg: "var(--color-white)" },
  { id: "under-3000", bg: "var(--color-ink)", fg: "var(--color-bone)" },
  { id: "the-offer-edit", bg: "var(--color-emerald)", fg: "var(--color-white)" },
];

export function BleedEdits() {
  const strip = (id: string, big?: boolean) => {
    const e = editById[id];
    return (
      <>
        <span className="eyebrow block text-ink-3">{pieces(editProducts(e).length)}</span>
        <span className={cn("mt-0.5 flex items-center justify-between gap-2 font-medium leading-tight tracking-[-0.02em]", big ? "text-[22px] sm:text-[28px]" : "text-[15px] sm:text-[17px]")}>
          <span className="min-w-0">{e.title}</span>
          <Go />
        </span>
        {big && <span className="mt-1 block max-w-[46ch] text-[14px] leading-snug text-ink-2">{e.blurb}</span>}
      </>
    );
  };
  const go = (id: string) => () => signal("edit_open", { editId: id });
  return (
    <section aria-labelledby="bleed-edits" className={band}>
      <WallHeading eyebrow="Curated destinations" title={<span id="bleed-edits">Luxe, Hidden Gems <em>&amp; more</em></span>}>
        <Link href="/edits" className={link}>
          All destinations <ArrowRight size={15} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
        </Link>
      </WallHeading>
      <div className="mt-8 sm:mt-10">
        <Wall>
          <Tile cell="f">
            <PhotoLink href="/edits/luxe" imgKey="scenes/edit-luxe-tall" sizes={S.feature} onClick={go("luxe")} strip={strip("luxe", true)} />
          </Tile>
          {["hidden-gems", "responsible", "festive", "house-of-nykaa"].map((id, i) => (
            <Tile key={id} cell="b" delay={i * 40}>
              <PhotoLink href={`/edits/${id}`} imgKey={`scenes/edit-${id}-tall`} sizes={S.base} onClick={go(id)} strip={strip(id)} />
            </Tile>
          ))}
          {EDIT_FLAT.map((c, i) => {
            const e = editById[c.id];
            return (
              <Tile key={c.id} cell="b" delay={i * 40}>
                <Flat href={`/edits/${c.id}`} bg={c.bg} fg={c.fg} light={c.light} onClick={go(c.id)}>
                  <span className="flex items-start justify-between gap-3">
                    <span className="eyebrow">{pieces(editProducts(e).length)}</span>
                    <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden className="shrink-0 transition-transform duration-500 ease-expo group-hover/tile:-translate-y-0.5 group-hover/tile:translate-x-0.5" />
                  </span>{" "}
                  <span className="display-sm block leading-[0.98]" style={{ fontSize: "clamp(1.5rem, 3.6cqw, 2.75rem)" }}>
                    {e.title}
                  </span>
                </Flat>
              </Tile>
            );
          })}
        </Wall>
      </div>
    </section>
  );
}
