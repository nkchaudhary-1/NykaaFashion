// Static copy, navigation config and size guides.

export const TRENDING_SEARCHES = ["block-print kurta", "linen shirt dress", "festive jhumkas", "silk saree", "white sneakers", "chikankari", "oversized tee", "under 2000"];

// Minimal synonym map so "kurti" finds kurtas, "sari" finds sarees, etc.
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  kurti: ["kurta"], kurtis: ["kurta"], sari: ["saree"], saris: ["saree"], sarees: ["saree"],
  tshirt: ["tee"], "t-shirt": ["tee"], tshirts: ["tee"], tees: ["tee"],
  sneakers: ["sneaker"], shoes: ["sneaker", "heel", "loafer", "boot", "mule"], jhumka: ["earrings", "jhumkas"], jhumkas: ["earrings", "jhumka"],
  bangle: ["bangles", "kada"], earring: ["earrings"], necklaces: ["necklace"], handbag: ["bag"], purse: ["bag"], bags: ["bag"],
  jeans: ["denim"], pants: ["trousers"], trouser: ["trousers"], gown: ["dress"], dresses: ["dress"], lehenga: ["festive", "wedding"],
  wedding: ["wedding", "festive"], diwali: ["festive"], party: ["party", "evening"], kidswear: ["kids"], sustainable: ["responsible"], eco: ["responsible"],
  organic: ["responsible"], pooja: ["festive"], sweater: ["knitwear"], cardigan: ["knitwear"],
};

export const FEATURED_BY_TOP: Record<string, { scene: string; title: string; kicker: string; href: string }> = {
  women: { scene: "scenes/cat-women", title: "The Festive Edit", kicker: "Women", href: "/edits/festive" },
  men: { scene: "scenes/cat-men", title: "Quiet Luxe, tailored", kicker: "Men", href: "/discover/quiet-luxe" },
  kids: { scene: "scenes/cat-kids", title: "Little Orchard", kicker: "Kids", href: "/brands/little-orchard" },
  home: { scene: "scenes/cat-home", title: "The Slow Home Edit", kicker: "Home", href: "/discover/the-slow-home" },
};

export const FAQS: Array<{ q: string; a: string }> = [
  { q: "Is this the real Nykaa Fashion?", a: "No. This is a design prototype built to explore a curation-first redesign. It uses mock data, simulated personalisation and a simulated checkout. Nothing here is a real order, payment or product." },
  { q: "How does the homepage adapt?", a: "The prototype looks at what you view, save and add on this device (stored locally) and re-orders the homepage. New visitors see curation first; returning visitors see a ‘picked for you’ rail; people who engage with offers see the offer edit rise. It is a heuristic, not machine learning." },
  { q: "Are payments real?", a: "No. Every payment method is simulated. No card, UPI or banking details are sent anywhere and no money moves. Use the test values shown at checkout." },
  { q: "Will my order arrive?", a: "No order is placed in this prototype. Order tracking is simulated so you can review the experience of order states." },
  { q: "How do I reset the prototype?", a: "Open the Prototype panel (bottom-left on desktop) and choose Reset all data. This clears your bag, wishlist, account and signals from this browser." },
  { q: "What do ‘Hidden Gems’ and ‘Luxe’ mean?", a: "Hidden Gems are independent, artisan-led labels chosen by our editors. Luxe is a short list of ateliers working in silk, leather and couture embroidery." },
  { q: "What is the Responsible Edit?", a: "A standing edit of pieces made with natural dyes, certified organic or recycled fibres, or by handloom and artisan makers who are named and paid fairly." },
  { q: "How do I find my size?", a: "Every product has a size guide with a quick ‘find my size’ calculator. Fit notes and what the model is wearing are shown on each page." },
];

export interface InfoPage {
  title: string;
  intro: string;
  sections: Array<{ h: string; p: string[] }>;
}

