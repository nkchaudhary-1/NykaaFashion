"use client";
import { useMemo, useState } from "react";
import { StoryCard } from "@/components/editorial/StoryCard";
import { Tabs } from "@/components/ui/Tabs";
import { THEMES } from "@/data/edits";
import { stories } from "@/data/stories";
import type { Story } from "@/data/types";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";

const themeName = (s: Story) => (s.theme === "sand" ? "Home" : THEMES[s.theme].label);
const FILTERS = ["All", ...Array.from(new Set(stories.map(themeName)))];

export function DiscoverIndex() {
  const [f, setF] = useState("All");
  const list = useMemo(() => stories.filter((s) => f === "All" || themeName(s) === f), [f]);
  const [lead, ...rest] = list;
  return (
    <div className="container-x pb-12">
      <Tabs items={FILTERS.map((n) => ({ id: n, label: n, count: n === "All" ? stories.length : stories.filter((s) => themeName(s) === n).length }))} value={f} onChange={setF} label="Filter stories" variant="pill" className="mb-12 pb-1" />
      {!lead ? (
        <EmptyState title="No stories here yet" text="We publish a new issue each season." actions={<Button onClick={() => setF("All")}>See all stories</Button>} />
      ) : (
        <>
          <Reveal><StoryCard story={lead} variant="wide" priority source="discover" sizes="(min-width:1024px) 70vw, 100vw" className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-end [&>div:last-child]:pt-0" /></Reveal>
          {rest.length > 0 && (
            <ul className="mt-20 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((s, i) => (
                <li key={s.id}><Reveal delay={(i % 3) * 90}><StoryCard story={s} source="discover" /></Reveal></li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
