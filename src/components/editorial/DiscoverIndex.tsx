"use client";
import { useMemo, useState } from "react";
import { StoryCard } from "@/components/editorial/StoryCard";
import { Col, Grid } from "@/components/layout/Grid";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/States";
import { stories } from "@/data/stories";
import type { Story } from "@/data/types";
import { cn } from "@/lib/cn";

/** Topics are groups of story tags (the tags themselves are one-per-story, too fine to filter by). A story can sit in more than one topic. */
const TOPICS: Array<{ id: string; label: string; tags: string[] }> = [
  { id: "craft", label: "Craft & makers", tags: ["handloom", "block-print", "ceramics", "textiles"] },
  { id: "occasion", label: "Occasion", tags: ["festive", "wedding", "jewellery"] },
  { id: "wardrobe", label: "Wardrobe", tags: ["capsule", "styling", "workwear", "dresses", "tailoring", "leather", "luxe"] },
  { id: "responsible", label: "Responsible", tags: ["sustainability", "organic", "responsible"] },
];
const inTopic = (s: Story, id: string) => id === "all" || (TOPICS.find((t) => t.id === id)?.tags.some((tag) => s.tags.includes(tag)) ?? false);
const FILTERS = [{ id: "all", label: "All" }, ...TOPICS.map(({ id, label }) => ({ id, label }))];

/**
 * Editorial rows. Each row has its own rhythm and no two neighbours repeat it:
 *   lead      8 + 4 — the lead story (spans two rows) beside a stack of two
 *   fiveSeven 5 + 7 (mirrored: sevenFive) — a portrait beside a landscape, covers and captions aligned on a subgrid
 *   banner    one story across all 12 columns
 *   half      6 + 6
 *   thirds    4 + 4 + 4
 */
type Kind = "lead" | "fiveSeven" | "sevenFive" | "banner" | "half" | "thirds";
interface Row {
  kind: Kind;
  stories: Story[];
}
const NEED: Record<Kind, number> = { lead: 3, fiveSeven: 2, sevenFive: 2, banner: 1, half: 2, thirds: 3 };
const CYCLE: Kind[] = ["fiveSeven", "banner", "half", "thirds", "sevenFive"];

function plan(list: Story[]): Row[] {
  const rows: Row[] = [];
  let i = 0;
  const left = () => list.length - i;
  const push = (kind: Kind) => rows.push({ kind, stories: list.slice(i, (i += NEED[kind])) });
  if (left() === 1) push("banner");
  else if (left() === 2) push("half");
  else if (left() > 0) push("lead");
  for (let c = 0; left() > 0; c++) {
    let kind = CYCLE[c % CYCLE.length];
    if (NEED[kind] > left()) {
      const prev = rows[rows.length - 1].kind;
      kind = left() === 1 ? "banner" : prev === "half" ? "fiveSeven" : "half";
    }
    push(kind);
  }
  return rows;
}

