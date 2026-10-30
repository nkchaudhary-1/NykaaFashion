import { GridSkeleton, Skeleton } from "./Skeleton";

/**
 * Shown instantly while a param-dependent page resolves (client navigations get a shell, never a blank screen).
 * Each skeleton mirrors the real page on the same 12-column grid, so nothing jumps when the content arrives.
 */
export function ListingPageSkeleton({ band }: { band?: boolean }) {
  return (
    <div role="status" aria-label="Loading">
      {band ? (
        <div className="bg-sand">
          <div className="container-x grid-main py-12 sm:py-20">
            <div className="col-span-4 sm:col-span-12 lg:col-span-6">
              <Skeleton className="h-3 w-40 !bg-stone/60" />
              <Skeleton className="mt-8 h-16 w-[min(560px,90%)] !bg-stone/60" />
            </div>
            <div className="col-span-4 mt-6 sm:col-span-12 lg:col-span-6 lg:mt-0 lg:self-end">
              <Skeleton className="h-4 w-[min(420px,90%)] !bg-stone/60" />
              <Skeleton className="mt-2 h-4 w-[min(340px,70%)] !bg-stone/60" />
            </div>
          </div>
        </div>
      ) : (
        <div className="container-x pb-8 pt-6 sm:pb-12 sm:pt-8">
          <Skeleton className="h-3 w-48" />
          <div className="grid-main mt-8 items-end gap-y-6">
            <div className="col-span-4 sm:col-span-12 lg:col-span-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-4 h-14 w-[min(480px,80%)]" />
            </div>
            <div className="col-span-4 sm:col-span-12 lg:col-span-6">
              <Skeleton className="h-4 w-[min(420px,90%)]" />
              <Skeleton className="mt-2 h-4 w-[min(320px,70%)]" />
            </div>
          </div>
        </div>
      )}
      <div className="container-x">
        <div className="flex items-center justify-between gap-4 border-y border-line py-3">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-32" />
        </div>
        <div className="mt-8">
          <GridSkeleton count={8} />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Product page: gallery in columns 1–8 (a wide image, then two), buy box in 9–12. */
export function PdpSkeleton() {
  return (
    <div role="status" aria-label="Loading product" className="container-x pb-16 pt-6">
      <Skeleton className="h-3 w-64" />
      <div className="grid-main mt-8 gap-y-10">
        <div className="col-span-4 sm:col-span-12 lg:col-span-8">
          <div className="grid-main lg:grid-cols-8">
            <Skeleton className="col-span-4 aspect-[4/5] sm:col-span-12 lg:col-span-8 lg:aspect-[16/11]" />
            <Skeleton className="col-span-2 hidden aspect-[4/5] sm:col-span-6 sm:block lg:col-span-4" />
            <Skeleton className="col-span-2 hidden aspect-[4/5] sm:col-span-6 sm:block lg:col-span-4" />
          </div>
        </div>
        <div className="col-span-4 sm:col-span-12 lg:col-span-4">
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

/** Story: full-bleed cover band, then the reading column. */
export function ArticleSkeleton() {
  return (
    <div role="status" aria-label="Loading story">
      <div className="bg-sand">
        <div className="container-x grid-main py-12 sm:py-16">
          <div className="col-span-4 sm:col-span-12 lg:col-span-6">
            <Skeleton className="h-3 w-40 !bg-stone/60" />
            <Skeleton className="mt-8 h-20 w-[min(560px,90%)] !bg-stone/60" />
            <Skeleton className="mt-6 h-4 w-[min(420px,80%)] !bg-stone/60" />
          </div>
        </div>
      </div>
      <div className="container-x grid-main py-12">
        <div className="col-span-4 sm:col-span-12 lg:col-span-8 lg:col-start-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-[92%]" />
          <Skeleton className="mt-3 h-4 w-[86%]" />
          <Skeleton className="mt-10 aspect-[16/9] w-full" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
