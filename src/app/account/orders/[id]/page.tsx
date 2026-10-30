import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderDetail } from "@/components/account/OrderDetail";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Order details" };

export default function OrderPage(props: PageProps<"/account/orders/[id]">) {
  return (
    <Suspense fallback={<div role="status" aria-label="Loading order"><Skeleton className="h-8 w-64" /><Skeleton className="mt-8 h-64 w-full" /></div>}>
      <Loader params={props.params} />
    </Suspense>
  );
}

async function Loader({ params }: Pick<PageProps<"/account/orders/[id]">, "params">) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}
