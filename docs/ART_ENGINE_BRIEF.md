# Art Engine — brief

Procedural, art-directed product & editorial imagery for the Nykaa Fashion redesign prototype.

## Why this exists

The prototype needs ~350 product images and ~40 editorial scene images. The sandbox cannot reach any photo host
(Unsplash, Pexels, Wikimedia… all blocked) and there are no AI-image credits. So we **generate** the imagery:
`SVG (code) → sharp/librsvg → WebP`. Images are *data*: the UI only references files by path
(`/img/products/<id>-<n>.webp`), so real photography can later replace any file by overwriting it with the same name.

Quality bar: this is a *premium global fashion destination* (think SSENSE / COS / Aesop / Net-a-Porter catalog stills),
**not** clip-art, emoji, or flat-icon illustration. If it looks like a stock vector icon, it fails.

## Constraints

- Node 22, ESM (`.mjs`). The only npm dependency is `sharp` (already installed in the repo root; verify with
  `node -e "require('sharp')"`). **Do not run `npm install` in the repo root** and do not edit `package.json`.
- Only write inside: `scripts/art/**`, `public/img/**`, `src/data/generated/**`.
  Put throw-away previews / contact sheets in the session scratchpad (path given in your prompt), not the repo.
- Deterministic: same spec ⇒ byte-identical image (seeded PRNG, never `Math.random`).
- No text, logos, watermarks inside images.
- Full manifest of ~400 jobs must render in a few minutes (batch with limited concurrency; no per-image browser launch).
- Output WebP quality ≈ 80, average ≤ ~70 KB for a 1000×1250 product shot.
- Verify visually: render, then `Read` the PNG/WebP contact sheets (you can view images) and iterate. Critique your own
  work harshly and fix it before reporting.

## Deliverables

1. `scripts/art/` — the engine (modular: `lib/` for canvas/backdrop/lighting/grain/patterns/shading/geometry,
   `kinds/` one file per garment/object kind).
2. `scripts/art/render.mjs` — CLI
   `node scripts/art/render.mjs <manifest.json> [--only id1,id2|prefix*] [--concurrency 4] [--out public/img] [--meta src/data/generated/image-meta.json]`
3. `scripts/art/preview.mjs` — contact-sheet builder
   `node scripts/art/preview.mjs <manifest.json> --out <sheet.png> [--cols 6] [--only …]` (labels each cell with its `out` id).
4. `scripts/art/README.md` — spec schema, every kind + options, how to add a kind.
5. `scripts/art/samples/manifest.json` — a QA manifest exercising every kind × shot × pattern.

## Manifest schema

```jsonc
{
  "jobs": [
    { "out": "products/p-001-1", "w": 1000, "h": 1250,
      "spec": { "kind": "dress", "color": "#8B2E3C", "color2": "#E9D8C4", "pattern": "floral",
                "length": "midi", "sleeve": "short", "neckline": "v", "silhouette": "fit-flare",
                "bg": "#EFE6DA", "shot": "front", "seed": 101 } },
    { "out": "stories/block-print/cover", "w": 1600, "h": 1000,
      "scene": { "bg": "#E8DCCB", "motif": "arch", "motifColor": "#D9C3B0", "safe": "left",
                 "items": [ { "spec": { /* ArtSpec */ }, "cx": 0.62, "cy": 0.55, "height": 0.7, "rot": -2, "pin": "p-001" } ] } }
  ]
}
```

- Writes `<out dir>/<job.out>.webp`.
- Writes/merges `image-meta.json`: `{ "<out>": { "w", "h", "avg": "#rrggbb", "pins"?: [{ "id", "x", "y" }], "blur"?: "data:image/webp;base64,…" } }`.
  `avg` = mean colour (used as the CSS placeholder). `pins` = normalised (0‒1) centre of each scene item that carries a
  `pin` id (UI overlays shoppable hotspots there). `blur` (≈16 px wide WebP data-URI) only when `w >= 1200`.

## ArtSpec

Common fields: `kind`, `color` (primary), `color2?`, `color3?`, `pattern?`, `trim?`, `fabric?`, `bg?` (backdrop hex),
`shot` (`front` | `alt` | `detail` | `styled`), `seed` (int), `kids?: boolean`, `gender?: "women"|"men"|"unisex"`.

