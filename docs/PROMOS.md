# Pop-ups (PiP) — floating promotional windows

A small window in the corner of the screen — a picture or a muted, looping video — that points at a **new brand launch, an upcoming collection, an offer, an announcement or any other notification**. One click opens the campaign; one click on ✕ sends it away for days. It is another way into the site's campaigns, not a banner or a modal: it never takes focus, never covers the phone's bottom bar, waits while a drawer or dialog is open, and stays out of bag, checkout, login and account.

| Where | What |
|---|---|
| `src/data/promos.ts` | The campaigns. **Adding one is one object plus its picture.** |
| `src/lib/promo.ts` | Which campaign belongs on which page right now — pure functions, unit-tested (`node scripts/qa/promo-unit.mjs`) |
| `src/stores/promo.ts` | What this browser has dismissed or opened (localStorage, syncs between tabs, cleared by *Reset all data*) |
| `src/components/promo/PromoPip.tsx` | The window itself, mounted once in `app/layout.tsx` |
| Prototype controls → **Pop-ups** | *Show a campaign now* · *Bring them all back* (also `?promo=<id>` in any URL; `?promo=off` shows none) |

## Run a campaign

1. **Picture.** Add `public/img/promo/<id>.webp` (4:3 by default; 640×480 is plenty) and register it: `npm run launch:measure -- promo/<id>` (the same tool that registers launch pictures). For the sample content these are crops of the two supplied photographs (`scripts/placeholders/fill.mjs`, `promoSpec`); real photography simply replaces the files.
2. **Video (optional).** Put `.mp4` (H.264) and `.webm` (VP9) next to each other in `public/video/promo/` — a short loop, under ~500 KB, 4:3 to match. Keep the still from step 1 as the **poster** (the first frame, so nothing jumps). The sample clip is made from the supplied photograph only: `node scripts/placeholders/promo-video.mjs`.
3. **The object**, in `promos`:

```ts
{
  id: "winter-edit",                       // lowercase slug
  kind: "collection",                      // launch · collection · offer · announcement · notification
  headline: "The Winter Edit lands 7 Nov", // required unless launchId is set
  body: "Wool, knit and layers.",          // optional line under the headline
  cta: { label: "Preview the edit", href: "/edits/new-in" },   // where a click goes (a page that exists — data:check verifies)
  media: { type: "image", image: "promo/winter-edit", alt: "What the picture shows" },
  //  or { type: "video", image: "promo/winter-edit",          // the image is the poster
  //       video: { mp4: "/video/promo/winter-edit.mp4", webm: "/video/promo/winter-edit.webm" } }
  startsAt: "2026-11-03T00:00:00+05:30",   // optional window (ISO with a zone offset)
  endsAt:   "2026-11-09T23:59:00+05:30",
  routes: { include: ["/", "/edits"], exclude: [] },   // where it may appear; omit include = every browsing page
  delaySeconds: 6,                         // seconds on the page before it appears (default 6)
  priority: 10,                            // higher wins when several fit a page (default 0)
  suppressDays: 7,                         // days a dismissed campaign stays away (default 7)
}
```

4. `npm run data:check` — it fails on a missing picture or video file, a link to a page that does not exist, a bad date, a launch that is not in `launches.ts`.

### A new brand launch needs no copy

Set `launchId` to the brand's id in `src/data/launches.ts` and give it a picture. The window then writes itself and follows the launch clock:

* **before launch:** *New launch* · "Vrisa arrives 14 November" · "Launches in 13d 15h" · **Get notified** → the launch page;
* **from launch day, for 7 days (`liveDays`):** *Now live* · "Vrisa is here" · **Shop now** → the shop on the launch page;
* afterwards it stops by itself. `headline`, `cta` and `live` override any of it.

An *upcoming collection* is the same thing with `kind: "collection"` (see `halden-preview`).

## When and where — the rules (src/lib/promo.ts)

* **Never** on bag, checkout, login, account, admin or the prototype pages — not even when forced. **Product, help and info pages** only if a campaign lists them in `routes.include`. A launch campaign is never shown on the launch pages themselves (they are the destination), and no campaign points at the page you are already on.
* **One window at a time**, after `delaySeconds` on the page, only while the tab is in front, and it waits while any drawer, menu, search, quick view or dialog is open. Moving between pages it belongs on keeps the same window; a page it does not belong on swaps it for that page's campaign.
* **Closing** (✕ or Escape inside the window): that campaign stays away `suppressDays` (7), **and nothing else appears for 24 hours**. **Opening** it (a click): that campaign stays away twice as long. A visit shows at most **two** different campaigns.
* **Urgent** campaigns (`priority: 100` or more) ignore the 24-hour quiet period and the visit limit — for an announcement that really must be seen. They still obey their own dismissal and the quiet pages.

## How it behaves

* **Desktop / tablet:** a portrait-framed small window, 264 px (200 px on tablets) wide, in the bottom-right corner. **Phone:** a docked mini window above the bottom bar — a square thumbnail beside the words — about 80 px tall.
* **Video** starts muted, loops, pauses when the tab is hidden or a dialog covers it, and has a Pause / Play button (desktop and tablet). It does **not** autoplay for visitors who prefer reduced motion or have data saver on — they get the still picture and a Play button. A clip *with* sound (`media.video.hasAudio: true`) also gets a mute button; clips always start muted.
* **Accessibility:** a complementary landmark named "Promotion: …"; the words are the one link for the keyboard and screen readers (the picture is a second, hidden way in for pointers); Close has a 44 px hit area; Escape closes; focus is never moved to it, and closing from the keyboard returns focus to the page.
* Flat like everything else: a 1 px ink border, no shadow, gradient or blur; Inter only; the controls are flat chips readable over any picture.

## Honest limits

Campaigns, dates, offers and the countdown are sample content. What was dismissed or opened is remembered **in this browser only** (like the login records); a different browser starts fresh. Nothing is sent anywhere — events (`promo_view`, `promo_click`, `promo_dismiss`) go to the prototype's local event log only. The sample video is a slow zoom and dissolves over one photograph.
