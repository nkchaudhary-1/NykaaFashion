# Unsplash photography — plan and hand-off

The owner's request (31 Oct 2026): *"Then use Unsplash to get the pictures. Try to match the Indian audience."* This **replaces** the earlier rule "only the two supplied photographs".
Nykaa Fashion's own pictures are not an option (nykaafashion.com refuses this environment and the pictures are copyrighted).

**If you are a new session reading this:** the toolkit below is already in the repo. Check `npm run unsplash:status`, then continue at the first unchecked stage.
Do not ask the owner to paste the key into chat — it comes in as the environment variable `UNSPLASH_ACCESS_KEY`.

## Status (keep this table current — it is the hand-off)

| Stage | What | State |
|---|---|---|
| 0 | Toolkit: `groups`, `search`, `pick`, `download`, `build`, `review`, `status`; `/credits` page + footer/sitemap links; `data:check` rules; two unit tests (`scripts/qa/unsplash-unit.mjs` against a local stand-in for Unsplash, `scripts/qa/unsplash-build-unit.mjs` on made-up photographs) | **done and tested without a key** — the build has never seen a real photograph, so expect to tune framing at the first review |
| 1 | Key present: `UNSPLASH_ACCESS_KEY` in the environment | owner action (below) |
| 2 | Phase A search + contact sheets (scenes, launches) | not started |
| 3 | Phase A picks → download → build → review → QA → deploy | not started |
| 4 | Phase B search + picks (products) → build → review → QA → deploy | not started |
| 5 | Pop-up video re-cut from the Vrisa photo; docs; PROJECT_STATUS | not started |

## Rules that do not bend

- **Official API only.** unsplash.com's website sits behind an anti-bot wall (Anubis): never try to get around it, and never scrape. `api.unsplash.com` with the owner's key, and the image CDN `images.unsplash.com` that the API's own URLs point to.
- **Free-licence photos only.** Never Unsplash+ (`plus.unsplash.com`, `premium`/`plus` flags), never sponsored photos. `lib.mjs → isFree()` enforces the host and flags.
- **Count the API.** A demo key is 50 requests an hour; every call is counted, searches are cached in `.cache/unsplash`, and the scripts wait for the next hour instead of failing, so every command can simply be run again. CDN downloads (thumbnails, originals) are not API calls.
- **Tell Unsplash about every photo we use.** Each picked photo gets its `links.download_location` called once (`download.mjs`) — Unsplash's API guideline for any photo chosen for use.
- **Credit every photo.** `/credits` lists photographer, a link to the photo and to the photographer (both with `utm_source=nykaa_fashion_prototype&utm_medium=referral`), generated from what the build actually placed (`src/data/generated/photo-credits.json`).
- **Indian audience.** South Asian models, kurtas, sarees, block prints, brass and terracotta, diyas, Indian streets and interiors, wherever the site's content says so; Western-wear pools still lead with "indian woman/man …" queries.
- **Skip:** brand logos or lettering (sneaker swooshes, monograms, shop signs), clear close-up faces of children, celebrities, anyone in distress, anything that contradicts the label of the slot (a man for a women's tile).
- **The site's design rules still hold:** Inter Display only, no shadows / gradients / blur, flat colour, strict grid. Photographs are the only exception to "flat" — nothing is painted over them. Banner copy sits on a calm area of the photograph or in a flat panel.
- **Keep the old pictures as the fallback.** A key the build has no photo for keeps its current picture (cut from the two supplied photographs); coverage is reported at the end of every build.
- **Never commit** the key, `.cache/`, or the cached originals. Commit `manifest.json`, the built `public/img/**`, `image-meta.json`, `photo-credits.json`.
- **Repo privacy:** the repository is still public. Ask the owner to make it private (GitHub → Settings → Danger zone → Change visibility): the two supplied photographs are in it. Unsplash photos themselves are free to publish.
- **Process:** no PR unless asked; commit trailers from the session reminder; `git checkout tsconfig.json` before committing; stop hook wants a clean, pushed tree (`git push -u origin claude/nykaa-fashion-awards`, retry with backoff). `claude/nykaa-fashion-grid-redesign` stays untouched (23e7907).

## Owner actions (the only things I cannot do)

1. unsplash.com → Developers → **New Application** (accept the API terms) → copy the **Access Key** (not the Secret key).
2. Add it as the environment variable `UNSPLASH_ACCESS_KEY` (and, if the environment has a network allow-list, allow `api.unsplash.com` and `images.unsplash.com`), then **start a new session** on branch `claude/nykaa-fashion-awards` — environment changes do not reach a running session.
3. To deploy from the new session, also give it Vercel access: either approve a device login when asked, or add `VERCEL_TOKEN` as an environment variable. (The project is `nykaa-fashion-awards`, scope `neelesh6`; the earlier login lived in the old container.)
4. Make the GitHub repo private (see above) and subscribe to the ntfy topic for sign-in notices (README → Sign-in notification).

A demo key is enough but slow (≈ 4 hours of API budget for everything, phase A ≈ 2 hours); Unsplash's "Production" tier (5,000/hour, applied for in the app's page) removes the waiting.

