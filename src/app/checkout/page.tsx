import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/commerce/CheckoutFlow";
import { ListingHeader } from "@/components/plp/ListingHeader";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <ListingHeader title="Checkout" crumbs={[{ name: "Bag", href: "/bag" }, { name: "Checkout" }]} intro="Three short steps — address, payment, review. Everything here is simulated; nothing is charged." />
      <CheckoutFlow />
    </>
  );
}
