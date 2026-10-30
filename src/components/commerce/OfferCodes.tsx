"use client";
import { Check, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Col } from "@/components/layout/Grid";
import { coupons } from "@/data/commerce";
import type { Coupon } from "@/data/types";
import { inr } from "@/lib/format";
import { cn } from "@/lib/cn";
import { toast } from "@/stores/ui";

const headline = (c: Coupon) => (c.type === "percent" ? `${c.value}% off${c.maxDiscount ? ` · up to ${inr(c.maxDiscount)}` : ""}` : `${inr(c.value)} off`);

/**
 * Coupon codes as flat tiles, three to a row on desktop (4 columns each), two on tablets, one on phones. Click-to-copy: the code is
 * the button. Whatever is passed as `aside` fills the rest of the last row (8 columns after one tile, 4 after two), so the grid never
 * ends on a hole. Codes are simulated — the toast says so.
 */
export function OfferCodes({ className, aside }: { className?: string; aside?: ReactNode }) {
  const [copied, setCopied] = useState<string | null>(null);
  const active = coupons.filter((c) => !c.expired);
  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard may be unavailable — still confirm so the flow is testable */
    }
    setCopied(code);
    toast({ title: `Code ${code} copied`, description: "Apply it in your bag — simulated coupon." });
    setTimeout(() => setCopied(null), 2200);
  };
  const rest = active.length % 3;
  return (
    <ul className={cn("grid-main gap-y-[var(--gap)]", className)}>
      {active.map((c) => (
        <Col as="li" key={c.code} span={{ base: 4, sm: 6, lg: 4 }}>
          <div className="flex h-full min-h-[220px] flex-col justify-between gap-8 border border-ink p-5 sm:p-6">
            <div>
              <p className="eyebrow text-ink-3">{headline(c)}</p>
              <p className="display-xs mt-4">{c.title}</p>
              <p className="mt-2 text-[14px] leading-snug text-ink-2">{c.description}</p>
            </div>
            <button type="button" onClick={() => copy(c.code)} aria-label={`Copy code ${c.code}`} className="flex h-12 items-center justify-between border border-dashed border-ink px-4 text-[14px] font-medium tabular-nums tracking-[0.18em] transition-colors hover:bg-ink hover:text-bone">
              {c.code}
              {copied === c.code ? <Check size={16} aria-hidden /> : <Copy size={15} aria-hidden />}
            </button>
          </div>
        </Col>
      ))}
      {aside && rest !== 0 && (
        <Col as="li" span={{ base: 4, sm: 12, lg: rest === 1 ? 8 : 4 }}>
          {aside}
        </Col>
      )}
    </ul>
  );
}
