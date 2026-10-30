// Data model — PRD §6.5. Plain, erasable TypeScript so Node scripts can import it directly.

export type TopCategory = "women" | "men" | "kids" | "home";

export interface Label {
  id: string;
  name: string;
  tagline: string;
  story: string;
  origin?: string;
  founded?: number;
  flags: { hiddenGem?: boolean; luxe?: boolean; houseOfNykaa?: boolean; responsible?: boolean };
  tone: { bg: string; fg: string };
}

export interface CategoryNode {
  id: string; // "women/dresses"
  slug: string;
  name: string;
  path: string[];
  parent?: string;
  blurb: string;
  image?: string;
}

/** Options consumed by the art engine (scripts/art) — never read at runtime by the UI. */
export interface ArtBase {
  kind: string;
  [option: string]: string | number | boolean | undefined;
}

/** Compact authoring format; expanded into Product by catalog.ts */
export interface ProductDef {
  id: string;
  name: string;
  label: string;
  path: string; // "women/dresses"
  price: number;
  mrp?: number;
  sizes: string; // key into SIZE_SETS
  fabric: string;
  fit: string;
  tags: string; // space separated
  d: string; // editorial description
  art: ArtBase;
  /** [colour name, hex, colour family, secondary hex?, pattern?] */
  v: Array<[string, string, string, string?, string?]>;
  resp?: 1;
  isNew?: 1;
  /** sizes sold out for every variant, "S,M" */
  oosSizes?: string;
  /** whole product sold out */
  oos?: 1;
  /** sizes with ≤3 units left */
  low?: string;
  bg?: string;
  detailNote?: string;
}

export interface Variant {
  id: string;
  colorName: string;
  colorHex: string;
  family: string;
  images: string[]; // image keys under /img
  stock: Record<string, number>;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  labelId: string;
  categoryPath: string[]; // ["women","dresses"]
  price: number;
  mrp: number;
  discount: number; // percent, 0 when none
  priceBand: PriceBand;
  variants: Variant[];
  sizes: string[];
  fabric: string;
  fit: string;
  care: string[];
  description: string;
  details: string[];
  modelNote?: string;
  tags: string[];
  responsible: boolean;
  isNew: boolean;
  rank: number; // lower = newer / more prominent in curated order
  rating: number;
  ratingCount: number;
  soldOut: boolean;
}

export type PriceBand = "under-1500" | "1500-3000" | "3000-6000" | "6000-15000" | "15000-plus";

export type EditType = "curated" | "editorial" | "computed" | "occasion";

export interface EditRule {
  flags?: Array<"hiddenGem" | "luxe" | "houseOfNykaa">;
  responsible?: boolean;
  anyTags?: string[];
  maxPrice?: number;
  minDiscount?: number;
  newOnly?: boolean;
  labelIds?: string[];
  productIds?: string[];
}

export interface Edit {
  id: string;
  title: string;
  kicker: string;
  narrative: string;
  /** one-line card copy */
  blurb: string;
  type: EditType;
  rule: EditRule;
  theme: "gem" | "luxe" | "resp" | "festive" | "hon" | "ink" | "sand";
  highlights: Array<{ title: string; text: string }>;
  /** primary navigation edits (shown in mega menu / home) vs computed helpers */
  primary: boolean;
}

export type StoryBlock =
  | { t: "p"; text: string }
  | { t: "h"; text: string }
  | { t: "quote"; text: string; by?: string }
  | { t: "scene"; scene: string; caption: string; wide?: boolean }
  | { t: "rail"; title: string; productIds: string[] };

export interface Story {
  id: string;
  title: string;
  kicker: string;
  dek: string;
  author: string;
  readMins: number;
  theme: Edit["theme"];
  editId?: string;
  cover: { wide: string; tall: string };
  blocks: StoryBlock[];
  productIds: string[];
  tags: string[];
}

export interface SceneItem {
  /** product id; art spec is resolved from catalog (variant index is 1-based) */
  product: string;
  v?: number;
  cx: number;
  cy: number;
  height: number;
  rot?: number;
  pin?: boolean;
  z?: number;
}

export interface SceneDef {
  key: string;
  w: number;
  h: number;
  bg: string;
  bg2?: string;
  motif: "arch" | "circle" | "window" | "steps" | "stripe" | "none";
  motifColor?: string;
  safe?: "left" | "right" | "none";
  /** multiplies every item's size — for look-boards of small objects (jewellery, homeware) that would otherwise be lost in the frame */
  scale?: number;
  items: SceneItem[];
  props?: Array<{ type: string; cx: number; cy: number; size: number; color?: string }>;
}

export interface Coupon {
  code: string;
  title: string;
  description: string;
  type: "percent" | "flat";
  value: number;
  maxDiscount?: number;
  minSubtotal: number;
  /** restrict to products whose label flag matches */
  appliesTo?: "hiddenGem" | "luxe" | "houseOfNykaa";
  expired?: boolean;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  size: string;
  fit: "small" | "true" | "large";
  verified: boolean;
  helpful: number;
  date: string; // ISO date
  own?: boolean;
}
