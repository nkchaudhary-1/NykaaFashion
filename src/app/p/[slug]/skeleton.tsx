import { Col, Grid } from "@/components/layout/Grid";
import { Skeleton } from "@/components/ui/Skeleton";

/** Shown while the product resolves: the same grid as the page — thumbnail rail + picture on the left, the information column on the right. */
export function PdpSkeleton() {
  return (
    <div role="status" aria-label="Loading product">
      <div className="container-x pb-5 pt-5 sm:pb-6 sm:pt-6">
        <Skeleton className="h-3 w-64 max-w-full" />
      </div>
      <div className="container-x pb-[var(--section-y)]">
        <Grid className="gap-y-8">
          <Col span={{ base: 4, sm: 6, lg: 7 }} start={{ sm: 1, lg: 1 }} rowStart={{ sm: 1, lg: 1 }} className="-mx-[var(--gutter)] sm:mx-0">
            <div className="lg:grid lg:grid-cols-7 lg:gap-x-[var(--gap)]">
              <div className="hidden space-y-3 lg:col-span-1 lg:block">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="aspect-[4/5] w-full" />
                ))}
              </div>
              <Skeleton className="aspect-[4/5] w-full lg:col-span-6 lg:max-h-[calc(100svh-var(--header-h)-2rem)]" />
            </div>
          </Col>
          <Col span={{ base: 4, sm: 6, lg: 5 }} start={{ sm: 7, lg: 8 }} rowStart={{ sm: 1, lg: 1 }} className="lg:pl-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-7 w-3/5" />
            <Skeleton className="mt-3 h-4 w-4/5" />
            <Skeleton className="mt-5 h-9 w-48" />
            <Skeleton className="mt-6 h-8 w-40" />
            <Skeleton className="mt-8 h-6 w-28" />
            <div className="mt-4 flex gap-2.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-16 rounded-full" />
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </Col>
        </Grid>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
