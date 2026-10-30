import type { Metadata } from "next";
import { WishlistView } from "@/components/product/WishlistView";

export const metadata: Metadata = { title: "Wishlist" };

/** WishlistView draws its own page header so the intro line can follow what is saved. */
export default function WishlistPage() {
  return <WishlistView />;
}
