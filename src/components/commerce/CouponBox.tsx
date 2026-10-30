"use client";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { coupons } from "@/data/commerce";
import { labelById } from "@/data/labels";
import type { Coupon } from "@/data/types";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";
import { evaluateCoupon, type PricedLine } from "@/lib/pricing";
import { setCoupon } from "@/stores/commerce";
import { toast } from "@/stores/ui";

/** Check a code against the bag; apply it (with a toast) or hand back why it can't be. Valid / invalid / expired / minimum-not-met are all real (simulated rules). */
function applyCode(code: string, lines: PricedLine[]): string | null {
  const r = evaluateCoupon(code, lines);
  if (!r.ok) return r.reason;
  setCoupon(r.coupon.code);
  toast({ title: `${r.coupon.code} applied`, description: `You save ₹${r.discount.toLocaleString("en-IN")}.` });
  return null;
}

const eligibleTotal = (c: Coupon, lines: PricedLine[]) => lines.filter((l) => !c.appliesTo || labelById[l.product.labelId].flags[c.appliesTo]).reduce((n, l) => n + l.product.price * l.qty, 0);

type Offer = { kind: "apply"; code: string; discount: number } | { kind: "near"; code: string; more: number };

/** The coupon worth showing first: the biggest saving the bag already qualifies for, else the one it is closest to ("Shop for ₹500 more with …"). */
export function bestOffer(lines: PricedLine[]): Offer | null {
  let best: Offer | null = null;
  let near: Offer | null = null;
  for (const c of coupons) {
    if (c.expired) continue;
    const r = evaluateCoupon(c.code, lines);
    if (r.ok) {
      if (!best || (best.kind === "apply" && r.discount > best.discount)) best = { kind: "apply", code: c.code, discount: r.discount };
      continue;
    }
    const have = eligibleTotal(c, lines);
    if (c.appliesTo && have === 0) continue;
    const more = c.minSubtotal - have;
    if (more > 0 && (!near || (near.kind === "near" && more < near.more))) near = { kind: "near", code: c.code, more };
  }
  return best ?? near;
}

/**
 * "Coupons and Offers" as on the live bag: a heading with "View all ›", a tinted BEST COUPON panel (a white strip with an
 * ONLY FOR YOU tab), and — on the bag page — a code field. Compact (no field) in the mini-bag drawer.
 */
