import { GRID_CLASS } from "@/components/product/ProductGrid";
import { GridSkeleton, Skeleton } from "@/components/ui/Skeleton";

/**
 * Shown instantly while a param-dependent page resolves (client navigations get a shell, never a blank screen). Each mirrors the real page — the poster-scale
 * title block (or the picture band of an edit), the hairline toolbar, the product grid — on the same 12-column grid, so nothing jumps when the content arrives.
 */
export function ListingSkeleton({ band }: { band?: boolean }) {
  return (
    <div role="status" aria-label="Loading">
      {band ? (
        <>
          <div className="container-x pb-5 pt-6 sm:pb-6 sm:pt-8">
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="relative aspect-[4/3] bg-sand sm:aspect-[16/9] lg:aspect-auto lg:h-[min(72svh,720px)]">
            <div className="container-x pt-10 lg:pt-14">
              <Skeleton className="h-3 w-40 !bg-stone/60" />
              <Skeleton className="mt-6 h-[clamp(34px,5.4vw,88px)] w-[min(520px,70%)] !bg-stone/60" />
            </div>
          </div>
          <div className="container-x pb-4 pt-12 sm:pt-16">
            <Skeleton className="h-4 w-[min(420px,90%)]" />
            <Skeleton className="mt-2 h-4 w-[min(340px,70%)]" />
          </div>
        </>
      ) : (
        <div className="container-x pb-10 pt-5 sm:pb-14 sm:pt-6">
          <Skeleton className="mb-8 h-3 w-48 sm:mb-12" />
          <Skeleton className="h-[clamp(44px,8.6vw,124px)] w-[min(560px,80%)]" />
          <div className="mt-8 border-t border-line pt-5 sm:mt-10">
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      )}
      <div className="container-x">
        <div className="flex items-center justify-between gap-4 border-y border-line py-3">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-32" />
        </div>
        <div className="mt-12">
          <GridSkeleton count={8} columnsClass={GRID_CLASS} />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Story: the poster-scale title block, then the cover band. */
export function StorySkeleton() {
  return (
    <div role="status" aria-label="Loading story">
      <div className="container-x pb-10 pt-6 sm:pb-14">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="mt-8 h-3 w-40" />
        <Skeleton className="mt-6 h-[clamp(44px,8.6vw,124px)] w-[min(900px,90%)]" />
        <div className="mt-10 border-t border-line pt-6">
          <Skeleton className="h-5 w-[min(520px,90%)]" />
          <Skeleton className="mt-3 h-5 w-[min(440px,75%)]" />
        </div>
      </div>
      <Skeleton className="aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9]" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
