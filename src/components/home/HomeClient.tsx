"use client";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import { Gem, HandHeart, Scissors } from "lucide-react";
import { useMemo } from "react";
import { primaryEdits } from "@/data/edits";
import { stories } from "@/data/stories";
import { labelById } from "@/data/labels";
import { composeHome, type HomeModuleId } from "@/lib/home";
import { topKey, useIntent } from "@/stores/intent";
import { usePrefs } from "@/stores/ui";
import { EditChips, Hero } from "./Hero";
import { ModuleShell } from "./ModuleShell";
import { BrandSpotlight, FeaturedEdits, NewInByTaste, OccasionEdit, OfferModule, PersonalizedRail, StoryStrip } from "./Modules";

function Values() {
  const items = [
    { Icon: Scissors, t: "Edited by people", d: "Every label and piece is chosen by an editor — not ranked by an ad budget." },
    { Icon: HandHeart, t: "Know the maker", d: "Hidden Gems name the village, the studio and, often, the hands behind the work." },
    { Icon: Gem, t: "Honest pricing", d: "A discount appears only where a price has genuinely moved." },
  ];
  return (
    <div className="container-x py-16 sm:py-20">
      <ul className="grid grid-cols-1 gap-10 border-t border-line pt-12 sm:grid-cols-3">
        {items.map(({ Icon, t, d }) => (
          <li key={t} className="flex gap-4">
            <Icon size={22} strokeWidth={1.3} aria-hidden className="mt-1 shrink-0" />
            <div>
              <h2 className="display-xs">{t}</h2>
              <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-ink-2">{d}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HomeClient() {
  const { intent, mode } = useIntent();
  const { failModule } = usePrefs();
  const slots = useMemo(() => composeHome(mode).filter((s) => s.id !== failModule), [mode, failModule]);

  // Returning users get a hero chosen from their strongest edit; everyone else gets the lead story.
  const topEdit = topKey(intent.weights.edit);
  const heroStory = (mode !== "cold" && stories.find((s) => s.editId === topEdit)) || stories[0];
  const topLabelId = topKey(intent.weights.label);
  const spotlight = mode !== "cold" && topLabelId && (labelById[topLabelId]?.flags.hiddenGem || labelById[topLabelId]?.flags.luxe) ? topLabelId : "ajrakh-and-ash";

  const render = (id: HomeModuleId, promoted?: boolean) => {
    switch (id) {
      case "hero":
        return (
          <>
            <Hero story={heroStory} compact={mode === "deal"} />
            <EditChips edits={primaryEdits} />
          </>
        );
      case "edits":
        return <FeaturedEdits />;
      case "rail":
        return <PersonalizedRail />;
      case "occasion":
        return <OccasionEdit />;
      case "newin":
        return <NewInByTaste personalised={mode !== "cold"} />;
      case "stories":
        return <StoryStrip lead={stories.find((s) => s.id !== heroStory.id)} />;
      case "brand":
        return <BrandSpotlight labelId={spotlight} />;
      case "offers":
        return <OfferModule promoted={!!promoted} />;
    }
  };

  return (
    <LayoutGroup>
      <AnimatePresence initial={false} mode="popLayout">
        {slots.map((s, i) => (
          <ModuleShell key={s.id} id={s.id} position={i + 1} mode={mode}>
            {render(s.id, s.promoted)}
          </ModuleShell>
        ))}
      </AnimatePresence>
      <Values />
    </LayoutGroup>
  );
}