## The pipeline

```
npm run unsplash:status                          # key, cache, per group: candidates · picked/want · tracked
npm run unsplash:search -- --phase A             # or --group s-festive,l-vrisa; --refresh ignores the cache; --limit 30 for more candidates
                                                 #   → .cache/unsplash/sheets/<group>-<n>.jpg   (20–30 numbered thumbnails per sheet — look at them)
npm run unsplash:pick -- s-festive 3 7@.4,.5 12  # indices from the sheets; @x,y = where the subject sits (fractions of the photo)
npm run unsplash:review -- --photo <id>          # a large preview with a 10 % grid, the focus (+) and anchors: read x,y off it
npm run unsplash:pick -- --focus <id> .62,.48    #   fix a focus · --anchors <id> x,y x,y … (pin positions) · --extend <id> (plain backdrop may be extended) · --drop <group> <id|n> · --list
npm run unsplash:download                        # tracking call + 2400 px original into the cache, for every picked photo (resumable)
npm run unsplash:build -- [--only scenes/]       # cuts every mapped site image; writes public/img, image-meta.json, photo-assignments.json, photo-credits.json; prints warnings
npm run unsplash:review -- scenes/edit           # contact sheets of the BUILT images (also launches/vrisa · products/twd · pool:p-dress · promo) — look at them
```

