import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LabelDirectory } from "@/components/product/LabelDirectory";

export const metadata: Metadata = { title: "All labels", description: "Every label on Nykaa Fashion, from independent Hidden Gems to Luxe ateliers and House of Nykaa." };

export default function BrandsIndex() {
  return (
    <>
      <PageHeader crumbs={[{ name: "Home", href: "/" }, { name: "Labels" }]} eyebrow="A–Z" title={<>Labels, <em>with their stories.</em></>} intro="Independent studios, ateliers and our own House of Nykaa labels — filter by what they stand for." size="lg" />
      <LabelDirectory />
    </>
  );
}
