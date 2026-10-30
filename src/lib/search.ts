import { SEARCH_SYNONYMS, TRENDING_SEARCHES } from "@/data/content";
import { categories } from "@/data/categories";
import { products } from "@/data/catalog";
import { edits } from "@/data/edits";
import { labels } from "@/data/labels";
import { searchBlob } from "@/data/queries";
import type { CategoryNode, Edit, Label, Product } from "@/data/types";

const STOP = new Set(["for", "the", "a", "an", "in", "and", "with", "of", "to", "my", "me", "some", "something", "cute", "nice", "pretty", "good", "best", "looking", "want", "need", "show"]);

interface Item {
  p: Product;
  name: string;
  label: string;
  tags: string;
  colors: string;
  blob: string;
}
const index: Item[] = products.map((p) => ({
  p,
  name: p.name.toLowerCase(),
  label: labels.find((l) => l.id === p.labelId)!.name.toLowerCase(),
  tags: p.tags.join(" "),
  colors: p.variants.map((v) => `${v.colorName} ${v.family}`).join(" ").toLowerCase(),
  blob: searchBlob(p),
}));
const vocab = new Set<string>();
for (const it of index) for (const w of it.blob.split(/[^a-z0-9]+/)) if (w.length > 2) vocab.add(w);

export interface ParsedQuery {
  raw: string;
  terms: string[];
  maxPrice?: number;
  minPrice?: number;
  offers?: boolean;
  responsible?: boolean;
  /** human readable "we understood…" chips — a nod to v2 phrase parsing (PRD §5.6) */
  understood: string[];
  ignored: string[];
}

const num = (s: string, k?: string) => Math.round(parseFloat(s.replace(/,/g, "")) * (k ? 1000 : 1));

export function parseQuery(raw: string): ParsedQuery {
  let q = raw.toLowerCase().replace(/[’']/g, "").trim();
  const out: ParsedQuery = { raw, terms: [], understood: [], ignored: [] };
  q = q.replace(/(?:under|below|less than|upto|up to|within|<)\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d+)?)\s*(k)?/g, (_, n, k) => {
    out.maxPrice = num(n, k);
    return " ";
  });
  q = q.replace(/(?:above|over|more than|>)\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d+)?)\s*(k)?/g, (_, n, k) => {
    out.minPrice = num(n, k);
    return " ";
  });
  q = q.replace(/\b(sale|offers?|discounts?|deals?|markdowns?)\b/g, () => {
    out.offers = true;
    return " ";
  });
  q = q.replace(/\b(sustainable|responsible|eco|eco-friendly|organic)\b/g, () => {
    out.responsible = true;
    return " ";
  });
  const words = q.split(/[^a-z0-9-]+/).filter(Boolean);
  for (const w of words) {
    if (STOP.has(w) || /^\d+$/.test(w)) continue;
    out.terms.push(w);
  }
  return out;
}

function lev1(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function expand(term: string): string[] {
  const out = new Set([term, ...(SEARCH_SYNONYMS[term] ?? [])]);
  if (term.length > 3 && term.endsWith("s")) out.add(term.slice(0, -1));
  return Array.from(out);
}

const wordHit = (blob: string, w: string) => new RegExp(`(^|[^a-z0-9])${w.replace(/[^a-z0-9-]/g, "")}`).test(blob);

export interface SearchResult {
  results: Product[];
  parsed: ParsedQuery;
  /** true when no product matched every term, so partial matches are shown */
  relaxed: boolean;
  corrected?: string;
}

export function searchProducts(raw: string): SearchResult {
  const parsed = parseQuery(raw);
  let corrected: string | undefined;
  // Typo tolerance for terms that match nothing.
  const terms = parsed.terms.map((t) => {
    const forms = expand(t);
    if (forms.some((f) => vocab.has(f) || Array.from(vocab).some((v) => v.startsWith(f)))) return t;
    if (t.length >= 5) {
      const near = Array.from(vocab).find((v) => lev1(t, v));
      if (near) {
        corrected = corrected ? `${corrected} ${near}` : near;
        return near;
      }
    }
    parsed.ignored.push(t);
    return null;
  });
  const active = terms.filter((t): t is string => !!t);
  // Nothing in the query is recognisable (e.g. a keyboard mash): that's a no-result, not "show everything".
  if (parsed.terms.length > 0 && active.length === 0) return { results: [], parsed, relaxed: false, corrected };

  const scoreItem = (it: Item) => {
    let hits = 0;
    let score = 0;
    for (const t of active) {
      let best = 0;
      for (const f of expand(t)) {
        if (wordHit(it.name, f)) best = Math.max(best, 6);
        else if (wordHit(it.label, f)) best = Math.max(best, 5);
        else if (wordHit(it.tags, f)) best = Math.max(best, 3);
        else if (wordHit(it.colors, f)) best = Math.max(best, 3);
        else if (wordHit(it.blob, f)) best = Math.max(best, 2);
      }
      if (best) hits++;
      score += best;
    }
    return { hits, score };
  };

  let scored = index.map((it) => ({ it, ...scoreItem(it) }));
  if (parsed.maxPrice !== undefined) scored = scored.filter((s) => s.it.p.price <= parsed.maxPrice!);
  if (parsed.minPrice !== undefined) scored = scored.filter((s) => s.it.p.price >= parsed.minPrice!);
  if (parsed.offers) scored = scored.filter((s) => s.it.p.discount > 0);
  if (parsed.responsible) scored = scored.filter((s) => s.it.p.responsible);

  let relaxed = false;
  let matched = active.length ? scored.filter((s) => s.hits === active.length) : scored;
  if (active.length > 1 && matched.length === 0) {
    matched = scored.filter((s) => s.hits > 0);
    relaxed = matched.length > 0;
  }
  matched.sort((a, b) => b.score - a.score || a.it.p.rank - b.it.p.rank);

  if (parsed.maxPrice !== undefined) parsed.understood.push(`Under ₹${parsed.maxPrice.toLocaleString("en-IN")}`);
  if (parsed.minPrice !== undefined) parsed.understood.push(`Above ₹${parsed.minPrice.toLocaleString("en-IN")}`);
  if (parsed.offers) parsed.understood.push("On offer");
  if (parsed.responsible) parsed.understood.push("Responsible");
  return { results: matched.map((m) => m.it.p), parsed, relaxed, corrected };
}

export interface Suggestions {
  terms: string[];
  labels: Label[];
  categories: CategoryNode[];
  edits: Edit[];
  products: Product[];
}

export function suggest(raw: string): Suggestions {
  const q = raw.toLowerCase().trim();
  if (!q) return { terms: [], labels: [], categories: [], edits: [], products: [] };
  const has = (s: string) => s.toLowerCase().split(/\s+/).some((w) => w.startsWith(q)) || s.toLowerCase().includes(q);
  const terms = [...TRENDING_SEARCHES, ...Array.from(vocab)].filter((t, i, a) => a.indexOf(t) === i && t.startsWith(q) && t !== q).slice(0, 5);
  return {
    terms,
    labels: labels.filter((l) => has(l.name)).slice(0, 3),
    categories: categories.filter((c) => c.path.length > 1 && has(c.name)).slice(0, 3),
    edits: edits.filter((e) => e.primary && has(e.title)).slice(0, 2),
    products: searchProducts(raw).results.slice(0, 5),
  };
}
