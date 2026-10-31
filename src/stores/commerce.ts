import { productById } from "@/data/catalog";
import { lockedUntil } from "@/data/launches";
import type { Product, Variant } from "@/data/types";
import { nowMs } from "@/lib/clock";
import { launchNow } from "@/lib/launch-clock";
import { createStore, useStore, useStoreSelector } from "@/lib/store";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";

// ── Wishlist ─────────────────────────────────────────────────
export interface WishlistItem {
  productId: string;
  variant: number;
  addedAt: number;
}
export const wishlistStore = createStore<WishlistItem[]>("nf.wishlist", []);

export function toggleWishlist(productId: string, variant = 0, source = "unknown"): boolean {
  const exists = wishlistStore.get().some((i) => i.productId === productId);
  if (exists) {
    wishlistStore.set((p) => p.filter((i) => i.productId !== productId));
    return false;
  }
  wishlistStore.set((p) => [{ productId, variant, addedAt: nowMs() }, ...p]);
  track("product_save", { productId, source });
  signal("product_save", { productId });
  return true;
}
export const removeFromWishlist = (productId: string) => wishlistStore.set((p) => p.filter((i) => i.productId !== productId));
export const useWishlist = () => useStore(wishlistStore);
export const useIsSaved = (productId: string) => useStoreSelector(wishlistStore, (items) => items.some((i) => i.productId === productId));

// ── Bag ──────────────────────────────────────────────────────
export interface BagLine {
  id: string;
  productId: string;
  variant: number;
  size: string;
  qty: number;
  addedAt: number;
}
export interface BagState {
  lines: BagLine[];
  coupon: string | null;
}
export const BAG_INITIAL: BagState = { lines: [], coupon: null };
export const bagStore = createStore<BagState>("nf.bag", BAG_INITIAL);
export const MAX_QTY = 6;

export const stockFor = (product: Product, variant: number, size: string) => product.variants[variant]?.stock[size] ?? 0;

export type AddResult = { ok: true; line: BagLine; merged: boolean } | { ok: false; reason: "no-size" | "oos" | "max" | "locked"; until?: number };

export function addToBag(productId: string, variant: number, size: string | null, qty = 1, source = "pdp"): AddResult {
  const product = productById[productId];
  const until = lockedUntil(productId, launchNow()); // a brand that has not launched yet: the wishlist, a bookmark or a stale tab cannot put its pieces in the bag
  if (until) return { ok: false, reason: "locked", until };
  if (!product || !size) return { ok: false, reason: "no-size" };
  const stock = stockFor(product, variant, size);
  if (stock <= 0) return { ok: false, reason: "oos" };
  const id = `${productId}:${variant}:${size}`;
  const existing = bagStore.get().lines.find((l) => l.id === id);
  const limit = Math.min(stock, MAX_QTY);
  if (existing && existing.qty >= limit) return { ok: false, reason: "max" };
  let line: BagLine;
  if (existing) {
    line = { ...existing, qty: Math.min(limit, existing.qty + qty) };
    bagStore.set((p) => ({ ...p, lines: p.lines.map((l) => (l.id === id ? line : l)) }));
  } else {
    line = { id, productId, variant, size, qty: Math.min(limit, qty), addedAt: nowMs() };
    bagStore.set((p) => ({ ...p, lines: [line, ...p.lines] }));
  }
  track("add_to_bag", { productId, size, source });
  signal("add_to_bag", { productId });
  return { ok: true, line, merged: !!existing };
}

export function setLineQty(id: string, qty: number) {
  bagStore.set((p) => ({
    ...p,
    lines: p.lines.map((l) => {
      if (l.id !== id) return l;
      const product = productById[l.productId];
      const stock = product ? stockFor(product, l.variant, l.size) : MAX_QTY;
      return { ...l, qty: Math.max(1, Math.min(qty, stock, MAX_QTY)) };
    }),
  }));
}
export const removeLine = (id: string) => bagStore.set((p) => ({ ...p, lines: p.lines.filter((l) => l.id !== id) }));
export function moveLineToWishlist(id: string) {
  const line = bagStore.get().lines.find((l) => l.id === id);
  if (!line) return;
  if (!wishlistStore.get().some((i) => i.productId === line.productId)) {
    wishlistStore.set((p) => [{ productId: line.productId, variant: line.variant, addedAt: nowMs() }, ...p]);
    track("product_save", { productId: line.productId, source: "bag" });
  }
  removeLine(id);
}
export const setCoupon = (code: string | null) => bagStore.set((p) => ({ ...p, coupon: code }));
export const clearBag = () => bagStore.set(BAG_INITIAL);

export interface ResolvedLine extends BagLine {
  product: Product;
  variantData: Variant;
  stock: number;
}
export function resolveLines(lines: BagLine[]): ResolvedLine[] {
  return lines.flatMap((l) => {
    const product = productById[l.productId];
    if (!product) return [];
    const variantData = product.variants[l.variant] ?? product.variants[0];
    return [{ ...l, product, variantData, stock: variantData.stock[l.size] ?? 0 }];
  });
}
export function useBag() {
  const state = useStore(bagStore);
  const lines = resolveLines(state.lines);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return { state, lines, count, coupon: state.coupon };
}
