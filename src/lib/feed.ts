import { products } from "@/data/catalog";
import { categoryById } from "@/data/categories";
import { editsOf, labelOf } from "@/data/queries";
import type { Product } from "@/data/types";
import { similarity, styleWith } from "@/lib/recs";
import type { IntentState } from "@/stores/intent";

/*
 * The endless feed ("Keep exploring"). A simulated recommender — heuristics over this browser's own signals, the same weights the "Picked for you" rail uses — that turns the
 * catalogue into a sequence that never runs out: pass 0 is the best order for this visitor (or, on a product page, for the product being looked at), every later pass re-ranks
 * with a different seeded jitter so the second lap is not the first replayed. Nothing here is random at render time (Cache Components) — the jitter is a hash of the
 * pass and the product — and nothing leaves the browser.
 */

export interface FeedEntry {
  /** unique per position in the feed ("pass-productId") */
  key: string;
  product: Product;
  /** the "why am I seeing this" line */
  reason: string;
}

export interface FeedInput {
  intent: IntentState;
  saved: string[];
  /** a product page's own product: the feed then drifts out from it instead of from the visitor's whole history */
  seed?: Product;
}

const catKey = (p: Product) => p.categoryPath.slice(0, 2).join("/");
const OCCASIONS = ["festive", "wedding", "party", "evening", "work", "brunch", "casual", "everyday", "summer", "winter", "vacation", "lounge", "handloom", "block-print"];

/** A stable number in [0, 1) from a string (FNV-1a). */
function unit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

const pool = products.filter((p) => !p.soldOut);

/** What the visitor's signals say about a product, and which signal said the most. */
function taste(intent: IntentState, p: Product) {
  const W = intent.weights;
  const c = W.category[catKey(p)] ?? 0;
  const l = (W.label[p.labelId] ?? 0) * 1.2;
  const e = editsOf(p).reduce((n, ed) => n + (W.edit[ed.id] ?? 0) * 0.6, 0);
  const t = p.tags.reduce((n, tag) => n + (W.tag[tag] ?? 0) * 0.3, 0);
  return { c, l, e, t, total: c + l + e + t };
}

/** Quality that does not depend on who is looking: rating weighted by how many rated it, freshness, a real discount. */
const base = (p: Product) => (p.rating * Math.log(p.ratingCount + 2)) / 25 + (p.isNew ? 0.5 : 0) + (p.discount / 100) * 0.6 + (1 - Math.min(p.rank, 1000) / 1000) * 0.2;

function reasonFor(p: Product, input: FeedInput, complements: Set<string>): string {
  const { seed, intent } = input;
  if (seed) {
    if (complements.has(p.id)) return "Completes the look";
    if (p.labelId === seed.labelId) return `More from ${labelOf(p).name}`;
    if (catKey(p) === catKey(seed)) return "Similar to this";
    const shared = OCCASIONS.find((t) => seed.tags.includes(t) && p.tags.includes(t));
    if (shared) return `Also ${shared}`;
    return "Popular with this look";
  }
  const t = taste(intent, p);
  if (t.total > 0) {
    const top = Math.max(t.c, t.l, t.e, t.t);
    if (top === t.c) return `Because you browse ${categoryById[catKey(p)]?.name ?? "this"}`;
    if (top === t.l) return `More from ${labelOf(p).name}`;
    if (top === t.e) return "From an edit you like";
    return "Matches your taste";
  }
  if (p.isNew) return "New in";
  if (p.discount >= 40) return `${p.discount}% off`;
  if (p.price <= 1999) return "Under ₹1,999";
  return "Popular right now";
}

/** One lap through the catalogue, best first, with no label twice within three places. */
function lap(input: FeedInput, pass: number, complements: Set<string>, avoid: string | null): FeedEntry[] {
  const { intent, saved, seed } = input;
  const recent = new Set([...intent.recent.slice(0, 2), ...saved]);
  const scored = pool
    .filter((p) => p.id !== seed?.id)
    .map((p) => {
      const t = taste(intent, p);
      const jitter = unit(`${pass}:${p.id}`) * (pass === 0 ? 0.35 : 1.6);
      const score = seed ? similarity(seed, p) * 0.5 + (complements.has(p.id) ? 3 : 0) + base(p) * 0.3 + t.total * 0.15 + jitter : base(p) + t.total * 0.5 + jitter;
      return { p, score: score - (recent.has(p.id) ? 0.6 : 0) };
    })
    .sort((a, b) => b.score - a.score || a.p.rank - b.p.rank);

  // spread the labels: take the best remaining piece whose label is not among the last two, and (at a lap boundary) is not the piece the previous lap ended on
  const out: FeedEntry[] = [];
  const left = [...scored];
  const lastLabels: string[] = [];
  let prev = avoid;
  while (left.length) {
    let i = left.findIndex((x) => !lastLabels.includes(x.p.labelId) && x.p.id !== prev);
    if (i < 0) i = left.findIndex((x) => x.p.id !== prev);
    if (i < 0) i = 0;
    const [{ p }] = left.splice(i, 1);
    out.push({ key: `${pass}-${p.id}`, product: p, reason: reasonFor(p, input, complements) });
    lastLabels.push(p.labelId);
    if (lastLabels.length > 2) lastLabels.shift();
    prev = p.id;
  }
  return out;
}

/** The first `take` entries of this visitor's feed. Cheap enough to recompute on every load-more (a few hundred sorts of 110 pieces at most). */
export function feedOrder(input: FeedInput, take: number): FeedEntry[] {
  const complements = new Set(input.seed ? styleWith(input.seed, 6).map((p) => p.id) : []);
  const out: FeedEntry[] = [];
  for (let pass = 0; out.length < take && pass < 40; pass++) out.push(...lap(input, pass, complements, out.at(-1)?.product.id ?? null));
  return out.slice(0, take);
}

/** Entries a feed of `blocks` blocks uses: even blocks carry a feature, and every second feature is an editorial (a story or an edit) that takes no product. */
export const BLOCK_CELLS = 12;
export function entriesFor(blocks: number): number {
  let n = 0;
  for (let i = 0; i < blocks; i++) n += i % 2 === 1 ? 12 : Math.floor(i / 2) % 2 === 1 ? 8 : 9;
  return n;
}
