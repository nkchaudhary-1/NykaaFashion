"use client";
import { Check, Tag, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { coupons } from "@/data/commerce";
import { cn } from "@/lib/cn";
import { evaluateCoupon, type PricedLine } from "@/lib/pricing";
import { setCoupon } from "@/stores/commerce";
import { toast } from "@/stores/ui";

/** Coupon entry + available offers. Valid / invalid / expired / minimum-not-met states are all real (simulated rules). */
export function CouponBox({ lines, applied, error }: { lines: PricedLine[]; applied: string | null; error: string | null }) {
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
    <section aria-labelledby="coupon-h" className="border border-line bg-paper p-5">
      <h2 id="coupon-h" className="flex items-center gap-2 text-[14px] font-medium">
        <Tag size={16} aria-hidden /> Offers &amp; coupons
      </h2>
      {applied && !error ? (
        <div className="mt-4 flex items-center justify-between gap-3 bg-emerald-tint px-4 py-3 text-emerald">
          <p className="flex items-center gap-2 text-[14px] font-medium"><Check size={16} aria-hidden /> <span className="font-mono tracking-wider">{applied}</span> applied</p>
          <button type="button" onClick={() => setCoupon(null)} className="inline-flex h-9 items-center gap-1 px-2 text-[12.5px] font-medium underline underline-offset-4" aria-label={`Remove coupon ${applied}`}>
            <X size={14} aria-hidden /> Remove
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => (e.preventDefault(), apply(code))} noValidate className="mt-4">
          <div className="flex gap-2">
            <label htmlFor="coupon-code" className="sr-only">Coupon code</label>
            <input id="coupon-code" value={code} onChange={(e) => (setCode(e.target.value.toUpperCase()), setMsg(null))} placeholder="Enter code" autoCapitalize="characters" autoComplete="off" aria-invalid={msg ? true : undefined} aria-describedby={msg ? "coupon-err" : undefined} className={cn("h-11 min-w-0 flex-1 border bg-white px-4 font-mono text-[14px] uppercase tracking-widest focus:border-ink", msg ? "border-danger" : "border-line-strong")} />
            <Button type="submit" variant="secondary" disabled={!code.trim()}>Apply</Button>
          </div>
          {(msg || error) && <p id="coupon-err" role="alert" className="mt-2 text-[13px] font-medium text-danger">{msg ?? error}</p>}
        </form>
      )}
      {error && applied && (
        <p role="alert" className="mt-3 text-[13px] font-medium text-danger">
          {applied} no longer applies: {error} <button type="button" className="underline underline-offset-4" onClick={() => setCoupon(null)}>Remove it</button>
        </p>
      )}
      <ul className="mt-5 divide-y divide-line border-t border-line">
        {coupons.filter((c) => !c.expired).map((c) => {
          const r = evaluateCoupon(c.code, lines);
          const on = applied === c.code && !error;
          return (
            <li key={c.code} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-mono text-[12.5px] font-medium tracking-wider">{c.code}</p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-ink-2">{c.description}</p>
                {!r.ok && lines.length > 0 && <p className="mt-1 text-[12px] text-ink-3">{r.reason}</p>}
              </div>
              <button type="button" disabled={on || (!r.ok && lines.length > 0)} onClick={() => apply(c.code)} className="inline-flex h-9 shrink-0 items-center px-2 text-[12px] font-medium uppercase tracking-[0.1em] text-ink underline underline-offset-4 disabled:no-underline disabled:opacity-40">
                {on ? "Applied" : "Apply"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
