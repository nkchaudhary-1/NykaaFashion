"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { ShoppableImage } from "@/components/editorial/ShoppableImage";
import { LabelBadges, LabelMonogram } from "@/components/product/LabelMark";
import { ProductCard } from "@/components/product/ProductCard";
import { BentoTile } from "@/components/ui/BentoTile";
import { LinkButton } from "@/components/ui/Button";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { Img, SIZES } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SimulatedTag } from "@/components/ui/Simulated";
import { Tabs } from "@/components/ui/Tabs";
import { productById, products } from "@/data/catalog";
import { categoryById } from "@/data/categories";
import { editById } from "@/data/edits";
import { labelById } from "@/data/labels";
import { editProducts, productsByLabel, productsInCategory } from "@/data/queries";
import { stories } from "@/data/stories";
import type { Product, Story } from "@/data/types";
import { inr } from "@/lib/format";
import { imgPins } from "@/lib/img";
import { personalizedRail } from "@/lib/recs";
import { track } from "@/lib/track";
import { intentStore, signal } from "@/stores/intent";
import { setUI } from "@/stores/ui";
import { useStore } from "@/lib/store";
import { wishlistStore } from "@/stores/commerce";

const pieces = (n: number) => `${n} ${n === 1 ? "piece" : "pieces"}`;

// ── Shop by category: one big tile + a 2×2 of 4:5 tiles on the 12-column grid ──
export function CategoryMosaic() {
  const dept = (id: string) => ({ id, name: categoryById[id].name, n: productsInCategory(id).length });
  const jewellery = productsInCategory("women/jewellery");
  const jewel = jewellery.find((p) => !p.soldOut) ?? jewellery[0];
  const small = [
    { href: "/c/men", img: "scenes/cat-men", ...dept("men") },
    { href: "/c/kids", img: "scenes/cat-kids", ...dept("kids") },
    { href: "/c/home", img: "scenes/cat-home", ...dept("home") },
  ];
  const women = dept("women");
  return (
    <Section>
      <SectionHeading eyebrow="Departments" title="Shop by category" intro="Four departments, one edit. Start wherever you are." />
      <Grid className="mt-10 gap-y-[var(--gap)] sm:mt-14">
        <Col span={{ base: 4, sm: 12, lg: 6 }} rows={{ lg: 2 }} className="relative aspect-[5/4] sm:aspect-[16/9] lg:aspect-auto">
          <BentoTile href="/c/women" imgKey="scenes/cat-women" title={women.name} meta={pieces(women.n)} ratio="fill" sizes={SIZES.half} size="lg" position="50% 30%" />
        </Col>
        {small.map((c) => (
          <Col key={c.id} span={{ base: 2, sm: 6, lg: 3 }}>
            <BentoTile href={c.href} imgKey={c.img} title={c.name} meta={pieces(c.n)} sizes={SIZES.tile} />
          </Col>
        ))}
        {jewel && (
          <Col span={{ base: 2, sm: 6, lg: 3 }}>
            <BentoTile href="/c/women/jewellery" imgKey={jewel.variants[0].images[0]} title="Jewellery" meta={pieces(jewellery.length)} sizes={SIZES.tile} />
          </Col>
        )}
      </Grid>
    </Section>
  );
}

