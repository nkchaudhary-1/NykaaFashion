import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A full-width band on the page rhythm: flat colour, one vertical padding (--section-y), content in the 1600px container.
 * `bleed` drops the container so the children can run edge to edge (banners, split heroes).
 */
const TONE = {
  bone: "bg-bone text-ink",
  paper: "bg-paper text-ink",
  white: "bg-white text-ink",
  sand: "bg-sand text-ink",
  ink: "on-dark bg-ink text-bone",
  luxe: "on-dark bg-luxe text-bone",
  gem: "on-dark bg-gem text-bone",
  resp: "on-dark bg-resp text-bone",
  festive: "on-dark bg-festive text-bone",
  "pink-tint": "bg-pink-tint text-ink",
} as const;
export type SectionTone = keyof typeof TONE;
const SPACE = { md: "section-y", sm: "py-10 sm:py-14", none: "" } as const;

export function Section({ tone = "bone", y = "md", bleed, className, innerClassName, children, ...rest }: { tone?: SectionTone; y?: keyof typeof SPACE; bleed?: boolean; className?: string; innerClassName?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <section className={cn(TONE[tone], SPACE[y], className)} {...rest}>
      {bleed ? children : <div className={cn("container-x", innerClassName)}>{children}</div>}
    </section>
  );
}
