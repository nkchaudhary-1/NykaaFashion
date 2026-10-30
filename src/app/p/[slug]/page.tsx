import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductDetail } from "@/components/product/ProductDetail";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { productBySlug, products } from "@/data/catalog";
import { categoryById } from "@/data/categories";
import { labelById } from "@/data/labels";
import { categoryTrail } from "@/data/queries";
import { PdpSkeleton } from "./skeleton";
import { CustomersAlsoViewed, MoreFromCategory, MoreFromLabel, SimilarProducts } from "./sections";

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
 * Product page on the 12-column grid (docs/GRID_SYSTEM.md), in the live page's order: breadcrumb → picture rail + picture (1 + 5 columns, sticky)
 * beside the information column (6 columns) → Similar Products (4-up rail) → Customers Also Viewed (grey band of collage cards) →
 * More From {brand} (4-up rail) → More From {category} (6-up rail) → recently viewed.
 */
async function ProductContent({ params }: Pick<PageProps<"/p/[slug]">, "params">) {
  const { slug } = await params;
  const product = productBySlug[slug];
  if (!product) notFound();
  const crumbs = [{ name: "Home", href: "/" }, ...categoryTrail(product.categoryPath).map((c) => ({ name: categoryById[c.id]?.name ?? c.name, href: c.href })), { name: labelById[product.labelId].name }];
  return (
    <>
      <div className="container-x pb-5 pt-5 sm:pb-6 sm:pt-6">
        <Breadcrumbs items={crumbs} />
      </div>
      <ProductDetail product={product} />
      <SimilarProducts product={product} />
      <CustomersAlsoViewed product={product} />
      <MoreFromLabel product={product} />
      <MoreFromCategory product={product} />
      <RecentlyViewed excludeId={product.id} />
    </>
  );
}
