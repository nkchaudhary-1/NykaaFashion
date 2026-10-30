import Link from "next/link";
import { X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Flat pill chip (as on the live site) — filters, suggestions, quick links. 40px tall (44px hit area on touch via `tap`), 1px border,
 * selected = solid ink. `onRemove`-style chips add an ✕ and a screen-reader "Remove" label.
 */
const base = "tap inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[13.5px] font-medium transition-colors";
const state = (selected?: boolean) => (selected ? "border-ink bg-ink text-bone" : "border-line-strong bg-transparent text-ink hover:border-ink");

export function Chip({ selected, removable, className, children, ...rest }: { selected?: boolean; removable?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-pressed={selected === undefined || removable ? undefined : selected} className={cn(base, state(selected), removable && "border-ink", className)} {...rest}>
      {children}
      {removable && (
        <>
          <X size={14} aria-hidden />
          <span className="sr-only">Remove filter</span>
        </>
      )}
    </button>
  );
}

export function ChipLink({ href, selected, className, children, onClick }: { href: string; selected?: boolean; className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Link href={href} aria-current={selected ? "true" : undefined} onClick={onClick} className={cn(base, state(selected), className)}>
      {children}
    </Link>
  );
}