// ── Featured edits: asymmetric bento (the big tile sits on the right this time) ──
export function FeaturedEdits() {
  const gem = editById["hidden-gems"];
  const rest = ["luxe", "responsible", "festive", "house-of-nykaa"].map((id) => editById[id]);
  const open = (id: string) => () => signal("edit_open", { editId: id });
  const computed = [
    ["/edits/new-in", "New in"],
    ["/edits/under-1500", "Under ₹1,500"],
    ["/edits/under-3000", "Under ₹3,000"],
    ["/edits/the-offer-edit", "The Offer Edit"],
  ];
  return (
    <Section tone="paper">
      <SectionHeading eyebrow="Curated destinations" title={<>Luxe, Hidden Gems <em>&amp; more</em></>} intro="Curated destinations on Nykaa Fashion — each with its own story, labels and a short list of pieces worth owning." href="/edits" hrefLabel="All destinations" />
      <Grid className="mt-10 gap-y-[var(--gap)] sm:mt-14">
        <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 7 }} rowStart={{ lg: 1 }} rows={{ lg: 2 }} className="relative aspect-[5/4] sm:aspect-[16/9] lg:aspect-auto">
          <BentoTile href="/edits/hidden-gems" imgKey="scenes/edit-hidden-gems-tall" title={gem.title} meta={`${gem.blurb}`} ratio="fill" sizes={SIZES.half} size="lg" onClick={open(gem.id)} position="50% 35%" />
        </Col>
        {rest.map((e, i) => (
          <Col key={e.id} span={{ base: 2, sm: 6, lg: 3 }} start={{ lg: i % 2 ? 4 : 1 }} rowStart={{ lg: i < 2 ? 1 : 2 }}>
            <BentoTile href={`/edits/${e.id}`} imgKey={`scenes/edit-${e.id}-tall`} title={e.title} meta={pieces(editProducts(e).length)} sizes={SIZES.tile} onClick={open(e.id)} />
          </Col>
        ))}
      </Grid>
      <ul className="mt-[var(--gap)] grid grid-cols-2 gap-[var(--gap)] sm:grid-cols-4">
        {computed.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="group flex h-14 items-center justify-between border border-ink px-4 text-[14px] font-medium transition-colors hover:bg-ink hover:text-bone">
              {label}
              <ArrowRight size={16} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
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
        <SectionHeading eyebrow={warm ? "For you" : "Popular right now"} title={warm ? "Picked for you." : "Popular right now."} intro={warm ? "Based on what you’ve viewed and saved on this device." : "Browse and save a few pieces and this rail starts to learn your taste."}>
          <SimulatedTag note="Heuristic scoring over your local browse and save signals — not machine learning. Nothing leaves this browser." />
          <CarouselArrows />
        </SectionHeading>
        <div className="mt-10" onClickCapture={() => track("personalized_rail_click", { warm })}>
          <ProductRailTrack products={items.map((i) => i.product)} label="Picked for you" source="home-rail" reasons={reasons} />
        </div>
      </Carousel>
    </Section>
  );
}

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

// ── New in by taste: product carousel, arrows in the header ──
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
    <Section>
      <Carousel>
        <SectionHeading eyebrow={personalised ? "New in · by your taste" : "New in · editors’ picks"} title={<>Just <em>landed</em></>} href="/edits/new-in" hrefLabel="All new in">
          <CarouselArrows />
        </SectionHeading>
        <Tabs items={TABS} value={tab} onChange={setTab} label="New in categories" className="mt-8" panelId="newin-panel" variant="pill" />
        <div className="mt-8" key={tab} role="tabpanel" id="newin-panel" aria-label={`New in — ${TABS.find((t) => t.id === tab)?.label}`}>
          <ProductRailTrack products={list} label="New in" source="home-newin" />
        </div>
      </Carousel>
    </Section>
  );
}

// ── Trending: mixed-size grid — one feature piece (6 columns × 2 rows) + four standard cards ──
function trendingPicks(): Product[] {
  const best = (top: string, skip: Set<string>) => products.filter((p) => !p.soldOut && p.categoryPath[0] === top && !skip.has(p.id)).sort((a, b) => a.rank - b.rank)[0];
  const used = new Set<string>();
  const out: Product[] = [];
  for (const top of ["women", "men", "home", "women", "kids"]) {
    const p = best(top, used);
    if (p) {
      used.add(p.id);
      out.push(p);
    }
  }
  return out;
}
export function TrendingGrid() {
  const [feature, ...rest] = useMemo(() => trendingPicks(), []);
  if (!feature) return null;
  return (
    <Section tone="paper">
      <SectionHeading eyebrow="Trending now" title={<>Most wanted <em>right now</em></>} intro="The pieces added to wishlists most this week — from every department, in one grid." />
      <Grid className="mt-10 gap-y-10 sm:mt-14">
        <Col span={{ base: 4, sm: 6, lg: 6 }} rows={{ sm: 2, lg: 2 }} className="flex flex-col">
          <Reveal className="flex min-h-0 flex-1 flex-col">
            <ProductCard product={feature} source="home-trending" sizes={SIZES.half} fill className="flex-1" />
          </Reveal>
        </Col>
        {rest.slice(0, 4).map((p, i) => (
          <Col key={p.id} span={{ base: 2, sm: 3, lg: 3 }}>
            <Reveal delay={(i % 2) * 70} className="h-full">
              <ProductCard product={p} source="home-trending" sizes={SIZES.cardWide} />
            </Reveal>
          </Col>
        ))}
      </Grid>
    </Section>
  );
}

