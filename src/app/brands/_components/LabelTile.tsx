import Link from "next/link";
import { LabelMonogram } from "@/components/product/LabelMark";
import { Img, SIZES } from "@/components/ui/Img";
import type { Label } from "@/data/types";
import { productsByLabel } from "@/data/queries";
import { cn } from "@/lib/cn";
import { legible } from "./labelTone";

/** The label's picture: its most prominent piece that is in stock. */
export const labelImage = (id: string) => {
  const list = productsByLabel(id);
  return (list.find((p) => !p.soldOut) ?? list[0]).variants[0].images[0];
};

/**
 * A label as a tile on the grid: a real piece from the label (scaling slowly inside its clipped frame on hover or focus) with its monogram in the corner,
 * then name and origin on the page beneath it. Width comes from the column it sits in (a carousel slot or a `span-3` cell). `meta` replaces the
 * default "origin · N products" line.
 */
export function LabelTile({ label, onDark, sizes = SIZES.tile, load, ratio = "4/5", meta }: { label: Label; onDark?: boolean; sizes?: string; load?: "eager"; ratio?: string; meta?: string }) {
  const n = productsByLabel(label.id).length;
  return (
    <Link href={`/brands/${label.id}`} className="group block">
      <div data-cursor="View" className="relative overflow-hidden bg-sand">
        <div data-nogrid className="transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.04] group-focus-visible:scale-[1.04]">
          <Img imgKey={labelImage(label.id)} alt="" sizes={sizes} ratio={ratio} load={load} />
        </div>
        <LabelMonogram label={legible(label)} size="sm" className="absolute left-0 top-0" />
      </div>
      <p className={cn("mt-4 text-[16px] font-medium leading-tight tracking-[-0.02em]", onDark && "text-bone")}>{label.name}</p>
      <p className={cn("mt-1.5 truncate text-[12.5px] tabular-nums", onDark ? "text-bone" : "text-ink-3")}>{meta ?? [label.origin, `${n} ${n === 1 ? "product" : "products"}`].filter(Boolean).join(" · ")}</p>
    </Link>
  );
}
