import { ArrowDown } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Img, SIZES } from "@/components/ui/Img";
import { THEMES } from "@/data/edits";
import type { Edit } from "@/data/types";
import { cn } from "@/lib/cn";

/** Edit narrative header (PRD §5.3): theme-coloured band, narrative, highlights, arched cover. */
export function EditHeader({ edit, count }: { edit: Edit; count: number }) {
  const t = THEMES[edit.theme];
  const dark = edit.theme !== "sand" && edit.theme !== "hon";
  return (
    <header className={cn("grain relative isolate overflow-hidden", dark && "on-dark")} style={{ background: t.bg, color: t.fg }}>
      <div className="container-x grid grid-cols-1 gap-10 pb-0 pt-6 sm:pt-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div className="relative z-[1] pb-12 lg:pb-20">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Edits", href: "/edits" }, { name: edit.title }]} className={cn("mb-10 sm:mb-14 [&_a]:text-inherit [&_a]:opacity-90", dark ? "text-bone/70" : "text-ink-3")} />
          <p className="eyebrow flex items-center gap-3 opacity-90">
            <span aria-hidden className="h-px w-8 bg-current" />
            {edit.kicker}
          </p>
          <h1 className="display-xl mt-6 max-w-[11ch] text-balance">{edit.title}</h1>
          <p className="mt-7 max-w-[52ch] text-[16px] leading-relaxed opacity-90">{edit.narrative}</p>
          <p className="mt-8 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] opacity-90">
            <span className="tabular-nums">{count}</span> pieces <ArrowDown size={14} aria-hidden />
          </p>
          {edit.highlights.length > 0 && (
            <dl className="mt-12 grid grid-cols-1 max-w-3xl gap-x-8 gap-y-6 border-t border-current/20 pt-8 sm:grid-cols-3">
              {edit.highlights.map((h) => (
                <div key={h.title}>
                  <dt className="text-[14px] font-medium">{h.title}</dt>
                  <dd className="mt-1.5 text-[13px] leading-relaxed opacity-90">{h.text}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="relative z-[1] hidden self-end lg:block">
          <div className="arch overflow-hidden">
            <Img imgKey={`scenes/edit-${edit.id}-tall`} alt="" sizes={SIZES.half} ratio="4/5" load="high" />
          </div>
        </div>
      </div>
    </header>
  );
}
