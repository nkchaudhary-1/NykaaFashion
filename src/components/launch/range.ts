import { launchProducts } from "@/data/catalog";
import type { BrandLaunch } from "@/data/launches";
import { productsByLabel } from "@/data/queries";
import type { Product } from "@/data/types";

/** The pieces of a launch: the catalogue label's products for a brand that is already in the catalogue, otherwise the launch's own previews (real products, kept out of listings). */
export const rangeOf = (l: BrandLaunch): Product[] => (l.brand.labelId ? productsByLabel(l.brand.labelId) : launchProducts.filter((p) => p.labelId === l.id));
