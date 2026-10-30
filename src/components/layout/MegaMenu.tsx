"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Img, SIZES } from "@/components/ui/Img";
import { categories } from "@/data/categories";
import { FEATURED_BY_TOP } from "@/data/content";
import { THEMES, computedEdits, primaryEdits } from "@/data/edits";
import { editProducts, productsInCategory } from "@/data/queries";
import { signal } from "@/stores/intent";

const COUNT: Record<string, number> = Object.fromEntries(categories.map((c) => [c.id, productsInCategory(c.id).length]));
const POPULAR_LABELS: Record<string, Array<[string, string]>> = {
  women: [["twenty-dresses", "Twenty Dresses"], ["likha", "Likha"], ["maati-loom", "Maati Loom"], ["pipa-bella", "Pipa Bella"]],
  men: [["northline", "Northline"], ["orsay-and-rao", "Orsay & Rao"], ["kora-kala", "Kora Kala"], ["stride-lab", "Stride Lab"]],
  kids: [["little-orchard", "Little Orchard"]],
  home: [["rangrez-home", "Rangrez Home"], ["mitti-and-co", "Mitti & Co."], ["hearth-and-hue", "Hearth & Hue"]],
};

const link = "link-u inline-flex items-baseline gap-2 py-1.5 text-[14px] text-ink-2 hover:text-ink";

export function CategoryMega({ top, onNavigate }: { top: "women" | "men" | "kids" | "home"; onNavigate: () => void }) {
  const subs = categories.filter((c) => c.parent === top);
  const feat = FEATURED_BY_TOP[top];
  const cols = subs.length > 6 ? 2 : 1;
  const half = Math.ceil(subs.length / cols);
  return (
    <div className="container-x grid grid-cols-[1.35fr_1fr_340px] gap-12 py-9">
      <div>
        <p className="eyebrow mb-4 text-ink-3">Shop {top}</p>
        <div className={cols === 2 ? "grid grid-cols-2 gap-x-8" : ""}>
          {Array.from({ length: cols }).map((_, ci) => (
            <ul key={ci}>
              {subs.slice(ci * half, ci * half + half).map((c) => (
                <li key={c.id}>
                  <Link href={`/c/${c.id}`} onClick={onNavigate} className={link}>
                    {c.name}
                    <span className="text-[11px] tabular-nums text-ink-3">{COUNT[c.id]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
        <Link href={`/c/${top}`} onClick={onNavigate} className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] text-ink link-u">
          Shop all {top} <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 content-start gap-9">
        <div>
          <p className="eyebrow mb-4 text-ink-3">Edits</p>
          <ul>
            {primaryEdits.map((e) => (
              <li key={e.id}>
                <Link href={`/edits/${e.id}`} onClick={onNavigate} className={link}>
                  <span aria-hidden className="size-2 rounded-full" style={{ background: THEMES[e.theme].bg === "#f3dcd6" ? "#e80071" : THEMES[e.theme].bg }} />
                  {e.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/edits/new-in" onClick={onNavigate} className={link}>
                <span aria-hidden className="size-2 rounded-full border border-ink-3" />
                New in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4 text-ink-3">Labels we love</p>
          <ul>
            {(POPULAR_LABELS[top] ?? []).map(([id, name]) => (
              <li key={id}>
                <Link href={`/brands/${id}`} onClick={onNavigate} className={link}>
                  {name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/brands" onClick={onNavigate} className={link}>
                All labels A–Z
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <Link href={feat.href} onClick={onNavigate} className="group relative block overflow-hidden">
        <Img imgKey={feat.scene} alt="" sizes={SIZES.thumb} ratio="4/5" className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.03]" imgClassName="" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-5 pt-16 text-bone">
          <p className="eyebrow text-bone/80">{feat.kicker}</p>
          <p className="display-xs mt-2 flex items-center gap-2">
            {feat.title}
            <ArrowUpRight size={18} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </p>
        </div>
      </Link>
    </div>
  );
}

export function EditsMega({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="container-x grid grid-cols-[1fr_260px] gap-12 py-9">
      <div>
        <p className="eyebrow mb-4 text-ink-3">Curated destinations</p>
        <ul className="grid grid-cols-5 gap-4">
          {primaryEdits.map((e) => {
            const t = THEMES[e.theme];
            return (
              <li key={e.id}>
                <Link href={`/edits/${e.id}`} onClick={() => (signal("edit_open", { editId: e.id }), onNavigate())} className="group block">
                  <div className="relative overflow-hidden">
                    <Img imgKey={`scenes/edit-${e.id}-tall`} alt="" sizes={SIZES.thumb} ratio="4/5" className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.04]" />
                    <span className="absolute left-2 top-2 inline-flex h-[22px] items-center px-2 text-[10px] font-medium uppercase tracking-[0.12em]" style={{ background: t.bg, color: t.fg }}>
                      {editProducts(e).length} pieces
                    </span>
                  </div>
                  <p className="display-xs mt-3">{e.title}</p>
                  <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{e.blurb}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <p className="eyebrow mb-4 text-ink-3">Computed</p>
        <ul>
          {computedEdits.map((e) => (
            <li key={e.id}>
              <Link href={`/edits/${e.id}`} onClick={onNavigate} className={link}>
                {e.title}
                <span className="text-[11px] tabular-nums text-ink-3">{editProducts(e).length}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/edits" onClick={onNavigate} className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] link-u">
          All edits <ArrowUpRight size={14} />
        </Link>
        <p className="mt-8 border-t border-line pt-4 text-[12.5px] leading-snug text-ink-3">“Under ₹X” and “New in” are computed from live prices and dates — never hand-tagged.</p>
      </div>
    </div>
  );
}
