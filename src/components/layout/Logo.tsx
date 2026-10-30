import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Wordmark in the Nykaa Fashion colours: pink "nykaa" + FASHION. A typographic stand-in set in Inter —
 * swap for the official artwork (SVG) when it is supplied.
 */
export function Logo({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" aria-label="Nykaa Fashion — home" className={cn("tap inline-flex items-baseline gap-1.5 whitespace-nowrap", className)}>
      <span className={cn("text-[28px] font-bold leading-none tracking-[-0.06em]", onDark ? "text-white" : "text-pink")}>nykaa</span>
      <span className={cn("text-[10px] font-semibold uppercase leading-none tracking-[0.32em]", onDark ? "text-white" : "text-ink")}>Fashion</span>
    </Link>
  );
}
