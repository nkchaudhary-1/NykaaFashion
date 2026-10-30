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
import { useAuth, type OrderStatus } from "@/stores/account";

const ACTIVE: OrderStatus[] = ["created", "confirmed", "packed", "shipped"];
const FILTERS = [{ id: "all", label: "All" }, { id: "active", label: "In progress" }, { id: "delivered", label: "Delivered" }, { id: "closed", label: "Cancelled & returns" }];

export function OrdersView() {
  const { orders } = useAuth();
  const [f, setF] = useState("all");
  const list = orders.filter((o) => (f === "all" ? true : f === "active" ? ACTIVE.includes(o.status) : f === "delivered" ? o.status === "delivered" : ["cancelled", "return-requested", "refunded"].includes(o.status)));
  if (orders.length === 0) {
    return <EmptyState visual={<PackageOpen size={44} strokeWidth={1} className="mx-auto text-ink-3" aria-hidden />} title="No orders yet" text="When you place an order (simulated here), you can track it from this page." actions={<LinkButton href="/edits" size="lg">Explore the edits</LinkButton>} className="py-14" />;
  }
  return (
    <section aria-labelledby="or-h">
      <h2 id="or-h" className="display-sm">Orders &amp; tracking</h2>
      <Tabs items={FILTERS.map((x) => ({ ...x, count: orders.filter((o) => (x.id === "all" ? true : x.id === "active" ? ACTIVE.includes(o.status) : x.id === "delivered" ? o.status === "delivered" : ["cancelled", "return-requested", "refunded"].includes(o.status))).length }))} value={f} onChange={setF} label="Filter orders" className="mt-6" />
      {list.length === 0 ? (
        <p className="py-14 text-center text-[14px] text-ink-3">No orders in this view.</p>
      ) : (
        <ul className="mt-8 space-y-5">
          {list.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="group block border border-line bg-paper p-5 transition-colors hover:border-ink sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[13px] tracking-wide">{o.number}</p>
                    <p className="mt-1 text-[12.5px] text-ink-3">Placed {fmtDate(o.placedAt, { day: "numeric", month: "short", year: "numeric" })} · {o.items.reduce((n, i) => n + i.qty, 0)} items</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <ul className="flex gap-2" aria-label="Items">
                    {o.items.slice(0, 4).map((i, k) => (
                      <li key={k} className="w-14"><Img imgKey={i.image} alt={i.name} sizes="56px" ratio="4/5" /></li>
                    ))}
                    {o.items.length > 4 && <li className="flex w-14 items-center justify-center bg-sand text-[12px] text-ink-2">+{o.items.length - 4}</li>}
                  </ul>
                  <div className="text-right">
                    <p className="text-[15px] font-medium tabular-nums">{inr(o.pricing.total)}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.1em]">Track <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-1" /></p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