export const INFO_PAGES: Record<string, InfoPage> = {
  shipping: {
    title: "Shipping & delivery",
    intro: "How delivery works in this prototype (all values are illustrative).",
    sections: [
      { h: "Delivery options", p: ["Standard delivery is free on orders of ₹1,999 and above, otherwise ₹99. Express delivery is ₹199 and arrives one to two days sooner.", "Estimated delivery dates are calculated from your pincode using a mock service-area table."] },
      { h: "Cash on delivery", p: ["Cash on delivery is available in most serviceable pincodes for a ₹49 handling fee. This is a simulated option — no order is placed."] },
    ],
  },
  returns: {
    title: "Returns & refunds",
    intro: "Illustrative return policy for the prototype.",
    sections: [
      { h: "Easy returns", p: ["In a real experience this page would set out the return window, conditions and refund timelines. The prototype simulates the order states — requested, picked up, refunded — so you can review the flow end to end."] },
      { h: "Fulfilment is a parallel track", p: ["The PRD is clear that delivery, returns and refunds are where customers feel the most pain today. This redesign does not fix them, and its impact is capped until they improve."] },
    ],
  },
  about: {
    title: "About the Style Files",
    intro: "Why this redesign exists.",
    sections: [
      { h: "Taste over discount", p: ["Most fashion marketplaces default to a discount grid. This redesign makes curation the default way to discover — Hidden Gems, Luxe, the Responsible Edit and House of Nykaa sit alongside Shop in the primary navigation."] },
      { h: "A prototype", p: ["All products, labels and stories are fictional prototype content. House of Nykaa label names are used as named in the product brief."] },
    ],
  },
  contact: {
    title: "Contact us",
    intro: "Customer care in a prototype is… also a prototype.",
    sections: [{ h: "Say hello", p: ["Use the Help centre to send a message. Submissions are stored locally in your browser only."] }],
  },
  careers: {
    title: "Careers",
    intro: "Not hiring — this is a prototype.",
    sections: [{ h: "Join the design team?", p: ["There are no real roles here. If you're reviewing this prototype and want to talk about it, get in touch with the author."] }],
  },
  terms: {
    title: "Terms of use",
    intro: "Prototype terms.",
    sections: [{ h: "Prototype use only", p: ["This site is a design prototype. It makes no offer of sale and processes no real payments or orders. Do not enter real payment details."] }],
  },
  privacy: {
    title: "Privacy",
    intro: "What this prototype stores.",
    sections: [{ h: "Local only", p: ["Your bag, wishlist, account, addresses, orders, browsing signals and prototype settings are stored in this browser using localStorage. Nothing is sent to a server. Use ‘Reset all data’ in the Prototype panel to clear it."] }],
  },
};

export interface SizeGuide {
  id: string;
  title: string;
  unit: string;
  columns: string[];
  rows: string[][];
  note: string;
  measure?: Array<{ key: string; label: string; hint: string }>;
}

