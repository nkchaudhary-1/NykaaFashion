"use client";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { Img } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { labelById } from "@/data/labels";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";
import { MAX_QTY, moveLineToWishlist, removeLine, setLineQty, type ResolvedLine } from "@/stores/commerce";
import { toast } from "@/stores/ui";

export function BagLineRow({ line, compact, onNavigate }: { line: ResolvedLine; compact?: boolean; onNavigate?: () => void }) {
  const { product: p, variantData: v } = line;
  const label = labelById[p.labelId];
  const unavailable = line.stock === 0;
  const limit = Math.min(line.stock, MAX_QTY);
  const href = `/p/${p.slug}`;
  return (
    <li className={cn("flex gap-4 border-b border-line py-5 first:pt-0 last:border-b-0", unavailable && "opacity-90")}>
      <Link href={href} onClick={onNavigate} className={cn("shrink-0", compact ? "w-[72px]" : "w-[96px] sm:w-[120px]")} tabIndex={-1} aria-hidden>
        <Img imgKey={v.images[0]} alt="" sizes="120px" ratio="4/5" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="eyebrow text-ink-3">{label.name}</p>
        <Link href={href} onClick={onNavigate} className="link-u mt-1 line-clamp-2 self-start text-[14.5px] leading-snug text-ink">
          {p.name}
        </Link>
        <p className="mt-1 text-[12.5px] text-ink-3">
          {v.colorName}
          {line.size !== "One size" && <> · Size {line.size}</>}
        </p>
        <div className="mt-2">
          <Price price={p.price} mrp={p.mrp} size="sm" />
        </div>
        {unavailable ? (
          <p role="alert" className="mt-2 text-[12.5px] font-medium text-danger">
            This size is no longer available. Remove it to continue.
          </p>
        ) : line.stock <= 3 ? (
          <p className="mt-2 text-[12.5px] font-medium text-amber">Only {line.stock} left</p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          {!unavailable && <QuantityStepper value={line.qty} min={1} max={limit} label={p.name} onChange={(n) => setLineQty(line.id, n)} />}
          <div className="ml-auto flex items-center gap-1">
            {!compact && (
              <button type="button" onClick={() => (moveLineToWishlist(line.id), toast({ title: "Moved to your wishlist", description: p.name, action: { label: "View", href: "/wishlist" } }))} className="inline-flex h-10 items-center gap-1.5 px-2 text-[12.5px] font-medium text-ink-2 hover:text-ink">
                <Heart size={15} aria-hidden /> <span className="hidden sm:inline">Move to wishlist</span>
                <span className="sr-only sm:hidden">Move {p.name} to wishlist</span>
              </button>
            )}
            <button type="button" aria-label={`Remove ${p.name} from bag`} onClick={() => removeLine(line.id)} className="inline-flex size-10 items-center justify-center text-ink-2 transition-colors hover:text-danger">
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      </div>
      {!compact && <p className="hidden shrink-0 text-[14.5px] font-medium tabular-nums sm:block">{inr(p.price * line.qty)}</p>}
    </li>
  );
}
