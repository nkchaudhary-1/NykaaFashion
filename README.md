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

## Staging first, production when it is final

New work is built on **`claude/nykaa-fashion-staging`** and published to a separate review site (`https://nykaafashion-neelesh-staging.vercel.app`, behind the same sign-in, marked by a yellow *Staging* strip); the live prototype (`claude/nykaa-fashion-awards`) changes only when the owner says a build is final: `scripts/release/deploy.sh staging` · `PROMOTE=yes scripts/release/deploy.sh production`. Procedure, promotion and rollback: [`docs/RELEASE.md`](docs/RELEASE.md). Currently on staging: a **full-bleed home layout** with no gutters between pictures ([`docs/BLEED_LAYOUT.md`](docs/BLEED_LAYOUT.md), switch in *Prototype controls → Home layout* or `?layout=bleed`) and an endless **"Keep exploring" feed** on the home and product pages ([`docs/RABBIT_HOLE.md`](docs/RABBIT_HOLE.md)). A 97-second **launch video** for the new look is built from the site itself with `scripts/video/build.sh` ([`docs/LAUNCH_VIDEO.md`](docs/LAUNCH_VIDEO.md)).

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
2. **Access:** *Settings → Environment Variables* → add `SITE_USERS` (named accounts — see "Accounts, roles and the admin dashboard"), or `SITE_PASSWORD` for one shared password, (the password you will share) for **Production and Preview**. **Recommended with accounts:** `GATE_SECRET` (any long random string, set as a sensitive variable) signs the session cookie and the sign-ins issued from the admin dashboard; without it the account list itself — passwords included — is the signing key, and editing it signs everyone out and ends every issued sign-in. `SITE_REVOKED` (comma-separated Login IDs) switches issued sign-ins off. Optional: `SITE_EXPIRES` closes the preview at a set time.
3. **Which design is live:** *Settings → Git → Production Branch*. The repo's default branch is the earlier design — pick `claude/nykaa-fashion-grid-redesign` for the current one (or `claude/nykaa-fashion-awards` for the awards-style one). Every other branch gets its own preview URL automatically, with the same password — so with the grid branch as Production, the awards branch is always available at its own preview URL (*Deployments → the branch's latest → Visit*).
4. **Deploying from the command line instead** (no GitHub connection needed): `npx vercel link`, then `vercel env add SITE_PASSWORD production` and `… preview`, then `vercel deploy --prod`. `.vercelignore` keeps local build caches out of the upload (Vercel rejects files over 100 MB). Set the password **before the first build** — the app serves pictures directly (instead of through the image optimiser) only when `SITE_PASSWORD` exists at build time, so if you add it later, redeploy.
5. **Sharing outside your Vercel team:** Vercel protects *preview* deployments with Vercel Authentication by default (team members only). If the people who need to see it are not on your team, turn that off under *Settings → Deployment Protection*; the password page then does the protecting.
6. **Deploy.** Visitors see a "Private preview" sign-in page; a correct password sets a signed, HttpOnly cookie for a week.

What the gate does: every page, API route and picture needs the cookie; only the sign-in page's own font, the share-card image and `robots.txt` are public, and every response carries `X-Robots-Tag: noindex`. A wrong password waits 0.7 s before answering. If `SITE_PASSWORD` is **not** set on Vercel, the deployment answers `503 Locked` instead of going public (set `SITE_GATE=off` to publish openly on purpose). On Vercel the pictures are served straight from `/img` (behind the cookie) rather than through the image optimiser, because the optimiser fetches its source without the visitor's credentials. Locally nothing changes unless you set the variable; to try it: `SITE_PASSWORD=secret npm run build && SITE_PASSWORD=secret npm start`.

## Accounts, roles and the admin dashboard

The website is opened with **named accounts** instead of one shared password. The sign-in page asks for a **Login ID** and **password**.

| Account | Role | Can |
|---|---|---|
| Nilesh | Admin | use the site, open **Admin dashboard** (`/admin`): total logins per user, each user's login history with date and time, last login, a 14-day chart, export to CSV, clear history, **add users** |
| Kiran (Director) | Regular user | use the site normally; cannot open `/admin`, see login statistics or change accounts |

How it works — and where it is honest about its limits:

