import type { Metadata } from "next";
import { BagView } from "@/components/commerce/BagView";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Your bag" };

export default function BagPage() {
  return (
    <>
      <PageHeader title="Your bag" size="md" crumbs={[{ name: "Home", href: "/" }, { name: "Bag" }]} className="pb-8 sm:pb-10" />
      <BagView />
    </>
  );
}
