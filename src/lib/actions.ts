import { labelById } from "@/data/labels";
import type { Product } from "@/data/types";
import { addToBag, toggleWishlist } from "@/stores/commerce";
import { setUI, toast } from "@/stores/ui";

/** Wishlist toggle with immediate feedback (PRD §7.1). Returns the new saved state. */
export function saveWithFeedback(product: Product, variant = 0, source = "card"): boolean {
  const saved = toggleWishlist(product.id, variant, source);
  toast(saved ? { title: "Saved to your wishlist", description: product.name, action: { label: "View", href: "/wishlist" } } : { title: "Removed from wishlist", description: product.name });
  return saved;
}

/** Add to bag; opens the mini-bag on desktop, or confirms with a toast on touch layouts. */
export function addToBagWithFeedback(product: Product, variant: number, size: string | null, source = "pdp") {
  const r = addToBag(product.id, variant, size, 1, source);
  if (!r.ok) {
    if (r.reason === "max") toast({ title: "You’ve reached the limit for this item", description: "That’s all we have in stock for this size.", tone: "error" });
    else if (r.reason === "oos") toast({ title: "That size just sold out", tone: "error" });
    return r;
  }
  if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) setUI({ bagOpen: true, quickView: null });
  else toast({ title: r.merged ? "Quantity updated in your bag" : "Added to your bag", description: `${labelById[product.labelId].name} · ${product.name}${size && size !== "One size" ? ` · ${size}` : ""}`, action: { label: "View bag", href: "/bag" } });
  return r;
}
