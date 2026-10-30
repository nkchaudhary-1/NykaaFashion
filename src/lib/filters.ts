import { COLOR_FAMILIES } from "@/data/catalog";
import { labelById } from "@/data/labels";
import { categoryById } from "@/data/categories";
import type { Product } from "@/data/types";
import { inr } from "./format";

export type SortKey = "curated" | "new" | "price-asc" | "price-desc" | "rating" | "discount";

export const SORTS: Array<{ id: SortKey; label: string }> = [
  { id: "curated", label: "Curated" },
  { id: "new", label: "New in" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "rating", label: "Customer rating" },
  { id: "discount", label: "Biggest discount" },
];

export interface FilterState {
  category: string[];
  price: string | null;
  size: string[];
  color: string[];
  label: string[];
  occasion: string[];
  responsible: boolean;
  offers: boolean;
  sort: SortKey;
}

export const EMPTY_FILTERS: FilterState = { category: [], price: null, size: [], color: [], label: [], occasion: [], responsible: false, offers: false, sort: "curated" };

export const PRICE_RANGES = [
  { id: "0-1000", name: "Under ₹1,000", min: 0, max: 1000 },
  { id: "0-2000", name: "Under ₹2,000", min: 0, max: 2000 },
  { id: "0-3000", name: "Under ₹3,000", min: 0, max: 3000 },
  { id: "3000-6000", name: "₹3,000 – ₹6,000", min: 3000, max: 6000 },
  { id: "6000-15000", name: "₹6,000 – ₹15,000", min: 6000, max: 15000 },
  { id: "15000-", name: "₹15,000 & above", min: 15000, max: Infinity },
] as const;

export const OCCASIONS = [
  { id: "festive", name: "Festive" },
  { id: "wedding", name: "Wedding" },
  { id: "party", name: "Party & evening" },
  { id: "work", name: "Work" },
  { id: "brunch", name: "Brunch & day" },
  { id: "casual", name: "Casual" },
  { id: "everyday", name: "Everyday" },
  { id: "vacation", name: "Vacation" },
  { id: "winter", name: "Winter" },
  { id: "summer", name: "Summer" },
  { id: "lounge", name: "Lounge" },
  { id: "gifting", name: "Gifting" },
];

const list = (sp: URLSearchParams, k: string) => (sp.get(k) ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function parseFilters(sp: URLSearchParams | { get(k: string): string | null }): FilterState {
  const usp = sp as URLSearchParams;
  const sort = (usp.get("sort") as SortKey) || "curated";
  return {
    category: list(usp, "cat"),
    price: usp.get("price"),
    size: list(usp, "size"),
    color: list(usp, "color"),
    label: list(usp, "brand"),
    occasion: list(usp, "occ"),
    responsible: usp.get("resp") === "1",
    offers: usp.get("offers") === "1",
    sort: SORTS.some((s) => s.id === sort) ? sort : "curated",
  };
}

export function serializeFilters(f: FilterState, base?: URLSearchParams): URLSearchParams {
  const sp = new URLSearchParams(base?.toString() ?? "");
  for (const k of ["cat", "price", "size", "color", "brand", "occ", "resp", "offers", "sort"]) sp.delete(k);
  if (f.category.length) sp.set("cat", f.category.join(","));
  if (f.price) sp.set("price", f.price);
  if (f.size.length) sp.set("size", f.size.join(","));
  if (f.color.length) sp.set("color", f.color.join(","));
  if (f.label.length) sp.set("brand", f.label.join(","));
  if (f.occasion.length) sp.set("occ", f.occasion.join(","));
  if (f.responsible) sp.set("resp", "1");
  if (f.offers) sp.set("offers", "1");
  if (f.sort !== "curated") sp.set("sort", f.sort);
  return sp;
}

export const activeCount = (f: FilterState) =>
  f.category.length + (f.price ? 1 : 0) + f.size.length + f.color.length + f.label.length + f.occasion.length + (f.responsible ? 1 : 0) + (f.offers ? 1 : 0);

type Dim = "category" | "price" | "size" | "color" | "label" | "occasion" | "responsible" | "offers";

function matches(p: Product, f: FilterState, skip?: Dim): boolean {
  if (skip !== "category" && f.category.length && !f.category.some((c) => p.categoryPath.join("/").startsWith(c))) return false;
  if (skip !== "price" && f.price) {
    const r = PRICE_RANGES.find((x) => x.id === f.price);
    if (r && (p.price < r.min || p.price >= r.max)) return false;
  }
  if (skip !== "size" && f.size.length && !p.variants.some((v) => f.size.some((s) => (v.stock[s] ?? 0) > 0))) return false;
  if (skip !== "color" && f.color.length && !p.variants.some((v) => f.color.includes(v.family))) return false;
  if (skip !== "label" && f.label.length && !f.label.includes(p.labelId)) return false;
  if (skip !== "occasion" && f.occasion.length && !f.occasion.some((o) => p.tags.includes(o))) return false;
  if (skip !== "responsible" && f.responsible && !p.responsible) return false;
  if (skip !== "offers" && f.offers && p.discount <= 0) return false;
  return true;
}

export function sortProducts(items: Product[], sort: SortKey): Product[] {
  const out = [...items];
  const byRank = (a: Product, b: Product) => a.rank - b.rank;
  switch (sort) {
    case "new":
      return out.sort((a, b) => Number(b.isNew) - Number(a.isNew) || byRank(a, b));
    case "price-asc":
      return out.sort((a, b) => a.price - b.price || byRank(a, b));
    case "price-desc":
      return out.sort((a, b) => b.price - a.price || byRank(a, b));
    case "rating":
      return out.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    case "discount":
      return out.sort((a, b) => b.discount - a.discount || byRank(a, b));
    default:
      // Curated: in-stock first, then the label-interleaved editorial order.
      return out.sort((a, b) => Number(a.soldOut) - Number(b.soldOut) || byRank(a, b));
  }
}

export function applyFilters(items: Product[], f: FilterState): Product[] {
  return sortProducts(items.filter((p) => matches(p, f)), f.sort);
}

export interface Facets {
  category: Array<{ id: string; name: string; count: number }>;
  price: Array<{ id: string; name: string; count: number }>;
  size: Array<{ id: string; count: number }>;
  color: Array<{ id: string; name: string; hex: string; count: number }>;
  label: Array<{ id: string; name: string; count: number }>;
  occasion: Array<{ id: string; name: string; count: number }>;
  responsible: number;
  offers: number;
}

/** Disjunctive facets: each dimension is counted with every *other* filter applied. */
export function computeFacets(items: Product[], f: FilterState, categoryScope: string[]): Facets {
  const count = (skip: Dim, test: (p: Product) => boolean) => items.filter((p) => matches(p, f, skip) && test(p)).length;

  const catIds = Array.from(new Set(items.map((p) => p.categoryPath.slice(0, categoryScope.length + 1).join("/")).filter((id) => id.split("/").length === categoryScope.length + 1)));
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "26", "28", "30", "32", "34", "36", "38", "UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y", "UK 8C", "UK 9C", "UK 10C", "UK 11C", "UK 12C"];
  const sizes = Array.from(new Set(items.flatMap((p) => (p.sizes.length > 1 ? p.sizes : [])))).sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));
  const colors = Array.from(new Set(items.flatMap((p) => p.variants.map((v) => v.family))));
  const labelIds = Array.from(new Set(items.map((p) => p.labelId)));

  return {
    category: catIds.map((id) => ({ id, name: categoryById[id]?.name ?? id, count: count("category", (p) => p.categoryPath.join("/").startsWith(id)) })).filter((c) => c.count > 0),
    price: PRICE_RANGES.map((r) => ({ id: r.id, name: r.name, count: count("price", (p) => p.price >= r.min && p.price < r.max) })),
    size: sizes.map((s) => ({ id: s, count: count("size", (p) => p.variants.some((v) => (v.stock[s] ?? 0) > 0)) })).filter((s) => s.count > 0),
    color: colors.map((c) => ({ id: c, name: COLOR_FAMILIES[c]?.name ?? c, hex: COLOR_FAMILIES[c]?.hex ?? "#ccc", count: count("color", (p) => p.variants.some((v) => v.family === c)) })).filter((c) => c.count > 0),
    label: labelIds.map((id) => ({ id, name: labelById[id].name, count: count("label", (p) => p.labelId === id) })).filter((l) => l.count > 0).sort((a, b) => a.name.localeCompare(b.name)),
    occasion: OCCASIONS.map((o) => ({ ...o, count: count("occasion", (p) => p.tags.includes(o.id)) })).filter((o) => o.count > 0),
    responsible: count("responsible", (p) => p.responsible),
    offers: count("offers", (p) => p.discount > 0),
  };
}

