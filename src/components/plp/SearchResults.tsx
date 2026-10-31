"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { EditTile } from "@/components/editorial/EditTile";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { ProductRail } from "@/components/product/Rail";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { ChipLink } from "@/components/ui/Chip";
import { Img, SIZES } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TRENDING_SEARCHES } from "@/data/content";
import { categoryById } from "@/data/categories";
import { primaryEdits } from "@/data/edits";
import { productsInCategory } from "@/data/queries";
import { popular } from "@/lib/recs";
import { searchProducts } from "@/lib/search";
import { track } from "@/lib/track";
import { addRecentSearch } from "@/stores/ui";
import { interleave, type Feature } from "./features";
import { ListingHeader } from "./ListingHeader";
import { ProductListing } from "./ProductListing";

const href = (t: string) => `/search?q=${encodeURIComponent(t)}`;

/** Trending searches as flat chips — also the "festive under 2000" style hint, since the search understands phrases. */
function TrendingChips({ max = 8, className }: { max?: number; className?: string }) {
  return (
    <ul aria-label="Trending searches" className={className ?? "flex flex-wrap gap-2"}>
      {TRENDING_SEARCHES.slice(0, max).map((t) => (
        <li key={t}>
          <ChipLink href={href(t)}>{t}</ChipLink>
        </li>
      ))}
    </ul>
  );
}

/** Feature inserts for results: a trending search (with a real result for its picture) between the hero pieces. */
function searchFeatures(q: string): Feature[] {
  const tiles: Feature[] = [];
  for (const t of TRENDING_SEARCHES) {
    if (tiles.length === 2) break;
    if (t.toLowerCase() === q.toLowerCase()) continue;
    const rep = searchProducts(t).results.find((p) => !p.soldOut);
    if (rep) tiles.push({ kind: "tile", href: href(t), imgKey: rep.variants[0].images[0], title: t, meta: "Trending search" });
  }
  return interleave<Feature>([{ kind: "hero" }, { kind: "hero" }], tiles);
}

/** Search inside the discovery frame (PRD §5.6): "understood as" chips, a full-width mixed grid, graceful no-results. */
export function SearchResults() {
  const sp = useSearchParams();
  const q = (sp.get("q") ?? "").trim();
  const res = useMemo(() => searchProducts(q), [q]);
  const features = useMemo(() => (q ? searchFeatures(q) : []), [q]);

  useEffect(() => {
    if (!q) return;
    addRecentSearch(q);
    track("search", { query: q, resultCount: res.results.length, relaxed: res.relaxed });
  }, [q, res.results.length, res.relaxed]);

  if (!q) return <SearchHome />;

  const noResults = res.results.length === 0;
  return (
    <>
      <ListingHeader crumbs={[{ name: "Home", href: "/" }, { name: "Search" }]} eyebrow="Search" size="lg" count={noResults ? undefined : res.results.length} noun="results" title={<>{noResults ? "No results for" : "Results for"} <span className="text-pink-ink">“{q}”</span></>}>
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2" aria-live="polite">
          {res.corrected && <p className="text-[14px] text-ink-2">Showing results for <strong className="font-medium text-ink">{res.corrected}</strong>.</p>}
          {res.relaxed && <p className="text-[14px] text-ink-2">No product matches every word — showing the closest matches.</p>}
          {res.parsed.understood.length > 0 && (
            <>
              <span className="eyebrow text-ink-3">Understood:</span>
              {res.parsed.understood.map((u) => (
                <span key={u} className="inline-flex h-7 items-center rounded-full border border-line-strong px-3 text-[12.5px] text-ink">
                  {u}
                </span>
              ))}
            </>
          )}
          {res.parsed.ignored.length > 0 && <p className="text-[12.5px] text-ink-3">Ignored: {res.parsed.ignored.join(", ")}</p>}
        </div>
      </ListingHeader>
      {noResults ? <NoResults /> : <ProductListing pool={res.results} scopeKey={`search:${q}`} source="search" noun="results" features={features} />}
    </>
  );
}

