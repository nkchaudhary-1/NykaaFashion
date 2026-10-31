# Nykaa Fashion — redesign prototype

An improved Nykaa Fashion: the **existing identity is kept** — white surfaces, slate text, navy primary buttons (Add to Bag, Proceed to Buy), the raspberry accent for links and active states, green for savings, blue "Responsible" labels, the supplied wordmark, the live header (Women · Men · Kids · Home · More ▾ over a department row with What’s New, Sale and categories, a Fashion | Luxe switch, Account / Wishlist / Cart), the live footer, login modal and bag drawer, and the live homepage module stack (sale banner → category tiles → Celebration-ready categories → Iconic brands, unreal savings → Build Diwali wardrobe → SEO copy) — while the structure is rebuilt on one strict 12-column grid (4 on phones) with a different composition per section, flat colour, no shadows and a single typeface (Inter Display). Grid contract: [`docs/GRID_SYSTEM.md`](docs/GRID_SYSTEM.md); original brief: [`docs/PRD.md`](docs/PRD.md).

> **This is a design prototype.** Brand names mirror the live site, but every product, price, discount stamp, story and person is **sample data** (the live catalogue could not be read from the build environment — see "Live content" below). Checkout, payments, OTP sign-in, orders, tracking, reviews and personalisation are **simulated** and labelled as such. No payment is taken and no order exists.

See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for milestones, decisions and QA, and `/prototype` in the running app for reviewer notes.

## Two designs, two branches

| Branch | What it is |
|---|---|
| `claude/nykaa-fashion-grid-redesign` | **The current design** — the live Nykaa Fashion look on the strict grid: white surfaces, slate ink, navy buttons. Unchanged. |
| `claude/nykaa-fashion-awards` | **The awards-style version** — same structure, pages and behaviour, in an editorial register: warm studio-paper surfaces, poster-scale type, much bigger photography on the home page, and a motion layer (smooth scroll, word-mask headline reveals, picture reveals, parallax, ticker, follower cursor with Drag/View labels, page fades). Art direction and the motion primitives: [`docs/AWARDS_DIRECTION.md`](docs/AWARDS_DIRECTION.md). |

Switch with `git checkout <branch> && npm ci`. Motion always has a way out: it is off for visitors who prefer reduced motion, smooth scroll and the cursor are off on touch screens, and nothing is hidden when JavaScript is off or fails (`scripts/qa/motion.cjs` checks all four).

## Run it

Needs **Node 20.9 or newer** (22 recommended — there is an `.nvmrc`) and npm. No API keys, no database, no network access to any font or image host: everything is in the repo.

```bash
git clone https://github.com/nkchaudhary-1/NykaaFashion.git && cd NykaaFashion
git checkout claude/nykaa-fashion-grid-redesign   # the repo's default branch is the earlier design — this is the live-identity version
# git checkout claude/nykaa-fashion-awards         # …or the awards-style version (see "Two designs" above)
npm ci                                            # or: npm install
npm run dev                                       # → http://localhost:3000
```

The first page compiles for 10–30 s (Turbopack builds the catalogue and every module on demand); after that pages are quick. For the production build: `npm run build && npm start`.

If something does not start, run **`npm run doctor`** — it checks the Node version, installed dependencies, which version of the prototype you have, the font files and port 3000, and says how to fix each.

## Host it on Vercel, behind a password

The app has its own password gate (`src/proxy.ts`), so any host works and it does not depend on a paid Vercel plan.

1. **Import** `nkchaudhary-1/NykaaFashion` at vercel.com → *Add New → Project* (Next.js is detected; no build settings needed). One-click version: [Deploy](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnkchaudhary-1%2FNykaaFashion&env=SITE_PASSWORD&envDescription=The%20password%20visitors%20must%20enter&project-name=nykaa-fashion-prototype).
2. **Password:** *Settings → Environment Variables* → add `SITE_PASSWORD` (the password you will share) for **Production and Preview**. Optional: `GATE_SECRET` (any long random string) signs the session cookie; without it the password itself does, so changing the password signs everyone out.
3. **Which design is live:** *Settings → Git → Production Branch*. The repo's default branch is the earlier design — pick `claude/nykaa-fashion-grid-redesign` for the current one. Every other branch (for example the awwwards-style one) gets its own preview URL automatically, with the same password.
4. **Sharing outside your Vercel team:** Vercel protects *preview* deployments with Vercel Authentication by default (team members only). If the people who need to see it are not on your team, turn that off under *Settings → Deployment Protection*; the password page then does the protecting.
5. **Deploy.** Visitors see a "Private preview" sign-in page; a correct password sets a signed, HttpOnly cookie for a week.

