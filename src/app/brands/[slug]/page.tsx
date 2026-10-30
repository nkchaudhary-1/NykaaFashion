import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { LabelBadges, LabelMonogram } from "@/components/product/LabelMark";
import { ProductListing } from "@/components/plp/ProductListing";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { ListingPageSkeleton } from "@/components/ui/PageSkeletons";
import { labelById, labels } from "@/data/labels";
import { productsByLabel } from "@/data/queries";

export function generateStaticParams() {
  return labels.map((l) => ({ slug: l.id }));
}
export async function generateMetadata({ params }: PageProps<"/brands/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const l = labelById[slug];
  return l ? { title: l.name, description: l.tagline } : {};
}

export default function BrandPage(props: PageProps<"/brands/[slug]">) {
  return (
    <Suspense fallback={<ListingPageSkeleton />}>
      <BrandContent params={props.params} />
    </Suspense>
  );
}

async function BrandContent({ params }: Pick<PageProps<"/brands/[slug]">, "params">) {
  const { slug } = await params;
  const label = labelById[slug];
  if (!label) notFound();
  const pool = productsByLabel(label.id);
  const siblings = labels.filter((l) => l.id !== label.id && (l.flags.hiddenGem === label.flags.hiddenGem && l.flags.luxe === label.flags.luxe && l.flags.houseOfNykaa === label.flags.houseOfNykaa)).slice(0, 4);
  return (
    <>
      <header className="container-x pb-10 pt-6 sm:pb-14 sm:pt-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Labels", href: "/brands" }, { name: label.name }]} className="mb-10" />
        <div className="grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,28rem)] lg:items-end lg:gap-14">
          <LabelMonogram label={label} size="lg" className="lg:size-40 lg:text-[76px]" />
          <div>
            <LabelBadges label={label} className="mb-5" />
            <h1 className="display-lg text-balance">{label.name}</h1>
            <p className="display-xs mt-4 max-w-[34ch] text-ink-2">{label.tagline}</p>
            <p className="mt-5 text-[13px] text-ink-3">{[label.origin, label.founded ? `est. ${label.founded}` : null, `${pool.length} pieces`].filter(Boolean).join(" · ")}</p>
          </div>
          <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink-2 lg:pb-1">{label.story}</p>
        </div>
      </header>
      <Suspense fallback={<div className="container-x"><GridSkeleton count={8} /></div>}>
        <ProductListing pool={pool} scopeKey={`brand:${label.id}`} source={`brand:${label.id}`} hide={["label"]} />
      </Suspense>
      {siblings.length > 0 && (
        <section className="container-x py-16 sm:py-24" aria-labelledby="more-labels">
          <SectionHeading level={2} eyebrow="Keep exploring" title={<span id="more-labels">More labels like this.</span>} href="/brands" hrefLabel="All labels" />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {siblings.map((l) => (
              <li key={l.id}>
                <Link href={`/brands/${l.id}`} className="group flex h-full items-center gap-4 border border-line bg-paper p-5 transition-colors hover:border-ink">
                  <LabelMonogram label={l} />
                  <span className="min-w-0">
                    <span className="display-xs block truncate">{l.name}</span>
                    <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-ink-3">{l.tagline}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
