"use client";
import { ArrowUpRight, Clock, Search, TrendingUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useId, useMemo, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { Img } from "@/components/ui/Img";
import { Overlay } from "@/components/ui/Overlay";
import { Price } from "@/components/ui/Price";
import { topCategories } from "@/data/categories";
import { TRENDING_SEARCHES } from "@/data/content";
import { SEARCH_PLACEHOLDER } from "@/data/nav";
import { primaryEdits } from "@/data/edits";
import { labelById } from "@/data/labels";
import { cn } from "@/lib/cn";
import { searchProducts, suggest } from "@/lib/search";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";
import { addRecentSearch, prefsStore, setUI, usePrefs, useUI } from "@/stores/ui";

interface Item {
  id: string;
  kind: "term" | "product" | "label" | "category" | "edit" | "all";
  label: string;
  sub?: string;
  href: string;
  productId?: string;
}

const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function SearchOverlay() {
  const { searchOpen } = useUI();
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === "/" && !isTyping(e.target) && !e.metaKey && !e.ctrlKey) || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setUI({ searchOpen: true });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <Overlay open={searchOpen} onClose={() => setUI({ searchOpen: false })} label="Search" side="top" hideClose panelClassName="h-[100dvh] sm:h-auto sm:max-h-[88dvh]">
      <SearchPanel />
    </Overlay>
  );
}

