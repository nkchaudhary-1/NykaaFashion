import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { cn } from "@/lib/cn";

export function PageHeader({ crumbs, eyebrow, title, intro, children, className, size = "lg" }: { crumbs?: Array<{ name: string; href?: string }>; eyebrow?: string; title: ReactNode; intro?: ReactNode; children?: ReactNode; className?: string; size?: "xl" | "lg" | "md" }) {
  return (
    <header className={cn("container-x pb-8 pt-6 sm:pb-12 sm:pt-8", className)}>
      {crumbs && <Breadcrumbs items={crumbs} className="mb-8" />}
      {eyebrow && <p className="eyebrow mb-4 text-ink-3">{eyebrow}</p>}
      <h1 className={cn("max-w-[18ch] text-balance", size === "xl" ? "display-xl" : size === "lg" ? "display-lg" : "display-md")}>{title}</h1>
      {intro && <div className="lede mt-6">{intro}</div>}
      {children}
    </header>
  );
}
