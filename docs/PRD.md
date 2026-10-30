# Nykaa Fashion — Full Experience Redesign PRD

**As of** 30 Oct 2026 · **Author** Neelesh · **Reference** www.nykaafashion.com
**Tier** Full · **Scope** whole experience (discovery surfaces deep, transactional surfaces covered)
**Status** Strategy locked (your 4 decisions in §3.6). Full build spec §4–§9 drafted below as your Claude Code brief. One open assumption flagged in §9.5.
**Build** Spec only. Implementation happens in Claude Code, not here.

> **Thesis — discovery & curation.** Nykaa Fashion's *default* way to discover is a discount-led category grid. Its real curation equity — Hidden Gems, Luxe, the Responsible edit, House-of-Nykaa labels, beauty-parent taste — is buried. In a market consolidating around content-led, curated discovery (where Myntra already leads and grid-first players are losing ground), the redesign's job is to **make curation the default way you discover**, turning Nykaa's taste equity into its discovery advantage.

---

## How to read this draft

This is the PRD **through the strategy gate**: problem, research, and strategy. Everything downstream — information architecture, screen/surface inventory, functional + non-functional requirements, state models, data model, UX spec, measurement — is listed in §4–§9 but **intentionally not written yet.** The research moved the problem (see §2.5), so locking strategy first saves rewriting the whole spec.

Decisions that are yours to make are marked **⛳**. There are four, all in §3.6.

Confidence labels on findings: **High** (directly observed / multiple independent sources), **Medium** (credible secondary source or consistent pattern), **Low** (single source or inference). Nothing here is invented; where public data is thin it says so.

---

## 1 · Problem & Context

**What Nykaa Fashion is.** A premium/ethnic-leaning fashion marketplace (part of FSN E-Commerce / Nykaa), positioned off the parent beauty brand's taste equity. Catalogue spans Women / Men / Kids / Home, plus curated verticals — Luxe, Hidden Gems (niche Indian artisan labels), a Global Store, and House-of-Nykaa private labels (Twenty Dresses, Nykd, RSVP, Pipa Bella, Gajra Gang, Likha, and others).

**The problem (reframed by research).** The platform *has* genuine curation assets, but the **default discovery experience is a discount grid**: the logged-out homepage leads with sale banners, "up to X% off" brand tiles, and occasion-filtered category shortcuts. The curation that would differentiate Nykaa — Hidden Gems, Luxe, the Responsible edit, editorial (Style Files) — is relegated behind a "More" menu or into the footer. Meanwhile the market is shifting toward **content-led discovery**, and the competitor that owns it (Myntra) is pulling ahead while grid-first rivals are called out as losing relevance.

**Why it matters.** Competing on discount in a price-transparent marketplace is a race Nykaa Fashion is not positioned to win on scale (Myntra is ~5× its traffic historically, and larger on revenue). Its defensible edge is *taste and curation* — and that edge is currently invisible on the surfaces where discovery happens.

**Honest caveat up front (detailed in §2.5):** discovery/curation is **not** what users complain loudest about. Public complaints are dominated by fulfillment — delivery, returns, refunds, wrong/damaged product. So this redesign is a **growth/differentiation bet**, not a fix for the top user pain. That distinction shapes the goals, non-goals, and risks below, and it's the single most important thing to be clear-eyed about.

---

## 2 · Research

### 2.1 Market

Indian online fashion is large, fast-growing, and consolidating around discovery and reliability. Vendor estimates vary widely (different definitions/scopes), so treat the *direction* as high-confidence and any single number as indicative.

