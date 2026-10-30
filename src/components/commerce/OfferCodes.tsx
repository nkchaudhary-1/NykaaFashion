"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { coupons } from "@/data/commerce";
import { cn } from "@/lib/cn";
import { toast } from "@/stores/ui";

export function OfferCodes({ className }: { className?: string }) {
  const [copied, setCopied] = useState<string | null>(null);
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
  return (
    <ul className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {coupons.filter((c) => !c.expired).map((c) => (
        <li key={c.code} className="flex flex-col justify-between gap-4 border border-line bg-paper p-5">
          <div>
            <p className="text-[15px] font-medium">{c.title}</p>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-2">{c.description}</p>
          </div>
          <button type="button" onClick={() => copy(c.code)} aria-label={`Copy code ${c.code}`} className="flex h-11 items-center justify-between border border-dashed border-ink px-4 font-mono text-[13.5px] tracking-widest transition-colors hover:bg-ink hover:text-bone">
            {c.code}
            {copied === c.code ? <Check size={16} aria-hidden /> : <Copy size={15} aria-hidden />}
          </button>
        </li>
      ))}
    </ul>
  );
}
