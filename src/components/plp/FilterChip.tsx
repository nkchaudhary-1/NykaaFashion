import { X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The toolbar's chip: the same flat pill as ui/Chip, a size smaller and in the strip's quieter voice (12.5px, hairline border, solid ink when on).
 * Local to the listing so the strip can be tuned without touching the shared chip. A toggle button (aria-pressed); `removable` chips add an ✕ and a
 * screen-reader "Remove filter".
 */
export function FilterChip({ selected, removable, className, children, ...rest }: { selected?: boolean; removable?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={selected === undefined || removable ? undefined : selected}
      className={cn(
        "tap inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[12.5px] font-medium tracking-[0.01em] transition-colors duration-300 ease-editorial",
        selected ? "border-ink bg-ink text-bone" : removable ? "border-ink bg-transparent text-ink hover:bg-sand" : "border-line-strong bg-transparent text-ink hover:border-ink",
        className,
      )}
      {...rest}
    >
      {children}
      {removable && (
        <>
          <X size={13} aria-hidden />
          <span className="sr-only">Remove filter</span>
        </>
      )}
    </button>
  );
}
