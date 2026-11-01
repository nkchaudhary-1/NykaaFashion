# Launch video — "The new look"

A 97.6-second, 16:9 launch film for the redesigned Nykaa Fashion prototype: what changed, how it looks, and what is new. It is made **from the site itself** — every picture in it is a capture of the running production build, nothing is mocked up, and the only photographs in it are the two the owner supplied.

It lives on the staging branch with the rest of the staging work (`claude/nykaa-fashion-staging`). Nothing here touches the live site.

| File (built into `$OUT/final`) | What it is |
| --- | --- |
| `nykaa-fashion-new-look-launch-1080p.mp4` | The master: 1920 × 1080, 30 fps, H.264 High, AAC 192 kb/s, original score (≈ 25 MB). |
| `nykaa-fashion-new-look-launch-1080p-silent.mp4` | The same picture without sound — for dropping in a voice-over or your own track (≈ 23 MB). |
| `nykaa-fashion-new-look-launch-720p.mp4` | A small share cut (1280 × 720, capped bitrate) for chat apps and e-mail (≈ 8 MB). |
| `nykaa-fashion-new-look-launch-poster.jpg` | Poster frame (the title). |

The finished files are not committed (they are build output). Rebuild them with `scripts/video/build.sh` (below).

## Disclaimers that are on screen

The first and last scenes say **"Design prototype · sample data"** / **"Design prototype · sample data · not the real site"**. Scene 5 carries **"Simulated · this device's signals only"** (the adaptive home is driven by what the visitor did on this device — it is a simulation, as everywhere in the prototype). Scene 8 states what was checked and what was not (see "What the proof scene claims").

## Storyboard

The score is cut to the scenes: a bell sounds on every scene change and the arrangement shifts there (a pulse comes in at the third cut, drops out for the proof scene and returns for the end).

| # | Time | Scene | What happens | On-screen words |
| --- | --- | --- | --- | --- |
| 0 | 0:00 – 0:05 | **The open** | Wordmark, then poster-scale type rises word by word and falls away; the hero picture grows from a card to the full frame. | "A *new look* for Nykaa Fashion." · "India's fashion, rebuilt around pictures." |
| 1 | 0:05 – 0:16 | **01 · The new look** | The real home page scrolls. The 12-column grid lights up over the banner; a tokens panel slides in (Inter Display, six flat colours, 1 px rules, square corners). | "Studio-paper warmth. Poster-scale type." · "No shadows. No gradients. No blur." · "Big type. Clear prices. Clear offers." |
| 2 | 0:16 – 0:27 | **02 · Shop by category** | Right under the banner: twelve tiles, each with its saving. A tile is outlined, a cursor clicks *View all 23 categories* and the full list opens. | "Right under the banner." · "23 categories. *4 departments.*" |
| 3 | 0:27 – 0:43 | **03 · Full-bleed** | A switch flips *Classic → Full-bleed*. The classic page's 46 px margins and 24 px gutters are painted pink, then wiped away: pictures run edge to edge, tiles touch, still on the 12-column grid. A tour down the full-bleed home: price shortcuts, brands in their own colours, curated destinations, one feature + eight more. | "Try a *second* layout." · "Pictures run *edge to edge.*" · "Same grid. Same data. Zero gap." |
| 4 | 0:43 – 0:59 | **04 · Keep exploring** | The endless feed: every tile carries a reason chip ("Because you browse Dresses", "More from Twenty Dresses", "Completes the look"). A product page ends in its own feed seeded by that product; *Back* returns to the same tile in the same place. | "Every piece says why it's *there.*" · "Open one. There's *always* another." · "Back returns you to the same tile." |
| 5 | 0:59 – 1:07 | **05 · Adapts to the shopper** | Three visits — first, returning, deal-hunting — and the third module of the home changes to suit. | "Home that *adapts.*" · "Simulated · this device's signals only" |
| 6 | 1:07 – 1:15 | **06 · New & Next** | The brand-launch hub with a live countdown and a *Notify me* button; one template for every brand; a floating promo that stays quiet on bag, checkout and login. | "Brand launches, with a live *countdown.*" · "A promo that knows when to stay quiet." |
| 7 | 1:15 – 1:25 | **07 · Mobile first** | Three phones side by side: home, categories (two-up walls, bottom sheet), a product and its feed. | "Built for the phone *first.*" · "Two-up walls. Bottom sheets. Thumb-reach navigation." |
| 8 | 1:25 – 1:31 | **The proof** | A large "0" (axe violations) and four checks that exist as scripts in the repo; fine print says they are automated checks, not a full audit. | "Checked where it *ships.*" |
| 9 | 1:31 – 1:37.6 | **The end** | "The *new look.*" and the four launch features as tags; the prototype disclaimer. | "Design prototype · sample data · not the real site" |

### What the proof scene claims, and where each claim comes from

| On screen | Backed by (production build of the staging code, see PROJECT_STATUS.md → staging QA log) |
| --- | --- |
| 0 accessibility violations (axe) | `scripts/qa/a11y.cjs` (axe-core, WCAG 2.1 A/AA + best practice), both layouts. Re-run for the video: see the QA log entry for the launch video. |
| Keyboard-tested: menus, search, dialogs | `scripts/qa/keyboard.cjs`: skip link, search combobox, bag drawer focus trap and return, department dropdown / More, size radios, carousels, quick view. |
| Reduced motion, honoured | `keyboard.cjs` (reduced-motion case) and every audit runs with `reducedMotion: "reduce"`; the pop-up does not autoplay under it. |
| Flat by rule: no shadows, gradients or blur | `scripts/qa/flat.cjs`, both layouts. |
| No sideways scroll, at any width tested | `scripts/qa/overflow.cjs`, every route × 4 widths, both layouts. |
| Fine print: "Not a full audit" | Automated and keyboard checks are not a WCAG conformance audit; no manual screen-reader testing has been done. |

