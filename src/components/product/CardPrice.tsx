import { inr } from "@/lib/format";

/** The quiet price line: the price in medium weight, the struck MRP and the saving in green — only when a real discount exists (PRD §6.1). */
export function CardPrice({ price, mrp }: { price: number; mrp: number }) {
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2.5 tabular-nums">
      <span className="text-[14px] font-medium text-ink">{inr(price)}</span>
      {off > 0 && (
        <>
          <span className="sr-only">, was {inr(mrp)}</span>
          <s aria-hidden className="text-[12.5px] font-normal text-ink-3">
            {inr(mrp)}
          </s>
          <span className="text-[12px] font-medium text-emerald">{off}% off</span>
        </>
      )}
    </p>
  );
}
