import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function Breadcrumbs({ items, className }: { items: Array<{ name: string; href?: string }>; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-[12.5px] text-ink-3", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${it.name}-${i}`} className="flex items-center gap-1.5">
              {it.href && !last ? (
                <Link href={it.href} className="link-u tap hover:text-ink">
                  {it.name}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-ink-2" : undefined}>
                  {it.name}
                </span>
              )}
              {!last && <ChevronRight aria-hidden size={12} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
