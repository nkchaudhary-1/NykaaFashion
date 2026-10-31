import { Skeleton } from "@/components/ui/Skeleton";

/** Shown while a launch page resolves: the banner's picture and the shape of its copy, on the same grid, so nothing jumps when the page arrives. */
export function LaunchSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div className="container-x pb-5 pt-6 sm:pb-6 sm:pt-8">
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="aspect-[4/5] w-full sm:aspect-video xl:aspect-auto xl:h-[min(72svh,720px)]" />
      <div className="container-x py-10">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-5 h-[clamp(44px,8vw,110px)] w-[min(620px,85%)]" />
        <Skeleton className="mt-6 h-4 w-[min(420px,90%)]" />
        <Skeleton className="mt-2 h-4 w-[min(340px,70%)]" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
