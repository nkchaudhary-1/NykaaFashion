import type { Metadata } from "next";
import { HomeClient } from "@/components/home/HomeClient";

export const metadata: Metadata = { title: { absolute: "Nykaa Fashion — discover by taste, not discount" } };

export default function HomePage() {
  return <HomeClient />;
}
