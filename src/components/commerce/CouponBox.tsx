"use client";
import { Check, Tag, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { coupons } from "@/data/commerce";
import { cn } from "@/lib/cn";
import { evaluateCoupon, type PricedLine } from "@/lib/pricing";
import { setCoupon } from "@/stores/commerce";
import { toast } from "@/stores/ui";

/**
 * Coupon entry + the offers that exist. Valid / invalid / expired / minimum-not-met states are all real (simulated rules).
 * The box fills whatever grid area it is given: the offers are one column in a narrow area and two (4 + 4 of the 8 bag columns) in a wide one.
 */
export function CouponBox({ lines, applied, error, className }: { lines: PricedLine[]; applied: string | null; error: string | null; className?: string }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const apply = (c: string) => {
    const r = evaluateCoupon(c, lines);
    if (!r.ok) {
      setMsg(r.reason);
      return false;
    }
    setCoupon(r.coupon.code);
    setMsg(null);
    setCode("");
    toast({ title: `${r.coupon.code} applied`, description: `You save ₹${r.discount.toLocaleString("en-IN")}.` });
    return true;
  };

  return (
    <section aria-labelledby="coupon-h" className={cn("border-t border-ink pt-6", className)}>
      <h2 id="coupon-h" className="display-xs flex items-center gap-2.5">
        <Tag size={18} strokeWidth={1.6} aria-hidden /> Offers &amp; coupons
      </h2>
      {applied && !error ? (
        <div className="mt-5 flex items-center justify-between gap-3 bg-emerald-tint px-4 py-3 text-emerald">
          <p className="flex items-center gap-2 text-[14px] font-medium"><Check size={16} aria-hidden /> <span className="font-semibold tracking-[0.08em]">{applied}</span> applied</p>
          <button type="button" onClick={() => setCoupon(null)} className="tap inline-flex h-9 items-center gap-1 px-2 text-[12.5px] font-medium underline underline-offset-4" aria-label={`Remove coupon ${applied}`}>
            <X size={14} aria-hidden /> Remove
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => (e.preventDefault(), apply(code))} noValidate className="mt-5">
          <div className="flex gap-2">
            <label htmlFor="coupon-code" className="sr-only">Coupon code</label>
            <input id="coupon-code" value={code} onChange={(e) => (setCode(e.target.value.toUpperCase()), setMsg(null))} placeholder="Enter code" autoCapitalize="characters" autoComplete="off" aria-invalid={msg ? true : undefined} aria-describedby={msg ? "coupon-err" : undefined} className={cn("h-[52px] min-w-0 flex-1 border bg-white px-4 text-[14px] uppercase tabular-nums tracking-[0.12em] focus:border-ink", msg ? "border-danger" : "border-line-strong")} />
            <Button type="submit" variant="secondary" size="lg" disabled={!code.trim()}>Apply</Button>
          </div>
          {(msg || error) && <p id="coupon-err" role="alert" className="mt-2 text-[13px] font-medium text-danger">{msg ?? error}</p>}
        </form>
      )}
      {error && applied && (
        <p role="alert" className="mt-3 text-[13px] font-medium text-danger">
          {applied} no longer applies: {error} <button type="button" className="underline underline-offset-4" onClick={() => setCoupon(null)}>Remove it</button>
        </p>
      )}
      {/* a swipeable rail below 1024px (bleeding off the right edge on phones), a 2-column grid — 4 + 4 of the 8 bag columns — on desktop */}
      <ul tabIndex={0} aria-label="Available offers" className="snap-x-rail scrollbar-none mt-6 flex gap-x-[var(--gap)] overflow-x-auto outline-offset-[-2px] max-sm:-mr-[var(--gutter)] max-sm:pr-[var(--gutter)] lg:grid lg:grid-cols-2 lg:overflow-visible">
        {coupons.filter((c) => !c.expired).map((c) => {
          const r = evaluateCoupon(c.code, lines);
          const on = applied === c.code && !error;
          const blocked = !r.ok && lines.length > 0;
          return (
            <li key={c.code} className={cn("flex w-[82%] shrink-0 flex-col justify-between gap-5 border bg-paper p-5 lg:w-auto", on ? "border-ink" : "border-line")}>
              <div>
                <p className="text-[12.5px] font-semibold tabular-nums tracking-[0.1em]">{c.code}</p>
                <p className="mt-3 text-[15px] font-medium leading-snug">{c.title}</p>
                <p className="mt-1.5 text-[13px] leading-snug text-ink-2">{c.description}</p>
                {blocked && <p className="mt-2 text-[12px] leading-snug text-ink-3">{r.reason}</p>}
              </div>
              <Button variant="secondary" size="sm" className="self-start" aria-label={`${on ? "Applied" : "Apply"} ${c.code}`} disabled={on || blocked} onClick={() => apply(c.code)}>
                {on ? "Applied" : "Apply"}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
