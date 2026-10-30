"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { LISTING_GRID, ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { Overlay, OverlayBody, OverlayFooter, OverlayHeader } from "@/components/ui/Overlay";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { primaryEdits } from "@/data/edits";
import type { Product } from "@/data/types";
import { hashString } from "@/data/catalog";
import { cn } from "@/lib/cn";
import { activeChips, activeCount, applyFilters, computeFacets, parseFilters, relaxSuggestions, removeChip, serializeFilters, EMPTY_FILTERS, type FilterState } from "@/lib/filters";
import { useMockQuery } from "@/lib/mockApi";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";
import { EditTile } from "@/components/editorial/EditTile";
import { FilterPanel, type FacetKey, type FilterChange } from "./FilterPanel";
import { SortSelect } from "./SortSelect";

const PAGE = 24;

interface Props {
  pool: Product[];
  /** unique key for this listing (route) — part of the mock query key */
  scopeKey: string;
  /** path of the current category; the category facet lists its children */
  categoryScope?: string[];
  layout?: "grid" | "masonry";
  hide?: FacetKey[];
  source: string;
  /** shown above the toolbar (e.g. "understood as" chips) */
  intro?: ReactNode;
  noun?: string;
  /** visually hidden h2 above the results (keeps heading order); false when the page already has one */
  resultsHeading?: string | false;
}

/**
 * Shared listing: URL-encoded filters/sort (shareable, back-safe — PRD §6.1), skeleton → results,
 * inline retry on error, relaxed-filter suggestions on no match, end-of-results.
 */
