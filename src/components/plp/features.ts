import { THEMES, primaryEdits } from "@/data/edits";
import { labelById } from "@/data/labels";
import { matchesRule } from "@/data/queries";
import type { Edit, Label, Product } from "@/data/types";

/**
 * Feature inserts for the product grid (see ListingGrid): a 6-column × 2-row tile that breaks up the 4-up rhythm.
 * Plain serialisable data, so a server page can choose the features that suit its context and hand them to the listing.
 *  - hero   a product from the list itself, shown large (the list gives one up, so it is never shown twice)
 *  - tile   an image promo — a related edit, a label, a trending search
 *  - quote  a flat colour panel with a pull-quote (a label's story, an edit's promise)
 */
export type Feature =
  | { kind: "hero" }
  | { kind: "tile"; href: string; imgKey: string; title: string; meta?: string; position?: string; editId?: string }
  | { kind: "quote"; text: string; eyebrow?: string; by?: string; bg: string; fg: string; href?: string; cta?: string };

export const pieces = (n: number) => `${n} ${n === 1 ? "piece" : "pieces"}`;

/** Edits whose rules overlap this pool the most — "related edit" promos for category pages. */
export function relatedEditTiles(pool: Product[], take = 2, skip: string[] = []): Feature[] {
  return primaryEdits
    .filter((e) => !skip.includes(e.id))
    .map((e) => ({ e, n: pool.filter((p) => matchesRule(p, e.rule)).length }))
    .filter((x) => x.n >= 3)
    .sort((a, b) => b.n - a.n)
    .slice(0, take)
    .map(({ e, n }) => ({ kind: "tile" as const, href: `/edits/${e.id}`, imgKey: `scenes/edit-${e.id}-tall`, title: e.title, meta: `${e.kicker} · ${pieces(n)} here`, editId: e.id }));
}

/** Labels with the most pieces in this pool, as image promos (a representative product from the label). */
export function labelTiles(pool: Product[], take = 2, skip: string[] = []): Feature[] {
  const counts = new Map<string, number>();
  for (const p of pool) counts.set(p.labelId, (counts.get(p.labelId) ?? 0) + 1);
  return Array.from(counts.entries())
    .filter(([id]) => !skip.includes(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([id, n]) => {
      const l = labelById[id];
      const rep = pool.find((p) => p.labelId === id && !p.soldOut) ?? pool.find((p) => p.labelId === id)!;
      return { kind: "tile" as const, href: `/brands/${id}`, imgKey: rep.variants[0].images[0], title: l.name, meta: `${l.tagline}` };
    });
}

/** An edit's promise ("Artisan-led", "Small batch" …) as a pull-quote on the edit's own colour. */
export function highlightQuotes(edit: Edit, take = 1): Feature[] {
  const t = THEMES[edit.theme];
  return edit.highlights.slice(0, take).map((h) => ({ kind: "quote" as const, eyebrow: edit.kicker, text: `${h.title}. ${h.text}`, bg: t.bg, fg: t.fg }));
}

/** A label's story as a pull-quote on the label's own colour. */
export function labelStoryQuote(label: Label): Feature {
  return { kind: "quote", eyebrow: [label.origin, label.founded ? `est. ${label.founded}` : null].filter(Boolean).join(" · ") || "The label", text: label.story, by: label.name, bg: label.tone.bg, fg: label.tone.fg };
}

/** Round-robin merge, so different kinds of feature alternate down the page. */
export function interleave<T>(...lists: T[][]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(0, ...lists.map((l) => l.length)); i++) for (const l of lists) if (i < l.length) out.push(l[i]);
  return out;
}
