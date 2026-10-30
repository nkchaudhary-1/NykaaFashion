"use client";
import Link from "next/link";
import { Heart, Minus, Plus, Trash2 } from "lucide-react";
import { Img } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { labelById } from "@/data/labels";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";
import { MAX_QTY, moveLineToWishlist, removeLine, setLineQty, type ResolvedLine } from "@/stores/commerce";
import { toast } from "@/stores/ui";

/** Flat quantity control: one ink-outlined box, 44px on touch. */
function Qty({ value, min, max, label, onChange, dense }: { value: number; min: number; max: number; label: string; onChange: (n: number) => void; dense?: boolean }) {
  const btn = cn("inline-flex items-center justify-center text-ink transition-colors hover:bg-sand disabled:opacity-35 disabled:hover:bg-transparent", dense ? "size-10 [@media(pointer:coarse)]:size-11" : "size-11");
  return (
    <div role="group" aria-label={`Quantity for ${label}`} className="inline-flex items-center border border-line-strong bg-white">
      <button type="button" aria-label={`Decrease quantity of ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>
        <Minus size={15} aria-hidden />
      </button>
      <span aria-live="polite" className="min-w-9 text-center text-[14px] tabular-nums">
        {value}
      </span>
      <button type="button" aria-label={`Increase quantity of ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>
        <Plus size={15} aria-hidden />
      </button>
    </div>
  );
}

const textBtn = "tap inline-flex h-11 items-center gap-2 px-2 text-[12.5px] font-medium text-ink-2 transition-colors hover:text-ink";

/**
 * One bag line. Full size: a nested grid whose columns are the page's columns — image 1 of 4 (phones) · 2 of 12 (tablet) · 2 of the
 * 8 bag columns (desktop); details take the rest. `compact` is the mini-bag drawer row: small thumbnail, one column.
 */
export function BagLineRow({ line, compact, onNavigate }: { line: ResolvedLine; compact?: boolean; onNavigate?: () => void }) {
  const { product: p, variantData: v } = line;
  const label = labelById[p.labelId];
  const unavailable = line.stock === 0;
  const limit = Math.min(line.stock, MAX_QTY);
  const href = `/p/${p.slug}`;
  const variant = (
    <>
      {v.colorName}
      {line.size !== "One size" && <> · Size {line.size}</>}
    </>
  );
  const notice = unavailable ? (
    <p role="alert" className="mt-2 text-[12.5px] font-medium text-danger">
      This size is no longer available. Remove it to continue.
    </p>
  ) : line.stock <= 3 ? (
    <p className="mt-2 text-[12.5px] font-medium text-amber">Only {line.stock} left</p>
  ) : null;
  const remove = (
    <button
      type="button"
      aria-label={`Remove ${p.name} from bag`}
      onClick={() => removeLine(line.id)}
      className={compact ? "inline-flex size-10 items-center justify-center text-ink-2 transition-colors hover:text-danger [@media(pointer:coarse)]:size-11" : cn(textBtn, "hover:text-danger")}
    >
      <Trash2 size={compact ? 17 : 16} aria-hidden />
      {!compact && <span className="hidden sm:inline">Remove</span>}
    </button>
  );

  if (compact) {
    return (
      <li className="flex gap-4 border-b border-line py-4 first:pt-0 last:border-b-0">
        <Link href={href} onClick={onNavigate} className="w-[72px] shrink-0" tabIndex={-1} aria-hidden>
          <Img imgKey={v.images[0]} alt="" sizes="72px" ratio="4/5" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="eyebrow truncate text-ink-3">{label.name}</p>
          <Link href={href} onClick={onNavigate} className="link-u mt-1 line-clamp-2 self-start text-[14px] leading-snug text-ink">
            {p.name}
          </Link>
          <p className="mt-1 text-[12.5px] text-ink-3">{variant}</p>
          <Price price={p.price} mrp={p.mrp} size="sm" className="mt-1.5" />
          {notice}
          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            {!unavailable ? <Qty dense value={line.qty} min={1} max={limit} label={p.name} onChange={(n) => setLineQty(line.id, n)} /> : <span />}
            {remove}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="grid grid-cols-4 gap-x-[var(--gap)] border-b border-line py-6 sm:grid-cols-12 lg:grid-cols-8">
      <Link href={href} onClick={onNavigate} className="col-span-1 sm:col-span-2" tabIndex={-1} aria-hidden>
        <Img imgKey={v.images[0]} alt="" sizes="(min-width:1024px) 14vw, (min-width:600px) 16vw, 25vw" ratio="4/5" />
      </Link>
      <div className="col-span-3 flex min-w-0 flex-col sm:col-span-10 lg:col-span-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow text-ink-3">{label.name}</p>
            <Link href={href} onClick={onNavigate} className="link-u mt-1.5 line-clamp-2 self-start text-[15px] leading-snug text-ink">
              {p.name}
            </Link>
            <p className="mt-1 text-[13px] text-ink-3">{variant}</p>
            <Price price={p.price} mrp={p.mrp} size="sm" className="mt-2" />
          </div>
          <p className="shrink-0 text-right text-[15px] font-medium tabular-nums">
            {inr(p.price * line.qty)}
            {p.mrp > p.price && (
              <s className="mt-0.5 block text-[12px] font-normal text-ink-3">
                <span className="sr-only">was </span>
                {inr(p.mrp * line.qty)}
              </s>
            )}
          </p>
        </div>
        {notice}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-4">
          {!unavailable ? <Qty value={line.qty} min={1} max={limit} label={p.name} onChange={(n) => setLineQty(line.id, n)} /> : <span />}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => (moveLineToWishlist(line.id), toast({ title: "Moved to your wishlist", description: p.name, action: { label: "View", href: "/wishlist" } }))}
              className={textBtn}
            >
              <Heart size={16} aria-hidden />
              <span className="max-sm:sr-only">Move to wishlist</span>
              <span className="sr-only"> — {p.name}</span>
            </button>
            {remove}
          </div>
        </div>
      </div>
    </li>
  );
}
