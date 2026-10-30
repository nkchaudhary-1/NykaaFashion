import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

export function CardSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="mt-3 h-3 w-1/3" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <Skeleton className="mt-2 h-4 w-1/4" />
    </div>
  );
}

/** Same cells as ProductGrid: 2-up phones, 3-up tablets, 4-up desktop on the page grid. */
export function GridSkeleton({ count = 8, className, columnsClass = "grid-main gap-y-10 lg:gap-y-14" }: { count?: number; className?: string; columnsClass?: string }) {
  return (
    <div role="status" aria-label="Loading products" className={cn(columnsClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-span-2 min-w-0 sm:col-span-4 lg:col-span-3">
          <CardSkeleton />
        </div>
      ))}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}
