import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BrandClient } from "@/components/launch/BrandClient";
import { LaunchSkeleton } from "@/components/launch/LaunchSkeleton";
import { ist, plainHeadline } from "@/components/launch/time";
import { launchAtMs, launchById, launches } from "@/data/launches";

export function generateStaticParams() {
  return launches.map((l) => ({ slug: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/new-and-next/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const l = launchById[slug];
  if (!l) return {};
  const d = ist(launchAtMs(l));
  return { title: `${l.brand.name} — ${d.day} ${d.month} launch`, description: `${plainHeadline(l.headline)} ${l.dek}` };
}

export default function LaunchPage(props: PageProps<"/new-and-next/[slug]">) {
  return (
    <Suspense fallback={<LaunchSkeleton />}>
      <LaunchContent params={props.params} />
    </Suspense>
  );
}

async function LaunchContent({ params }: Pick<PageProps<"/new-and-next/[slug]">, "params">) {
  const { slug } = await params;
  if (!launchById[slug]) notFound();
  return <BrandClient id={slug} />;
}