* **The server checks the password and the role.** Accounts live in the `SITE_USERS` environment variable (JSON, see `.env.example`) — never in the code or the browser bundle, so the passwords are not in this repository. After a correct sign-in the server sets a signed, HttpOnly session cookie naming the account; the role is looked up from the configuration on every request, so editing the cookie changes nothing. `/admin` is refused to everyone but admins **by the server** (403) before the page or any of its code is sent, and the dashboard checks the verified session again before drawing anything.
* **Log in / out:** *Log out* (top bar on desktop, menu on phones) posts to the server, which ends the session. Failed attempts are refused after a short delay and are never counted.
* **Login records are kept in the browser** (localStorage, one key per account: `nf.logins.v1.<id>`). A login is counted once, only after the server confirmed it — a one-time cookie set at sign-in is turned into a record, then deleted — so refreshing, opening more tabs or signing out never changes the count, and the history survives all of them.
* **What that means:** the dashboard shows the sign-ins made **in the browser you are viewing it in**. If Kiran signs in on his own laptop, Nilesh's dashboard will not see it; and anyone who can open a browser's developer tools can read, edit or delete that browser's records. This is a temporary, no-database build. Records that cannot be edited and that cover every device need a server-side store.
* **Add a user** (`/admin` → *Add a user*, or *Users and access*): enter a name and a Login ID, choose how long access lasts (1–30 days), and the dashboard shows the new person's **Login ID, a generated password and the end date**, with *Copy message* ready to paste into WhatsApp or email. They sign in on the same page, from any device, as a **regular user** (added users are never admins; they cannot open the dashboard or call its endpoints — the server refuses both). There is no database, so nothing is stored about them: the password is a signature over the Login ID and the end date (`src/lib/auth.ts`), which is why it works anywhere and stops by itself. The price: **access can't be switched off from the dashboard before its date** — add the Login ID to `SITE_REVOKED` in the hosting settings and redeploy (about a minute), or change `GATE_SECRET` to end every added sign-in. Set `GATE_SECRET` once (any long random string) so editing `SITE_USERS` doesn't end added sign-ins by accident. The list of who you added lives in the browser you added them from (like the login records); losing it loses the list, not their access. Needs a store (KV / Postgres) if you want instant revoke, chosen passwords, or one list for every admin device.
* **Run it locally with accounts:** copy `.env.example` to `.env.local`, set `SITE_USERS`, then `npm run dev`. Without it the site is open and no account features show. On Vercel: `vercel env add SITE_USERS production --sensitive` (and `preview`), then redeploy.
* `node scripts/qa/roles.cjs` tests all of the above end to end (it starts its own throwaway server with made-up accounts), and `node scripts/qa/auth-unit.mjs` unit-tests the issued sign-ins (tamper, expiry, revoke, secret change).

## New & Next — brand launches

A pre-launch, launch-day and post-launch experience, built once as a **template** and plugged into the existing site: **Header → New & Next** (also the phone menu, footer and sitemap) opens `/new-and-next`; each brand has its own page at `/new-and-next/<brand>`.

| Section | What it does |
|---|---|
| Featured launch | The next brand to arrive: a large campaign banner, the date, the announcement and a live countdown |
| Coming soon | Upcoming brands with launch dates, countdowns and **Notify me** |
| Exclusive offers | Launch discounts, early-access windows and gifts, with copyable codes and a state (Live now / Starts … / Ended) |
| Product preview | Pieces you can look at and save to the Wishlist before they are on sale (they cannot be opened as product pages or bought until launch) |
| Launch day | On the launch moment the page switches by itself from *Coming soon* to **Shop now**: the range becomes a product listing and the offers go live — no reload, no redeploy |
| Recently launched | Brands from the last 90 days with a Shop now link |

**Adding a brand is data, not design:** one object in `src/data/launches.ts` (name / wordmark, campaign pictures, launch date, headline and description, offers, product previews, CTA) plus its pictures. `npm run data:check` validates it and `npm run launch:measure -- launches/<id>` registers its pictures. Step by step, with the template: [`docs/LAUNCHES.md`](docs/LAUNCHES.md).

**Try it without waiting for 14 November:** the *Prototype · Launch clock* control on the hub moves the whole site's clock (an hour before launch, at launch, a week after). It is a cookie, so the server agrees: before launch day `/p/<piece>` redirects to the launch page and the bag refuses the piece; after, both work. *Notify me*, the codes and the wishlist are simulated and stored in the browser. `node scripts/qa/launch.cjs` tests all of it end to end.

