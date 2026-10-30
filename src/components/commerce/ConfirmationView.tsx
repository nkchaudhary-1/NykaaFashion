"use client";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AddressBlock, OrderItemsList, OrderTimeline } from "@/components/account/OrderParts";
import { PriceSummary } from "@/components/commerce/PriceSummary";
import { ProductRail } from "@/components/product/Rail";
import { LinkButton } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { SimulatedNotice } from "@/components/ui/Simulated";
import { EmptyState } from "@/components/ui/States";
import { fmtDateLong } from "@/lib/format";
import { popular } from "@/lib/recs";
import { useAuth } from "@/stores/account";

export function ConfirmationView({ id }: { id: string }) {
  const { ready, user, orders } = useAuth();
  const order = orders.find((o) => o.id === id);
  if (!ready) return <div className="container-x py-24" role="status" aria-label="Loading"><Skeleton className="h-10 w-1/2" /><Skeleton className="mt-6 h-40 w-full" /></div>;
  if (!user || !order) {
    return <EmptyState title="We can’t find that order" text="It may belong to another account, or this browser’s data was reset." actions={<><LinkButton href="/account/orders" size="lg">Your orders</LinkButton><LinkButton href="/" variant="secondary" size="lg">Back home</LinkButton></>} />;
  }
  const first = user.name.split(" ")[0];
  return (
    <>
      <header className="container-x pb-10 pt-10 sm:pt-16">
        <motion.svg initial="hidden" animate="visible" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden className="mb-8">
          <motion.circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1, transition: { duration: 0.8, ease: "easeInOut" } } }} />
          <motion.path d="M20 33l8 8 16-17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1, transition: { duration: 0.5, delay: 0.7, ease: "easeOut" } } }} />
        </motion.svg>
        <p className="eyebrow text-ink-3">Order placed · simulated</p>
        <h1 className="display-lg mt-4 max-w-[16ch] text-balance">Thank you, {first}.</h1>
        <p className="lede mt-6">Order <strong className="font-mono text-[15px] font-medium tracking-wide text-ink">{order.number}</strong> is confirmed. Estimated delivery <strong className="font-medium text-ink">{fmtDateLong(order.eta)}</strong>.</p>
        <SimulatedNotice className="mt-8 max-w-2xl"><strong>This is a prototype.</strong> No payment was taken, no order was placed with a label, and nothing will ship. The tracking below is simulated.</SimulatedNotice>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href={`/account/orders/${order.id}`} size="lg" iconRight={<ArrowRight size={16} />}>Track order</LinkButton>
          <LinkButton href="/edits" variant="secondary" size="lg">Continue shopping</LinkButton>
        </div>
      </header>

      <div className="container-x grid gap-12 pb-16 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-20">
        <div className="space-y-12">
          <section aria-labelledby="oi"><h2 id="oi" className="display-xs mb-5">In this order</h2><OrderItemsList order={order} /></section>
          <section aria-labelledby="ot"><h2 id="ot" className="display-xs mb-6">What happens next <span className="ml-2 align-middle text-[12px] font-sans text-ink-3">(simulated)</span></h2><OrderTimeline order={order} /></section>
        </div>
        <aside className="space-y-8 lg:self-start">
          <section aria-labelledby="od" className="border border-line bg-paper p-6">
            <h2 id="od" className="mb-4 text-[15px] font-medium">Delivering to</h2>
            <AddressBlock a={order.address} />
            <h2 className="mb-2 mt-6 text-[15px] font-medium">Payment</h2>
            <p className="text-[14px] text-ink-2">{order.payment.detail} <span className="text-ink-3">(simulated)</span></p>
          </section>
          <section aria-labelledby="op" className="border border-line bg-paper p-6">
            <h2 id="op" className="mb-4 text-[15px] font-medium">Payment summary</h2>
            <PriceSummary b={order.pricing} />
          </section>
        </aside>
      </div>
      <section className="container-x pb-12" aria-labelledby="ym"><h2 id="ym" className="display-sm mb-8">You may also like</h2><ProductRail products={popular(8)} label="You may also like" source="confirmation" /></section>
    </>
  );
}
