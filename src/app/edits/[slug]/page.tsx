import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EditHeader } from "@/components/editorial/EditHeader";
import { EditTile } from "@/components/editorial/EditTile";
import { LookStrip } from "@/components/editorial/LookStrip";
import { ShoppableImage } from "@/components/editorial/ShoppableImage";
import { StoryCard } from "@/components/editorial/StoryCard";
import { EditOpenTracker } from "@/components/editorial/Trackers";
import { LabelTile } from "@/app/brands/_components/LabelTile";
import { Col, Grid } from "@/components/layout/Grid";
import { RevealMedia } from "@/components/motion/reveal";
import { Section } from "@/components/layout/Section";
import { highlightNotes, interleave, labelTiles, type Feature } from "@/components/plp/features";
import { ProductListing } from "@/components/plp/ProductListing";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { SIZES } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { ListingSkeleton } from "@/components/plp/PageSkeletons";
import { edits, editById, primaryEdits } from "@/data/edits";
import { labelById } from "@/data/labels";
import { editProducts } from "@/data/queries";
import { stories } from "@/data/stories";

export function generateStaticParams() {
  return edits.map((e) => ({ slug: e.id }));
}
export async function generateMetadata({ params }: PageProps<"/edits/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = editById[slug];
  return e ? { title: e.title, description: e.narrative } : {};
}

export default function EditPage(props: PageProps<"/edits/[slug]">) {
  return (
    <Suspense fallback={<ListingSkeleton band />}>
      <EditContent params={props.params} />
    </Suspense>
  );
}

async function EditContent({ params }: Pick<PageProps<"/edits/[slug]">, "params">) {
  const { slug } = await params;
  const edit = editById[slug];
  if (!edit) notFound();
  const pool = editProducts(edit);
  const labelCounts = new Map<string, number>();
  for (const p of pool) labelCounts.set(p.labelId, (labelCounts.get(p.labelId) ?? 0) + 1);
  const labels = edit.primary ? Array.from(labelCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10) : [];
  const related = stories.filter((s) => s.editId === edit.id);
  // The shoppable look: a scene from the edit's story (its pins list the pieces), when the edit has one.
  const story = related[0];
  const sceneBlock = story?.blocks.find((b) => b.t === "scene");
  const look = story ? { story, scene: sceneBlock?.t === "scene" ? sceneBlock.scene : story.cover.wide, caption: sceneBlock?.t === "scene" ? sceneBlock.caption : story.title } : null;
  const more = primaryEdits.filter((e) => e.id !== edit.id).slice(0, 3);
  // Grid inserts for this edit: one of its labels, a hero piece, the edit's own promise as an info panel — then the next label.
  const features: Feature[] = interleave<Feature>(labelTiles(pool, 2), [{ kind: "hero" }, { kind: "hero" }], highlightNotes(edit, 2));
  return (
    <>
      <EditOpenTracker editId={edit.id} />
      <EditHeader edit={edit} count={pool.length} />

      {labels.length > 1 && (
        <Section y="sm" aria-labelledby="makers">
          <Carousel>
            <SectionHeading level={2} size="lg" eyebrow="Label stories" title={<span id="makers">Meet the labels.</span>} intro="Every label in this edit, with the story behind it." href="/brands" hrefLabel="All labels">
              <CarouselArrows />
            </SectionHeading>
            <div className="mt-12">
              <CarouselTrack label="Labels in this edit" density="tile" cursor="Drag">
                {labels.map(([id, n]) => (
                  <LabelTile key={id} label={labelById[id]} meta={`${n} in this edit`} sizes={SIZES.tile} />
                ))}
              </CarouselTrack>
            </div>
          </Carousel>
        </Section>
      )}

      {look && (
        <Section tone="paper" y="sm" className="border-y border-line" aria-labelledby="look-h">
          {/* 8 + 4: the shoppable scene beside a heading and the pieces in it */}
          <Grid className="items-stretch gap-y-8">
            <Col span={{ base: 4, sm: 12, lg: 8 }}>
              <RevealMedia>
                <ShoppableImage imgKey={look.scene} alt={look.caption} sizes="(min-width:1024px) 66vw, 100vw" ratio="3/2" />
              </RevealMedia>
              <p className="mt-4 text-[14px] text-ink-3">{look.caption}</p>
            </Col>
            <Col span={{ base: 4, sm: 12, lg: 4 }} className="flex flex-col justify-between gap-10">
              <div>
                <p className="eyebrow text-ink-3">{look.story.kicker}</p>
                <h2 id="look-h" className="display-md mt-5">
                  Shop the look.
                </h2>
              </div>
              <LookStrip imgKey={look.scene} variant="stack" title="In this image" label={`Shop: ${look.caption}`} />
            </Col>
          </Grid>
        </Section>
      )}

      <section id="pieces" aria-labelledby="pieces-h" className="scroll-mt-24 pb-4 pt-[var(--section-y)]">
        <div className="container-x mb-12">
          <SectionHeading level={2} size="lg" eyebrow="Shop the edit" title={<span id="pieces-h">All products.</span>} />
        </div>
        <Suspense fallback={<div className="container-x"><GridSkeleton count={8} /></div>}>
          <ProductListing pool={pool} scopeKey={`edit:${edit.id}`} source={`edit:${edit.id}`} hide={edit.id === "responsible" ? ["responsible"] : edit.id === "the-offer-edit" ? ["offers"] : []} categoryScope={[]} resultsHeading={false} features={features} />
        </Suspense>
      </section>

      {/* the edit's story, full-bleed: a different rhythm after the product grid */}
      {related.map((s) => (
        <div key={s.id} className="mt-[var(--section-y)]">
          <StoryCard story={s} variant="banner" as="h2" source={`edit:${edit.id}`} />
        </div>
      ))}

      <Section tone="paper" y="sm" className="border-t border-line" aria-labelledby="more-edits">
        <SectionHeading level={2} size="lg" eyebrow="Keep going" title={<span id="more-edits">More edits.</span>} href="/edits" hrefLabel="All edits" />
        <div className="mt-12">
          <Carousel>
            <CarouselTrack label="More edits" density="wide" cursor="Drag">
              {more.map((e) => (
                <EditTile key={e.id} edit={e} source="more-edits" sizes="(min-width:1024px) 33vw, (min-width:600px) 45vw, 90vw" ratio="5/4" />
              ))}
            </CarouselTrack>
          </Carousel>
        </div>
      </Section>
    </>
  );
}
