"use client";
import { ArrowUpRight, Clock, Search, TrendingUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useId, useMemo, useState } from "react";
import { Img } from "@/components/ui/Img";
import { Overlay } from "@/components/ui/Overlay";
import { Price } from "@/components/ui/Price";
import { topCategories } from "@/data/categories";
import { TRENDING_SEARCHES } from "@/data/content";
import { THEMES, primaryEdits } from "@/data/edits";
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

  const chip = "inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-[13.5px] text-ink transition-colors hover:border-ink hover:bg-sand";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="container-x flex h-[72px] shrink-0 items-center gap-3 border-b border-line">
        <Search size={20} className="shrink-0 text-ink" aria-hidden />
        <input
          data-autofocus
          type="search"
          role="combobox"
          aria-label="Search labels, edits and styles"
          aria-expanded={items.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Search labels, edits, styles — try “festive under 2000”"
          value={q}
          onChange={(e) => (setQ(e.target.value), setActive(-1))}
          onKeyDown={onKey}
          className="h-12 min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button type="button" aria-label="Clear search" onClick={() => (setQ(""), setActive(-1))} className="inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-sand">
            <X size={18} />
          </button>
        )}
        <button type="button" onClick={close} className="h-10 shrink-0 px-2 text-[12px] font-medium uppercase tracking-[0.12em] text-ink">
          Close
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="container-x py-6 sm:py-8">
          {!dq.trim() ? (
            <div className="grid gap-9 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
              <div className="space-y-8">
                {recentSearches.length > 0 && (
                  <section aria-labelledby="recent-h">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 id="recent-h" className="eyebrow text-ink-3">Recent</h2>
                      <button type="button" onClick={() => prefsStore.set((p) => ({ ...p, recentSearches: [] }))} className="link-u text-[12px] text-ink-3">
                        Clear
                      </button>
                    </div>
                    <ul className="flex flex-wrap gap-2">
                      {recentSearches.map((s) => (
                        <li key={s}>
                          <button type="button" className={chip} onClick={() => go(`/search?q=${encodeURIComponent(s)}`, s)}>
                            <Clock size={14} aria-hidden className="text-ink-3" /> {s}
                          </button>
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
                        <button type="button" className={chip} onClick={() => go(`/search?q=${encodeURIComponent(s)}`, s)}>
                          <TrendingUp size={14} aria-hidden className="text-ink-3" /> {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
                <section aria-labelledby="browse-h">
                  <h2 id="browse-h" className="eyebrow mb-3 text-ink-3">Browse</h2>
                  <ul className="flex flex-wrap gap-2">
                    {topCategories.map((c) => (
                      <li key={c.id}>
                        <button type="button" className={chip} onClick={() => go(`/c/${c.id}`)}>
                          {c.name}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button type="button" className={chip} onClick={() => go("/brands")}>
                        All labels
                      </button>
                    </li>
                  </ul>
                </section>
              </div>
              <section aria-labelledby="edits-h">
                <h2 id="edits-h" className="eyebrow mb-3 text-ink-3">Start with an edit</h2>
                <ul className="grid gap-2.5">
                  {primaryEdits.map((e) => (
                    <li key={e.id}>
                      <button type="button" onClick={() => go(`/edits/${e.id}`)} className="group flex w-full items-center gap-4 border border-line bg-paper p-3 text-left transition-colors hover:border-ink">
                        <span className="relative w-14 shrink-0">
                          <Img imgKey={`scenes/edit-${e.id}-tall`} alt="" sizes="64px" ratio="4/5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-medium">{e.title}</span>
                          <span className="block truncate text-[12.5px] text-ink-3">{e.blurb}</span>
                        </span>
                        <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: THEMES[e.theme].accent }} />
                        <ArrowUpRight size={16} className="shrink-0 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            <ul id={listId} role="listbox" aria-label="Search suggestions" className="mx-auto max-w-3xl">
              {items.map((it, i) => {
                const isActive = i === active;
                const prev = items[i - 1];
                const heading = !prev || prev.kind !== it.kind ? { term: "Suggestions", product: "Products", label: "Labels", category: "Categories", edit: "Edits", all: "" }[it.kind] : null;
                return (
                  <li key={it.id} role="presentation">
                    {heading && <p className="eyebrow mb-1 mt-5 px-3 text-ink-3 first:mt-0">{heading}</p>}
                    <button
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={isActive}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(it.href, it.kind === "term" ? it.label : it.kind === "all" ? q.trim() : undefined)}
                      className={cn("flex w-full items-center gap-4 px-3 py-2.5 text-left transition-colors", isActive ? "bg-sand" : "hover:bg-sand/60", it.kind === "all" && "mt-3 border-t border-line pt-4")}
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
