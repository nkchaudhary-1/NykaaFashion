"use client";
import Link from "next/link";
import { ArrowRight, PackageOpen } from "lucide-react";
import { useState } from "react";
import { OrderStatusBadge } from "@/components/account/OrderParts";
import { Img } from "@/components/ui/Img";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { fmtDate, inr } from "@/lib/format";
import { useAuth, type Order, type OrderStatus } from "@/stores/account";

const ACTIVE: OrderStatus[] = ["created", "confirmed", "packed", "shipped"];
const CLOSED: OrderStatus[] = ["cancelled", "return-requested", "refunded"];
const FILTERS = [{ id: "all", label: "All" }, { id: "active", label: "In progress" }, { id: "delivered", label: "Delivered" }, { id: "closed", label: "Cancelled & returns" }];
const inFilter = (o: Order, f: string) => (f === "all" ? true : f === "active" ? ACTIVE.includes(o.status) : f === "delivered" ? o.status === "delivered" : CLOSED.includes(o.status));

/** The line of text that sits under the status badge. */
function statusNote(o: Order): string {
  if (o.status === "delivered") return `Delivered ${fmtDate(o.timeline[o.timeline.length - 1]?.at ?? o.eta, { day: "numeric", month: "short" })}`;
  if (o.status === "cancelled") return "Cancelled before shipping";
  if (o.status === "return-requested") return "Pickup to be scheduled";
  if (o.status === "refunded") return "Refund processed";
  return `Arriving ${fmtDate(o.eta, { weekday: "short", day: "numeric", month: "short" })}`;
}

// The same four column groups at every size, so a list of rows reads as a table: phones 2 + 2 over 3 + 1 of the 4 columns,
// tablets 3 · 4 · 3 · 2 of 12, desktop 2 · 3 · 2 · 2 of the 9 content columns.
const ROW = "grid grid-cols-4 gap-x-[var(--gap)] sm:grid-cols-12 lg:grid-cols-9";
const C_NUM = "col-span-2 sm:col-span-3 lg:col-span-2";
const C_ITEMS = "order-3 col-span-3 sm:order-2 sm:col-span-4 lg:col-span-3";
const C_STATUS = "order-2 col-span-2 sm:order-3 sm:col-span-3 lg:col-span-2";
const C_TOTAL = "order-4 col-span-1 text-right sm:col-span-2 lg:col-span-2";

/** One order as a full-row link: number and date · thumbnails · status badge and note · total. Square thumbs, tabular numbers. */
export function OrderRow({ order: o }: { order: Order }) {
  const count = o.items.reduce((n, i) => n + i.qty, 0);
  const shown = o.items.length > 3 ? o.items.slice(0, 2) : o.items;
  const extra = o.items.length - shown.length;
  return (
    <li>
      <Link href={`/account/orders/${o.id}`} className={`group ${ROW} items-start gap-y-4 border-b border-line py-5 sm:items-center`}>
        <div className={C_NUM}>
          <p className="text-[15px] font-medium tabular-nums tracking-[0.02em] underline decoration-transparent decoration-1 underline-offset-4 transition-colors group-hover:decoration-ink">{o.number}</p>
          <p className="mt-1 text-[12.5px] leading-snug text-ink-3">Placed {fmtDate(o.placedAt, { day: "numeric", month: "short", year: "numeric" })} · {count} {count === 1 ? "item" : "items"}</p>
        </div>
        <ul className={`${C_ITEMS} flex gap-2`} aria-label="Items">
          {shown.map((i, k) => (
            <li key={k} className="w-14 shrink-0">
              <Img imgKey={i.image} alt={i.name} sizes="56px" ratio="4/5" />
            </li>
          ))}
          {extra > 0 && <li className="flex w-14 shrink-0 items-center justify-center bg-sand text-[13px] tabular-nums text-ink-2">+{extra}</li>}
        </ul>
        <div className={C_STATUS}>
          <OrderStatusBadge status={o.status} />
          <p className="mt-2 text-[12.5px] leading-snug text-ink-3">{statusNote(o)}</p>
        </div>
        <div className={C_TOTAL}>
          <p className="text-[15px] font-medium tabular-nums">{inr(o.pricing.total)}</p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.09em] text-pink-ink">
            Track <ArrowRight size={13} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
          </p>
        </div>
      </Link>
    </li>
  );
}

export function OrdersView() {
  const { orders } = useAuth();
  const [f, setF] = useState("all");
  const list = orders.filter((o) => inFilter(o, f));
  if (orders.length === 0) {
    return <EmptyState visual={<PackageOpen size={44} strokeWidth={1} className="mx-auto text-ink-3" aria-hidden />} title="No orders yet" text="When you place an order (simulated here), you can track it from this page." actions={<LinkButton href="/edits" size="lg">Explore the edits</LinkButton>} className="py-14" />;
  }
  return (
    <section aria-labelledby="or-h">
      <h2 id="or-h" className="display-sm">Orders &amp; tracking</h2>
      <Tabs items={FILTERS.map((x) => ({ ...x, count: orders.filter((o) => inFilter(o, x.id)).length }))} value={f} onChange={setF} label="Filter orders" className="mt-6" />
      {list.length === 0 ? (
        <p className="py-14 text-center text-[14px] text-ink-3">No orders in this view.</p>
      ) : (
        <>
          <div aria-hidden className="mt-8 hidden gap-x-[var(--gap)] border-b border-ink pb-3 sm:grid sm:grid-cols-12 lg:grid-cols-9">
            <p className={`eyebrow text-ink-3 ${C_NUM}`}>Order</p>
            <p className={`eyebrow text-ink-3 ${C_ITEMS}`}>Items</p>
            <p className={`eyebrow text-ink-3 ${C_STATUS}`}>Status</p>
            <p className={`eyebrow text-ink-3 ${C_TOTAL}`}>Total</p>
          </div>
          <ul className="sm:mt-0">
            {list.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