export const SIZE_GUIDES: Record<string, SizeGuide> = {
  "women-tops": {
    id: "women-tops",
    title: "Women — tops, dresses & indianwear",
    unit: "cm",
    columns: ["Size", "Bust", "Waist", "Hip"],
    rows: [["XS", "80", "62", "86"], ["S", "84", "66", "90"], ["M", "88", "70", "94"], ["L", "94", "76", "100"], ["XL", "100", "82", "106"], ["XXL", "106", "88", "112"]],
    note: "Body measurements. If you are between sizes, size up for a relaxed fit.",
    measure: [{ key: "bust", label: "Bust", hint: "Around the fullest part" }, { key: "waist", label: "Waist", hint: "Around the narrowest part" }, { key: "hip", label: "Hip", hint: "Around the fullest part" }],
  },
  "women-waist": {
    id: "women-waist",
    title: "Women — jeans & trousers",
    unit: "cm",
    columns: ["Size", "Waist", "Hip"],
    rows: [["26", "66", "90"], ["28", "71", "94"], ["30", "76", "98"], ["32", "81", "102"], ["34", "86", "106"]],
    note: "Numeric sizes follow waist in inches.",
    measure: [{ key: "waist", label: "Waist", hint: "Around the narrowest part" }, { key: "hip", label: "Hip", hint: "Around the fullest part" }],
  },
  "men-tops": {
    id: "men-tops",
    title: "Men — shirts, tees & kurtas",
    unit: "cm",
    columns: ["Size", "Chest", "Waist", "Shoulder"],
    rows: [["S", "92", "78", "43"], ["M", "98", "84", "45"], ["L", "104", "90", "47"], ["XL", "110", "96", "49"], ["XXL", "116", "102", "51"]],
    note: "Body measurements. Our relaxed fits are cut with extra room.",
    measure: [{ key: "chest", label: "Chest", hint: "Around the fullest part" }, { key: "waist", label: "Waist", hint: "Around the natural waist" }],
  },
  "men-waist": {
    id: "men-waist",
    title: "Men — trousers",
    unit: "cm",
    columns: ["Size", "Waist", "Hip"],
    rows: [["30", "76", "94"], ["32", "81", "98"], ["34", "86", "102"], ["36", "91", "106"], ["38", "96", "110"]],
    note: "Numeric sizes follow waist in inches.",
    measure: [{ key: "waist", label: "Waist", hint: "Around the natural waist" }],
  },
  "women-shoes": {
    id: "women-shoes",
    title: "Women — footwear",
    unit: "cm",
    columns: ["UK", "EU", "Foot length"],
    rows: [["UK 3", "36", "22.5"], ["UK 4", "37", "23.0"], ["UK 5", "38", "23.5"], ["UK 6", "39", "24.1"], ["UK 7", "40", "24.6"], ["UK 8", "41", "25.2"]],
    note: "Measure your foot from heel to longest toe and choose the nearest size.",
    measure: [{ key: "foot", label: "Foot length", hint: "Heel to longest toe, cm" }],
  },
  "men-shoes": {
    id: "men-shoes",
    title: "Men — footwear",
    unit: "cm",
    columns: ["UK", "EU", "Foot length"],
    rows: [["UK 6", "40", "25.1"], ["UK 7", "41", "25.7"], ["UK 8", "42", "26.2"], ["UK 9", "43", "26.8"], ["UK 10", "44", "27.3"], ["UK 11", "45", "27.9"]],
    note: "Measure your foot from heel to longest toe and choose the nearest size.",
    measure: [{ key: "foot", label: "Foot length", hint: "Heel to longest toe, cm" }],
  },
  kids: {
    id: "kids",
    title: "Kids — clothing",
    unit: "cm",
    columns: ["Size", "Height", "Chest"],
    rows: [["2-3Y", "92–98", "52"], ["4-5Y", "104–110", "56"], ["6-7Y", "116–122", "60"], ["8-9Y", "128–134", "64"], ["10-11Y", "140–146", "68"]],
    note: "Choose by height; if between sizes choose the larger.",
    measure: [{ key: "height", label: "Height", hint: "In cm" }],
  },
};

/** Which size guide applies to a category path; null for one-size products. */
export function sizeGuideKey(path: string[], sizes: string[]): string | null {
  if (sizes.length === 1) return null;
  const [top, sub] = path;
  if (top === "kids") return sub === "footwear" ? null : "kids";
  if (sub === "footwear") return top === "men" ? "men-shoes" : "women-shoes";
  if (top === "men") return sub === "trousers" ? "men-waist" : "men-tops";
  if (top === "women") return sizes[0] === "26" ? "women-waist" : "women-tops";
  return null;
}

export const FOOTER_LINKS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  { title: "Discover", links: [{ label: "Style Files", href: "/discover" }, { label: "Hidden Gems", href: "/edits/hidden-gems" }, { label: "Luxe", href: "/edits/luxe" }, { label: "The Responsible Edit", href: "/edits/responsible" }, { label: "Festive & Wedding", href: "/edits/festive" }, { label: "House of Nykaa", href: "/edits/house-of-nykaa" }] },
  { title: "Shop", links: [{ label: "Women", href: "/c/women" }, { label: "Men", href: "/c/men" }, { label: "Kids", href: "/c/kids" }, { label: "Home", href: "/c/home" }, { label: "All labels", href: "/brands" }, { label: "Offers", href: "/offers" }] },
  { title: "Help", links: [{ label: "Help centre", href: "/help" }, { label: "Shipping & delivery", href: "/info/shipping" }, { label: "Returns & refunds", href: "/info/returns" }, { label: "Track an order", href: "/account/orders" }, { label: "Contact us", href: "/info/contact" }] },
  { title: "About", links: [{ label: "About the Style Files", href: "/info/about" }, { label: "Prototype notes", href: "/prototype" }, { label: "Careers", href: "/info/careers" }, { label: "Terms", href: "/info/terms" }, { label: "Privacy", href: "/info/privacy" }] },
];
