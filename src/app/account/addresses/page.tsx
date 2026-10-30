import type { Metadata } from "next";
import { AddressesView } from "@/components/account/AddressesView";

export const metadata: Metadata = { title: "Saved addresses" };

export default function AddressesPage() {
  return <AddressesView />;
}
