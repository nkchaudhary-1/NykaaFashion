import { ArrowDown } from "lucide-react";
import { Col, Grid } from "@/components/layout/Grid";
import { Parallax } from "@/components/motion/Parallax";
import { RevealText, Rise } from "@/components/motion/reveal";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Img } from "@/components/ui/Img";
import type { Edit } from "@/data/types";
import { cn } from "@/lib/cn";
import { imgEdge } from "@/lib/img";

/** WCAG relative luminance of a #rrggbb colour — picks light or dark type for text laid on an image's calm wall. */
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Edit header: breadcrumbs on the page, then a big picture band — the edit's wide scene drifting slowly against the scroll inside its clipped frame — with the
 * kicker and the title on the scene's own calm wall (top left, columns 1–6), in display type. The wall's colour (image metadata) decides between dark and light
 * type; no scrim. The rest — the narrative, the count, the edit's promises — sits on the page under the picture, so no sentence ever runs across the garments.
 * Below 1024px the band is just the picture and the title follows on the page. One DOM copy of the text, so there is one h1.
 */
export function EditHeader({ edit, count }: { edit: Edit; count: number }) {
  const key = `scenes/edit-${edit.id}-wide`;
  const wall = imgEdge(key)?.wall[0];
  const dark = wall ? lum(wall) < 0.28 : false;
  return (
    <>
      <div className="container-x pb-5 pt-6 sm:pb-6 sm:pt-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Edits", href: "/edits" }, { name: edit.title }]} />
      </div>
      <header>
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden bg-sand sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto" style={wall ? { backgroundColor: wall } : undefined}>
            <Parallax className="h-full" amount={28} scale={1.08}>
              <Img imgKey={key} alt="" sizes="100vw" ratio="fill" load="preload" position="68% 36%" className="absolute inset-0 h-full" />
            </Parallax>
          </div>
          <div className={cn("relative lg:min-h-[min(72svh,720px)]", dark ? "lg:text-bone" : "lg:text-ink")}>
            <Grid className="container-x">
              <Col span={{ base: 4, sm: 12, lg: 6 }} className="pb-8 pt-10 sm:pt-12 lg:pb-0 lg:pt-14">
                <Rise as="p" y={14} className={cn("eyebrow flex items-center gap-3", dark ? "text-ink-3 lg:text-bone" : "text-ink-3 lg:text-ink")}>
                  <span aria-hidden className="h-px w-8 bg-current" />
                  {edit.kicker}
                </Rise>
                <RevealText as="h1" className="display-lg mt-6 text-ink lg:text-inherit [&_em]:text-inherit">
                  {edit.title}
                </RevealText>
              </Col>
            </Grid>
          </div>
        </div>
        <div className="container-x pb-4 pt-10 sm:pt-14 lg:pt-16">
          <Grid className="gap-y-10 border-t border-line pt-8">
            <Col span={{ base: 4, sm: 12, lg: 5 }}>
              <Rise as="p" className="max-w-[46ch] text-[16px] leading-relaxed text-ink-2">
                {edit.narrative}
              </Rise>
              <Rise delay={120}>
                <a href="#pieces" className="link-u tap mt-8 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em]">
                  <span className="tabular-nums">{count}</span> products <ArrowDown size={14} aria-hidden />
                </a>
              </Rise>
            </Col>
            {edit.highlights.length > 0 && (
              <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 7 }} rowStart={{ lg: 1 }}>
                <Rise as="dl" delay={80} className="grid grid-cols-1 gap-x-[var(--gap)] gap-y-6 sm:grid-cols-3">
                  {edit.highlights.map((h, i) => (
                    <div key={h.title} className="border-t border-ink pt-4 sm:border-t-0 sm:pt-0">
                      <dt className="flex items-baseline gap-3 text-[14px] font-medium">
                        <span className="text-[11px] tabular-nums text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                        {h.title}
                      </dt>
                      <dd className="mt-2 text-[13px] leading-relaxed text-ink-2 sm:pl-7">{h.text}</dd>
                    </div>
                  ))}
                </Rise>
              </Col>
            )}
          </Grid>
        </div>
      </header>
    </>
  );
}
