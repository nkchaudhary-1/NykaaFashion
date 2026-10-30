import { BentoTile } from "@/components/ui/BentoTile";
import { Carousel, CarouselArrows, CarouselTrack, type CarouselDensity } from "@/components/ui/Carousel";
import { SIZES } from "@/components/ui/Img";

export interface RailItem {
  id: string;
  name: string;
  count: number;
  /** image key of a real product from the category */
  imgKey: string;
}

/**
 * Visual sub-category rail: one tile per category, each showing a real product from it. The density follows the number of tiles,
 * so a short rail still fills the 12 columns (2 → 6 columns each, 3 → 4, 4 → 3, 5+ → 2) and only a long one scrolls.
 */
const BY_COUNT: Array<{ max: number; density: CarouselDensity; ratio: string }> = [
  { max: 2, density: "feature", ratio: "3/2" },
  { max: 3, density: "wide", ratio: "4/3" },
  { max: 4, density: "product", ratio: "1/1" },
  { max: Infinity, density: "tile", ratio: "4/5" },
];

export function CategoryRail({ label, eyebrow, items }: { label: string; eyebrow: string; items: RailItem[] }) {
  if (items.length < 2) return null;
  const { density, ratio } = BY_COUNT.find((b) => items.length <= b.max)!;
  return (
    <nav aria-label={label} className="container-x pb-10 sm:pb-12">
      <Carousel>
        <div className="mb-5 flex items-end justify-between gap-6">
          <p className="eyebrow text-ink-3">{eyebrow}</p>
          {items.length > 6 && <CarouselArrows />}
        </div>
        <CarouselTrack label={label} density={density}>
          {items.map((s, i) => (
            <BentoTile key={s.id} href={`/c/${s.id}`} imgKey={s.imgKey} title={s.name} meta={`${s.count} ${s.count === 1 ? "piece" : "pieces"}`} ratio={ratio} sizes={SIZES.tile} load={i < 3 ? "eager" : undefined} />
          ))}
        </CarouselTrack>
      </Carousel>
    </nav>
  );
}
