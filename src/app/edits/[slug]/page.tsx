import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { EditHeader } from "@/components/editorial/EditHeader";
import { EditTile } from "@/components/editorial/EditTile";
import { StoryCard } from "@/components/editorial/StoryCard";
import { EditOpenTracker } from "@/components/editorial/Trackers";
import { LabelBadges, LabelMonogram } from "@/components/product/LabelMark";
import { ProductListing } from "@/components/plp/ProductListing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { ListingPageSkeleton } from "@/components/ui/PageSkeletons";
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
    <Suspense fallback={<ListingPageSkeleton band />}>
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
  const more = primaryEdits.filter((e) => e.id !== edit.id).slice(0, 3);
  return (
    <>
      <EditOpenTracker editId={edit.id} />
      <EditHeader edit={edit} count={pool.length} />

      {labels.length > 1 && (
        <section aria-labelledby="makers" className="container-x py-14 sm:py-20">
          <SectionHeading level={2} eyebrow="Label stories" title={<span id="makers">Meet the labels.</span>} intro="Every label in this edit, with the story behind it." href="/brands" hrefLabel="All labels" />
          <ul className="scrollbar-none snap-x-rail -mx-[var(--gutter)] mt-10 flex gap-4 overflow-x-auto px-[var(--gutter)] pb-3">
            {labels.map(([id, n]) => {
              const l = labelById[id];
              return (
                <li key={id} className="w-[78vw] shrink-0 sm:w-[340px]">
                  <Link href={`/brands/${id}`} className="group flex h-full flex-col gap-4 border border-line bg-paper p-6 transition-colors hover:border-ink">
                    <div className="flex items-center gap-4">
                      <LabelMonogram label={l} />
                      <div className="min-w-0">
                        <p className="display-xs truncate">{l.name}</p>
                        <p className="text-[12.5px] text-ink-3">{l.origin}</p>
                      </div>
                    </div>
                    <p className="line-clamp-3 text-[14px] leading-relaxed text-ink-2">{l.story}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <LabelBadges label={l} />
                      <span className="link-u text-[12px] font-medium uppercase tracking-[0.1em]">{n} in this edit</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section id="pieces" aria-labelledby="pieces-h" className="scroll-mt-24 pb-4 pt-10 sm:pt-14">
        <div className="container-x mb-8">
          <h2 id="pieces-h" className="display-md">The pieces.</h2>
        </div>
        <Suspense fallback={<div className="container-x"><GridSkeleton count={8} /></div>}>
          <ProductListing pool={pool} scopeKey={`edit:${edit.id}`} source={`edit:${edit.id}`} hide={edit.id === "responsible" ? ["responsible"] : edit.id === "the-offer-edit" ? ["offers"] : []} categoryScope={[]} resultsHeading={false} />
        </Suspense>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="rel-stories" className="container-x py-16 sm:py-24">
          <SectionHeading level={2} eyebrow="From the Style Files" title={<span id="rel-stories">Read the story.</span>} href="/discover" hrefLabel="All stories" />
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {related.map((s) => (
              <StoryCard key={s.id} story={s} variant="wide" source={`edit:${edit.id}`} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="more-edits" className="container-x pb-8 pt-10">
        <SectionHeading level={2} eyebrow="Keep going" title={<span id="more-edits">More edits.</span>} href="/edits" hrefLabel="All edits" />
        <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-3">
          {more.map((e) => (
            <li key={e.id}>
              <EditTile edit={e} source="more-edits" sizes="(min-width:600px) 33vw, 100vw" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
