import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

/**
 * Heading for product listings (category, search): the breadcrumb, then the title in bold with a small grey count beside it
 * ("Indianwear · 1,234 products") — the pattern of the live site's listing and wishlist pages — and one line of context on the
 * centre axis. Products come first, so this is far shorter than a full PageHeader: same grid, same single h1.
 */
export function ListingHeader({ crumbs, title, count, noun = "products", intro, children }: { crumbs: Array<{ name: string; href?: string }>; title: ReactNode; count?: number; noun?: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="container-x pb-5 pt-5 sm:pb-6 sm:pt-6">
      <Breadcrumbs items={crumbs} className="mb-4" />
      <div className="grid-main items-end gap-y-2">
        <div className="col-span-4 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 sm:col-span-12 lg:col-span-6">
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]">{title}</h1>
          {count !== undefined && (
            <p className="text-[14px] tabular-nums text-ink-3">
              · {count.toLocaleString("en-IN")} {count === 1 ? noun.replace(/s$/, "") : noun}
            </p>
          )}
        </div>
        {intro && <p className="col-span-4 min-w-0 text-[14.5px] leading-relaxed text-ink-2 sm:col-span-12 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:pb-0.5">{intro}</p>}
      </div>
      {children}
    </header>
  );
}
