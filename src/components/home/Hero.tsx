"use client";
import { getImageProps } from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { PinLayer } from "@/components/editorial/ShoppableImage";
import { LinkButton } from "@/components/ui/Button";
import { THEMES, editById } from "@/data/edits";
import type { Story } from "@/data/types";
import { imgAvg, imgEdge, imgSrc } from "@/lib/img";
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
  // Art direction in one <picture>: a phone downloads only the tall cover, a laptop only the wide one, and the LCP
  // image can load eagerly without a hidden second copy being fetched (or preloaded) as well.
  const alt = `${story.title} — editorial cover`;
  const wide = getImageProps({ src: imgSrc(story.cover.wide), alt, fill: true, sizes: "100vw" });
  const tall = getImageProps({ src: imgSrc(story.cover.tall), alt, fill: true, sizes: "(min-width:640px) 640px, 100vw", loading: "eager", fetchPriority: "high" });
  const { srcSet: wideSet } = wide.props;
  // Pillar-box bars on big screens continue the wall (and floor) of the scene instead of a flat average colour.
  const edge = imgEdge(story.cover.wide);
  const band = edge
    ? `linear-gradient(to right, ${edge.floor[0]}, ${edge.floor[1]}) left bottom / 100% ${(1 - edge.floorY) * 100}% no-repeat, linear-gradient(to right, ${edge.wall[0]}, ${edge.wall[1]}) left top / 100% 100% no-repeat`
    : imgAvg(story.cover.wide);
  const { srcSet: tallSet, ...imgProps } = tall.props;
  return (
    <div className="relative overflow-hidden lg:[background:var(--hero-band)]" style={{ "--hero-band": band } as CSSProperties}>
      {/* Touch: 4:5 cover on top, copy below. Desktop: 16:9 cover, copy laid over its calm side. */}
      <div
        className="relative mx-auto aspect-[4/5] w-full max-w-[640px] bg-[var(--tall-bg)] lg:aspect-video lg:w-[min(100%,calc(var(--hero-h)*16/9))] lg:max-w-none lg:bg-transparent lg:[-webkit-mask-image:linear-gradient(to_right,transparent,#000_3%,#000_97%,transparent)] lg:[mask-image:linear-gradient(to_right,transparent,#000_3%,#000_97%,transparent)]"
        style={{ "--tall-bg": imgAvg(story.cover.tall), "--hero-h": compact ? "64vh" : "min(84vh, 860px)" } as CSSProperties}
      >
        <picture>
          <source media="(min-width: 1024px)" srcSet={wideSet} sizes="100vw" />
          <img {...imgProps} srcSet={tallSet} alt={alt} className="object-cover" />
        </picture>
        <PinLayer imgKey={story.cover.wide} className="hidden lg:block" />
        <PinLayer imgKey={story.cover.tall} className="lg:hidden" />
      </div>
      <div className="pointer-events-none absolute inset-0 hidden items-center lg:flex">
        <div className="container-x">
          <div className="pointer-events-auto w-[min(46%,620px)]">{copy}</div>
        </div>
      </div>
      <div className="container-x py-9 lg:hidden" style={{ background: t.bg === "#f3dcd6" ? "#f3dcd6" : undefined }}>
        {copy}
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
            <Link href={`/edits/${e.id}`} onClick={() => signal("edit_open", { editId: e.id })} className="inline-flex h-11 items-center gap-2.5 rounded-full border border-line-strong px-4 text-[13.5px] text-ink transition-colors hover:border-ink hover:bg-sand">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: THEMES[e.theme].accent === "#e80071" ? "#e80071" : THEMES[e.theme].bg }} />
              {e.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