## How it is made

No generative video and no stock footage. The pipeline is plain code, so a change to the site can be turned into a new cut:

1. **Capture** (`scripts/video/capture.cjs`) — Playwright drives a production build (`scripts/qa/prod.sh 3100`) and takes 33 stills at 2× (the hero, tall strips of single home modules with the sticky header hidden, states such as the all-categories dialog, returning-visitor and deal-hunting intent, the product and New & Next pages, tablet and phone). It also writes `geometry.json`: the page rectangles of tiles, reason chips, buttons, the countdown, so the video can outline and click exact things.
2. **Scenes** (`scripts/video/stage/`) — a tiny timeline engine in HTML/CSS/JS. A scene is `{ id, duration, build(root) → update(t) }`; `update(t)` is a pure function of time (no clocks, no randomness), so any frame can be rendered alone and the result is the same every time. Type is Inter Display (the repo's only typeface); colours are the site's flat tokens; no shadows, gradients or blur.
3. **Render** (`scripts/video/render.cjs`) — headless Chrome draws each frame at 1920 × 1080 and pipes it to ffmpeg (H.264, CRF 11). Chrome's JPEG frames are BT.601 / full range; they are converted to BT.709 / limited range and tagged, so the site's pinks and creams come out right in players that assume BT.709 for HD (checked on flat swatches: within 2 of 255 levels). Scenes render in parallel; `--stills 0.5,2,4` writes single frames to look at without encoding.
4. **Music** (`scripts/video/music.py`) — an original score synthesised with numpy from sine, saw and noise: D major, 100 BPM, pads, soft bass, a sparse plucked arpeggio, a gentle pulse, bell accents on the cuts, a little reverb. Nothing is sampled, so there is nothing to license. Mixed to −14.3 LUFS integrated (the usual web level), true peak −6.9 dBFS.
5. **Assemble** (`scripts/video/build.sh assemble`) — joins the scene clips with a stream copy, encodes the master once (x264 slow, CRF 18), muxes the score with fades, and makes the 720p share cut and the poster.

Tools considered and not used: the Higgsfield *video-montage* and *video-editing* workflows (cloud editors; the footage here is a private, access-gated prototype and the account has no credits) and any AI voice or music generation (credits again). Everything above runs locally.

## Rebuild

```bash
scripts/qa/prod.sh 3100            # a production build to capture (kills other Next processes)
OUT=/tmp/nf-launch-video scripts/video/build.sh all
# or one step at a time: capture | render | music | assemble | qa
```

Needs node + Playwright (the repo's `node_modules`, or the global ones — the script adds both to `NODE_PATH`), ffmpeg / ffprobe, python3 with numpy. On 4 cores a full render takes a few minutes (three scenes at a time), the music about 20 seconds, the encodes about three minutes.

* **Change words or timings** — `scripts/video/stage/scenes-a.js` (scenes 0–3) and `scenes-b.js` (4–9). Each scene's captions are `strips(...)` entries with `t0` / `t1` seconds. To look at a moment: `node scripts/video/render.cjs --shots <OUT>/shots --out <OUT> --scenes s3-layouts --stills 6.4,7.8`.
* **Change a scene's length** — change its duration in `scene("id", seconds, …)`; `build.sh` reads the lengths back, so the music cuts follow.
* **New pictures** — when the owner supplies the new image set, re-run `capture`; the scenes read the pictures by name and the rectangles from `geometry.json`.

## Voice-over (optional)

The film is captioned and works muted. If a voice is wanted, record against the **silent** 1080p file; one sentence per scene fits its length at a calm pace:

0. "This is the new look for Nykaa Fashion — India's fashion, rebuilt around pictures."
1. "Studio-paper warmth, poster-scale type, one typeface, flat colour — no shadows, no gradients, no blur."
2. "Right under the banner, shop by category: twelve tiles that show their saving, and all twenty-three categories one tap away."
3. "And a second layout. Same grid, same data — with the gaps taken out. Pictures run edge to edge, and flat colour blocks keep the rhythm all the way down."
4. "Keep exploring: every piece tells you why it's there, every product page ends in another feed, and Back puts you exactly where you were."
5. "The home adapts to the shopper — first visit, returning, deal-hunting — using this device's signals only."
6. "New & Next gives every brand launch a countdown and a Notify me button, from one data file; and a pop-up knows when to stay quiet."
7. "And all of it is built for the phone first."
8. "Checked where it ships: axe, keyboard, reduced motion, flat design, no sideways scroll."
9. "The new look."

## Not done / limits

* No voice-over (no voice service available in this environment); no 9:16 or 1:1 cut yet — the scenes are laid out for 16:9, and the phone scene would be the natural base for a 9:16 version.
* The delivered files came from `build.sh render → music → assemble → qa` in one pass. The `capture` step was run in full earlier and partially re-run (`--only`) while the scenes were tuned; it was not repeated in that pass, so `build.sh all` from nothing has not been run as one go.
* Music is a synthesised original — a neutral bed, not a produced track. It was checked by measurement (loudness, peak, spectral balance, bell timing on the cuts), not by ear: listen to it before it goes out. A licensed track can replace it: use the silent file.
* Players: the files were checked with ffprobe / ffmpeg (streams, frame counts, colour tags, fast-start layout) and by looking at frames, not played back in QuickTime, a phone gallery or a chat app.
