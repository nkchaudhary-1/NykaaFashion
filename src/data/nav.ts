// Navigation content, following the live Nykaa Fashion header: Women · Men · Kids · Home · More, and under them a row of
// department tabs (What’s New, Sale, then categories) — some with a short dropdown whose first entry is "Shop All".
// Where the sample catalogue is thinner than the live one, tabs point at the nearest real listing instead of a dead end;
// "What’s New" and "Sale" are real filtered listings (?sort=new, ?offers=1), not placeholders.

export type Dept = "women" | "men" | "kids" | "home";
export interface NavLink {
  label: string;
  href: string;
}
export interface NavTab extends NavLink {
  /** Dropdown entries. "Shop All" (the tab's own href) is added in front by the panel. */
  items?: NavLink[];
}

/** Placeholder of the header search field and the search overlay's input (the live field reads "Search for products, sty…"). */
export const SEARCH_PLACEHOLDER = "Search for products, styles and brands";

export const DEPTS: Array<{ id: Dept; label: string }> = [
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
  { id: "kids", label: "Kids" },
  { id: "home", label: "Home" },
];

const WESTERN = ["women/dresses", "women/tops", "women/bottoms", "women/knitwear", "women/jackets"];
export const WESTERNWEAR_HREF = `/c/women?cat=${encodeURIComponent(WESTERN.join(","))}`;

const newIn = (d: Dept) => `/c/${d}?sort=new`;
const onSale = (d: Dept) => `/c/${d}?offers=1&sort=discount`;

const whatsNew = (d: Dept, cats: Array<[label: string, id: string]>): NavTab => ({
  label: "What’s New",
  href: newIn(d),
  items: cats.map(([label, id]) => ({ label, href: `/c/${id}?sort=new` })),
});
const sale = (d: Dept): NavTab => ({
  label: "Sale",
  href: onSale(d),
  items: [
    { label: "Under ₹2,000", href: `/c/${d}?offers=1&price=0-2000` },
    { label: "Under ₹3,000", href: `/c/${d}?offers=1&price=0-3000` },
    { label: "Coupons & offers", href: "/offers" },
  ],
});

export const DEPT_TABS: Record<Dept, NavTab[]> = {
  women: [
    whatsNew("women", [["Dresses", "women/dresses"], ["Indian Wear", "women/indianwear"], ["Tops & Tees", "women/tops"], ["Footwear", "women/footwear"], ["Bags", "women/bags"]]),
    sale("women"),
    {
      label: "Western Wear",
      href: WESTERNWEAR_HREF,
      items: [
        { label: "Dresses", href: "/c/women/dresses" },
        { label: "Tops & Tees", href: "/c/women/tops" },
        { label: "Knitwear", href: "/c/women/knitwear" },
        { label: "Trousers & Skirts", href: "/c/women/bottoms" },
        { label: "Jackets", href: "/c/women/jackets" },
      ],
    },
    { label: "Indian Wear", href: "/c/women/indianwear" },
    { label: "Winterwear", href: "/c/women?occ=winter" },
    { label: "Footwear", href: "/c/women/footwear" },
    { label: "Bags", href: "/c/women/bags" },
    { label: "Jewellery", href: "/c/women/jewellery" },
  ],
  men: [
    whatsNew("men", [["Shirts", "men/shirts"], ["Tees & Polos", "men/tees"], ["Kurtas & Festive", "men/ethnic"], ["Footwear", "men/footwear"]]),
    sale("men"),
    {
      label: "Topwear",
      href: "/c/men?cat=men%2Fshirts%2Cmen%2Ftees%2Cmen%2Fjackets",
      items: [
        { label: "Shirts", href: "/c/men/shirts" },
        { label: "Tees & Polos", href: "/c/men/tees" },
        { label: "Jackets", href: "/c/men/jackets" },
      ],
    },
    { label: "Bottomwear", href: "/c/men/trousers" },
    { label: "Ethnicwear", href: "/c/men/ethnic" },
    { label: "Footwear", href: "/c/men/footwear" },
  ],
  kids: [
    whatsNew("kids", [["Girls", "kids/girls"], ["Boys", "kids/boys"], ["Footwear", "kids/footwear"]]),
    sale("kids"),
    { label: "Girls", href: "/c/kids/girls" },
    { label: "Boys", href: "/c/kids/boys" },
    { label: "Footwear", href: "/c/kids/footwear" },
  ],
  home: [
    whatsNew("home", [["Cushions", "home/cushions"], ["Throws & Bedding", "home/throws"], ["Vases & Decor", "home/decor"], ["Candles", "home/candles"]]),
    sale("home"),
    { label: "Cushions", href: "/c/home/cushions" },
    { label: "Throws & Bedding", href: "/c/home/throws" },
    { label: "Vases & Decor", href: "/c/home/decor" },
    { label: "Candles", href: "/c/home/candles" },
    { label: "Tableware", href: "/c/home/tableware" },
  ],
};

/** The "More" menu. The live site shows poster tiles for Luxe Edit, Hidden Gems, Global Store, Revolve and Fitzone; the prototype builds
 *  Luxe, Hidden Gems and its other curated destinations, so those are the tiles (Global Store, Revolve and Fitzone are not built). */
export const MORE_TILES: Array<{ title: string; kicker: string; href: string; scene: string }> = [
  { title: "Luxe Edit", kicker: "Nykaa Fashion Luxe", href: "/edits/luxe", scene: "scenes/edit-luxe-tall" },
  { title: "Hidden Gems", kicker: "Independent labels", href: "/edits/hidden-gems", scene: "scenes/edit-hidden-gems-tall" },
  { title: "Responsible", kicker: "The Responsible Collection", href: "/edits/responsible", scene: "scenes/edit-responsible-tall" },
  { title: "Festive & Wedding", kicker: "Celebrations", href: "/edits/festive", scene: "scenes/edit-festive-tall" },
  { title: "House of Nykaa", kicker: "Our own labels", href: "/edits/house-of-nykaa", scene: "scenes/edit-house-of-nykaa-tall" },
  { title: "Style Files", kicker: "Editorial", href: "/discover", scene: "scenes/story-diwali-tall" },
];
export const MORE_LINKS: NavLink[] = [
  { label: "All brands A–Z", href: "/brands" },
  { label: "Offers", href: "/offers" },
  { label: "All curated edits", href: "/edits" },
];

/** Which department a route belongs to (drives the second row). Products resolve through their category; everything else defaults to Women. */
export function deptOfPath(pathname: string, categoryOfSlug?: (slug: string) => string | undefined): Dept {
  const c = /^\/c\/(women|men|kids|home)(\/|$)/.exec(pathname);
  if (c) return c[1] as Dept;
  const p = /^\/p\/([^/]+)/.exec(pathname);
  const top = p && categoryOfSlug?.(p[1]);
  return top === "men" || top === "kids" || top === "home" ? top : "women";
}
