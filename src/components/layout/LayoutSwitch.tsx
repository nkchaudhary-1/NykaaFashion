"use client";
import { HOME_LAYOUTS, useHomeLayout, type HomeLayout } from "@/lib/layout";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { setPrefs } from "@/stores/ui";

/** The two home layouts as a two-way switch (a radio group). Used by the staging bar and the Prototype panel; the choice is remembered for this browser. */
export function LayoutSwitch({ size = "sm", className }: { size?: "sm" | "md"; className?: string }) {
  const layout = useHomeLayout();
  const choose = (id: HomeLayout) => {
    if (id === layout) return;
    setPrefs({ homeLayout: id });
    track("home_layout_change", { layout: id, via: "switch" });
  };
  return (
    <div role="radiogroup" aria-label="Home page layout" className={cn("inline-flex border border-ink", className)}>
      {HOME_LAYOUTS.map((l) => (
        <button
          key={l.id}
          type="button"
          role="radio"
          aria-checked={layout === l.id}
          onClick={() => choose(l.id)}
          className={cn("inline-flex items-center justify-center whitespace-nowrap px-3 font-medium transition-colors duration-200", size === "sm" ? "h-7 text-[11.5px]" : "h-11 flex-1 text-[12.5px]", layout === l.id ? "bg-ink text-bone" : "bg-transparent text-ink hover:bg-ink/10")}
        >
          {l.name}
        </button>
      ))}
    </div>
  );
}
