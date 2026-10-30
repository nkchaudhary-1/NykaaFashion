import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

/**
 * Compact heading for product listings (category, search): breadcrumbs, the title, and one line of context on the centre axis.
 * A marketplace listing puts the products first, so this is far shorter than a full PageHeader — same grid, same h1.
 */
export function ListingHeader({ crumbs, title, intro, children }: { crumbs: Array<{ name: string; href?: string }>; title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="container-x pb-5 pt-5 sm:pb-6 sm:pt-6">
      <Breadcrumbs items={crumbs} className="mb-4" />
      <div className="grid-main items-end gap-y-2">
        <h1 className="display-sm col-span-4 min-w-0 sm:col-span-12 lg:col-span-6">{title}</h1>
        {intro && <p className="col-span-4 min-w-0 text-[14.5px] leading-relaxed text-ink-2 sm:col-span-12 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:pb-0.5">{intro}</p>}
      </div>
      {children}
    </header>
  );
}
