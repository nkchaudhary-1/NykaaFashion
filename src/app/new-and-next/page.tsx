import type { Metadata } from "next";
import { HubClient } from "@/components/launch/HubClient";

export const metadata: Metadata = {
  title: "New & Next — brand launches",
  description: "Brands arriving on Nykaa Fashion: launch dates and countdowns, exclusive offers and early access, first looks you can wishlist — and the moment each one goes on sale. Sample content.",
};

export default function NewAndNextPage() {
  return <HubClient />;
}
