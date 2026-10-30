import type { Edit } from "./types.ts";

// PRD §4.1 — Edits are primary navigation, alongside Shop and Discover.
// "Under ₹X" and "New in" are COMPUTED from rules, never manually tagged (PRD §6.3).
export const edits: Edit[] = [
  {
    id: "hidden-gems",
    title: "Hidden Gems",
    kicker: "Independent labels",
    blurb: "Independent studios from Kutch to Bikaner.",
    narrative:
      "Small studios, long apprenticeships, and techniques older than the word “sustainable”. Every label here is independent, artisan-led and chosen by our editors — not by an ad budget.",
    type: "curated",
    rule: { flags: ["hiddenGem"] },
    theme: "gem",
    primary: true,
    highlights: [
      { title: "Artisan-led", text: "Run by, or in lasting partnership with, the people who make the work." },
      { title: "Small batch", text: "Printed, dyed and woven in runs of dozens — not thousands." },
      { title: "Traceable", text: "Know the village, the studio and, often, the maker." },
    ],
  },
  {
    id: "luxe",
    title: "Luxe",
    kicker: "Atelier & couture",
    blurb: "Silk, zardozi and leather built to be inherited.",
    narrative:
      "Fewer pieces, made better. Luxe gathers ateliers whose work is measured in months of embroidery, bias-cut silk and leather that gets better with age.",
    type: "curated",
    rule: { flags: ["luxe"] },
    theme: "luxe",
    primary: true,
    highlights: [
      { title: "Made to last", text: "Resolable boots, re-lined jackets, repairs for life." },
      { title: "Hand-finished", text: "Zardozi, hand-rolled hems and burnished edges." },
      { title: "Limited runs", text: "Many pieces are made in fewer than two hundred." },
    ],
  },
  {
    id: "responsible",
    title: "The Responsible Edit",
    kicker: "Considered materials",
    blurb: "Natural dyes, organic cotton, handloom and repair.",
    narrative:
      "Clothes made with less: natural dyes, certified organic fibres, recycled yarns and weavers paid by the piece. Not a trend edit — a standing one.",
    type: "curated",
    rule: { responsible: true },
    theme: "resp",
    primary: true,
    highlights: [
      { title: "Better materials", text: "Organic, recycled, natural-dyed or handwoven." },
      { title: "Fair making", text: "Labels that name and pay their makers." },
      { title: "Built to keep", text: "Pieces designed to be worn for years, not weeks." },
    ],
  },
  {
    id: "festive",
    title: "Festive & Wedding",
    kicker: "Occasion",
    blurb: "Zari, chanderi and jhumkas for the season ahead.",
    narrative:
      "Diwali dinners, wedding weeks and the long run of celebrations after. Dressed slowly: start with one piece you love, then build the rest around it.",
    type: "occasion",
    rule: { anyTags: ["festive", "wedding"] },
    theme: "festive",
    primary: true,
    highlights: [
      { title: "Start with one", text: "A saree, a kurta set or a pair of jhumkas — then layer." },
      { title: "Heirloom techniques", text: "Zari, chikankari, bandhani and block-print." },
      { title: "Wear again", text: "Pieces that work beyond the occasion." },
    ],
  },
  {
    id: "house-of-nykaa",
    title: "House of Nykaa",
    kicker: "Our own labels",
    blurb: "Twenty Dresses, RSVP, Nykd, Likha and more.",
    narrative:
      "Our in-house labels, edited. Wardrobe builders, occasion pieces and accessories designed in India for how we actually live and dress.",
    type: "curated",
    rule: { flags: ["houseOfNykaa"] },
    theme: "hon",
    primary: true,
    highlights: [
      { title: "Designed in India", text: "Cut for Indian bodies, climates and calendars." },
      { title: "Considered pricing", text: "Straightforward prices on everyday pieces." },
      { title: "Six labels", text: "Dresses, occasionwear, lounge, indianwear, jewellery." },
    ],
  },

  // ── Computed helpers ────────────────────────────────────────
  {
    id: "new-in",
    title: "New in",
    kicker: "Just landed",
    blurb: "The latest from every edit.",
    narrative: "The newest additions across labels, ordered by arrival.",
    type: "computed",
    rule: { newOnly: true },
    theme: "sand",
    primary: false,
    highlights: [],
  },
  {
    id: "under-1500",
    title: "Under ₹1,500",
    kicker: "Computed edit",
    blurb: "Everyday pieces at honest prices.",
    narrative: "Everything under ₹1,500 — computed from live prices, never hand-tagged.",
    type: "computed",
    rule: { maxPrice: 1499 },
    theme: "sand",
    primary: false,
    highlights: [],
  },
  {
    id: "under-3000",
    title: "Under ₹3,000",
    kicker: "Computed edit",
    blurb: "Considered buys within reach.",
    narrative: "Everything under ₹3,000 — computed from live prices, never hand-tagged.",
    type: "computed",
    rule: { maxPrice: 2999 },
    theme: "sand",
    primary: false,
    highlights: [],
  },
  {
    id: "the-offer-edit",
    title: "The Offer Edit",
    kicker: "Considered markdowns",
    blurb: "Fewer sales, better ones — only where a price has genuinely moved.",
    narrative:
      "A short list of genuine price reductions. We show the discount where one exists and nowhere else, so every percentage on this page is a real one.",
    type: "computed",
    rule: { minDiscount: 1 },
    theme: "ink",
    primary: false,
    highlights: [],
  },
];

export const editById: Record<string, Edit> = Object.fromEntries(edits.map((e) => [e.id, e]));
export const primaryEdits = edits.filter((e) => e.primary);
export const computedEdits = edits.filter((e) => !e.primary);

// Theme → palette (used by headers, tiles and pills).
export const THEMES: Record<Edit["theme"], { bg: string; fg: string; tint: string; accent: string; label: string }> = {
  gem: { bg: "#6c1038", fg: "#ffffff", tint: "#f6e1ea", accent: "#f1d6e1", label: "Hidden Gems" },
  luxe: { bg: "#101010", fg: "#f6efde", tint: "#1b1b1f", accent: "#c5a059", label: "Luxe" },
  resp: { bg: "#2f6b4f", fg: "#ffffff", tint: "#e1f0e8", accent: "#cfe9d9", label: "Responsible" },
  festive: { bg: "#982854", fg: "#ffffff", tint: "#faf0f4", accent: "#ffb020", label: "Festive" },
  hon: { bg: "#f3d7e2", fg: "#001425", tint: "#faf0f4", accent: "#982854", label: "House of Nykaa" },
  ink: { bg: "#001425", fg: "#ffffff", tint: "#12263b", accent: "#ffb020", label: "Offers" },
  sand: { bg: "#f0f4f4", fg: "#001425", tint: "#ffffff", accent: "#982854", label: "Edit" },
};
