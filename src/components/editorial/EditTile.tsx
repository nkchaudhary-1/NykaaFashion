"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BentoTile } from "@/components/ui/BentoTile";
import { Img, SIZES, type LoadHint } from "@/components/ui/Img";
import { THEMES } from "@/data/edits";
import { editProducts } from "@/data/queries";
import type { Edit } from "@/data/types";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";

const COUNTS: Record<string, number> = {};
const countOf = (e: Edit) => (COUNTS[e.id] ??= editProducts(e).length);
const pieces = (n: number) => `${n} ${n === 1 ? "piece" : "pieces"}`;

const open = (edit: Edit, source: string) => () => {
  signal("edit_open", { editId: edit.id });
  track("collection_open", { editId: edit.id, source });
};

/** An edit as a flat image tile (scene + caption strip). Give it a width on the grid; its height comes from `ratio`. */
export function EditTile({ edit, source = "home", load, className, sizes = SIZES.tile, ratio = "4/5" }: { edit: Edit; source?: string; load?: LoadHint; className?: string; sizes?: string; ratio?: string }) {
  return <BentoTile href={`/edits/${edit.id}`} imgKey={`scenes/edit-${edit.id}-tall`} title={edit.title} meta={pieces(countOf(edit))} ratio={ratio} sizes={sizes} load={load} className={className} onClick={open(edit, source)} />;
}

/**
 * The big editorial version used on the Edits index: a scene that fills the box the grid gives it, with a flat caption panel
 * in the edit's own colour — kicker, title, one line of copy and the count. Parent must be `relative` with a height
 * (an aspect ratio on phones/tablets, the row height on desktop).
 */
export function EditFeature({ edit, source = "edits-index", sizes = SIZES.half, load, position = "50% 20%", imgKey, size = "lg" }: { edit: Edit; source?: string; sizes?: string; load?: LoadHint; position?: string; imgKey?: string; size?: "md" | "lg" }) {
  const t = THEMES[edit.theme];
  const dark = edit.theme !== "sand" && edit.theme !== "hon";
  return (
    <Link href={`/edits/${edit.id}`} onClick={open(edit, source)} className="group absolute inset-0 block overflow-hidden bg-sand">
      <Img imgKey={imgKey ?? `scenes/edit-${edit.id}-tall`} alt="" sizes={sizes} ratio="fill" load={load} position={position} className="absolute inset-0 h-full transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.03]" />
      <span className={cn("absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 sm:p-5", size === "lg" && "lg:p-6", dark && "on-dark")} style={{ background: t.bg, color: t.fg }}>
        <span className="eyebrow">{edit.kicker}</span>
        <span className="flex items-start justify-between gap-4">
          <span className={cn("font-medium leading-[1.05] tracking-[-0.025em]", size === "lg" ? "text-[26px] sm:text-[30px]" : "text-[22px] sm:text-[24px]")}>{edit.title}</span>
          <ArrowUpRight size={size === "lg" ? 26 : 22} aria-hidden className="mt-0.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
        <span className="line-clamp-2 max-w-[46ch] text-[14px] leading-snug">{edit.blurb}</span>
        <span className="text-[12px] font-semibold uppercase tracking-[0.09em] tabular-nums">Shop the edit · {pieces(countOf(edit))}</span>
      </span>
    </Link>
  );
}
