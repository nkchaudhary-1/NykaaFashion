import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductListing } from "@/components/plp/ProductListing";
import { Img, SIZES } from "@/components/ui/Img";
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

async function CategoryContent({ params }: Pick<PageProps<"/c/[...slug]">, "params">) {
  const { slug } = await params;
  const id = slug.join("/");
  const cat = categoryById[id];
  if (!cat) notFound();
  const pool = productsInCategory(id);
  const subs = childrenOf(id);
  const title = cat.name;
  return (
    <>
      <PageHeader crumbs={[{ name: "Home", href: "/" }, ...categoryTrail(slug).map((c, i, a) => ({ name: c.name, href: i < a.length - 1 ? c.href : undefined }))]} eyebrow={slug.length > 1 ? categoryById[slug[0]].name : "Shop"} title={title} intro={cat.blurb} />
      {subs.length > 0 && (
        <nav aria-label={`${cat.name} categories`} className="container-x pb-12">
          <ul className="scrollbar-none -mx-[var(--gutter)] flex gap-3 overflow-x-auto px-[var(--gutter)] pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5 xl:grid-cols-9 sm:mx-0 sm:px-0">
            {subs.map((s) => {
              const rep = productsInCategory(s.id).find((p) => !p.soldOut) ?? productsInCategory(s.id)[0];
              return (
                <li key={s.id} className="w-[34vw] shrink-0 sm:w-auto">
                  <Link href={`/c/${s.id}`} className="group block">
                    <div className="overflow-hidden">
                      <Img imgKey={rep.variants[0].images[0]} alt="" sizes={SIZES.thumb} ratio="1/1" className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.05]" />
                    </div>
                    <p className="mt-2.5 text-[13.5px] font-medium">{s.name}</p>
                    <p className="text-[12px] tabular-nums text-ink-3">{productsInCategory(s.id).length} pieces</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
      <Suspense fallback={<div className="container-x"><GridSkeleton count={8} /></div>}>
        <ProductListing pool={pool} scopeKey={`cat:${id}`} categoryScope={slug} source={`cat:${id}`} />
      </Suspense>
    </>
  );
}
