# Keep exploring — retention and the "rabbit hole" (MVP — on staging)

**Asked for by the owner, 31 Oct 2026:** make the site more visual for an Indian audience, work out how to retain the user, and build a *rabbit-hole* experience: one more thing to open, always. Built on staging; not on the live site.

## The problem

Before this, every surface was a dead end: the home page ended in SEO copy; a product page ended in four capped carousels (Similar, Also viewed, More from brand, More from category) and a recently-viewed rail; a listing ended at its last card. A shopper who finished a rail had to go back to a menu to continue. The large Indian apps do the opposite — the home page *is* an endless feed, video and look-based discovery sit one tap from every product, and the app remembers where you were.

**Goal:** more pieces seen per visit and a reason to come back, without hiding the way out. **Hypothesis (untested — it is a prototype with no real analytics):** shoppers who are always one tap from a relevant next piece browse deeper and save more.

## What is built (MVP)

1. **An endless feed, "Keep exploring"** — last module on the home page and last section of every product page, in both home layouts (a wall in full-bleed, a card grid in classic). Every piece carries **why it is there** ("Because you browse Dresses", "More from Twenty Dresses", "Completes the look", "Under ₹1,999" …).
2. **It is seeded by the product** on a product page — pieces that complete the look, the same label, the same category, the same occasion — and each piece opens another product page with its own feed, so there is no last page.
3. **It loads itself three times, then waits for a tap** ("Keep exploring"), so the footer — help, policies, the way out — stays reachable; there is also a "Skip to the footer" link. A polite status line announces the count.
4. **Its order is fixed while you look.** The order is decided when the feed appears; a save or a view never reshuffles tiles under the pointer.
5. **Back goes back to the same tile.** Without it a feed is unusable: you open a piece, press Back, and are thrown to the top. Next 16 with Cache Components already keeps the pages you have visited alive (React `Activity`) instead of rebuilding them, so the feed's length and the scroll position survive — I first built a scroll-memory layer for this and **removed it** after testing showed the framework already does the job (14 product pages deep, or six different routes away, Back still lands on the same tile, on desktop smooth-scroll and on touch). `scripts/qa/rabbit.cjs` guards that this stays true.
6. **"Pick up where you left off"** — returning visitors get their last viewed pieces as the third thing on the (full-bleed) home page.
7. Every feed view / load / tile click is an event in the Prototype panel's log (`feed_view`, `feed_load_more`, `feed_tile_click`).

It is a **simulation**, labelled as one: heuristic scoring over this browser's own signals (the same weights as "Picked for you"), with a seeded jitter so a second lap through the 112-piece sample catalogue is not the first replayed. Nothing leaves the browser.

## Not built — later phases (in the order I would do them)

| Phase | Idea | Why it matters for India |
|---|---|---|
| 2 | **Price-drop and back-in-stock alerts** on saved pieces (a "Notify me" flow already exists) | the strongest *return* trigger for price-sensitive shoppers; needs a real channel |
| 2 | **Share to WhatsApp** (piece, look, wishlist) | the dominant sharing channel; brings people back with a friend's opinion |
| 2 | **Short video / "Style Studio" tiles** in the feed | how Myntra, Flipkart and Meesho lead discovery with Gen Z and tier-2/3 cities; needs real video |
| 3 | A 5-question **style quiz** that seeds the feed | a reason to come back and a better first feed for cold visitors |
| 3 | **Occasion and city** hooks ("Trending in Pune", "Wedding season") | festive and wedding demand is most of the calendar |
| 3 | **Daily drop / streaks / loyalty progress** | habit and tier progress; easy to over-do — test before shipping |
| 3 | Hindi and other languages for the feed's reasons | reach |
| — | A real recommender and real analytics | everything above is a heuristic until then |

## What to measure if this ever has real analytics

Pieces per session · feed depth (blocks reached) · tile click-through by reason · wishlist adds and add-to-bag from the feed · 7-day return · **guardrails:** footer reach, bounce, LCP / INP on the feed, Back-navigation position restored.

## Risks and how they are handled

* **An endless feed can trap people.** Three automatic loads, then a deliberate tap; the footer stays one link away; no autoplay, no countdowns, no hidden exit.
* **Sample catalogue is small** (112 pieces): the feed repeats after about a lap, re-ranked. With a real catalogue the sequence does not loop.
* **Scroll position is fragile** with a router that rebuilds pages: not an issue on this stack (pages stay alive, see above); a hard reload still starts the feed afresh. Covered by `scripts/qa/rabbit.cjs`.
* **Accessibility:** tiles are links with names; the heart is a separate control; "Keep exploring" is a real button; the count is announced politely; motion respects `prefers-reduced-motion`.

QA: `scripts/qa/rabbit.cjs` (feed on both layouts, auto-load cap, button, footer reach, fixed order, Back to the same tile on desktop and phone, three hops through product pages).
