# PROJECT STATUS — Nykaa Fashion redesign (prototype)

_Source of truth: [`docs/PRD.md`](docs/PRD.md). Last updated: 30 Oct 2026._

**Thesis:** make *curation* the default way to discover (taste, not discount). Edits sit beside Shop and Discover in the primary nav; the homepage is intent-adaptive (cold → curation, returning → "picked for you" rail, deal → offers promoted). Everything backend-shaped is **simulated and labelled**.

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
node scripts/qa/shot.cjs <url> <out.png> [--full] [--mobile]  # screenshot + console/network health check
```

## Milestones (PRD build order)

| # | Milestone | Status |
|---|-----------|--------|
| 01 | **Foundation** — architecture, tokens, type, global styles, responsive layout, reusable UI kit | ✅ done |
| 02 | **Shopping discovery** — adaptive Home, header + mega menus, search + suggestions, category/edit/label pages, PLP with URL-encoded filters & sort | ✅ done |
| 03 | **Product experience** — PDP (gallery, zoom, FLIP, sizes, size guide, reviews, complete-the-look, recommendations), wishlist, quick view, notify-me | ✅ done |
| 04 | **Commerce** — bag, qty, coupons, price maths, OTP login/registration, addresses, 3-step checkout, payment selection, simulated confirmation | ✅ done |
| 05 | **Account** — profile, addresses, wishlist, order history, order detail, tracking timeline, cancel / return | ✅ done |
| 06 | **Final polish** — motion, loading/empty/error states, a11y, performance, responsive refinement | 🔄 in progress (see Pending) |
| — | **Imagery** — procedural art engine (`scripts/art`) replacing placeholder renders | 🔄 in progress (agent-built engine; placeholders in place) |

## Routes

`/` · `/discover` · `/discover/[story]` · `/edits` · `/edits/[edit]` · `/c/[...category]` · `/brands` · `/brands/[label]` · `/p/[product]` · `/search?q=` · `/offers` · `/wishlist` · `/bag` · `/login` · `/checkout` · `/checkout/confirmation/[id]` · `/account` · `/account/orders` · `/account/orders/[id]` · `/account/addresses` · `/help` · `/info/[page]` · `/prototype` · 404 + error boundary.

## What is simulated (always labelled in the UI)

Personalisation / intent engine (localStorage heuristics) · OTP sign-in (code is `123456`) · payments (test values shown; `fail@upi` and card `…0002` decline on purpose) · orders, tracking & returns · reviews · delivery estimates · coupons (`TASTE10`, `FIRSTEDIT`, `GEMS15`, `HOUSE200`) · back-in-stock alerts · analytics events (logged locally, PRD §8.1).

The **Prototype** panel (bottom-right) lets a reviewer force intent states, add latency, fail the next request, hide a home module (partial failure), read the event log, sign in as the demo account, and reset everything.

## Decisions

- **Stack:** PRD §9.1 — Next.js + TypeScript + Tailwind + Framer Motion + Lucide. Repo was empty, so scaffolded with the current `create-next-app` (Next 16.4, Cache Components, Turbopack). No other runtime deps.
- **Cache Components rules respected:** no `Date.now()`/`Math.random()` during render (`useNow`, seeded PRNG), `useSearchParams` behind `<Suspense>`, `await params` behind `<Suspense>` with skeletons, header wrapped for `usePathname`.
- **State:** a ~60-line external store (`src/lib/store.ts`) on `useSyncExternalStore` with localStorage/sessionStorage persistence — hydration-safe, no state library.
- **Data model:** PRD §6.5 in `src/data/*`. Plain erasable TypeScript so Node scripts import it directly.
- **Brands:** House of Nykaa labels are used as named in the PRD; every other label/product is fictional (no implied real catalogue or prices).
- **Typography:** Instrument Serif (display) + Geist (UI). ₹ is only in Geist's latin-ext subset, so the display stack falls back to Geist for it. Pink never carries text (white-on-`#e80071` is 4.50:1); CTAs are ink; accent text uses `pink-ink`.
- **Image loading policy:** every `<Img>` takes a `load` hint — `preload` for the single LCP image visible at every breakpoint, `eager` for the first grid row, `high` for desktop-only images (lazy, so a hidden copy never downloads, but first in the queue when shown); default is lazy. The home hero is one art-directed `<picture>` (tall cover on phones, wide on desktop) so a phone never fetches or preloads the other. Rails and below-the-fold grids never preload.
- **Touch targets (PRD §7.4):** standalone controls are 44px; small text links get an invisible 44px hit area on coarse pointers (`tap` utility); small buttons grow to 44px on touch (`Button size="sm"`, quick add, helpful). Footer links get 44px pitch on touch.
- **Imagery:** the sandbox cannot reach any photo host and the connected AI-image account has 0 credits, so imagery is generated procedurally (SVG → sharp → WebP) from the same catalogue data. Images are *files*: replace `public/img/<key>.webp` with a photograph of the same name and nothing else changes.

## Pending

- [x] Mobile horizontal overflow — fixed (implicit grid tracks); `overflow.cjs` reports none at 360/390/820/1280.
- [ ] Swap placeholder renders for the art engine's output (`npm run art:manifest && npm run art:render`) and review at desktop + mobile. Built-kind products render today; scenes (editorial covers, pins) and 10 remaining kinds are the engine's Phase B.
- [ ] Visual QA sweep of every route at 390 / 820 / 1280 / 1728 widths with real imagery.
- [x] Accessibility audit pass (axe + keyboard) — see QA log. Still to do: contrast re-check on text over real imagery.
- [ ] Performance pass on production build (bundle size, LCP images, `image-meta.json` payload).
- [ ] Optional: `Reveal` stagger tuning, hero parallax, FLIP polish.

## Blocked / limitations

- No real payments, orders, SMS/email, recommender or analytics backend — by design (PRD §3.4/§9.2). Fulfilment (delivery, returns, refunds) is a *parallel business track* the PRD explicitly excludes; the redesign's impact ceiling depends on it.
- iOS app is a later phase (PRD §3.6); this is responsive web.

## QA log

- `scripts/qa/journey.cjs` — 21-step end-to-end journey (home → edit → filter URL/back → PDP → size gate → bag → coupon → login → checkout → forced payment failure → success → tracking → addresses → search → no-results → sold-out/notify → story pin → deal intent → 404): **passes on desktop (1440×900) and mobile (390×844)**.
- `scripts/qa/a11y.cjs` (axe-core, WCAG 2.1 A/AA + best-practice) — **0 violations on 23 pages at desktop and mobile** (public + signed-in surfaces). Found and fixed 71 violation types along the way (tab semantics, label-in-name, heading order, landmarks, definition lists, opacity-based low contrast, carousel keyboard access).
- `scripts/qa/keyboard.cjs` — skip link, search combobox, overlay focus trap + focus return, mega menu from keyboard, size radios, carousel arrows, reduced motion: **all pass**.
- `scripts/qa/overflow.cjs` — walks 23 routes (+ 4 signed-in) at 360 / 390 / 820 / 1280 plus the search and bag overlays and flags any element past the viewport: **none**. (It found 32 issues first: CSS grids that only declared breakpoint columns got an implicit auto track that stretched to max-content; every such grid now has a `grid-cols-1` base.)
- Focus styling: the global `:focus-visible` ring lives in `@layer base`, so `outline-none` / `focus-visible:ring-*` utilities on components actually apply (inputs get a 2px ink underline or ring, round buttons keep their round ring).
- Dev-mode smoke (`next dev`): 21 routes x desktop + mobile — no console errors or warnings, no error overlay (hydration included). Dev-only LCP warnings are false positives from the same image appearing several times on a page.
- Touch-target audit (390px, 21 routes incl. signed-in): remaining sub-44px items are inline/footer text widths and `tap`-expanded links; heights meet 44px.
- Production build (`next build`, 212 static pages) ✅ · `npm run typecheck` ✅ · `npm run lint` ✅ · `npm run data:check` ✅
- Automated + keyboard checks are not a full WCAG conformance audit; manual screen-reader testing has not been done.
