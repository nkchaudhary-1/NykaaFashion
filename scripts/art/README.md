# Art engine (Phase A)

Procedural product photography for the Nykaa Fashion prototype. Everything is drawn in code: no network, no AI credits,
no browser. A job is a small JSON `spec`; the engine turns it into a 1000x1250 (or any size) WebP that is meant to read
like a calm catalogue still: seamless paper backdrop, soft window light, a real hanger or table contact shadow, fine grain.
No text and no logos ever appear in an image.

Phase A ships 15 kinds (`dress kurta saree top tee shirt trousers skirt jacket sneaker heel bag earrings vase cushion`),
three shots each (`front`, `alt`, `detail`), 17 patterns, 15 fabrics, 6 trims. Scenes, pins, `styled` shots and the
remaining P0/P1 kinds are Phase B.

## Quick start

```bash
# render a manifest into public/img and merge src/data/generated/image-meta.json
node scripts/art/render.mjs <manifest.json> [--only id1,id2|prefix*] [--concurrency 4] \
     [--out public/img] [--meta src/data/generated/image-meta.json] [--quality 80] [--skip-existing]

# contact sheet (labels each cell with its `out` id)
node scripts/art/preview.mjs <manifest.json> --out /tmp/sheet.png [--cols 6] [--cell 300] [--only ...] [--concurrency 4]

# the QA manifest: every kind x shot x several patterns/colours (258 images, about 2 minutes on 4 cores)
node scripts/art/render.mjs scripts/art/samples/manifest.json --out /tmp/art-out --meta /tmp/art-out/meta.json
node scripts/art/preview.mjs scripts/art/samples/manifest.json --out /tmp/sheet.png --only 'samples/dress/*' --cols 7
```

- `--only` takes a comma list of exact ids and/or globs where `*` matches any run of characters:
  `--only 'products/p-001*'`, `--only 'samples/dress/*-front,samples/vase/*'`.
- `--skip-existing` skips jobs whose `.webp` already exists (resume a long run).
- `--concurrency` is the number of worker threads (the JS shading is main-thread bound, so this scales with cores).
- Jobs that carry a `scene` instead of a `spec` are skipped with a warning (Phase B).
- Exit code is 1 if any job failed; meta is merged every 10 jobs and at the end (atomic write, keys sorted).
- Output is deterministic: the same manifest produces byte-identical WebP and meta, independent of `--concurrency`.
  All randomness comes from a seeded PRNG (`lib/prng.mjs`); `Math.random` is never used.

## Manifest, spec and meta schema

```jsonc
{ "jobs": [
  { "out": "products/p-001-1", "w": 1000, "h": 1250,
    "spec": { "kind": "dress", "color": "#8B2E3C", "color2": "#E9D8C4", "pattern": "floral",
              "length": "midi", "sleeve": "short", "neckline": "v", "silhouette": "fit-flare",
              "bg": "#EFE6DA", "shot": "front", "seed": 101 } }
] }
```

Optional per-job keys: `quality` (WebP quality, default 80) and `finish` (overrides for the final pass:
`{ grain, vignette, lightOnProduct, contrast }`).

`image-meta.json` entry per `out`: `{ "w", "h", "avg": "#rrggbb", "blur"?: "data:image/webp;base64,..." }`.
`avg` is the mean colour (CSS placeholder). `blur` (a 16 px wide WebP) is only written when `w >= 1200`. `pins` plumbing
exists but is only filled by scenes (Phase B).

### Common spec fields

| field | meaning |
| --- | --- |
| `kind` | one of the kinds below (required) |
| `shot` | `front` (hero, default), `alt` (back / other side / different arrangement), `detail` (macro with depth-of-field) |
| `seed` | integer; changes folds, jitter, pattern placement, hanger tone. Same seed = same image |
| `color` | primary / ground colour |
| `color2`, `color3` | pattern ink, trim colour, stone colour, glaze second colour (kind dependent). Sensible defaults are derived from `color` when absent |
| `pattern` | see Patterns; `scale` multiplies the motif size, `angle` rotates stripes |
| `fabric` | see Fabrics; each kind has a sensible default |
| `trim` | see Trims |
| `bg` | backdrop hex. Tested: bone `#F1EBE2`, sand `#E6DAC9`, clay `#D8C2AE`, blush `#EBD3CB`, sage `#CBD3C0`, mist `#D6DEE0`, stone `#D0C9BF`, and dark moods ink-olive `#3A3D32`, aubergine `#3B2432` (the hanger switches to a pale ash tone on dark paper) |
| `hanger` | `beech` `walnut` `ash` `black` `white` `brass` (garments only; auto-picked for contrast when absent) |
| `gender` | `men` is supported by `kurta` and `trousers`; `kids` is not implemented yet |

