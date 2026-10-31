import type { Label, ProductDef } from "./types.ts";

/*
 * New & Next — brand launches. THE TEMPLATE: to onboard a brand, add one object to `launches` below and drop its pictures in public/img/launches/<id>/
 * (docs/LAUNCHES.md walks through it). Everything on /new-and-next and /new-and-next/<id> is built from these objects: the hero and countdown, the
 * announcement, the offers, the product previews, the Notify me button, and — on launch day, with no redeploy — the switch to "Shop now".
 *
 * Plain, erasable TypeScript so Node scripts (data:check, the photo pipeline) import it directly. Brand names that are not in the sample catalogue are
 * fictional; "recently launched" examples point at sample-catalogue labels. All dates, offers and prices are sample content.
 */

export const DAY_MS = 86_400_000;
/** How long a brand stays under "Recently launched". */
export const RECENT_DAYS = 90;

export interface LaunchOffer {
  id: string;
  kind: "early-access" | "discount" | "shipping" | "gift" | "bonus";
  /** the headline of the offer: "Flat 20% off" */
  title: string;
  /** one line of detail: "On the debut collection, launch week only." */
  detail: string;
  /** optional coupon code (copyable on the page) */
  code?: string;
  /** "early": starts at `earlyAccessAt` (members only) · "launch": starts at `launchAt` */
  starts: "early" | "launch";
  /** ISO time the offer ends; omitted = no end */
  endsAt?: string;
}

/** How a brand without a logo file is set in type — Inter Display only, so a brand can only vary weight, tracking and case. */
export interface LaunchWordmark {
  text?: string;
  weight?: number;
  tracking?: string;
  upper?: boolean;
}

export interface LaunchImage {
  /** image key under /img (see docs/LAUNCHES.md for how to cut campaign images) */
  key: string;
  alt: string;
}

export interface BrandLaunch {
  /** url slug and — for a brand that is not in the catalogue yet — the label id of its products */
  id: string;
  brand: {
    name: string;
    tagline: string;
    origin?: string;
    /** shown beside the date: "Occasionwear" */
    category: string;
    /** an existing catalogue label whose products ARE the range (recently launched brands). Omit for a brand whose range is `previews`. */
    labelId?: string;
    /** public path of a logo (SVG/PNG, e.g. /brand/launches/vrisa.svg). Omit and the name is set as a wordmark. */
    logo?: string;
    wordmark?: LaunchWordmark;
    tone: { bg: string; fg: string };
  };
  /** ISO 8601 with an offset: "2026-11-14T11:00:00+05:30" */
  launchAt: string;
  /** members' early access starts (shown in the countdown copy and on the early-access offer) */
  earlyAccessAt?: string;
  /** small line above the headline; defaults to the category */
  eyebrow?: string;
  /** campaign headline. Wrap the word to accent in *asterisks*: "Occasionwear, *redrawn.*" */
  headline: string;
  /** the announcement: one or two sentences */
  dek: string;
  /** optional longer story, one paragraph per entry */
  story?: string[];
  images: {
    /** the banner pair: a wide (16:9) picture for desktop and a tall (4:5) one for phones */
    hero: { wide: string; tall: string };
    /** 3–6 campaign pictures, composed into the editorial gallery in this order */
    gallery: LaunchImage[];
  };
  offers: LaunchOffer[];
  /** overrides where "Shop now" goes once the brand is live (default: the range on its own page, or the brand page for catalogue labels) */
  cta?: { label: string; href: string };
  /**
   * The range shown before launch (wishlist-able, not purchasable) and sold from launch day. Authored in the catalogue's compact product format,
   * so each piece gets a real product page, quick view, wishlist heart and bag line the moment it goes live. Leave empty when `brand.labelId` is set.
   */
  previews: ProductDef[];
}

const IST = "+05:30";