## Pop-ups (PiP) — floating promotional windows

A small window in the corner — a picture or a **muted, looping video** — that points at a new brand launch, an upcoming collection, an offer or an announcement, wherever people are browsing. Clicking it opens the campaign; ✕ closes it and keeps it (and, for a day, everything else) away. It never takes focus, waits while a drawer or dialog is open, sits above the phone's bottom bar, and stays out of bag, checkout, login and account. Phones get a docked mini window; tablets and desktops a small 4:3 window in the bottom-right corner. Video does not autoplay for visitors who prefer reduced motion or have data saver on.

**A campaign is one object** in `src/data/promos.ts` plus its picture (and optional video); a campaign tied to a brand launch (`launchId`) writes its own copy — countdown before launch, *Now live → Shop now* after. Rules, template and limits: [`docs/PROMOS.md`](docs/PROMOS.md). To see them: *Prototype controls → Pop-ups* (show any campaign now, bring dismissed ones back), or add `?promo=<campaign id>` to any URL. `node scripts/qa/promo-unit.mjs` and `node scripts/qa/promo.cjs` test the rules and the behaviour end to end.

### Sign-in notification — know when someone has opened it

Set one environment variable and every time someone signs in with a **user** account (never the admin's), you get **one line**: *"Someone signed in to the prototype — Sat, 31 Oct 2026, 4:42 pm IST"*. That is all: no name or Login ID, no device, browser, IP address or location. **Nothing is stored** — there is no database and no log on the site; the notification list on your phone or laptop is the log. A failed attempt sends nothing, and a notification service that is slow or down never stops anyone signing in.

* **ntfy.sh (simplest; free; no account):** pick a long random topic (for example `nf-` plus 20 random letters — treat it like a password), set `LOGIN_NOTIFY_URL=https://ntfy.sh/<topic>`, then install the ntfy app (iOS / Android) or open `https://ntfy.sh/<topic>` in a browser and subscribe to the topic. ntfy keeps messages for about 12 hours, so open the app within that time to catch up.
* **Discord or Slack:** make an incoming webhook for a channel you own and use its URL as `LOGIN_NOTIFY_URL` (the site sends the JSON each expects). Any endpoint that accepts a plain-text `POST` also works.
* **Vercel:** *Settings → Environment Variables → `LOGIN_NOTIFY_URL`* (mark it sensitive), then redeploy. Unset, nothing is sent.
* `node scripts/qa/notify-unit.mjs` tests the message and the failure cases; `scripts/qa/roles.cjs` checks, against a stand-in endpoint, that a user sign-in sends exactly one nameless line while a wrong password, a refresh and the admin's own sign-in send nothing, and that a dead endpoint doesn't block signing in.

## Sharing it safely (read before you send the link)

A website cannot be made copy-proof — whatever a browser can show, it can save — so protection here means: nothing is reachable without the password, and the source is not lying around.

1. **Make this GitHub repository private** (*Settings → General → Danger zone → Change visibility*). The site's password does not protect the code on GitHub: while the repo is public anyone can read and clone every branch. (Private repos can still be deployed from Vercel; only the one-click "Deploy" link above needs a public repo.)
2. **The password gate (`src/proxy.ts`) serves nothing without the cookie** — pages, pictures, the image optimiser, the compiled JS/CSS. Only the sign-in page's own font, the share-card image and `robots.txt` are public. Production builds ship no source maps, and Vercel's source and log protection (`/_src`, `/_logs`) is on.
3. **Send each person's password separately from the link**, and give it only to the people who need it. Anyone who has it can save pages and pictures; no front-end trick prevents that. (Disabling right-click or text selection only inconveniences visitors and screen-reader users — it is not implemented because it protects nothing.)
4. **Time-box the review:** set `SITE_EXPIRES` (for example `2026-11-15` or `2026-11-15T18:00:00+05:30`) in the Vercel project and redeploy — after that moment every request gets "Preview ended", cookie or not. To cut off a reviewer earlier, change `SITE_PASSWORD` and redeploy: that signs everyone out.
5. **Hardening already in place:** the site cannot be framed or re-hosted inside another page (`X-Frame-Options`, `frame-ancestors 'none'`), is `noindex` everywhere, sends no referrer, and `LICENSE` states that the work is shared for review only.

## Stack

Next.js 16 (App Router, Cache Components, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide · Lenis (smooth scroll, awards branch). No other runtime dependencies. Mock JSON-style data modules and `localStorage` persistence, structured so real APIs can slot in.

## Commands

```bash
npm install
npm run dev               # dev server
npm run build && npm start
npm run typecheck && npm run lint
npm run data:check        # validate every cross-reference in src/data (including the New & Next launches)
npm run launch:measure -- launches/<brand-id>   # register a launch's campaign pictures (size, colours, blur) after adding or replacing them
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
node scripts/qa/align.cjs    http://localhost:3100              # layout sanity: text over text, clipped or off-page text, voids in stretched columns, near-miss alignment, underfilled rails, stretched pictures (every route x 390/820/1024/1440)
node scripts/qa/notify-unit.mjs                                  # the one-line sign-in notification: message, nothing configured, failures never block
node scripts/qa/promo.cjs    http://localhost:3100              # pop-ups (PiP): timing, muted video, dismissal rules, quiet pages, phone / tablet / desktop, prototype controls, axe
node scripts/qa/promo-unit.mjs                                 # the pop-up rules in Node (routes, dates, launch states, cool-down, visit cap)
node scripts/qa/launch.cjs   http://localhost:3100              # New & Next: countdown, Notify me, previews + wishlist, pre-launch guards, automatic switch to Shop now, template pages
node scripts/qa/roles.cjs                                      # accounts and roles end to end (starts its own server)
node scripts/qa/keyboard.cjs http://localhost:3100              # keyboard-only checks (skip link, combobox, focus traps, dropdowns…)
node scripts/qa/a11y.cjs     http://localhost:3100              # axe-core on every page (npm i --no-save axe-core first)
node scripts/qa/motion.cjs   http://localhost:3100              # awards branch: reveals settle, smooth scroll, cursor, drag rails, page fade, reduced-motion / no-JS / failed-hydration fallbacks
node scripts/og-image.cjs                                      # re-render the link-preview image public/brand/og.jpg
node scripts/qa/vitals.cjs   http://localhost:3100 [--throttle] # lab LCP / CLS / long tasks / transfer per route
node scripts/qa/sweep.cjs <outDir> http://localhost:3100 / /c/women   # scrolling screenshots for visual review
```

## Structure

```
src/app/            routes (App Router)
src/components/     ui/ (kit) · layout/ · motion/ (reveals, smooth scroll, cursor, ticker, parallax) · product/ · plp/ · home/ · editorial/ · commerce/ · account/ · team/ (session chip, admin dashboard) · launch/ (New & Next) · promo/ (pop-ups)
src/data/           types · labels · categories · catalog-defs → catalog · edits · stories · scenes · commerce · content · launches (brand launches) · promos (pop-ups)
src/lib/            store · filters · search · recs · pricing · intent helpers · flip · mockApi · a11y
src/stores/         wishlist/bag · account/orders · intent · checkout · ui/toasts/prefs
scripts/placeholders/ the two supplied photographs and the tool that cuts every image from them
scripts/qa/         Playwright journey · nav · home · links · flat · grid · overflow · keyboard · a11y · vitals · screenshot tools
public/brand/       the supplied wordmark (inlined by components/layout/Logo.tsx)
docs/               PRD · grid system · awards direction · LAUNCHES (onboarding a brand) · PROMOS (pop-up campaigns)
```

## Live content

The look, structure and copy of the header, footer, product page, bag drawer, wishlist and login follow 15 screenshots of the live site that were supplied for this work. Brand names, category and footer labels and navigation wording are taken from them. **Products, prices, ratings, discounts and stories are sample data** — the build environment cannot read `www.nykaafashion.com` (even with the domain allowed in the environment’s network policy, the site’s CDN answers `403 Access Denied` to this environment), so the live catalogue could not be imported. Footer and menu entries the sample catalogue cannot back (watches, toys, brands such as Biba or W …) are left out rather than linked to empty pages. To swap in real data, replace the modules in `src/data` (types in `src/data/types.ts`) with an export of the live catalogue; nothing else in the app depends on the sample content.

## Imagery

> An Unsplash photography pipeline was built and trialled on 31 Oct 2026 and then stopped at the owner's request (the pictures were judged not relevant): the site uses the two supplied photographs, exactly as described below. The tooling is kept, dormant, in `scripts/unsplash` — see `docs/UNSPLASH_PLAN.md`.

> **Since 1 Nov 2026 every picture on the site is the owner's own AI-generated set** — 60 key-page pictures (home banners, category tiles, edits, stories, New & Next, pop-ups) and 130 product pictures, one per product (`scripts/figma/`, `docs/IMAGE_SET.md`). The paragraph below describes the earlier method — everything cut from the two supplied photographs — which is kept as the fallback; `npm run photos` leaves every key cut from the owner's set alone.

**Until 1 Nov 2026 every picture was cut from the two photographs that were supplied** (`scripts/placeholders/source/`: a kurta set and a cream co-ord on a bouclé chair) — nothing is generated, recoloured or added. `npm run photos` rebuilds the files in `public/img/<key>.webp` (it leaves the keys cut from the owner's set alone):

- `build.mjs` makes the named ratio versions (3:4 · 4:5 · 1:1 · 16:9 · 16:9 with copy space · 9:16 · 3:2) in `public/img/placeholders/`; where a portrait window reaches past the photograph, the seamless studio backdrop is extended — never the figure.
- `fill.mjs` cuts every other key at its own size: a product's name decides the window (Indian wear and kids → the kurta set, western → the suit, footwear → the shoes, jewellery → the earrings, soft furnishings → the bouclé chair, decor → the vases); front / alt / detail views and colour variants are different windows or mirrors, so galleries and swatches still change the picture; editorial scenes get full-figure, wide and close crops, and their shoppable pins are placed on the garment that is actually in frame.
- `src/data/generated/image-meta.json` holds each image's size, average colour, blur preview, wall/floor edge colours and pin positions; `node scripts/qa/image-audit.mjs` checks files and metadata agree.

To use real photography later, replace a file with a photograph of the same name (and re-measure its `pins` in `image-meta.json` if it has any); nothing else changes.

### Unsplash photography pipeline (dormant — stopped by the owner on 31 Oct 2026)

Built to place free-licence photographs from [Unsplash](https://unsplash.com), chosen by eye for an Indian audience and credited on `/credits` (reachable by URL; the footer link was removed with the pictures). It runs on the official API only — unsplash.com's website blocks automated access, and nothing here tries to get around that. Everything is in `scripts/unsplash`; the full plan, rules and hand-off are in **`docs/UNSPLASH_PLAN.md`**.

1. Get an *Access Key* (unsplash.com/oauth/applications → New Application) and put it in the environment as `UNSPLASH_ACCESS_KEY` (never in the repo). A demo key allows 50 API requests an hour; the scripts count them, cache searches and wait for the next hour instead of failing.
2. `npm run unsplash:search -- --phase A` — search each group (`groups.mjs`: scenes and launches first, then products), keep usable results, write numbered contact sheets to `.cache/unsplash/sheets`.
3. Look at the sheets and `npm run unsplash:pick -- <group> <numbers>` (with `@x,y` for where the subject sits); `npm run unsplash:review -- --photo <id>` shows a photo with a 10 % grid to read focus points and pin anchors from.
4. `npm run unsplash:download` — tells Unsplash about each chosen photo (their API guideline), keeps a 2400 px original in the ignored cache.
5. `npm run unsplash:build` — cuts every picture at its own key and size (products by kind and colour, scenes, launches, pop-ups), recomputes the metadata (average colour, blur, wall colours, pins), keeps each picture inside a size budget, writes `photo-assignments.json` and `photo-credits.json`, and warns about weak spots (a subject too far left for the headline, low heading contrast, pins on fallback positions). `npm run unsplash:review -- scenes/edit` shows what was built.
6. `npm run data:check` insists that every photograph on the site was reported to Unsplash and is credited; `scripts/qa/unsplash-unit.mjs` and `scripts/qa/unsplash-build-unit.mjs` test the tools with no key and no network.

`scripts/placeholders/promo-video.mjs --photo-id <id>` re-cuts the pop-up clip from a picked photograph. Picks, focus points and photographer details live in `scripts/unsplash/manifest.json` (committed); originals are re-fetched from Unsplash's CDN when needed, so the repository holds only the built pictures.