1. **Search** (`search.mjs`): per group, queries in order until enough usable candidates; filters free/size/orientation/brands/sponsored, ≤ 3 per photographer; thumbnails from the CDN; numbered contact sheets. Candidates: `.cache/unsplash/candidates/<group>.json`.
2. **Look and pick** — this is the step that matches the Indian audience, and it is done by eye: open each sheet (Read tool), choose from the briefs in `groups.mjs`, and give each pick a focus point when the subject is not centred (`review --photo` shows a grid to read it from). For story scenes read `src/data/scenes.ts` first: every picture of a story carries shoppable pins, so each photo must show what its pins stand for — and set its `--anchors`. Picks go to `scripts/unsplash/manifest.json` (committed): id, size, dominant colour, photographer, links, groups (ordered — the **first** pick of a group is its primary), `focus`, optional `anchors` for shoppable pins.
3. **Download** (`download.mjs`): tracking call (counted), original into `.cache/unsplash/originals/<id>.jpg`. Resumable.
4. **Build** (`build.mjs`): the mapping rules are in `slots.mjs` (scenes, launches, pop-ups: explicit) and in `build.mjs` (products: by the product's kind, colour-aware, three windows per photo). Writes only keys that have a photo.
5. **Review** (`review.mjs`): sheets of built images, one shape per sheet (wide · 3:2 · tall). Fix focus / anchors / picks and rebuild — never accept a build unseen. The build also prints warnings: a subject too far left for the copy of a wide banner, a heading that would not keep 3:1 contrast, pins on fallback positions, a portrait photo in a wide slot, a picture over its size budget.

### Slot map

| Slot (image key) | Count | Source group(s) | Window |
|---|---|---|---|
| `scenes/cat-women`, `auth-side`, `cat-men`, `cat-kids`, `cat-home` | 5 | `s-cat-*` | portrait 4:5 around the focus |
| `scenes/edit-*-tall` / `-wide` | 9 + 9 | `s-festive`, `s-craft`, `s-luxe`, `s-everyday`, `s-offers` | tall: 4:5 slice around the focus; wide: 16:9 with the subject right of centre, copy side calm |
| `scenes/story-*-tall` / `-wide` / `-1` / `-2` | 6 × 4 | `s-diwali`, `s-block-print`, `s-one-dress`, `s-quiet-luxe`, `s-slow-home`, `s-wear-less` | tall / wide as above; 1 = 3:2 frame; 2 = closer or the group's second photo; **pins** placed on `anchors` |
| `launches/<brand>/hero-wide` · `hero-tall` · `g1…g4` | 6 brands | `l-*` | hero-wide: subject right, calm left (or a plain backdrop extended); tall; 3 details |
| `promo/first-order`, `halden-preview`, `delivery-notice` | 3 | `l-vrisa`[1], `l-halden`[0], `s-everyday`[0] | 4:3 |
| `promo/vrisa-teaser` + `public/video/promo/vrisa-teaser.{mp4,webm}` | 1 | `l-vrisa`[0] | re-cut the clip from the photo (`promo-video.mjs`) |
| `products/<id>/v<n>-front` · `alt` · `detail` | 596 | `p-*` pools by the product's `art.kind` | front = the figure; alt = closer; detail = hem / hands / object |
| `placeholders/*` | 14 | — | stay as they are: the fallback and the two supplied photographs' ratio set |

Colour variants: a product's variant picks the photo from its pool whose central colour is nearest the variant's colour (a usage penalty spreads the photos over neighbours), so swatch and picture roughly agree. Sarees, lehengas and dupatta looks are **never mirrored** (the pallu falls over the left shoulder); other groups mirror only to tell neighbouring cards apart.

### Quality bars (check at review)

- Faces never cut by a window; products in a gallery (front / close / detail) are visibly the same garment.
- `hero-wide`: the headline area (left ~45 %) is calm and its colour is what `edge.wall` reports, so the copy's colour choice stays right; verify in a screenshot of each hero at 1440 and 390 px.
- Pins sit on a garment, bag, piece of jewellery or object — never on a face, wall or the floor.
- No lettering or logo legible at 1000 px; no Unsplash+; nobody identifiable who should not be.
- Weight: product webp ≤ ~110 KB, scenes ≤ ~220 KB; the whole `public/img` stays under ~90 MB. Commit rebuilt images at milestones only (every rebuild adds to the git history).
- Alt text still describes what is in the picture (editorial `alt` strings that named the two supplied photographs — "in a printed kurta set, seated in the studio" — are updated for the new photos).

## Phases

- **A — first impressions (≈ 53 photos):** categories, edits, stories, launches, pop-ups, the sign-in panel. Deploy when done; products keep their old pictures.
- **B — products (≈ 60 photos):** the 23 `p-*` pools. Deploy again.

After each phase: `npm run data:check && npm run typecheck && npm run lint`, then the full QA (`scripts/qa/prod.sh 3100` then `scripts/qa/all.sh`), including `scripts/qa/unsplash-unit.mjs`; deploy as in README → "Host it on Vercel" from a clean worktree (`git checkout --detach <sha>; git clean -fdq`, then `vercel deploy --prod --scope neelesh6`); live check with the scripts used earlier (sign in as the regular user, look at Home, a category, a story, New & Next, a product page, a pop-up, `/credits`). Add the QA result and the decisions to `PROJECT_STATUS.md`.

## Known limits

- A demo key's budget is the bottleneck, not compute: do the searches for both phases early (they are cheap), view sheets while the tracking calls run in the background.
- Unsplash's results for "indian …" fashion queries are patchy for some pools (kolhapuri chappals, kids, men's kurtas). When a pool cannot reach its `want`, take fewer photos and let products share; say so in the report.
- The two supplied photographs remain in the repo (`scripts/placeholders/source`) because the fallback pictures, the `placeholders/*` set and the first version of the pop-up clip come from them.
