"use client";
import { useMemo, useState } from "react";
import { Checkbox, Switch } from "@/components/ui/Form";
import { Disclosure } from "@/components/ui/Disclosure";
import { cn } from "@/lib/cn";
import { PRICE_RANGES, type Facets, type FilterState } from "@/lib/filters";
import { Swatch } from "@/components/product/ColorSwatches";

export type FacetKey = "category" | "price" | "size" | "color" | "label" | "occasion" | "responsible" | "offers";
export type FilterChange = (next: FilterState, meta: { key: FacetKey; value?: string; on: boolean }) => void;

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** Filter groups shared by the desktop rail and the mobile bottom sheet. Every change is encoded in the URL by the caller. */
export function FilterPanel({ facets, filters, onChange, hide = [] }: { facets: Facets; filters: FilterState; onChange: FilterChange; hide?: FacetKey[] }) {
  const [labelQuery, setLabelQuery] = useState("");
  const labels = useMemo(() => facets.label.filter((l) => l.name.toLowerCase().includes(labelQuery.toLowerCase())), [facets.label, labelQuery]);
  const show = (k: FacetKey) => !hide.includes(k);

  return (
    <div className="divide-y-0">
      {(facets.responsible > 0 || facets.offers > 0) && (
        <div className="border-b border-line pb-3">
          {show("responsible") && facets.responsible > 0 && (
            <Switch label="Responsible" hint={`${facets.responsible} pieces`} checked={filters.responsible} onChange={(v) => onChange({ ...filters, responsible: v }, { key: "responsible", on: v })} />
          )}
          {show("offers") && facets.offers > 0 && <Switch label="On offer" hint={`${facets.offers} pieces`} checked={filters.offers} onChange={(v) => onChange({ ...filters, offers: v }, { key: "offers", on: v })} />}
        </div>
      )}

      {show("category") && facets.category.length > 1 && (
        <Disclosure title="Category" defaultOpen>
          <div className="-my-1">
            {facets.category.map((c) => (
              <Checkbox key={c.id} label={c.name} count={c.count} checked={filters.category.includes(c.id)} onChange={(on) => onChange({ ...filters, category: toggle(filters.category, c.id) }, { key: "category", value: c.id, on })} />
            ))}
          </div>
        </Disclosure>
      )}

      {show("price") && (
        <Disclosure title="Price" defaultOpen>
          <div className="-my-1" role="radiogroup" aria-label="Price">
            {PRICE_RANGES.map((r) => {
              const f = facets.price.find((x) => x.id === r.id);
              const active = filters.price === r.id;
              return (
                <label key={r.id} className={cn("flex min-h-9 items-center gap-3 py-1 text-[14px]", f && f.count === 0 && !active ? "cursor-not-allowed" : "cursor-pointer")}>
                  <input type="radio" name="price" className="peer sr-only" checked={active} disabled={!!f && f.count === 0 && !active} onChange={() => onChange({ ...filters, price: active ? null : r.id }, { key: "price", value: r.id, on: !active })} onClick={() => active && onChange({ ...filters, price: null }, { key: "price", on: false })} />
                  <span aria-hidden className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border border-ink-3 bg-white peer-checked:border-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                    <span className={cn("size-2.5 rounded-full bg-ink transition-transform", active ? "scale-100" : "scale-0")} />
                  </span>
                  <span className="flex-1">{r.name}</span>
                  <span className="text-[12px] tabular-nums text-ink-3">{f?.count ?? 0}</span>
                </label>
              );
            })}
          </div>
        </Disclosure>
      )}

      {show("size") && facets.size.length > 0 && (
        <Disclosure title="Size" defaultOpen meta={filters.size.length ? `${filters.size.length} selected` : undefined}>
          <div className="flex flex-wrap gap-2">
            {facets.size.map((s) => {
              const on = filters.size.includes(s.id);
              return (
                <button key={s.id} type="button" aria-pressed={on} onClick={() => onChange({ ...filters, size: toggle(filters.size, s.id) }, { key: "size", value: s.id, on: !on })} className={cn("inline-flex h-10 min-w-11 items-center justify-center border px-2.5 text-[13px] tabular-nums transition-colors", on ? "border-ink bg-ink text-bone" : "border-line-strong text-ink hover:border-ink")}>
                  {s.id}
                </button>
              );
            })}
          </div>
        </Disclosure>
      )}

      {show("color") && facets.color.length > 0 && (
        <Disclosure title="Colour" defaultOpen={false} meta={filters.color.length ? `${filters.color.length} selected` : undefined}>
          <div className="grid grid-cols-1 gap-0.5">
            {facets.color.map((c) => {
              const on = filters.color.includes(c.id);
              return (
                <button key={c.id} type="button" aria-pressed={on} onClick={() => onChange({ ...filters, color: toggle(filters.color, c.id) }, { key: "color", value: c.id, on: !on })} className="flex min-h-10 items-center gap-3 py-1 text-left text-[14px] text-ink">
                  <Swatch hex={c.hex} selected={on} size={20} />
                  <span className={cn("flex-1", on && "font-medium")}>{c.name}</span>
                  <span className="text-[12px] tabular-nums text-ink-3">{c.count}</span>
                </button>
              );
            })}
          </div>
        </Disclosure>
      )}

      {show("label") && facets.label.length > 1 && (
        <Disclosure title="Label" defaultOpen={false} meta={filters.label.length ? `${filters.label.length} selected` : undefined}>
          {facets.label.length > 8 && (
            <input type="search" aria-label="Search labels" placeholder="Search labels" value={labelQuery} onChange={(e) => setLabelQuery(e.target.value)} className="mb-2 h-10 w-full border border-line-strong bg-white px-3 text-[14px] focus:border-ink focus:outline-none" />
          )}
          <div className="-my-1 max-h-64 overflow-y-auto pr-1">
            {labels.map((l) => (
              <Checkbox key={l.id} label={l.name} count={l.count} checked={filters.label.includes(l.id)} onChange={(on) => onChange({ ...filters, label: toggle(filters.label, l.id) }, { key: "label", value: l.id, on })} />
            ))}
            {labels.length === 0 && <p className="py-2 text-[13px] text-ink-3">No labels match.</p>}
          </div>
        </Disclosure>
      )}

      {show("occasion") && facets.occasion.length > 0 && (
        <Disclosure title="Occasion" defaultOpen={false} meta={filters.occasion.length ? `${filters.occasion.length} selected` : undefined}>
          <div className="-my-1">
            {facets.occasion.map((o) => (
              <Checkbox key={o.id} label={o.name} count={o.count} checked={filters.occasion.includes(o.id)} onChange={(on) => onChange({ ...filters, occasion: toggle(filters.occasion, o.id) }, { key: "occasion", value: o.id, on })} />
            ))}
          </div>
        </Disclosure>
      )}
    </div>
  );
}
