# The owner's AI-generated picture set

Every picture on the site comes from **190 AI-generated images** the owner made and collected in Figma:
`https://www.figma.com/design/Mj8oos8GHlgEeY4fKgrJpY/Nykaa-Fashion-New-Look-2027` → page *Images*.

* **60 key-page pictures** (from `docs/IMAGE_PROMPTS.md`): six sections — Home page 4 · Category tiles 5 · Edits 9 · Stories 18 · New & Next 21 · Pop-ups 3 — each picture named by its shot id.
* **130 product pictures** (from `docs/IMAGE_PROMPTS_PRODUCTS.md`): fifteen sections, one picture per product, each named by the product's id (`twd-01`, `gaj-01`, …).

## Where things are

| What | Where |
| --- | --- |
| The originals (the files Figma holds as image fills, unmodified) | `scripts/figma/source/<shot id or product id>.jpg` (21 MB in all) |
| Focus point, shoppable-pin anchors, alt text, Figma node, groups, banner / pop-up mapping, `slots.products: "own"` | `scripts/figma/manifest.json` |
| The builder | `scripts/figma/build.mjs` (the picture builder of `scripts/unsplash`, pointed at this library) |
| What it writes | `public/img/**.webp`, `src/data/generated/image-meta.json` (average colour, blur preview, wall / floor colours, pins), `photo-assignments.json`, `photo-credits.json` |
| The credits page | `/credits` — every picture listed as "AI-generated", with where it is used |

Figma's download links are short-lived. The originals are fetched through the Figma connector (`download_assets` on a node returns `rawImages`: the uploaded file, not Figma's re-render), so the repo keeps its own copy.

## Rebuild

```bash
node scripts/figma/build.mjs                                                  # all 687 pictures, about 3 min (add --only products/ or --only scenes/,launches/,promo/,placeholders/ for a part)
UNSPLASH_MANIFEST=$PWD/scripts/figma/manifest.json UNSPLASH_CACHE=$PWD/.cache/figma \
  node scripts/placeholders/promo-video.mjs --photo-id vrisa-wide             # the pop-up clip and its poster
node scripts/qa/image-audit.mjs && npm run data:check
```

`slots.products: "own"` in the manifest is what makes the builder give every product its own photograph (below); without it the products would be cut from shared photo pools.

**Replace a picture:** put the new file at `scripts/figma/source/<same id>.jpg`, move its `focus` / `anchors` in the manifest if the subject moved, rebuild, look at the pictures (`scripts/unsplash/review.mjs` or a contact sheet).

## Which picture feeds what

| Pictures (shot ids) | Cut into |
| --- | --- |
| `home-hero-sale`, `home-hero-coord`, `home-hero-festive`, `home-band-diwali` | The home hero's three slides (sale · festive · co-ord edit) and the Diwali band: `placeholders/kurta-set-*`, `festive-set-*`, `boucle-suit-*`, `diwali-band-16x9-copy-left` |
| `cat-women`, `cat-women-sidepanel`, `cat-men`, `cat-kids`, `cat-home` | `scenes/cat-*` (category tiles) and `scenes/auth-side` (the sign-in page's side panel) |
| `edit-*` (9) | `scenes/edit-<id>-wide` (the whole picture) and `-tall` (a 4:5 window around the focus point) |
| `story-<name>-0` | the story's `-wide` and `-tall` covers |
| `story-<name>-1`, `-2` | the two pictures inside the article (`scenes/story-<name>-1`, `-2`), with the shoppable pins |
| `<brand>-wide`, `<brand>-tall` | `launches/<brand>/hero-wide`, `hero-tall` (and `g4`, a 3:2 window of the wide one) |
| `vrisa-d1…d3`, `halden-d1…d3`, `kiln-d1…d3` | `launches/<brand>/g1…g3`, used whole (`closeup: true`) |
| `popup-first-order`, `popup-halden`, `popup-delivery` | `promo/first-order`, `halden-preview`, `delivery-notice` |
| `vrisa-wide` | also the first frames and the clip of the pop-up video (`promo/vrisa-teaser`) |
| `<product id>` (130) | every picture of that product: `products/<id>/v<n>-front`, `-alt`, `-detail` for each colour variant (596 in all) |

### Product pictures

One photograph per product serves **all of its colour variants and its three views**, as windows onto it (`planOwnProduct` in `scripts/unsplash/build.mjs`; the subject's place is found by `subjectBox` in `crop.mjs`, or stated in the manifest as `subject: [x0, y0, x1, y1]`):

| Kind | front | alt | detail |
| --- | --- | --- | --- |
| A model, or a kids' flat lay | the whole picture | the upper part | the lower part |
| An object (shoes, bags, jewellery, home) | the subject filled out to about three quarters of the window | a wider look (the whole picture) | a close part, left or right of centre as the product id decides |

Nothing is mirrored. A window is never enlarged beyond 1.5 ×.

Shoppable pins sit on the garment or object they point at, and name the catalogue product that matches it (`anchors` in the manifest: `[x, y, productId]`, fractions of the picture).

## Limits to know

* **Source size.** The generator gave 1376 × 768 (16:9), 928 × 1152 (4:5 — every product picture), 1264 × 848 (3:2) and 1200 × 896 (4:3). Whole-picture slots are enlarged at most 1.4 ×; the *tall* cut of an edit or story cover (a 4:5 window of a 16:9 picture) and the home hero's 4:5 are enlarged about 1.6–2 ×, so they are a little soft. Generating at 2K and upscaling would fix it.
* **Product close-ups are windows, not new photographs.** From a 928 × 1152 original the closest honest window is about 1.4 × (72 % of the picture), so "alt" and "detail" are a pan across the same picture, not a macro shot. Small things — pearl drops, hoops, the cutwork on a cushion — stay small. Higher-resolution originals (or a second close-up shot for the products that need one) would give real detail views.
* **One photograph per product, not per colour.** A product's colour variants share its photograph (the one in its *first* colour), so choosing another swatch changes the name and the price but not the picture. 103 colour variants of the 130 products have no picture of their own; `docs/IMAGE_PROMPTS_PRODUCTS.md` has the prompts for the first colours only.
* **`story-diwali-1`** came out with a blank white band over its right third; the original is kept, the cropped 839 × 559 picture part is what the site uses. Regenerate it.
* **`halden-wide`** has a plain white block on its left (the copy area) with a hard edge where the office starts.
* **`edit-luxe-wide`** gets a uniform exposure change (× 1.12) so its dark heading keeps 3:1 contrast. The builder reports any such change.
* The pictures are AI-generated: nothing in them is a real person, place or product, and none shows a readable logo or text.
