"use client";
import { useMemo, useState } from "react";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { SIZES } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SimulatedTag } from "@/components/ui/Simulated";
import { Tabs } from "@/components/ui/Tabs";
import { products } from "@/data/catalog";
import type { Product } from "@/data/types";
import { useStore } from "@/lib/store";
import { personalizedRail } from "@/lib/recs";
import { track } from "@/lib/track";
import { wishlistStore } from "@/stores/commerce";
import { intentStore } from "@/stores/intent";

/** Track only — the arrows live in the section header. */
function ProductRailTrack({ products: list, label, source, reasons }: { products: Product[]; label: string; source: string; reasons?: Record<string, string> }) {
  return (
    <CarouselTrack label={label} density="product">
      {list.map((p) => (
        <div key={p.id} className="flex h-full flex-col">
          <ProductCard product={p} source={source} sizes={SIZES.rail} />
          {reasons?.[p.id] && <p className="mt-2 text-[12px] leading-snug text-ink-3">{reasons[p.id]}</p>}
        </div>
      ))}
    </CarouselTrack>
  );
}

// ── Picked for you (simulated) ───────────────────────────────
export function PersonalizedRail() {
  const intent = useStore(intentStore);
  const saved = useStore(wishlistStore).map((i) => i.productId);
  const { items, warm } = useMemo(() => personalizedRail(intent, saved, 8), [intent, saved]);
  const reasons = Object.fromEntries(items.map((r) => [r.product.id, r.reason]));
  return (
    <Section tone="paper" className="border-y border-line">
      <Carousel>
        <SectionHeading size="lg" eyebrow={warm ? "For you" : "Popular right now"} title={warm ? "Picked for you." : "Popular right now."} intro={warm ? "Based on what you’ve viewed and saved on this device." : "Browse and save a few pieces and this rail starts to learn your taste."}>
          <SimulatedTag note="Heuristic scoring over your local browse and save signals — not machine learning. Nothing leaves this browser." />
          <CarouselArrows />
        </SectionHeading>
        <div className="mt-12" onClickCapture={() => track("personalized_rail_click", { warm })}>
          <ProductRailTrack products={items.map((i) => i.product)} label="Picked for you" source="home-rail" reasons={reasons} />
        </div>
      </Carousel>
    </Section>
  );
}

// ── New in by taste: tabs + a product rail, arrows in the header ──
const TABS = [
  { id: "all", label: "All" },
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
  { id: "home", label: "Home & kids" },
];
export function NewInByTaste({ personalised }: { personalised: boolean }) {
  const [tab, setTab] = useState("all");
  const intent = useStore(intentStore);
  const list = useMemo(() => {
    const base = [...products].filter((p) => !p.soldOut).sort((a, b) => Number(b.isNew) - Number(a.isNew) || a.rank - b.rank);
    const taste = (p: Product) => (personalised ? (intent.weights.label[p.labelId] ?? 0) * 1.2 + (intent.weights.category[p.categoryPath.slice(0, 2).join("/")] ?? 0) : 0);
    const filtered = base.filter((p) => (tab === "all" ? true : tab === "home" ? ["home", "kids"].includes(p.categoryPath[0]) : p.categoryPath[0] === tab));
    return filtered.sort((a, b) => Number(b.isNew) * 3 + taste(b) - (Number(a.isNew) * 3 + taste(a)) || a.rank - b.rank).slice(0, 10);
  }, [tab, personalised, intent]);
  return (
    <Section tone="bone">
      <Carousel>
        <SectionHeading size="lg" eyebrow={personalised ? "New in · by your taste" : "New in · editors’ picks"} title={<>Just <em>landed</em></>} href="/edits/new-in" hrefLabel="All new in">
          <CarouselArrows />
        </SectionHeading>
        <Tabs items={TABS} value={tab} onChange={setTab} label="New in categories" className="mt-10 sm:mt-14" panelId="newin-panel" variant="pill" />
        <div className="mt-10" key={tab} role="tabpanel" id="newin-panel" aria-label={`New in — ${TABS.find((t) => t.id === tab)?.label}`}>
          <ProductRailTrack products={list} label="New in" source="home-newin" />
        </div>
      </Carousel>
    </Section>
  );
}
