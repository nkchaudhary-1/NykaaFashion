import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LookStrip } from "@/components/editorial/LookStrip";
import { ShoppableImage } from "@/components/editorial/ShoppableImage";
import { StoryActions } from "@/components/editorial/StoryActions";
import { StoryCard } from "@/components/editorial/StoryCard";
import { StoryOpenTracker } from "@/components/editorial/Trackers";
import { ProductRail } from "@/components/product/Rail";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SIZES } from "@/components/ui/Img";
import { ArticleSkeleton } from "@/components/ui/PageSkeletons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LinkButton } from "@/components/ui/Button";
import { productById } from "@/data/catalog";
import { THEMES, editById } from "@/data/edits";
import { stories, storyById } from "@/data/stories";

export function generateStaticParams() {
  return stories.map((s) => ({ slug: s.id }));
}
export async function generateMetadata({ params }: PageProps<"/discover/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = storyById[slug];
  return s ? { title: s.title, description: s.dek } : {};
}

export default function StoryPage(props: PageProps<"/discover/[slug]">) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <StoryContent params={props.params} />
    </Suspense>
  );
}

async function StoryContent({ params }: Pick<PageProps<"/discover/[slug]">, "params">) {
  const { slug } = await params;
  const story = storyById[slug];
  if (!story) notFound();
  const t = THEMES[story.theme];
  const edit = story.editId ? editById[story.editId] : null;
  const idx = stories.findIndex((s) => s.id === story.id);
  const next = stories[(idx + 1) % stories.length];
  const [first, ...rest] = story.title.split(/(?<=:)\s|\s(?=[A-Z])/);
  return (
    <article>
      <StoryOpenTracker storyId={story.id} editId={story.editId} tags={story.tags} />
      <header className="container-x pb-10 pt-6 sm:pb-14 sm:pt-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Discover", href: "/discover" }, { name: story.title }]} className="mb-10" />
        <p className="eyebrow flex items-center gap-3 text-ink-3"><span aria-hidden className="size-2.5 rounded-full" style={{ background: t.bg === "#f3dcd6" ? "#e80071" : t.bg }} />{story.kicker}</p>
        <h1 className="display-xl mt-6 max-w-[14ch] text-balance">{first}{rest.length > 0 && <> <em>{rest.join(" ")}</em></>}</h1>
        <p className="lede mt-8 max-w-[56ch]">{story.dek}</p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <p className="text-[13px] text-ink-3">By <span className="text-ink">{story.author}</span> · {story.readMins} min read</p>
          <StoryActions storyId={story.id} title={story.title} />
        </div>
      </header>

      <div className="container-x">
        <ShoppableImage imgKey={story.cover.wide} alt={`${story.title} — cover`} sizes={SIZES.full} priority ratio="16/9" />
        <LookStrip imgKey={story.cover.wide} title="Shop the cover" label="Shop the cover" />
      </div>

      <div className="mt-16 space-y-10 sm:mt-24 sm:space-y-14">
        {story.blocks.map((b, i) => {
          switch (b.t) {
            case "p":
              return <p key={i} className={`mx-auto max-w-[680px] px-[var(--gutter)] text-[17px] leading-[1.75] text-ink-2 ${i === 0 ? "first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-[78px] first-letter:leading-[0.8] first-letter:text-ink" : ""}`}>{b.text}</p>;
            case "h":
              return <h2 key={i} className="display-md mx-auto max-w-[680px] px-[var(--gutter)] pt-6">{b.text}</h2>;
            case "quote":
              return (
                <blockquote key={i} className="container-x py-4 sm:py-10">
                  <div className="mx-auto max-w-4xl border-l-2 border-ink pl-6 sm:pl-10">
                    <p className="display-md text-balance">“{b.text}”</p>
                    {b.by && <footer className="mt-5 text-[13px] text-ink-3">— {b.by}</footer>}
                  </div>
                </blockquote>
              );
            case "scene":
              return (
                <figure key={i} className="container-x">
                  <ShoppableImage imgKey={b.scene} alt={b.caption} sizes={SIZES.full} ratio="3/2" />
                  <figcaption className="mt-3 text-[13px] text-ink-3">{b.caption}</figcaption>
                  <LookStrip imgKey={b.scene} label={`Shop: ${b.caption}`} />
                </figure>
              );
            case "rail":
              return (
                <section key={i} aria-label={b.title} className="container-x pt-8">
                  <SectionHeading level={2} eyebrow={b.title} title={<>Own the story.</>} href={edit ? `/edits/${edit.id}` : undefined} hrefLabel={edit ? `Shop ${edit.title}` : undefined} />
                  <div className="mt-10"><ProductRail products={b.productIds.map((id) => productById[id]).filter(Boolean)} label={b.title} source={`story:${story.id}`} /></div>
                </section>
              );
          }
        })}
      </div>

      <section aria-labelledby="nx" className="container-x mt-24 border-t border-ink pb-8 pt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
          <div>
            <p className="eyebrow text-ink-3">Next in the Style Files</p>
            <h2 id="nx" className="display-md mt-4">{next.title}</h2>
            <p className="mt-4 max-w-[44ch] text-[15px] text-ink-2">{next.dek}</p>
            <LinkButton href={`/discover/${next.id}`} size="lg" className="mt-8">Read next</LinkButton>
          </div>
          <StoryCard story={next} variant="wide" as="h2" source="next-story" textOnlyForAT />
        </div>
        <p className="mt-10 text-[13px] text-ink-3">All people, studios and quotes in these stories are fictional prototype content. <Link href="/discover" className="underline underline-offset-4">All stories</Link></p>
      </section>
    </article>
  );
}
