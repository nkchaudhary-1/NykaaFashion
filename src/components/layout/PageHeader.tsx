import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

/**
 * The top of every page: breadcrumbs, then the shared heading row on the 12-column grid — eyebrow + title on the left,
 * intro (and optional `aside` controls) on the right starting at the page's centre axis. Anything passed as `children`
 * (sub-navigation, a toolbar, a banner) sits underneath inside the same container.
 */
export function PageHeader({ crumbs, eyebrow, title, intro, aside, children, className, size = "lg", splitAt = 6 }: { crumbs?: Array<{ name: string; href?: string }>; eyebrow?: string; title: ReactNode; intro?: ReactNode; aside?: ReactNode; children?: ReactNode; className?: string; size?: "xl" | "lg" | "md"; splitAt?: 6 | 7 }) {
  return (
    <header className={cn("container-x pb-8 pt-6 sm:pb-12 sm:pt-8", className)}>
      {crumbs && <Breadcrumbs items={crumbs} className="mb-8" />}
      <SectionHeading level={1} size={size} eyebrow={eyebrow} title={title} intro={intro} splitAt={splitAt}>
        {aside}
      </SectionHeading>
      {children}
    </header>
  );
}
