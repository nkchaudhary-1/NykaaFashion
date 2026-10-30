import { Check, CircleX, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Img } from "@/components/ui/Img";
import { cn } from "@/lib/cn";
import { fmtDateTime, inr } from "@/lib/format";
import { STAGES, STATUS_LABEL } from "@/lib/orders";
import type { Address, Order, OrderStatus } from "@/stores/account";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = status === "delivered" || status === "refunded" ? "emerald" : status === "cancelled" ? "danger" : status === "return-requested" ? "amber" : "ink";
  return <Badge tone={tone}>{STATUS_LABEL[status]}</Badge>;
}

export function OrderItemsList({ order }: { order: Order }) {
  return (
    <ul aria-label="Items in this order" className="divide-y divide-line">
      {order.items.map((i, k) => (
        <li key={`${i.productId}-${i.size}-${k}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
          <div className="w-[72px] shrink-0"><Img imgKey={i.image} alt="" sizes="72px" ratio="4/5" /></div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-ink-3">{i.label}</p>
            <p className="mt-1 line-clamp-2 text-[14.5px]">{i.name}</p>
            <p className="mt-1 text-[12.5px] text-ink-3">{i.color}{i.size !== "One size" && ` · Size ${i.size}`} · Qty {i.qty}</p>
          </div>
          <p className="shrink-0 text-[14.5px] tabular-nums">{inr(i.price * i.qty)}</p>
        </li>
      ))}
    </ul>
  );
}

export function AddressBlock({ a }: { a: Address }) {
  return (
    <address className="text-[14px] not-italic leading-relaxed text-ink-2">
      <span className="block font-medium text-ink">{a.name}</span>
      {a.line1}{a.line2 ? `, ${a.line2}` : ""}
      {a.landmark && <><br />{a.landmark}</>}
      <br />{a.city}, {a.state} {a.pincode}
      <br />Mobile: {a.mobile}
    </address>
  );
}

/** Tracking timeline: Placed → Confirmed → Packed → Shipped → Delivered, with cancel / return off-ramps. */
export function OrderTimeline({ order }: { order: Order }) {
  const at = (s: OrderStatus) => order.timeline.find((t) => t.status === s);
  const reached = new Set(order.timeline.map((t) => t.status));
  const cancelled = order.status === "cancelled";
  const returned = reached.has("return-requested");
  const steps: Array<{ key: OrderStatus; done: boolean; current: boolean; tone?: "danger" | "amber" }> = [];
  for (const s of STAGES) {
    if (cancelled && !reached.has(s)) continue;
    steps.push({ key: s, done: reached.has(s), current: order.status === s });
  }
  if (cancelled) steps.push({ key: "cancelled", done: true, current: true, tone: "danger" });
  if (returned) {
    steps.push({ key: "return-requested", done: true, current: order.status === "return-requested", tone: "amber" });
    steps.push({ key: "refunded", done: reached.has("refunded"), current: order.status === "refunded" });
  }
  return (
    <ol aria-label="Order tracking" className="relative">
      {steps.map((s, i) => {
        const entry = at(s.key);
        const last = i === steps.length - 1;
        return (
          <li key={s.key} aria-current={s.current ? "step" : undefined} className="relative flex gap-4 pb-7 last:pb-0">
            {!last && <span aria-hidden className={cn("absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px", steps[i + 1].done ? "bg-ink" : "bg-line-strong")} />}
            <span className={cn("relative z-[1] inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px]", s.tone === "danger" ? "border-danger bg-danger text-white" : s.tone === "amber" ? "border-amber bg-amber text-white" : s.done ? "border-ink bg-ink text-bone" : "border-line-strong bg-bone text-ink-3")}>
              {s.key === "cancelled" ? <CircleX size={15} /> : s.key === "return-requested" ? <RotateCcw size={13} /> : s.done ? <Check size={14} strokeWidth={2.6} /> : i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn("text-[14.5px]", s.done ? "font-medium text-ink" : "text-ink-3")}>{STATUS_LABEL[s.key]}</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-ink-3">{entry ? `${fmtDateTime(entry.at)} · ${entry.note}` : "Pending"}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
