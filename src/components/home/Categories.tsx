"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Section } from "@/components/layout/Section";
import { Rise } from "@/components/motion/reveal";
import { Img } from "@/components/ui/Img";
import { Overlay, OverlayBody, OverlayHeader } from "@/components/ui/Overlay";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { categories, categoryById, topCategories } from "@/data/categories";
import { SHOP_BY_CATEGORY } from "@/data/home-content";
import { productsInCategory } from "@/data/queries";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { heroImg, inStock, maxOff, styles } from "./kit";

/*
 * Shop by category, on the second fold: a grid of picture tiles — six across from 1280px, four from 1024, three from 600, two on phones — each a real category of the
 * catalogue with its department, its name, "Up to X% off" (the deepest discount in it) and "Shop now". The last tile opens the full list in a dialog (a bottom sheet on
 * phones): every category by department, so nothing is behind a menu. On phones the grid shows five categories and that tile, so the list is one tap away.
 */

interface Tile {
  id: string;
  dept: string;
  name: string;
  href: string;
  img: string;
  n: number;
  off: number;
}

const SHOWN = SHOP_BY_CATEGORY.length; // the tiles before the "all categories" one
const ON_PHONE = 5; // categories a phone shows before the "all categories" tile

const tileClass = "col-span-2 sm:col-span-4 lg:col-span-3 xl:col-span-2";
const cta = "mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.09em] text-ink";

export function CategoryTiles() {
  const [open, setOpen] = useState(false);
  const tiles: Tile[] = useMemo(
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
    <Section tone="paper">
      <SectionHeading eyebrow="Women · Men · Kids · Home" title={<>Shop by <em>category</em></>} size="lg">
        <button type="button" onClick={openAll} aria-haspopup="dialog" className="link-u tap group inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em] text-ink">
          View all {total} categories
          <ArrowRight size={15} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
        </button>
      </SectionHeading>

      <ul data-category-grid className="mt-10 grid-main gap-y-10 sm:mt-14">
        {tiles.map((t, i) => (
          <Rise as="li" key={t.id} delay={(i % 6) * 60} className={cn(tileClass, i >= ON_PHONE && "hidden sm:block")}>
            <Link href={t.href} onClick={() => track("home_module_click", { moduleType: "categories", via: t.id })} className="group block">
              <span className="block overflow-hidden bg-sand">
                <Img imgKey={t.img} alt="" sizes="(min-width:1280px) 16vw, (min-width:1024px) 24vw, (min-width:600px) 31vw, 47vw" ratio="4/5" load={i < 6 ? "eager" : undefined} imgClassName="transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.04] group-focus-visible:scale-[1.04]" />
              </span>
              <span className="mt-4 block">
                <span className="eyebrow block text-ink-3">{t.dept}</span>
                <span className="mt-1 block text-[17px] font-medium leading-tight tracking-[-0.02em]">{t.name}</span>
                <span className="mt-1.5 block text-[14px] font-semibold text-emerald">{t.off > 0 ? `Up to ${t.off}% off` : styles(t.n)}</span>
                <span className={cn(cta, "border-b border-transparent pb-0.5 transition-colors duration-300 group-hover:border-ink")}>
                  Shop now <ArrowRight size={14} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
          </Rise>
        ))}

        {/* the last tile: the whole list */}
        <Rise as="li" delay={(SHOWN % 6) * 60} className={tileClass}>
          <button type="button" onClick={openAll} aria-haspopup="dialog" className="group block w-full text-left">
            <span className="flex aspect-[4/5] flex-col justify-between overflow-hidden bg-ink p-5 text-bone">
              <span className="eyebrow">Everything</span>
              <span>
                <span className="display-xl block leading-[0.85] tabular-nums">{total}</span>
                <span className="mt-2 block text-[15px]">categories, {topCategories.length} departments</span>
              </span>
            </span>
            <span className="mt-4 block">
              <span className="eyebrow block text-ink-3">Browse</span>
              <span className="mt-1 block text-[17px] font-medium leading-tight tracking-[-0.02em]">All categories</span>
              <span className="mt-1.5 block text-[14px] text-ink-2">The full list, by department</span>
              <span className={cn(cta, "border-b border-transparent pb-0.5 transition-colors duration-300 group-hover:border-ink")}>
                View all <ArrowRight size={14} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
              </span>
            </span>
          </button>
        </Rise>
      </ul>

      <AllCategories open={open} onClose={() => setOpen(false)} />
    </Section>
  );
}

/** Every category, by department: the pop-up behind "View all categories". */
function AllCategories({ open, onClose }: { open: boolean; onClose: () => void }) {
  const depts = useMemo(
    () =>
      topCategories.map((d) => {
        const kids = categories.filter((c) => c.parent === d.id).map((c) => ({ ...c, n: inStock(productsInCategory(c.id)).length }));
        return { ...d, kids, n: kids.reduce((s, c) => s + c.n, 0) };
      }),
    [],
  );
  const total = depts.reduce((s, d) => s + d.kids.length, 0);
  const go = (via: string) => () => {
    track("home_module_click", { moduleType: "categories", via });
    onClose();
  };
  return (
    <Overlay open={open} onClose={onClose} label="All categories" side="center" panelClassName="sm:w-[min(94vw,1040px)]">
      <OverlayHeader title="All categories" sub={`${total} categories across ${depts.length} departments`} />
      <OverlayBody>
        <div className="grid grid-cols-1 gap-x-[var(--gap)] gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {depts.map((d) => (
            <section key={d.id} aria-labelledby={`allcat-${d.id}`}>
              <div className="flex items-baseline justify-between gap-3 border-b border-ink pb-3">
                <h3 id={`allcat-${d.id}`} className="display-xs">
                  <Link href={`/c/${d.id}`} onClick={go(d.id)} className="link-u">
                    {d.id === "home" ? "Home & Living" : d.name}
                  </Link>
                </h3>
                <span className="eyebrow text-ink-3">{styles(d.n)}</span>
              </div>
              <ul>
                {d.kids.map((c) => (
                  <li key={c.id}>
                    <Link href={`/c/${c.id}`} onClick={go(c.id)} className="tap group flex items-baseline justify-between gap-3 border-b border-line py-3 text-[15px] transition-colors hover:text-pink-ink">
                      <span>{c.name}</span>
                      <span className="flex shrink-0 items-center gap-1.5 text-[12px] tabular-nums text-ink-3">
                        {c.n}
                        <ArrowRight size={13} aria-hidden className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={`/c/${d.id}`} onClick={go(d.id)} className="link-u tap mt-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]">
                All {d.id === "home" ? "home & living" : d.name.toLowerCase()} <ArrowRight size={14} aria-hidden />
              </Link>
            </section>
          ))}
        </div>
      </OverlayBody>
    </Overlay>
  );
}
