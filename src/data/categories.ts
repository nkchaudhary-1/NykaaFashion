import type { CategoryNode, TopCategory } from "./types.ts";

const L1: Array<{ slug: TopCategory; name: string; blurb: string }> = [
  { slug: "women", name: "Women", blurb: "Dresses, indianwear, separates and the accessories that finish them." },
  { slug: "men", name: "Men", blurb: "Shirts, tailoring and festive kurtas — considered, not loud." },
  { slug: "kids", name: "Kids", blurb: "Soft cottons and festive sets built for playgrounds." },
  { slug: "home", name: "Home", blurb: "Block-printed textiles, stoneware and objects for slow evenings." },
];

const L2: Array<[string, string, string]> = [
  ["women/dresses", "Dresses", "From brunch midis to evening gowns."],
  ["women/indianwear", "Indianwear", "Kurta sets, sarees and festive edits."],
  ["women/tops", "Tops & Tees", "Blouses, tanks and tees to layer or wear alone."],
  ["women/knitwear", "Knitwear", "Sweaters and cardigans in merino, rib and waffle."],
  ["women/bottoms", "Trousers & Skirts", "Wide-leg, pleated and tailored."],
  ["women/jackets", "Jackets", "Blazers, denim and the odd velvet statement."],
  ["women/footwear", "Footwear", "Heels, flats and sneakers."],
  ["women/bags", "Bags", "Totes, top-handles and potlis."],
  ["women/jewellery", "Jewellery", "Jhumkas, chokers and silver stacks."],
  ["men/shirts", "Shirts", "Oxfords, camp collars and silk."],
  ["men/tees", "Tees & Polos", "Everyday crews and henleys."],
  ["men/ethnic", "Kurtas & Festive", "Chikankari, zari and block-print."],
  ["men/trousers", "Trousers", "Chinos, linen and wool."],
  ["men/jackets", "Jackets", "Soft tailoring and waistcoats."],
  ["men/footwear", "Footwear", "Sneakers and leather."],
  ["kids/girls", "Girls", "Dresses, skirts and festive sets."],
  ["kids/boys", "Boys", "Tees, shirts and kurta sets."],
  ["kids/footwear", "Footwear", "Sneakers that keep up."],
  ["home/cushions", "Cushions", "Block-print, linen and piped."],
  ["home/throws", "Throws & Bedding", "Quilted, woven and printed."],
  ["home/decor", "Vases & Decor", "Stoneware, terracotta and dried stems."],
  ["home/candles", "Candles", "Small-batch soy in glass and ceramic."],
  ["home/tableware", "Tableware", "Bowls, mugs and serving ware."],
];

export const categories: CategoryNode[] = [
  ...L1.map((c) => ({ id: c.slug, slug: c.slug, name: c.name, path: [c.slug], blurb: c.blurb })),
  ...L2.map(([id, name, blurb]) => {
    const path = id.split("/");
    return { id, slug: path[1], name, path, parent: path[0], blurb } satisfies CategoryNode;
  }),
];

export const categoryById: Record<string, CategoryNode> = Object.fromEntries(categories.map((c) => [c.id, c]));
export const topCategories = categories.filter((c) => c.path.length === 1);
export const childrenOf = (id: string) => categories.filter((c) => c.parent === id);

export function categoryName(path: string[]): string {
  return categoryById[path.join("/")]?.name ?? path[path.length - 1];
}
