import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, Suspense } from "react";
import { LookList } from "@/components/editorial/ShoppableImage";
import { StoryCard } from "@/components/editorial/StoryCard";
import { StoryOpenTracker } from "@/components/editorial/Trackers";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { SIZES } from "@/components/ui/Img";
import { StorySkeleton } from "@/components/plp/PageSkeletons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { productById } from "@/data/catalog";
import { editById } from "@/data/edits";
import { stories, storyById } from "@/data/stories";
import type { Story, StoryBlock } from "@/data/types";
import { cn } from "@/lib/cn";
import { StoryCover } from "../_components/StoryCover";
import { StoryFigure, type FigureLayout } from "../_components/StoryFigure";

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
    <Suspense fallback={<StorySkeleton />}>
      <StoryContent params={props.params} />
    </Suspense>
  );
}

/** Two scenes per story, each in a different figure layout — and a different pair for each story, so no two stories read alike. */
const FIGURES: Array<[FigureLayout, FigureLayout]> = [
  ["side", "full"],
  ["full", "side-r"],
  ["pair", "full"],
  ["side-r", "pair"],
  ["full", "pair"],
  ["pair", "side"],
];

/** Vertical rhythm: what sits above a block depends on what the block above it is. */
function gapBefore(prev: StoryBlock["t"] | null, cur: StoryBlock["t"]): string {
  if (!prev) return "mt-12 sm:mt-16 lg:mt-24";
  if (cur === "p") return prev === "p" ? "mt-6 sm:mt-8" : prev === "h" ? "mt-6" : "mt-14 sm:mt-20";
  if (cur === "scene") return prev === "p" ? "mt-16 sm:mt-24" : "mt-16 sm:mt-24";
  return "mt-16 sm:mt-24"; // headings and pull quotes
}

// The reading column: 4 columns on phones, 10 centred on tablets (2–11), 8 centred on desktop (3–10); text stops at ~62 characters.
const READ = "col-span-4 sm:col-span-10 sm:col-start-2 lg:col-span-8 lg:col-start-3";

async function StoryContent({ params }: Pick<PageProps<"/discover/[slug]">, "params">) {
  const { slug } = await params;
  const story = storyById[slug];
  if (!story) notFound();
  const edit = story.editId ? editById[story.editId] : null;
  const idx = stories.findIndex((s) => s.id === story.id);
  const next = stories[(idx + 1) % stories.length];
  const more = [1, 2, 3].map((n) => stories[(idx + n) % stories.length]).filter((s) => s.id !== story.id);
  const figures = FIGURES[idx % FIGURES.length];
  let scenes = 0;
  let quotes = 0;

  return (
    <article>
      <StoryOpenTracker storyId={story.id} editId={story.editId} tags={story.tags} />
      <div className="container-x pb-6 pt-6 sm:pt-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Discover", href: "/discover" }, { name: story.title }]} />
      </div>
      <StoryCover story={story} />

      {/* Shop the cover — desktop only: on touch the pins are the tap targets, and the story starts straight away */}
      <div className="container-x mt-10 hidden lg:block">
        <Grid>
          <Col span={{ lg: 12 }}>
            <LookList imgKey={[story.cover.wide, story.cover.tall]} title="Shop the cover" label="Shop the cover" layout="strip" />
          </Col>
        </Grid>
      </div>

      {story.blocks.map((b, i) => {
        const gap = gapBefore(i ? story.blocks[i - 1].t : null, b.t);
        switch (b.t) {
          case "p":
            return (
              <div key={i} className={cn("container-x", gap)}>
                <Grid>
                  <Col span={{}} className={READ}>
                    <p className={cn("max-w-[62ch]", i === 0 ? "text-[19px] leading-[1.7] text-ink sm:text-[21px] 2xl:text-[22px]" : "text-[17px] leading-[1.8] text-ink-2 sm:text-[18px] 2xl:text-[19px]", i === 0 && "first-letter:float-left first-letter:mr-3 first-letter:mt-1.5 first-letter:text-[64px] sm:first-letter:text-[84px] first-letter:font-medium first-letter:leading-[0.78] first-letter:text-ink")}>{b.text}</p>
                  </Col>
                </Grid>
              </div>
            );
          case "h":
            return (
              <div key={i} className={cn("container-x", gap)}>
                <Grid>
                  <Col span={{}} className={READ}>
                    <h2 className="display-md max-w-[22ch]">{b.text}</h2>
                  </Col>
                </Grid>
              </div>
            );
          case "quote": {
            // pull quotes break out of the reading column: hanging off its left (columns 2–9), then off its right (4–11)
            const right = quotes++ % 2 === 1;
            return (
              <div key={i} className={cn("container-x", gap)}>
                <Grid>
                  <Col as="blockquote" span={{}} className={cn("col-span-4 border-t border-ink pt-6 sm:col-span-11 sm:pt-10 lg:col-span-8", right ? "sm:col-start-2 lg:col-start-4" : "sm:col-start-1 lg:col-start-2")}>
                    <p className="display-md max-w-[24ch]">
                      <span className="text-pink">“</span>
                      {b.text}
                      <span className="text-pink">”</span>
                    </p>
                    {b.by && <footer className="eyebrow mt-6 text-pink-ink">— {b.by}</footer>}
                  </Col>
                </Grid>
              </div>
            );
          }
          case "scene": {
            const layout = figures[scenes++ % figures.length];
            return (
              <div key={i} className={cn("container-x", gap)}>
                <StoryFigure imgKey={b.scene} caption={b.caption} layout={layout} n={scenes} />
              </div>
            );
          }
          case "rail":
            return (
              <Fragment key={i}>
                <ShopTheStory story={story} title={b.title} productIds={b.productIds} editTitle={edit?.title} editHref={edit ? `/edits/${edit.id}` : undefined} />
              </Fragment>
            );
        }
      })}

      <KeepReading next={next} more={more} />
    </article>
  );
}

