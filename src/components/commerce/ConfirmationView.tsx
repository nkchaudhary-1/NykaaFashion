"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AddressBlock, OrderItemsList, OrderTimeline } from "@/components/account/OrderParts";
import { PriceSummary } from "@/components/commerce/PriceSummary";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { LinkButton } from "@/components/ui/Button";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { SIZES } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SimulatedNotice } from "@/components/ui/Simulated";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { fmtDateLong } from "@/lib/format";
import { popular } from "@/lib/recs";
import { useAuth } from "@/stores/account";

/** A square tick that draws itself — the one moment of motion on the page. */
function SuccessMark() {
  const reduce = useReducedMotion();
  const draw = (delay: number, duration: number) => ({ hidden: { pathLength: 0 }, visible: { pathLength: 1, transition: { duration: reduce ? 0.01 : duration, delay: reduce ? 0 : delay, ease: "easeInOut" as const } } });
  return (
    <motion.svg initial="hidden" animate="visible" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden className="text-ink">
      <motion.rect x="1.5" y="1.5" width="61" height="61" stroke="currentColor" strokeWidth="1.5" variants={draw(0, 0.8)} />
      <motion.path d="M20 33l8 8 16-17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" strokeLinejoin="miter" variants={draw(0.7, 0.5)} />
    </motion.svg>
  );
}

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
      {/* 6 / 6 header: the message on the left, the prototype notice and the way forward on the centre axis */}
      <header className="container-x pb-12 pt-10 sm:pb-16 sm:pt-16">
        <Grid className="items-end gap-y-8">
          <Col span={{ base: 4, sm: 12, lg: 6 }}>
            <SuccessMark />
            <p className="eyebrow mt-8 text-ink-3">Order placed · simulated</p>
            <h1 className="display-lg mt-4">Thank you, {first}.</h1>
            <p className="lede mt-6">
              Order <strong className="font-medium tabular-nums tracking-[0.02em] text-ink">{order.number}</strong> is confirmed. Estimated delivery <strong className="font-medium text-ink">{fmtDateLong(order.eta)}</strong>.
            </p>
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 7 }} rowStart={{ lg: 1 }}>
            <SimulatedNotice className="max-w-[56ch]"><strong>This is a prototype.</strong> No payment was taken, no order was placed with a label, and nothing will ship. The tracking below is simulated.</SimulatedNotice>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href={`/account/orders/${order.id}`} size="lg" iconRight={<ArrowRight size={16} />}>Track order</LinkButton>
              <LinkButton href="/edits" variant="secondary" size="lg">Continue shopping</LinkButton>
            </div>
          </Col>
        </Grid>
      </header>

      {/* 6 / 6 body: order details | what happens next (the tracker stays in view while the details scroll) */}
      <div className="container-x pb-[var(--section-y)]">
        <Grid className="gap-y-14 border-t border-ink pt-10">
          <Col span={{ base: 4, sm: 12, lg: 6 }} className="space-y-12">
            <section aria-labelledby="oi">
              <h2 id="oi" className="display-xs mb-5">In this order</h2>
              <OrderItemsList order={order} />
            </section>
            <section aria-labelledby="od" className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-[var(--gap)]">
              <div>
                <h2 id="od" className="eyebrow mb-3 text-ink-3">Delivering to</h2>
                <AddressBlock a={order.address} />
                <p className="mt-2 text-[12.5px] capitalize text-ink-3">{order.delivery} delivery</p>
              </div>
              <div>
                <h2 className="eyebrow mb-3 text-ink-3">Payment</h2>
                <p className="text-[14px] text-ink-2">{order.payment.detail} <span className="text-ink-3">(simulated)</span></p>
              </div>
            </section>
            <section aria-labelledby="op">
              <h2 id="op" className="display-xs mb-4">Payment summary</h2>
              <PriceSummary b={order.pricing} />
            </section>
          </Col>

          <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 7 }} rowStart={{ lg: 1 }}>
            <section aria-labelledby="ot" className="border border-ink bg-paper p-6 sm:p-8 lg:sticky lg:top-[calc(var(--header-offset)+16px)] lg:transition-[top] lg:duration-500 lg:ease-editorial">
              <h2 id="ot" className="display-xs">What happens next <span className="ml-1 align-middle text-[12px] font-normal tracking-normal text-ink-3">(simulated)</span></h2>
              <p className="mb-7 mt-1.5 text-[13px] text-ink-3">Each step moves on when you press “Simulate” on the order page.</p>
              <OrderTimeline order={order} />
            </section>
          </Col>
        </Grid>
      </div>

      <Section tone="paper" className="border-y border-line">
        <Carousel>
          <SectionHeading eyebrow="While you wait" title="You may also like.">
            <CarouselArrows />
          </SectionHeading>
          <div className="mt-10">
            <CarouselTrack label="You may also like" density="product">
              {popular(8).map((p) => (
                <div key={p.id} className="flex h-full flex-col">
                  <ProductCard product={p} source="confirmation" sizes={SIZES.rail} />
                </div>
              ))}
            </CarouselTrack>
          </div>
        </Carousel>
      </Section>
    </>
  );
}
