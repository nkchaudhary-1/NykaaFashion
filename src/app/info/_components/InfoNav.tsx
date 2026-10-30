import Link from "next/link";
import { INFO_PAGES } from "@/data/content";
import { cn } from "@/lib/cn";

const GROUPS = [
  { title: "Help", slugs: ["shipping", "returns", "contact"] },
  { title: "About", slugs: ["about", "careers", "terms", "privacy"] },
];

/** Section id for an in-page anchor. */
export const sectionId = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * The 3-column rail of the info layout. Desktop: a vertical list (the current page marked with an ink rule) and, under it, the anchors of
 * this page's sections. Below 1024px the rail becomes one scrolling row of page links above the content.
 */
export function InfoNav({ current, sections }: { current: string; sections: Array<{ id: string; h: string }> }) {
  const link = (active: boolean) =>
    cn(
      "tap inline-flex shrink-0 items-center whitespace-nowrap text-[13.5px] font-medium transition-colors",
      "h-10 border px-4 lg:h-auto lg:border-0 lg:border-l-2 lg:py-2 lg:pl-4 lg:pr-0 lg:text-[14px]",
      active ? "border-ink bg-ink text-bone lg:bg-transparent lg:text-ink" : "border-line-strong text-ink hover:border-ink lg:border-line lg:text-ink-3 lg:hover:border-ink lg:hover:text-ink",
    );
  return (
    <div>
      <nav aria-label="Information pages" className="scrollbar-none bleed-r -mr-[var(--gutter)] flex items-center gap-2 overflow-x-auto pr-[var(--gutter)] lg:mr-0 lg:block lg:overflow-visible lg:pr-0">
        {GROUPS.map((g, gi) => (
          <div key={g.title} className={cn("flex shrink-0 items-center gap-2 lg:block", gi > 0 && "lg:mt-8")}>
            <p className="eyebrow mb-3 hidden text-ink-3 lg:block">{g.title}</p>
            <ul className="flex gap-2 lg:block lg:gap-0">
              {g.slugs.map((slug) => (
                <li key={slug}>
                  <Link href={`/info/${slug}`} aria-current={slug === current ? "page" : undefined} className={link(slug === current)}>
                    {INFO_PAGES[slug].title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {sections.length > 1 && (
        <nav aria-label="On this page" className="mt-10 hidden lg:block">
          <p className="eyebrow mb-3 text-ink-3">On this page</p>
          <ol className="space-y-1">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="link-u tap flex items-baseline gap-3 py-1.5 text-[14px] text-ink">
                  <span className="text-[11px] tabular-nums text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  {s.h}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
}
