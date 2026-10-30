"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ShoppableImage } from "@/components/editorial/ShoppableImage";
import { LinkButton } from "@/components/ui/Button";
import { SIZES } from "@/components/ui/Img";
import { THEMES, editById } from "@/data/edits";
import type { Story } from "@/data/types";
import { imgAvg } from "@/lib/img";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";

/** Hero editorial story (PRD §5.1 "hero editorial story"). Desktop: shoppable cover with headline over the calm side. Touch: cover on top, text below. */
export function Hero({ story, compact }: { story: Story; compact?: boolean }) {
  const t = THEMES[story.theme];
  const edit = story.editId ? editById[story.editId] : null;
  const [first, ...rest] = story.title.split(/\s+/);
  const open = () => {
    signal("story_open", { editId: story.editId, tags: story.tags });
    track("editorial_story_open", { storyId: story.id, source: "home-hero" });
  };
  const copy = (
    <div className="max-w-xl">
      <p className="eyebrow flex items-center gap-2.5 text-ink-2">
        <span aria-hidden className="h-px w-8 bg-ink" />
        {story.kicker}
      </p>
      <h1 className={compact ? "display-md mt-5 text-balance" : "display-lg mt-6 text-balance"}>
        {first} <em>{rest.join(" ")}</em>
      </h1>
      <p className="lede mt-6 max-w-[46ch]">{story.dek}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <LinkButton href={`/discover/${story.id}`} size="lg" iconRight={<ArrowRight size={16} />} onClick={open}>
          See the story
        </LinkButton>
        {edit && (
          <LinkButton href={`/edits/${edit.id}`} variant="secondary" size="lg" onClick={() => signal("edit_open", { editId: edit.id })}>
            Shop {edit.title}
          </LinkButton>
        )}
      </div>
    </div>
  );
  return (
    <div>
      {/* Desktop */}
      <div className="relative hidden overflow-hidden lg:block" style={{ background: imgAvg(story.cover.wide) }}>
        <div className="relative mx-auto" style={{ aspectRatio: "16 / 9", width: `min(100%, calc(${compact ? "64vh" : "min(84vh, 860px)"} * 16 / 9))` }}>
          <ShoppableImage imgKey={story.cover.wide} alt={`${story.title} — editorial cover`} sizes={SIZES.full} priority className="absolute inset-0 h-full w-full" ratio="16/9" />
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center">
          <div className="container-x">
            <div className="pointer-events-auto w-[min(46%,620px)]">{copy}</div>
          </div>
        </div>
      </div>
      {/* Mobile & tablet */}
      <div className="lg:hidden">
        <div className="mx-auto max-w-[640px]">
          <ShoppableImage imgKey={story.cover.tall} alt={`${story.title} — editorial cover`} sizes="(min-width:640px) 640px, 100vw" ratio="4/5" />
        </div>
        <div className="container-x py-9" style={{ background: t.bg === "#f3dcd6" ? "#f3dcd6" : undefined }}>
          {copy}
        </div>
      </div>
    </div>
  );
}

export function EditChips({ edits }: { edits: Array<{ id: string; title: string; theme: keyof typeof THEMES }> }) {
  return (
    <nav aria-label="Edits" className="border-b border-line">
      <ul className="container-x scrollbar-none flex items-center gap-2 overflow-x-auto py-3.5">
        <li className="eyebrow mr-2 shrink-0 text-ink-3">Shop by edit</li>
        {edits.map((e) => (
          <li key={e.id} className="shrink-0">
            <Link href={`/edits/${e.id}`} onClick={() => signal("edit_open", { editId: e.id })} className="inline-flex h-10 items-center gap-2.5 rounded-full border border-line-strong px-4 text-[13.5px] text-ink transition-colors hover:border-ink hover:bg-sand">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: THEMES[e.theme].accent === "#e80071" ? "#e80071" : THEMES[e.theme].bg }} />
              {e.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