function RowView({ row, first }: { row: Row; first: boolean }) {
  const [a, b, c] = row.stories;
  const source = "discover";
  switch (row.kind) {
    case "lead":
      return (
        <Grid className="gap-y-[var(--gap)]">
          {/* the lead spans both rows of the stack beside it and fills them (its tile is absolutely sized from lg up) */}
          <Col span={{ base: 4, sm: 12, lg: 8 }} rows={{ lg: 2 }} className="relative">
            <Reveal>
              <StoryCard story={a} variant="lead" as="h2" load={first ? "preload" : undefined} source={source} />
            </Reveal>
          </Col>
          {[b, c].map((s, i) => (
            <Col key={s.id} span={{ base: 2, sm: 6, lg: 4 }} start={{ lg: 9 }} rowStart={{ lg: (i + 1) as 1 | 2 }}>
              <Reveal delay={(i + 1) * 90}>
                <StoryCard story={s} variant="stack" as="h2" source={source} />
              </Reveal>
            </Col>
          ))}
        </Grid>
      );
    case "fiveSeven":
    case "sevenFive": {
      const mirrored = row.kind === "sevenFive";
      const sub = "lg:grid lg:grid-rows-subgrid";
      // a portrait on phones, then square covers (the 7-column one a 1.4:1 landscape on desktop) so neither card towers over the other
      const card = (s: Story, v: "tall" | "feature") => <StoryCard story={s} variant={v} as="h2" source={source} box={v === "tall" ? "aspect-[4/5] sm:aspect-square" : "aspect-[4/5] sm:aspect-square lg:aspect-auto"} className="lg:row-span-2 lg:grid lg:grid-rows-subgrid" />;
      return (
        <Grid className="gap-y-12 lg:gap-y-0">
          <Col as={Reveal} span={{ base: 4, sm: 6, lg: mirrored ? 7 : 5 }} rows={{ lg: 2 }} className={sub}>
            {mirrored ? card(a, "feature") : card(a, "tall")}
          </Col>
          <Col as={Reveal} delay={90} span={{ base: 4, sm: 6, lg: mirrored ? 5 : 7 }} rows={{ lg: 2 }} className={sub}>
            {mirrored ? card(b, "tall") : card(b, "feature")}
          </Col>
        </Grid>
      );
    }
    case "banner":
      return (
        <Reveal>
          <StoryCard story={a} variant="banner" as="h2" source={source} />
        </Reveal>
      );
    case "half":
      return (
        <Grid className="gap-y-12">
          {[a, b].map((s, i) => (
            <Col key={s.id} span={{ base: 4, sm: 6, lg: 6 }}>
              <Reveal delay={i * 90}>
                <StoryCard story={s} variant="wide" as="h2" source={source} sizes="(min-width:600px) 50vw, 100vw" />
              </Reveal>
            </Col>
          ))}
        </Grid>
      );
    case "thirds":
      return (
        <Grid className="gap-y-12">
          {[a, b, c].map((s, i) => (
            <Col key={s.id} span={{ base: 4, sm: 4, lg: 4 }}>
              <Reveal delay={i * 90}>
                <StoryCard story={s} variant="tall" as="h2" source={source} />
              </Reveal>
            </Col>
          ))}
        </Grid>
      );
  }
}

export function DiscoverIndex() {
  const [topic, setTopic] = useState("all");
  const list = useMemo(() => stories.filter((s) => inTopic(s, topic)), [topic]);
  const rows = useMemo(() => plan(list), [list]);
  const count = (id: string) => stories.filter((s) => inTopic(s, id)).length;
  return (
    <>
      <div className="container-x">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-ink py-3">
          <div role="group" aria-label="Filter stories" className="scrollbar-none bleed-r -mr-[var(--gutter)] flex min-w-0 items-center gap-2 overflow-x-auto pr-[var(--gutter)] lg:mr-0 lg:overflow-visible lg:pr-0">
            <span aria-hidden className="eyebrow mr-2 shrink-0 text-ink-3">
              Topic
            </span>
            {FILTERS.map((f) => (
              <Chip key={f.id} selected={topic === f.id} onClick={() => setTopic(f.id)}>
                {f.label}
                <span className="text-[12px] tabular-nums opacity-70">{count(f.id)}</span>
              </Chip>
            ))}
          </div>
          <p role="status" className="text-[13px] tabular-nums text-ink-3">
            {list.length} {list.length === 1 ? "story" : "stories"}
          </p>
        </div>
      </div>

      <div className="pt-10 sm:pt-14">
        {rows.length === 0 ? (
          <div className="container-x">
            <EmptyState title="No stories here yet" text="We publish a new issue each season." actions={<Button onClick={() => setTopic("all")}>See all stories</Button>} />
          </div>
        ) : (
          rows.map((row, i) => (
            // a banner runs edge to edge; every other row sits in the container
            <div key={`${topic}-${i}`} className={cn(i > 0 && "mt-16 sm:mt-20 lg:mt-24", row.kind !== "banner" && "container-x")}>
              <RowView row={row} first={i === 0} />
            </div>
          ))
        )}
      </div>

      {/* The letter: a pink-tint band — copy on the left, the (simulated) sign-up form on the right, on the same bottom line */}
      <Section tone="pink-tint" className="mt-[var(--section-y)]">
        <Grid className="items-end gap-y-4">
          <Col span={{ base: 4, sm: 12, lg: 6 }}>
            <p className="eyebrow text-pink-ink">Style Files · Issue 07</p>
            <h2 className="display-md mt-4">
              One story, <em>every Sunday.</em>
            </h2>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">One long read, three pieces worth owning and no discount codes. This is a prototype: the sign-up is simulated, nothing is sent and your email stays on this device.</p>
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 5 }} start={{ lg: 8 }} rowStart={{ lg: 1 }}>
            <NewsletterForm />
          </Col>
        </Grid>
      </Section>
    </>
  );
}
