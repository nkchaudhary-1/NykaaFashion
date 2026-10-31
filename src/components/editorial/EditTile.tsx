"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Img, SIZES, type LoadHint } from "@/components/ui/Img";
import { editProducts } from "@/data/queries";
import type { Edit } from "@/data/types";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";

const COUNTS: Record<string, number> = {};
export const countOf = (e: Edit) => (COUNTS[e.id] ??= editProducts(e).length);
export const productsLabel = (n: number) => `${n} ${n === 1 ? "product" : "products"}`;

export const openEdit = (edit: Edit, source: string) => () => {
  signal("edit_open", { editId: edit.id });
  track("collection_open", { editId: edit.id, source });
};

/**
 * An edit as a silent picture (its scene scales slowly inside the clipped frame on hover or focus) with the title and the count on the page under it,
 * above a hairline — no caption strip laid over the picture. Give it a width on the grid; its height comes from `ratio`.
 */
export function EditTile({ edit, source = "home", load, className, sizes = SIZES.tile, ratio = "4/5" }: { edit: Edit; source?: string; load?: LoadHint; className?: string; sizes?: string; ratio?: string }) {
  return (
    <Link href={`/edits/${edit.id}`} onClick={openEdit(edit, source)} className={cn("group block", className)}>
      <div data-cursor="View" className="overflow-hidden bg-sand">
        <div data-nogrid className="transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.04] group-focus-visible:scale-[1.04]">
          <Img imgKey={`scenes/edit-${edit.id}-tall`} alt="" sizes={sizes} ratio={ratio} load={load} />
        </div>
      </div>
      <span className="mt-3 flex items-start justify-between gap-4 border-b border-line pb-3 transition-colors duration-500 group-hover:border-ink">
        <span className="min-w-0">
          <span className="block text-[16px] font-medium leading-tight tracking-[-0.02em]">{edit.title}</span>
          <span className="mt-1.5 block text-[12px] tabular-nums text-ink-3">{productsLabel(countOf(edit))}</span>
        </span>
        <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