export const launches: BrandLaunch[] = [
  // ── Coming soon ───────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: "vrisa",
    brand: {
      name: "Vrisa",
      tagline: "Occasionwear, hand-finished in Jaipur.",
      origin: "Jaipur",
      category: "Occasion & festive",
      wordmark: { text: "Vrisa", weight: 300, tracking: "0.2em", upper: true },
      tone: { bg: "#f3e1d4", fg: "#4a1d12" },
    },
    launchAt: `2026-11-14T11:00:00${IST}`,
    earlyAccessAt: `2026-11-13T18:00:00${IST}`,
    eyebrow: "Featured launch · Occasion & festive",
    headline: "Occasionwear, *redrawn.*",
    dek: "Vrisa arrives on Nykaa Fashion with a debut collection of zardozi anarkalis, gota-patti sharara sets and brocade jackets — cut for the long festive weekend and finished by hand in Jaipur.",
    story: [
      "Vrisa began as a single table of zardozi karigars in Jaipur’s old city. Today the studio works with forty of them, drawing every silhouette on paper, cutting it in muslin, and only then reaching for silk.",
      "The debut collection keeps the palette warm — marigold, peacock, madder — and the proportions easy: long panels that move, sleeves that let you reach for the camera, dupattas that stay where they are put.",
    ],
    images: {
      hero: { wide: "launches/vrisa/hero-wide", tall: "launches/vrisa/hero-tall" },
      gallery: [
        { key: "launches/vrisa/g1", alt: "A woman in a peach kurta with a carved wooden pendant, one hand on her shoulder" },
        { key: "launches/vrisa/g2", alt: "A woman in a floral-print kurta and orange trousers, seated, close crop" },
        { key: "launches/vrisa/g3", alt: "Pink floral print on a cotton kurta, detail" },
        { key: "launches/vrisa/g4", alt: "A woman in a pink embroidered kurta set against maroon curtains" },
      ],
    },
    offers: [
      { id: "early", kind: "early-access", title: "Shop a night early", detail: "Members open the doors at 6 pm on Friday 13 November — a full day before everyone else.", starts: "early" },
      { id: "debut", kind: "discount", title: "Flat 20% off the debut", detail: "On every piece in the first collection, launch week only.", code: "VRISA20", starts: "launch", endsAt: `2026-11-21T23:59:00${IST}` },
      { id: "ship", kind: "shipping", title: "Free express delivery", detail: "On every Vrisa order placed in launch week — to your door in two days.", starts: "launch", endsAt: `2026-11-21T23:59:00${IST}` },
      { id: "welcome", kind: "bonus", title: "₹500 off ₹3,999", detail: "On your first Vrisa order, on top of the launch price.", code: "HELLOVRISA", starts: "launch" },
    ],
    previews: [
      { id: "vri-01", name: "Zardozi Anarkali Set", label: "vrisa", path: "women/indianwear", price: 8990, mrp: 11990, sizes: "xs-xxl", fabric: "Silk chanderi with zardozi", fit: "Anarkali with churidar and dupatta", tags: "festive wedding evening", d: "A floor-skimming anarkali with a hand-worked zardozi yoke, cut on six panels so it swings without weight. Comes with a fitted churidar and a net dupatta edged in gota.", art: { kind: "launch" }, v: [["Marigold", "#d9a21b", "yellow"], ["Peacock", "#1f5a5a", "green"]], isNew: 1 },
      { id: "vri-02", name: "Gota-Patti Sharara Set", label: "vrisa", path: "women/indianwear", price: 7490, mrp: 9490, sizes: "xs-xxl", fabric: "Georgette with gota-patti", fit: "Short kurta with a flared sharara", tags: "festive wedding evening", d: "A short, easy kurta over a wide sharara whose hem is lined in hand-applied gota-patti. Dances beautifully.", art: { kind: "launch" }, v: [["Madder", "#a33b3b", "red"], ["Ivory", "#f1ead9", "white"]], isNew: 1 },
      { id: "vri-03", name: "Banarasi Brocade Jacket Kurta", label: "vrisa", path: "women/indianwear", price: 6490, sizes: "xs-xxl", fabric: "Banarasi brocade, cotton silk lining", fit: "Straight kurta with a cropped jacket", tags: "festive wedding day", d: "A straight kurta layered under a cropped brocade jacket — the quickest way to turn a simple set into an occasion.", art: { kind: "launch" }, v: [["Plum", "#6b2d4f", "purple"], ["Gold", "#c9a769", "gold"]], isNew: 1 },
      { id: "vri-04", name: "Bandhani Silk Dupatta", label: "vrisa", path: "women/indianwear", price: 2490, sizes: "free", fabric: "Gajji silk, bandhani", fit: "2.5 m · finished edges", tags: "festive gifting wedding", d: "Tied, dyed and untied by hand in Jamnagar. No two bandhani dots are alike.", art: { kind: "launch" }, v: [["Peacock", "#1f5a5a", "green"], ["Marigold", "#d9a21b", "yellow"]], isNew: 1 },
      { id: "vri-05", name: "Pearl & Kundan Chandbalis", label: "vrisa", path: "women/jewellery", price: 1990, sizes: "free", fabric: "Kundan, freshwater pearl, gold-plated brass", fit: "Statement · 6.5 cm drop", tags: "festive wedding gifting", d: "Crescent chandbalis with a cascade of freshwater pearls, set in kundan by the same hands that finish the clothes.", art: { kind: "launch" }, v: [["Gold", "#c9a769", "gold"]], isNew: 1 },
      { id: "vri-06", name: "Embroidered Velvet Juttis", label: "vrisa", path: "women/footwear", price: 2290, sizes: "shoe-w", fabric: "Velvet upper with zari embroidery, cushioned insole", fit: "True to size · flat", tags: "festive wedding evening", d: "Velvet juttis embroidered in zari, with a cushioned insole that gets you through the whole function.", art: { kind: "launch" }, v: [["Madder", "#a33b3b", "red"], ["Peacock", "#1f5a5a", "green"]], isNew: 1 },
    ],
  },
  {
    id: "halden",
    brand: {
      name: "Halden & Co.",
      tagline: "Tailoring for the working week.",
      origin: "Bengaluru",
      category: "Tailoring & workwear",
      wordmark: { text: "Halden & Co.", weight: 600, tracking: "-0.04em" },
      tone: { bg: "#e4e6df", fg: "#1f2a22" },
    },
    launchAt: `2026-11-28T11:00:00${IST}`,
    earlyAccessAt: `2026-11-27T18:00:00${IST}`,
    eyebrow: "Coming soon · Tailoring & workwear",
    headline: "Cut for the *working week.*",
    dek: "Halden & Co. brings soft-shouldered blazers, pleated trousers and honest knits to Nykaa Fashion — the pieces that make Monday to Friday simpler, in fabrics that cope with all of it.",
    story: [
      "Halden & Co. started with one question: why do work clothes feel like a costume? The answer was in the shoulder — so the studio started there, with a blazer padded by nothing but good cutting.",
      "Everything is made in one Bengaluru workroom, in linen, merino and wool blends that wear in rather than out.",
    ],
    images: {
      hero: { wide: "launches/halden/hero-wide", tall: "launches/halden/hero-tall" },
      gallery: [
        { key: "launches/halden/g1", alt: "A woman in a yellow blazer and black wide-leg trousers against a shuttered shopfront" },
        { key: "launches/halden/g2", alt: "Close portrait of a woman in a black blazer" },
        { key: "launches/halden/g3", alt: "Pale teal wide-leg trousers with black heels, detail" },
        { key: "launches/halden/g4", alt: "A woman in a grey herringbone blazer against a cream wall" },
      ],
    },
    offers: [
      { id: "early", kind: "early-access", title: "Early access, 24 hours", detail: "Members shop from 6 pm on Friday 27 November, before the public launch.", starts: "early" },
      { id: "intro", kind: "discount", title: "15% off your first two pieces", detail: "Launch fortnight. Mix any two from the debut range.", code: "HALDEN15", starts: "launch", endsAt: `2026-12-12T23:59:00${IST}` },
      { id: "alter", kind: "gift", title: "Free alterations", detail: "Hemming and sleeve lengths on every blazer and trouser, on the house.", starts: "launch" },
    ],
    previews: [
      { id: "hal-01", name: "Soft-Shoulder Linen Blazer", label: "halden", path: "women/jackets", price: 7990, mrp: 9990, sizes: "xs-xl", fabric: "Washed Irish linen, half-lined", fit: "Relaxed, soft shoulder", tags: "work day tailoring", d: "A blazer built without shoulder pads: the structure comes from the cut. Half-lined in cotton so it breathes.", art: { kind: "launch" }, v: [["Oat", "#d3c3a4", "beige"], ["Charcoal", "#8d8d8b", "grey"]], isNew: 1 },
      { id: "hal-02", name: "Pleated Wide-Leg Trousers", label: "halden", path: "women/bottoms", price: 4490, sizes: "waist-w", fabric: "Linen-viscose twill", fit: "High waist, wide leg", tags: "work day tailoring", d: "Double pleats and a wide leg that falls straight — the trouser that works with everything in this collection.", art: { kind: "launch" }, v: [["Oat", "#d3c3a4", "beige"], ["Ink", "#1f1d1b", "black"]], isNew: 1 },
      { id: "hal-03", name: "Poplin Relaxed Shirt", label: "halden", path: "women/tops", price: 3290, sizes: "xs-xl", fabric: "Organic cotton poplin", fit: "Relaxed, dropped shoulder", tags: "work day casual", d: "A crisp, slightly oversized shirt in organic poplin. Tucks, untucks, layers.", art: { kind: "launch" }, v: [["White", "#f1ead9", "white"], ["Sky", "#3a5a8c", "blue"]], isNew: 1 },
      { id: "hal-04", name: "Merino Rib Knit Vest", label: "halden", path: "women/knitwear", price: 3990, sizes: "xs-xl", fabric: "Extra-fine merino", fit: "Fitted, V-neck", tags: "work winter tailoring", d: "A fine merino vest to layer under a blazer or wear alone on warm office days.", art: { kind: "launch" }, v: [["Cream", "#f1ead9", "white"], ["Forest", "#5b7a52", "green"]], isNew: 1 },
      { id: "hal-05", name: "Tailored Wool-Blend Coat", label: "halden", path: "women/jackets", price: 12990, mrp: 15990, sizes: "xs-xl", fabric: "Wool-blend twill, fully lined", fit: "Straight, knee length", tags: "winter work tailoring", d: "A knee-length coat with a clean shoulder and deep pockets. Cut to sit over the blazer, not squash it.", art: { kind: "launch" }, v: [["Camel", "#a0603a", "brown"], ["Charcoal", "#8d8d8b", "grey"]], isNew: 1 },
      { id: "hal-06", name: "Leather Penny Loafers", label: "halden", path: "women/footwear", price: 5490, sizes: "shoe-w", fabric: "Vegetable-tanned leather, leather sole", fit: "True to size", tags: "work day tailoring", d: "Classic penny loafers in vegetable-tanned leather that softens to your foot.", art: { kind: "launch" }, v: [["Tan", "#a0603a", "brown"], ["Black", "#1f1d1b", "black"]], isNew: 1 },
    ],
  },
  {
    id: "kiln-and-linen",
    brand: {
      name: "Kiln & Linen",
      tagline: "Slow objects for the whole house.",
      origin: "Pondicherry",
      category: "Home & living",
      wordmark: { text: "Kiln & Linen", weight: 400, tracking: "-0.02em" },
      tone: { bg: "#ece4d8", fg: "#3a2e22" },
    },
    launchAt: `2026-12-12T11:00:00${IST}`,
    earlyAccessAt: `2026-12-11T18:00:00${IST}`,
    eyebrow: "Coming soon · Home & living",
    headline: "Objects for *slow evenings.*",
    dek: "Kiln & Linen joins Nykaa Fashion with stoneware, stonewashed linen and hand-poured candles — everything for a table, a bed or a corner that is meant to be lingered in.",
    images: {
      hero: { wide: "launches/kiln-and-linen/hero-wide", tall: "launches/kiln-and-linen/hero-tall" },
      gallery: [
        { key: "launches/kiln-and-linen/g1", alt: "Grey stoneware vases and jugs on a white surface" },
        { key: "launches/kiln-and-linen/g2", alt: "Earthy stoneware bowls stacked on a tray" },
        { key: "launches/kiln-and-linen/g3", alt: "A speckled white stoneware plate, close up" },
        { key: "launches/kiln-and-linen/g4", alt: "Speckled white stoneware bowls on a white table" },
      ],
    },
    offers: [
      { id: "early", kind: "early-access", title: "Members first", detail: "Early access from 6 pm on Friday 11 December.", starts: "early" },
      { id: "set", kind: "bonus", title: "Buy 2, get a candle", detail: "Any two pieces from the debut range and a beeswax candle is added to your bag.", starts: "launch", endsAt: `2026-12-26T23:59:00${IST}` },
      { id: "ship", kind: "shipping", title: "Free delivery over ₹1,999", detail: "On every Kiln & Linen order, launch month.", starts: "launch" },
    ],
    previews: [
      { id: "kil-01", name: "Bouclé Cushion Cover Set", label: "kiln-and-linen", path: "home/cushions", price: 2490, sizes: "free", fabric: "Cotton bouclé, hidden zip", fit: "Set of 2 · 45 × 45 cm", tags: "home living soft", d: "Two textured bouclé covers in a soft neutral. Hidden zips, generous 45 cm squares.", art: { kind: "launch" }, v: [["Oat", "#d3c3a4", "beige"], ["Clay", "#d27a46", "orange"]], isNew: 1 },
      { id: "kil-02", name: "Stonewashed Linen Throw", label: "kiln-and-linen", path: "home/throws", price: 3990, mrp: 4990, sizes: "free", fabric: "Stonewashed European linen", fit: "130 × 180 cm", tags: "home living soft", d: "Washed until it is already soft. A throw for the arm of the sofa and the foot of the bed.", art: { kind: "launch" }, v: [["Flax", "#d3c3a4", "beige"], ["Sage", "#5b7a52", "green"]], isNew: 1 },
      { id: "kil-03", name: "Hand-Thrown Stoneware Vase", label: "kiln-and-linen", path: "home/decor", price: 2990, sizes: "free", fabric: "Glazed stoneware", fit: "24 cm tall", tags: "home decor gifting", d: "Wheel-thrown, glazed once and fired in a wood kiln. The glaze pools differently on every piece.", art: { kind: "launch" }, v: [["Oat", "#d3c3a4", "beige"], ["Ink", "#1f1d1b", "black"]], isNew: 1 },
      { id: "kil-04", name: "Beeswax Pillar Candle Trio", label: "kiln-and-linen", path: "home/candles", price: 1490, sizes: "free", fabric: "Beeswax, cotton wick", fit: "Set of 3 · burns 30 hours each", tags: "home candles gifting", d: "Three hand-poured beeswax pillars with a honey scent that is entirely the wax.", art: { kind: "launch" }, v: [["Honey", "#d9a21b", "yellow"]], isNew: 1 },
      { id: "kil-05", name: "Terracotta Dinner Set, 12 pc", label: "kiln-and-linen", path: "home/tableware", price: 5990, mrp: 7490, sizes: "free", fabric: "Glazed terracotta", fit: "Serves 4 · dishwasher safe", tags: "home tableware gifting", d: "Twelve pieces for four: dinner plates, side plates and bowls, in a warm terracotta glaze.", art: { kind: "launch" }, v: [["Terracotta", "#d27a46", "orange"], ["Oat", "#d3c3a4", "beige"]], isNew: 1 },
      { id: "kil-06", name: "Washed Linen Duvet Cover", label: "kiln-and-linen", path: "home/throws", price: 6490, sizes: "free", fabric: "Stonewashed linen", fit: "Double · 220 × 240 cm", tags: "home living soft", d: "A linen duvet cover that wrinkles beautifully and gets softer every wash.", art: { kind: "launch" }, v: [["Flax", "#d3c3a4", "beige"], ["Stone", "#8d8d8b", "grey"]], isNew: 1 },
    ],
  },

  // ── Recently launched — brands already in the sample catalogue (their range is the catalogue label) ─────────────
  {
    id: "hm",
    brand: { name: "H&M", tagline: "Denim and everyday basics.", category: "Everyday basics", labelId: "hm", wordmark: { text: "H&M", weight: 800, tracking: "-0.05em" }, tone: { bg: "#fde4e4", fg: "#5a1515" } },
    launchAt: `2026-10-03T11:00:00${IST}`,
    eyebrow: "Now on Nykaa Fashion · Everyday basics",
    headline: "Everyday basics, *now here.*",
    dek: "Denim, knits and the easiest layers of the season arrived on Nykaa Fashion with a launch campaign built around one idea: dress well without thinking about it.",
    images: { hero: { wide: "launches/hm/hero-wide", tall: "launches/hm/hero-tall" }, gallery: [] },
    offers: [
      { id: "launch", kind: "discount", title: "Launch offer: 15% off", detail: "On your first H&M order on Nykaa Fashion.", code: "HMNEW15", starts: "launch" },
      { id: "ship", kind: "shipping", title: "Free delivery", detail: "On every H&M order over ₹1,499.", starts: "launch" },
    ],
    previews: [],
  },
  {
    id: "cider",
    brand: { name: "Cider", tagline: "Trend-led knitwear.", category: "Knitwear", labelId: "cider", wordmark: { text: "cider", weight: 700, tracking: "-0.03em" }, tone: { bg: "#fff0f6", fg: "#7a1a47" } },
    launchAt: `2026-09-19T11:00:00${IST}`,
    eyebrow: "Now on Nykaa Fashion · Knitwear",
    headline: "Knits for the *cool months.*",
    dek: "Cider brings its trend-led knitwear to Nykaa Fashion just as the weather turns: cropped cardigans, chunky stripes and soft rib in every colour of the season.",
    images: { hero: { wide: "launches/cider/hero-wide", tall: "launches/cider/hero-tall" }, gallery: [] },
    offers: [{ id: "launch", kind: "discount", title: "10% off your first order", detail: "New to Cider on Nykaa Fashion.", code: "CIDER10", starts: "launch" }],
    previews: [],
  },
  {
    id: "hearth-and-hue",
    brand: { name: "Hearth & Hue", tagline: "Objects for slow evenings.", category: "Home & living", labelId: "hearth-and-hue", wordmark: { text: "Hearth & Hue", weight: 400, tracking: "-0.02em" }, tone: { bg: "#efe6da", fg: "#3a2e22" } },
    launchAt: `2026-08-22T11:00:00${IST}`,
    eyebrow: "Now on Nykaa Fashion · Home & living",
    headline: "Candles, vases and *soft things.*",
    dek: "Hearth & Hue made its Nykaa Fashion debut with candles, vases and soft furnishings in amber, clay and oat — poured and made in small batches in Goa.",
    images: { hero: { wide: "launches/hearth-and-hue/hero-wide", tall: "launches/hearth-and-hue/hero-tall" }, gallery: [] },
    offers: [{ id: "launch", kind: "bonus", title: "A candle with every order", detail: "Over ₹2,499, while the launch stock lasts.", starts: "launch" }],
    previews: [],
  },
];

