# PROJECT STATUS — Nykaa Fashion redesign (prototype)

_Source of truth: [`docs/PRD.md`](docs/PRD.md). Last updated: 30 Oct 2026._

**Direction (v3, current):** an *improved Nykaa Fashion*, not a different brand. After the first grid pass was rejected as "not Nykaa Fashion", 15 live screenshots and the official wordmark were supplied and became the source of truth for look and copy: white surfaces, slate text, **navy primary buttons**, **raspberry accent**, **green savings**, blue "Responsible" labels, the supplied logo, the live header (Women · Men · Kids · Home · More ▾ + department row + Fashion | Luxe + Account / Wishlist / Cart), footer, login modal, bag drawer, wishlist and product-page structure. On top of that identity the structure is rebuilt: one 12-column grid (4 on phones), a different composition per section, flat colour, **no shadows** (the live site uses them; an explicit requirement here), **one typeface (Inter Display)**, working top + bottom navigation. Grid and layout contract: [`docs/GRID_SYSTEM.md`](docs/GRID_SYSTEM.md). The PRD's curation assets (Hidden Gems, Luxe, Responsible, Style Files, House of Nykaa) stay in view as sections and under **More ▾**. Everything backend-shaped is **simulated and labelled**.

**Content status:** structure, wording, category names, footer labels and brand names come from the supplied screenshots and the PRD audit; products, prices, discount stamps, ratings and imagery are **sample data** (stamps are computed from the catalogue so a banner never promises more than its listing). The domain `www.nykaafashion.com` was allowed in the environment's network policy, but the site's CDN (Akamai) answers `403 Access Denied` to this environment — even to a stock browser — so the live catalogue **could not be imported**. To use real data, supply an export (HAR / JSON / CSV, or saved pages) from a normal browser and replace `src/data/home-content.ts`, `labels.ts`, `catalog-defs.ts`; Global Store, Revolve, Fitzone, Lingerie and Activewear are not built.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
npm run build && npm start
npm run typecheck && npm run lint
npm run data:check     # cross-reference validation of all mock data
scripts/qa/prod.sh 3100                                        # rebuild + (re)start a production server for QA
node scripts/qa/journey.cjs http://localhost:3100            # e2e shopping journey (needs a running server)
node scripts/qa/journey.cjs http://localhost:3100 --mobile
node scripts/qa/overflow.cjs http://localhost:3100           # horizontal-overflow scan: every route x 360/390/820/1280 + overlays
node scripts/qa/keyboard.cjs http://localhost:3100           # keyboard-only checks
node scripts/qa/a11y.cjs http://localhost:3100               # axe-core (npm i --no-save axe-core first)
node scripts/qa/vitals.cjs http://localhost:3100 [--throttle]  # lab LCP / CLS / long tasks / transfer per route
node scripts/qa/sweep.cjs <outDir> http://localhost:3100 / /c/women   # scrolling screenshots for visual review
node scripts/qa/image-audit.mjs                              # flat / black / blown-out / orphaned images, pin sanity
node scripts/qa/shot.cjs <url> <out.png> [--full] [--mobile]  # screenshot + console/network health check
npm run art:manifest && npm run art:render                   # regenerate + render all imagery (~5 min, 3 workers)
```

## Milestones (PRD build order)

| # | Milestone | Status |
|---|-----------|--------|
| 01 | **Foundation** — architecture, tokens, type, global styles, responsive layout, reusable UI kit | ✅ done |
| 02 | **Shopping discovery** — adaptive Home, live-structure header (department row, dropdowns, More tiles, Account menu), footer, search + suggestions, category/edit/label pages, PLP with URL-encoded filters & sort | ✅ done |
| 03 | **Product experience** — PDP in the live structure (thumbnail rail + picture, info order, delivery, coupons, Product Information, Rating & Reviews, About the brand, four rails, Size Guide drawer, FLIP), wishlist, quick view, notify-me | ✅ done |
| 04 | **Commerce** — bag drawer + page (Price Summary, savings banner, sticky Proceed to Buy), cart hover preview, coupons, price maths, login modal + OTP, addresses, 3-step checkout, payment selection, simulated confirmation | ✅ done |
| 05 | **Account** — profile, addresses, saved payments (simulated), wishlist, order history, order detail, tracking timeline, cancel / return | ✅ done |
| 07 | **Live-site fidelity (v3)** — 15 screenshots + the supplied wordmark became the source of truth: tokens, header, department row, More tiles, Account / Cart menus, footer, login modal, bag drawer, wishlist, PDP | ✅ done (content stays sample — see "Content status") |
| 06 | **Final polish** — motion, loading/empty/error states, a11y, performance, responsive refinement | ✅ done (limits listed below) |
| — | **Imagery** — procedural art engine (`scripts/art`): 25 product kinds, 47 editorial scenes with shoppable pins | ✅ done — all 557 images rendered and committed |

## Routes

`/` · `/discover` · `/discover/[story]` · `/edits` · `/edits/[edit]` · `/c/[...category]` · `/brands` · `/brands/[label]` · `/p/[product]` · `/search?q=` · `/offers` · `/wishlist` · `/bag` · `/login` · `/checkout` · `/checkout/confirmation/[id]` · `/account` · `/account/orders` · `/account/orders/[id]` · `/account/addresses` · `/account/payments` · `/help` · `/info/[page]` (About, Careers, Press, Shipping & Return, Terms, Privacy, Responsible Disclosure, Sell …) · `/sitemap` · `/prototype` · 404 + error boundary.

## What is simulated (always labelled in the UI)

Personalisation / intent engine (localStorage heuristics) · OTP sign-in (code is `123456`) · payments and saved payments (test values shown; `fail@upi` and card `…0002` decline on purpose; only a UPI ID or a card’s brand and last four digits are stored) · orders, tracking & returns · reviews · delivery estimates · coupons (`TASTE10`, `FIRSTEDIT`, `GEMS15`, `HOUSE200`) · back-in-stock alerts · analytics events (logged locally, PRD §8.1).

The **Prototype** panel (footer → “Prototype controls”, or the menu drawer on phones) lets a reviewer force intent states, add latency, fail the next request, hide a home module (partial failure), read the event log, sign in as the demo account, and reset everything.

## Decisions

- **Stack:** PRD §9.1 — Next.js + TypeScript + Tailwind + Framer Motion + Lucide. Repo was empty, so scaffolded with the current `create-next-app` (Next 16.4, Cache Components, Turbopack). No other runtime deps.
- **Cache Components rules respected:** no `Date.now()`/`Math.random()` during render (`useNow`, seeded PRNG), `useSearchParams` behind `<Suspense>`, `await params` behind `<Suspense>` with skeletons, header wrapped for `usePathname`.
- **State:** a ~60-line external store (`src/lib/store.ts`) on `useSyncExternalStore` with localStorage/sessionStorage persistence — hydration-safe, no state library.
- **Data model:** PRD §6.5 in `src/data/*`. Plain erasable TypeScript so Node scripts import it directly.
- **Brands:** House of Nykaa labels are used as named in the PRD; every other label/product is fictional (no implied real catalogue or prices).
- **Typography:** one family — Inter at optical size 32 (`font-variation-settings: "opsz" 32` = Inter Display) via `next/font`, no other face anywhere; headings weight 700 with raspberry emphasis; small text keeps the same optical size (a deliberate trade-off: slightly tighter than the text cut, offset with +0.004em tracking). ₹ comes from Inter's latin-ext subset. **Flat rules:** no `box-shadow`/`ring`/`drop-shadow`/gradient/backdrop-blur/blend/grain; focus is a 2px outline; overlays are a 1px line over a flat scrim; corners are 4px on controls (a layered base rule), pills for size/filter chips and toggles, 16px on dialogs, square on images and cards, circles by nature (avatars, swatches, pins, radios, count badges). Enforced by `scripts/qa/flat.cjs`. **Palette:** page `#fff`, surfaces `#f7f8f8`/`#f0f4f4`, ink `#1c2834`, navy `#001425` (primary buttons), raspberry `#982854` (links, active underlines, badges; AA 7.6:1 on white), green `#357a41` (savings), blue `#2b62d4` (labels), maroon `#6c1038` (login band), wordmark magenta `#FC2779` (logo artwork only).
- **Image loading policy:** every `<Img>` takes a `load` hint — `preload` for the single LCP image visible at every breakpoint, `eager` for the first grid row, `high` for desktop-only images (lazy, so a hidden copy never downloads, but first in the queue when shown); default is lazy. The home hero is one art-directed `<picture>` (tall cover on phones, wide on desktop) so a phone never fetches or preloads the other. Rails and below-the-fold grids never preload.
- **Touch targets (PRD §7.4):** standalone controls are 44px; small text links get an invisible 44px hit area on coarse pointers (`tap` utility); small buttons grow to 44px on touch (`Button size="sm"`, quick add, helpful). Footer links get 44px pitch on touch.
- **Imagery:** the sandbox cannot reach any photo host and the connected AI-image account has 0 credits, so imagery is generated procedurally (SVG → shaded in JS → sharp → WebP) by `scripts/art` from the same catalogue data: 510 product shots (front / back / detail per piece, 25 kinds incl. men/kids adaptations) and 47 editorial scenes (rail, floor, tonal motifs, shared light) whose pin coordinates and wall colours land in `image-meta.json`. Pieces keep their authored backdrop unless contrast against it is under 1.9:1 (a black blazer on olive-black reads as a smudge), then fall back to the category's light palette. Images are *files*: replace `public/img/<key>.webp` with a photograph of the same name and the page keeps working (re-measure pins in `image-meta.json`). Contract and options: `scripts/art/README.md`; `docs/ART_ENGINE_BRIEF.md`.

## Next steps (outside this prototype's scope)

- [ ] **First-row SSR for listings.** Filters live in the URL, so results are computed after hydration; on a throttled phone (4x CPU, 1.6 Mbps) PLP, search and bag LCP is ~3.7–3.9 s versus ~1.1 s on pages whose hero is in the HTML. Rendering the default first row on the server (or reading `searchParams` in a server component) is the fix.
- [ ] **Import the live catalogue.** The live site's CDN refuses this environment, so products, prices, ratings and banners are sample data. Supply an export (HAR / JSON / CSV, or saved pages) from a normal browser and replace `src/data/{catalog-defs,labels,home-content}.ts`; add Global Store, Revolve, Fitzone, Lingerie and Activewear if they should be browsable.
- [ ] **Cart preview after "Add to Bag".** The live site drops the cart preview under the header Cart on add; here the bag drawer opens on desktop (the preview shows on hover). Saved-UPI quick-fill chips at checkout are also not built.
- [ ] **Real photography.** Swap files in `public/img` and re-measure pin positions; the app needs no code change.
- [ ] **Manual assistive-tech pass** (VoiceOver / NVDA) and a real-device touch pass — automated checks are not a conformance audit.
- [ ] **Engine polish:** footwear and jewellery are stylised, boots/loafers/block heels have crude toe boxes, every sneaker style shares one outline, kids/men are proportion changes rather than separate construction, bag side faces and backpack straps are crude, tank/bodysuit/peplum hems are generic.
- [ ] Optional: hero parallax, further `Reveal` stagger tuning.

## Blocked / limitations

- No real payments, orders, SMS/email, recommender or analytics backend — by design (PRD §3.4/§9.2). Fulfilment (delivery, returns, refunds) is a *parallel business track* the PRD explicitly excludes; the redesign's impact ceiling depends on it.
- iOS app is a later phase (PRD §3.6); this is responsive web.

## QA log

Everything below runs with one command against a production server: `scripts/qa/prod.sh 3100 && npm run qa` (Playwright; `scripts/qa/all.sh`).

- `scripts/contrast.mjs` — reads the tokens from `globals.css`; every text/background pair the UI draws is **≥ 4.5:1** (raspberry on white 7.6, green on grey 4.7, blue on its tint 4.8).
- `scripts/qa/nav.cjs` — header (utility strip, department row, hover preview, dropdowns with "Shop All" first, What's New / Sale as real filtered listings, More tiles, Account menu + login modal, Fashion | Luxe), keyboard open / Tab / Esc on dropdowns and More, hide-on-scroll, bag drawer focus return; phone: menu drawer, shop sheet, bottom nav, search: **all pass**.
- `scripts/qa/home.cjs` — sale banner controls, category / price / celebration / brand tiles, "Just landed" tabs, carousels (arrows, keyboard, touch peek), save + quick view, newsletter, footer links + Prototype controls, desktop and phone: **all pass**.
- `scripts/qa/links.cjs` — every link reachable from the header, dropdowns, More, Account menu, mobile menu, shop sheet, footer and home resolves (136), and every filtered listing link (What's New, Sale, Western Wear, Luxe …) opens onto products (40): **all pass**.
- `scripts/qa/flat.cjs` — no shadow / gradient / filter / blend anywhere (routes x 390 and 1280, overlays included), one family (Inter, opsz 32), corners only 4px · 8px · pill/circle · 16px: **clean**.
- `scripts/qa/grid.cjs` — every sizeable image starts and ends on a column line (or bleeds to the edge) at 390 / 820 / 1280 / 1728: **clean**.
- `scripts/qa/overflow.cjs` — every route at 360 / 390 / 820 / 1280 (+ search overlay, bag drawer on desktop): **no horizontal overflow**.
- `scripts/qa/keyboard.cjs` — skip link, search combobox, bag drawer focus trap + return to Cart, department dropdown and More from the keyboard, size radios, carousels, quick view, reduced motion: **all pass**.
- `scripts/qa/journey.cjs` — 21-step end-to-end journey (home → edit → filter URL/back → PDP → size gate → bag → coupon → login → checkout → forced payment failure → success → tracking → addresses → search → no-results → sold-out/notify → story pin → deal intent → 404): **passes on desktop (1440×900) and mobile (390×844)**, no console errors.
- `scripts/qa/a11y.cjs` (axe-core, WCAG 2.1 A/AA + best-practice) — **0 violations on 23 pages at desktop and at mobile** (public + signed-in), plus the overlays and states each page agent audited (drawers, dialogs, login modal, checkout steps).
- `scripts/qa/vitals.cjs` (production build, lab) — unthrottled LCP 144–460 ms, CLS 0, no long task over 55 ms on 7 routes x mobile + desktop. Throttled mobile (4x CPU, slow 4G): home / PDP / edit ≈ 1.1 s, story ≈ 2.0 s; PLP, search and bag ≈ 3.7–3.9 s because their first row is computed after hydration (see Next steps). Initial JS ≈ 340–376 KB gzip (the catalogue and data are in the bundle; the header and rails added ≈ 25 KB over the previous build).
- `scripts/qa/image-audit.mjs` — 557 art files + the placeholder photographs: none flat, near-black, blown-out or orphaned; every meta entry has a file; all pins inside the frame.
- `next build` (production, Cache Components) ✅ · `npm run typecheck` ✅ · `npm run lint` ✅ (0 errors, 0 warnings) · `npm run data:check` ✅ (112 products, 9 edits, 6 stories, 47 scenes)
- Automated + keyboard checks are not a full WCAG conformance audit; manual screen-reader testing has not been done.
- Not verified: anything against the live site (unreachable — see "Content status"); real-device touch behaviour.