// ── Shop the look: a shoppable scene (8 columns) + the pieces in it (4 columns, 3-up on tablets) ──
export function ShopTheLook({ story }: { story: Story }) {
  const items = imgPins(story.cover.wide).map((p) => productById[p.id]).filter((p): p is Product => !!p);
  if (!items.length) return null;
  return (
    <Section tone="paper">
      <SectionHeading eyebrow="Shop the look" title="Everything in the picture." intro="Tap a pin for a closer look, or pick a piece from the list — every look is built from things you can add without leaving the page." href={`/discover/${story.id}`} hrefLabel="Read the story" />
      <Grid className="mt-10 gap-y-8 sm:mt-14">
        <Col span={{ base: 4, sm: 12, lg: 8 }}>
          <ShoppableImage imgKey={story.cover.wide} alt={`${story.title} — shop the pieces in this look`} sizes={SIZES.half} ratio="16/9" />
        </Col>
        <Col span={{ base: 4, sm: 12, lg: 4 }} className="flex flex-col">
          <p className="eyebrow pb-4 text-ink-3 lg:pt-0">
            {story.kicker} · {story.title}
          </p>
          <ol aria-label="Pieces in this look" className="grid flex-1 border-t border-ink sm:grid-cols-3 sm:gap-x-[var(--gap)] sm:border-t-0 lg:grid-cols-1 lg:grid-rows-3 lg:border-t">
            {items.map((p) => (
              <li key={p.id} className="border-b border-line sm:border-b-0 lg:border-b">
                <div className="grid h-full grid-cols-4 gap-x-[var(--gap)] py-4 sm:grid-cols-1 sm:gap-y-3 sm:py-0 lg:grid-cols-4 lg:gap-y-0 lg:py-5">
                  <Link href={`/p/${p.slug}`} className="block overflow-hidden bg-sand" tabIndex={-1} aria-hidden>
                    <Img imgKey={p.variants[0].images[0]} alt="" sizes="(min-width:1024px) 8vw, (min-width:600px) 30vw, 22vw" ratio="4/5" />
                  </Link>
                  <div className="col-span-3 flex min-w-0 flex-col sm:col-span-1 lg:col-span-3">
                    <p className="eyebrow truncate text-ink-3">{labelById[p.labelId].name}</p>
                    <Link href={`/p/${p.slug}`} className="link-u mt-1.5 line-clamp-2 text-[15px] leading-snug">
                      {p.name}
                    </Link>
                    <Price price={p.price} mrp={p.mrp} size="md" className="mt-2" />
                    <button type="button" onClick={() => setUI({ quickView: { productId: p.id, variant: 0 } })} className="tap mt-auto inline-flex h-10 items-center self-start border border-ink px-4 text-[11px] font-semibold uppercase tracking-[0.09em] transition-colors hover:bg-ink hover:text-bone" aria-label={`Quick view ${p.name}`}>
                      Quick view
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Col>
      </Grid>
    </Section>
  );
}

// ── Festive: full-bleed banner (flat colour panel + scene) and a 4-up row of picks ──
export function OccasionEdit() {
  const edit = editById["festive"];
  const picks = useMemo(() => ["lik-01", "til-01", "gaj-01", "aja-02"].map((id) => products.find((p) => p.id === id)!).filter(Boolean), []);
  return (
    <>
      <Section tone="festive" y="none">
        <Grid>
          <Col span={{ base: 4, sm: 12, lg: 6 }} className="flex flex-col justify-center py-14 sm:py-16 lg:py-20 lg:pr-[var(--gap)]">
            <p className="eyebrow text-marigold">Festive &amp; wedding</p>
            <h2 className="display-md mt-5">Festive, dressed <em>slowly.</em></h2>
            <p className="mt-5 max-w-[42ch] text-[16px] leading-relaxed text-bone">{edit.narrative.split(".")[0]}. Start with one piece you love, then build around it.</p>
            <LinkButton href="/edits/festive" variant="inverse" size="lg" className="mt-8 self-start" iconRight={<ArrowRight size={16} />} onClick={() => signal("edit_open", { editId: "festive" })}>
              Shop the edit
            </LinkButton>
          </Col>
          {/* starts on the centre axis (column 7) and bleeds off the right edge; on phones/tablets it runs edge to edge */}
          <Col span={{ base: 4, sm: 12, lg: 6 }} className="relative -mx-[var(--gutter)] aspect-[16/10] lg:mx-0 lg:-mr-[var(--edge)] lg:aspect-auto lg:min-h-[480px]">
            <Img imgKey="scenes/edit-festive-wide" alt="" sizes={SIZES.half} ratio="fill" position="70% 50%" className="absolute inset-0 h-full" />
          </Col>
        </Grid>
      </Section>
      <Section y="sm">
        <ul className="grid-main gap-y-8">
          {picks.map((p, i) => (
            <Col as="li" key={p.id} span={{ base: 2, sm: 6, lg: 3 }}>
              <Reveal delay={(i % 4) * 70}>
                <ProductCard product={p} source="home-festive" sizes={SIZES.cardWide} />
              </Reveal>
            </Col>
          ))}
        </ul>
      </Section>
    </>
  );
}

// ── Style Files: a lead story (7 columns) beside two compact horizontal stories (5 columns) ──
function StoryMeta({ s }: { s: Story }) {
  return (
    <p className="eyebrow text-ink-3">
      {s.kicker} · {s.readMins} min
    </p>
  );
}
export function StoryStrip({ list }: { list: Story[] }) {
  const [first, ...others] = list;
  if (!first) return null;
  const open = (s: Story) => () => {
    signal("story_open", { editId: s.editId, tags: s.tags });
    track("editorial_story_open", { storyId: s.id, source: "home-stories" });
  };
  return (
    <Section>
      <SectionHeading eyebrow="Style Files" title={<>Style inspiration, <em>shoppable</em></>} intro="Every image is shoppable, every look is built from pieces you can add without leaving the story." href="/discover" hrefLabel="Read all stories" splitAt={7} />
      <Grid className="mt-10 gap-y-12 sm:mt-14">
        <Col span={{ base: 4, sm: 12, lg: 7 }}>
          <Reveal>
            <Link href={`/discover/${first.id}`} onClick={open(first)} className="group block">
              <div className="overflow-hidden bg-sand">
                <Img imgKey={first.cover.wide} alt="" sizes={SIZES.half} ratio="16/10" className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.02]" />
              </div>
              <div className="mt-5">
                <StoryMeta s={first} />
                <h3 className="display-sm mt-3">{first.title}</h3>
                <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">{first.dek}</p>
              </div>
            </Link>
          </Reveal>
        </Col>
        <Col span={{ base: 4, sm: 12, lg: 5 }} className="grid grid-cols-2 content-start gap-x-[var(--gap)] gap-y-10 lg:grid-cols-1">
          {others.slice(0, 2).map((s, i) => (
            <Reveal key={s.id} delay={(i + 1) * 90}>
              {/* below lg: a vertical card (2 of the 4 / 6 of the 12 columns); at lg: image on 2 of the 5 columns, text on 3 */}
              <Link href={`/discover/${s.id}`} onClick={open(s)} className="group grid gap-x-[var(--gap)] lg:grid-cols-5">
                <div className="overflow-hidden bg-sand lg:col-span-2">
                  <Img imgKey={s.cover.tall} alt="" sizes="(min-width:1024px) 20vw, 50vw" ratio="4/5" className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.03]" />
                </div>
                <div className="mt-4 flex flex-col lg:col-span-3 lg:mt-0">
                  <StoryMeta s={s} />
                  <h3 className="display-xs mt-3">{s.title}</h3>
                  <p className="mt-3 hidden text-[14px] leading-relaxed text-ink-2 sm:line-clamp-3">{s.dek}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-4 text-[12px] font-semibold uppercase tracking-[0.09em]">
                    Read <ArrowRight size={14} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </Col>
      </Grid>
    </Section>
  );
}

// ── Label spotlight: a story panel (4 columns) + two feature products (4 columns each) ──
export function BrandSpotlight({ labelId, excludeId, eyebrow = "House of Nykaa" }: { labelId: string; excludeId?: string; eyebrow?: string }) {
  const label = labelById[labelId];
  const all = productsByLabel(labelId).filter((p) => !p.soldOut && p.id !== excludeId);
  const items = all.slice(0, 2);
  return (
    <Section tone="paper" y="md" className="border-y border-line">
      <Grid className="gap-y-10">
        <Col span={{ base: 4, sm: 12, lg: 4 }} className="flex flex-col">
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
          <LinkButton href={`/brands/${label.id}`} variant="secondary" size="lg" className="mt-8 self-start" iconRight={<ArrowRight size={16} />}>
            Meet the label · {pieces(all.length)}
          </LinkButton>
        </Col>
        {items.map((p, i) => (
          <Col key={p.id} span={{ base: 2, sm: 6, lg: 4 }}>
            <Reveal delay={i * 80}>
              <ProductCard product={p} source="home-brand" sizes={SIZES.half} />
            </Reveal>
          </Col>
        ))}
      </Grid>
    </Section>
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
    { href: "/edits/the-offer-edit", label: `Up to ${best}% off`, sub: pieces(onSale.length), via: "up-to" },
    { href: "/edits/under-1500", label: "Under ₹1,500", sub: "Computed edit", via: "u1500" },
    { href: "/edits/under-3000", label: "Under ₹3,000", sub: "Computed edit", via: "u3000" },
    { href: "/offers", label: "All offers", sub: "Coupons & markdowns", via: "all" },
  ];
  const featured = onSale.slice(0, 4);
  return (
    <Section tone="ink" y={promoted ? "md" : "sm"}>
      {promoted ? (
        <Grid className="items-end gap-y-8">
          <Col span={{ base: 4, sm: 12, lg: 7 }}>
            <p className="eyebrow text-marigold">You’re looking for offers</p>
            <h2 className="display-lg mt-4">The Offer <em>Edit.</em></h2>
            <p className="mt-4 max-w-[50ch] text-[15px] text-bone">{`Genuine markdowns, up to ${best}% off — straight to the pieces. Curation is still one tap away.`}</p>
          </Col>
        </Grid>
      ) : (
        <SectionHeading onDark eyebrow="The Offer Edit" title={<>Fewer sales. <em>Better</em> ones.</>} intro="Only genuine price moves — we show a discount where one exists, and nowhere else." />
      )}
      <ul className="mt-10 grid grid-cols-2 gap-[var(--gap)] sm:grid-cols-4">
        {shortcuts.map((s) => (
          <li key={s.href}>
            <Link href={s.href} onClick={() => click(s.via)} className="group flex h-full min-h-[88px] flex-col justify-between border border-bone p-4 transition-colors hover:bg-bone hover:text-ink">
              <span className="text-[16px] font-medium tracking-[-0.01em]">{s.label}</span>
              <span className="mt-3 flex items-center justify-between text-[12px]">
                {s.sub} <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {promoted && (
        <ul className="grid-main mt-12 gap-y-8">
          {featured.map((p) => (
            <Col as="li" key={p.id} span={{ base: 2, sm: 6, lg: 3 }}>
              <OfferCard product={p} />
            </Col>
          ))}
        </ul>
      )}
    </Section>
  );
}

function OfferCard({ product: p }: { product: Product }) {
  return (
    <Link href={`/p/${p.slug}`} onClick={() => signal("discount_interaction")} className="group block">
      <div className="relative overflow-hidden">
        <Img imgKey={p.variants[0].images[0]} alt="" sizes={SIZES.cardWide} ratio="4/5" className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.03]" />
        <span className="absolute left-0 top-0 inline-flex h-7 items-center bg-bone px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald">{p.discount}% off</span>
      </div>
      <p className="eyebrow mt-3 text-bone">{labelById[p.labelId].name}</p>
      <h3 className="mt-1.5 line-clamp-2 text-[14px] leading-snug">{p.name}</h3>
      <p className="mt-1.5 flex items-baseline gap-2 text-[14px] tabular-nums">
        <span className="font-medium">{inr(p.price)}</span>
        <s className="text-[12.5px] text-bone/80">{inr(p.mrp)}</s>
      </p>
    </Link>
  );
}