export const launchById: Record<string, BrandLaunch> = Object.fromEntries(launches.map((l) => [l.id, l]));

// ── time ─────────────────────────────────────────────────────────────────────────────────────────────────────────
export const launchAtMs = (l: BrandLaunch) => Date.parse(l.launchAt);
export const earlyAtMs = (l: BrandLaunch) => (l.earlyAccessAt ? Date.parse(l.earlyAccessAt) : null);
/** Launch day has arrived. The only rule that decides "Coming soon" vs "Shop now". */
export const isLaunched = (l: BrandLaunch, now: number) => now >= launchAtMs(l);
export const isRecentlyLaunched = (l: BrandLaunch, now: number) => isLaunched(l, now) && now - launchAtMs(l) <= RECENT_DAYS * DAY_MS;

/** Not yet launched, soonest first. */
export const upcomingLaunches = (now: number) => launches.filter((l) => !isLaunched(l, now)).sort((a, b) => launchAtMs(a) - launchAtMs(b));
/** Launched within RECENT_DAYS, newest first. */
export const recentLaunches = (now: number) => launches.filter((l) => isRecentlyLaunched(l, now)).sort((a, b) => launchAtMs(b) - launchAtMs(a));
/** The launch the hub leads with: the next one due, or — if nothing is due — the newest arrival. */
export const featuredLaunch = (now: number): BrandLaunch | null => upcomingLaunches(now)[0] ?? recentLaunches(now)[0] ?? null;

