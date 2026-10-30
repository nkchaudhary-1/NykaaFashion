import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BrandSpotlight } from "@/components/home/Modules";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PdpSkeleton } from "@/components/ui/PageSkeletons";
import { CompleteTheLook } from "@/components/product/CompleteTheLook";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductRail } from "@/components/product/Rail";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { Reviews } from "@/components/product/Reviews";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { productBySlug, products } from "@/data/catalog";
import { categoryById } from "@/data/categories";
import { labelById } from "@/data/labels";
import { categoryTrail } from "@/data/queries";
import { inSameEdit, similarTo } from "@/lib/recs";
import { editById } from "@/data/edits";

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

async function ProductContent({ params }: Pick<PageProps<"/p/[slug]">, "params">) {
  const { slug } = await params;
  const product = productBySlug[slug];
  if (!product) notFound();
  const label = labelById[product.labelId];
  const sameEdit = inSameEdit(product, 8);
  const similar = similarTo(product, 8, (x) => x.categoryPath[0] === product.categoryPath[0]);
  const crumbs = [{ name: "Home", href: "/" }, ...categoryTrail(product.categoryPath).map((c) => ({ name: categoryById[c.id]?.name ?? c.name, href: c.href })), { name: product.name }];
  return (
    <>
      <div className="container-x pb-6 pt-5 sm:pt-6">
        <Breadcrumbs items={crumbs} />
      </div>
      <ProductDetail product={product} />
      <CompleteTheLook product={product} />
      <section aria-label="About the label" className="bg-paper py-8 sm:py-12">
        <BrandSpotlight labelId={label.id} excludeId={product.id} eyebrow="The label behind it" />
      </section>
      <Reviews product={product} />
      {sameEdit && (
        <section aria-labelledby="same-edit" className="container-x pb-16 sm:pb-24">
          <SectionHeading level={2} eyebrow="Curated" title={<span id="same-edit">In the {editById[sameEdit.editId].title} edit.</span>} href={`/edits/${sameEdit.editId}`} hrefLabel="Shop the edit" />
          <div className="mt-10">
            <ProductRail products={sameEdit.items} label={`In the ${editById[sameEdit.editId].title} edit`} source="pdp-same-edit" />
          </div>
        </section>
      )}
      <section aria-labelledby="similar" className="container-x pb-16 sm:pb-24">
        <SectionHeading level={2} eyebrow="More to consider" title={<span id="similar">Similar pieces.</span>} />
        <div className="mt-10">
          <ProductRail products={similar} label="Similar pieces" source="pdp-similar" />
        </div>
      </section>
      <RecentlyViewed excludeId={product.id} />
    </>
  );
}