export function ProductListing({ pool, scopeKey, categoryScope = [], layout = "grid", hide = [], source, intro, noun = "pieces", resultsHeading = "Results" }: Props) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qs = sp.toString();
  const filters = useMemo(() => parseFilters(sp), [sp]);
  const [sheet, setSheet] = useState(false);

  const query = useMockQuery(`${scopeKey}?${qs}`, () => applyFilters(pool, filters), 360);
  const facets = useMemo(() => computeFacets(pool, filters, categoryScope), [pool, filters, categoryScope]);
  const liveCount = useMemo(() => applyFilters(pool, filters).length, [pool, filters]);
  const chips = useMemo(() => activeChips(filters), [filters]);

  const push = (next: FilterState) => {
    const params = serializeFilters(next, sp);
    router.push(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  };
  const onChange: FilterChange = (next, meta) => {
    push(next);
    if (meta.on) {
      track("filter_apply", { filter: meta.key, value: meta.value, source, resultCount: applyFilters(pool, next).length });
      signal("filter_apply", { category: meta.key === "category" ? meta.value : undefined, tags: meta.key === "occasion" && meta.value ? [meta.value] : undefined });
      if (meta.key === "offers") signal("discount_interaction");
    }
  };
  const onSort = (sort: FilterState["sort"]) => {
    push({ ...filters, sort });
    track("filter_apply", { filter: "sort", value: sort, source, resultCount: liveCount });
    if (sort === "discount") signal("discount_interaction");
  };
  const clearAll = () => push({ ...EMPTY_FILTERS, sort: filters.sort });

  const count = activeCount(filters);
  const showCats = hide;

  return (
    <div className="container-x">
      {intro}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-line py-3.5 lg:border-t-0 lg:pb-5 lg:pt-0">
        <p className="text-[13.5px] text-ink-2" aria-live="polite">
          {query.status === "ready" || query.data ? <><span className="font-medium text-ink tabular-nums">{liveCount}</span> {liveCount === 1 ? noun.replace(/s$/, "") : noun}</> : <span className="text-ink-3">Loading…</span>}
        </p>
        <div className="hidden items-center gap-3 lg:flex">
          <SortSelect value={filters.sort} onChange={onSort} />
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Button variant="secondary" size="md" icon={<SlidersHorizontal size={15} />} onClick={() => setSheet(true)} aria-haspopup="dialog">
            Filter{count > 0 ? ` · ${count}` : ""}
          </Button>
          <SortSelect value={filters.sort} onChange={onSort} />
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-1 pt-4" aria-label="Applied filters" role="group">
          {chips.map((c) => (
            <button key={`${c.key}-${c.value ?? ""}`} type="button" onClick={() => push(removeChip(filters, c))} className="group inline-flex h-9 items-center gap-2 rounded-full border border-ink bg-paper pl-4 pr-3 text-[13px] text-ink transition-colors hover:bg-ink hover:text-bone">
              {c.label}
              <X size={14} aria-hidden />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button type="button" onClick={clearAll} className="link-u ml-1 px-1 py-2 text-[12.5px] font-medium uppercase tracking-[0.1em]">
            Clear all
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-x-12 lg:mt-8 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)]">
        <aside aria-label="Filters" className="hidden lg:block">
          <h2 className="sr-only">Filters</h2>
          <div className="sticky top-[calc(var(--header-h)+16px)] max-h-[calc(100dvh-var(--header-h)-32px)] overflow-y-auto pr-3 [scrollbar-width:thin]">
            <FilterPanel facets={facets} filters={filters} onChange={onChange} hide={showCats} />
          </div>
        </aside>

        <section aria-label="Results" className="min-w-0 pb-4">
          {resultsHeading !== false && <h2 className="sr-only">{resultsHeading}</h2>}
          {query.status === "error" && <ErrorState title="We couldn’t load these pieces" text="The connection dropped before the list arrived. Your filters are saved in the URL — try again." onRetry={query.retry} />}
          {query.status === "loading" && !query.data && <GridSkeleton count={8} columnsClass={LISTING_GRID} />}
          {query.data && query.status !== "error" && (
            <div className={cn("transition-opacity duration-300", query.reloading && "pointer-events-none opacity-50")}>
              <Results key={qs} items={query.data} layout={layout} source={source} filters={filters} pool={pool} onClear={clearAll} onRelax={(c) => push(removeChip(filters, c))} noun={noun} />
            </div>
          )}
        </section>
      </div>

      {/* Mobile filter sheet */}
      <Overlay open={sheet} onClose={() => setSheet(false)} label="Filters" side="bottom" panelClassName="h-[88dvh]">
        <OverlayHeader title="Filter & sort" />
        <OverlayBody>
          <FilterPanel facets={facets} filters={filters} onChange={onChange} hide={showCats} />
        </OverlayBody>
        <OverlayFooter className="grid grid-cols-[auto_1fr] gap-3">
          <Button variant="ghost" size="lg" onClick={clearAll} disabled={count === 0}>
            Clear
          </Button>
          <Button size="lg" onClick={() => setSheet(false)}>
            Show {liveCount} {liveCount === 1 ? noun.replace(/s$/, "") : noun}
          </Button>
        </OverlayFooter>
      </Overlay>
    </div>
  );
}

function Results({ items, layout, source, filters, pool, onClear, onRelax, noun }: { items: Product[]; layout: "grid" | "masonry"; source: string; filters: FilterState; pool: Product[]; onClear: () => void; onRelax: (c: ReturnType<typeof activeChips>[number]) => void; noun: string }) {
  const [limit, setLimit] = useState(PAGE);
  if (items.length === 0) {
    const relax = relaxSuggestions(pool, filters);
    return (
      <EmptyState
        title="Nothing matches those filters"
        text="Try relaxing one of them — or step into an edit and let someone else do the choosing."
        actions={
          <>
            {relax.map((r) => (
              <Button key={`${r.chip.key}-${r.chip.value ?? ""}`} variant="secondary" onClick={() => onRelax(r.chip)}>
                Remove “{r.chip.label}” · {r.count}
              </Button>
            ))}
            <Button variant="ghost" onClick={onClear}>
              Clear all filters
            </Button>
          </>
        }
        visual={
          <ul className="grid grid-cols-2 gap-2 text-left">
            {primaryEdits.slice(0, 2).map((e) => (
              <li key={e.id}>
                <EditTile edit={e} sizes="120px" source="no-results" />
              </li>
            ))}
          </ul>
        }
        className="py-10"
      />
    );
  }
  const shown = items.slice(0, limit);
  return (
    <>
      {layout === "masonry" ? (
        <ul className="columns-2 gap-x-3 sm:columns-3 sm:gap-x-4 xl:columns-4 xl:gap-x-5 2xl:columns-5">
          {shown.map((p, i) => {
            const ratio = (["4/5", "3/4", "5/6"] as const)[hashString(p.id) % 3];
            return (
              <li key={p.id} className="mb-9 break-inside-avoid">
                <Reveal delay={(i % 4) * 60}>
                  <ProductCard product={p} source={source} priority={i < 8} ratio={ratio} />
                </Reveal>
              </li>
            );
          })}
        </ul>
      ) : (
        <ProductGrid products={shown} source={source} columnsClass={LISTING_GRID} />
      )}
      <div className="mt-14 flex flex-col items-center gap-3 border-t border-line pt-10 text-center">
        <p className="text-[13px] text-ink-3" aria-live="polite">
          Showing {shown.length} of {items.length} {noun}
        </p>
        {shown.length < items.length ? (
          <Button variant="secondary" size="lg" onClick={() => setLimit((l) => l + PAGE)}>
            Show more
          </Button>
        ) : (
          <p className="display-xs text-ink-2">You’ve seen them all.</p>
        )}
      </div>
    </>
  );
}

