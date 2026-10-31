import Link from "next/link";
import { Carousel, CarouselArrows, CarouselTrack, type CarouselDensity } from "@/components/ui/Carousel";
import { Img, SIZES, type LoadHint } from "@/components/ui/Img";

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
  { max: Infinity, density: "tile", ratio: "1/1" },
];

/** One category: a silent picture (it scales slowly inside its clipped frame) with the name and a quiet count under it — no caption strip over the picture. */
function CategoryTile({ item: s, ratio, load }: { item: RailItem; ratio: string; load?: LoadHint }) {
  return (
    <Link href={`/c/${s.id}`} className="group relative block">
      <div className="overflow-hidden bg-sand">
        <div data-nogrid className="transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.04] group-focus-visible:scale-[1.04]">
          <Img imgKey={s.imgKey} alt="" sizes={SIZES.tile} ratio={ratio} load={load} />
        </div>
      </div>
      <span className="mt-3 flex items-baseline justify-between gap-3 border-b border-line pb-3 transition-colors duration-500 group-hover:border-ink">
        <span className="min-w-0 truncate text-[15px] font-medium tracking-[-0.015em]">{s.name}</span>
        <span className="shrink-0 text-[12px] tabular-nums text-ink-3">
          {s.count}
          <span className="sr-only"> {s.count === 1 ? "product" : "products"}</span>
        </span>
      </span>
    </Link>
  );
}

export function CategoryRail({ label, eyebrow, items }: { label: string; eyebrow: string; items: RailItem[] }) {
  if (items.length < 2) return null;
  const { density, ratio } = BY_COUNT.find((b) => items.length <= b.max)!;
  return (
    <nav aria-label={label} className="container-x pb-14 sm:pb-20">
      <Carousel>
        <div className="mb-6 flex items-end justify-between gap-6">
          <h2 className="eyebrow text-ink-3">{eyebrow}</h2>
          {items.length > 6 && <CarouselArrows />}
        </div>
        <CarouselTrack label={label} density={density} cursor={items.length > 6 ? "Drag" : undefined}>
          {items.map((s, i) => (
            <CategoryTile key={s.id} item={s} ratio={ratio} load={i < 3 ? "eager" : undefined} />
          ))}
        </CarouselTrack>
      </Carousel>
    </nav>
  );
}