/** "Shop the story" — a flat paper band with a product carousel (arrows in the heading on desktop, swipe on touch). */
function ShopTheStory({ story, title, productIds, editTitle, editHref }: { story: Story; title: string; productIds: string[]; editTitle?: string; editHref?: string }) {
  const products = productIds.map((id) => productById[id]).filter(Boolean);
  return (
    <Section tone="paper" className="mt-16 border-y border-line sm:mt-24" aria-label={title}>
      <Carousel>
        <SectionHeading level={2} size="lg" eyebrow={title} title="Own the story." href={editHref} hrefLabel={editTitle ? `Shop ${editTitle}` : undefined}>
          <CarouselArrows />
        </SectionHeading>
        <div className="mt-10">
          <CarouselTrack label={title} density="product">
            {products.map((p) => (
              <div key={p.id} className="flex h-full flex-col">
                <ProductCard product={p} source={`story:${story.id}`} sizes={SIZES.rail} />
              </div>
            ))}
          </CarouselTrack>
        </div>
      </Carousel>
    </Section>
  );
}

/** The next story and two more, three across (span 4 each on desktop; a swipeable row with the next card peeking below that). */
function KeepReading({ next, more }: { next: Story; more: Story[] }) {
  return (
    <Section aria-labelledby="nx">
      <Carousel>
        <SectionHeading level={2} size="lg" eyebrow="Next in the Style Files" title={<span id="nx">Keep reading.</span>} href={`/discover/${next.id}`} hrefLabel="Read next" />
        <div className="mt-10 sm:mt-14">
          <CarouselTrack label="More stories" density="wide" cursor="Drag">
            {more.map((s) => (
              <StoryCard key={s.id} story={s} as="h3" source="next-story" />
            ))}
          </CarouselTrack>
        </div>
      </Carousel>
      <p className="mt-14 text-[13px] text-ink-3">
        All people, studios and quotes in these stories are fictional prototype content.{" "}
        <Link href="/discover" className="underline underline-offset-4">
          All stories
        </Link>
      </p>
    </Section>
  );
}
