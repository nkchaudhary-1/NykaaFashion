import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { BentoTile } from "@/components/ui/BentoTile";
import { SIZES } from "@/components/ui/Img";
import { primaryEdits } from "@/data/edits";

const SHORTCUTS = [
  { href: "/discover", label: "The Style Files" },
  { href: "/edits/new-in", label: "New in" },
  { href: "/offers", label: "Offers" },
  { href: "/help", label: "Help centre" },
];

/**
 * The page body of "not found" and "something went wrong": the message (`copy`) in columns 1–6 beside a bento of popular edits
 * (one 6-column tile over two rows, two 3-column tiles under the message), then a mirrored row — a search panel in columns 1–6 and a 2×2 of
 * shortcut links. Static markup (no hooks, no handlers) so it renders from a server page or an error boundary alike.
 */
export function LostBento({ copy }: { copy: ReactNode }) {
  const [big, a, b] = primaryEdits;
  const tile = (e: typeof big, sizes: string, size?: "lg") => <BentoTile href={`/edits/${e.id}`} imgKey={`scenes/edit-${e.id}-tall`} title={e.title} meta={e.blurb} sizes={sizes} size={size} ratio={size ? "fill" : "4/5"} position="50% 35%" />;
  return (
    <div className="container-x pb-4 pt-10 sm:pt-16">
      <Grid className="gap-y-[var(--gap)]">
        <Col span={{ base: 4, sm: 12, lg: 6 }} rowStart={{ lg: 1 }} className="flex flex-col justify-center pb-6 sm:pb-10 lg:pb-12 lg:pr-[var(--gap)]">
          {copy}
        </Col>
        <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 7 }} rowStart={{ lg: 1 }} rows={{ lg: 2 }} className="relative aspect-[5/4] sm:aspect-[16/9] lg:aspect-auto">
          {tile(big, SIZES.half, "lg")}
        </Col>
        <Col span={{ base: 2, sm: 6, lg: 3 }} rowStart={{ lg: 2 }}>
          {tile(a, SIZES.tile)}
        </Col>
        <Col span={{ base: 2, sm: 6, lg: 3 }} start={{ lg: 4 }} rowStart={{ lg: 2 }}>
          {tile(b, SIZES.tile)}
        </Col>
      </Grid>

      <Grid className="mt-[var(--gap)] gap-y-[var(--gap)]">
        <Col span={{ base: 4, sm: 12, lg: 6 }} rowStart={{ lg: 1 }} rows={{ lg: 2 }}>
          <div className="on-dark flex h-full flex-col justify-between gap-8 bg-ink p-6 text-bone sm:p-8">
            <p className="max-w-[40ch] text-[15px] leading-relaxed">
              Looking for something specific? Press{" "}
              <kbd className="mx-0.5 inline-flex h-6 min-w-6 items-center justify-center border border-bone px-1.5 text-[12px] font-medium">/</kbd> to search, or visit the{" "}
              <Link href="/help" className="underline underline-offset-4">
                help centre
              </Link>
              .
            </p>
            <form role="search" action="/search" method="get" className="flex">
              <label htmlFor="lost-q" className="sr-only">
                Search labels, edits, styles
              </label>
              <input id="lost-q" name="q" type="search" autoComplete="off" placeholder="Search labels, edits, styles" className="h-12 min-w-0 flex-1 border border-bone bg-transparent px-4 text-[15px] text-bone placeholder:text-bone/70" />
              <button type="submit" aria-label="Search" className="inline-flex size-12 shrink-0 items-center justify-center border border-l-0 border-bone bg-bone text-ink transition-colors hover:bg-white">
                <Search size={18} strokeWidth={1.8} aria-hidden />
              </button>
            </form>
          </div>
        </Col>
        {SHORTCUTS.map((s, i) => (
          <Col key={s.href} span={{ base: 2, sm: 6, lg: 3 }} start={{ lg: i % 2 ? 10 : 7 }} rowStart={{ lg: i < 2 ? 1 : 2 }}>
            <Link href={s.href} className="group flex h-full min-h-16 items-center justify-between gap-3 border border-ink px-4 text-[14px] font-medium transition-colors hover:bg-ink hover:text-bone">
              {s.label}
              <ArrowRight size={16} aria-hidden className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Col>
        ))}
      </Grid>
    </div>
  );
}
