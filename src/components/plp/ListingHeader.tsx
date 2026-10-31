import type { ReactNode } from "react";
import { RevealText, Rise } from "@/components/motion/reveal";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { cn } from "@/lib/cn";

const SIZE = { xl: "display-xl", lg: "display-lg", md: "display-md" } as const;

/**
 * Heading for product listings (category, search): the breadcrumb, then the title at poster scale across all twelve columns — its words rise out of a mask — and
 * under it one quiet row: the result count as a tabular numeral on the left, one line of context starting on the page's centre axis. Products come right after,
 * so the row stays short. Same grid, same single h1.
 */
export function ListingHeader({ crumbs, eyebrow, title, count, noun = "products", intro, size = "xl", children }: { crumbs: Array<{ name: string; href?: string }>; eyebrow?: string; title: ReactNode; count?: number; noun?: string; intro?: ReactNode; size?: keyof typeof SIZE; children?: ReactNode }) {
  const hasRow = count !== undefined || !!intro;
  return (
    <header className="container-x pb-10 pt-5 sm:pb-14 sm:pt-6">
      <Breadcrumbs items={crumbs} className="mb-8 sm:mb-12" />
      {eyebrow && (
        <Rise as="p" y={14} className="eyebrow mb-5 text-ink-3">
          {eyebrow}
        </Rise>
      )}
      <RevealText as="h1" className={cn(SIZE[size], "min-w-0")}>
        {title}
      </RevealText>
      {hasRow && (
        <div className="mt-8 grid-main items-end gap-y-5 border-t border-line pt-5 sm:mt-10">
          {count !== undefined && (
            <Rise delay={80} className="col-span-4 flex items-baseline gap-3 sm:col-span-12 lg:col-span-6">
              <span className="display-sm tabular-nums">{count.toLocaleString("en-IN")}</span>
              <span className="eyebrow text-ink-3">{count === 1 ? noun.replace(/s$/, "") : noun}</span>
            </Rise>
          )}
          {intro && (
            <Rise as="p" delay={160} className="col-span-4 min-w-0 max-w-[46ch] text-[15px] leading-relaxed text-ink-2 sm:col-span-12 lg:col-span-6 lg:col-start-7">
              {intro}
            </Rise>
          )}
        </div>
      )}
      {children}
    </header>
  );
}
