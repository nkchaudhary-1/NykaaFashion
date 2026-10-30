"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { EditTile } from "@/components/editorial/EditTile";
import { StoryCard } from "@/components/editorial/StoryCard";
import { LabelBadges, LabelMonogram } from "@/components/product/LabelMark";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductRail, Rail } from "@/components/product/Rail";
import { LinkButton } from "@/components/ui/Button";
import { Img, SIZES } from "@/components/ui/Img";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SimulatedTag } from "@/components/ui/Simulated";
import { Tabs } from "@/components/ui/Tabs";
import { products } from "@/data/catalog";
import { editById } from "@/data/edits";
import { labelById } from "@/data/labels";
import { editProducts, productsByLabel } from "@/data/queries";
import { stories } from "@/data/stories";
import type { Product, Story } from "@/data/types";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";
import { personalizedRail } from "@/lib/recs";
import { track } from "@/lib/track";
import { intentStore, signal } from "@/stores/intent";
import { useStore } from "@/lib/store";
import { wishlistStore } from "@/stores/commerce";

// ── Featured edits ────────────────────────────────────────────
export function FeaturedEdits() {
  const lead = ["hidden-gems", "luxe", "responsible"].map((id) => editById[id]);
  return (
    <div className="container-x py-16 sm:py-24">
      <SectionHeading eyebrow="Edits" title={<>Start with a point of view.</>} intro="Curated destinations, not category pages. Each edit has a narrative, a set of labels and a short list of things worth owning." href="/edits" hrefLabel="All edits" />
      <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-3">
        {lead.map((e, i) => (
          <li key={e.id} className={cn(i === 1 && "md:mt-14")}>
            <Reveal delay={i * 90}>
              <EditTile edit={e} />
            </Reveal>
          </li>
        ))}
      </ul>
      <div className="mt-14 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
        {["festive", "house-of-nykaa"].map((id) => {
          const e = editById[id];
          return (
            <Link key={id} href={`/edits/${id}`} onClick={() => signal("edit_open", { editId: id })} className="group flex items-center justify-between gap-6 bg-bone px-6 py-6 transition-colors hover:bg-paper">
              <span>
                <span className="eyebrow block text-ink-3">{e.kicker}</span>
                <span className="display-xs mt-2 block">{e.title}</span>
                <span className="mt-1 block text-[13.5px] text-ink-2">{e.blurb}</span>
              </span>
              <ArrowRight size={22} className="shrink-0 transition-transform duration-300 ease-editorial group-hover:translate-x-1.5" aria-hidden />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Picked for you (simulated) ───────────────────────────────
export function PersonalizedRail() {
  const intent = useStore(intentStore);
  const saved = useStore(wishlistStore).map((i) => i.productId);
  const { items, warm } = useMemo(() => personalizedRail(intent, saved, 8), [intent, saved]);
  const reasons = Object.fromEntries(items.map((r) => [r.product.id, r.reason]));
  return (
    <div className="border-y border-line bg-paper">
      <div className="container-x py-14 sm:py-20">
        <SectionHeading eyebrow={warm ? "For you" : "Popular right now"} title={warm ? "Picked for you." : "Popular right now."} intro={warm ? "Based on what you’ve viewed and saved on this device." : "Browse and save a few pieces and this rail starts to learn your taste."}>
          <SimulatedTag note="Heuristic scoring over your local browse and save signals — not machine learning. Nothing leaves this browser." />
        </SectionHeading>
        <div className="mt-10" onClickCapture={() => track("personalized_rail_click", { warm })}>
          <ProductRail products={items.map((i) => i.product)} label="Picked for you" source="home-rail" reasons={reasons} />
        </div>
      </div>
    </div>
  );
}

// ── Occasion / seasonal edit ─────────────────────────────────
export function OccasionEdit() {
  const edit = editById["festive"];
  const picks = useMemo(() => {
    const preferred = ["lik-01", "til-01", "gaj-01", "aja-02"];
    return preferred.map((id) => products.find((p) => p.id === id)!).filter(Boolean);
  }, []);
  return (
    <div className="container-x py-16 sm:py-24">
      <div className="grid grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative isolate flex min-h-[460px] flex-col justify-end bg-festive text-bone grain">
          <Img imgKey="scenes/edit-festive-tall" alt="" sizes={SIZES.half} ratio="4/5" className="absolute inset-0 h-full w-full opacity-90 mix-blend-luminosity" />
          <div className="relative z-[1] bg-gradient-to-t from-festive via-festive/85 to-transparent p-8 pt-40 sm:p-12 sm:pt-56">
            <p className="eyebrow text-marigold">Festive &amp; wedding</p>
            <h2 className="display-md mt-4 text-balance">Festive, dressed <em>slowly</em>.</h2>
            <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-bone/80">{edit.narrative.split(".")[0]}. Start with one piece you love, then build around it.</p>
            <LinkButton href="/edits/festive" variant="inverse" size="lg" className="mt-8" iconRight={<ArrowRight size={16} />} onClick={() => signal("edit_open", { editId: "festive" })}>
              Shop the edit
            </LinkButton>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 bg-paper p-5 sm:gap-x-5 sm:p-10">
          {picks.map((p, i) => (
            <li key={p.id}>
              <Reveal delay={(i % 2) * 80}>
                <ProductCard product={p} source="home-festive" sizes={SIZES.cardWide} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── New in by taste ──────────────────────────────────────────
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
    return filtered.sort((a, b) => Number(b.isNew) * 3 + taste(b) - (Number(a.isNew) * 3 + taste(a)) || a.rank - b.rank).slice(0, 8);
  }, [tab, personalised, intent]);
  return (
    <div className="container-x py-16 sm:py-24">
      <SectionHeading eyebrow={personalised ? "New in · by your taste" : "New in · editors’ picks"} title="Just landed." href="/edits/new-in" hrefLabel="All new in" />
      <Tabs items={TABS} value={tab} onChange={setTab} label="New in categories" className="mt-8" panelId="newin-panel" />
      <div className="mt-10" key={tab} role="tabpanel" id="newin-panel" aria-label={`New in — ${TABS.find((t) => t.id === tab)?.label}`}>
        <ProductRail products={list} label="New in" source="home-newin" />
      </div>
    </div>
  );
}

// ── Style Files ──────────────────────────────────────────────
export function StoryStrip({ lead }: { lead?: Story }) {
  const [first, ...others] = lead ? [lead, ...stories.filter((s) => s.id !== lead.id)] : stories;
  return (
    <div className="container-x py-16 sm:py-24">
      <SectionHeading eyebrow="Style Files" title="Stories worth the scroll." intro="Shop the story: every image is shoppable, every look is built from pieces you can add without leaving the page." href="/discover" hrefLabel="Read all stories" />
      <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-[1.5fr_1fr_1fr]">
        <Reveal>
          <StoryCard story={first} variant="wide" source="home-stories" />
        </Reveal>
        {others.slice(0, 2).map((s, i) => (
          <Reveal key={s.id} delay={(i + 1) * 90}>
            <StoryCard story={s} source="home-stories" />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ── Label spotlight ──────────────────────────────────────────
export function BrandSpotlight({ labelId, excludeId, eyebrow = "Label spotlight" }: { labelId: string; excludeId?: string; eyebrow?: string }) {
  const label = labelById[labelId];
  const items = productsByLabel(labelId).filter((p) => !p.soldOut && p.id !== excludeId).slice(0, 3);
  return (
    <div className="container-x pb-8 pt-4 sm:pb-12">
      <div className="grid grid-cols-1 gap-10 border-t border-ink pt-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <div>
          <p className="eyebrow text-ink-3">{eyebrow}</p>
          <div className="mt-6 flex items-center gap-5">
            <LabelMonogram label={label} size="lg" />
            <div>
              <h2 className="display-sm">{label.name}</h2>
              {label.origin && <p className="mt-1.5 text-[13px] text-ink-3">{label.origin}{label.founded ? ` · est. ${label.founded}` : ""}</p>}
            </div>
          </div>
          <LabelBadges label={label} className="mt-5" />
          <p className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-ink-2">{label.story}</p>
          <LinkButton href={`/brands/${label.id}`} variant="secondary" size="lg" className="mt-8" iconRight={<ArrowRight size={16} />}>
            Meet the label
          </LinkButton>
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5">
          {items.map((p, i) => (
            <li key={p.id} className={cn(i === 2 && "col-span-2 sm:col-span-1")}>
              <Reveal delay={i * 80}>
                <ProductCard product={p} source="home-brand" sizes={SIZES.cardWide} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Offer edit (demoted by default; promoted on deal intent) ─
export function OfferModule({ promoted }: { promoted: boolean }) {
  const onSale = useMemo(() => editProducts(editById["the-offer-edit"]).filter((p) => !p.soldOut), []);
  const best = Math.max(...onSale.map((p) => p.discount));
  const click = (via: string) => {
    signal("discount_interaction");
    track("home_module_click", { moduleType: "offers", via });
  };
  const shortcuts = [
    { href: "/edits/the-offer-edit", label: `Up to ${best}% off`, sub: `${onSale.length} pieces`, via: "up-to" },
    { href: "/edits/under-1500", label: "Under ₹1,500", sub: "Computed edit", via: "u1500" },
    { href: "/edits/under-3000", label: "Under ₹3,000", sub: "Computed edit", via: "u3000" },
    { href: "/offers", label: "All offers", sub: "Coupons & markdowns", via: "all" },
  ];
  if (!promoted) {
    return (
      <div className="bg-ink text-bone">
        <div className="container-x flex flex-col gap-8 py-12 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow text-bone/60">The Offer Edit</p>
            <h2 className="display-sm mt-3">Fewer sales. <em>Better</em> ones.</h2>
            <p className="mt-2 max-w-[48ch] text-[14px] text-bone/70">Only genuine price moves — we show a discount where one exists, and nowhere else.</p>
          </div>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:w-[58%]">
            {shortcuts.map((s) => (
              <li key={s.href}>
                <Link href={s.href} onClick={() => click(s.via)} className="group flex h-full min-h-[84px] flex-col justify-between border border-bone/25 p-4 transition-colors hover:border-bone hover:bg-bone/10">
                  <span className="text-[15px] font-medium">{s.label}</span>
                  <span className="mt-3 flex items-center justify-between text-[12px] text-bone/60">
                    {s.sub} <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  const featured = onSale.slice(0, 4);
  return (
    <div className="bg-ink text-bone">
      <div className="container-x py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-marigold">You’re looking for offers</p>
            <h2 className="display-lg mt-4">The Offer <em>Edit</em>.</h2>
            <p className="mt-4 max-w-[50ch] text-[15px] text-bone/75">Genuine markdowns, up to {best}% off — straight to the pieces. Curation is still one tap away.</p>
          </div>
          <ul className="flex flex-wrap gap-2.5">
            {shortcuts.map((s) => (
              <li key={s.href}>
                <Link href={s.href} onClick={() => click(s.via)} className="inline-flex h-11 items-center gap-2 border border-bone/40 px-5 text-[13.5px] transition-colors hover:bg-bone hover:text-ink">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
          {featured.map((p) => (
            <li key={p.id}>
              <OfferCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OfferCard({ product: p }: { product: Product }) {
  return (
    <Link href={`/p/${p.slug}`} onClick={() => signal("discount_interaction")} className="group block">
      <div className="relative overflow-hidden">
        <Img imgKey={p.variants[0].images[0]} alt="" sizes={SIZES.cardWide} ratio="4/5" className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.04]" />
        <span className="absolute left-2 top-2 inline-flex h-[22px] items-center bg-bone px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald">{p.discount}% off</span>
      </div>
      <p className="eyebrow mt-3 text-bone/55">{labelById[p.labelId].name}</p>
      <h3 className="mt-1.5 line-clamp-2 text-[14px] leading-snug">{p.name}</h3>
      <p className="mt-1.5 flex items-baseline gap-2 text-[14px] tabular-nums">
        <span className="font-medium">{inr(p.price)}</span>
        <s className="text-[12.5px] text-bone/55">{inr(p.mrp)}</s>
      </p>
    </Link>
  );
}

export { Rail };
