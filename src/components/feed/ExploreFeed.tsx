"use client";
import { ArrowDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tile, Wall, WallHeading, PhotoLink, Go } from "@/components/bleed/Wall";
import { ProductTile } from "@/components/bleed/ProductTile";
import { Col, Grid } from "@/components/layout/Grid";
import { ProductCard } from "@/components/product/ProductCard";
import { SIZES } from "@/components/ui/Img";
import { Reveal } from "@/components/ui/Reveal";
import { SimulatedTag } from "@/components/ui/Simulated";
import { productById } from "@/data/catalog";
import { editById } from "@/data/edits";
import { stories } from "@/data/stories";
import { entriesFor, feedOrder, type FeedEntry } from "@/lib/feed";
import { useHomeLayout } from "@/lib/layout";
import { useHydrated } from "@/lib/store";
import { track } from "@/lib/track";
import { cn } from "@/lib/cn";
import { wishlistStore } from "@/stores/commerce";
import { intentStore } from "@/stores/intent";

/*
 * Keep exploring — the rabbit hole. An endless sequence of the catalogue, picked from what this browser has looked at and saved (or, on a product page, from the product itself),
 * each piece carrying the reason it is there. It is the last thing on the home page and on every product page, so the page never ends in a dead end: there is always one more thing to open.
 *   • It loads itself as you reach the end — three times — and after that waits for a tap on "Keep exploring", so the footer is never out of reach.
 *   • Back from a product returns to the same tile with the feed as long as you left it: Next 16 (Cache Components) keeps the pages you have visited alive instead of
 *     rebuilding them, so the feed's length and the scroll position survive. Nothing here stores them — scripts/qa/rabbit.cjs guards that this stays true.
 *   • In the full-bleed layout it is a wall of touching tiles; every second block opens with a feature, alternately a product and a story or edit.
 *   • It is a simulation (labelled): heuristic scoring over local signals, nothing leaves the browser.
 */

const AUTO_LOADS = 3; // batches that load by themselves before the visitor has to ask
const BATCH = 2; // blocks per batch
const START = 2;

const EDITORIAL: Array<{ kind: "story"; id: string } | { kind: "edit"; id: string }> = [
  { kind: "story", id: stories[0]?.id },
  { kind: "edit", id: "luxe" },
  { kind: "story", id: stories[1]?.id },
  { kind: "edit", id: "hidden-gems" },
  { kind: "story", id: stories[2]?.id },
  { kind: "edit", id: "responsible" },
  { kind: "story", id: stories[3]?.id },
  { kind: "edit", id: "festive" },
].filter((e) => e.id) as typeof EDITORIAL;

const S = {
  base: "(min-width:1280px) 17vw, (min-width:1024px) 25vw, (min-width:600px) 34vw, 50vw",
  feature: "(min-width:1280px) 34vw, (min-width:1024px) 50vw, (min-width:600px) 67vw, 100vw",
};

export function ExploreFeed({ id, seedId, eyebrow = "Keep exploring", title, intro }: { id: string; seedId?: string; eyebrow?: string; title?: React.ReactNode; intro?: string }) {
  const layout = useHomeLayout();
  const hydrated = useHydrated();
  const seed = seedId ? productById[seedId] : undefined;
  // The order is fixed when the feed appears and never reshuffled under the pointer, even if a save or a view changes the signals meanwhile.
  const snap = useMemo(() => (hydrated ? { intent: intentStore.get(), saved: wishlistStore.get().map((i) => i.productId) } : null), [hydrated]);
  const [blocks, setBlocks] = useState(START);
  const [autos, setAutos] = useState(0);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hydrated) track("feed_view", { feed: id, layout, seed: seedId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, id]);

  const entries = useMemo(() => (snap ? feedOrder({ ...snap, seed }, entriesFor(blocks)) : []), [snap, seed, blocks]);

  const more = (auto: boolean) => {
    const n = blocks + BATCH;
    setBlocks(n);
    track("feed_load_more", { feed: id, blocks: n, auto });
  };

  // as the end of the feed comes near, load the next batch — up to AUTO_LOADS times, then the button takes over
  useEffect(() => {
    const el = end.current;
    if (!el || !snap || autos >= AUTO_LOADS) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setAutos((a) => a + 1);
        more(true);
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, autos, blocks]);

  const shown = entries.length;
  const heading = title ?? (seed ? <>More <em>to love</em></> : <>Keep <em>exploring</em></>);
  const sub = intro ?? (seed ? "Pieces that go with this one, from the same labels and for the same occasions — and then wherever they lead." : "Picked from what you have looked at and saved on this device — and then wherever it leads.");

  return (
    <section aria-labelledby={`${id}-feed-h`} data-feed={id} data-feed-layout={layout} id={`feed-${id}`} className={cn("scroll-mt-[var(--header-offset)]", layout === "bleed" ? "bg-bone pt-12 sm:pt-16" : "bg-paper section-y border-t border-line")}>
      {layout === "bleed" ? (
        <WallHeading eyebrow={eyebrow} title={<span id={`${id}-feed-h`}>{heading}</span>} />
      ) : (
        <div className="container-x">
          <p className="eyebrow text-ink-3">{eyebrow}</p>
          <h2 id={`${id}-feed-h`} className="display-lg mt-4">
            {heading}
          </h2>
        </div>
      )}
      <div className="container-x mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="max-w-[56ch] text-[15px] leading-relaxed text-ink-2">{sub}</p>
        <SimulatedTag note="Heuristic scoring over your local browse and save signals — not machine learning. Nothing leaves this browser." />
      </div>

      <div className={layout === "bleed" ? "mt-8 sm:mt-10" : "container-x mt-12 sm:mt-14"}>
        {!snap ? <FeedPlaceholder layout={layout} /> : layout === "bleed" ? <FeedWall entries={entries} blocks={blocks} feedId={id} /> : <FeedGrid entries={entries} feedId={id} />}
      </div>

      <div ref={end} aria-hidden className="h-px" />
      {snap && (
        <div className="container-x mt-10 flex flex-col items-center gap-4 pb-16 text-center sm:mt-14 sm:pb-24">
          <p role="status" aria-live="polite" className="text-[13px] text-ink-3">
            {shown} styles so far
          </p>
          <button type="button" onClick={() => more(false)} className="tap inline-flex h-12 items-center gap-2.5 border border-ink px-7 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors duration-300 hover:bg-ink hover:text-bone">
            Keep exploring <ArrowDown size={15} aria-hidden />
          </button>
          <a href="#footer" className="link-u tap text-[12px] text-ink-3" onClick={(e) => (e.preventDefault(), document.getElementById("footer")?.scrollIntoView({ block: "start" }))}>
            Skip to the footer
          </a>
        </div>
      )}
    </section>
  );
}

