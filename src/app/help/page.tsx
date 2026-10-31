import type { Metadata } from "next";
import { HelpCentre } from "@/components/layout/HelpCentre";
import { ListingHeader } from "@/components/plp/ListingHeader";

export const metadata: Metadata = { title: "Help centre" };

export default function HelpPage() {
  return (
    <>
      <ListingHeader crumbs={[{ name: "Home", href: "/" }, { name: "Help" }]} eyebrow="Help centre" title={<>How can we <em>help?</em></>} intro="Quick answers about orders, delivery and this prototype — or send us a message." />
      <HelpCentre />
    </>
  );
}
