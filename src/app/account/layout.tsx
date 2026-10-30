import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <Suspense fallback={<div className="container-x pb-20 pt-10" role="status" aria-label="Loading"><Skeleton className="h-12 w-72" /><Skeleton className="mt-10 h-96 w-full" /></div>}>
      <AccountShell>{children}</AccountShell>
    </Suspense>
  );
}
