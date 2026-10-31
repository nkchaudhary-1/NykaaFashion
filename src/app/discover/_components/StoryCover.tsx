import { PinLayer } from "@/components/editorial/ShoppableImage";
import { StoryActions } from "@/components/editorial/StoryActions";
import { Col, Grid } from "@/components/layout/Grid";
import { RevealText, Rise } from "@/components/motion/reveal";
import { Img } from "@/components/ui/Img";
import type { Story } from "@/data/types";
import { cn } from "@/lib/cn";
import { imgEdge, imgPins } from "@/lib/img";

/** "The Block-Print Revival" → ["The Block-Print", "Revival"]; "Diwali, Dressed Slowly" → ["Diwali,", "Dressed Slowly"] — the last part takes the raspberry accent. */
function splitTitle(title: string): [string, string] {
  const m = title.match(/^(.*?[:,])\s+(.+)$/);
  if (m) return [m[1], m[2]];
  const words = title.split(" ");
  return words.length > 2 ? [words.slice(0, -1).join(" "), words[words.length - 1]] : [title, ""];
}

// Art direction without a <picture>: only the visible cover ever downloads (a display:none copy of a lazy image stays unfetched).
// phones: the 4:5 cover, edge to edge · tablets and up: the 16:9 cover, edge to edge (about 21:9 on desktop). Pins use the same crop, so they stay on the garments.
const TALL = "block sm:hidden";
const WIDE = "hidden sm:block";

/** Where a cropped cover is anchored: the middle of its pins, so the garments (and the pins on them) stay in the frame at any crop. */
function focus(imgKey: string): string {
  const pins = imgPins(imgKey);
  if (!pins.length) return "50% 50%";
  const mid = (v: number[]) => Math.round(((Math.min(...v) + Math.max(...v)) / 2) * 100);
  return `${mid(pins.map((p) => p.x))}% ${mid(pins.map((p) => p.y))}%`;
}

/**
 * Story cover, poster-scale: the headline across the page in display type on the page's own colour, the dek and the byline beneath it on the 12 columns, and then
 * the cover — a full-bleed, shoppable picture (21:9 on desktop, 16:9 on tablets, 4:5 on phones). No text is laid over the picture, so the pins and the garments
 * keep it to themselves. The cover is the first picture on the page and is never hidden for a reveal.
 */
export function StoryCover({ story }: { story: Story }) {
  const [lead, rest] = splitTitle(story.title);
  const tallAt = focus(story.cover.tall);
  const wideAt = focus(story.cover.wide);
  const wall = imgEdge(story.cover.wide)?.wall[0];
  return (
    <header>
      <div className="container-x pb-10 pt-4 sm:pb-14 lg:pb-16">
        <Rise as="p" y={14} className="eyebrow flex items-center gap-3 text-pink-ink">
          <span aria-hidden className="h-px w-8 bg-current" />
          {story.kicker}
        </Rise>
        <RevealText as="h1" className={cn("mt-6 min-w-0", story.title.length > 28 ? "display-lg" : "display-xl")}>
          {rest ? [lead, " ", <em key="rest">{rest}</em>] : lead}
        </RevealText>
        <Grid className="mt-10 items-end gap-y-8 border-t border-line pt-6 sm:mt-14">
          <Col span={{ base: 4, sm: 12, lg: 6 }}>
            <Rise as="p" delay={120} className="lede">
              {story.dek}
            </Rise>
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 5 }} start={{ lg: 8 }} rowStart={{ lg: 1 }}>
            <Rise delay={200} className="flex flex-col gap-4 lg:items-end">
              <p className="text-[13px]">
                By <span className="font-medium">{story.author}</span> · {story.readMins} min read
              </p>
              <StoryActions storyId={story.id} title={story.title} />
            </Rise>
          </Col>
        </Grid>
      </div>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand sm:aspect-[16/9] lg:aspect-[21/9] lg:max-h-[86svh]" style={wall ? { backgroundColor: wall } : undefined}>
        <Img imgKey={story.cover.tall} alt={`${story.title} — cover`} sizes="100vw" ratio="fill" load="high" position={tallAt} className={cn("absolute inset-0 h-full", TALL)} />
        <Img imgKey={story.cover.wide} alt={`${story.title} — cover`} sizes="100vw" ratio="fill" load="high" position={wideAt} className={cn("absolute inset-0 h-full", WIDE)} />
        <PinLayer imgKey={story.cover.tall} position={tallAt} className={TALL} />
        <PinLayer imgKey={story.cover.wide} position={wideAt} className={WIDE} />
      </div>
    </header>
  );
}
