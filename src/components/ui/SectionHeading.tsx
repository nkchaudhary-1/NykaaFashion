import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Rise, RevealText } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";

/** Where the right-hand column starts: 6 = the page's centre axis (default), 7 = the 7/5 split used by lead-story layouts. */
const SPLIT = {
  6: { left: "lg:col-span-6", right: "lg:col-span-6 lg:col-start-7" },
  7: { left: "lg:col-span-7", right: "lg:col-span-5 lg:col-start-8" },
} as const;

/**
 * Section header on the 12-column grid: eyebrow + title on the left (columns 1–6), intro / link / controls on the right
 * (columns 7–12, starting on the page's centre axis — the same line a half-width tile or the 3rd of four cards starts on),
 * so every section's header reads — and aligns — the same way.
 */
const SIZE = { md: "display-md", lg: "display-lg", xl: "display-xl" } as const;

export function SectionHeading({ eyebrow, title, intro, href, hrefLabel, className, level = 2, size = "md", onDark, splitAt = 6, children }: { eyebrow?: string; title: ReactNode; intro?: ReactNode; href?: string; hrefLabel?: string; className?: string; level?: 1 | 2 | 3; size?: keyof typeof SIZE; onDark?: boolean; splitAt?: 6 | 7; children?: ReactNode }) {
  const H = `h${level}` as "h1" | "h2" | "h3";
  const hasRight = !!(intro || href || children);
  return (
    <div className={cn("grid-main items-end gap-y-6", className)}>
      <div className={cn("col-span-4 min-w-0 sm:col-span-12", hasRight && SPLIT[splitAt].left)}>
        {eyebrow && (
          <Rise as="p" y={14} className={cn("eyebrow mb-5", onDark ? "text-bone" : "text-ink-3")}>
            {eyebrow}
          </Rise>
        )}
        <RevealText as={H} className={SIZE[size]}>
          {title}
        </RevealText>
      </div>
      {hasRight && (
        <div className={cn("col-span-4 flex min-w-0 flex-col gap-5 sm:col-span-12", SPLIT[splitAt].right, !intro && "lg:items-end")}>
          {intro && (
            <Rise delay={120} className={cn("max-w-[46ch] text-[15px] leading-relaxed", onDark ? "text-bone" : "text-ink-2")}>
              {intro}
            </Rise>
          )}
          {(href || children) && (
            <Rise delay={200} className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {children}
              {href && (
                <Link href={href} className={cn("link-u tap group inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]", onDark ? "text-bone" : "text-ink")}>
                  {hrefLabel ?? "View all"}
                  <ArrowRight size={15} className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
                </Link>
              )}
            </Rise>
          )}
        </div>
      )}
    </div>
  );
}
