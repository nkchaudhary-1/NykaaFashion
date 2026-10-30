import { Col, Grid } from "@/components/layout/Grid";
import { Skeleton } from "@/components/ui/Skeleton";

/** Shown while the product resolves: the same grid as the page — gallery tiles on the left, buy box on the right. */
export function PdpSkeleton() {
  return (
    <div role="status" aria-label="Loading product">
      <div className="container-x pb-5 pt-5 sm:pb-8 sm:pt-6">
        <Skeleton className="h-3 w-64 max-w-full" />
      </div>
      <div className="container-x pb-[var(--section-y)]">
        <Grid className="gap-y-8">
          <Col span={{ base: 4, sm: 6, lg: 8 }} start={{ sm: 1, lg: 1 }} rowStart={{ sm: 1, lg: 1 }} className="-mx-[var(--gutter)] sm:mx-0">
            <div className="sm:grid sm:grid-cols-6 sm:gap-[var(--gap)] lg:grid-cols-8">
              <Skeleton className="aspect-[4/5] w-full sm:col-span-6 lg:col-span-8" />
              <Skeleton className="hidden aspect-[4/5] w-full sm:col-span-3 sm:block lg:col-span-4" />
              <Skeleton className="hidden aspect-[4/5] w-full sm:col-span-3 sm:block lg:col-span-4" />
            </div>
          </Col>
          <Col span={{ base: 4, sm: 6, lg: 4 }} start={{ sm: 7, lg: 9 }} rowStart={{ sm: 1, lg: 1 }}>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-5 h-9 w-4/5" />
            <Skeleton className="mt-3 h-9 w-2/5" />
            <Skeleton className="mt-6 h-6 w-36" />
            <Skeleton className="mt-6 h-16 w-full" />
            <Skeleton className="mt-8 h-11 w-3/5" />
            <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
            <Skeleton className="mt-8 h-[52px] w-full" />
          </Col>
        </Grid>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
