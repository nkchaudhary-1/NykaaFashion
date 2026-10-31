"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, RefreshCw, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Button } from "@/components/ui/Button";
import { GRID_CLASS } from "@/components/product/ProductGrid";
import { Overlay, OverlayBody, OverlayFooter, OverlayHeader } from "@/components/ui/Overlay";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { primaryEdits } from "@/data/edits";
import type { Product } from "@/data/types";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { activeChips, activeCount, applyFilters, computeFacets, parseFilters, relaxSuggestions, removeChip, serializeFilters, EMPTY_FILTERS, type FilterState } from "@/lib/filters";
import { useMockQuery } from "@/lib/mockApi";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";
import { FilterChip } from "./FilterChip";
import { FilterPanel, type FacetKey, type FilterChange } from "./FilterPanel";
import type { Feature } from "./features";
import { ListingGrid } from "./ListingGrid";
import { planCells } from "./plan";
import { QuickFilters } from "./QuickFilters";
import { SortSelect } from "./SortSelect";

/** Cards added by each "Show more". 24 is a whole number of rows at 2-, 3- and 4-up. */
const PAGE = 24;

interface Props {
  pool: Product[];
  /** unique key for this listing (route) — part of the mock query key */
  scopeKey: string;
  /** path of the current category; the category facet lists its children */
  categoryScope?: string[];
  hide?: FacetKey[];
  source: string;
  /** shown above the toolbar */
  intro?: ReactNode;
  noun?: string;
  /** visually hidden h2 above the results (keeps heading order); false when the page already has one */
  resultsHeading?: string | false;
  /** feature inserts for the grid, in order — chosen by the page from its context (see ./features) */
  features?: Feature[];
}

/**
 * Shared listing for categories, search, edits, labels and offers. Filter + sort state lives in the URL (shareable,
 * back-safe — PRD §6.1). Layout: a sticky toolbar (Filter · quick chips · count · Sort), the applied filters, then a
 * full-width grid — filters open in a drawer, so the grid keeps all twelve columns. Skeleton → results, inline retry on
 * error, relaxed-filter suggestions on no match, progress + "Show more" at the end.
 */
