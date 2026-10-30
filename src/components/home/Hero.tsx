"use client";
import { getImageProps } from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { PinLayer } from "@/components/editorial/ShoppableImage";
import { Col } from "@/components/layout/Grid";
import { LinkButton } from "@/components/ui/Button";
import { THEMES, editById } from "@/data/edits";
import type { Story } from "@/data/types";
import { imgEdge, imgSrc } from "@/lib/img";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Home hero — a full-bleed image banner. Desktop: the 16:9 scene fills the width (height capped to the viewport) with the
 * headline sitting on its calm flat-colour wall, columns 1–5 of the grid. Tablets: the same 16:9 scene edge to edge with the
 * copy in a flat panel below. Phones: the 4:5 scene on top and the panel below. One <picture>, so each viewport downloads
 * exactly one image.
 */
export function Hero({ story, compact }: { story: Story; compact?: boolean }) {
  const t = THEMES[story.theme];
  const edit = story.editId ? editById[story.editId] : null;
  const wall = imgEdge(story.cover.wide)?.wall[0] ?? t.tint;
  const onDark = lum(wall) < 0.28;
  const open = () => {
    signal("story_open", { editId: story.editId, tags: story.tags });
    track("editorial_story_open", { storyId: story.id, source: "home-hero" });
  };

  const copy = (dark: boolean) => (
    <div className={dark ? "on-dark text-bone" : "text-ink"}>
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden className={dark ? "h-px w-8 bg-bone" : "h-px w-8 bg-ink"} />
        {story.kicker}
      </p>
      <h1 className={compact ? "display-md mt-5" : "display-lg mt-6"}>{story.title}</h1>
      <p className={dark ? "mt-6 max-w-[44ch] text-[16px] leading-relaxed text-bone" : "mt-6 max-w-[44ch] text-[16px] leading-relaxed text-ink-2"}>{story.dek}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <LinkButton href={`/discover/${story.id}`} size="lg" variant={dark ? "inverse" : "primary"} iconRight={<ArrowRight size={16} />} onClick={open}>
          See the story
        </LinkButton>
        {edit && (
          <LinkButton href={`/edits/${edit.id}`} variant={dark ? "outline-light" : "secondary"} size="lg" onClick={() => signal("edit_open", { editId: edit.id })}>
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
  const tall = getImageProps({ src: imgSrc(story.cover.tall), alt, fill: true, sizes: "100vw", loading: "eager", fetchPriority: "high" });
  const { srcSet: wideSet } = wide.props;
  const { srcSet: tallSet, ...imgProps } = tall.props;

  return (
    <div className="lg:[background:var(--wall)]" style={{ "--wall": wall } as CSSProperties}>
      <div className={compact ? "relative mx-auto lg:h-[min(40vw,64vh,620px)] lg:min-h-[460px] lg:max-w-[1920px] lg:overflow-hidden" : "relative mx-auto lg:h-[min(56.25vw,88vh,900px)] lg:min-h-[540px] lg:max-w-[1920px] lg:overflow-hidden"}>
        <div className="relative aspect-[4/5] w-full sm:aspect-video lg:absolute lg:left-0 lg:top-1/2 lg:-translate-y-1/2" style={{ backgroundColor: wall }}>
          <picture>
            <source media="(min-width: 600px)" srcSet={wideSet} sizes="100vw" />
            <img {...imgProps} srcSet={tallSet} alt={alt} className="object-cover" />
          </picture>
          <PinLayer imgKey={story.cover.wide} className="hidden sm:block" />
          <PinLayer imgKey={story.cover.tall} className="sm:hidden" />
        </div>
        <div className="pointer-events-none hidden lg:absolute lg:inset-0 lg:block">
          <div className="container-x grid-main h-full items-center">
            <Col span={{ lg: 5 }} className="pointer-events-auto">
              {copy(onDark)}
            </Col>
          </div>
        </div>
      </div>
      <div className="bg-sand lg:hidden">
        <div className="container-x py-10 sm:py-12">
          <div className="max-w-[560px]">{copy(false)}</div>
        </div>
      </div>
    </div>
  );
}

/** "Shop by edit" quick row under the hero — flat square chips. */
export function EditChips({ edits }: { edits: Array<{ id: string; title: string; theme: keyof typeof THEMES }> }) {
  return (
    <nav aria-label="Edits" className="border-b border-line bg-bone">
      <ul className="container-x scrollbar-none flex items-center gap-2 overflow-x-auto py-3">
        <li className="eyebrow mr-3 shrink-0 text-ink-3">Shop by edit</li>
        {edits.map((e) => (
          <li key={e.id} className="shrink-0">
            <Link href={`/edits/${e.id}`} onClick={() => signal("edit_open", { editId: e.id })} className="inline-flex h-11 items-center gap-2.5 border border-line-strong px-4 text-[13.5px] font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-bone">
              <span aria-hidden className="size-2.5 border border-ink/25" style={{ background: THEMES[e.theme].accent === "#e80071" ? "#e80071" : THEMES[e.theme].bg }} />
              {e.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
