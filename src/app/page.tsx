import type { Metadata } from "next";
import { HomeClient } from "@/components/home/HomeClient";

export const metadata: Metadata = { title: { absolute: "Nykaa Fashion — redesign prototype: women, men, kids and home" } };

export default function HomePage() {
  return <HomeClient />;
}
