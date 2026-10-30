"use client";
import Link from "next/link";
import { Img, SIZES } from "@/components/ui/Img";
import { THEMES } from "@/data/edits";
import type { Story } from "@/data/types";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";

export function StoryCard({ story, variant = "tall", priority, className, source = "home", sizes }: { story: Story; variant?: "tall" | "wide"; priority?: boolean; className?: string; source?: string; sizes?: string }) {
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
        <Img imgKey={variant === "wide" ? story.cover.wide : story.cover.tall} alt="" sizes={sizes ?? (variant === "wide" ? SIZES.half : SIZES.tile)} ratio={variant === "wide" ? "16/9" : "4/5"} priority={priority} className="transition-transform duration-[1100ms] ease-editorial group-hover:scale-[1.03]" />
      </div>
      <div className="pt-5">
        <p className="eyebrow flex items-center gap-2 text-ink-3">
          <span aria-hidden className="size-2 rounded-full" style={{ background: t.bg === "#f3dcd6" ? "#e80071" : t.bg }} />
          {story.kicker}
        </p>
        <h3 className={cn("mt-3", variant === "wide" ? "display-md" : "display-sm")}>{story.title}</h3>
        <p className={cn("mt-3 line-clamp-3 text-[14.5px] leading-relaxed text-ink-2", variant === "wide" && "max-w-[52ch]")}>{story.dek}</p>
        <p className="link-u mt-4 inline-block pb-0.5 text-[12px] font-medium uppercase tracking-[0.12em]">
          See the story <span className="font-normal text-ink-3">· {story.readMins} min</span>
        </p>
      </div>
    </Link>
  );
}
