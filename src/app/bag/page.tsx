import type { Metadata } from "next";
import { BagView } from "@/components/commerce/BagView";

export const metadata: Metadata = { title: "Your bag" };

/** BagView draws its own page header so the intro line can follow the live bag. */
export default function BagPage() {
  return <BagView />;
}
