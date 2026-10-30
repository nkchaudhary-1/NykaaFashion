import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" aria-label="Nykaa Fashion — home" className={cn("inline-flex items-baseline gap-2 whitespace-nowrap", onDark ? "text-bone" : "text-ink", className)}>
      <span className="font-display text-[31px] leading-none tracking-[-0.02em]">
        Nykaa<span className="text-pink" aria-hidden>.</span>
      </span>
      <span className="text-[9.5px] font-medium uppercase leading-none tracking-[0.36em]">Fashion</span>
    </Link>
  );
}
