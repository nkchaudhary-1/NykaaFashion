"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { Swatch } from "@/components/product/ColorSwatches";
import { cn } from "@/lib/cn";
import { PRICE_RANGES, type Facets, type FilterState } from "@/lib/filters";
import type { FacetKey, FilterChange } from "./FilterPanel";

interface Quick {
  id: string;
  label: string;
  on: boolean;
  swatch?: string;
  next: FilterState;
  meta: { key: FacetKey; value?: string; on: boolean };
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const LETTER_SIZES = /^(XXS|XS|S|M|L|XL|XXL|XXXL)$/;

/**
 * The few facets that are worth one tap from the toolbar, chosen from what the current pool actually offers:
 * offers / responsible flags that split the pool, the price bands with the most pieces, sizes (letter sizes when there are
 * some), the most common colours and occasions. Each group is a list of toggles; the full set lives in the filter drawer.
 */
function buildGroups(facets: Facets, f: FilterState, hide: FacetKey[], poolSize: number): Array<{ id: string; label: string; items: Quick[] }> {
  const show = (k: FacetKey) => !hide.includes(k);
  const groups: Array<{ id: string; label: string; items: Quick[] }> = [];

  if (show("size") && facets.size.length > 0) {
    const letters = facets.size.filter((s) => LETTER_SIZES.test(s.id));
    const base = letters.length >= 2 ? letters : [...facets.size].sort((a, b) => b.count - a.count).slice(0, 5);
    const order = new Map(facets.size.map((s, i) => [s.id, i]));
    const items = base
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map<Quick>((s) => {
        const on = f.size.includes(s.id);
        return { id: `size-${s.id}`, label: s.id, on, next: { ...f, size: toggle(f.size, s.id) }, meta: { key: "size", value: s.id, on: !on } };
      });
    groups.push({ id: "size", label: "Size", items });
  }

  const flags: Quick[] = [];
  if (show("offers") && facets.offers > 0 && (facets.offers < poolSize || f.offers)) flags.push({ id: "offers", label: "On offer", on: f.offers, next: { ...f, offers: !f.offers }, meta: { key: "offers", on: !f.offers } });
  if (show("responsible") && facets.responsible > 0 && (facets.responsible < poolSize || f.responsible)) flags.push({ id: "responsible", label: "Responsible", on: f.responsible, next: { ...f, responsible: !f.responsible }, meta: { key: "responsible", on: !f.responsible } });
  if (flags.length) groups.push({ id: "flags", label: "Offers", items: flags });

  if (show("price")) {
    const bands = facets.price.filter((p) => (p.count > 0 && p.count < poolSize) || f.price === p.id);
    const top = [...bands].sort((a, b) => b.count - a.count).slice(0, 2);
    const items = bands.filter((b) => top.includes(b)).map<Quick>((b) => {
      const on = f.price === b.id;
      const name = PRICE_RANGES.find((r) => r.id === b.id)?.name ?? b.name;
      return { id: `price-${b.id}`, label: name, on, next: { ...f, price: on ? null : b.id }, meta: { key: "price", value: b.id, on: !on } };
    });
    if (items.length) groups.push({ id: "price", label: "Price", items });
  }

  if (show("color") && facets.color.length > 1) {
    const items = [...facets.color]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map<Quick>((c) => {
        const on = f.color.includes(c.id);
        return { id: `color-${c.id}`, label: c.name, swatch: c.hex, on, next: { ...f, color: toggle(f.color, c.id) }, meta: { key: "color", value: c.id, on: !on } };
      });
    groups.push({ id: "color", label: "Colour", items });
  }

  if (show("occasion") && facets.occasion.length > 1) {
    const items = facets.occasion
      .filter((o) => o.count < poolSize || f.occasion.includes(o.id))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map<Quick>((o) => {
        const on = f.occasion.includes(o.id);
        return { id: `occ-${o.id}`, label: o.name, on, next: { ...f, occasion: toggle(f.occasion, o.id) }, meta: { key: "occasion", value: o.id, on: !on } };
      });
    if (items.length) groups.push({ id: "occasion", label: "Occasion", items });
  }
  return groups;
}

/**
 * Toolbar chip row: one tap filters. It shows the facet groups that fit completely on one line — the rest stay in the filter drawer —
 * so no chip is ever cut off. Groups that don't fit are made inert as well as clipped: nobody tabs to a chip they cannot see.
 * Every chip is a toggle button (aria-pressed).
 */
export function QuickFilters({ facets, filters, hide, poolSize, onChange, className }: { facets: Facets; filters: FilterState; hide: FacetKey[]; poolSize: number; onChange: FilterChange; className?: string }) {
  const groups = buildGroups(facets, filters, hide, poolSize);
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(Infinity); // how many groups fit on the first line
  const sig = groups.map((g) => `${g.id}:${g.items.map((i) => i.id).join(",")}`).join("|");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const kids = Array.from(el.querySelectorAll<HTMLElement>("[data-qfg]"));
      if (!kids.length) return;
      const wrapped = kids.findIndex((k) => k.offsetTop > kids[0].offsetTop + 4);
      setFit(wrapped === -1 ? Infinity : wrapped);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sig]);
  if (!groups.length) return <div className={className} />;
  return (
    <div ref={ref} role="group" aria-label="Quick filters" className={cn("-mx-1 flex h-12 flex-wrap content-start gap-x-2 gap-y-2 overflow-hidden px-1 py-1", className)}>
      {groups.map((g, gi) => (
        <div key={g.id} data-qfg role="group" aria-label={g.label} inert={gi >= fit} className={cn("flex shrink-0 items-center gap-2", gi > 0 && "ml-1 border-l border-line-strong pl-3")}>
          {g.items.map((q) => (
            <Chip key={q.id} selected={q.on} onClick={() => onChange(q.next, q.meta)}>
              {q.swatch && <Swatch hex={q.swatch} size={12} />}
              {q.label}
            </Chip>
          ))}
        </div>
      ))}
    </div>
  );
}
