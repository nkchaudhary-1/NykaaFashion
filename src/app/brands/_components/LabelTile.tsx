import Link from "next/link";
import { LabelMonogram } from "@/components/product/LabelMark";
import { Img, SIZES } from "@/components/ui/Img";
import type { Label } from "@/data/types";
import { productsByLabel } from "@/data/queries";
import { cn } from "@/lib/cn";

/** The label's picture: its most prominent piece that is in stock. */
export const labelImage = (id: string) => {
  const list = productsByLabel(id);
  return (list.find((p) => !p.soldOut) ?? list[0]).variants[0].images[0];
};

/**
 * A label as a tile on the grid: a real piece from the label with its monogram in the corner, then name and origin.
 * Width comes from the column it sits in (a carousel slot or a `span-3` cell).
 */
export function LabelTile({ label, onDark, sizes = SIZES.tile, load, ratio = "4/5" }: { label: Label; onDark?: boolean; sizes?: string; load?: "eager"; ratio?: string }) {
  const n = productsByLabel(label.id).length;
  return (
    <Link href={`/brands/${label.id}`} className="group block">
      <div className="relative overflow-hidden bg-sand">
        <Img imgKey={labelImage(label.id)} alt="" sizes={sizes} ratio={ratio} load={load} className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.04]" />
        <LabelMonogram label={label} size="sm" className="absolute left-0 top-0" />
      </div>
      <p className={cn("mt-3 text-[15px] font-medium leading-tight tracking-[-0.01em]", onDark && "text-bone")}>{label.name}</p>
      <p className={cn("mt-1 truncate text-[12.5px] tabular-nums", onDark ? "text-bone" : "text-ink-3")}>
        {[label.origin, `${n} ${n === 1 ? "piece" : "pieces"}`].filter(Boolean).join(" · ")}
      </p>
    </Link>
  );
}
