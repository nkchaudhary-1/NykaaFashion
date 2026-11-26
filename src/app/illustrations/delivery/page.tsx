import type { Metadata } from "next";
import { DeliveryScene } from "@/components/illustrations/DeliveryScene";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "On its way — delivery illustration", description: "Brand illustration: a Nykaa Fashion courier climbing a hill through the city." };

export default function DeliveryIllustrationPage() {
  return (
    <>
      <PageHeader crumbs={[{ name: "Home", href: "/" }, { name: "Illustrations" }]} eyebrow="Illustration · delivery" title={<>On its <em>way.</em></>} intro="A courier, a pink scooter and a box of something you chose. Loops gently; still under reduced motion." />
      <section aria-label="Delivery illustration" className="container-x pb-16">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-[4px] sm:aspect-video">
          <DeliveryScene />
        </div>
      </section>
    </>
  );
}
