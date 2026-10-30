import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/plp/SearchResults";
import { GridSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-x pt-24"><GridSkeleton count={8} /></div>}>
      <SearchResults />
    </Suspense>
  );
}
