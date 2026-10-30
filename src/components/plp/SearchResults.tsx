"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { EditTile } from "@/components/editorial/EditTile";
import { Col, Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { ProductRail } from "@/components/product/Rail";
import { BentoTile } from "@/components/ui/BentoTile";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { ChipLink } from "@/components/ui/Chip";
import { SIZES } from "@/components/ui/Img";
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
      <ListingHeader crumbs={[{ name: "Home", href: "/" }, { name: "Search" }]} count={noResults ? undefined : res.results.length} noun="results" title={<>{noResults ? "No results for" : "Results for"} <span className="text-pink-ink">“{q}”</span></>}>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2" aria-live="polite">
          {res.corrected && <p className="text-[14px] text-ink-2">Showing results for <strong className="font-medium text-ink">{res.corrected}</strong>.</p>}
          {res.relaxed && <p className="text-[14px] text-ink-2">No product matches every word — showing the closest matches.</p>}
          {res.parsed.understood.length > 0 && (
            <>
              <span className="text-[12.5px] text-ink-3">Understood:</span>
              {res.parsed.understood.map((u) => (
                <span key={u} className="inline-flex h-7 items-center border border-line-strong px-3 text-[12.5px] text-ink">
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
      <Section y="none" className="pb-14 sm:pb-20">
        <Grid className="gap-y-8">
          <Col span={{ base: 4, sm: 12, lg: 6 }}>
            <h2 className="display-sm">Nothing matched — yet</h2>
            <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">Try fewer words, a different spelling, or start from an edit.</p>
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 7 }} rowStart={{ lg: 1 }}>
            <TrendingChips max={6} />
          </Col>
        </Grid>
      </Section>
      <Section tone="paper" y="sm" className="border-y border-line">
        <SectionHeading eyebrow="Start from a point of view" title="Popular edits" href="/edits" hrefLabel="All edits" />
        <div className="mt-10">
          <Carousel>
            <CarouselTrack label="Popular edits" density="wide">
              {primaryEdits.slice(0, 3).map((e, i) => (
                <EditTile key={e.id} edit={e} source="search-empty" sizes="(min-width:1024px) 33vw, (min-width:600px) 45vw, 90vw" ratio="5/4" load={i < 2 ? "eager" : undefined} />
              ))}
            </CarouselTrack>
          </Carousel>
        </div>
      </Section>
      <Section y="sm">
        <SectionHeading eyebrow="Or browse" title="Popular right now" />
        <div className="mt-10">
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
      <PageHeader crumbs={[{ name: "Home", href: "/" }, { name: "Search" }]} eyebrow="Search" size="md" title="What are you looking for?" intro="Search a label, a fabric, an occasion — or try a phrase like “festive under 2000”.">
        <div className="mt-8">
          <h2 className="mb-4 text-[20px] font-semibold tracking-[-0.01em]">Trending searches</h2>
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
      </PageHeader>
      <Section tone="paper" y="sm" className="border-y border-line">
        <SectionHeading eyebrow="By department" title="Browse the shop." />
        <Grid className="mt-10 gap-y-[var(--gap)]">
          {DEPARTMENTS.map((id, i) => {
            const n = productsInCategory(id).length;
            return (
              <Col key={id} span={{ base: 2, sm: 6, lg: 3 }}>
                <BentoTile href={`/c/${id}`} imgKey={`scenes/cat-${id}`} title={categoryById[id].name} meta={`${n} products`} sizes={SIZES.tile} load={i < 2 ? "eager" : undefined} />
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
          <div className="mt-10">
            <CarouselTrack label="Edits" density="wide">
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

