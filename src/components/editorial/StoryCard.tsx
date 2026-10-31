"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Parallax } from "@/components/motion/Parallax";
import { Img, SIZES, type LoadHint } from "@/components/ui/Img";
import type { Story } from "@/data/types";
import { cn } from "@/lib/cn";
import { imgEdge } from "@/lib/img";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";

/**
 * A story as a silent cover with the words on the page: "kicker · read time", the title in display type, the dek and a "Read the story" line.
 * The covers scale ever so slowly inside their clipped frames on hover or focus (the frame stays on the grid). The variants are the pieces of the
 * Discover rows (see DiscoverIndex):
 *   tall    4:5 portrait cover, text below — 4/4/4 rows, the 5-column half of a 5/7 row, related stories
 *   wide    16:10 landscape cover, text below — 6/6 rows
 *   feature portrait below 1024px, then a landscape cover that fills the height its row gives it — the 7-column half of a 5/7 row
 *   banner  full-bleed cover (about 84% of the window on desktop) drifting against the scroll: the headline sits on the cover's calm wall (columns 1–5);
 *           below 1024px a flat panel under it. Place it outside a container (it brings its own `container-x`).
 * `tall` and `feature` can sit in a subgrid pair of rows: the parent passes `className="lg:row-span-2 lg:grid lg:grid-rows-subgrid"` so
 * the covers and the captions line up across the two cards.
 */
export type StoryCardVariant = "tall" | "wide" | "feature" | "banner";

/** WCAG relative luminance of a #rrggbb colour — picks light or dark type for text laid on an image's calm wall. */
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

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
  feature: { art: "split", box: "aspect-[4/5] lg:aspect-auto lg:min-h-0", title: "display-sm sm:display-md", dek: "line-clamp-2 max-w-[52ch]", sizes: "(min-width:1024px) 58vw, 50vw" },
};

export function StoryCard({ story, variant = "tall", load, className, source = "home", sizes, as: H = "h3", textOnlyForAT, box }: { story: Story; variant?: StoryCardVariant; load?: LoadHint; className?: string; source?: string; sizes?: string; as?: "h2" | "h3"; textOnlyForAT?: boolean; /** aspect classes for the cover of a text-below card (replaces the variant's own) */ box?: string }) {
  const href = `/discover/${story.id}`;
  const open = () => {
    signal("story_open", { editId: story.editId, tags: story.tags });
    track("editorial_story_open", { storyId: story.id, source });
  };
  const hover = "transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.04] group-focus-visible:scale-[1.04]";
  // the kicker label: raspberry, with the read time — the one accent colour of the content section.
  const meta = (cls?: string) => (
    <p className={cn("eyebrow text-pink-ink", cls)}>
      {story.kicker} · {story.readMins} min
    </p>
  );
  const cta = (
    <span className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em] text-ink transition-colors duration-300 group-hover:text-pink-ink">
      Read the story <ArrowRight size={14} aria-hidden className="transition-transform duration-500 ease-expo group-hover:translate-x-1" />
    </span>
  );

  // ── Full-bleed banner
  if (variant === "banner") {
    // the cover's own wall colour (image metadata, not a design token) decides between dark and light type on top of it
    const wall = imgEdge(story.cover.wide)?.wall[0];
    const dark = wall ? lum(wall) < 0.28 : false;
    const eager = load === "preload" ? "high" : load; // art-directed pair: the one that is displayed loads at once, the other never
    return (
      <Link href={href} onClick={open} className={cn("group relative block", className)}>
        <div data-cursor="View" className="relative aspect-[4/5] overflow-hidden bg-sand sm:aspect-[16/10] lg:aspect-auto lg:h-[min(84svh,860px)]" style={wall ? { backgroundColor: wall } : undefined}>
          <Parallax className="h-full" amount={28} scale={1.08}>
            <Img imgKey={story.cover.tall} alt="" sizes={sizes ?? "100vw"} ratio="fill" load={eager} className="absolute inset-0 h-full sm:hidden" />
            <Img imgKey={story.cover.wide} alt="" sizes={sizes ?? "100vw"} ratio="fill" load={eager} position="50% 45%" className="absolute inset-0 hidden h-full sm:block" />
          </Parallax>
        </div>
        {/* the kicker and the title sit on the wall at the top left of the picture (above anything in the scene); the dek and the call to read follow on the page */}
        <div className="bg-bone lg:absolute lg:inset-x-0 lg:top-0 lg:bg-transparent">
          <div className="container-x grid-main pt-8 sm:pt-10 lg:pt-[clamp(2rem,5vw,4.5rem)]">
            <div className={cn("col-span-4 min-w-0 text-ink sm:col-span-12 lg:col-span-6", dark && "lg:text-bone")}>
              {meta(dark ? "lg:text-pink-soft" : undefined)}
              <H className="display-md mt-4 lg:display-lg">{story.title}</H>
            </div>
          </div>
        </div>
        <div className="bg-bone">
          <div className="container-x grid-main items-end gap-y-6 pb-2 pt-5 sm:pt-6 lg:pt-8">
            <p className="col-span-4 min-w-0 max-w-[44ch] text-[15px] leading-relaxed text-ink-2 sm:col-span-12 lg:col-span-6">{story.dek}</p>
            <span className="col-span-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.09em] transition-colors duration-300 group-hover:text-pink-ink sm:col-span-12 lg:col-span-5 lg:col-start-8 lg:justify-end">
              Read the story <ArrowRight size={14} aria-hidden className="transition-transform duration-500 ease-expo group-hover:translate-x-1" />
            </span>
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
      <div data-cursor="View" className={cn("relative overflow-hidden bg-sand", box ?? look.box)}>
        <div data-nogrid className={cn("absolute inset-0", hover)}>
          {look.art === "tall" && <Img imgKey={story.cover.tall} alt="" sizes={size} ratio="fill" load={load} className="absolute inset-0 h-full" />}
          {look.art === "wide" && <Img imgKey={story.cover.wide} alt="" sizes={size} ratio="fill" load={load} position="72% 50%" className="absolute inset-0 h-full" />}
          {look.art === "split" && (
            <>
              <Img imgKey={story.cover.tall} alt="" sizes={size} ratio="fill" load={load} className="absolute inset-0 h-full lg:hidden" />
              <Img imgKey={story.cover.wide} alt="" sizes={size} ratio="fill" load={load} position="72% 50%" className="absolute inset-0 hidden h-full lg:block" />
            </>
          )}
        </div>
      </div>
      <div className={cn("flex flex-col pt-5", textOnlyForAT && "sr-only")}>
        {meta()}
        <H className={cn("mt-3", look.title)}>{story.title}</H>
        <p className={cn("mt-3 text-[14.5px] leading-relaxed text-ink-2", look.dek)}>{story.dek}</p>
        {cta}
      </div>
    </Link>
  );
}
