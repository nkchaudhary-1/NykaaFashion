# New & Next — brand launches

A pre-launch, launch-day and post-launch experience for every brand Nykaa Fashion onboards, built once as a **template**. Adding a brand is one object in `src/data/launches.ts` plus its pictures — no page is redesigned or rebuilt.

| Where | What |
|---|---|
| `/new-and-next` | The hub: **Featured launch** banner with countdown, **Coming soon** rows (date, countdown, Notify me), **Exclusive offers**, **Product preview** with wishlist, **Recently launched** |
| `/new-and-next/<brand-id>` | The brand's own launch page — the same components driven by that brand: story and campaign gallery, offers, preview or (from launch day) the shop |
| Header → **New & Next** (also phone menu, footer *Quicklinks*, sitemap) | The entry points |

## Onboard a brand in five steps

1. **Pictures.** Put the campaign images in `public/img/launches/<brand-id>/` as `.webp`: `hero-wide` (16:9 — copy sits on its calm left side), `hero-tall` (4:5 — phones) and 3–6 gallery pictures (any names, listed in step 2). Run `npm run launch:measure -- launches/<brand-id>` — it records size, colours, edge colours and the blur preview the app needs. (The sample brands' pictures are crops of the two supplied photographs, cut by `scripts/placeholders/fill.mjs`; real photography simply replaces the files.)
2. **The object.** Copy the template below into `launches` in `src/data/launches.ts` and fill it in.
3. **The range.** Each piece in `previews` uses the same compact format as `src/data/catalog-defs.ts` (name, price, MRP, fabric, colours …) and its pictures are `products/<id>/v1-front|alt|detail` — measured the same way (`npm run launch:measure -- products/<id>`). The pieces are real products: they get a product page, quick view, wishlist heart and bag line, but they are kept out of listings and search (see "How it plugs in").
4. **Check.** `npm run data:check` verifies dates, pictures, offers, labels, slugs and that nothing a launch page needs is missing.
5. **Ship.** Commit and deploy. On `launchAt` the page changes by itself — no redeploy.

### Template

```ts
{
  id: "my-brand",                       // url slug: /new-and-next/my-brand
  brand: {
    name: "My Brand",
    tagline: "One line about the brand.",
    origin: "Mumbai",
    category: "Occasion & festive",     // shown beside the date
    // labelId: "existing-label",       // ONLY for a brand whose range is already in the catalogue (then leave previews empty)
    // logo: "/brand/launches/my-brand.svg",   // optional; without it the name is set as a wordmark:
    wordmark: { text: "My Brand", weight: 300, tracking: "0.2em", upper: true },   // Inter only: weight, tracking, case
    tone: { bg: "#f3e1d4", fg: "#4a1d12" },
  },
  launchAt: "2026-11-14T11:00:00+05:30",        // ISO 8601 WITH the time-zone offset
  earlyAccessAt: "2026-11-13T18:00:00+05:30",   // optional: members' early access
  eyebrow: "Featured launch · Occasion & festive",   // optional
  headline: "Occasionwear, *redrawn.*",         // *asterisks* accent a word in raspberry
  dek: "One or two sentences announcing the brand and the debut collection.",
  story: ["Optional paragraph one.", "Optional paragraph two."],
  images: {
    hero: { wide: "launches/my-brand/hero-wide", tall: "launches/my-brand/hero-tall" },
    gallery: [{ key: "launches/my-brand/g1", alt: "What the picture shows" } /* … 3–6 */],
  },
  offers: [
    { id: "early", kind: "early-access", title: "Shop a night early", detail: "Members from 6 pm on Friday 13 November.", starts: "early" },
    { id: "debut", kind: "discount", title: "Flat 20% off the debut", detail: "Launch week only.", code: "MYBRAND20", starts: "launch", endsAt: "2026-11-21T23:59:00+05:30" },
    // kinds: early-access · discount · shipping · gift · bonus     starts: "early" | "launch"
  ],
  cta: { label: "Shop My Brand", href: "/new-and-next/my-brand#shop" },   // optional: where "Shop now" goes (default: the range on the brand page)
  previews: [ /* ProductDef[] — same format as catalog-defs.ts; label must equal the brand id */ ],
}
```

| You change | It updates |
|---|---|
| Brand name / logo / wordmark | hero, ticker, rows, preview sheet, product pages (the brand line), recently launched |
| Campaign pictures | hero (wide on desktop, tall on phones), gallery composition, Coming soon rows |
| `launchAt` | countdown, calendar rows, the moment the page flips to **Shop now** |
| `headline`, `dek`, `story` | hero announcement, brand page story |
| `offers` | Exclusive offers (state chips: Live now / Starts … / Ended, copyable codes) |
| `previews` | preview mosaic, wishlist, preview sheet — and the shop listing from launch day |
| `cta` | the Shop now button |

## What happens on launch day

Everything derives from one rule, `isLaunched(launch, now)` (`launchAtMs ≤ now`): the hero says **Now live** instead of counting down, **Notify me** becomes **Shop now**, offers switch from *Starts …* to *Live now*, preview cards become links to real product pages with Add to bag, the preview mosaic becomes the product listing, and the brand moves from **Coming soon** to **Recently launched** (kept there for 90 days — `RECENT_DAYS`). The featured launch is always the next one due; once nothing is upcoming, it is the newest arrival. The countdown flips to *Live now* without a reload.

**Demoing without waiting.** The *Prototype · Launch clock* control on the hub and brand pages moves the whole site's clock: real time, an hour before the featured launch, at launch, a week after. It is a cookie (`nf_launch_offset`), so the server agrees: before launch day a piece's product page redirects to the launch page and the bag refuses it; after, both work.

## How it plugs in without disturbing the site

- **Lookup only.** Launch brands are added to `labelById`, and their pieces to `productById` / `productBySlug` / `launchProducts` — never to `labels` or `products`. So the brands directory, listings, search, recommendations and the home page are exactly as before; a piece can still be named, wishlisted (it shows on the existing Wishlist page) and bought once live.
- **Before launch** the server (`src/proxy.ts`) redirects `/p/<piece>` to `/new-and-next/<brand>?piece=<piece>` and `addToBag` refuses with a clear message, whatever path led there (wishlist, bookmark, stale tab).
- **Graduating a launched brand** into the main catalogue (so search and listings include it): move its `previews` into `catalog-defs.ts`, add its label to `labels.ts`, set `brand.labelId`, empty `previews`.

## Honest limits

Dates, offers, prices and brands are sample content (the new brands are fictional; H&M, Cider and Hearth & Hue are the sample catalogue's labels). *Notify me* and the wishlist are simulated and stored in the browser; nothing is sent. Pages are statically generated; time-dependent parts (countdown, state) run in the browser from the clock, so a page opened just before launch flips while you watch it.
