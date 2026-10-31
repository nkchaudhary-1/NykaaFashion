"use client";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import { useMemo } from "react";
import { stories } from "@/data/stories";
import { labelById } from "@/data/labels";
import { composeHome, type HomeModuleId } from "@/lib/home";
import { topKey, useIntent } from "@/stores/intent";
import { usePrefs } from "@/stores/ui";
import { IconicBrands } from "./Brands";
import { CategoryTiles } from "./Categories";
import { CelebrationTiles } from "./Celebration";
import { DiwaliWardrobe } from "./Diwali";
import { FeaturedEdits } from "./Edits";
import { SaleHero } from "./Hero";
import { ShopTheLook } from "./Look";
import { ModuleShell } from "./ModuleShell";
import { OfferModule } from "./Offers";
import { NewInByTaste, PersonalizedRail } from "./Rails";
import { SeoBlocks, Values } from "./Seo";
import { BrandSpotlight } from "./Spotlight";
import { StoryStrip } from "./Stories";
import { CouponStrip, PriceStrip } from "./Strips";
import { TrendingGrid } from "./Trending";

/** The home page: the adaptive module stack (src/lib/home.ts decides the order), each module in a ModuleShell that logs its first view. */
export function HomeClient() {
  const { intent, mode } = useIntent();
  const { failModule } = usePrefs();
  const slots = useMemo(() => composeHome(mode).filter((s) => s.id !== failModule), [mode, failModule]);

  // Returning users get a hero chosen from their strongest edit; everyone else gets the lead story.
  const topEdit = topKey(intent.weights.edit);
  const heroStory = (mode !== "cold" && stories.find((s) => s.editId === topEdit)) || stories[0];
  // One story per slot so no scene or headline repeats down the page: hero → Style Files (3) → Shop the look.
  const others = stories.filter((s) => s.id !== heroStory.id);
  const stripStories = others.slice(0, 3);
  const lookStory = others[3] ?? others[others.length - 1];
  const topLabelId = topKey(intent.weights.label);
  const spotlight = mode !== "cold" && topLabelId && labelById[topLabelId]?.flags.houseOfNykaa ? topLabelId : "twenty-dresses";

  const render = (id: HomeModuleId, promoted?: boolean) => {
    switch (id) {
      case "hero":
        return <SaleHero />;
      case "pricestrip":
        return <PriceStrip />;
      case "coupons":
        return <CouponStrip />;
      case "categories":
        return <CategoryTiles />;
      case "celebration":
        return <CelebrationTiles />;
      case "brands":
        return <IconicBrands />;
      case "diwali":
        return <DiwaliWardrobe />;
      case "seo":
        return <SeoBlocks />;
      case "edits":
        return <FeaturedEdits />;
      case "trending":
        return <TrendingGrid />;
      case "look":
        return lookStory ? <ShopTheLook story={lookStory} /> : null;
      case "rail":
        return <PersonalizedRail />;
      case "newin":
        return <NewInByTaste personalised={mode !== "cold"} />;
      case "stories":
        return <StoryStrip list={stripStories} />;
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
