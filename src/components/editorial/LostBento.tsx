import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Rise } from "@/components/motion/reveal";
import { primaryEdits } from "@/data/edits";
import { EditTile } from "./EditTile";

const SHORTCUTS = [
  { href: "/discover", label: "The Style Files" },
  { href: "/edits/new-in", label: "New in" },
  { href: "/offers", label: "Offers" },
  { href: "/help", label: "Help centre" },
];

/**
 * The page body of "not found" and "something went wrong": an optional giant `figure` (the 404), the message (`copy`) in columns 1–6 beside two edit tiles
 * (7–9 and 10–12), then a mirrored row — a search panel in columns 1–6 and a 2×2 of shortcut links. Static markup apart from the edit tiles (no hooks, no
 * handlers of its own) so it renders from a server page or an error boundary alike.
 */
export function LostBento({ copy, figure }: { copy: ReactNode; figure?: ReactNode }) {
  const [a, b] = primaryEdits;
  return (
    <div className="container-x pb-4 pt-10 sm:pt-16">
      {figure && (
        <Rise y={40} className="mb-10 sm:mb-14">
          {figure}
        </Rise>
      )}
      <Grid className="gap-y-12">
        <Col span={{ base: 4, sm: 12, lg: 6 }} className="flex flex-col justify-center lg:pr-[var(--gap)]">
          {copy}
        </Col>
        {[a, b].map((e, i) => (
          <Col key={e.id} span={{ base: 2, sm: 6, lg: 3 }} start={{ lg: i === 0 ? 7 : 10 }} rowStart={{ lg: 1 }}>
            <EditTile edit={e} source="lost" ratio="4/5" sizes="(min-width:1024px) 25vw, 50vw" />
          </Col>
        ))}
      </Grid>

      <Grid className="mt-[var(--section-y)] gap-y-[var(--gap)]">
        <Col span={{ base: 4, sm: 12, lg: 6 }} rowStart={{ lg: 1 }} rows={{ lg: 2 }}>
          <div className="on-dark flex h-full flex-col justify-between gap-10 bg-ink p-6 text-bone sm:p-10">
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
            <Link href={s.href} className="group flex h-full min-h-20 items-center justify-between gap-3 border border-ink px-4 text-[15px] font-medium transition-colors duration-300 hover:bg-ink hover:text-bone sm:px-5">
              {s.label}
              <ArrowRight size={16} aria-hidden className="shrink-0 transition-transform duration-500 ease-expo group-hover:translate-x-1" />
            </Link>
          </Col>
        ))}
      </Grid>
    </div>
  );
}