export function ProductListing({ pool, scopeKey, categoryScope = [], hide = [], source, intro, noun = "products", resultsHeading = "Results", features = [] }: Props) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const desktop = useIsDesktop();
  const qs = sp.toString();
  const filters = useMemo(() => parseFilters(sp), [sp]);
  const [drawer, setDrawer] = useState(false);

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
  const nounOf = (n: number) => (n === 1 ? noun.replace(/s$/, "") : noun);
  const ready = query.status === "ready" || !!query.data;
  const countLine = (className: string) => (
    <p className={cn("whitespace-nowrap text-[13px] text-ink-3", className)} aria-live="polite">
      {ready ? (
        <>
          <span className="font-medium tabular-nums text-ink">{liveCount}</span> {nounOf(liveCount)}
        </>
      ) : (
        <span className="text-ink-3">Loading…</span>
      )}
    </p>
  );

  return (
    <div>
      {intro && <div className="container-x">{intro}</div>}

      {/* Sticky toolbar. It follows the header: --header-offset is the header's height while it is shown, 0 once it has slid away. */}
      <div className="sticky top-[var(--header-offset,var(--header-h))] z-30 border-y border-line bg-bone transition-[top] duration-500 ease-editorial">
        <div className="container-x">
          <div className="grid grid-cols-2 gap-[var(--gap)] py-2 sm:flex sm:items-center sm:gap-x-5 sm:py-2.5">
            <Button variant="secondary" size="md" icon={<SlidersHorizontal size={15} />} onClick={() => setDrawer(true)} aria-haspopup="dialog" aria-expanded={drawer} className="w-full sm:w-auto sm:shrink-0">
              Filter
              {count > 0 && <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full border border-current text-[11px] font-semibold tabular-nums tracking-normal">{count}</span>}
            </Button>
            {/* visibility lives on wrappers: cn() is a plain join, so `hidden` would lose to a child's own display utility */}
            <div className="hidden min-w-0 flex-1 sm:block">
              <QuickFilters facets={facets} filters={filters} hide={hide} poolSize={pool.length} onChange={onChange} />
            </div>
            {countLine("hidden sm:block")}
            <div className="sm:hidden">
              <SortSelect value={filters.sort} onChange={onSort} variant="button" />
            </div>
            <div className="hidden sm:block">
              <SortSelect value={filters.sort} onChange={onSort} />
            </div>
          </div>
        </div>
      </div>

      <div className="container-x">
        <div className={cn("flex flex-wrap items-center gap-2 pt-4 sm:pt-5", chips.length === 0 && "sm:hidden")}>
          {countLine("mr-2 sm:hidden")}
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2" aria-label="Applied filters" role="group">
              {chips.map((c) => (
                <FilterChip key={`${c.key}-${c.value ?? ""}`} removable onClick={() => push(removeChip(filters, c))}>
                  {c.label}
                </FilterChip>
              ))}
              <button type="button" onClick={clearAll} className="link-u tap ml-1 px-1 py-2 text-[11px] font-medium uppercase tracking-[0.14em]">
                Clear all
              </button>
            </div>
          )}
        </div>

        <section aria-label="Results" className="min-w-0 pb-4 pt-6 sm:pt-8 lg:pt-10">
          {resultsHeading !== false && <h2 className="sr-only">{resultsHeading}</h2>}
          {query.status === "error" && (
            <Grid>
              <Col span={{ base: 4, sm: 12, lg: 8 }}>
                <div role="alert" className="border-t border-ink py-10 sm:py-14">
                  <p className="eyebrow text-ink-3">Connection</p>
                  <h2 className="display-md mt-5 max-w-[18ch]">We couldn’t load these products.</h2>
                  <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">The connection dropped before the list arrived. Your filters are saved in the URL — try again.</p>
                  <Button variant="secondary" size="lg" className="mt-8" icon={<RefreshCw size={15} />} onClick={query.retry}>
                    Try again
                  </Button>
                </div>
              </Col>
            </Grid>
          )}
          {query.status === "loading" && !query.data && <GridSkeleton count={8} columnsClass={GRID_CLASS} />}
          {query.data && query.status !== "error" && (
            <div className={cn("transition-opacity duration-300", query.reloading && "pointer-events-none opacity-50")}>
              <Results key={qs} items={query.data} source={source} filters={filters} pool={pool} features={features} onClear={clearAll} onRelax={(c) => push(removeChip(filters, c))} noun={noun} />
            </div>
          )}
        </section>
      </div>

      {/* Filters: a drawer from the left on desktop, a bottom sheet below — the grid never loses columns to a sidebar. */}
      <Overlay open={drawer} onClose={() => setDrawer(false)} label="Filters" side={desktop ? "left" : "bottom"} panelClassName={desktop ? undefined : "h-[88dvh]"}>
        <OverlayHeader title="Filters" sub={count > 0 ? `${count} applied` : "Refine what you see"} />
        <OverlayBody>
          <FilterPanel facets={facets} filters={filters} onChange={onChange} hide={hide} />
        </OverlayBody>
        <OverlayFooter className="grid grid-cols-[auto_1fr] gap-3">
          <Button variant="ghost" size="lg" onClick={clearAll} disabled={count === 0}>
            Clear all
          </Button>
          <Button size="lg" onClick={() => setDrawer(false)}>
            Show {liveCount} {nounOf(liveCount)}
          </Button>
        </OverlayFooter>
      </Overlay>
    </div>
  );
}

