"use client";
import { Check, Tag, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { coupons } from "@/data/commerce";
import { cn } from "@/lib/cn";
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

/**
 * The coupon field that sits with the order summary: a code input + Apply, or — once a coupon is on — what it is, with a way to remove it.
 * `offersHref` links to the full list of offers (CouponOffers) elsewhere on the page.
 */
export function CouponForm({ lines, applied, error, offersHref, className }: { lines: PricedLine[]; applied: string | null; error: string | null; offersHref?: string; className?: string }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const submit = (c: string) => {
    const reason = applyCode(c, lines);
    setMsg(reason);
    if (!reason) setCode("");
  };
  return (
    <section aria-labelledby="coupon-h" className={cn("border border-line bg-paper p-5 sm:p-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="coupon-h" className="flex items-center gap-2.5 text-[15px] font-semibold">
          <Tag size={17} strokeWidth={1.7} aria-hidden className="text-pink" /> Offers &amp; coupons
        </h2>
        {offersHref && (
          <a href={offersHref} className="link-u tap shrink-0 text-[12.5px] font-semibold text-pink-ink">
            View offers
          </a>
        )}
      </div>
      {applied && !error ? (
        <div className="mt-4 flex items-center justify-between gap-3 bg-pink-tint px-4 py-3 text-pink-ink">
          <p className="flex items-center gap-2 text-[14px] font-medium"><Check size={16} aria-hidden /> <span className="font-semibold tracking-[0.08em]">{applied}</span> applied</p>
          <button type="button" onClick={() => setCoupon(null)} className="tap inline-flex h-9 items-center gap-1 px-2 text-[12.5px] font-medium underline underline-offset-4" aria-label={`Remove coupon ${applied}`}>
            <X size={14} aria-hidden /> Remove
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => (e.preventDefault(), submit(code))} noValidate className="mt-4">
          <div className="flex gap-2">
            <label htmlFor="coupon-code" className="sr-only">Coupon code</label>
            <input id="coupon-code" value={code} onChange={(e) => (setCode(e.target.value.toUpperCase()), setMsg(null))} placeholder="Enter code" autoCapitalize="characters" autoComplete="off" aria-invalid={msg ? true : undefined} aria-describedby={msg ? "coupon-err" : undefined} className={cn("h-12 min-w-0 flex-1 border bg-white px-4 text-[14px] uppercase tabular-nums tracking-[0.12em] focus:border-ink", msg ? "border-danger" : "border-line-strong")} />
            <Button type="submit" disabled={!code.trim()} className="h-12">Apply</Button>
          </div>
          {(msg || error) && <p id="coupon-err" role="alert" className="mt-2 text-[13px] font-medium text-danger">{msg ?? error}</p>}
        </form>
      )}
      {error && applied && (
        <p role="alert" className="mt-3 text-[13px] font-medium text-danger">
          {applied} no longer applies: {error} <button type="button" className="underline underline-offset-4" onClick={() => setCoupon(null)}>Remove it</button>
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
    <section id="offers" aria-labelledby="offers-h" className={cn("scroll-mt-32 border-t border-ink pt-6", className)}>
      <h2 id="offers-h" className="display-xs">Available offers</h2>
      <p className="mt-1.5 text-[13px] text-ink-3">Tap Apply — each code is checked against what’s in your bag.</p>
      <ul tabIndex={0} aria-label="Available offers" className="snap-x-rail scrollbar-none mt-6 flex gap-x-[var(--gap)] overflow-x-auto outline-offset-[-2px] max-sm:-mr-[var(--gutter)] max-sm:pr-[var(--gutter)] sm:grid sm:grid-cols-2 sm:gap-y-[var(--gap)] sm:overflow-visible">
        {coupons.filter((c) => !c.expired).map((c) => {
          const r = evaluateCoupon(c.code, lines);
          const on = applied === c.code && !error;
          const blocked = !r.ok && lines.length > 0;
          return (
            <li key={c.code} className={cn("flex w-[82%] shrink-0 flex-col justify-between gap-5 border bg-paper p-5 sm:w-auto", on ? "border-pink" : "border-line")}>
              <div>
                <p className="inline-flex h-6 items-center border border-dashed border-pink px-2 text-[12px] font-semibold tabular-nums tracking-[0.1em] text-pink-ink">{c.code}</p>
                <p className="mt-3 text-[15px] font-medium leading-snug">{c.title}</p>
                <p className="mt-1.5 text-[13px] leading-snug text-ink-2">{c.description}</p>
                {blocked && <p className="mt-2 text-[12px] leading-snug text-ink-3">{r.reason}</p>}
              </div>
              <Button variant="secondary" size="sm" className="self-start" aria-label={`${on ? "Applied" : "Apply"} ${c.code}`} disabled={on || blocked} onClick={() => applyCode(c.code, lines)}>
                {on ? "Applied" : "Apply"}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