- `pattern`: `solid` `stripe` `pinstripe` `check` `gingham` `polka` `floral` `paisley` `block-print` `ikat` `bandhani`
  `chevron` `embroidery` `sequin` `mirror-work` `abstract` `tonal-jacquard`
- `trim`: `none` `gota` `lace` `contrast-border` `tassel` `piping` `zari-border` `ruffle`
- `fabric` (drives sheen/texture/drape): `cotton` `linen` `silk` `satin` `chiffon` `denim` `knit` `velvet` `leather` `wool`
  `ceramic` `glass` `brass` `wood` `terracotta`
- Shots: `front` = hero view (garments hang from a hanger/peg; footwear & bags 3/4 on a surface; jewellery & home
  arranged on a surface). `alt` = back / other side / alternate arrangement (must look *different*, not a copy).
  `detail` = macro crop of fabric / pattern / trim / hardware with shallow depth-of-field falloff. `styled` = item with a
  couple of props (optional, lowest priority).

### Kinds (P0 first — build in this order)

**Women / unisex apparel (P0)**
- `dress` — `length: mini|midi|maxi`, `sleeve: none|cap|short|three-quarter|long|puff`,
  `neckline: round|v|square|halter|scoop|collar`, `silhouette: a-line|fit-flare|slip|wrap|shirt|tiered|bodycon`
