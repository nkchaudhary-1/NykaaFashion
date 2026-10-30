"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { EditTile } from "@/components/editorial/EditTile";
import { ProductListing } from "./ProductListing";
import { ProductRail } from "@/components/product/Rail";
import { EmptyState } from "@/components/ui/States";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { TRENDING_SEARCHES } from "@/data/content";
import { primaryEdits } from "@/data/edits";
import { popular } from "@/lib/recs";
import { searchProducts } from "@/lib/search";
import { track } from "@/lib/track";
import { addRecentSearch } from "@/stores/ui";

/** Search inside the discovery frame (PRD §5.6): masonry results, "understood as" chips, graceful no-results. */
export function SearchResults() {
  const sp = useSearchParams();
  const q = (sp.get("q") ?? "").trim();
  const res = useMemo(() => searchProducts(q), [q]);

  useEffect(() => {
    if (!q) return;
    addRecentSearch(q);
    track("search", { query: q, resultCount: res.results.length, relaxed: res.relaxed });
  }, [q, res.results.length, res.relaxed]);

  if (!q) {
    return (
      <div className="container-x">
        <EmptyState title="What are you looking for?" text="Search a label, a fabric, an occasion — or try a phrase like “festive under 2000”." actions={<>{TRENDING_SEARCHES.slice(0, 4).map((t) => (<Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-[13.5px] hover:border-ink">{t}</Link>))}</>} />
      </div>
    );
  }

  const noResults = res.results.length === 0;
  return (
    <>
      <header className="container-x pb-8 pt-6 sm:pb-10 sm:pt-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Search" }]} className="mb-8" />
        <p className="eyebrow mb-3 text-ink-3">Search</p>
        <h1 className="display-lg text-balance">{noResults ? <>No results for <em>“{q}”</em></> : <>Results for <em>“{q}”</em></>}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-2" aria-live="polite">
          {res.corrected && <p className="text-[14px] text-ink-2">Showing results for <strong className="font-medium text-ink">{res.corrected}</strong>.</p>}
          {res.relaxed && <p className="text-[14px] text-ink-2">No piece matches every word — showing the closest matches.</p>}
          {res.parsed.understood.length > 0 && (
            <>
              <span className="text-[12.5px] text-ink-3">Understood:</span>
              {res.parsed.understood.map((u) => (
                <span key={u} className="inline-flex h-7 items-center rounded-full bg-sand px-3 text-[12.5px] text-ink">{u}</span>
              ))}
            </>
          )}
          {res.parsed.ignored.length > 0 && <p className="text-[12.5px] text-ink-3">Ignored: {res.parsed.ignored.join(", ")}</p>}
        </div>
      </header>
      {noResults ? (
        <div className="container-x pb-12">
          <EmptyState title="Nothing matched — yet" text="Try fewer words, a different spelling, or start from an edit." actions={<>{TRENDING_SEARCHES.slice(0, 4).map((t) => (<Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-[13.5px] hover:border-ink">{t}</Link>))}</>} className="pb-10 pt-6" />
          <h2 className="eyebrow mb-6 text-ink-3">Popular edits</h2>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {primaryEdits.slice(0, 3).map((e) => (
              <li key={e.id}><EditTile edit={e} source="search-empty" sizes="(min-width:600px) 33vw, 100vw" /></li>
            ))}
          </ul>
          <h2 className="eyebrow mb-6 mt-16 text-ink-3">Popular right now</h2>
          <ProductRail products={popular(8)} label="Popular right now" source="search-empty" />
        </div>
      ) : (
        <ProductListing pool={res.results} scopeKey={`search:${q}`} source="search" layout="masonry" noun="results" />
      )}
    </>
  );
}
