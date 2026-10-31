# Awards direction — Nykaa Fashion, editorial register

Branch `claude/nykaa-fashion-awards`. Same product, same information architecture, same working flows as `claude/nykaa-fashion-grid-redesign` (which stays untouched as the "current design"). This branch changes how it **looks and moves**: the register of an awards-recognised fashion site — poster-scale type, large silent photographs, long easing, nothing decorative.

Reference: the fashion collection on awwwards.com (not reachable from the build sandbox, so the patterns below are the ones those sites share: oversized display type, mask-reveals, smooth scroll, a follower cursor, full-bleed photography, tickers, hover-driven lists, big numerals).

## What stays

* The 12-column grid contract (`docs/GRID_SYSTEM.md`): 4 columns below 600 px, 12 above, `--gap`, `--gutter`, `--maxw`. Every block still lands on it.
* The live-site identity: wordmark, header structure (utility row, department row, mega menus), footer content, category names, raspberry accent.
* Every behaviour: adaptive home modules (`composeHome`, `ModuleShell` ids and `home_module_view` tracking), search, bag, checkout, accounts, simulated-flow labels.
* Rules from the brief: **Inter Display only; no shadows, gradients, blur, filters or blend modes anywhere; flat colour; only the two supplied photographs.**

## What changes

| | Grid branch | Awards branch |
|---|---|---|
| Page | white, cool greys | `bone` #f4efe8 (the photographs' own wall), `paper`, `sand` |
| Ink | slate navy | warm black `ink` #15120f (also the primary button) |
| Display type | 600 weight, up to 4.5 rem | 500 weight, up to 9 rem, tracking −0.058 em, line-height .94 (`display-xl/lg/md/sm`) |
| Eyebrows | 12 px, .06 em | 11 px, .16 em, uppercase, 500 |
| Section rhythm | 56–112 px | 72–144 px (`--section-y`) |
| Motion | opacity fade on a few modules | smooth scroll, word-mask headline reveals, clip-path picture reveals, parallax, ticker, follower cursor, page fade |
| Imagery | cards and tiles | full-bleed bands (up to `100svh`), tall 3:4 / 4:5 crops, 21:9 strips, one-picture-at-a-time lists |

## Composition rules

1. **Scale contrast is the aesthetic.** Pair a display line (`display-xl/lg`) with 11 px uppercase eyebrows and 14–15 px body. Avoid mid-sized, mid-weight type.
2. **Numerals and rules.** Index sections and lists (`01`, `02` …, `01 / 03`) with small tabular numerals and 1 px `line` rules instead of boxes.
3. **Pictures lead.** At least one full-bleed picture band per scroll-screen on the home page. Text sits on the calm wall of the photograph (use `imgEdge(key)?.wall` for the colour and `lum()` to choose light/dark text, as `SlideBody` does) or below the picture — never across a face.
4. **Colour is a surface, not an effect.** Alternate `bone` / `paper` / `sand` / `luxe` bands. The raspberry (`pink`) is for `<em>` accents in headings, links and badges only.
5. **Hover shows, it doesn't decorate.** Hovering a row can swap the picture; a card can slowly scale its picture (`scale-[1.04]`, 1.2 s, `ease-expo`). Every hover-only reveal needs a focus and touch equivalent.
6. **Squares stay square.** Controls keep the 4 px radius, pills stay pills, pictures and cards have no radius.

## Motion primitives (`src/components/motion`, `src/app/template.tsx`)

All reveal components are server-renderable (they only emit `data-reveal`); one `RevealObserver` in the layout flips `data-in`. Nothing is hidden unless JS runs (`html.js`) and motion is allowed.

