import { PinLayer } from "@/components/editorial/ShoppableImage";
import { StoryActions } from "@/components/editorial/StoryActions";
import { Col, Grid } from "@/components/layout/Grid";
import { Img } from "@/components/ui/Img";
import type { Story } from "@/data/types";
import { cn } from "@/lib/cn";
import { imgPins } from "@/lib/img";

/** "The Block-Print Revival" → ["The Block-Print", "Revival"]; "Diwali, Dressed Slowly" → ["Diwali,", "Dressed Slowly"] — the first part is set heavy, the rest light. */
function splitTitle(title: string): [string, string] {
  const m = title.match(/^(.*?[:,])\s+(.+)$/);
  if (m) return [m[1], m[2]];
  const words = title.split(" ");
  return words.length > 2 ? [words.slice(0, -1).join(" "), words[words.length - 1]] : [title, ""];
}

// Art direction without a <picture>: only the visible cover ever downloads (a display:none copy of a lazy image stays unfetched).
// phones: the 4:5 cover, edge to edge · tablets: the 16:9 cover, edge to edge · desktop: the 4:5 cover cropped into the 6-column panel,
// and from 1536px the 16:9 one with its subject (the right half of the scene) kept in view. Pins use the same crop, so they stay on the garments.
/** The cover panel is a flat token surface (not the story's edit colours): pink tint for most, soft grey for the quieter edits, the navy ink for Luxe. */
const PANEL: Record<Story["theme"], { cls: string; dark: boolean }> = {
  gem: { cls: "bg-pink-tint text-ink", dark: false },
  festive: { cls: "bg-pink-tint text-ink", dark: false },
  hon: { cls: "bg-pink-tint text-ink", dark: false },
  resp: { cls: "bg-sand text-ink", dark: false },
  sand: { cls: "bg-sand text-ink", dark: false },
  luxe: { cls: "bg-ink text-bone", dark: true },
  ink: { cls: "bg-ink text-bone", dark: true },
};

const TALL = "block sm:hidden lg:block 2xl:hidden";
const WIDE = "hidden sm:block lg:hidden 2xl:block";

/** Where a cropped cover is anchored: the middle of its pins, so the garments (and the pins on them) stay in the panel at any panel shape. */
function focus(imgKey: string): string {
  const pins = imgPins(imgKey);
  if (!pins.length) return "50% 50%";
  const mid = (v: number[]) => Math.round(((Math.min(...v) + Math.max(...v)) / 2) * 100);
  return `${mid(pins.map((p) => p.x))}% ${mid(pins.map((p) => p.y))}%`;
}

/**
 * Story cover, built like the festive banner on the home page: a flat theme-colour panel with the headline in columns 1–6 and the
 * image bleeding off the right edge from column 7. Phones and tablets: the image edge to edge, the copy panel under it.
 */
export function StoryCover({ story }: { story: Story }) {
  const { cls, dark } = PANEL[story.theme];
  const [lead, rest] = splitTitle(story.title);
  const tallAt = focus(story.cover.tall);
  const wideAt = focus(story.cover.wide);
  return (
    <header className={cn(cls, dark && "on-dark")}>
      <div className="container-x">
        <Grid>
          <Col span={{ base: 4, sm: 12, lg: 6 }} className="order-2 flex flex-col justify-center py-10 sm:py-12 lg:order-1 lg:py-20 lg:pr-[var(--gap)]">
            <p className={cn("eyebrow flex items-center gap-3", dark ? "text-pink-soft" : "text-pink-ink")}>
              <span aria-hidden className="h-px w-8 bg-current" />
              {story.kicker}
            </p>
            <h1 className={cn("mt-6", story.title.length > 28 ? "display-md" : "display-lg", dark && "[&_em]:text-pink-soft")}>
              {lead}
              {rest && (
                <>
                  {" "}
                  <em>{rest}</em>
                </>
              )}
            </h1>
            <p className="mt-6 max-w-[44ch] text-[16px] leading-relaxed sm:text-[17px]">{story.dek}</p>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-current/25 pt-5">
              <p className="text-[13px]">
                By <span className="font-medium">{story.author}</span> · {story.readMins} min read
              </p>
              <StoryActions storyId={story.id} title={story.title} onDark={dark} />
            </div>
          </Col>
          {/* starts on the centre axis (column 7) and bleeds off the right edge; below 1024px it runs edge to edge and sits above the copy */}
          <Col span={{ base: 4, sm: 12, lg: 6 }} className="relative order-1 -mx-[var(--gutter)] aspect-[4/5] sm:aspect-video lg:order-2 lg:mx-0 lg:-mr-[var(--edge)] lg:aspect-auto lg:min-h-[520px]">
            <Img imgKey={story.cover.tall} alt={`${story.title} — cover`} sizes="(min-width:1024px) 52vw, 100vw" ratio="fill" load="high" position={tallAt} className={cn("absolute inset-0 h-full", TALL)} />
            <Img imgKey={story.cover.wide} alt={`${story.title} — cover`} sizes="(min-width:1536px) 52vw, 100vw" ratio="fill" load="high" position={wideAt} className={cn("absolute inset-0 h-full", WIDE)} />
            <PinLayer imgKey={story.cover.tall} position={tallAt} className={TALL} />
            <PinLayer imgKey={story.cover.wide} position={wideAt} className={WIDE} />
          </Col>
        </Grid>
      </div>
    </header>
  );
}
