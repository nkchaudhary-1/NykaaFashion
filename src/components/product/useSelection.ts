"use client";
import { useCallback, useState, type RefObject } from "react";
import type { Product } from "@/data/types";
import { addToBagWithFeedback } from "@/lib/actions";
import { setUI } from "@/stores/ui";

/** Variant + size selection shared by the PDP and quick view. Blocks add until a size is chosen and says why (PRD §6.1). */
export function useProductSelection(product: Product, initialVariant: number, groupRef: RefObject<HTMLDivElement | null>) {
  const [variant, setVariant] = useState(Math.min(initialVariant, product.variants.length - 1));
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(0);

  const stock = size ? (product.variants[variant].stock[size] ?? 0) : null;
  const soldOutSize = size !== null && stock === 0;

  const choose = useCallback((s: string) => {
    setSize(s);
    setError(false);
  }, []);

  const requireSize = useCallback(() => {
    setError(true);
    setShake((n) => n + 1);
    groupRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    groupRef.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
  }, [groupRef]);

  /** returns true when the item was added */
  const add = useCallback(
    (source: string) => {
      if (!size) {
        requireSize();
        return false;
      }
      if (soldOutSize) {
        setUI({ notifyMe: { productId: product.id, size } });
        return false;
      }
      return addToBagWithFeedback(product, variant, size, source).ok;
    },
    [size, soldOutSize, product, variant, requireSize],
  );

  return { variant, setVariant, size, choose, error, shake, stock, soldOutSize, add, requireSize };
}
export type Selection = ReturnType<typeof useProductSelection>;