export function CouponsAndOffers({ lines, applied, error, viewAll, withInput, className }: { lines: PricedLine[]; applied: string | null; error: string | null; viewAll?: { href: string; onClick?: () => void }; withInput?: boolean; className?: string }) {
  const head = useId();
  const root = useRef<HTMLElement>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const on = !!applied && !error;
  const offer = on ? null : bestOffer(lines);
  // Apply and Remove replace one another, so the button that was just used is gone; hand focus to its counterpart (or the heading) so a
  // keyboard user keeps their place — and the drawer's Esc / Tab trap, which listens on the dialog, keeps working.
  const handoff = (sel: string) =>
    requestAnimationFrame(() => (root.current?.querySelector<HTMLElement>(sel) ?? root.current?.querySelector<HTMLElement>("h2"))?.focus({ preventScroll: true }));
  const apply = (c: string) => {
    const reason = applyCode(c, lines);
    if (reason === null) handoff("[data-coupon-remove]");
    return reason;
  };
  const remove = () => {
    setCoupon(null);
    handoff("[data-coupon-apply], [data-coupon-input]");
  };
  const submit = (c: string) => {
    const reason = apply(c);
    setMsg(reason);
    if (!reason) setCode("");
  };
  const strong = "font-semibold tabular-nums";
  return (
    <section ref={root} aria-labelledby={head} className={className}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={head} tabIndex={-1} className="text-[20px] font-semibold leading-tight tracking-[-0.01em]">Coupons and Offers</h2>
        {viewAll && (
          <Link href={viewAll.href} onClick={viewAll.onClick} className="link-u tap inline-flex items-center gap-1 text-[15px] font-semibold text-pink">
            View all <ChevronRight size={18} strokeWidth={2.2} aria-hidden />
          </Link>
        )}
      </div>

      {(on || offer) && (
        <div className="relative mt-4 rounded-[var(--radius-md)] bg-pink-tint p-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-2">Best coupon</p>
          <div className="relative mt-6">
            <span className="absolute -top-[26px] right-4 rounded-t-[10px] bg-white px-4 pb-1 pt-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-blue">Only for you</span>
            <div className="flex min-h-[4.25rem] items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-white px-4 py-3 text-[15px]">
              {on ? (
                <>
                  <p className="flex items-center gap-2"><Check size={17} strokeWidth={2.4} aria-hidden className="shrink-0 text-emerald" /> <span><span className={cn(strong, "tracking-[0.04em]")}>{applied}</span> applied</span></p>
                  <button type="button" data-coupon-remove onClick={remove} aria-label={`Remove coupon ${applied}`} className="tap inline-flex h-9 shrink-0 items-center px-1 text-[14px] font-semibold text-pink underline underline-offset-4">
                    Remove
                  </button>
                </>
              ) : offer?.kind === "apply" ? (
                <>
                  <p>Save <span className={strong}>{inr(offer.discount)}</span> with <span className={cn(strong, "tracking-[0.04em]")}>{offer.code}</span></p>
                  <Button size="sm" data-coupon-apply aria-label={`Apply ${offer.code}`} onClick={() => apply(offer.code)}>Apply</Button>
                </>
              ) : offer ? (
                <p>Shop for <span className={strong}>{inr(offer.more)} more</span> with <span className={cn(strong, "tracking-[0.04em]")}>{offer.code}</span></p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {withInput && !on && (
        <form onSubmit={(e) => (e.preventDefault(), submit(code))} noValidate className="mt-4">
          <div className="flex gap-2">
            <label htmlFor={`${head}-code`} className="sr-only">Coupon code</label>
            <input id={`${head}-code`} data-coupon-input value={code} onChange={(e) => (setCode(e.target.value.toUpperCase()), setMsg(null))} placeholder="Enter coupon code" autoCapitalize="characters" autoComplete="off" aria-invalid={msg ? true : undefined} aria-describedby={msg ? `${head}-err` : undefined} className={cn("h-11 min-w-0 flex-1 border bg-white px-4 text-[14px] tabular-nums tracking-[0.04em] placeholder:tracking-normal focus:border-ink", msg ? "border-danger" : "border-line-strong")} />
            <Button type="submit" disabled={!code.trim()}>Apply</Button>
          </div>
          {(msg || error) && <p id={`${head}-err`} role="alert" className="mt-2 text-[13px] font-medium text-danger">{msg ?? error}</p>}
        </form>
      )}
      {error && applied && (
        <p role="alert" className="mt-3 text-[13px] font-medium text-danger">
          {applied} no longer applies: {error} <button type="button" className="underline underline-offset-4" onClick={remove}>Remove it</button>
        </p>
      )}
    </section>
  );
}

/**
 * Every offer that exists, as tiles: a swipeable rail on phones, 2 across (4 + 4 of the 8 bag columns; 6 + 6 of 12 on tablets) from 600px.
 * Each tile says what it is and, when the bag does not qualify, why not.
 */
export function CouponOffers({ lines, applied, error, className }: { lines: PricedLine[]; applied: string | null; error: string | null; className?: string }) {
  return (
    <section id="offers" aria-labelledby="offers-h" className={cn("scroll-mt-32 border-t border-line-strong pt-6", className)}>
      <h2 id="offers-h" className="text-[20px] font-semibold leading-tight tracking-[-0.01em]">Available offers</h2>
      <p className="mt-1.5 text-[14px] text-ink-2">Tap Apply — each code is checked against what’s in your bag.</p>
      <ul tabIndex={0} aria-label="Available offers" className="snap-x-rail scrollbar-none mt-5 flex gap-x-[var(--gap)] overflow-x-auto outline-offset-[-2px] max-sm:-mr-[var(--gutter)] max-sm:pr-[var(--gutter)] sm:grid sm:grid-cols-2 sm:gap-y-[var(--gap)] sm:overflow-visible">
        {coupons.filter((c) => !c.expired).map((c) => {
          const r = evaluateCoupon(c.code, lines);
          const on = applied === c.code && !error;
          const blocked = !r.ok && lines.length > 0;
          return (
            <li key={c.code} className={cn("flex w-[82%] shrink-0 flex-col justify-between gap-5 border bg-white p-5 sm:w-auto", on ? "border-emerald" : "border-line")}>
              <div>
                <p className="inline-flex h-6 items-center border border-dashed border-pink px-2 text-[12.5px] font-semibold tabular-nums tracking-[0.08em] text-pink">{c.code}</p>
                <p className="mt-3 text-[16px] font-semibold leading-snug">{c.title}</p>
                <p className="mt-1.5 text-[14px] leading-snug text-ink-2">{c.description}</p>
                {blocked && <p className="mt-2 text-[12.5px] leading-snug text-ink-3">{r.reason}</p>}
              </div>
              <Button variant="secondary" size="sm" className="self-start" aria-label={`${on ? "Applied" : "Apply"} ${c.code}`} aria-disabled={on || blocked || undefined} onClick={() => !on && !blocked && applyCode(c.code, lines)}>
                {on ? "Applied" : "Apply"}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
