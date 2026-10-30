# Nykaa Fashion — redesign prototype

An improved Nykaa Fashion: the **existing identity is kept** — white surfaces, slate text, navy primary buttons (Add to Bag, Proceed to Buy), the raspberry accent for links and active states, green for savings, blue "Responsible" labels, the supplied wordmark, the live header (Women · Men · Kids · Home · More ▾ over a department row with What’s New, Sale and categories, a Fashion | Luxe switch, Account / Wishlist / Cart), the live footer, login modal and bag drawer, and the live homepage module stack (sale banner → category tiles → Celebration-ready categories → Iconic brands, unreal savings → Build Diwali wardrobe → SEO copy) — while the structure is rebuilt on one strict 12-column grid (4 on phones) with a different composition per section, flat colour, no shadows and a single typeface (Inter Display). Grid contract: [`docs/GRID_SYSTEM.md`](docs/GRID_SYSTEM.md); original brief: [`docs/PRD.md`](docs/PRD.md).

> **This is a design prototype.** Brand names mirror the live site, but every product, price, discount stamp, story and person is **sample data** (the live catalogue could not be read from the build environment — see "Live content" below). Checkout, payments, OTP sign-in, orders, tracking, reviews and personalisation are **simulated** and labelled as such. No payment is taken and no order exists.

See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for milestones, decisions and QA, and `/prototype` in the running app for reviewer notes.

## Stack

Next.js 16 (App Router, Cache Components, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide. No other runtime dependencies. Mock JSON-style data modules and `localStorage` persistence, structured so real APIs can slot in.

## Commands

```bash
npm install
npm run dev               # dev server
npm run build && npm start
npm run typecheck && npm run lint
npm run data:check        # validate every cross-reference in src/data
npm run art:manifest      # build the image-render manifest from catalogue + scene data
npm run art:render        # render imagery (scripts/art) into public/img (overwrites placeholders)
npm run art:placeholders  # fast tonal placeholders for any image that has no file yet
```

QA tools (Playwright; run against a production server — `scripts/qa/prod.sh 3100` builds and starts one, or point them at `npm run dev` on another port):

```bash
node scripts/qa/journey.cjs  http://localhost:3100 [--mobile]   # 21-step end-to-end shopping journey
node scripts/qa/nav.cjs      http://localhost:3100              # header (department row, dropdowns, More, Account), mobile menu, bottom nav, search
node scripts/qa/home.cjs     http://localhost:3100 [--mobile]   # home modules: banner, tiles, carousels, newsletter, footer
node scripts/qa/links.cjs    http://localhost:3100              # every nav/footer link resolves; filtered listings are never empty
node scripts/qa/flat.cjs     http://localhost:3100              # no shadows / gradients / filters, one typeface, corner policy (4px · pill · 16px)
node scripts/qa/grid.cjs     http://localhost:3100              # every block sits on the 12/4-column grid at 4 widths
node scripts/qa/overflow.cjs http://localhost:3100              # horizontal-overflow scan, every route x 4 widths + overlays
node scripts/qa/keyboard.cjs http://localhost:3100              # keyboard-only checks (skip link, combobox, focus traps, dropdowns…)
node scripts/qa/a11y.cjs     http://localhost:3100              # axe-core on every page (npm i --no-save axe-core first)
node scripts/qa/vitals.cjs   http://localhost:3100 [--throttle] # lab LCP / CLS / long tasks / transfer per route
node scripts/qa/sweep.cjs <outDir> http://localhost:3100 / /c/women   # scrolling screenshots for visual review
```

## Structure

```
src/app/            routes (App Router)
src/components/     ui/ (kit) · layout/ · product/ · plp/ · home/ · editorial/ · commerce/ · account/
src/data/           types · labels · categories · catalog-defs → catalog · edits · stories · scenes · commerce · content
src/lib/            store · filters · search · recs · pricing · intent helpers · flip · mockApi · a11y
src/stores/         wishlist/bag · account/orders · intent · checkout · ui/toasts/prefs
scripts/art/        procedural imagery engine (SVG → sharp → WebP)
scripts/qa/         Playwright journey · nav · home · links · flat · grid · overflow · keyboard · a11y · vitals · screenshot tools
public/brand/       the supplied wordmark (inlined by components/layout/Logo.tsx)
docs/               PRD · art-engine brief
```

## Live content

The look, structure and copy of the header, footer, product page, bag drawer, wishlist and login follow 15 screenshots of the live site that were supplied for this work. Brand names, category and footer labels and navigation wording are taken from them. **Products, prices, ratings, discounts and stories are sample data** — the build environment cannot read `www.nykaafashion.com` (even with the domain allowed in the environment’s network policy, the site’s CDN answers `403 Access Denied` to this environment), so the live catalogue could not be imported. Footer and menu entries the sample catalogue cannot back (watches, toys, brands such as Biba or W …) are left out rather than linked to empty pages. To swap in real data, replace the modules in `src/data` (types in `src/data/types.ts`) with an export of the live catalogue; nothing else in the app depends on the sample content.

## Imagery

No photo host was reachable when this was built, so imagery is generated by `scripts/art` (see its [README](scripts/art/README.md)) from the catalogue data and written to `public/img/<key>.webp` (keys live in `src/data/catalog.ts` and `src/data/scenes.ts`). **Replace any file with a photograph of the same name and nothing else changes.** `src/data/generated/image-meta.json` holds each image's average colour (used as the loading placeholder) and the pin positions for shoppable editorial images.
