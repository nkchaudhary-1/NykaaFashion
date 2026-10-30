import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmationView } from "@/components/commerce/ConfirmationView";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Order confirmed (simulated)" };

export default function ConfirmationPage(props: PageProps<"/checkout/confirmation/[id]">) {
  return (
    <Suspense fallback={<div className="container-x py-24" role="status" aria-label="Loading"><Skeleton className="h-10 w-1/2" /><Skeleton className="mt-6 h-40 w-full" /></div>}>
      <Loader params={props.params} />
    </Suspense>
  );
}

async function Loader({ params }: Pick<PageProps<"/checkout/confirmation/[id]">, "params">) {
  const { id } = await params;
  return <ConfirmationView id={id} />;
}
