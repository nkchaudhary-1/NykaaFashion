# Nykaa Fashion — grid & layout system

One grid, used everywhere. Every image, card, banner and text block lines up on it, and every page picks a *composition* for its
content instead of repeating one pattern. This file is the contract; `scripts/qa/grid.cjs` enforces the alignment part on the
rendered DOM and `scripts/qa/flat.cjs` enforces the visual rules.

## 1. Rules of the look

| Rule | What it means in code |
| --- | --- |
| **One typeface — Inter Display** | `next/font` Inter with the `opsz` axis; `body { font-variation-settings: "opsz" 32 }` selects the Display optical size. `--font-sans/-display/-mono` all point at it. Headings are weight 500, emphasis (`<em>`) is weight 300 — never italic, never a second family. No `font-mono`, `font-serif`, `font-display` utilities in components. |
| **No shadows, anywhere** | No `shadow-*`, `ring-*`, `drop-shadow`, `text-shadow`, `backdrop-blur`, `filter`. Focus is a 2px outline. Overlays are separated by a 1px ink line + a flat `bg-ink/50` scrim. Tailwind's `ring` is a box-shadow — do not use it. |
| **Flat colour** | Solid fills from the token palette. No gradients (not even scrims over photos — put text on a flat panel or on a calm area of the image), no grain, no blend modes. |
| **Square** | Corners are 0. Exceptions are things that are *circles by nature*: avatars, colour swatches, hot-spot pins, radio buttons, count badges. |
| **Hairlines** | 1px `border-line` for structure, `border-ink` for emphasis. Structure comes from borders and whitespace, not elevation. |

## 2. Tokens (`src/app/globals.css`)

| Token | Value | Notes |
| --- | --- | --- |
| `--maxw` | `1600px` | content max width (`container-x`) |
| `--gutter` | `clamp(16px, 3.2vw, 48px)` | page side padding |
| `--gap` | `16px` <600 · `20px` ≥600 · `24px` ≥1024 | the *only* gap between grid columns and between neighbouring tiles |
| `--edge` | `max(--gutter, (100vw − --maxw)/2 + --gutter)` | distance from the viewport edge to the content edge — use it to bleed a block off the screen while keeping its other edge on the grid |
| `--section-y` | `clamp(56px, 7vw, 112px)` | vertical rhythm between sections |
| `--header-h` | 112px ≥1024 · 104px below | sticky offsets (`--header-offset` follows the hide-on-scroll header) |
| `--bottom-nav-h` | 60px | phones: bottom navigation (hidden on PDP and checkout) |

## 3. Columns

* **4 columns below 600px**, **12 columns from 600px up** (`grid-main`). Column gap is `--gap`.
* Three layout steps: *phone* (`base`, 4 cols), *tablet* (`sm`, ≥600, 12 cols), *desktop* (`lg`, ≥1024, 12 cols).
* Spans that compose cleanly on 12: `6+6`, `4+4+4`, `3+3+3+3`, `8+4`, `7+5`, `9+3`, `2×6`. On phones: `4`, `2+2`, `1+3`.
* **Nested grids**: inside a `span-N` block, use `grid-cols-N` with `gap-x-[var(--gap)]` — the sub-columns then land exactly on the page's columns (N equal columns + the same gap = N columns of the parent). Never hand-pick `gap-5`/`gap-8` between aligned things.
* **Carousels** size items from `--pv` (items per view): `calc((100% − (pv−1)·gap)/pv)`. With `pv = 4` at ≥1024 each card is exactly `span-3`; `pv = 6` ⇒ `span-2`; `pv = 3` ⇒ `span-4`; `pv = 2` ⇒ `span-6`. Phones use fractional `pv` (2.25, 1.15 …) so the next card peeks.
* **Full-bleed blocks** (hero, banners, split sections): either both edges on the viewport, or *one* edge on a column line and the other on the viewport (`lg:-mr-[var(--edge)]` / `-mx-[var(--gutter)]`). Never an arbitrary x.

## 4. Primitives

