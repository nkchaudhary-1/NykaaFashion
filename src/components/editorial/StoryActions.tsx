"use client";
import { Bookmark, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { prefsStore, toast, usePrefs } from "@/stores/ui";

export function StoryActions({ storyId, title }: { storyId: string; title: string }) {
  const { savedStories } = usePrefs();
  const saved = savedStories.includes(storyId);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" aria-pressed={saved} icon={<Bookmark size={14} className={saved ? "fill-ink" : ""} />} onClick={() => { prefsStore.set((p) => ({ ...p, savedStories: saved ? p.savedStories.filter((s) => s !== storyId) : [...p.savedStories, storyId] })); toast({ title: saved ? "Removed from saved stories" : "Story saved", description: title }); }}>
        {saved ? "Saved" : "Save story"}
      </Button>
      <Button variant="ghost" size="sm" icon={<Link2 size={14} />} onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); } catch { /* ignore */ } toast({ title: "Link copied", description: title }); }}>
        Copy link
      </Button>
    </div>
  );
}
