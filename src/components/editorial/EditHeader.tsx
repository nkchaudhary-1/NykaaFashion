import { ArrowDown } from "lucide-react";
import { Col, Grid } from "@/components/layout/Grid";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Img, SIZES } from "@/components/ui/Img";
import { THEMES } from "@/data/edits";
import type { Edit } from "@/data/types";
import { cn } from "@/lib/cn";

/**
 * Edit header: breadcrumbs on the page, then a full-bleed banner — a flat panel in the edit's colour with the copy on columns 1–6,
 * and the edit's scene starting on column 7 and bleeding off the right edge (same construction as the festive banner on Home).
 * On phones the scene runs edge to edge on top and the copy follows. No texture, no scrim: the scene's own wall is the calm area.
 */
export function EditHeader({ edit, count }: { edit: Edit; count: number }) {
  const t = THEMES[edit.theme];
  const dark = edit.theme !== "sand" && edit.theme !== "hon";
  return (
    <>
      <div className="container-x pb-5 pt-6 sm:pb-6 sm:pt-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Edits", href: "/edits" }, { name: edit.title }]} />
      </div>
      <header className={cn(dark && "on-dark")} style={{ background: t.bg, color: t.fg }}>
        <Grid className="container-x">
          <Col span={{ base: 4, sm: 12, lg: 6 }} className="flex flex-col justify-center py-12 sm:py-14 lg:py-20 lg:pr-[var(--gap)]">
            <p className="eyebrow flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-current" />
              {edit.kicker}
            </p>
            <h1 className="display-lg mt-6 text-balance">{edit.title}</h1>
            <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed">{edit.narrative}</p>
            <a href="#pieces" className="link-u tap mt-8 inline-flex items-center gap-2 self-start text-[12px] font-semibold uppercase tracking-[0.09em]">
              <span className="tabular-nums">{count}</span> pieces <ArrowDown size={14} aria-hidden />
            </a>
            {edit.highlights.length > 0 && (
              <dl className="mt-10 grid grid-cols-1 gap-x-[var(--gap)] gap-y-6 border-t border-current/25 pt-6 sm:grid-cols-3">
                {edit.highlights.map((h) => (
                  <div key={h.title}>
                    <dt className="text-[14px] font-medium">{h.title}</dt>
                    <dd className="mt-1.5 text-[13px] leading-relaxed">{h.text}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Col>
          {/* starts on column 7 and bleeds off the right edge; on phones/tablets it is edge to edge, above the copy */}
          <Col span={{ base: 4, sm: 12, lg: 6 }} className="relative order-first -mx-[var(--gutter)] aspect-[4/3] sm:aspect-[16/9] lg:order-none lg:mx-0 lg:-mr-[var(--edge)] lg:aspect-auto lg:min-h-[520px]">
            <Img imgKey={`scenes/edit-${edit.id}-wide`} alt="" sizes={SIZES.half} ratio="fill" load="preload" position="68% 50%" className="absolute inset-0 h-full" />
          </Col>
        </Grid>
      </header>
    </>
  );
}
