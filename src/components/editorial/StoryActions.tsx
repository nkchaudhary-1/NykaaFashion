"use client";
import { Bookmark, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { prefsStore, toast, usePrefs } from "@/stores/ui";

/** Save / copy link for a story. `onDark` swaps the outline buttons for the light-on-dark pair when the story's cover panel is a dark theme colour. */
export function StoryActions({ storyId, title, onDark }: { storyId: string; title: string; onDark?: boolean }) {
  const { savedStories } = usePrefs();
  const saved = savedStories.includes(storyId);
  const variant = onDark ? "outline-light" : "secondary";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={variant} size="sm" aria-pressed={saved} icon={<Bookmark size={14} className={saved ? "fill-current" : ""} />} onClick={() => { prefsStore.set((p) => ({ ...p, savedStories: saved ? p.savedStories.filter((s) => s !== storyId) : [...p.savedStories, storyId] })); toast({ title: saved ? "Removed from saved stories" : "Story saved", description: title }); }}>
        {saved ? "Saved" : "Save story"}
      </Button>
      <Button variant={variant} size="sm" icon={<Link2 size={14} />} onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); } catch { /* ignore */ } toast({ title: "Link copied", description: title }); }}>
        Copy link
      </Button>
    </div>
  );
}
