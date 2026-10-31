// Footer content, following the live Nykaa Fashion footer: a dark strip (app + helpline), a link strip (Who are we · Help · Quicklinks · Follow us)
// and a six-column directory (Women · Men · Kids · Luxe · Top brands · House of Nykaa). Entries link to the nearest real listing in the prototype;
// where the live directory names a category or brand the sample catalogue does not carry (watches, toys, Biba, W …) the entry is left out
// rather than pointing at an empty page.
import { WESTERNWEAR_HREF } from "./nav";
import type { NavLink } from "./nav";

export const HELPLINE = { number: "1800-266-3333", tel: "tel:18002663333", hours: "(Monday to Saturday: 10 am - 10 pm, Sunday: 10 am - 7 pm)" };

export const FOOTER_STRIP: {
  who: NavLink[];
  help: NavLink[];
  policies: NavLink[];
  quick: NavLink[];
} = {
  who: [
    { label: "About Us", href: "/info/about" },
    { label: "Careers", href: "/info/careers" },
    { label: "Press", href: "/info/press" },
  ],
  help: [
    { label: "Shipping & Return Policy", href: "/info/shipping" },
    { label: "Help Center", href: "/help" },
    { label: "Terms & Conditions", href: "/info/terms" },
  ],
  policies: [
    { label: "Privacy Policy", href: "/info/privacy" },
    { label: "Responsible Disclosure", href: "/info/responsible-disclosure" },
    { label: "Sell on Nykaa Fashion", href: "/info/sell" },
  ],
  quick: [
    { label: "New & Next", href: "/new-and-next" },
    { label: "Offers", href: "/offers" },
    { label: "Sitemap", href: "/sitemap" },
    { label: "Photo credits", href: "/credits" },
    { label: "Style Files", href: "/discover" },
  ],
};

export const SOCIAL = [
  { name: "Instagram", href: "https://www.instagram.com/nykaafashion/" },
  { name: "Facebook", href: "https://www.facebook.com/nykaafashion/" },
] as const;

const enc = encodeURIComponent;
export const FOOTER_DIRECTORY: Array<{ title: string; links: NavLink[] }> = [
  {
    title: "Women",
    links: [
      { label: "Women’s Indianwear", href: "/c/women/indianwear" },
      { label: "Women’s Westernwear", href: WESTERNWEAR_HREF },
      { label: "Bags", href: "/c/women/bags" },
      { label: "Women’s Footwear", href: "/c/women/footwear" },
      { label: "Women’s Jewellery", href: "/c/women/jewellery" },
      { label: "Fashion Accessories", href: `/c/women?cat=${enc("women/bags,women/jewellery")}` },
      { label: "Lingerie", href: "/brands/nykd" },
      { label: "Women’s Sportswear", href: "/brands/puma" },
    ],
  },
  {
    title: "Men",
    links: [
      { label: "Topwear", href: `/c/men?cat=${enc("men/shirts,men/tees,men/jackets")}` },
      { label: "Bottomwear", href: "/c/men/trousers" },
      { label: "Ethnicwear", href: "/c/men/ethnic" },
      { label: "Men’s Footwear", href: "/c/men/footwear" },
      { label: "Athleisure", href: "/brands/puma" },
    ],
  },
  {
    title: "Kids",
    links: [
      { label: "Kids Indianwear", href: "/c/kids?occ=festive" },
      { label: "Kids Westernwear", href: "/c/kids" },
      { label: "Kids Footwear", href: "/c/kids/footwear" },
      { label: "Girls", href: "/c/kids/girls" },
      { label: "Boys", href: "/c/kids/boys" },
    ],
  },
  {
    title: "Luxe",
    links: [
      { label: "Luxury Ethnic Wear", href: `/edits/luxe?cat=${enc("women/indianwear")}` },
      { label: "Luxury Westernwear", href: `/edits/luxe?cat=${enc("women/dresses,women/tops,women/bottoms,women/jackets")}` },
      { label: "Luxury Dresses", href: `/edits/luxe?cat=${enc("women/dresses")}` },
      { label: "Luxury Bags", href: `/edits/luxe?cat=${enc("women/bags")}` },
      { label: "The Luxe Edit", href: "/edits/luxe" },
    ],
  },
  {
    title: "Top Brands",
    links: [
      { label: "Puma", href: "/brands/puma" },
      { label: "Vero Moda", href: "/brands/vero-moda" },
      { label: "U.S. Polo Assn.", href: "/brands/us-polo" },
      { label: "H&M", href: "/brands/hm" },
      { label: "Cider", href: "/brands/cider" },
      { label: "All brands A–Z", href: "/brands" },
    ],
  },
  {
    title: "House of Nykaa",
    links: [
      { label: "Twenty Dresses By Nykaa Fashion", href: "/brands/twenty-dresses" },
      { label: "Nykd By Nykaa", href: "/brands/nykd" },
      { label: "RSVP By Nykaa Fashion", href: "/brands/rsvp" },
      { label: "Gajra Gang By Nykaa Fashion", href: "/brands/gajra-gang" },
      { label: "Likha By Nykaa Fashion", href: "/brands/likha" },
      { label: "Pipa Bella By Nykaa Fashion", href: "/brands/pipa-bella" },
    ],
  },
];
