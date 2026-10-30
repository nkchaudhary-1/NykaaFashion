import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" aria-label="Nykaa Fashion — home" className={cn("tap inline-flex items-baseline gap-2 whitespace-nowrap", onDark ? "text-bone" : "text-ink", className)}>
      <span className="text-[26px] font-semibold leading-none tracking-[-0.055em]">
        Nykaa<span className="text-pink" aria-hidden>.</span>
      </span>
      <span className="text-[9.5px] font-semibold uppercase leading-none tracking-[0.3em]">Fashion</span>
    </Link>
  );
}