function SearchPanel() {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const dq = useDeferredValue(q);
  const { recentSearches } = usePrefs();
  const sug = useMemo(() => suggest(dq), [dq]);
  const close = () => setUI({ searchOpen: false });

  const items: Item[] = useMemo(() => {
    if (!dq.trim()) return [];
    const out: Item[] = [];
    sug.terms.forEach((t) => out.push({ id: `t:${t}`, kind: "term", label: t, href: `/search?q=${encodeURIComponent(t)}` }));
    sug.products.forEach((p) => out.push({ id: `p:${p.id}`, kind: "product", label: p.name, sub: labelById[p.labelId].name, href: `/p/${p.slug}`, productId: p.id }));
    sug.labels.forEach((l) => out.push({ id: `l:${l.id}`, kind: "label", label: l.name, sub: l.tagline, href: `/brands/${l.id}` }));
    sug.categories.forEach((c) => out.push({ id: `c:${c.id}`, kind: "category", label: c.name, sub: `in ${c.path[0]}`, href: `/c/${c.id}` }));
    sug.edits.forEach((e) => out.push({ id: `e:${e.id}`, kind: "edit", label: e.title, sub: e.blurb, href: `/edits/${e.id}` }));
    out.push({ id: "all", kind: "all", label: `See all results for “${dq.trim()}”`, href: `/search?q=${encodeURIComponent(dq.trim())}` });
    return out;
  }, [dq, sug]);

  const go = (href: string, query?: string) => {
    if (query) {
      addRecentSearch(query);
      track("search", { query, resultCount: searchProducts(query).results.length });
      signal("search", { query });
    }
    close();
    router.push(href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[active];
      if (it) go(it.href, it.kind === "term" || it.kind === "all" ? (it.kind === "term" ? it.label : q.trim()) : undefined);
      else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`, q.trim());
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-line">
        <div className="container-x flex h-[72px] items-center gap-3">
          <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-t-[var(--radius-sm)] border-b-2 border-line-strong bg-sand px-4 transition-colors focus-within:border-pink">
          <Search size={20} className="shrink-0 text-ink-3" aria-hidden />
          <input
            data-autofocus
            type="search"
            role="combobox"
            aria-label="Search for products, styles and brands"
            aria-expanded={items.length > 0}
            aria-controls={listId}
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={SEARCH_PLACEHOLDER}
            value={q}
            onChange={(e) => (setQ(e.target.value), setActive(-1))}
            onKeyDown={onKey}
            className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-ink-3 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button type="button" aria-label="Clear search" onClick={() => (setQ(""), setActive(-1))} className="-mr-3 inline-flex size-11 shrink-0 items-center justify-center text-ink-2 transition-colors hover:text-ink">
              <X size={18} />
            </button>
          )}
          </div>
          <button type="button" onClick={close} className="inline-flex h-11 shrink-0 items-center rounded-[var(--radius-sm)] border border-ink px-5 text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white">
            Close
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="container-x py-8 sm:py-10">
          {!dq.trim() ? (
            <div className="grid-main gap-y-10">
              <div className="col-span-4 space-y-9 sm:col-span-12 lg:col-span-6">
                {recentSearches.length > 0 && (
                  <section aria-labelledby="recent-h">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 id="recent-h" className="eyebrow text-ink-3">Recent</h2>
                      <button type="button" onClick={() => prefsStore.set((p) => ({ ...p, recentSearches: [] }))} className="link-u tap text-[12px] text-ink-3">
                        Clear
                      </button>
                    </div>
                    <ul className="flex flex-wrap gap-2">
                      {recentSearches.map((s) => (
                        <li key={s}>
                          <Chip onClick={() => go(`/search?q=${encodeURIComponent(s)}`, s)}>
                            <Clock size={14} aria-hidden className="text-ink-3" /> {s}
                          </Chip>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <section aria-labelledby="trend-h">
                  <h2 id="trend-h" className="eyebrow mb-3 text-ink-3">Trending</h2>
                  <ul className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((s) => (
                      <li key={s}>
                        <Chip onClick={() => go(`/search?q=${encodeURIComponent(s)}`, s)}>
                          <TrendingUp size={14} aria-hidden className="text-ink-3" /> {s}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                </section>
                <section aria-labelledby="browse-h">
                  <h2 id="browse-h" className="eyebrow mb-3 text-ink-3">Browse</h2>
                  <ul className="flex flex-wrap gap-2">
                    {topCategories.map((c) => (
                      <li key={c.id}>
                        <Chip onClick={() => go(`/c/${c.id}`)}>{c.name}</Chip>
                      </li>
                    ))}
                    <li>
                      <Chip onClick={() => go("/brands")}>All labels</Chip>
                    </li>
                  </ul>
                </section>
              </div>
              <section aria-labelledby="edits-h" className="col-span-4 sm:col-span-12 lg:col-span-6">
                <h2 id="edits-h" className="eyebrow mb-3 text-ink-3">Start with an edit</h2>
                <ul className="grid grid-cols-1 border-t border-line">
                  {primaryEdits.map((e) => (
                    <li key={e.id} className="border-b border-line">
                      <button type="button" onClick={() => go(`/edits/${e.id}`)} className="group flex w-full items-center gap-4 py-3 text-left transition-colors hover:bg-sand">
                        <span className="relative w-14 shrink-0">
                          <Img imgKey={`scenes/edit-${e.id}-tall`} alt="" sizes="64px" ratio="4/5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-medium">{e.title}</span>
                          <span className="block truncate text-[12.5px] text-ink-3">{e.blurb}</span>
                        </span>
                        <ArrowUpRight size={16} className="mr-3 shrink-0 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            <div className="grid-main">
              <ul id={listId} role="listbox" aria-label="Search suggestions" className="col-span-4 sm:col-span-12 lg:col-span-8 lg:col-start-3">
                {items.map((it, i) => {
                  const isActive = i === active;
                  const prev = items[i - 1];
                  const heading = !prev || prev.kind !== it.kind ? { term: "Suggestions", product: "Products", label: "Labels", category: "Categories", edit: "Edits", all: "" }[it.kind] : null;
                  return (
                    <li key={it.id} role="presentation">
                      {heading && <p className="eyebrow mb-1 mt-6 px-3 text-ink-3 first:mt-0">{heading}</p>}
                      <button
                        id={`${listId}-${i}`}
                        role="option"
                        aria-selected={isActive}
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(it.href, it.kind === "term" ? it.label : it.kind === "all" ? q.trim() : undefined)}
                        className={cn("flex min-h-12 w-full items-center gap-4 px-3 py-2.5 text-left transition-colors", isActive ? "bg-sand" : "hover:bg-sand", it.kind === "all" && "mt-3 border-t border-line pt-4")}
                      >
                        {it.kind === "product" && it.productId ? <ProductThumb id={it.productId} /> : <Search size={16} className="shrink-0 text-ink-3" aria-hidden />}
                        <span className="min-w-0 flex-1">
                          <span className={cn("block truncate text-[15px]", it.kind === "all" && "font-medium")}>{it.label}</span>
                          {it.sub && <span className="block truncate text-[12.5px] text-ink-3">{it.sub}</span>}
                        </span>
                        {it.kind === "product" && it.productId && <ProductPrice id={it.productId} />}
                        <ArrowUpRight size={15} className="shrink-0 text-ink-3" aria-hidden />
                      </button>
                    </li>
                  );
                })}
                {items.length === 1 && (
                  <li role="presentation" className="px-3 py-6 text-[14px] text-ink-3">
                    No direct matches — see all results for ideas, or browse an edit.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { productById } from "@/data/catalog";
function ProductThumb({ id }: { id: string }) {
  const p = productById[id];
  return (
    <span className="w-11 shrink-0">
      <Img imgKey={p.variants[0].images[0]} alt="" sizes="48px" ratio="4/5" />
    </span>
  );
}
function ProductPrice({ id }: { id: string }) {
  const p = productById[id];
  return <Price price={p.price} mrp={p.mrp} size="sm" showSavings={false} className="shrink-0" />;
}
