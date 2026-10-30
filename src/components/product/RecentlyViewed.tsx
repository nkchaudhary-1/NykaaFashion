"use client";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { recentlyViewed } from "@/lib/recs";
import { useStore } from "@/lib/store";
import { intentStore } from "@/stores/intent";
import { ProductRail } from "./Rail";

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const intent = useStore(intentStore);
  const items = recentlyViewed(intent, 9).filter((p) => p.id !== excludeId).slice(0, 8);
  if (items.length < 2) return null;
  return (
    <section aria-labelledby="rv" className="container-x pb-16 pt-4 sm:pb-24">
      <SectionHeading level={2} title={<span id="rv">Recently Viewed</span>} />
      <div className="mt-10">
        <ProductRail products={items} label="Recently viewed" source="recently-viewed" />
      </div>
    </section>
  );
}
