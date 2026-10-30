import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SimulatedNotice } from "@/components/ui/Simulated";
import { INFO_PAGES } from "@/data/content";
import { Skeleton } from "@/components/ui/Skeleton";

export function generateStaticParams() {
  return Object.keys(INFO_PAGES).map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: PageProps<"/info/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = INFO_PAGES[slug];
  return p ? { title: p.title, description: p.intro } : {};
}

export default function InfoPage(props: PageProps<"/info/[slug]">) {
  return (
    <Suspense fallback={<div className="container-x py-16"><Skeleton className="h-12 w-80" /><Skeleton className="mt-8 h-40 w-full max-w-2xl" /></div>}>
      <Content params={props.params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/info/[slug]">, "params">) {
  const { slug } = await params;
  const page = INFO_PAGES[slug];
  if (!page) notFound();
  return (
    <>
      <PageHeader crumbs={[{ name: "Home", href: "/" }, { name: page.title }]} title={page.title} intro={page.intro} size="lg" />
      <div className="container-x pb-20">
        <SimulatedNotice className="mb-10 max-w-2xl">Prototype content — illustrative only.</SimulatedNotice>
        <div className="prose-nf max-w-2xl">
          {page.sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p.map((para, i) => (<p key={i}>{para}</p>))}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