| Metric | Figure | Source / date | Confidence |
|---|---|---|---|
| India online fashion market | ~US$21.6B (2025) → ~US$25.7B (2026), CAGR ~18.3% to 2035 | [Credence Research, 2026](https://www.credenceresearch.com/report/india-online-fashion-market) | Medium (vendor estimate) |
| Largest India fashion e-tailer | Myntra, ~US$6.57B online revenue (2024) | [ECDB](https://ecdb.com/resources/sample-data/market/in/fashion) | Medium |
| India overall e-commerce | GMV to cross ~US$90B in 2026; H1 2026 ~US$38B, +25% YoY | [Redseer via IBEF, Oct 2026](https://www.ibef.org/news/india-s-online-retail-to-cross-us-90-billion-in-2026-redseer) | Medium |
| Market direction | Consolidating around **content-led discovery** + operational reliability | [App-intel teardown, 2026](https://marlvel.ai/apps/ajio-online-shopping-app) | Low–Medium |

**Insight:** growth is not the constraint; *differentiation within a crowded, discount-heavy market* is. The axis competitors are consolidating on is discovery, not price.

### 2.2 Live audit — nykaafashion.com (logged-out, desktop)

Directly observed from the homepage markup. **High confidence** on what exists; **not yet audited:** rendered visual hierarchy, PLP, PDP, search, mobile, and the app (where most volume sits). Gated flows (bag → checkout → address → payment → account → returns) are **not** audited and are treated as pattern-only everywhere in this doc.

**Primary nav:** Women · Men · Kids · Home, plus a **"More"** dropdown holding Luxe, Hidden Gems, Global Store, Revolve, Fit Zone. Account / Wishlist / Cart top-right. A "Switch to Nykaa Fashion Luxe" toggle.

**Homepage module stack (top to bottom):**
1. Full-width **sale banner** (discount landing).
2. **Category tiles** — westernwear, indianwear, men, kids, home, footwear, lingerie, bags, activewear, jewellery.
3. **"Celebration-ready Categories"** — tiles that deep-link into PLPs *pre-filtered* by occasion + discount (e.g. "evening dresses", "event-ready heels").
4. **"Iconic Brands, Unreal Savings"** — brand tiles, each stamped with a discount ("Up to 50% off", "Extra 10% off") — H&M, Nike, Cider, Puma, US Polo, Libas, Twenty Dresses, Nykd, etc.
5. **"Build Diwali wardrobe"** — seasonal curated filter tiles (velvet kurtas, juttis, banarasi, mirror-work).
6. **Long SEO copy blocks** at the foot (Gadgets/Tech, Home Decor, Luxe, Hidden Gems, Style Inspiration, Sustainability).

**Curation assets that exist but are buried:** Hidden Gems (artisan labels, behind "More"), Luxe (behind a toggle), The Responsible Collection (sustainability edit), Style Files (editorial/blog, only in footer quicklinks).

**Observations (what creates the problem):**
- Discovery = **category + discount + occasion filters.** Nearly every module is framed by a discount.
- **No personalization or recommendation surface** visible logged-out; **no creator/editorial/social content** on the homepage (contrast Myntra Studio).
- Editorial and curation are **real but relegated** — the default path rewards price-hunting, not taste.
- Heavy SEO text suggests search-acquisition reliance over on-site discovery design.

**Fair to Nykaa:** the raw material for a curation-led experience already exists (Hidden Gems, Luxe, Responsible, House-of-Nykaa labels, beauty-parent taste). The problem is **hierarchy and default**, not absence. That makes this a reorganize-and-elevate redesign, not a build-from-nothing one — which is a *lower-risk, more defensible* framing.

### 2.3 Competitors (discovery lens)

| Competitor | Type | Discovery model | Note | Confidence |
|---|---|---|---|---|
| **Myntra** | Direct, scale leader | **Content-led:** Myntra Studio (creator/editorial feed), MyFashionGPT (AI search), curated collections for intent-less browse, AI personalization + visually-similar recs | The benchmark to beat; targets "open the app without a specific item in mind" | Medium |
| **AJIO** | Direct | **Catalog-first static grid** | Publicly critiqued as a *liability* in a content-led market, accelerating user migration to social-commerce rivals | Low–Medium |
| **Tata CLiQ Fashion** | Direct | Omnichannel (Westside), premium/Luxury arm | Thin public data — **needs validation** | Low |
| **Nykaa Fashion** | Subject | Category + discount + occasion filters; curation assets underused | Taste equity present, buried | High (observed) |
| **ASOS / SSENSE / Farfetch / Net-a-Porter** | Adjacent (global) | Editorial commerce — shop-the-story, editorial PDP, visual-first | Pattern/visual benchmarks; pull real screens in design phase | Low (not yet audited) |
| **H&M / Zara (brand.com)** | Adjacent | Vertical brand sites, lookbook-led visual merchandising | Benchmark for visual-first, not marketplace discovery | Low |

**Pattern (counted, not cherry-picked):** of the two direct players with public discovery signal, the one investing in **content-led discovery (Myntra)** is gaining, and the one on a **static grid (AJIO)** is flagged as losing ground. Nykaa Fashion's default today is closer to AJIO's grid than Myntra's content layer — the strategic risk is explicit.

> **Deeper competitor teardown is a planned next step** (real screens via Mobbin, logged-in flows). Not fabricated here.

### 2.4 Comparison matrix

| Dimension | Myntra | AJIO | Nykaa Fashion | Our opportunity |
|---|---|---|---|---|
| Positioning | Mass-market #1 | Affordable + premium (Luxe) | Premium/ethnic off beauty parent | Own *curated premium discovery* |
| Default discovery | Content + curation | Catalog grid | **Discount grid** | Curation-as-default |
| Curation | Strong, surfaced | Weak | **Strong but buried** | Elevate existing assets |
| Personalization | AI recs, visual search | Limited | Not visible (logged-out) | Personalized browse (v2+) |
| Creator/editorial layer | Myntra Studio | — | Style Files (buried) | Editorial as a first-class surface |
| Trust/fulfillment | Scale logistics | — | **Public pain point** | Out of scope (see risks) |

### 2.5 Public user signals — the inconvenient finding

Dominant complaint themes across independent aggregators are **fulfillment and trust**, not discovery:

- Delivery delays, returns/refund friction, wrong/damaged items, slow customer service — recurring across [Trustpilot](https://nl.trustpilot.com/review/nykaafashion.com), [consumercomplaints.in](https://www.consumercomplaints.in/bycompany/nykaa-fashion-a549994.html), [Voxya](https://voxya.com/company/nykaa-complaints/8305), and app-review analyses. **Medium confidence** (consistent across sources, but complaint sites skew negative — selection bias).
- Counterweight: app-store aggregate rating reported at ~4.7/5 across ~4,362 reviews ([JustUseApp](https://justuseapp.com/en/app/1439872423/nykaa-fashion-shopping-app/reviews)). Loud complaints coexist with broadly positive ratings — don't over-read the complaints.
- **Discovery/curation is essentially absent from user complaints.** It surfaces instead in *analyst* commentary — e.g. a 2023 Elara Securities view that Nykaa Fashion's "product line, assortments, and strategy" needed a rethink to become a significant player ([Business Today, Apr 2023](https://www.businesstoday.in/magazine/the-buzz/story/nykaa-fashion-needs-a-rejig-heres-why-377111-2023-04-12)).

**What this means:** the discovery problem is a **competitive-positioning / growth gap identified by analysts and visible in the market shift** — not a top-of-mind user pain. A beautiful discovery experience is a *differentiation and engagement* play. It will **not** fix the fulfillment issues that actually drive dissatisfaction, and if those stay broken they will cap the redesign's impact. This is the central honesty of the PRD and it drives the non-goals and risks.

### 2.6 Key insights & hypotheses

1. **[H1 · Medium]** Default is discount-grid; genuine curation is buried → elevating existing curation to the default surface is a low-supply-risk differentiation lever. *Observed audit + analyst view.*
2. **[H2 · Medium]** The market is consolidating on content-led discovery; grid-first is a liability → Nykaa risks AJIO's trajectory unless it moves. *Secondary sources.*
3. **[H3 · High on the mismatch, Hypothesis on the implication]** Loud user pain is fulfillment, not discovery → the redesign is a growth bet whose ceiling is set by fulfillment it doesn't own.
4. **[H4 · Low]** Nykaa's beauty-parent taste equity is an under-exploited discovery asset (editorial, cross-category styling). *Inference — needs validation.*

---

## 3 · Strategy ⛳ *(sign-off needed before §4–§9)*

### 3.1 Problem statement

> Nykaa Fashion's default discovery is a discount-led category grid, so it competes on price in a market consolidating around curated, content-led discovery — where the scale leader already wins and grid-first players are losing ground. Its real differentiator (curated taste: Hidden Gems, Luxe, Responsible, House-of-Nykaa, beauty-parent sensibility) is buried. **Make curation the default way people discover, so taste — not discount — becomes the reason to shop here.**

### 3.2 Target users & JTBD

- **Primary — the intent-less browser.** Opens the app for inspiration, decides later. The exact segment Myntra's curated collections court; the one a discount grid serves worst.
  - *JTBD:* "When I open Nykaa Fashion without a specific item in mind, I want to be shown a point of view I trust, so I can find something I'd actually wear without wading through a discount grid."
- **Secondary — the occasion / ethnic shopper.** Festive, wedding, celebration (Nykaa's Indianwear + Hidden Gems strength).
- **Tertiary — the premium / beauty-crossover shopper.** Trusts Nykaa's taste from beauty; higher AOV.

### 3.3 Goals

- **User:** find something I'd wear with less effort and higher confidence; discover labels I wouldn't have found in a grid.
- **Business:** grow share of intent-less sessions; lift browse → PDP → add-to-bag engagement; defend premium positioning vs Myntra; shift AOV mix toward curation over deep-discount.
- **Product:** curation as the default surface; Hidden Gems / Luxe / editorial as first-class; a browse experience that works without a search query.

### 3.4 Non-goals (explicit scope control)

- Fixing fulfillment, delivery, returns, refunds, customer service — **real, but out of scope** (see risks/dependencies).
- Payments / checkout re-architecture (covered for coherence only, per the depth gradient — not reinvented).
- Beauty (nykaa.com) and cross-platform integration.
- Pure discount-engine / sale-mechanics optimization — this is the thing we're deliberately *de-centering*.
- New catalogue / supply / sourcing.

### 3.5 MVP (discovery spine)

| Scope | Item | Reason |
|---|---|---|
| **Must** | Curation-led homepage (editorial + collections as default, discount demoted to one module) | The core bet |
| **Must** | Elevated Hidden Gems / Luxe / Responsible as first-class destinations | Existing equity, low supply risk |
| **Must** | Redesigned PLP + product card tuned for taste/visual-first browse | Where browse→decide happens |
| **Must** | Redesigned PDP (visual-first, styling/related, decision confidence) | The decision moment |
| **Should** | Editorial/"shop-the-story" surface (Style Files promoted) | Content-led discovery parity |
| **Should** | Occasion/festive curated entry (Nykaa's ethnic strength) | Secondary user, seasonal upside |
| **Could** | Personalized browse rail (logged-in) | Higher effort; validate v1 first |
| **Could** | Creator/UGC layer (Myntra-Studio-style) | Supply + ops heavy |
| **Not now** | Checkout/account/returns redesign, search-AI (MyFashionGPT equivalent), app parity | Out of thesis or high cost |

### 3.6 Decisions — locked

Your four calls (30 Oct 2026). You chose the broadest option on each — so these describe the **North Star**, and §9.2 stages a **buildable v1** toward it.

| # | Decision | Your call |
|---|---|---|
| 1 | Default surface | **Intent-adaptive** — curation leads for browsers, discount surfaces on deal intent |
| 2 | Primary user | **All three**, served by one adaptive surface (cold-start defaults to curation — §9.5) |
| 3 | v1 curation lever | **Both** — editorial (real) + a personalized rail (simulated in v1) |
| 4 | Surface | **Responsive web (desktop + mobile)** now; **iOS app** later |

*One push, then I commit:* "all four maxed" is a vision, not a v1. The spec below honours it as the North Star and builds a staged v1 so you ship something coherent that ladders up — not a thin version of everything at once.

---

## 4 · Experience

### 4.1 Information architecture

- **Home** (adaptive)
- **Discover** — editorial / shop-the-story (Style Files promoted to first-class)
- **Edits** — curated destinations: Hidden Gems · Luxe · Responsible · Festive/Occasion · House of Nykaa
- **Shop** — Women · Men · Kids · Home → category → **PLP** → **PDP**
- **Search** · **Wishlist** · **Bag → Checkout** (covered) · **Account** (covered)

The "More"-menu burial of Hidden Gems/Luxe is removed — Edits become primary nav alongside Shop and Discover. That single IA move is most of the thesis.

### 4.2 Discovery funnel

| Stage | Intent | Surface | Primary action | Drop-off risk | Metric |
|---|---|---|---|---|---|
| Entry | Varies | Adaptive Home | Engage a module | Generic feed → bounce | Home module engagement |
| Orient | "Show me something" | Editorial / Edit | Open a story/edit | No POV → exit | Collection/story open rate |
| Browse | "Narrow to my taste" | PLP | Open PDP, save | Grid fatigue | Browse→PDP rate |
| Decide | "Is this right for me?" | PDP | Add to bag / save | Low confidence (fit/size/trust) | PDP→add/save |
| Hold | "Keep for later" | Wishlist | Return, move to bag | Never returns | Wishlist→bag |
| Transact | Buy | Bag→checkout (covered) | — | Fulfillment (out of scope) | — |

### 4.3 Journeys (where they differ)

- **First-time / cold start:** no history → **curation/taste-first default**, not a discount wall. *(Assumption — §9.5.)*
- **Returning:** adaptive — recent categories/labels lead; personalized rail appears.
- **Deal-seeker:** deal intent signalled (sale-link arrival or discount-module interaction) → discount path rises in the feed. This is "intent-adaptive".
- **Occasion shopper:** festive/occasion edit surfaces seasonally.
- **Failure paths:** empty wishlist, no-results search, OOS PDP, network error (§7.5).

### 4.4 Use cases (core)

| Actor | Trigger | System behaviour | Failure → recovery |
|---|---|---|---|
| Browser | Opens home | Adaptive feed by signal | No signal → curation default |
| Browser | Opens an edit | Collection + shop-the-story | Empty edit → fallback edit |
| Shopper | Filters PLP | Grid updates, state in URL | No match → relaxed-filter suggestions |
| Shopper | Opens PDP | Visual-first + confidence block | OOS → notify + similar |
| Shopper | Saves item | Wishlist persists (localStorage) | — |
| Deal-seeker | Taps discount module | Discount promoted for session | — |

---

## 5 · Screen / surface inventory (the build plan)

**Prototype reality:** mock JSON data · `localStorage` for wishlist/bag/intent · **simulated** personalization + checkout (heuristics, not ML; labelled) · no real payments · every CTA performs a real mock action.

### Deep — discovery spine

**5.1 Adaptive Home** — curation-led, intent-adaptive entry.
Primary: open a module. Secondary: search, category nav, save.
Modules (order flexes by intent): hero editorial story · featured Edits (Hidden Gems/Luxe/Responsible) · personalized rail (returning) · occasion/seasonal edit · "new in" by taste · discount module (demoted; promoted on deal intent) · brand spotlight.
States: default (cold = curation) · returning (personalized) · deal-intent (discount promoted) · loading (skeleton) · partial (some modules fail) · error.

**5.2 Discover — Editorial / Shop-the-Story** — content-led discovery, Style Files promoted.
Primary: open a story → shoppable products inline. Secondary: save, share, jump to PLP.
States: index · story · empty · loading · error.

**5.3 Edit / Curated destination (template)** — Hidden Gems · Luxe · Responsible · Festive · House of Nykaa.
Primary: browse edit, open PDP. Info: edit narrative header, label story, curated grid.
States: default · empty · loading · error.

**5.4 PLP (category / brand)** — taste-first browse.
Primary: open PDP. Secondary: save, quick-view, filter, sort.
Card (component): image-forward (multi-shot on hover/swipe), name, brand/label, price (+ discount only if present), save, "Responsible" tag where applicable — **no heavy discount chrome by default**.
Filters: category, price, size, color, brand, occasion, Responsible; "Under ₹X" computed. Applied-filter chips; result count.
States: default · loading (skeleton) · empty/no-match (relaxed-filter suggestions) · error · end-of-results.

**5.5 PDP** — decision confidence in a visual-first frame.
Primary: Add to bag. Secondary: save, size-guide, share.
Info: gallery (zoom, multi-shot) · name/brand/label story · price · size selector + guide · fabric/fit/care · delivery/pincode (pattern-only) · styling / "complete the look" · related (shared label/edit/price) · reviews (pattern-only) · sticky add-to-bag.
Decision-confidence block (thesis at PDP): fit/fabric detail + styling context + label story — taste and confidence over spec dump.
States: default · variant-selected · size-not-selected (blocks add, shows why) · OOS (notify + similar) · loading · error.

**5.6 Search** — intent → results inside the discovery frame.
Idle: suggestions (recent, trending, categories, edits). Results in masonry. Phrase/intent parsing is v2+ ("cute festive under ₹2000").
States: idle (suggestions) · results · no-results (edits + popular fallback) · loading · error.

**5.7 Personalized rail (component, simulated)** — "for you" for returning users, from localStorage browse/save signals (heuristic, not ML).
States: cold (hidden or "popular") · warm (personalized) · loading.

**5.8 Wishlist** — move to bag, open PDP, remove; collections in v2.
States: empty · populated · loading.

### Covered — transactional (compact, not reinvented)

| Surface | Purpose | Key states | Note |
|---|---|---|---|
| Bag | Review, qty, coupon, price breakdown | empty · populated · coupon valid/invalid · loading | Pattern-only |
| Checkout | Address → payment → review | address · payment · review · confirmation · error | **No fake payment** — simulate + label |
| Account | Orders, addresses, wishlist | logged-out · logged-in · empty | Covered |
| Order tracking | Post-purchase status | per order state model (§6.4) | Simulated |

---

## 6 · Requirements

### 6.1 Functional (discovery spine)
- User can browse home without searching and reach a PDP in ≤2 taps from any home module.
- User can open an Edit/story and add a featured product to bag/wishlist without leaving it.
- User can filter/sort a PLP; applied filters are visible, removable, and encoded in the URL (shareable, back-safe).
- User can select a variant/size on PDP; System blocks add-to-bag until size is selected and shows why.
- System displays discount only where one exists; System never frames non-sale products with sale chrome.
- System persists wishlist, bag, and intent signal across sessions (localStorage).
- System reorders home modules from intent signal (cold → curation; returning → rail; deal-intent → discount promoted).
- User cannot reach a dead CTA — every visible control performs a real mock-backed action.

### 6.2 Non-functional
Performance: responsive `srcset`, lazy-load below fold, skeletons, no layout shift. Responsive: mobile + desktop in v1 (§7.3); iOS later. Accessibility: WCAG AA (§7.4). Prototype: mock JSON, localStorage state, simulated personalization/checkout, structured so real APIs slot in later.

### 6.3 Business rules vs UX rules

| Business rule (IF→THEN) | UX rule |
|---|---|
| IF product.discount > 0 THEN discount-eligible | Discount shown only when present; never default framing |
| IF price < ₹1000 THEN in "Under ₹1000" (computed) | "Under ₹X" is a computed edit, never a manual tag |
| IF label.responsible THEN "Responsible" tag | Tag on card + PDP; filterable |
| IF user has browse/save signal THEN rail eligible | Rail appears only when warm; cold → hidden/"popular" |
| IF intent = deal THEN promote discount module | Discount rises in feed for the session; curation still reachable |
| IF variant OOS THEN not purchasable | PDP shows OOS + notify + similar, not a silent dead button |

### 6.4 State model (key)
- **Wishlist item:** saved → (in-bag) → removed · persist localStorage.
- **Bag item:** added → qty-changed → removed → moved-to-wishlist.
- **Session intent:** unknown → browsing (category/label weights) → deal-intent · drives adaptive home.
- **PLP filter/sort:** encoded in URL; back/forward safe.
- **Order (simulated):** created → confirmed → packed → shipped → delivered / cancelled / return-requested → refunded.

### 6.5 Data model (mock JSON for the build)
**Product** (id, name, brandId/labelId, price, mrp, discount, images[], variants[], sizes[], fabric, fit, care, tags[], responsible, shelfId, collectionIds[], priceBand) · **Variant** (color, images[], stock) · **Brand/Label** (id, name, story, isHiddenGem, isLuxe) · **Collection/Edit** (id, title, narrative, type[editorial|curated|computed|occasion], productIds[] or rule) · **EditorialStory** (id, cover, blocks, productPins[]) · **Shelf/Category** (tree) · **SaveState / BagState** (localStorage) · **IntentSignal** (weights, dealFlag).

---

## 7 · UX spec

**7.1 Interaction** — card hover/press → lift + multi-shot + save; quick-view (desktop, optional); filters in a bottom sheet (mobile) / rail (desktop); FLIP card→PDP hero carrying the current shot; carousel swipe/arrow/dots (dots hidden-at-rest desktop, visible on touch); sticky add-to-bag on PDP; immediate save feedback + wishlist count.

**7.2 Motion** — scroll reveals with per-column stagger (first screen at rest); FLIP card→PDP; module transitions on adaptive reorder; one easing curve; all collapse under `prefers-reduced-motion`. Motion signals state/continuity, never decoration.

**7.3 Responsive** — Mobile ≤600: 2-col grid, bottom nav, filter bottom-sheet, single-col PDP, sticky add-to-bag. Tablet 600–1024: 3–4 col, hybrid nav. Desktop ≥1024: 4–6 col, top nav + mega-menu, filter rail, 2-col PDP. iOS app = later phase (reuse patterns, native nav).

**7.4 Accessibility (WCAG AA)** — keyboard nav + visible focus; 44px targets; semantic headings (single h1, no skips); AA contrast on all text (discount/accent colours must pass as text); non-colour status (OOS, sale not colour-only); focus-trapped menus/drawers; SR labels on cards/controls; reduced-motion honoured.

**7.5 Edge-case matrix**

| Case | Surface | Behaviour |
|---|---|---|
| Empty | Wishlist / Edit | Encouraging empty state → route to Discover |
| No results | Search / PLP | Relaxed-filter suggestions + popular edits |
| Loading | All | Skeletons; no layout shift |
| Error / network | All | Inline retry; never blank |
| Partial | Home | Failed module hidden, rest renders |
| OOS | PDP / card | Notify + similar; not purchasable |
| First-time | Home / rail | Curation default; rail hidden |
| Long content | Card / story | Truncate + reveal |

**7.6 UX writing** — voice is confident editorial, not sale-barker. CTAs specific ("Add to bag", "Shop the edit", "See the story", "Notify me"). Empty/no-results guide to discovery. Discount language factual, never dominant.

**7.7 Notifications (covered)** — minimal: back-in-stock, saved-item price-drop (opt-in), order status (simulated). Low volume; suppression respected.

---

## 8 · Measurement

**8.1 Events** — `home_module_view` (moduleType, position, intentState) · `collection_open` · `editorial_story_open` · `pdp_view` (source) · `product_save` · `add_to_bag` · `filter_apply` · `search` (query, resultCount) · `intent_signal_change` · `personalized_rail_view/click`.

**8.2 Metrics + guardrails**
- *Primary:* browse→PDP rate from curation surfaces; share of intent-less sessions reaching a PDP without search; curation-surface engagement.
- *Secondary:* PDP→save/add; wishlist→bag; editorial story depth; returning-user rail CTR.
- *Guardrails:* engagement/conversion up must **not** raise return rate, complaint volume, or support tickets; curation must not lean on deeper discounting (watch AOV + margin); never trade fulfillment-driven satisfaction for discovery gloss.

**8.3 Benchmarks** — no reliable public per-metric benchmarks for Nykaa's funnel — **needs validation** with internal analytics. Use internal pre/post, not borrowed numbers.

---

## 9 · Handoff, logs & audit

### 9.1 Claude Code build notes
- Stack (if starting fresh, per brief): React + Next.js + TypeScript + Tailwind + Framer Motion + Lucide. Reuse existing repo config if present.
- Mock-data-first (§6.5); localStorage for wishlist/bag/intent; **simulated** personalization + checkout, clearly labelled; no fake payment; every CTA does something real.
- Build order: data model + tokens → product card → PLP → PDP → Edit template → Editorial → Adaptive Home → Search → transactional (covered) → QA (§7.5 + brief Phase 9 scenarios).
- Component-first (tokens → base → domain), matching your bottom-up working style.

### 9.2 North Star vs v1 (the staging flag)

| Decision | North Star | v1 build (now) |
|---|---|---|
| Intent-adaptive | Real-time behavioural adaptation | **Simulated** — cold/returning/deal via localStorage heuristics |
| All three users | Fully personalized per segment | One adaptive surface; **curation/taste-first cold-start default** |
| Both levers | Editorial + ML personalization | Editorial (real) + personalized rail (**simulated**) |
| Surface | Responsive web → iOS app | Responsive web (desktop + mobile) now; iOS later |

**Honest flag:** a frontend prototype has no behavioural data or recommender, so intent-adaptation and personalization are *demonstrated via heuristics and mock signals* in v1 — the right way to prototype the vision, as long as the build labels them simulated so they aren't mistaken for production personalization.

### 9.3 Dependencies
Catalogue/supply (exists) · real personalization needs a recommender + behavioural data (later) · fulfillment/returns are a **parallel business track** this redesign doesn't own but depends on for its ceiling.

### 9.4 Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Fulfillment pain caps impact | High | High | Measure engagement not only conversion; flag fulfillment as parallel track |
| "All of everything in v1" sprawl | High | High | North Star vs v1 staging (§9.2); simulate what can't be built real |
| Discount demotion hurts GMV | High | Medium | Intent-adaptive keeps the deal path; watch AOV/margin guardrails |
| Premium/editorial vs mass-market price expectation | Medium | Medium | Keep discount discoverable; don't force editorial on price-led intent |
| Simulated personalization mistaken for real | Medium | Medium | Label clearly in build + any demo |

### 9.5 Assumptions
- Cold-start default = curation/taste-first. **(Assumption — my call; change if you disagree.)**
- Responsive web is the v1 target; iOS later. (Confirmed by you.)
- Prototype uses mock data + simulated personalization/checkout. (Research-backed — brief Phase 7.)

### 9.6 Decision log

| Decision | Choice | Revisit when |
|---|---|---|
| Default surface | Intent-adaptive | Discount GMV drops materially → rebalance |
| Primary user | All three via adaptive surface | v1 feels generic → pick a lead segment |
| v1 lever | Editorial (real) + simulated rail | Behavioural data exists → real personalization |
| Surface | Responsive web → iOS | Web validates → app |
| Cold-start | Curation-first (assumption) | First-session bounce high → test discount-first |

### 9.7 Final quality audit
- Problem clear, tied to solution; MVP scoped; non-goals explicit — ✅
- Research sourced + dated, confidence-labelled; user-pain-vs-discovery mismatch surfaced — ✅
- Discovery-spine screens + states defined; transactional covered — ✅
- Requirements testable; business vs UX rules separated; state + data models defined — ✅
- Measurement has guardrails; benchmarks marked needs-validation — ✅
- **Open for you:** confirm cold-start assumption (§9.5); deeper competitor teardown (real Mobbin screens) still available if you want it before building.

## Research log

| Source | Finding | Confidence |
|---|---|---|
| [nykaafashion.com (observed)](https://www.nykaafashion.com) | Discount-grid default; curation buried | High |
| [Credence Research](https://www.credenceresearch.com/report/india-online-fashion-market) · [ECDB](https://ecdb.com/resources/sample-data/market/in/fashion) | Market size/growth; Myntra scale lead | Medium |
| [Redseer/IBEF](https://www.ibef.org/news/india-s-online-retail-to-cross-us-90-billion-in-2026-redseer) | E-com GMV >$90B 2026 | Medium |
| [marlvel.ai teardown](https://marlvel.ai/apps/ajio-online-shopping-app) | Market consolidating on content-led discovery; grid = liability | Low–Medium |
| [Business Today, 2023](https://www.businesstoday.in/magazine/the-buzz/story/nykaa-fashion-needs-a-rejig-heres-why-377111-2023-04-12) | Analyst: assortment/strategy rethink needed | Medium |
| [Trustpilot](https://nl.trustpilot.com/review/nykaafashion.com) · [consumercomplaints.in](https://www.consumercomplaints.in/bycompany/nykaa-fashion-a549994.html) · [JustUseApp](https://justuseapp.com/en/app/1439872423/nykaa-fashion-shopping-app/reviews) | User pain = fulfillment, not discovery; ~4.7/5 app rating | Medium |
