import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { WishlistView } from "@/components/product/WishlistView";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <>
      <PageHeader title="Your wishlist" size="md" crumbs={[{ name: "Home", href: "/" }, { name: "Wishlist" }]} className="pb-8 sm:pb-10" />
      <WishlistView />
    </>
  );
}
