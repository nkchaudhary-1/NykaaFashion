"use client";
import Link from "next/link";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { useState } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { RevealText, Rise } from "@/components/motion/reveal";
import { products } from "@/data/catalog";
import { coupons } from "@/data/commerce";
import { PRICE_TILES } from "@/data/home-content";
import { inr } from "@/lib/format";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";
import { toast } from "@/stores/ui";
import { styles } from "./kit";

/*
 * The two quiet bands: price shortcuts right under the statement, and coupons between the category index and the celebration rail.
 * Hairlines and big numerals instead of boxes — each cell is a 1px ink rule, a small lead-in word and the figure at display size.
 */

// ── Price shortcuts ────────────────────────────────────────────────────────────────────────────────────────
export function PriceStrip() {
  const tiles = PRICE_TILES.map((t) => ({ ...t, n: products.filter((p) => !p.soldOut && (t.filter.maxPrice === undefined || p.price <= t.filter.maxPrice) && (t.filter.minDiscount === undefined || p.discount >= t.filter.minDiscount)).length }));
  return (
    <Section tone="bone" y="none" className="pb-14 pt-10 sm:pb-20 sm:pt-14">
      <Grid as="ul" className="gap-y-10">
        {tiles.map((t, i) => {
          // "Under ₹1,999" → a small "Under" and the figure; "Min. 20% off" → "Min." and "20% off". The words stay one sentence for assistive tech.
          const [lead, ...rest] = t.label.split(" ");
          return (
            <Col as="li" key={t.label} span={{ base: 2, sm: 3, lg: 3 }}>
              <Rise delay={i * 70} className="h-full">
                <Link
                  href={t.href}
                  onClick={() => (signal("discount_interaction"), track("home_module_click", { moduleType: "price-strip", via: t.label }))}
                  className="group flex h-full flex-col border-t border-ink pt-4"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="eyebrow text-ink-3">{lead}</span>
                    <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden className="shrink-0 transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>{" "}
                  <span className="display-md mt-5 block whitespace-nowrap transition-colors duration-500 ease-editorial group-hover:text-pink">{rest.join(" ")}</span>{" "}
                  <span className="mt-3 block text-[13px] text-ink-3">{styles(t.n)}</span>
                </Link>
              </Rise>
            </Col>
          );
        })}
      </Grid>
    </Section>
  );
}

// ── Offers for you: click a code to copy it (simulated codes) ─────────────────────────────────────────────
export function CouponStrip() {
  const [copied, setCopied] = useState<string | null>(null);
  const list = coupons.filter((c) => !c.expired).slice(0, 4);
  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard may be unavailable — still confirm so the flow is testable */
    }
    setCopied(code);
    signal("discount_interaction");
    toast({ title: `Code ${code} copied`, description: "Apply it in your bag — simulated coupon." });
    setTimeout(() => setCopied(null), 2200);
  };
  const off = (c: (typeof coupons)[number]) => (c.type === "percent" ? `${c.value}% off` : `${inr(c.value)} off`);
  return (
    <Section tone="bone" y="none" className="pb-16 pt-4 sm:pb-24">
      <div className="flex items-end justify-between gap-4 border-b border-ink pb-4">
        <RevealText as="h2" className="display-sm">
          Offers <em>for you</em>
        </RevealText>
        <Link href="/offers" className="link-u tap text-[12px] font-semibold uppercase tracking-[0.09em]">
          All offers
        </Link>
      </div>
      <Grid as="ul" className="gap-y-0">
        {list.map((c, i) => (
          <Col as="li" key={c.code} span={{ base: 4, sm: 6, lg: 3 }}>
            <Rise delay={i * 70} className="flex h-full flex-col border-b border-line py-6 lg:border-b-0 lg:pb-0">
              <p className="display-md whitespace-nowrap">{off(c)}</p>
              <p className="mt-3 line-clamp-2 max-w-[32ch] text-[13.5px] leading-snug text-ink-2">{c.description}</p>
              <button
                type="button"
                onClick={() => copy(c.code)}
                aria-label={`Copy code ${c.code}`}
                className="tap mt-5 inline-flex h-11 items-center gap-2.5 self-start border border-ink px-4 text-[12px] font-semibold tracking-[0.12em] tabular-nums transition-colors duration-300 hover:bg-ink hover:text-bone"
              >
                {copied === c.code ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />} {c.code}
              </button>
            </Rise>
          </Col>
        ))}
      </Grid>
    </Section>
  );
}
