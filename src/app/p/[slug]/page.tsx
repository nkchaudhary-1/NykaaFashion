import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CompleteTheLook } from "@/components/product/CompleteTheLook";
import { ProductDetail } from "@/components/product/ProductDetail";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { Reviews } from "@/components/product/Reviews";
import { productBySlug, products } from "@/data/catalog";
import { categoryById } from "@/data/categories";
import { labelById } from "@/data/labels";
import { categoryTrail } from "@/data/queries";
import { PdpSkeleton } from "./skeleton";
import { EditBand, MoreFromLabel, SimilarGrid } from "./sections";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = productBySlug[slug];
  if (!p) return {};
  return { title: `${p.name} — ${labelById[p.labelId].name}`, description: p.description, openGraph: { images: [`/img/${p.variants[0].images[0]}.webp`] } };
}

export default function ProductPage(props: PageProps<"/p/[slug]">) {
  return (
    <Suspense fallback={<PdpSkeleton />}>
      <ProductContent params={props.params} />
    </Suspense>
  );
}

/**
 * Product page on the 12-column grid (docs/GRID_SYSTEM.md):
 * gallery 8 + sticky buy box 4 → complete the look (6 / 6) → reviews (4 / 8) → more from the label (4-up carousel) →
 * the edit (4 + 4 + 4) → similar pieces (mixed-size grid) → recently viewed. Each section takes a different composition.
 */
async function ProductContent({ params }: Pick<PageProps<"/p/[slug]">, "params">) {
  const { slug } = await params;
  const product = productBySlug[slug];
  if (!product) notFound();
  const crumbs = [{ name: "Home", href: "/" }, ...categoryTrail(product.categoryPath).map((c) => ({ name: categoryById[c.id]?.name ?? c.name, href: c.href })), { name: product.name }];
  return (
    <>
      <div className="container-x pb-5 pt-5 sm:pb-8 sm:pt-6">
        <Breadcrumbs items={crumbs} />
      </div>
      <ProductDetail product={product} />
      <CompleteTheLook product={product} />
      <Reviews product={product} />
      <MoreFromLabel product={product} />
      <EditBand product={product} />
      <SimilarGrid product={product} />
      <RecentlyViewed excludeId={product.id} />
    </>
  );
}