What the gate does: every page, API route and picture needs the cookie; only the sign-in page's own font, the logo and `robots.txt` (Disallow all) are public, and every response carries `X-Robots-Tag: noindex`. A wrong password waits 0.7 s before answering. If `SITE_PASSWORD` is **not** set on Vercel, the deployment answers `503 Locked` instead of going public (set `SITE_GATE=off` to publish openly on purpose). On Vercel the pictures are served straight from `/img` (behind the cookie) rather than through the image optimiser, because the optimiser fetches its source without the visitor's credentials. Locally nothing changes unless you set the variable; to try it: `SITE_PASSWORD=secret npm run build && SITE_PASSWORD=secret npm start`.

## Stack

Next.js 16 (App Router, Cache Components, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide · Lenis (smooth scroll, awards branch). No other runtime dependencies. Mock JSON-style data modules and `localStorage` persistence, structured so real APIs can slot in.

## Commands

```bash
npm install
npm run dev               # dev server
npm run build && npm start
npm run typecheck && npm run lint
npm run data:check        # validate every cross-reference in src/data
npm run photos            # re-cut every image on the site from the two supplied photographs (scripts/placeholders)
npm run doctor            # why won't it start? (Node, dependencies, version, fonts, port)
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
node scripts/qa/motion.cjs   http://localhost:3100              # awards branch: reveals settle, smooth scroll, cursor, drag rails, page fade, reduced-motion / no-JS / failed-hydration fallbacks
node scripts/qa/vitals.cjs   http://localhost:3100 [--throttle] # lab LCP / CLS / long tasks / transfer per route
node scripts/qa/sweep.cjs <outDir> http://localhost:3100 / /c/women   # scrolling screenshots for visual review
```

## Structure

```
src/app/            routes (App Router)
src/components/     ui/ (kit) · layout/ · motion/ (reveals, smooth scroll, cursor, ticker, parallax) · product/ · plp/ · home/ · editorial/ · commerce/ · account/
src/data/           types · labels · categories · catalog-defs → catalog · edits · stories · scenes · commerce · content
src/lib/            store · filters · search · recs · pricing · intent helpers · flip · mockApi · a11y
src/stores/         wishlist/bag · account/orders · intent · checkout · ui/toasts/prefs
scripts/placeholders/ the two supplied photographs and the tool that cuts every image from them
scripts/qa/         Playwright journey · nav · home · links · flat · grid · overflow · keyboard · a11y · vitals · screenshot tools
public/brand/       the supplied wordmark (inlined by components/layout/Logo.tsx)
docs/               PRD · grid system · awards direction
```

## Live content

The look, structure and copy of the header, footer, product page, bag drawer, wishlist and login follow 15 screenshots of the live site that were supplied for this work. Brand names, category and footer labels and navigation wording are taken from them. **Products, prices, ratings, discounts and stories are sample data** — the build environment cannot read `www.nykaafashion.com` (even with the domain allowed in the environment’s network policy, the site’s CDN answers `403 Access Denied` to this environment), so the live catalogue could not be imported. Footer and menu entries the sample catalogue cannot back (watches, toys, brands such as Biba or W …) are left out rather than linked to empty pages. To swap in real data, replace the modules in `src/data` (types in `src/data/types.ts`) with an export of the live catalogue; nothing else in the app depends on the sample content.

## Imagery

**Every image on the site is cut from the two photographs that were supplied** (`scripts/placeholders/source/`: a kurta set and a cream co-ord on a bouclé chair) — nothing is generated, recoloured or added. `npm run photos` rebuilds all 571 files in `public/img/<key>.webp`:

- `build.mjs` makes the named ratio versions (3:4 · 4:5 · 1:1 · 16:9 · 16:9 with copy space · 9:16 · 3:2) in `public/img/placeholders/`; where a portrait window reaches past the photograph, the seamless studio backdrop is extended — never the figure.
- `fill.mjs` cuts every other key at its own size: a product's name decides the window (Indian wear and kids → the kurta set, western → the suit, footwear → the shoes, jewellery → the earrings, soft furnishings → the bouclé chair, decor → the vases); front / alt / detail views and colour variants are different windows or mirrors, so galleries and swatches still change the picture; editorial scenes get full-figure, wide and close crops, and their shoppable pins are placed on the garment that is actually in frame.
- `src/data/generated/image-meta.json` holds each image's size, average colour, blur preview, wall/floor edge colours and pin positions; `node scripts/qa/image-audit.mjs` checks files and metadata agree.

To use real photography later, replace a file with a photograph of the same name (and re-measure its `pins` in `image-meta.json` if it has any); nothing else changes.