/** Nothing matched: say so plainly, then hand the shopper back to discovery — trending searches, edits, popular products. */
function NoResults() {
  return (
    <>
      <Section y="none" className="pb-16 sm:pb-24">
        <Grid className="gap-y-10 border-t border-ink pt-10 sm:pt-14">
          <Col span={{ base: 4, sm: 12, lg: 7 }}>
            <p className="eyebrow text-ink-3">No match</p>
            <h2 className="display-md mt-5">Nothing matched — yet</h2>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">Try fewer words, a different spelling, or start from an edit.</p>
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 4 }} start={{ lg: 9 }} rowStart={{ lg: 1 }}>
            <p className="eyebrow mb-4 text-ink-3">Trending</p>
            <TrendingChips max={6} />
          </Col>
        </Grid>
      </Section>
      <Section tone="paper" y="sm" className="border-y border-line">
        <SectionHeading eyebrow="Start from a point of view" title="Popular edits" href="/edits" hrefLabel="All edits" />
        <div className="mt-12">
          <Carousel>
            <CarouselTrack label="Popular edits" density="wide" cursor="Drag">
              {primaryEdits.slice(0, 3).map((e, i) => (
                <EditTile key={e.id} edit={e} source="search-empty" sizes="(min-width:1024px) 33vw, (min-width:600px) 45vw, 90vw" ratio="5/4" load={i < 2 ? "eager" : undefined} />
              ))}
            </CarouselTrack>
          </Carousel>
        </div>
      </Section>
      <Section y="sm">
        <SectionHeading eyebrow="Or browse" title="Popular right now" />
        <div className="mt-12">
          <ProductRail products={popular(8)} label="Popular right now" source="search-empty" arrows={false} />
        </div>
      </Section>
    </>
  );
}

const DEPARTMENTS = ["women", "men", "kids", "home"] as const;

/** /search with no query: invitations instead of a dead end — trending phrases, then the departments and the edits as picture tiles. */
function SearchHome() {
  return (
    <>
      <ListingHeader crumbs={[{ name: "Home", href: "/" }, { name: "Search" }]} eyebrow="Search" title="What are you looking for?" intro="Search a label, a fabric, an occasion — or try a phrase like “festive under 2000”.">
        <div className="mt-12">
          <h2 className="eyebrow mb-5 text-ink-3">Trending searches</h2>
          <ul aria-label="Trending searches" className="flex flex-wrap gap-2">
            <li>
              <ChipLink href={href("festive under 2000")} className="border-ink">
                festive under 2000
              </ChipLink>
            </li>
            {TRENDING_SEARCHES.filter((t) => t !== "under 2000").map((t) => (
              <li key={t}>
                <ChipLink href={href(t)}>{t}</ChipLink>
              </li>
            ))}
          </ul>
        </div>
      </ListingHeader>
      <Section tone="paper" y="sm" className="border-y border-line">
        <SectionHeading eyebrow="By department" title="Browse the shop." />
        <Grid className="mt-12 gap-y-[var(--gap)]">
          {DEPARTMENTS.map((id, i) => {
            const n = productsInCategory(id).length;
            return (
              <Col key={id} span={{ base: 2, sm: 6, lg: 3 }}>
                <DepartmentTile id={id} name={categoryById[id].name} count={n} eager={i < 2} />
              </Col>
            );
          })}
        </Grid>
      </Section>
      <Section y="sm">
        <Carousel>
          <SectionHeading eyebrow="By point of view" title="Or start with an edit." href="/edits" hrefLabel="All edits">
            <CarouselArrows />
          </SectionHeading>
          <div className="mt-12">
            <CarouselTrack label="Edits" density="wide" cursor="Drag">
              {primaryEdits.map((e) => (
                <EditTile key={e.id} edit={e} source="search-home" sizes="(min-width:1024px) 33vw, 62vw" ratio="4/3" />
              ))}
            </CarouselTrack>
          </div>
        </Carousel>
      </Section>
    </>
  );
}

/** A department as a picture with its name and product count beneath — the same silent tile as a category or an edit. */
function DepartmentTile({ id, name, count, eager }: { id: string; name: string; count: number; eager?: boolean }) {
  return (
    <Link href={`/c/${id}`} className="group block">
      <div className="overflow-hidden bg-sand">
        <div data-nogrid className="transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.04] group-focus-visible:scale-[1.04]">
          <Img imgKey={`scenes/cat-${id}`} alt="" sizes={SIZES.tile} ratio="4/5" load={eager ? "eager" : undefined} />
        </div>
      </div>
      <span className="mt-3 flex items-baseline justify-between gap-3 border-b border-line pb-3 transition-colors duration-500 group-hover:border-ink">
        <span className="text-[16px] font-medium tracking-[-0.02em]">{name}</span>
        <span className="text-[12px] tabular-nums text-ink-3">{count} products</span>
      </span>
    </Link>
  );
}
