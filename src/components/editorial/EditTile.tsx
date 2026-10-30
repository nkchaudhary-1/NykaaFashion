"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Img, SIZES, type LoadHint } from "@/components/ui/Img";
import { THEMES } from "@/data/edits";
import { editProducts } from "@/data/queries";
import type { Edit } from "@/data/types";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";

const COUNTS: Record<string, number> = {};
const countOf = (e: Edit) => (COUNTS[e.id] ??= editProducts(e).length);

export function EditTile({ edit, source = "home", load, className, sizes = SIZES.tile, ratio = "4/5" }: { edit: Edit; source?: string; load?: LoadHint; className?: string; sizes?: string; ratio?: string }) {
  const t = THEMES[edit.theme];
  return (
    <Link
      href={`/edits/${edit.id}`}
      onClick={() => {
        signal("edit_open", { editId: edit.id });
        track("collection_open", { editId: edit.id, source });
      }}
      className={cn("group block", className)}
    >
      <div className="relative overflow-hidden">
        <Img imgKey={`scenes/edit-${edit.id}-tall`} alt="" sizes={sizes} ratio={ratio} load={load} className="transition-transform duration-[1100ms] ease-editorial group-hover:scale-[1.035]" />
        <span className="absolute left-3 top-3 inline-flex h-6 items-center px-2.5 text-[10px] font-medium uppercase tracking-[0.14em]" style={{ background: t.bg, color: t.fg }}>
          {edit.kicker}
        </span>
      </div>
      <div className="pt-5">
        <h3 className="display-sm">{edit.title}</h3>
        <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-ink-2">{edit.blurb}</p>
        <p className="mt-4 inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-ink">
          <span className="link-u pb-0.5">Shop the edit</span>
          <span className="tabular-nums text-ink-3">{countOf(edit)}</span>
          <ArrowRight size={15} aria-hidden className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
        </p>
      </div>
    </Link>
  );
}
