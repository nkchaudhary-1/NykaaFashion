import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-line-strong" strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="fill-ink text-ink" strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function RatingLine({ rating, count, className }: { rating: number; count: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12.5px] text-ink-2", className)}>
      <Stars value={rating} size={13} />
      <span className="tabular-nums">{rating.toFixed(1)}</span>
      <span className="text-ink-3">({count.toLocaleString("en-IN")})</span>
    </span>
  );
}
