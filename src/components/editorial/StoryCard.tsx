"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Img, SIZES, type LoadHint } from "@/components/ui/Img";
import { THEMES } from "@/data/edits";
import type { Story } from "@/data/types";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";

/**
 * A story as a flat, image-forward card: cover, then "kicker · read time", title, dek. No overlays or scrims — the type sits on the
 * page, or on a flat white caption strip. The variants are the pieces of the Discover rows (see DiscoverIndex):
 *   tall    4:5 portrait cover, text below — 4/4/4 rows, the 5-column half of a 5/7 row, related stories
 *   wide    16:10 landscape cover, text below — 6/6 rows (and the edit pages)
 *   feature portrait below 1024px, then a landscape cover that fills the height its row gives it — the 7-column half of a 5/7 row
 *   banner  full-width cover with a flat caption panel under it
 *   lead    image tile with a caption strip. On desktop it fills the box of its parent (give the parent `relative` and a height,
 *           e.g. a 2-row span); below 1024px it is the cover with the strip underneath
 *   stack   the compact tile beside a lead (4:3, strip over the bottom edge on desktop)
 * `tall` and `feature` can sit in a subgrid pair of rows: the parent passes `className="lg:row-span-2 lg:grid lg:grid-rows-subgrid"` so
 * the covers and the captions line up across the two cards.
 */
export type StoryCardVariant = "tall" | "wide" | "lead" | "stack" | "feature" | "banner";

interface Look {
  /** which cover(s): the tall one, the wide one, or tall below 1024px and wide above */
  art: "tall" | "wide" | "split";
  box: string;
  title: string;
  dek: string;
  sizes: string;
}

const LOOK: Record<"tall" | "wide" | "feature", Look> = {
  tall: { art: "tall", box: "aspect-[4/5]", title: "display-sm", dek: "line-clamp-2", sizes: SIZES.tile },
  wide: { art: "wide", box: "aspect-[16/10]", title: "display-sm sm:display-md", dek: "line-clamp-3 max-w-[52ch]", sizes: SIZES.half },
  feature: { art: "split", box: "aspect-[4/5] lg:aspect-auto lg:min-h-0", title: "display-sm", dek: "line-clamp-2 max-w-[52ch]", sizes: "(min-width:1024px) 58vw, 50vw" },
};