### Patterns (`pattern`)

`solid` `stripe` `pinstripe` `check` `gingham` `polka` `floral` `paisley` `block-print` `ikat` `bandhani` `chevron`
`embroidery` `sequin` `mirror-work` `abstract` `tonal-jacquard`. Patterns are real SVG `<pattern>` tiles defined in
centimetres, so the motif scales with the garment (not the canvas), shades through the folds and wraps around seams.
`color` is the ground, `color2` the main ink, `color3` an accent (defaults are derived).

### Fabrics (`fabric`)

`cotton` `linen` `silk` `satin` `chiffon` `denim` `knit` `velvet` `leather` `wool` for cloth and leather;
`ceramic` `glass` `brass` `wood` `terracotta` for objects. Each entry in `lib/fabrics.mjs` sets ambient/wrap diffuse,
specular, environment-metal mix, rim light (velvet, wool), texture type (weave, slub, twill, knit, pile, pebble...),
fold amplitude and crispness, opacity and translucency.

### Trims (`trim`)

`none` `contrast-border` `gota` `zari-border` `lace` `piping` `tassel`. Garments apply them where it is natural (neckline,
hem, cuffs, placket); `ruffle` is accepted and ignored. Sarees use `border` (or `trim`) for the border style.

## Kinds

All kinds support the three shots. `front` = hero; `alt` = a visibly different second view; `detail` = macro crop.

| kind | options (defaults first) | front / alt / detail |
| --- | --- | --- |
| `dress` | `silhouette`: `a-line` `fit-flare` `slip` `wrap` `shirt` `tiered` `bodycon`; `length`: `midi` `mini` `maxi`; `sleeve`: `none` `cap` `short` `three-quarter` `long` `puff`; `neckline`: `round` `v` `square` `halter` `scoop` `collar`; `trim` | hanger front / back with zip / macro of neckline, hem trim, wrap tie or pattern |
| `kurta` | `length`: `knee` `short` `calf`; `fit`: `straight` `a-line` `flared` `angrakha`; `neck`: `mandarin` `round` `v` `keyhole`; `sleeve`; `slit`; `trim`; `gender: "men"` | hanger front / back / placket, collar or hem macro |
| `saree` | `border` or `trim`: `zari-border` `contrast-border` `gota`; `color2` for border and motif | folded stack with pleated pallu and motif / angled stack with pallu pulled out / border and pallu macro |
| `top` | `style`: `blouse` `tank` `cami` `crop` `peplum` `bodysuit` `saree-blouse`; `sleeve`; `neckline` (or `neck`); `trim` | hanger front / back / neckline or hem macro |
| `tee` | `neck`: `crew` `v` `polo` `henley`; `fit`: `regular` `oversized` `boxy` `cropped`; `sleeve`: `short` `long` | hanger front / back / neck, sleeve or hem macro |
| `shirt` | `collar`: `spread` `band` `camp`; `fit`: `regular` `slim` `relaxed`; `sleeve`: `long` `short`; `pocket` | hanger front / back / collar, placket, cuff or pocket macro |
| `trousers` | `leg`: `straight` `wide` `tapered` `flared` `palazzo` `jogger` `cargo`; `length`: `ankle` `full` `crop`; `pleats`; `fabric: "denim"` gives jeans stitching; `gender` | clip hanger front / back / waistband, pocket or hem macro |
| `skirt` | `style`: `a-line` `pleated` `slip` `tiered` `pencil` `wrap`; `length`: `midi` `mini` `maxi`; `trim` | clip hanger front / back / waistband or hem macro |
| `jacket` | `style`: `blazer` `bomber` `denim` `trench` `shacket` `waistcoat` `nehru` | hanger front / back / lapel, pocket, cuff or rib macro |
| `sneaker` | `style`: `low` `high` `chunky` `slip-on`; `color2` (accent), `color3`, `soleColor`; `fabric` (leather default, `cotton` for canvas) | profile on a surface / staggered pair / macro of eyelets, toe or sole |
| `heel` | `style`: `stiletto` `block` `kitten` `platform` `mule`; `soleColor`, `heelColor`; `fabric` (leather default, `velvet`, `satin`) | profile on a surface / staggered pair / macro of vamp and sole |
| `bag` | `style`: `tote` `top-handle` `sling` `clutch` `bucket` `backpack` `potli`; `hardware`: `gold` `silver` `black` `brass`; `fabric` | 3/4 view on a surface / the opposite side on a different light seed / macro of clasp, strap or grain |
| `earrings` | `style`: `jhumka` `stud` `hoop` `chandbali` `drop`; `metal`: `gold` `silver` `oxidised` `rosegold`; stones via `color2`; `surface` (cloth colour) | pair on silk / pair staggered and rotated on a different cloth drape / single piece macro with depth-of-field |
| `vase` | `style`: `bud` `amphora` `cylinder` `bottle`; `finish`: glossy or `matte`; `fabric: "terracotta"`; `color`, `color2` (second glaze); `stems: true` with `dry`: `pampas` `wheat` | single vase / grouped arrangement / rim and glaze macro |
| `cushion` | `style`: `piped` `tasselled` `tufted`; `pattern`; `color2` (piping, tassels) | upright against the wall / pair arrangement / macro of piping, tassel or tufting |

