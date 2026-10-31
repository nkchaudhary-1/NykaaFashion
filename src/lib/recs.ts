import { products, productById } from "@/data/catalog";
import { editsOf, labelOf } from "@/data/queries";
import { categoryById } from "@/data/categories";
import type { Product } from "@/data/types";
import type { IntentState } from "@/stores/intent";

const COMPLEMENTS: Record<string, string[]> = {
  "women/dresses": ["women/bags", "women/footwear", "women/jewellery", "women/jackets"],
  "women/indianwear": ["women/jewellery", "women/bags", "women/footwear"],
  "women/tops": ["women/bottoms", "women/bags", "women/jewellery", "women/footwear"],
  "women/bottoms": ["women/tops", "women/footwear", "women/bags"],
  "women/knitwear": ["women/bottoms", "women/jewellery", "women/footwear"],
  "women/jackets": ["women/dresses", "women/bottoms", "women/tops"],
  "women/footwear": ["women/dresses", "women/bottoms", "women/bags"],
  "women/bags": ["women/dresses", "women/tops", "women/indianwear"],
  "women/jewellery": ["women/indianwear", "women/dresses", "women/tops"],
  "men/shirts": ["men/trousers", "men/footwear", "men/jackets"],
  "men/tees": ["men/trousers", "men/footwear", "men/jackets"],
  "men/ethnic": ["men/jackets", "men/footwear"],
  "men/trousers": ["men/shirts", "men/footwear", "men/jackets"],
  "men/jackets": ["men/shirts", "men/trousers", "men/footwear"],
  "men/footwear": ["men/trousers", "men/shirts"],
  "kids/girls": ["kids/footwear", "kids/boys"],
  "kids/boys": ["kids/footwear", "kids/girls"],
  "kids/footwear": ["kids/girls", "kids/boys"],
  "home/cushions": ["home/throws", "home/decor", "home/candles"],
  "home/throws": ["home/cushions", "home/decor", "home/candles"],
  "home/decor": ["home/candles", "home/tableware", "home/cushions"],
  "home/candles": ["home/decor", "home/tableware", "home/throws"],
  "home/tableware": ["home/decor", "home/candles"],
};

const OCC = ["festive", "wedding", "party", "evening", "work", "brunch", "casual", "everyday", "summer", "winter", "vacation", "lounge", "handloom", "block-print"];
const catKey = (p: Product) => p.categoryPath.slice(0, 2).join("/");
const inStock = (p: Product) => !p.soldOut;

/** "Complete the look" — one product per complementary category, matched on occasion tags. */
export function styleWith(p: Product, n = 3): Product[] {
  const wanted = COMPLEMENTS[catKey(p)] ?? [];
  const picks: Product[] = [];
  for (const cat of wanted) {
    const pool = products.filter((x) => catKey(x) === cat && inStock(x) && x.id !== p.id);
    const scored = pool
      .map((x) => ({ x, s: OCC.filter((t) => p.tags.includes(t) && x.tags.includes(t)).length * 2 + (x.labelId === p.labelId ? 2 : 0) + (labelOf(x).flags.hiddenGem === labelOf(p).flags.hiddenGem ? 1 : 0) + (Math.abs(x.price - p.price) < p.price ? 0.5 : 0) - x.rank / 1000 }))
      .sort((a, b) => b.s - a.s);
    if (scored[0]) picks.push(scored[0].x);
    if (picks.length >= n) break;
  }
  return picks;
}

export function similarity(a: Product, b: Product): number {
  let s = 0;
  if (catKey(a) === catKey(b)) s += 4;
  else if (a.categoryPath[0] === b.categoryPath[0]) s += 1;
  if (a.labelId === b.labelId) s += 3;
  s += a.tags.filter((t) => b.tags.includes(t)).length * 0.5;
  const ratio = Math.min(a.price, b.price) / Math.max(a.price, b.price);
  s += ratio * 2;
  return s;
}

export function similarTo(p: Product, n = 6, filter: (x: Product) => boolean = () => true): Product[] {
  return products
    .filter((x) => x.id !== p.id && inStock(x) && filter(x))
    .map((x) => ({ x, s: similarity(p, x) }))
    .sort((a, b) => b.s - a.s || a.x.rank - b.x.rank)
    .slice(0, n)
    .map((r) => r.x);
}
export const fromSameLabel = (p: Product, n = 6) => products.filter((x) => x.labelId === p.labelId && x.id !== p.id && inStock(x)).slice(0, n);
export function inSameEdit(p: Product, n = 6): { editId: string; items: Product[] } | null {
  const e = editsOf(p).find((ed) => ed.id !== "house-of-nykaa") ?? editsOf(p)[0];
  if (!e) return null;
  const items = products.filter((x) => x.id !== p.id && inStock(x) && editsOf(x).some((ed) => ed.id === e.id) && catKey(x) !== catKey(p)).slice(0, n);
  return items.length ? { editId: e.id, items } : null;
}
export const alternatives = (p: Product, n = 6) => similarTo(p, n, (x) => catKey(x) === catKey(p));

export const popular = (n = 8): Product[] =>
  [...products].filter(inStock).sort((a, b) => b.rating * Math.log(b.ratingCount + 2) - a.rating * Math.log(a.ratingCount + 2)).slice(0, n);

export interface RailItem {
  product: Product;
  reason: string;
}

/** Simulated personalisation (PRD §5.7): weights from localStorage browse/save signals — a heuristic, not ML. */
export function personalizedRail(intent: IntentState, savedIds: string[], n = 8): { items: RailItem[]; warm: boolean } {
  const W = intent.weights;
  const total = Object.values(W.category).reduce((a, b) => a + b, 0) + Object.values(W.label).reduce((a, b) => a + b, 0);
  if (total < 2) return { items: popular(n).map((product) => ({ product, reason: "Popular right now" })), warm: false };
  const recentTop = new Set(intent.recent.slice(0, 2));
  const scored = products
    .filter(inStock)
    .map((product) => {
      const parts: Array<[string, number]> = [];
      const c = (W.category[catKey(product)] ?? 0) * 1.0;
      const l = (W.label[product.labelId] ?? 0) * 1.2;
      const e = editsOf(product).reduce((n2, ed) => n2 + (W.edit[ed.id] ?? 0) * 0.6, 0);
      const t = product.tags.reduce((n2, tag) => n2 + (W.tag[tag] ?? 0) * 0.3, 0);
      if (c) parts.push([`Because you browse ${categoryById[catKey(product)]?.name ?? "this"}`, c]);
      if (l) parts.push([`More from ${labelOf(product).name}`, l]);
      if (e) parts.push([`From an edit you like`, e]);
      if (t) parts.push([`Matches your taste`, t]);
      const score = (c + l + e + t) * (recentTop.has(product.id) || savedIds.includes(product.id) ? 0.35 : 1);
      parts.sort((a, b) => b[1] - a[1]);
      return { product, score, reason: parts[0]?.[0] ?? "Picked for you" };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.product.rank - b.product.rank);
  // Keep the rail varied: no more than 3 from one label.
  const perLabel: Record<string, number> = {};
  const items: RailItem[] = [];
  for (const s of scored) {
    perLabel[s.product.labelId] = (perLabel[s.product.labelId] ?? 0) + 1;
    if (perLabel[s.product.labelId] > 3) continue;
    items.push({ product: s.product, reason: s.reason });
    if (items.length >= n) break;
  }
  return { items, warm: items.length >= 4 };
}

export function recentlyViewed(intent: IntentState, n = 8): Product[] {
  return intent.recent.map((id) => productById[id]).filter(Boolean).slice(0, n);
}