function Results({ items, source, filters, pool, features, onClear, onRelax, noun }: { items: Product[]; source: string; filters: FilterState; pool: Product[]; features: Feature[]; onClear: () => void; onRelax: (c: ReturnType<typeof activeChips>[number]) => void; noun: string }) {
  const [limit, setLimit] = useState(PAGE);
  const gridRef = useRef<HTMLDivElement>(null);
  const focusFrom = useRef<number | null>(null);

  // After "Show more", move focus to the first new card so keyboard and screen-reader users land in the new content.
  useEffect(() => {
    if (focusFrom.current === null) return;
    gridRef.current?.querySelector<HTMLElement>(`[data-card="${focusFrom.current}"] a:not([aria-hidden])`)?.focus();
    focusFrom.current = null;
  }, [limit]);

  const plan = useMemo(() => planCells(items, features, limit), [items, features, limit]);
  const next = useMemo(() => planCells(items, features, limit + PAGE), [items, features, limit]);

  if (items.length === 0) {
    const relax = relaxSuggestions(pool, filters);
    return (
      <Grid className="gap-y-12 border-t border-ink py-10 sm:py-14">
        <Col span={{ base: 4, sm: 12, lg: 7 }}>
          <p className="eyebrow text-ink-3">No match</p>
          <h2 className="display-md mt-5 max-w-[16ch]">Nothing matches those filters.</h2>
          <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">Try relaxing one of them — or step into an edit and let someone else do the choosing.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {relax.map((r) => (
              <Button key={`${r.chip.key}-${r.chip.value ?? ""}`} variant="secondary" onClick={() => onRelax(r.chip)}>
                Remove “{r.chip.label}” · {r.count}
              </Button>
            ))}
            <Button variant="ghost" onClick={onClear}>
              Clear all filters
            </Button>
          </div>
        </Col>
        <Col span={{ base: 4, sm: 12, lg: 4 }} start={{ lg: 9 }}>
          <p className="eyebrow mb-4 text-ink-3">Or start from an edit</p>
          <ul className="border-t border-ink">
            {primaryEdits.slice(0, 3).map((e, i) => (
              <li key={e.id} className="border-b border-line">
                <Link href={`/edits/${e.id}`} className="group flex items-baseline gap-4 py-4" onClick={() => track("collection_open", { editId: e.id, source: "no-results" })}>
                  <span className="text-[11px] tabular-nums text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 text-[19px] font-medium leading-tight tracking-[-0.025em]">{e.title}</span>
                  <ArrowRight size={16} aria-hidden className="shrink-0 transition-transform duration-500 ease-expo group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </Col>
      </Grid>
    );
  }

  const total = items.length;
  const more = next.shown - plan.shown;
  return (
    <>
      <div ref={gridRef}>
        <ListingGrid cells={plan.cells} source={source} />
      </div>
      <div className="mt-16 grid-main items-end gap-y-8 border-t border-line pt-8 lg:mt-24">
        <div className="col-span-4 min-w-0 sm:col-span-6">
          <p className="flex items-baseline gap-3 tabular-nums" aria-live="polite">
            <span className="sr-only">Showing </span>
            <span className="display-md">{plan.shown}</span>
            <span className="text-[13px] text-ink-3">
              <span aria-hidden>/ </span>
              <span className="sr-only">of </span>
              {total} {noun}
            </span>
          </p>
          <div role="progressbar" aria-label={`${noun} shown`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={plan.shown} className="mt-5 h-px w-full max-w-[420px] bg-line">
            <div className="h-0.5 -translate-y-px bg-ink transition-[width] duration-700 ease-expo" style={{ width: `${(plan.shown / total) * 100}%` }} />
          </div>
        </div>
        <div className="col-span-4 sm:col-span-6 sm:flex sm:justify-end">
          {more > 0 ? (
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => {
                focusFrom.current = plan.cards;
                setLimit((l) => l + PAGE);
              }}
            >
              Show {more} more
            </Button>
          ) : (
            <p className="display-sm text-ink-2">You’ve seen them all.</p>
          )}
        </div>
      </div>
    </>
  );
}
