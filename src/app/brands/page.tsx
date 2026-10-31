import type { Metadata } from "next";
import { ListingHeader } from "@/components/plp/ListingHeader";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { LabelDirectory } from "@/components/product/LabelDirectory";
import { Carousel, CarouselArrows, CarouselTrack } from "@/components/ui/Carousel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { editById } from "@/data/edits";
import { hiddenGemLabels, luxeLabels } from "@/data/labels";
import { SIZES } from "@/components/ui/Img";
import { LabelTile } from "./_components/LabelTile";

export const metadata: Metadata = { title: "All labels", description: "Every label on Nykaa Fashion, from independent Hidden Gems to Luxe ateliers and House of Nykaa." };

/**
 * Labels: a Hidden Gems carousel (6-up tiles), a dark Luxe row (4-up), then the A–Z directory — three different rhythms
 * on one grid, from "discover" to "look it up".
 */
export default function BrandsIndex() {
  const gems = editById["hidden-gems"];
  const luxe = editById["luxe"];
  return (
    <>
      <ListingHeader crumbs={[{ name: "Home", href: "/" }, { name: "Labels" }]} eyebrow="A–Z" title={<>Labels, <em>with their stories.</em></>} intro="Independent studios, ateliers and our own House of Nykaa labels — filter by what they stand for." />

      <Section aria-labelledby="gems">
        <Carousel>
          <SectionHeading size="lg" eyebrow={gems.kicker} title={<span id="gems">{gems.title}</span>} intro={gems.blurb} href="/edits/hidden-gems" hrefLabel="The edit">
            <CarouselArrows />
          </SectionHeading>
          <div className="mt-12">
            <CarouselTrack label="Hidden Gems labels" density="tile" itemClassName="min-w-0" cursor="Drag">
              {hiddenGemLabels.map((l, i) => (
                <LabelTile key={l.id} label={l} load={i < 4 ? "eager" : undefined} />
              ))}
            </CarouselTrack>
          </div>
        </Carousel>
      </Section>

      <Section tone="luxe" y="md" aria-labelledby="luxe">
        <SectionHeading onDark size="lg" eyebrow={luxe.kicker} title={<span id="luxe">{luxe.title}</span>} intro={luxe.blurb} href="/edits/luxe" hrefLabel="The edit" />
        <Grid as="ul" className="mt-12 gap-y-12 sm:mt-16">
          {luxeLabels.map((l) => (
            <Col as="li" key={l.id} span={{ base: 2, sm: 6, lg: 3 }}>
              <LabelTile label={l} onDark sizes={SIZES.cardWide} />
            </Col>
          ))}
        </Grid>
      </Section>

      <LabelDirectory />
    </>
  );
}
