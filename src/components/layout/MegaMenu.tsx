"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Col } from "@/components/layout/Grid";
import { Img, SIZES } from "@/components/ui/Img";
import { categories } from "@/data/categories";
import { FEATURED_BY_TOP } from "@/data/content";
import { computedEdits, primaryEdits } from "@/data/edits";
import { editProducts, productsInCategory } from "@/data/queries";
import { signal } from "@/stores/intent";

const COUNT: Record<string, number> = Object.fromEntries(categories.map((c) => [c.id, productsInCategory(c.id).length]));
const POPULAR_LABELS: Record<string, Array<[string, string]>> = {
  women: [["twenty-dresses", "Twenty Dresses"], ["vero-moda", "Vero Moda"], ["rsvp", "RSVP"], ["likha", "Likha"]],
  men: [["us-polo", "U.S. Polo Assn."], ["puma", "Puma"], ["orsay-and-rao", "Orsay & Rao"], ["kora-kala", "Kora Kala"]],
  kids: [["little-orchard", "Little Orchard"]],
  home: [["rangrez-home", "Rangrez Home"], ["mitti-and-co", "Mitti & Co."], ["hearth-and-hue", "Hearth & Hue"]],
};

const link = "link-u inline-flex items-baseline gap-2 py-1.5 text-[14px] text-ink-2 hover:text-ink";
const head = "eyebrow mb-4 text-ink-3";

function Tile({ href, scene, kicker, title, onNavigate }: { href: string; scene: string; kicker: string; title: string; onNavigate: () => void }) {
  return (
    <Link href={href} onClick={onNavigate} className="group block">
      <div className="overflow-hidden bg-sand">
        <Img imgKey={scene} alt="" sizes={SIZES.thumb} ratio="5/6" className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.03]" />
      </div>
      <p className="eyebrow mt-3 text-ink-3">{kicker}</p>
      <p className="mt-1.5 flex items-center gap-2 text-[16px] font-medium leading-snug tracking-[-0.015em]">
        {title}
        <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

/** Women / Men / Kids / Home: 3 + 3 + 3 + 3 columns — categories, edits + labels, two feature tiles. */
export function CategoryMega({ top, onNavigate }: { top: "women" | "men" | "kids" | "home"; onNavigate: () => void }) {
  const subs = categories.filter((c) => c.parent === top);
  const feat = FEATURED_BY_TOP[top];
  return (
    <div className="container-x grid-main py-10">
      <Col span={{ lg: 3 }}>
        <p className={head}>Shop {top}</p>
        <ul>
          {subs.map((c) => (
            <li key={c.id}>
              <Link href={`/c/${c.id}`} onClick={onNavigate} className={link}>
                {c.name}
                <span className="text-[11px] tabular-nums text-ink-3">{COUNT[c.id]}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href={`/c/${top}`} onClick={onNavigate} className="link-u mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.09em] text-ink">
          Shop all {top} <ArrowUpRight size={14} />
        </Link>
      </Col>
      <Col span={{ lg: 3 }} className="grid content-start gap-9">
        <div>
          <p className={head}>Featured</p>
          <ul>
            {primaryEdits.map((e) => (
              <li key={e.id}>
                <Link href={`/edits/${e.id}`} onClick={onNavigate} className={link}>
                  {e.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/edits/new-in" onClick={onNavigate} className={link}>
                New in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className={head}>Top brands</p>
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
                All brands A–Z
              </Link>
            </li>
          </ul>
        </div>
      </Col>
      <Col span={{ lg: 3 }}>
        <Tile href={feat.href} scene={feat.scene} kicker={feat.kicker} title={feat.title} onNavigate={onNavigate} />
      </Col>
      <Col span={{ lg: 3 }}>
        <Tile href="/edits/new-in" scene="scenes/edit-new-in-tall" kicker="Just landed" title="New in" onNavigate={onNavigate} />
      </Col>
    </div>
  );
}

/** More: the curated destinations (Luxe, Hidden Gems …) + explore links (3 columns each) and two feature tiles. */
export function MoreMega({ onNavigate }: { onNavigate: () => void }) {
  const curated = primaryEdits;
  return (
    <div className="container-x grid-main py-10">
      <Col span={{ lg: 3 }}>
        <p className={head}>Curated destinations</p>
        <ul>
          {curated.map((e) => (
            <li key={e.id}>
              <Link href={`/edits/${e.id}`} onClick={() => (signal("edit_open", { editId: e.id }), onNavigate())} className={link}>
                {e.title}
                <span className="text-[11px] tabular-nums text-ink-3">{editProducts(e).length}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Col>
      <Col span={{ lg: 3 }}>
        <p className={head}>Explore</p>
        <ul>
          {[
            ["/discover", "Style Files"],
            ["/brands", "All brands A–Z"],
            ["/edits/new-in", "New in"],
            ["/offers", "Offers"],
            ...computedEdits.filter((e) => e.id !== "new-in").map((e): [string, string] => [`/edits/${e.id}`, e.title]),
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} onClick={onNavigate} className={link}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </Col>
      <Col span={{ lg: 3 }}>
        <Tile href="/edits/luxe" scene="scenes/edit-luxe-tall" kicker="Nykaa Fashion Luxe" title="Luxe" onNavigate={onNavigate} />
      </Col>
      <Col span={{ lg: 3 }}>
        <Tile href="/edits/hidden-gems" scene="scenes/edit-hidden-gems-tall" kicker="Independent labels" title="Hidden Gems" onNavigate={onNavigate} />
      </Col>
    </div>
  );
}
