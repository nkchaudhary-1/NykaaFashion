"use client";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import { CreditCard, RotateCcw, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { SERVICE_PROMISES } from "@/data/home-content";
import { stories } from "@/data/stories";
import { labelById } from "@/data/labels";
import { composeHome, type HomeModuleId } from "@/lib/home";
import { topKey, useIntent } from "@/stores/intent";
import { usePrefs } from "@/stores/ui";
import { ModuleShell } from "./ModuleShell";
import { BrandSpotlight, FeaturedEdits, NewInByTaste, OfferModule, PersonalizedRail, ShopTheLook, StoryStrip, TrendingGrid } from "./Modules";
import { CategoryTiles, CelebrationTiles, DiwaliWardrobe, IconicBrands, PriceStrip, SaleHero, SeoBlocks } from "./NykaaModules";

function Values() {
  const icons = [ShieldCheck, RotateCcw, CreditCard];
  return (
    <Section y="none" className="pt-10 sm:pt-14">
      <Grid as="ul" className="gap-y-10 border-t border-line-strong pt-10">
        {SERVICE_PROMISES.map(({ title, body }, i) => {
          const Icon = icons[i];
          return (
            <Col as="li" key={title} span={{ base: 4, sm: 4, lg: 4 }} className="flex gap-4">
              <Icon size={24} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-pink" />
              <div>
                <h2 className="display-xs">{title}</h2>
                <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-ink-2">{body}</p>
              </div>
            </Col>
          );
        })}
      </Grid>
    </Section>
  );
}

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