- `kurta` — `length: short|knee|calf`, `fit: straight|a-line|flared|angrakha`, `neck: mandarin|round|v|keyhole`,
  `sleeve`, `slit?`, `placket?` (men's variant via `gender: "men"`)
- `kurta-set` — kurta + bottom (`bottom: palazzo|churidar|pant`) + dupatta draped; vertical composition
- `saree` — folded / stacked presentation with visible border, pleated pallu and motif (`border`, `pallu: true`)
- `top` — `style: tank|cami|blouse|crop|peplum|bodysuit|saree-blouse`, `sleeve`, `neckline`
- `tee` — `neck: crew|v|polo|henley`, `fit: regular|oversized|boxy|cropped`, `sleeve: short|long`
- `shirt` — `collar: spread|band|camp`, `fit`, `sleeve: short|long`, `pocket?`
- `trousers` — `leg: straight|wide|tapered|flared|palazzo|jogger|cargo`, `length: ankle|full|crop`, `pleats?`
  (jeans = `fabric: "denim"` with stitching/pocket detail)
- `skirt` — `style: a-line|pleated|slip|tiered|pencil|wrap`, `length`
- `jacket` — `style: blazer|bomber|denim|trench|shacket|waistcoat|nehru`
- `sweater` — `style: crew|turtle|cardigan|vest|hoodie`

**Footwear (P0)** — `sneaker` (`style: low|high|chunky|slip-on`), `heel` (`style: stiletto|block|kitten|platform|mule`),
`flat` (`style: ballet|loafer|jutti|sandal|slide|kolhapuri`), `boot` (`height: ankle|knee`)

**Bags (P0)** — `bag` (`style: tote|top-handle|sling|clutch|bucket|backpack|potli`, `hardware: gold|silver|black`)

**Jewellery (P0)** — `earrings` (`style: jhumka|stud|hoop|chandbali|drop`, `metal: gold|silver|oxidised|rosegold`, stones in
`color2`), `necklace` (`style: choker|layered|pendant|kundan-set|temple`), `bangles` (`count`, `style: plain|kada|kundan|glass`)

**Home (P0)** — `cushion` (`style: piped|tasselled|tufted`), `throw` (folded stack with fringe), `vase`
(`style: bud|amphora|cylinder|bottle`, optional dried stems), `candle` (`vessel: glass|ceramic|tin|pillar`),
`bowl` (`style: bowl|plate-stack|mug|serving`), `bedding` (folded set + pillow), `frame` (abstract wall art)

**P1 (after P0 is signed off)** — `lehenga` (choli + flared skirt + dupatta), `anarkali`, `dupatta`, `jumpsuit`,
`coord` (top + bottom pair), `shorts`, `romper` (kids), `watch`, `sunglasses`, `ring`, `maang-tikka`, `lamp`, `planter`.

Kids: any apparel kind with `kids: true` ⇒ shorter proportions, bigger heads/necklines, playful palettes. Men: `gender: "men"`
⇒ boxier torso, longer sleeves, men's collar / placket logic.

### Scenes (editorial / hero / edit / category imagery) — Phase B

```jsonc
"scene": { "bg": "#hex", "bg2?": "#hex", "motif": "arch|circle|window|steps|stripe|none", "motifColor?": "#hex",
           "safe?": "left|right|none",           // keep this side calm for overlaid headline text
           "items": [ { "spec": {…}, "cx": 0‒1, "cy": 0‒1, "height": 0‒1 (fraction of canvas h), "rot?": deg, "z?": n, "pin?": "<productId>" } ],
           "props?": [ { "type": "branch|plant|stool|rail|stone|leaf-shadow", "cx", "cy", "size", "color?" } ] }
```
Items render with the same lighting/shadow system as single shots, composed on one backdrop (hanging from a rail, standing,
or flat). Output pins into `image-meta.json`.

## Art direction — "soft-light paper studio"

- **Canvas**: 4:5 for products (1000×1250). Matte seamless-paper backdrop in a tonal warm neutral (bone, sand, clay, blush, sage,
  mist, stone — caller supplies `bg`; default `#EFE8DD`). Gentle radial light falloff (≈ ±6 % luminance), faint paper grain.
- **Light**: one soft key light from upper-left; optionally a diagonal "window light" shadow shaft (soft-edged parallelogram,
  ~6–9 % darker) and a faint leaf/branch shadow. Everything casts a soft, slightly offset contact shadow (two-layer: tight
  + wide, blurred). Add subtle film grain (monochrome noise ~3–5 %) and the lightest vignette over the whole frame.
- **Garments**: ghost-mannequin / hanging presentation — hang from a slim wooden hanger on a wall peg or lie as a clean
  flat-lay; believable volume: shoulder slope, neck opening with visible inner back neck, sleeves with slight natural angle,
  curved hem. Build outlines as *half* silhouettes mirrored about the centre, defined by control points smoothed with
  Catmull-Rom → cubic Bézier (so shapes are organic, not polygonal); add slight asymmetry in folds, not in the silhouette.
- **Cloth feel**: fold map = several low-opacity light/dark vertical gradient bands + soft inner-edge shading, clipped to the
  garment; fabric texture via cheap SVG filters (`feTurbulence` + `feDiffuseLighting`/`feColorMatrix`, supported by librsvg) or
  sharp-composited noise; per-`fabric` sheen (satin = broad specular streaks, silk = soft glow, linen = slub, denim = twill
  diagonal, knit = rib/purl rows, velvet = darker edges & pile, leather = fine pebble + hard highlight).
- **Pattern**: SVG `<pattern>` fills clipped to the garment, scaled to fabric (not to canvas), with hand-drawn irregularity for
  block-print / floral / paisley / ikat; trims (gota, zari, lace, tassels) drawn as proper bands following the hem/placket.
- **Objects** (shoes, bags, jewellery, home): physically plausible 3/4 views with gradients for volume, specular highlights,
  and grounded contact shadows; jewellery on a soft draped cloth or small stone; ceramics with glaze gradients.
- **Palette discipline**: ≤ 3 colours per object + neutrals; avoid pure black/white; no neon. Harmonise object colour with `bg`.
- **Hard no's**: black outlines around shapes, cartoon proportions, flat icon look, stray gradients that look like Photoshop
  2005, text/logos, identical `alt` and `front` shots.

## Phases

- **Phase A (now)** — engine core (canvas, backdrop, lighting, shadow, grain, pattern lib, cloth shading, geometry helpers),
  `render.mjs`, `preview.mjs`, README, plus these kinds: `dress`, `kurta`, `saree`, `top`, `tee`, `shirt`, `trousers`,
  `skirt`, `jacket`, `sneaker`, `heel`, `bag`, `earrings`, `vase`, `cushion`. All three shots (`front`/`alt`/`detail`) for each,
  across several colours/patterns. Contact sheets to the scratchpad. Self-critique and iterate until you would be comfortable
  putting these on a premium storefront. Then **report**: what exists, how to call it, honest quality assessment, paths of
  contact sheets, known weaknesses.
- **Phase B (after review)** — remaining P0 kinds, `scene` support with pins, then P1 kinds, kids/men variants.
