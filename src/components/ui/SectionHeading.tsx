import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionHeading({ eyebrow, title, intro, href, hrefLabel, className, level = 2, align = "between", onDark, children }: { eyebrow?: string; title: ReactNode; intro?: string; href?: string; hrefLabel?: string; className?: string; level?: 1 | 2 | 3; align?: "between" | "left"; onDark?: boolean; children?: ReactNode }) {
  const H = `h${level}` as "h1" | "h2" | "h3";
  return (
    <div className={cn("flex flex-wrap items-end gap-x-8 gap-y-4", align === "between" ? "justify-between" : "justify-start", className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className={cn("eyebrow mb-3", onDark ? "text-bone/70" : "text-ink-3")}>{eyebrow}</p>}
        <H className="display-md">{title}</H>
        {intro && <p className={cn("mt-3 max-w-xl text-[15px] leading-relaxed", onDark ? "text-bone/75" : "text-ink-2")}>{intro}</p>}
      </div>
      {children}
      {href && (
        <Link href={href} className={cn("link-u tap group inline-flex items-center gap-2 pb-1 text-[12px] font-medium uppercase tracking-[0.12em]", onDark ? "text-bone" : "text-ink")}>
          {hrefLabel ?? "View all"}
          <ArrowRight size={15} className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
