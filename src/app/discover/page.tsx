import type { Metadata } from "next";
import { DiscoverIndex } from "@/components/editorial/DiscoverIndex";
import { ListingHeader } from "@/components/plp/ListingHeader";

export const metadata: Metadata = { title: "Discover — the Style Files", description: "Shoppable stories on makers, occasions and the way we dress now." };

export default function DiscoverPage() {
  return (
    <>
      <ListingHeader crumbs={[{ name: "Home", href: "/" }, { name: "Discover" }]} eyebrow="The Style Files · Issue 07" title={<>Stories, <em>made shoppable.</em></>} intro="Read first, shop second. Every image is shoppable, every look is built from pieces you can add without leaving the story." />
      <DiscoverIndex />
    </>
  );
}
