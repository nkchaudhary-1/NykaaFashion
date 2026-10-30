"use client";
import { useEffect } from "react";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";

/** Fires collection_open + intent signal once per mount. */
export function EditOpenTracker({ editId }: { editId: string }) {
  useEffect(() => {
    signal("edit_open", { editId });
    track("collection_open", { editId, source: "page" });
    if (editId === "the-offer-edit") signal("discount_interaction");
  }, [editId]);
  return null;
}
export function StoryOpenTracker({ storyId, editId, tags }: { storyId: string; editId?: string; tags: string[] }) {
  useEffect(() => {
    signal("story_open", { editId, tags });
    track("editorial_story_open", { storyId, source: "page" });
  }, [storyId, editId, tags]);
  return null;
}
export function OffersTracker() {
  useEffect(() => {
    signal("offers_visit");
  }, []);
  return null;
}
