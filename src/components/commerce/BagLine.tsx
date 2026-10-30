"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { Img } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { labelById } from "@/data/labels";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";
import { MAX_QTY, addToBag, moveLineToWishlist, removeLine, setLineQty, type ResolvedLine } from "@/stores/commerce";
import { toast } from "@/stores/ui";

/**
 * Flat quantity control: one outlined box, 44px on touch. At the limits the button is aria-disabled rather than disabled, so a
 * keyboard user who steps down to 1 keeps their place (a disabled button would drop focus to the page).
 */
function Qty({ value, min, max, label, onChange, dense }: { value: number; min: number; max: number; label: string; onChange: (n: number) => void; dense?: boolean }) {
  const btn = cn("inline-flex items-center justify-center text-ink transition-colors hover:bg-sand aria-disabled:cursor-not-allowed aria-disabled:opacity-35 aria-disabled:hover:bg-transparent", dense ? "size-10 [@media(pointer:coarse)]:size-11" : "size-11");
  return (
    <div role="group" aria-label={`Quantity for ${label}`} className="inline-flex items-center border border-line-strong bg-white">
      <button type="button" aria-label={`Decrease quantity of ${label}`} aria-disabled={value <= min || undefined} onClick={() => value > min && onChange(value - 1)} className={btn}>
        <Minus size={15} aria-hidden />
      </button>
      <span aria-live="polite" className="min-w-9 text-center text-[14px] tabular-nums">
        {value}
      </span>
      <button type="button" aria-label={`Increase quantity of ${label}`} aria-disabled={value >= max || undefined} onClick={() => value < max && onChange(value + 1)} className={btn}>
        <Plus size={15} aria-hidden />
      </button>
    </div>
  );
}

/**
 * A line that was just removed takes its button with it; hand focus to the next line's name link (or the dialog / main landmark when
 * the list is empty) so keyboard users keep their place and Esc / Tab still reach the focus trap of an open drawer.
 */
function refocusAfterRemoval(from: HTMLElement) {
  const list = from.closest("ul");
  const root = (from.closest('[role="dialog"]') ?? document.getElementById("main")) as HTMLElement | null;
  requestAnimationFrame(() => {
    const next = list?.isConnected ? list.querySelector<HTMLElement>("a.link-u") : null;
    (next ?? root)?.focus({ preventScroll: true });
  });
}

const textBtn = "tap inline-flex h-11 items-center gap-2 px-2 text-[12.5px] font-medium text-ink-2 transition-colors hover:text-ink";

/**
 * One bag line. Full size: a nested grid whose columns are the page's columns — image 1 of 4 (phones) · 2 of 12 (tablet) · 2 of the
 * 8 bag columns (desktop); details take the rest. `compact` is the mini-bag drawer row: small thumbnail, one column.
 */
export function BagLineRow({ line, compact, onNavigate }: { line: ResolvedLine; compact?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
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
  const removeIt = (e: MouseEvent<HTMLButtonElement>) => {
    const was = { productId: line.productId, variant: line.variant, size: line.size, qty: line.qty };
    refocusAfterRemoval(e.currentTarget);
    removeLine(line.id);
    toast({ title: "Removed from your bag", description: p.name, action: { label: "Undo", onClick: () => addToBag(was.productId, was.variant, was.size, was.qty, "bag-undo") } });
  };
  const moveIt = (e: MouseEvent<HTMLButtonElement>) => {
    refocusAfterRemoval(e.currentTarget);
    moveLineToWishlist(line.id);
    toast({ title: "Moved to your wishlist", description: p.name, action: { label: "View", href: "/wishlist" } });
  };
  const remove = (
    <button
      type="button"
      aria-label={`Remove ${p.name} from bag`}
      onClick={removeIt}
      className={compact ? "inline-flex size-10 items-center justify-center text-ink-2 transition-colors hover:text-danger [@media(pointer:coarse)]:size-11" : cn(textBtn, "hover:text-danger")}
    >
      <Trash2 size={compact ? 17 : 16} aria-hidden />
      {!compact && <span className="hidden sm:inline">Remove</span>}
    </button>
  );

  if (compact) {
    return (
      <li className="flex gap-4 border-b border-line py-4 first:pt-0 last:border-b-0">
        {/* a pointer convenience only: the name link beside it is the one that takes focus (a focusable-but-skipped anchor would confuse the drawer's focus trap) */}
        <div aria-hidden onClick={() => (onNavigate?.(), router.push(href))} className="w-[72px] shrink-0 cursor-pointer">
          <Img imgKey={v.images[0]} alt="" sizes="72px" ratio="4/5" />
        </div>
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
            <button type="button" onClick={moveIt} className={textBtn}>
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
