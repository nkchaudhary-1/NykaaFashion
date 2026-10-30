"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { labels } from "@/data/labels";
import { products } from "@/data/catalog";
import { LabelBadges, LabelMonogram } from "./LabelMark";

const COUNT: Record<string, number> = {};
for (const p of products) COUNT[p.labelId] = (COUNT[p.labelId] ?? 0) + 1;

const FILTERS = [
  { id: "all", label: "All labels" },
  { id: "hiddenGem", label: "Hidden Gems" },
  { id: "luxe", label: "Luxe" },
  { id: "houseOfNykaa", label: "House of Nykaa" },
  { id: "responsible", label: "Responsible" },
];

export function LabelDirectory() {
  const [f, setF] = useState("all");
  const groups = useMemo(() => {
    const list = labels.filter((l) => f === "all" || l.flags[f as keyof typeof l.flags]).sort((a, b) => a.name.localeCompare(b.name));
    const out: Record<string, typeof labels> = {};
    for (const l of list) (out[l.name[0].toUpperCase()] ??= []).push(l);
    return Object.entries(out);
  }, [f]);
  return (
    <div className="container-x pb-8">
      <Tabs items={FILTERS.map((x) => ({ ...x, count: labels.filter((l) => x.id === "all" || l.flags[x.id as keyof typeof l.flags]).length }))} value={f} onChange={setF} label="Filter labels" variant="pill" className="mb-10 pb-1" />
      <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
        {groups.map(([letter, list]) => (
          <section key={letter} aria-labelledby={`l-${letter}`}>
            <h2 id={`l-${letter}`} className="display-md border-b border-ink pb-3">{letter}</h2>
            <ul>
              {list.map((l) => (
                <li key={l.id} className="border-b border-line">
                  <Link href={`/brands/${l.id}`} className="group flex items-center gap-5 py-5">
                    <LabelMonogram label={l} />
                    <span className="min-w-0 flex-1">
                      <span className="display-xs block">{l.name}</span>
                      <span className="mt-1 block truncate text-[13.5px] text-ink-2">{l.tagline}</span>
                      <LabelBadges label={l} className="mt-2" />
                    </span>
                    <span className="shrink-0 text-right text-[12.5px] tabular-nums text-ink-3">{COUNT[l.id] ?? 0}<br />pieces</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
