import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/commerce/CheckoutFlow";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <PageHeader title="Checkout" size="md" crumbs={[{ name: "Bag", href: "/bag" }, { name: "Checkout" }]} className="pb-8 sm:pb-10" />
      <CheckoutFlow />
    </>
  );
}