## How it works

1. `lib/ctx.mjs` (`Ctx`) owns a Float32 RGB canvas, the camera (`cm -> px`), the seeded RNG and the shared lighting
   (key light from the upper left, fixed for the whole catalogue so every image looks like the same studio).
2. `ctx.backdrop({ mode: 'wall' | 'surface', horizon, shaft, leaves })` paints seamless paper: radial light pool, mottling,
   a window-light shaft and an optional leaf-branch shadow. `surface` adds a soft table horizon for footwear, bags and objects.
3. Each piece (`clothPiece`, hanger, hardware...) is an SVG path rasterised by librsvg to a flat albedo layer. Shading is done
   in JS on float buffers (`lib/shade.mjs`): a `FoldField` height field (ridges, domes, blobs, bands, noise) gives slopes, plus
   bevel from the alpha, edge ambient occlusion, a texture bump plane, wrap diffuse, specular / environment reflection for
   metals, rim for velvet and translucency. Patterns are therefore shaded through the folds.
4. Shadows: `wallShadow` (3-layer, sheared) for hanging pieces, `groundShadow` + `contactEllipse` for objects.
5. `ctx.finish()` applies a gentle tone curve, vignette, three-octave film grain, quantises to 8 bit and hands back RGB;
   `lib/engine.mjs` encodes WebP (quality 80, effort 5). Average size of the sample set is about 41 KB per 1000x1250 image.
6. `detail` shots reuse the same scene with a zoomed, slightly rotated camera and `ctx.setDof` (tilt-shift blur).

Layout:

```
scripts/art/
  render.mjs  preview.mjs  worker.mjs        CLIs and the worker-thread entry
  lib/        ctx, shade, folds, fabrics, texture, patterns, trims, geometry (Catmull-Rom -> Bezier, offsets, tubes),
              garment / upper / lower / collar / hanger (garment toolkit), object (objects on a surface), color, prng, noise
  kinds/      one file per kind + index.mjs (registry)
  samples/manifest.json                      the QA manifest
```

## Adding a kind

1. Create `kinds/<name>.mjs` and default-export `{ front(ctx, spec), alt(ctx, spec), detail(ctx, spec), finishOpts? }`.
   Each shot function is async: place the camera, paint the backdrop, draw pieces, add shadows, optionally `ctx.setDof`.
   `finishOpts[shot]` can override `{ grain, vignette, lightOnProduct, contrast }`.
2. Upper-body garments: write a profile function and export
   `garmentKind((ctx, spec, shot) => buildUpper(ctx, spec, shot, profile(ctx, spec, shot)), { detail: upperDetail })`
   (see `kinds/tee.mjs`, the smallest example). Lower-body garments use `lib/lower.mjs`.
3. Objects on a surface: build "models" `{ pieces, bounds, baseY }` and call `fitObject(ctx, bounds, ...)`,
   `ctx.backdrop({ mode: 'surface' })`, `paintObjectModels(ctx, models)` (see `kinds/heel.mjs`, `kinds/bag.mjs`).
4. Pieces: `clothPiece(makeMaterial(ctx, spec), { id, z, d, bounds, field, inner, defs, bevelCm, ... })`. Geometry is in
   centimetres; build outlines with `Curve.through([...points])` (use `[x, y, 'c']` for a sharp corner) and `mirrorOutline`
   for half silhouettes.
5. Register it in `kinds/index.mjs`, add entries to `samples/manifest.json` and review with `preview.mjs` at full size
   before trusting a thumbnail sheet.

## Known limitations (Phase A)

- Footwear and jewellery are stylised 2D constructions; they read as the right object but not as photographs.
- Bags: side faces and the backpack straps are simple. Heels: toe boxes lack definition.
- Very dark garments (black blazer, pencil skirt) carry little detail; shapes come mostly from the rim and fold shading.
- `top` styles `tank` / `bodysuit` are generic; `peplum` and `tiered` hems can step visibly in macros.
- Shirt collars in macro still look slightly bow-tie shaped.
- `scene` jobs, `pins`, `styled` shots, `kids`, and the remaining P0/P1 kinds are Phase B.