export interface Chip {
  key: Dim;
  value?: string;
  label: string;
}
export function activeChips(f: FilterState): Chip[] {
  const chips: Chip[] = [];
  f.category.forEach((c) => chips.push({ key: "category", value: c, label: categoryById[c]?.name ?? c }));
  if (f.price) chips.push({ key: "price", label: PRICE_RANGES.find((r) => r.id === f.price)?.name ?? f.price });
  f.size.forEach((s) => chips.push({ key: "size", value: s, label: `Size ${s}` }));
  f.color.forEach((c) => chips.push({ key: "color", value: c, label: COLOR_FAMILIES[c]?.name ?? c }));
  f.label.forEach((l) => chips.push({ key: "label", value: l, label: labelById[l]?.name ?? l }));
  f.occasion.forEach((o) => chips.push({ key: "occasion", value: o, label: OCCASIONS.find((x) => x.id === o)?.name ?? o }));
  if (f.responsible) chips.push({ key: "responsible", label: "Responsible" });
  if (f.offers) chips.push({ key: "offers", label: "On offer" });
  return chips;
}

export function removeChip(f: FilterState, chip: Chip): FilterState {
  const n = { ...f };
  switch (chip.key) {
    case "category": n.category = f.category.filter((c) => c !== chip.value); break;
    case "price": n.price = null; break;
    case "size": n.size = f.size.filter((c) => c !== chip.value); break;
    case "color": n.color = f.color.filter((c) => c !== chip.value); break;
    case "label": n.label = f.label.filter((c) => c !== chip.value); break;
    case "occasion": n.occasion = f.occasion.filter((c) => c !== chip.value); break;
    case "responsible": n.responsible = false; break;
    case "offers": n.offers = false; break;
  }
  return n;
}

/** PRD §4.4 "No match → relaxed-filter suggestions": which single filter, if removed, brings back the most results. */
export function relaxSuggestions(items: Product[], f: FilterState): Array<{ chip: Chip; count: number }> {
  return activeChips(f)
    .map((chip) => ({ chip, count: applyFilters(items, removeChip(f, chip)).length }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

export const priceCaption = (min: number, max: number) => (max === Infinity ? `${inr(min)}+` : `${inr(min)}–${inr(max)}`);