// ── what the launches add to the catalogue's lookup tables (never to its listings) ──────────────────────────────
/** Compact product definitions of every launch brand that is not in the catalogue yet. */
export const launchProductDefs: ProductDef[] = launches.flatMap((l) => l.previews);
/** Labels for those brands. They go into `labelById` so product pages, cards and the wishlist can name the brand — not into the brands directory. */
export const launchLabels: Label[] = launches
  .filter((l) => !l.brand.labelId)
  .map((l) => ({ id: l.id, name: l.brand.name, tagline: l.brand.tagline, story: `${l.dek} Sample content: launch dates, offers and prices on this page are illustrative.`, origin: l.brand.origin, flags: {}, tone: l.brand.tone }));
/** product id → the launch it belongs to */
export const launchOfProduct: Record<string, string> = Object.fromEntries(launches.flatMap((l) => l.previews.map((p) => [p.id, l.id])));

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); // the catalogue's own rule
/** product page slug → the launch it belongs to (the proxy uses this to keep a piece's page closed until launch day) */
export const launchOfSlug: Record<string, string> = Object.fromEntries(launches.flatMap((l) => l.previews.map((p) => [slugify(p.name), l.id])));

/** The moment a not-yet-launched product can be bought, or null when it can be (it is not part of a launch, or launch day has passed). */
export function lockedUntil(productId: string, now: number): number | null {
  const l = launchById[launchOfProduct[productId]];
  return l && !isLaunched(l, now) ? launchAtMs(l) : null;
}

// ── the simulated clock (a prototype control so every state can be shown without waiting) ──────────────────────
export const CLOCK_COOKIE = "nf_launch_offset";
/** Milliseconds added to the real time. Parsed from a cookie value; anything unusable is 0. */
export function clockOffset(raw: string | null | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && Math.abs(n) <= 400 * DAY_MS ? Math.round(n) : 0;
}
