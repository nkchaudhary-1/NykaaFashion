import { GridSkeleton, Skeleton } from "./Skeleton";

/** Shown instantly while a param-dependent page resolves (client navigations get a shell, never a blank screen). */
export function ListingPageSkeleton({ band }: { band?: boolean }) {
  return (
    <div role="status" aria-label="Loading">
      {band ? (
        <div className="bg-sand">
          <div className="container-x py-12 sm:py-20">
            <Skeleton className="h-3 w-40 !bg-stone/60" />
            <Skeleton className="mt-8 h-16 w-[min(560px,90%)] !bg-stone/60" />
            <Skeleton className="mt-6 h-4 w-[min(520px,80%)] !bg-stone/60" />
            <Skeleton className="mt-2 h-4 w-[min(420px,60%)] !bg-stone/60" />
          </div>
        </div>
      ) : (
        <div className="container-x pb-10 pt-8">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-10 h-14 w-[min(480px,80%)]" />
          <Skeleton className="mt-6 h-4 w-[min(520px,90%)]" />
        </div>
      )}
      <div className="container-x mt-10">
        <GridSkeleton count={8} />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function PdpSkeleton() {
  return (
    <div role="status" aria-label="Loading product" className="container-x pb-16 pt-6">
      <Skeleton className="h-3 w-64" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div className="grid grid-cols-[72px_1fr] gap-4">
          <div className="hidden space-y-3 sm:block">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full" />
            ))}
          </div>
          <Skeleton className="aspect-[4/5] w-full sm:col-start-2" />
        </div>
        <div>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-4 h-10 w-4/5" />
          <Skeleton className="mt-5 h-6 w-32" />
          <Skeleton className="mt-10 h-11 w-full" />
          <Skeleton className="mt-6 h-[52px] w-full" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div role="status" aria-label="Loading story" className="container-x pb-16 pt-10">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-8 h-20 w-[min(720px,90%)]" />
      <Skeleton className="mt-6 h-4 w-[min(560px,80%)]" />
      <Skeleton className="mt-12 aspect-[16/9] w-full" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
