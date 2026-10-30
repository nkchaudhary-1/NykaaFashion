"use client";
import Link from "next/link";
import { Img, SIZES, type LoadHint } from "@/components/ui/Img";
import { THEMES } from "@/data/edits";
import type { Story } from "@/data/types";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";

export function StoryCard({ story, variant = "tall", load, className, source = "home", sizes, as: H = "h3", textOnlyForAT }: { story: Story; variant?: "tall" | "wide"; load?: LoadHint; className?: string; source?: string; sizes?: string; as?: "h2" | "h3"; textOnlyForAT?: boolean }) {
  const t = THEMES[story.theme];
  return (
    <Link
      href={`/discover/${story.id}`}
      onClick={() => {
        signal("story_open", { editId: story.editId, tags: story.tags });
        track("editorial_story_open", { storyId: story.id, source });
      }}
      className={cn("group block", className)}
    >
      <div className="relative overflow-hidden">
        <Img imgKey={variant === "wide" ? story.cover.wide : story.cover.tall} alt="" sizes={sizes ?? (variant === "wide" ? SIZES.half : SIZES.tile)} ratio={variant === "wide" ? "16/9" : "4/5"} load={load} className="transition-transform duration-[1100ms] ease-editorial group-hover:scale-[1.03]" />
      </div>
      <div className={cn("pt-5", textOnlyForAT && "sr-only")}>
        <p className="eyebrow flex items-center gap-2 text-ink-3">
          <span aria-hidden className="size-2 rounded-full" style={{ background: t.bg === "#f3dcd6" ? "#e80071" : t.bg }} />
          {story.kicker}
        </p>
        <H className={cn("mt-3", variant === "wide" ? "display-md" : "display-sm")}>{story.title}</H>
        <p className={cn("mt-3 line-clamp-3 text-[14.5px] leading-relaxed text-ink-2", variant === "wide" && "max-w-[52ch]")}>{story.dek}</p>
        <p className="link-u mt-4 inline-block pb-0.5 text-[12px] font-medium uppercase tracking-[0.12em]">
          See the story <span className="font-normal text-ink-3">· {story.readMins} min</span>
        </p>
      </div>
    </Link>
  );
}