| Primitive | Use |
|---|---|
| `<RevealText as="h2" className="display-lg">…</RevealText>` | Headline / paragraph: words rise out of a mask. `<em>` inside is kept. `delay` in ms. |
| `<Rise y={28} delay={80}>` | Block fades up. `as` picks the element (`li`, `p`, `section` …). |
| `<Fade>` | Opacity only. |
| `<RevealMedia>` | A picture frame: uncovered bottom-up (clip-path) while the picture settles from 1.14×. The observed wrapper is unclipped and the clipped `overflow-hidden` frame sits inside it, so tall pictures still reveal and the over-scale cannot widen the page. **Pictures only** (the frame clips anything outside it), never the LCP image. |
| `<Stagger step={80}>` | Adds the rise to each DOM child in turn (children must be host elements). |
| `<Parallax amount={70}>` | Picture drifts against the scroll inside a clipped frame (`absolute inset-0` layer, `data-nogrid`). Still under reduced motion. |
| `<Marquee seconds={42}>` | Endless ticker, pauses on hover/focus, static + scrollable for reduced motion. |
| `.settle` (CSS) | The first-screen hero picture eases from 1.1× to 1× on load without ever being hidden. Put it on a layer *inside* an `overflow-hidden` frame. |
| `data-cursor="View"` / `"Drag"` | Turns the follower into a labelled disc over that element (fine pointers only). |
| `ui/Reveal` | Legacy wrapper, now `Rise`. Existing call sites keep working. |
| `home/Unveil`, `home/kit` | The home page's own picture reveal (same effect, watches the outer frame), `useMedia` (SSR-safe media query), the pointer-following brand picture and the hero's progress segments (Web Animations API, they also time the auto-advance). |

Heading accents: `display-*` sets `<em>` to `--em-color` (raspberry by default); `.on-dark` turns it into the surrounding text colour, because raspberry on near-black is 2.7:1. Override per band with `[&_em]:text-…` only where the colour passes 4.5:1.

Reduced motion in client components: read it with `useSyncExternalStore` (server snapshot `false`) as `motion/Parallax` does, never with `useReducedMotion()` while rendering SSR markup — the server and the first client render would disagree and React warns in development.
| `SectionHeading` / `PageHeader` | Titles already use `RevealText`; eyebrow, intro and links rise. |

Timing: `--ease-expo` for reveals and picture moves, `--ease-editorial` for UI state changes; reveals 0.9–1.25 s; per-word stagger 42 ms; hover 0.3–0.4 s for controls, up to 1.2 s for pictures. Animate `transform`, `opacity` and `clip-path` only.

## Constraints the QA suite enforces

* `flat` — computed styles contain no `box-shadow`, `text-shadow`, `filter`, `backdrop-filter`, gradients or `mix-blend-mode`.
* `grid` — every block's left/right edge is on the 12-column lines. Moving layers (parallax, scaled pictures) carry `data-nogrid`. Audits run with `reducedMotion: "reduce"` so reveals are settled.
* `overflow` — no horizontal scroll from 360 px to 1920 px. Giant type must wrap (`text-wrap: balance`, `min-w-0`), not push.
* `a11y` — one `h1` per page, labelled landmarks, decorative copies `aria-hidden`, contrast ≥ 4.5:1 (`scripts/contrast.mjs`), focus visible, 44 px touch targets on coarse pointers.
* `keyboard` / `journey` — Lenis, reveals and the cursor must not stand in the way of any click, drawer or form. Overlays scroll natively (`allowNestedScroll`) and lock the page (`data-scroll-lock`).
* `vitals` — the first-screen picture is the LCP element: it is never `opacity:0`, never behind `RevealMedia`, and is the only `load="preload"` image.

## File ownership while building in parallel

* Foundation (`globals.css`, `components/motion/*`, `components/ui/*`, `components/layout/*`, `app/layout.tsx`, `app/template.tsx`): lead.
* Home (`components/home/*`, `app/page.tsx`, `data/home-content.ts`): one file per module (Hero, Strips, Categories, Celebration, Brands, Diwali, Rails, Edits, Trending, Look, Stories, Spotlight, Offers, Seo) composed in `HomeClient`; module ids, `ModuleShell` and tracking are unchanged.
* Pages (`components/{plp,product,editorial,commerce,account}`, `app/**/page.tsx` other than home): listings use `plp/ListingHeader` for full-width poster titles and `plp/FilterChip` for the toolbar; `product/CardPrice` and the column-staggered `CardRise` give the cards their finish.
