import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryRail, type RailItem } from "@/components/plp/CategoryRail";
import { interleave, relatedEditTiles, type Feature } from "@/components/plp/features";
import { ListingHeader } from "@/components/plp/ListingHeader";
import { ProductListing } from "@/components/plp/ProductListing";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { ListingPageSkeleton } from "@/components/ui/PageSkeletons";
import { categories, categoryById, childrenOf } from "@/data/categories";
import { productsInCategory, categoryTrail } from "@/data/queries";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.path }));
}

export async function generateMetadata({ params }: PageProps<"/c/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cat = categoryById[slug.join("/")];
  if (!cat) return {};
  const top = slug.length > 1 ? `${categoryById[slug[0]].name} · ` : "";
  return { title: `${top}${cat.name}`, description: cat.blurb };
}

export default function CategoryPage(props: PageProps<"/c/[...slug]">) {
  return (
    <Suspense fallback={<ListingPageSkeleton />}>
      <CategoryContent params={props.params} />
    </Suspense>
  );
}

const railItem = (id: string): RailItem => {
  const list = productsInCategory(id);
  const rep = list.find((p) => !p.soldOut) ?? list[0];
  return { id, name: categoryById[id].name, count: list.length, imgKey: rep.variants[0].images[0] };
};

async function CategoryContent({ params }: Pick<PageProps<"/c/[...slug]">, "params">) {
  const { slug } = await params;
  const id = slug.join("/");
  const cat = categoryById[id];
  if (!cat) notFound();
  const pool = productsInCategory(id);
  const subs = childrenOf(id);
  const parent = slug.length > 1 ? categoryById[slug[0]] : null;
  // A department shows its sub-categories; a leaf shows its siblings, so there is always somewhere visual to go next.
  const rail = subs.length > 0 ? subs.map((s) => railItem(s.id)) : parent ? childrenOf(parent.id).filter((s) => s.id !== id).map((s) => railItem(s.id)) : [];
  // Feature inserts: a related edit, then a hero piece, then the next related edit …
  const features: Feature[] = interleave(relatedEditTiles(pool, 2), [{ kind: "hero" }, { kind: "hero" }] as Feature[]);
  return (
    <>
      <ListingHeader crumbs={[{ name: "Home", href: "/" }, ...categoryTrail(slug).map((c, i, a) => ({ name: c.name, href: i < a.length - 1 ? c.href : undefined }))]} title={cat.name} intro={cat.blurb} />
      <CategoryRail label={subs.length > 0 ? `${cat.name} categories` : `More in ${parent?.name}`} eyebrow={subs.length > 0 ? "Shop by category" : `More in ${parent?.name}`} items={rail} />
      <Suspense fallback={<div className="container-x"><GridSkeleton count={8} /></div>}>
        <ProductListing pool={pool} scopeKey={`cat:${id}`} categoryScope={slug} source={`cat:${id}`} features={features} />
      </Suspense>
    </>
  );
}
