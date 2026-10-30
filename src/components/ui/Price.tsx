import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";

/**
 * Price block. Discount chrome appears ONLY when a real discount exists (PRD §6.1).
 * Discount text is the live site's green (AA on white and grey) and always carries the "% off" words — never colour alone.
 */
export function Price({ price, mrp, size = "md", className, showSavings = true }: { price: number; mrp: number; size?: "sm" | "md" | "lg"; className?: string; showSavings?: boolean }) {
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 tabular-nums", size === "lg" ? "text-[22px]" : size === "md" ? "text-[14.5px]" : "text-[13px]", className)}>
      <span className="font-bold text-ink">{inr(price)}</span>
      {discount > 0 && (
        <>
          <span className="sr-only">, was {inr(mrp)}</span>
          <s aria-hidden className={cn("font-normal text-ink-3", size === "lg" ? "text-[15px]" : "text-[12.5px]")}>
            {inr(mrp)}
          </s>
          {showSavings && <span className={cn("font-semibold text-emerald", size === "lg" ? "text-[14px]" : "text-[12px]")}>{discount}% off</span>}
        </>
      )}
    </p>
  );
}
