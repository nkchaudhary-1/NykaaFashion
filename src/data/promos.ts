/*
 * Pop-ups (PiP): small floating promotional windows — an image or a muted, looping video — that point at a new brand launch, an upcoming collection,
 * an offer, an announcement or any other notification. THE TEMPLATE: to run a campaign, add one object to `promos` below and drop its picture (and
 * optionally its video) in; nothing else changes. docs/PROMOS.md walks through it; src/lib/promo.ts decides which one is shown, where and when.
 *
 * A campaign tied to a brand launch (`launchId`, see src/data/launches.ts) writes itself: before launch it announces the brand and counts down to the
 * date, after launch it says "Now live" and points at the shop — so onboarding a brand also gives it its pop-up with no extra copy.
 *
 * Plain, erasable TypeScript so Node scripts (data:check, the unit tests) import it directly. All content here is sample content.
 */

export type PromoKind = "launch" | "collection" | "offer" | "announcement" | "notification";

export interface PromoMedia {
  /** "video" plays muted and looping (a still `image` is its poster); "image" is a still picture. */
  type: "image" | "video";
  /** image key under /img (docs/LAUNCHES.md explains keys): the picture itself, or the video's poster. */
  image: string;
  /** what the picture shows, for screen readers */
  alt: string;
  /** video files under /public — give both so every browser finds one it can play */
  video?: {
    mp4?: string;
    webm?: string;
    /** true only if the clip has a sound track: it adds a mute / unmute button (the clip always starts muted) */
    hasAudio?: boolean;
  };
  /** the window's picture ratio; default 4/3 (landscape, like a picture-in-picture window). Phones always show a square thumbnail. */
  ratio?: "4/3" | "1/1" | "4/5";
}

export interface PromoCampaign {
  id: string;
  kind: PromoKind;
  /** ties the copy to a brand launch: pre-launch it announces and counts down, after launch it says "Now live" (see `live`). */
  launchId?: string;
  /** small line above the headline; default comes from `kind` */
  eyebrow?: string;
  /** required unless `launchId` is set (then "Vrisa arrives 14 November") */
  headline?: string;
  /** one short line under the headline (a code, a date, a condition); launch campaigns show the countdown here */
  body?: string;
  /** where a click goes; launch campaigns default to the launch page. Required otherwise. */
  cta?: { label: string; href: string };
  /** launch campaigns, once the brand is live (for `liveDays` days): copy and destination; default "Now live" → the shop on the launch page */
  live?: { headline?: string; cta?: { label: string; href: string } };
  liveDays?: number;
  media: PromoMedia;
  /** ISO 8601 with a zone offset. Outside this window the campaign is never shown. */
  startsAt?: string;
  endsAt?: string;
  /**
   * Where it may appear. Paths are matched from the start on whole segments ("/c" covers /c/women/dresses); "/" means the home page only.
   * `include` omitted = every browsing page. Checkout, bag, login, account, admin and the prototype pages never show pop-ups, and neither do product
   * pages, help and info pages unless they are listed in `include`.
   */
  routes?: { include?: string[]; exclude?: string[] };
  /** seconds on the page before it appears; default 6 */
  delaySeconds?: number;
  /** higher wins when several fit the page; 100 or more is "urgent": it ignores the cool-down after a dismissal and the per-visit limit. Default 0. */
  priority?: number;
  /** days a dismissed campaign stays away; default 7 */
  suppressDays?: number;
}

const IST = "+05:30";

export const promos: PromoCampaign[] = [
  {
    // A brand launch, as a video. Everything but the picture comes from the "vrisa" launch in launches.ts.
    id: "vrisa-teaser",
    kind: "launch",
    launchId: "vrisa",
    media: {
      type: "video",
      image: "promo/vrisa-teaser",
      alt: "A woman in a ruby zardozi anarkali in a Jaipur courtyard",
      video: { mp4: "/video/promo/vrisa-teaser.mp4", webm: "/video/promo/vrisa-teaser.webm" },
    },
    routes: { include: ["/", "/discover", "/brands", "/wishlist"] },
    delaySeconds: 5,
    priority: 20,
  },
  {
    // An upcoming collection, as a still: the Halden & Co. debut (launches.ts), shown while people browse the clothes it is about.
    id: "halden-preview",
    kind: "collection",
    launchId: "halden",
    headline: "Halden & Co. — tailoring for the working week",
    cta: { label: "Preview the range", href: "/new-and-next/halden" },
    media: { type: "image", image: "promo/halden-preview", alt: "A sand linen blazer on a wooden hanger against a pale wall" },
    routes: { include: ["/c", "/edits"] },
    delaySeconds: 7,
    priority: 12,
  },
  {
    // An exclusive offer. The code is one of the sample coupons (src/data/commerce.ts).
    id: "first-order",
    kind: "offer",
    headline: "₹300 off your first order",
    body: "Code FIRSTEDIT · orders above ₹1,999",
    cta: { label: "See the offer", href: "/offers" },
    media: { type: "image", image: "promo/first-order", alt: "A woman on a sofa opening a parcel with a folded printed kurta inside" },
    endsAt: `2026-11-30T23:59:00${IST}`,
    routes: { exclude: ["/offers"] },
    delaySeconds: 8,
    priority: 10,
  },
  {
    // An announcement.
    id: "delivery-notice",
    kind: "announcement",
    headline: "Free delivery on orders over ₹1,499",
    body: "This week only, on every address we ship to.",
    cta: { label: "What’s included", href: "/info/shipping" },
    media: { type: "image", image: "promo/delivery-notice", alt: "A hand holding out a kraft-paper parcel at a terracotta front door" },
    startsAt: `2026-10-30T00:00:00${IST}`,
    endsAt: `2026-11-09T23:59:00${IST}`,
    routes: { include: ["/search", "/c"] },
    delaySeconds: 10,
    priority: 5,
  },
];

export const promoById: Record<string, PromoCampaign> = Object.fromEntries(promos.map((p) => [p.id, p]));
