"use client";
import { Check } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Col } from "@/components/layout/Grid";
import { coupons } from "@/data/commerce";
import { cn } from "@/lib/cn";
import { toast } from "@/stores/ui";

/**
 * Coupon codes as the live site's coupon cards, three to a row on desktop (4 columns each), two on tablets, one on phones:
 * a title and a line of terms on a light surface, then a dashed "code · Copy Code" row — the whole row is the button.
 * Whatever is passed as `aside` fills the rest of the last row (8 columns after one card, 4 after two), so the grid never ends
 * on a hole. Codes are simulated — the toast says so.
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
          <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius-sm)] border border-line-strong">
            <div className="flex-1 bg-paper p-5">
              <p className="text-[17px] font-semibold leading-snug text-ink">{c.title}</p>
              <p className="mt-1.5 text-[14px] leading-snug text-ink-2">{c.description}</p>
            </div>
            <button type="button" onClick={() => copy(c.code)} className="flex h-12 items-center justify-between rounded-none border-t border-dashed border-line-strong bg-white px-5 text-[14px] transition-colors hover:bg-sand">
              <span className="font-medium uppercase tabular-nums tracking-[0.12em] text-ink-2">{c.code}</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-pink">
                {copied === c.code && <Check size={15} aria-hidden />}
                Copy Code
              </span>
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
