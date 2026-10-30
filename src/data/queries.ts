import { categoryById, categories } from "./categories.ts";
import { productById, products } from "./catalog.ts";
import { editById, edits } from "./edits.ts";
import { labelById, labels } from "./labels.ts";
import type { Edit, EditRule, Label, Product } from "./types.ts";

export const labelOf = (p: Product): Label => labelById[p.labelId];

export function matchesRule(p: Product, rule: EditRule): boolean {
  const label = labelById[p.labelId];
  if (rule.productIds && !rule.productIds.includes(p.id)) return false;
  if (rule.labelIds && !rule.labelIds.includes(p.labelId)) return false;
  if (rule.flags && !rule.flags.some((f) => label.flags[f])) return false;
  if (rule.responsible && !p.responsible) return false;
  if (rule.anyTags && !rule.anyTags.some((t) => p.tags.includes(t))) return false;
  if (rule.maxPrice !== undefined && p.price > rule.maxPrice) return false;
  if (rule.minDiscount !== undefined && p.discount < rule.minDiscount) return false;
  if (rule.newOnly && !p.isNew) return false;
  return true;
}

export function editProducts(edit: Edit): Product[] {
  const list = products.filter((p) => matchesRule(p, edit.rule));
  if (edit.id === "the-offer-edit") return [...list].sort((a, b) => b.discount - a.discount);
  if (edit.id === "new-in") return [...list].sort((a, b) => a.rank - b.rank);
  return list;
}

/** Editorial edits (by id) a product belongs to — used for signals and "in the same edit" rails. */
export function editsOf(p: Product): Edit[] {
  return edits.filter((e) => e.primary && matchesRule(p, e.rule));
}

export function productsInCategory(id: string): Product[] {
  const path = id.split("/");
  return products.filter((p) => path.every((seg, i) => p.categoryPath[i] === seg));
}

export const productsByLabel = (labelId: string): Product[] => products.filter((p) => p.labelId === labelId);

export function categoryTrail(path: string[]): Array<{ id: string; name: string; href: string }> {
  return path.map((_, i) => {
    const id = path.slice(0, i + 1).join("/");
    return { id, name: categoryById[id]?.name ?? path[i], href: `/c/${id}` };
  });
}

export const allCategoryIds = categories.map((c) => c.id);
export const allEditIds = edits.map((e) => e.id);
export const allLabelIds = labels.map((l) => l.id);

export function isOnOffer(p: Product): boolean {
  return p.discount > 0;
}

/** Plain-text blob used by search. */
export function searchBlob(p: Product): string {
  const l = labelById[p.labelId];
  const cat = p.categoryPath.map((s) => categoryById[p.categoryPath.slice(0, p.categoryPath.indexOf(s) + 1).join("/")]?.name ?? s).join(" ");
  return [p.name, l.name, cat, p.tags.join(" "), p.fabric, p.fit, p.variants.map((v) => `${v.colorName} ${v.family}`).join(" "), p.responsible ? "responsible sustainable" : "", l.flags.hiddenGem ? "hidden gem" : "", l.flags.luxe ? "luxe" : "", l.flags.houseOfNykaa ? "house of nykaa" : ""]
    .join(" ")
    .toLowerCase();
}

export { productById, editById, labelById };