export function StoryCard({ story, variant = "tall", load, className, source = "home", sizes, as: H = "h3", textOnlyForAT }: { story: Story; variant?: StoryCardVariant; load?: LoadHint; className?: string; source?: string; sizes?: string; as?: "h2" | "h3"; textOnlyForAT?: boolean }) {
  const t = THEMES[story.theme];
  const dot = t.bg === "#f3dcd6" ? "#e80071" : t.bg;
  const href = `/discover/${story.id}`;
  const open = () => {
    signal("story_open", { editId: story.editId, tags: story.tags });
    track("editorial_story_open", { storyId: story.id, source });
  };
  const hover = "transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.03]";
  const meta = (
    <p className="eyebrow flex items-center gap-2">
      <span aria-hidden className="size-2 shrink-0" style={{ background: dot }} />
      <span>
        {story.kicker} · {story.readMins} min
      </span>
    </p>
  );
  const cta = (
    <span className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em] text-ink">
      Read the story <ArrowRight size={14} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
    </span>
  );

  // ── Tiles: the cover plus a flat caption strip (static under the cover on phones/tablets, over its bottom edge on desktop)
  if (variant === "lead" || variant === "stack") {
    const lead = variant === "lead";
    const size = sizes ?? (lead ? "(min-width:1024px) 66vw, 100vw" : "(min-width:1024px) 33vw, 50vw");
    return (
      <Link href={href} onClick={open} className={cn("group relative block overflow-hidden bg-white", lead && "lg:absolute lg:inset-0", className)}>
        <div className={cn("relative overflow-hidden bg-sand", lead ? "aspect-[4/5] sm:aspect-[16/10] lg:absolute lg:inset-0 lg:aspect-auto" : "aspect-[4/5] lg:aspect-[4/3]")}>
          {lead ? (
            <>
              <Img imgKey={story.cover.tall} alt="" sizes={size} ratio="fill" load={load} className={cn("absolute inset-0 h-full sm:hidden", hover)} />
              <Img imgKey={story.cover.wide} alt="" sizes={size} ratio="fill" load={load} position="72% 50%" className={cn("absolute inset-0 hidden h-full sm:block", hover)} />
            </>
          ) : (
            <>
              <Img imgKey={story.cover.tall} alt="" sizes={size} ratio="fill" load={load} className={cn("absolute inset-0 h-full lg:hidden", hover)} />
              <Img imgKey={story.cover.wide} alt="" sizes={size} ratio="fill" load={load} position="72% 50%" className={cn("absolute inset-0 hidden h-full lg:block", hover)} />
            </>
          )}
        </div>
        <div className={cn("relative flex items-end justify-between gap-4 bg-white px-4 py-3.5 text-ink transition-colors group-hover:bg-ink group-hover:text-bone lg:absolute lg:inset-x-0 lg:bottom-0", lead ? "sm:px-6 sm:py-5" : "sm:px-5", textOnlyForAT && "sr-only")}>
          <div className="min-w-0">
            <div className="opacity-70">{meta}</div>
            <H className={cn("mt-2", lead ? "display-xs sm:text-[24px] sm:leading-[1.12] sm:tracking-[-0.022em]" : "text-[16px] font-medium leading-[1.2] tracking-[-0.015em] sm:text-[18px]")}>{story.title}</H>
            {lead && <p className="mt-2 hidden max-w-[60ch] text-[14px] leading-relaxed opacity-80 sm:line-clamp-2 sm:block">{story.dek}</p>}
          </div>
          <ArrowUpRight size={lead ? 24 : 20} aria-hidden className="mb-1 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </Link>
    );
  }

  // ── Full-width banner
  if (variant === "banner") {
    return (
      <Link href={href} onClick={open} className={cn("group block", className)}>
        <div className="relative aspect-[4/5] overflow-hidden bg-sand sm:aspect-[16/10] lg:aspect-[2/1]">
          <Img imgKey={story.cover.tall} alt="" sizes={sizes ?? "100vw"} ratio="fill" load={load} className={cn("absolute inset-0 h-full sm:hidden", hover)} />
          <Img imgKey={story.cover.wide} alt="" sizes={sizes ?? "100vw"} ratio="fill" load={load} position="50% 45%" className={cn("absolute inset-0 hidden h-full sm:block", hover)} />
        </div>
        <div className="grid-main gap-y-5 bg-white px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="col-span-4 min-w-0 sm:col-span-12 lg:col-span-7">
            <div className="text-ink-3">{meta}</div>
            <H className="display-sm mt-3 sm:display-md">{story.title}</H>
          </div>
          <div className="col-span-4 min-w-0 sm:col-span-12 lg:col-span-5 lg:self-end">
            <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink-2">{story.dek}</p>
            {cta}
          </div>
        </div>
      </Link>
    );
  }

  // ── Text below the cover
  const look = LOOK[variant];
  const size = sizes ?? look.sizes;
  return (
    <Link href={href} onClick={open} className={cn("group block", className)}>
      <div className={cn("relative overflow-hidden bg-sand", look.box)}>
        {look.art === "tall" && <Img imgKey={story.cover.tall} alt="" sizes={size} ratio="fill" load={load} className={cn("absolute inset-0 h-full", hover)} />}
        {look.art === "wide" && <Img imgKey={story.cover.wide} alt="" sizes={size} ratio="fill" load={load} position="72% 50%" className={cn("absolute inset-0 h-full", hover)} />}
        {look.art === "split" && (
          <>
            <Img imgKey={story.cover.tall} alt="" sizes={size} ratio="fill" load={load} className={cn("absolute inset-0 h-full lg:hidden", hover)} />
            <Img imgKey={story.cover.wide} alt="" sizes={size} ratio="fill" load={load} position="72% 50%" className={cn("absolute inset-0 hidden h-full lg:block", hover)} />
          </>
        )}
      </div>
      <div className={cn("flex flex-col pt-5", textOnlyForAT && "sr-only")}>
        <div className="text-ink-3">{meta}</div>
        <H className={cn("mt-3", look.title)}>{story.title}</H>
        <p className={cn("mt-3 text-[14.5px] leading-relaxed text-ink-2", look.dek)}>{story.dek}</p>
        {cta}
      </div>
    </Link>
  );
}