/** What stands in for the feed until the visitor's signals are read (client only — the feed is personal, so the server renders no tiles). */
function FeedPlaceholder({ layout }: { layout: "classic" | "bleed" }) {
  return layout === "bleed" ? (
    <Wall aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <li key={i} className="bleed-tile bleed-b" />
      ))}
    </Wall>
  ) : (
    <div aria-hidden className="grid grid-cols-2 gap-[var(--gap)] sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="aspect-[4/5] bg-sand" />
      ))}
    </div>
  );
}

// ── classic: the page grid, ordinary product cards, the reason under each ─────────────────────────────────
function FeedGrid({ entries, feedId }: { entries: FeedEntry[]; feedId: string }) {
  return (
    <Grid as="ul" className="gap-y-12" aria-label="Keep exploring">
      {entries.map((e, i) => (
        <Col as="li" key={e.key} span={{ base: 2, sm: 4, lg: 3 }} data-feed-tile onClickCapture={() => track("feed_tile_click", { feed: feedId, position: i + 1, reason: e.reason })}>
          <Reveal y={28} delay={(i % 4) * 60} className="flex h-full flex-col">
            <ProductCard product={e.product} source={`feed-${feedId}`} sizes={SIZES.card} />
            <p className="mt-2 text-[12px] leading-snug text-ink-3">{e.reason}</p>
          </Reveal>
        </Col>
      ))}
    </Grid>
  );
}

// ── full-bleed: blocks of twelve base cells; even blocks open with a feature (a product, then a story or an edit, alternately) ──
function FeedWall({ entries, blocks, feedId }: { entries: FeedEntry[]; blocks: number; feedId: string }) {
  const tiles: React.ReactNode[] = [];
  let at = 0;
  let position = 0;
  const click = (reason: string) => () => track("feed_tile_click", { feed: feedId, position, reason });
  for (let b = 0; b < blocks; b++) {
    const feature = b % 2 === 0;
    const editorial = feature && Math.floor(b / 2) % 2 === 1;
    if (editorial) {
      tiles.push(<Tile key={`b${b}-ed`} cell="f">{editorialTile(Math.floor(b / 2) >> 1)}</Tile>);
    }
    const take = feature ? (editorial ? 8 : 9) : 12;
    entries.slice(at, at + take).forEach((e, k) => {
      position++;
      const isFeature = feature && !editorial && k === 0;
      tiles.push(
        <Tile key={e.key} cell={isFeature ? "f" : "b"} delay={(k % 6) * 30}>
          <div data-feed-tile className="contents" onClickCapture={click(e.reason)}>
            <ProductTile product={e.product} sizes={isFeature ? S.feature : S.base} source={`feed-${feedId}`} reason={e.reason} feature={isFeature} />
          </div>
        </Tile>,
      );
    });
    at += take;
  }
  return <Wall label="Keep exploring">{tiles}</Wall>;
}

/** The story or edit a feature slot shows: stories and curated edits in turn. */
function editorialTile(n: number) {
  const item = EDITORIAL[n % EDITORIAL.length];
  if (item.kind === "story") {
    const s = stories.find((x) => x.id === item.id)!;
    return (
      <PhotoLink
        href={`/discover/${s.id}`}
        imgKey={s.cover.tall}
        sizes={S.feature}
        strip={
          <>
            <span className="eyebrow block text-ink-3">
              {s.kicker.split(" · ")[0]} · {s.readMins} min read
            </span>
            <span className="mt-0.5 flex items-center justify-between gap-2 text-[22px] font-medium leading-tight tracking-[-0.02em] sm:text-[28px]">
              <span className="min-w-0">{s.title}</span>
              <Go />
            </span>
            <span className="mt-1 line-clamp-2 block max-w-[52ch] text-[14px] leading-snug text-ink-2">{s.dek}</span>
          </>
        }
      />
    );
  }
  const e = editById[item.id];
  return (
    <PhotoLink
      href={`/edits/${e.id}`}
      imgKey={`scenes/edit-${e.id}-tall`}
      sizes={S.feature}
      strip={
        <>
          <span className="eyebrow block text-ink-3">{e.kicker}</span>
          <span className="mt-0.5 flex items-center justify-between gap-2 text-[22px] font-medium leading-tight tracking-[-0.02em] sm:text-[28px]">
            <span className="min-w-0">{e.title}</span>
            <Go />
          </span>
          <span className="mt-1 line-clamp-2 block max-w-[52ch] text-[14px] leading-snug text-ink-2">{e.blurb}</span>
        </>
      }
    />
  );
}
