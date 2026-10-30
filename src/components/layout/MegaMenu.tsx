"use client";
import Link from "next/link";
import { Img } from "@/components/ui/Img";
import { MORE_LINKS, MORE_TILES, type NavTab } from "@/data/nav";

/** Dropdown under a department tab: "Shop All" (raspberry) first, then the entries, flowing down in columns of eight — as on the live site. */
export function TabDropdown({ id, tab, onNavigate }: { id: string; tab: NavTab; onNavigate: () => void }) {
  const entries = [{ label: "Shop All", href: tab.href }, ...(tab.items ?? [])];
  const rows = Math.min(entries.length, 8);
  return (
    <div id={id} className="absolute left-0 top-full z-50 border border-line-strong bg-white px-8 py-6">
      <ul className="grid grid-flow-col gap-x-14" style={{ gridTemplateRows: `repeat(${rows}, auto)` }}>
        {entries.map((e, i) => (
          <li key={e.href + e.label}>
            <Link href={e.href} onClick={onNavigate} className={i === 0 ? "block min-w-[180px] py-2 text-[15px] font-semibold text-pink hover:text-pink-ink" : "block min-w-[180px] py-2 text-[15px] text-ink hover:text-pink"}>
              {e.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** More: poster tiles for the curated destinations, as on the live site, plus a slim row of text links. */
export function MorePanel({ id, onNavigate }: { id: string; onNavigate: () => void }) {
  return (
    <div id={id} className="absolute inset-x-0 top-full z-50 border-b border-line-strong bg-white">
      <div className="container-x py-8">
        <ul className="grid grid-cols-6 gap-[var(--gap)]">
          {MORE_TILES.map((t) => (
            <li key={t.href}>
              <Link href={t.href} onClick={onNavigate} className="group block outline-offset-4">
                <div className="overflow-hidden bg-sand">
                  <Img imgKey={t.scene} alt="" sizes="(min-width:1280px) 16vw, 17vw" ratio="4/5" className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.03]" />
                </div>
                <p className="mt-3 text-[15px] font-semibold leading-snug text-ink">{t.title}</p>
                <p className="mt-0.5 text-[13px] text-ink-3">{t.kicker}</p>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-6 flex items-center gap-8 border-t border-line pt-4">
          {MORE_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={onNavigate} className="inline-flex min-h-8 items-center text-[14px] font-medium text-ink hover:text-pink">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
