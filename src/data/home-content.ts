// Home page content, following the module stack observed on the live Nykaa Fashion homepage (docs/PRD.md §2.2):
// sale banner → category tiles → "Celebration-ready Categories" → "Iconic Brands, Unreal Savings" → "Build Diwali wardrobe" → SEO copy.
// Titles are the live ones; everything behind them (counts, "up to X% off" stamps, images) is computed from the sample catalogue,
// so a banner never promises more than the listing behind it delivers. Swap this file's copy when the live content is imported.

/** Category tiles (the live homepage's ten, minus lingerie and activewear — the sample catalogue has no products in them). */
export const CATEGORY_TILES: Array<{ id: string; name: string; href: string; cat: string[] }> = [
  { id: "westernwear", name: "Westernwear", href: "/c/women?cat=women%2Fdresses%2Cwomen%2Ftops%2Cwomen%2Fbottoms%2Cwomen%2Fknitwear%2Cwomen%2Fjackets", cat: ["women/dresses", "women/tops", "women/bottoms", "women/knitwear", "women/jackets"] },
  { id: "indianwear", name: "Indianwear", href: "/c/women/indianwear", cat: ["women/indianwear"] },
  { id: "men", name: "Men", href: "/c/men", cat: ["men"] },
  { id: "kids", name: "Kids", href: "/c/kids", cat: ["kids"] },
  { id: "home", name: "Home", href: "/c/home", cat: ["home"] },
  { id: "footwear", name: "Footwear", href: "/c/women/footwear", cat: ["women/footwear"] },
  { id: "bags", name: "Bags", href: "/c/women/bags", cat: ["women/bags"] },
  { id: "jewellery", name: "Jewellery", href: "/c/women/jewellery", cat: ["women/jewellery"] },
];

/** Price-point shortcuts under the hero. */
export const PRICE_TILES: Array<{ label: string; href: string; filter: { maxPrice?: number; minDiscount?: number } }> = [
  { label: "Under ₹999", href: "/c/women?price=0-1000", filter: { maxPrice: 1000 } },
  { label: "Under ₹1,999", href: "/edits/under-1500", filter: { maxPrice: 2000 } },
  { label: "Min. 20% off", href: "/offers", filter: { minDiscount: 20 } },
  { label: "Under ₹3,000", href: "/edits/under-3000", filter: { maxPrice: 3000 } },
];

/** "Celebration-ready Categories": tiles that deep-link into listings pre-filtered by occasion (+ offers). */
export const CELEBRATION_TILES: Array<{ title: string; href: string; cat: string; occ: string; offers?: boolean }> = [
  { title: "Evening dresses", href: "/c/women/dresses?occ=party", cat: "women/dresses", occ: "party" },
  { title: "Event-ready heels", href: "/c/women/footwear?occ=party", cat: "women/footwear", occ: "party" },
  { title: "Wedding-guest indianwear", href: "/c/women/indianwear?occ=wedding", cat: "women/indianwear", occ: "wedding" },
  { title: "Festive jewellery", href: "/c/women/jewellery?occ=festive", cat: "women/jewellery", occ: "festive" },
];

/** "Iconic Brands, Unreal Savings": brand ids in the sample catalogue (live homepage: H&M, Nike, Cider, Puma, US Polo, Libas, Twenty Dresses, Nykd …). */
export const ICONIC_BRANDS = ["hm", "puma", "us-polo", "cider", "vero-moda", "twenty-dresses", "nykd", "rsvp"] as const;

/** "Build Diwali wardrobe": seasonal curated filter tiles — each one is a search the sample catalogue answers. */
export const DIWALI_TILES: Array<{ title: string; q: string }> = [
  { title: "Zari & brocade", q: "zari" },
  { title: "Kurta sets", q: "kurta set" },
  { title: "Chikankari", q: "chikankari" },
  { title: "Jhumkas", q: "jhumka" },
  { title: "Potlis", q: "potli" },
  { title: "Evening heels", q: "heels" },
  { title: "Block-print", q: "block print" },
  { title: "Gifting", q: "gifting" },
];

/** The long SEO copy blocks at the foot of the live homepage, as a tidy accordion grid. */
export const SEO_BLOCKS: Array<{ title: string; body: string }> = [
  { title: "Online fashion shopping", body: "Shop women’s, men’s and kids’ fashion in one place — westernwear, indianwear, footwear, bags and jewellery from house labels and big-name brands. Filter by size, colour, price and occasion, save pieces to your wishlist and check out in a few taps." },
  { title: "Women’s western & indianwear", body: "From everyday dresses, separates and knitwear to kurta sets, sarees and festive edits: browse by occasion — brunch, work, party, festive or wedding — and find outfits that go from desk to dinner." },
  { title: "Home décor", body: "Cushions, throws, candles, vases and tableware to refresh a room — block-printed textiles, stoneware and small-batch objects, delivered with the rest of your order." },
  { title: "Luxe", body: "A separate space for statement pieces and heirloom craft: silks cut on the bias, couture embroidery, leather goods built to age and tailoring for the unhurried." },
  { title: "Hidden Gems", body: "Independent labels and artisan studios, from block-printers in Kutch to silversmiths in Bikaner — discovered, vetted and introduced with the story of who makes them." },
  { title: "Sustainability", body: "The Responsible Collection brings together natural dyes, organic cotton, handloom and repairable pieces, so choosing better is one filter away." },
];

/** The ticker under the hero: the departments and destinations that exist on this site (plain words — no numbers, no claims). */
export const HOME_TICKER: string[] = ["Season sale", "Festive & wedding", "Luxe", "Hidden Gems", "House of Nykaa", "Responsible", "New in", "Style Files"];

/** The one-paragraph statement under the ticker. `accent` is set in the raspberry (an <em> in the heading style). */
export const HOME_STATEMENT = { eyebrow: "The edit", before: "House labels and big names for women, men, kids and home, gathered by ", accent: "occasion", after: "." };

/** Service promises under the home page (generic marketplace copy). */
export const SERVICE_PROMISES: Array<{ title: string; body: string }> = [
  { title: "Genuine products", body: "Every label and listing is verified before it goes live." },
  { title: "Easy returns", body: "Change of mind? Start a return from your account in a few taps." },
  { title: "Secure payments", body: "UPI, cards, wallets and cash on delivery — all clearly labelled." },
];
