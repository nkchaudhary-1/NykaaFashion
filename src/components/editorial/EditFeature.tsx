"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Img, SIZES, type LoadHint } from "@/components/ui/Img";
import type { Edit } from "@/data/types";
import { cn } from "@/lib/cn";
import { countOf, openEdit, productsLabel } from "./EditTile";

/**
 * The big editorial version used on the Edits index: a picture — its scene, scaling slowly inside the clipped frame — and, on the page under it,
 * a numeral, the kicker, the title in display type, one line of copy and the count. The picture keeps `ratio`; with `fill` it takes the height its
 * row gives it from 1024px up (the parent is a grid cell stretched to the row), so two neighbours end on the same line.
 */
export function EditFeature({ edit, index, source = "edits-index", sizes = SIZES.half, load, position = "50% 20%", imgKey, ratio = "4/5", fill, size = "lg", className }: { edit: Edit; index: number; source?: string; sizes?: string; load?: LoadHint; position?: string; imgKey?: string; ratio?: string; fill?: boolean; size?: "md" | "lg"; className?: string }) {
  return (
    <Link href={`/edits/${edit.id}`} onClick={openEdit(edit, source)} className={cn("group flex flex-col", fill && "lg:h-full", className)}>
      <div data-cursor="View" className={cn("relative aspect-[var(--r)] overflow-hidden bg-sand", fill && "lg:aspect-auto lg:min-h-0 lg:flex-1")} style={{ "--r": ratio } as CSSProperties}>
        <div data-nogrid className="absolute inset-0 transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.04] group-focus-visible:scale-[1.04]">
          <Img imgKey={imgKey ?? `scenes/edit-${edit.id}-tall`} alt="" sizes={sizes} ratio="fill" load={load} position={position} className="absolute inset-0 h-full" />
        </div>
      </div>
      <span className="mt-4 grid grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-x-3 border-b border-line pb-5 transition-colors duration-500 group-hover:border-ink">
        <span className="pt-1 text-[11px] tabular-nums text-ink-3">{String(index + 1).padStart(2, "0")}</span>
        <span className="min-w-0">
          <span className="eyebrow block text-ink-3">{edit.kicker}</span>
          <span className={cn("mt-3 block", size === "lg" ? "display-md" : "display-sm")}>{edit.title}</span>
          <span className="mt-3 line-clamp-2 block max-w-[46ch] text-[14px] leading-snug text-ink-2">{edit.blurb}</span>
          <span className="mt-3 block text-[12px] tabular-nums text-ink-3">{productsLabel(countOf(edit))}</span>
        </span>
        <ArrowUpRight size={size === "lg" ? 28 : 22} strokeWidth={1.4} aria-hidden className="mt-1 shrink-0 transition-transform duration-500 ease-expo group-hover:-translate-y-1 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
