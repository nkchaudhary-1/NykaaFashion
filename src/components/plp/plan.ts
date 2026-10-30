import type { Product } from "@/data/types";
import type { Feature } from "./features";

/**
 * Where the feature inserts go in a product grid, computed so that rows stay complete at 2-up (phone), 3-up (tablet)
 * and 4-up (desktop) — nothing is ever left with a hole beside it.
 *
 * Think of the grid in "units" (one product card = one unit). A row holds 2 / 3 / 4 units. A feature is
 *  - phone    a full row (2 units), always starting a fresh row
 *  - tablet   8 columns × 2 rows = 2 units wide, 2 tall, with a card column beside it (3 per row, so 1 unit is left)
 *  - desktop  6 columns × 2 rows = 2 units wide, 2 tall, with two card columns beside it (4 per row)
 * Cards fill the cells around an explicitly placed feature, so for the feature to sit flush the area already used
 * (cards before it + the units of earlier features) must end on the left edge of a row (feature on the left)
 * or exactly two units short of the right edge (feature on the right). `place` checks that per breakpoint; a breakpoint
 * where it cannot sit flush simply skips the feature (CSS hides it there), which never leaves a hole.
 *
 * The first feature comes after FIRST cards, then one every EVERY cards. 6 + 14·j works out so that every feature sits
 * flush at all three breakpoints and on the desktop alternates right, left, right …
 */
export const FIRST = 6;
export const EVERY = 14;
/** cards that must follow a feature so the cells beside it are all filled */
const AFTER = 4;

export interface Place {
  side: "L" | "R";
  /** 1-based grid row the feature starts on */
  row: number;
}

export type Cell =
  | { type: "card"; product: Product; index: number }
  | { type: "feature"; key: string; feature: Feature; product?: Product; phone: boolean; tablet: Place | null; desktop: Place | null };

function place(area: number, perRow: number): Place | null {
  const col = area % perRow;
  if (col === 0) return { side: "L", row: Math.floor(area / perRow) + 1 };
  if (col === perRow - 2) return { side: "R", row: Math.floor(area / perRow) + 1 };
  return null;
}

/**
 * `cardLimit` is how many product cards to show; a "hero" feature takes its product from the list on top of that,
 * so `shown` (products consumed) can be a little more than the card count.
 */
export function planCells(items: Product[], features: Feature[], cardLimit: number): { cells: Cell[]; shown: number; cards: number } {
  const cells: Cell[] = [];
  let i = 0;
  let cards = 0;
  let j = 0;
  let nextAt = FIRST;
  let nPhone = 0;
  let nTablet = 0;
  let nDesktop = 0;
  while (i < items.length && cards < cardLimit) {
    if (cards === nextAt && j < features.length) {
      const feature = features[j];
      const takes = feature.kind === "hero" ? 1 : 0;
      const follow = Math.min(cardLimit - cards, items.length - i - takes);
      if (follow >= AFTER) {
        const phone = (cards + 2 * nPhone) % 2 === 0;
        const tablet = place(cards + 4 * nTablet, 3);
        const desktop = place(cards + 4 * nDesktop, 4);
        if (phone) nPhone++;
        if (tablet) nTablet++;
        if (desktop) nDesktop++;
        cells.push({ type: "feature", key: `f${j}`, feature, product: takes ? items[i] : undefined, phone, tablet, desktop });
        i += takes;
        j++;
        nextAt += EVERY;
        continue;
      }
      nextAt = Infinity; // not enough left to complete the block beside it
    }
    cells.push({ type: "card", product: items[i], index: cards });
    cards++;
    i++;
  }
  return { cells, shown: i, cards };
}
