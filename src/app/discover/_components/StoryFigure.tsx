import { LookList, ShoppableImage } from "@/components/editorial/ShoppableImage";
import { Col, Grid } from "@/components/layout/Grid";
import { RevealMedia } from "@/components/motion/reveal";

/**
 * A shoppable scene set on the story's 12 columns. Each layout is a different rhythm for the same content (the image, its caption and the
 * products pinned in it), so a story never repeats itself:
 *   full    the image across all 12 columns, caption and a 3-up product strip under it
 *   side    8 + 4 — image in columns 1–8, a product list beside it in 9–12 (`side-r` mirrors it)
 *   pair    6 + 6 — image in columns 1–6, a flat soft-grey panel of products beside it in 7–12
 * Phones: the image runs edge to edge, then the caption, then the products.
 */
export type FigureLayout = "full" | "side" | "side-r" | "pair";

const BLEED = "-mx-[var(--gutter)] sm:mx-0";

export function StoryFigure({ imgKey, caption, layout, n }: { imgKey: string; caption: string; layout: FigureLayout; n: number }) {
  const label = `Shop: ${caption}`;
  const num = String(n).padStart(2, "0");
  const cap = (
    <>
      <span className="eyebrow block text-ink-3">Look {num}</span>
      <span className="mt-2 block max-w-[52ch] text-[14px] leading-relaxed text-ink-2">{caption}</span>
    </>
  );
  const sizes = { full: "(min-width:1600px) 1504px, 100vw", side: "(min-width:1024px) 66vw, 100vw", pair: "(min-width:1024px) 50vw, 100vw" }[layout === "side-r" ? "side" : layout];
  // the scenes are 3:2; across the full width they are cropped to 16:9 (the pins follow the crop)
  const image = (
    <RevealMedia>
      <ShoppableImage imgKey={imgKey} alt={caption} sizes={sizes} ratio={layout === "full" ? "16/9" : "3/2"} />
    </RevealMedia>
  );

  if (layout === "full") {
    return (
      <Grid as="figure" className="gap-y-5">
        <Col span={{ base: 4, sm: 12 }} className={BLEED}>
          {image}
        </Col>
        <Col as="figcaption" span={{ base: 4, sm: 12, lg: 3 }} rowStart={{ lg: 2 }}>
          {cap}
        </Col>
        <Col span={{ base: 4, sm: 12, lg: 9 }} start={{ lg: 4 }} rowStart={{ lg: 2 }}>
          <LookList imgKey={imgKey} title="In this image" label={label} layout="strip" />
        </Col>
      </Grid>
    );
  }

  if (layout === "pair") {
    return (
      <Grid as="figure" className="gap-y-5">
        <Col span={{ base: 4, sm: 12, lg: 6 }} rowStart={{ lg: 1 }} className={BLEED}>
          {image}
        </Col>
        <Col as="figcaption" span={{ base: 4, sm: 12, lg: 6 }} rowStart={{ lg: 2 }}>
          {cap}
        </Col>
        <Col span={{ base: 4, sm: 12, lg: 6 }} start={{ lg: 7 }} rowStart={{ lg: 1 }} className="bg-sand px-5 pb-2 pt-5 sm:px-8 sm:pt-8 lg:self-stretch">
          <LookList imgKey={imgKey} title="In this image" label={label} layout="stack" />
        </Col>
      </Grid>
    );
  }

  const mirrored = layout === "side-r";
  return (
    <Grid as="figure" className="gap-y-5">
      <Col span={{ base: 4, sm: 12, lg: 8 }} start={{ lg: mirrored ? 5 : 1 }} rowStart={{ lg: 1 }} className={BLEED}>
        {image}
      </Col>
      <Col as="figcaption" span={{ base: 4, sm: 12, lg: 8 }} start={{ lg: mirrored ? 5 : 1 }} rowStart={{ lg: 2 }}>
        {cap}
      </Col>
      <Col span={{ base: 4, sm: 12, lg: 4 }} start={{ lg: mirrored ? 1 : 9 }} rowStart={{ lg: 1 }} rows={{ lg: 2 }}>
        <LookList imgKey={imgKey} title="In this image" label={label} layout="stack" />
      </Col>
    </Grid>
  );
}
