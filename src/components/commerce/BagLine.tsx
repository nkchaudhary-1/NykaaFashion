"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Info, Minus, Plus, X } from "lucide-react";
import type { MouseEvent } from "react";
import { Img } from "@/components/ui/Img";
import { lookupPincode } from "@/data/commerce";
import { labelById } from "@/data/labels";
import { DAY, useNow } from "@/lib/clock";
import { cn } from "@/lib/cn";
import { fmtDate, inr } from "@/lib/format";
import { useAuth } from "@/stores/account";
import { MAX_QTY, addToBag, moveLineToWishlist, removeLine, setLineQty, type ResolvedLine } from "@/stores/commerce";
import { toast } from "@/stores/ui";

/**
 * Quantity control: one outlined box, 44px on touch. At the limits the button is aria-disabled rather than disabled, so a
 * keyboard user who steps down to 1 keeps their place (a disabled button would drop focus to the page).
 */
function Qty({ value, min, max, label, onChange }: { value: number; min: number; max: number; label: string; onChange: (n: number) => void }) {
  const btn = "inline-flex size-9 items-center justify-center text-ink transition-colors hover:bg-sand aria-disabled:cursor-not-allowed aria-disabled:opacity-35 aria-disabled:hover:bg-transparent [@media(pointer:coarse)]:size-11";
  return (
    <div role="group" aria-label={`Quantity for ${label}`} className="inline-flex items-center rounded-[var(--radius-sm)] border border-line-strong bg-white">
      <span aria-hidden className="pl-3 text-[14px] text-ink-2">Qty</span>
      <button type="button" aria-label={`Decrease quantity of ${label}`} aria-disabled={value <= min || undefined} onClick={() => value > min && onChange(value - 1)} className={btn}>
        <Minus size={14} aria-hidden />
      </button>
      <span aria-live="polite" className="min-w-5 text-center text-[15px] font-semibold tabular-nums">
        {value}
      </span>
      <button type="button" aria-label={`Increase quantity of ${label}`} aria-disabled={value >= max || undefined} onClick={() => value < max && onChange(value + 1)} className={btn}>
        <Plus size={14} aria-hidden />
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

/** "Fri, 6 Nov" — the simulated delivery date: the default address's service area, else five days out. */
function useDeliveryBy() {
  const now = useNow();
  const { addresses } = useAuth();
  const home = addresses.find((a) => a.isDefault) ?? addresses[0];
  const area = home ? lookupPincode(home.pincode) : null;
  return fmtDate(now + (area && area.ok ? area.area.days : 5) * DAY, { weekday: "short", day: "numeric", month: "short" });
}

/** "You Pay ₹1,200 · 50% off ₹2,399" — the line total, with the saving in green. */
function YouPay({ line, className }: { line: ResolvedLine; className?: string }) {
  const { product: p, qty } = line;
  const off = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return (
    <div className={cn("text-right tabular-nums", className)}>
      <p className="flex items-center justify-end gap-1.5 text-[15px] text-ink-2">
        <Info size={14} strokeWidth={1.6} aria-hidden className="text-ink-3" />
        You Pay <strong className="text-[18px] font-medium tracking-[-0.01em] text-ink">{inr(p.price * qty)}</strong>
      </p>
      {off > 0 && (
        <p className="mt-0.5 text-[14px]">
          <span className="font-semibold text-emerald">{off}% off</span>{" "}
          <s className="text-ink-3">
            <span className="sr-only">was </span>
            {inr(p.mrp * qty)}
          </s>
        </p>
      )}
    </div>
  );
}

const chip = "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-sand px-3 text-[14px] text-ink-2";
const textBtn = "tap inline-flex h-11 items-center gap-2 px-2 text-[14px] font-semibold text-ink-2 transition-colors hover:text-ink";

/**
 * One bag line, after the live bag: brand, one-line name, Size / colour chips and a quantity box, "Delivery by …", a round ✕ to remove,
 * and "You Pay" with the saving. Full size is a nested grid on the page's columns — image 1 of 4 (phones) · 2 of 12 (tablet) · 2 of the 8 bag
 * columns (desktop) — with "You Pay" beside the details from 600px. `compact` is the mini-bag drawer row (small image, one column).
 */
export function BagLineRow({ line, compact, onNavigate }: { line: ResolvedLine; compact?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const deliveryBy = useDeliveryBy();
  const { product: p, variantData: v } = line;
  const label = labelById[p.labelId];
  const unavailable = line.stock === 0;
  const limit = Math.min(line.stock, MAX_QTY);
  const href = `/p/${p.slug}`;

  const notice = unavailable ? (
    <p role="alert" className="mt-3 text-[13px] font-medium text-danger">
      This size is no longer available. Remove it to continue.
    </p>
  ) : line.stock <= 3 ? (
    <p className="mt-3 text-[13px] font-medium text-amber">Only {line.stock} left</p>
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
  // a round grey ✕ (inline radius: a circle by nature, and the global control radius would otherwise win over a utility class)
  const remove = (
    <button type="button" aria-label={`Remove ${p.name} from bag`} onClick={removeIt} style={{ borderRadius: "50%" }} className="tap inline-flex size-7 shrink-0 items-center justify-center bg-sand text-ink-2 transition-colors hover:bg-stone hover:text-ink">
      <X size={14} strokeWidth={2.2} aria-hidden />
    </button>
  );

  const chips = (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className={chip}>
        <span aria-hidden className="size-3 rounded-full border border-ink/15" style={{ backgroundColor: v.colorHex }} />
        {v.colorName}
      </span>
      {line.size !== "One size" && (
        <span className={chip}>
          Size <strong className="font-semibold text-ink">{line.size}</strong>
        </span>
      )}
      {!unavailable && <Qty value={line.qty} min={1} max={limit} label={p.name} onChange={(n) => setLineQty(line.id, n)} />}
    </div>
  );

  if (compact) {
    return (
      <li className="border-b border-line py-5 first:pt-1">
        <div className="flex gap-4">
          {/* a pointer convenience only: the name link beside it is the one that takes focus (a focusable-but-skipped anchor would confuse the drawer's focus trap) */}
          <div aria-hidden onClick={() => (onNavigate?.(), router.push(href))} className="w-24 shrink-0 cursor-pointer self-start">
            <Img imgKey={v.images[0]} alt="" sizes="96px" ratio="4/5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow mb-1.5 truncate text-ink">{label.name}</p>
                <Link href={href} onClick={onNavigate} className="link-u block truncate text-[15px] leading-snug text-ink-2">
                  {p.name}
                </Link>
              </div>
              {remove}
            </div>
            {chips}
            <p className="mt-3 text-[14px] text-ink-2">Delivery by {deliveryBy}</p>
            {notice}
          </div>
        </div>
        <YouPay line={line} className="mt-4 border-t border-line pt-3" />
      </li>
    );
  }

  return (
    <li className="grid grid-cols-4 gap-x-[var(--gap)] border-b border-line py-7 sm:grid-cols-12 lg:grid-cols-8">
      <Link href={href} onClick={onNavigate} className="col-span-1 self-start sm:col-span-2" tabIndex={-1} aria-hidden>
        <Img imgKey={v.images[0]} alt="" sizes="(min-width:1024px) 14vw, (min-width:600px) 16vw, 25vw" ratio="4/5" />
      </Link>
      <div className="col-span-3 min-w-0 sm:col-span-10 lg:col-span-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow mb-1.5 truncate text-ink">{label.name}</p>
            <Link href={href} onClick={onNavigate} className="link-u line-clamp-2 text-[15px] leading-snug text-ink-2 sm:truncate">
              {p.name}
            </Link>
            {chips}
            <p className="mt-3 text-[14px] text-ink-2">Delivery by {deliveryBy}</p>
          </div>
          <div className="flex shrink-0 items-start gap-5">
            <YouPay line={line} className="hidden sm:block" />
            {remove}
          </div>
        </div>
        {notice}
        <YouPay line={line} className="mt-4 border-t border-line pt-3 sm:hidden" />
        <div className="mt-2 flex items-center">
          <button type="button" onClick={moveIt} className={cn(textBtn, "-ml-2")}>
            <Heart size={16} aria-hidden />
            <span>Move to wishlist</span>
            <span className="sr-only"> — {p.name}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
