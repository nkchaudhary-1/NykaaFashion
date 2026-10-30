import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Suspense } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { SimulatedNotice } from "@/components/ui/Simulated";
import { Skeleton } from "@/components/ui/Skeleton";
import { INFO_PAGES } from "@/data/content";
import { InfoNav, sectionId } from "../_components/InfoNav";

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
    <Suspense
      fallback={
        <div role="status" aria-label="Loading" className="container-x pb-16 pt-8">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-10 h-14 w-[min(480px,80%)]" />
          <Grid className="mt-14 gap-y-8">
            <Col span={{ base: 4, sm: 12, lg: 3 }}>
              <Skeleton className="h-40 w-full" />
            </Col>
            <Col span={{ base: 4, sm: 12, lg: 9 }}>
              <Skeleton className="h-48 w-full" />
            </Col>
          </Grid>
          <span className="sr-only">Loading…</span>
        </div>
      }
    >
      <Content params={props.params} />
    </Suspense>
  );
}

/** Where to go next: the pages around this one, never the page you are on. */
const MORE = [
  { href: "/help", label: "Help centre" },
  { href: "/info/shipping", label: "Shipping & delivery" },
  { href: "/info/returns", label: "Returns & refunds" },
  { href: "/account/orders", label: "Track an order" },
  { href: "/info/contact", label: "Contact us" },
];

async function Content({ params }: Pick<PageProps<"/info/[slug]">, "params">) {
  const { slug } = await params;
  const page = INFO_PAGES[slug];
  if (!page) notFound();
  const sections = page.sections.map((s) => ({ ...s, id: sectionId(s.h) }));
  const more = MORE.filter((m) => m.href !== `/info/${slug}`).slice(0, 3);
  return (
    <>
      <PageHeader crumbs={[{ name: "Home", href: "/" }, { name: page.title }]} title={page.title} intro={page.intro} size="lg" />
      <div className="container-x pb-4 sm:pb-8">
        <Grid className="gap-y-10">
          {/* 3 / 9: the rail (sticky on desktop) | the content */}
          <Col span={{ base: 4, sm: 12, lg: 3 }} rowStart={{ lg: 1 }} className="lg:sticky lg:top-[calc(var(--header-offset)+24px)] lg:self-start">
            <InfoNav current={slug} sections={sections.map(({ id, h }) => ({ id, h }))} />
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 9 }} start={{ lg: 4 }} rowStart={{ lg: 1 }}>
            <SimulatedNotice className="max-w-[62ch]">Prototype content — illustrative only.</SimulatedNotice>
            <div className="mt-8 border-b border-line">
              {sections.map((s) => (
                <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="grid grid-cols-1 gap-x-[var(--gap)] gap-y-4 border-t border-ink py-8 sm:py-10 lg:grid-cols-9">
                  <h2 id={`${s.id}-h`} className="display-sm lg:col-span-3">
                    {s.h}
                  </h2>
                  <div className="space-y-5 lg:col-span-6">
                    {s.p.map((para, i) => (
                      <p key={i} className="max-w-[62ch] text-[16px] leading-[1.7] text-ink-2">
                        {para}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <nav aria-label="More help" className="mt-12">
              <p className="eyebrow mb-4 text-ink-3">Still looking?</p>
              <ul className="grid grid-cols-1 gap-[var(--gap)] sm:grid-cols-3">
                {more.map((m) => (
                  <li key={m.href}>
                    <Link href={m.href} className="group flex h-14 items-center justify-between border border-ink px-4 text-[14px] font-medium transition-colors hover:bg-ink hover:text-bone">
                      {m.label}
                      <ArrowRight size={16} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Col>
        </Grid>
      </div>
    </>
  );
}
