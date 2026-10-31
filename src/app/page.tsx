import type { Metadata } from "next";
import { HomeClient } from "@/components/home/HomeClient";
import { IS_STAGING } from "@/lib/channel";

export const metadata: Metadata = { title: { absolute: `Nykaa Fashion — redesign prototype: women, men, kids and home${IS_STAGING ? " (staging)" : ""}` } };

export default function HomePage() {
  return <HomeClient />;
}
