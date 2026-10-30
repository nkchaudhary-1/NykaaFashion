import { primaryEdits } from "@/data/edits";
import { labelById } from "@/data/labels";
import { matchesRule } from "@/data/queries";
import type { Edit, Label, Product } from "@/data/types";

/**
 * Feature inserts for the product grid (see ListingGrid): a 6-column × 2-row tile that breaks up the 4-up rhythm.
 * Plain serialisable data, so a server page can choose the features that suit its context and hand them to the listing.
 *  - hero   a product from the list itself, shown large (the list gives one up, so it is never shown twice)
 *  - tile   an image promo — a related edit, a label, a trending search
 *  - note   a flat info panel: a short headline and a line or two (a label's story, an edit's promise), on an edit's surface (see surfaces.ts)
 */
export type Feature =
  | { kind: "hero" }
  | { kind: "tile"; href: string; imgKey: string; title: string; meta?: string; position?: string; editId?: string }
  | { kind: "note"; title: string; text: string; tone: Edit["theme"]; eyebrow?: string; href?: string; cta?: string };

/**
 * Feature boxes are tall (6 columns × 2 rows) and crop a 4:5 product shot at the sides. That suits a garment on a hanger and cuts a
 * necklace, a bag or a stack of fabric in half — so heroes and label promos prefer garments.
 */
const GARMENT = /^(women\/(dresses|indianwear|tops|knitwear|bottoms|jackets)|men\/(shirts|tees|ethnic|trousers|jackets)|kids\/(girls|boys))/;
export const isGarment = (p: Product) => GARMENT.test(p.categoryPath.join("/"));

/** Edits whose rules overlap this pool the most — "related edit" promos for category pages. */
export function relatedEditTiles(pool: Product[], take = 2, skip: string[] = []): Feature[] {
  return primaryEdits
    .filter((e) => !skip.includes(e.id))
    .map((e) => ({ e, n: pool.filter((p) => matchesRule(p, e.rule)).length }))
    .filter((x) => x.n >= 3)
    .sort((a, b) => b.n - a.n)
    .slice(0, take)
    .map(({ e }) => ({ kind: "tile" as const, href: `/edits/${e.id}`, imgKey: `scenes/edit-${e.id}-tall`, title: e.title, meta: e.blurb, editId: e.id }));
}

/** Labels with the most products in this pool, as image promos (a representative product from the label). */
export function labelTiles(pool: Product[], take = 2, skip: string[] = []): Feature[] {
  const counts = new Map<string, number>();
  for (const p of pool) counts.set(p.labelId, (counts.get(p.labelId) ?? 0) + 1);
  return Array.from(counts.entries())
    .filter(([id]) => !skip.includes(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([id, n]) => {
      const l = labelById[id];
      // a garment from further down the list, so the promo doesn't repeat the picture at the top of the grid
      const mine = pool.filter((p) => p.labelId === id && !p.soldOut).sort((a, b) => Number(isGarment(b)) - Number(isGarment(a)) || b.rank - a.rank);
      const rep = mine[0] ?? pool.find((p) => p.labelId === id)!;
      return { kind: "tile" as const, href: `/brands/${id}`, imgKey: rep.variants[0].images[0], title: l.name, meta: `${l.tagline}` };
    });
}

/** An edit's promise ("Artisan-led", "Small batch" …) as an info panel on the edit's own surface. */
export function highlightNotes(edit: Edit, take = 1): Feature[] {
  return edit.highlights.slice(0, take).map((h) => ({ kind: "note" as const, tone: edit.theme, eyebrow: edit.kicker, title: h.title, text: h.text }));
}

/** A label's story as an info panel on the soft grey surface. */
export function labelStoryNote(label: Label): Feature {
  return { kind: "note", tone: "sand", eyebrow: [label.origin, label.founded ? `est. ${label.founded}` : null].filter(Boolean).join(" · ") || "The label", title: label.tagline, text: label.story };
}

/** Round-robin merge, so different kinds of feature alternate down the page. */
export function interleave<T>(...lists: T[][]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(0, ...lists.map((l) => l.length)); i++) for (const l of lists) if (i < l.length) out.push(l[i]);
  return out;
}
