# Full-bleed home layout (experiment — on staging)

**Asked for by the owner, 31 Oct 2026:** "a layout where the image is filled — no padding and no spacing between the images — on the home page", as one more layout next to the current one, built on staging and *not* merged into the current design. Nothing here is on the live site.

## What it is

The home page has two layouts. Everything else (header, footer, listings, product pages …) is identical in both.

| | Classic (as approved) | Full-bleed |
|---|---|---|
| Page margin | `--gutter` (16–48 px) | none — pictures run from the left edge of the screen to the right |
| Gap between pictures | `--gap` (16–24 px) | none — tiles touch |
| Text | under each picture, on the page | on a solid white **strip** at the foot of the tile, or the tile is a flat colour |
| Modules | the full stack, incl. Shop the look, Style Files, brand spotlight | walls of tiles; the editorial modules arrive as story / edit tiles inside the endless feed |
| Default | production | staging (until the owner chooses) |

**Switching:** the yellow staging bar (staging only), *Prototype controls → Home layout* (any build), or `?layout=bleed` / `?layout=classic` on the address (remembered for the browser). "Reset all data" returns to the build's default.

## The grid contract

Still the page grid — **4 columns on phones, 12 from 600 px** — with a zero gap. The wall's own box is a CSS container, and its row unit is **1.25 column units** (`grid-auto-rows: calc(100cqw / 12 * 1.25)`), so a tile that spans *c* columns and *c* rows is exactly **4:5**.

| Cell | Class | Phone (4-col) | 600–1023 | 1024–1279 | ≥ 1280 | Shape |
|---|---|---|---|---|---|---|
| base | `bleed-b` | 2×2 (2 across) | 4×4 (3 across) | 3×3 (4 across) | 2×2 (6 across) | 4:5 |
| feature | `bleed-f` | 4×4 | 8×8 | 6×6 | 4×4 | 4:5, four base cells |
| quad | `bleed-q` | 2×2 | 3×3 | 3×3 | 3×3 | 4:5, four across (pictures) |
| flat | `bleed-s` | 2×1 | 3×2 | 3×2 | 3×2 | 1.6:1 phone, 6:5 else (flat colour tiles need less height) |
| banner | `bleed-w` | 4×3 | 12×6 | 12×5 | 12×5 | across the whole wall |

**Block rule:** fill a wall in blocks of twelve base cells (a feature counts as four: *feature + 8* or *12 base*) — or in multiples of four quad / flat tiles — and it is a complete rectangle at every width, with no holes. `scripts/qa/bleed.cjs` measures this: every wall's tiles must cover 100 % of their bounding box with no overlap, at 1440, 1100, 820 and 390 px.

## Rules that still hold

Flat colour only (no gradient, shadow or blur: text goes on a solid strip, never straight on a picture) · Inter Display only · the live Nykaa palette · every control reachable by keyboard (the heart is a sibling of the link, never inside it) · text contrast ≥ 4.5:1 on strips and flat tiles (brand colours that fail fall back to ink on bone, `src/components/bleed/tone.ts`).

## Files

`src/components/bleed/Wall.tsx` (grid + tile primitives) · `Modules.tsx` (categories, price, occasions, brands, Diwali, new in, edits, trending, trail) · `ProductTile.tsx` · `src/lib/layout.ts` (the choice) · `src/lib/home.ts` (`composeHome(mode, layout)`) · wall CSS in `globals.css` · `src/components/feed/ExploreFeed.tsx` draws the feed as a wall in this layout.

## Trade-offs and open decisions (for the owner)

* **It is only as good as the photography.** Edge-to-edge tiles make repetition obvious: with two source photographs every wall shows the same two people in different crops. Flat colour tiles (price, brands, Diwali, computed edits) break it up for now; a real image set is what makes this layout work. *Not fetching any images until the owner supplies a set.*
* **Density vs calm.** The classic page breathes; this one is a dense, visual wall (how the large Indian apps present). It trades some of the premium whitespace for pictures per screen. Worth testing on a real phone before choosing.
* **Which layout is the default when this goes live** — classic, bleed, or bleed on phones only — is a one-line change (`DEFAULT_LAYOUT` in `src/lib/layout.ts`) once the owner decides.
* **Header and footer keep the page margins** (only the home page's pictures bleed). A full-bleed header is a separate decision.