| Primitive | File | Use |
| --- | --- | --- |
| `Grid`, `Col` | `layout/Grid.tsx` | `<Grid><Col span={{ base: 2, sm: 6, lg: 3 }} start={{ lg: 7 }} rowStart={{ lg: 1 }} rows={{ lg: 2 }} /></Grid>`. Always give a `rowStart` when you give a `start`, otherwise auto-placement drifts past the tile and leaves a hole. |
| `Section` | `layout/Section.tsx` | Full-width flat band (`tone` = bone / paper / white / sand / ink / luxe / gem / resp / festive / pink-tint), vertical rhythm `y="md" \| "sm" \| "none"`, content in `container-x` (or `bleed`). |
| `SectionHeading` | `ui/SectionHeading.tsx` | Eyebrow + title (cols 1–6) and intro / link / arrows (cols 7–12, or `splitAt={7}` for a 7/5 layout). `size="md" \| "lg" \| "xl"`. |
| `PageHeader` | `layout/PageHeader.tsx` | Breadcrumbs + `SectionHeading level 1`. First thing on every page below the header. |
| `Carousel`, `CarouselTrack`, `CarouselArrows` | `ui/Carousel.tsx` | Horizontal rail with density presets (`product` 4-up, `tile` 6-up, `wide` 3-up, `feature` 2-up). Arrows live in the heading (desktop only; touch swipes; the track is a focusable scroll region). |
| `BentoTile` | `ui/BentoTile.tsx` | Image + flat caption strip. `ratio="fill"` takes the height of the rows it spans (give its parent `relative` and `aspect-*`/rows). |
| `ProductCard` | `product/ProductCard.tsx` | 4:5 image, label, name, price (discount only when real). `fill` stretches the image to the height the grid gives (feature cards). |
| `Img` | `ui/Img.tsx` | The only way to render art: average-colour placeholder, `ratio`, `ratio="fill"`, `load` hints. |

## 5. Composition catalogue

Pick one per section; do not repeat the same one twice in a row on a page.

1. **Full-bleed banner** — image edge to edge, copy on a calm area (or flat panel below on phones). *Home hero.*
2. **Bento 6 + 2×2** — one 6-column tile spanning 2 rows beside four 3-column tiles; mirror it left/right between sections. *Categories, edits.*
3. **Carousel 4-up / 6-up** — product or tile rail, arrows in the heading. *New in, picked for you, more from this label.*
4. **Mixed-size product grid** — one 6-column × 2-row feature card + 3-column cards. *Trending, listing inserts.*
5. **Split banner** — flat colour panel (cols 1–6) + image bleeding off the right edge (cols 7–12). *Festive.*
6. **Lead + stack** — 7-column lead story beside two compact stories (5 columns). *Style Files.*
7. **Panel + 2 features** — 4-column text panel and two 4-column product cards. *Label spotlight.*
8. **Uniform 4-up product grid** — `span-3` cards, `gap-y` 40px. *Listings, wishlist.*
9. **Sidebar layouts** — 8/4 (PDP gallery | buy box), 8/4 (bag | summary), 7/5 (checkout), 3/9 (account nav | content), 6/6 (login image | form).
10. **Editorial rows** — alternate 6/6, 4/4/4, 7/5, 5/7 and full-width image rows so no two consecutive rows share a rhythm. *Discover, story pages.*

## 6. Page map

| Page | Structure |
| --- | --- |
| Home | Hero banner → edit chips → category bento → new-in carousel → edits bento (mirrored) → trending mixed grid → festive split banner + 4-up → story lead+stack → label spotlight → offer band → values → footer. Order adapts to intent (cold / returning / deal). |
| Category / search / edit / label listings | Page heading → sub-category tile rail → sticky toolbar (Filter · quick chips · count · Sort) → full-width 4-up grid (3-up tablet, 2-up phone) with a 6×2 feature insert → "Show more". Filters open in a drawer so the grid keeps all 12 columns. |
| Product | Gallery 8 cols (image grid: first image 8, then 4+4; phones: swipeable, full bleed) + sticky buy box 4 cols → details / delivery / reviews (4+8) → complete-the-look carousel → more-from-label carousel. Sticky add-to-bag bar on phones. |
| Discover / stories | Asymmetric editorial rows; article = full-bleed cover, 7-column reading column (cols 3–9 / centred), wide shoppable images spanning 12 or 8+4. |
| Edits index / Labels A–Z / Offers | Bento of edits · A–Z rail (col 1) + 3 label columns · coupon tiles 3-up. |
| Bag / checkout / confirmation | 8/4, 7/5, 6/6 with a sticky summary. Simulated payment always labelled. |
| Account / login | 3/9 shell (nav | content); login 6/6 (image | form). |

## 7. Navigation

* **Top (desktop ≥1024)** — row 1: logo (cols 1–3) · search (4–9) · Account / Wishlist / Bag (10–12). Row 2: Edits, Discover, Women, Men, Kids, Home (mega menus on a 3+3+3+3 grid) · New in, Offers. Hides on scroll down, returns on scroll up.
* **Top (<1024)** — ☰ menu drawer · logo · account, then a full-width search field. The drawer holds departments, edits, labels, help, prototype controls.
* **Bottom (<1024)** — Home · Shop (category sheet) · Edits · Wishlist · Bag, with live counts; hidden on the product page and checkout.
* Keyboard: `/` opens search, `Esc` closes any overlay, focus is trapped and restored in every dialog/drawer.

## 8. Audits

```
node scripts/qa/grid.cjs  http://localhost:3200 [--routes /,/c/women] [--widths 390,820,1280,1728]   # images sit on column lines
node scripts/qa/flat.cjs  http://localhost:3200 [--routes …] [--widths …] [--overlays]               # no shadow / gradient / blur / non-Inter font
node scripts/qa/overflow.cjs http://localhost:3200                                                    # no horizontal overflow
```
