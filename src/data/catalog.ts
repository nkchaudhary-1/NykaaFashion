import { defs } from "./catalog-defs.ts";
import { labelById } from "./labels.ts";
import type { PriceBand, Product, ProductDef, Variant } from "./types.ts";

export const SIZE_SETS: Record<string, string[]> = {
  "xs-xl": ["XS", "S", "M", "L", "XL"],
  "xs-xxl": ["XS", "S", "M", "L", "XL", "XXL"],
  "s-xxl": ["S", "M", "L", "XL", "XXL"],
  "waist-w": ["26", "28", "30", "32", "34"],
  "waist-m": ["30", "32", "34", "36", "38"],
  "shoe-w": ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8"],
  "shoe-m": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
  "kids-a": ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y"],
  "kids-shoe": ["UK 8C", "UK 9C", "UK 10C", "UK 11C", "UK 12C"],
  free: ["One size"],
};

export const COLOR_FAMILIES: Record<string, { name: string; hex: string }> = {
  black: { name: "Black", hex: "#1f1d1b" },
  white: { name: "White & ivory", hex: "#f1ead9" },
  beige: { name: "Beige & sand", hex: "#d3c3a4" },
  brown: { name: "Brown & rust", hex: "#a0603a" },
  red: { name: "Red & maroon", hex: "#a33b3b" },
  pink: { name: "Pink & blush", hex: "#e2a9a6" },
  orange: { name: "Orange & clay", hex: "#d27a46" },
  yellow: { name: "Yellow & marigold", hex: "#d9a21b" },
  green: { name: "Green & olive", hex: "#5b7a52" },
  blue: { name: "Blue & indigo", hex: "#3a5a8c" },
  purple: { name: "Purple & plum", hex: "#6b2d4f" },
  grey: { name: "Grey & charcoal", hex: "#8d8d8b" },
  gold: { name: "Gold", hex: "#c9a769" },
  silver: { name: "Silver", hex: "#c4c4c6" },
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Small deterministic PRNG (Math.random is not allowed during prerender).
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function rng(seed: string | number) {
  let a = typeof seed === "string" ? hashString(seed) : seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function priceBand(p: number): PriceBand {
  if (p < 1500) return "under-1500";
  if (p < 3000) return "1500-3000";
  if (p < 6000) return "3000-6000";
  if (p < 15000) return "6000-15000";
  return "15000-plus";
}

function careFor(fabric: string, path: string): string[] {
  const f = fabric.toLowerCase();
  if (path.startsWith("home/candles")) return ["Trim the wick to 5 mm before each burn", "Never leave a burning candle unattended", "Burn for 3–4 hours at a time"];
  if (/stoneware|terracotta|ceramic|glaz/.test(f) || path.startsWith("home/decor") || path.startsWith("home/tableware")) return ["Hand wash with mild soap", "Not suitable for microwave or dishwasher unless stated", "Handmade — small variations are part of the piece"];
  if (/silver|gold-plated|brass|kundan|pearl|meenakari|enamel/.test(f)) return ["Store in the pouch provided", "Keep away from water, perfume and sweat", "Wipe gently with a soft dry cloth"];
  if (/velvet/.test(f)) return ["Dry clean only", "Steam on the reverse; never press directly"];
  if (/silk|satin|brocade|georgette|chanderi|organza|zari|zardozi|crepe/.test(f)) return ["Dry clean recommended", "Store folded in muslin away from sunlight", "Iron on the reverse at low heat"];
  if (/wool|merino|knit|cardigan|cable/.test(f)) return ["Hand wash cold or use a wool cycle", "Dry flat; never wring or tumble dry", "Store folded, not hung"];
  if (/leather/.test(f)) return ["Wipe with a soft dry cloth", "Condition every 3 months with neutral cream", "Keep away from direct heat and prolonged moisture"];
  if (/denim/.test(f)) return ["Wash inside out in cold water", "Wash sparingly to preserve colour", "Line dry"];
  if (/block|dyed|indigo|ajrakh|madder|shibori/.test(f) || /hand/.test(f)) return ["Wash separately the first 2–3 times — natural dyes may bleed", "Hand wash cold with mild detergent", "Dry in shade; iron while slightly damp"];
  if (/canvas|linen|hemp|cotton|mulmul|khadi|voile|poplin|jersey|modal|viscose|polyester|twill/.test(f)) return ["Machine wash cold on a gentle cycle", "Do not bleach", "Warm iron if needed"];
  return ["Follow the care label inside the product", "Wash gently with similar colours"];
}

function modelNoteFor(path: string): string | undefined {
  const [top, sub] = path.split("/");
  if (top === "women" && ["dresses", "indianwear", "tops", "knitwear", "bottoms", "jackets"].includes(sub)) return "Model is 5'9\" (175 cm) and wears size S";
  if (top === "men" && ["shirts", "tees", "ethnic", "trousers", "jackets"].includes(sub)) return "Model is 6'0\" (183 cm) and wears size M";
  return undefined;
}

function detailsFor(d: ProductDef, labelOrigin?: string): string[] {
  const out = [`Fabric: ${d.fabric}`, `Fit: ${d.fit}`];
  const a = d.art as Record<string, unknown>;
  if (typeof a.length === "string") out.push(`Length: ${a.length}`);
  if (typeof a.sleeve === "string" && a.sleeve !== "none") out.push(`Sleeve: ${String(a.sleeve).replace("-", " ")}`);
  if (typeof a.neckline === "string") out.push(`Neckline: ${a.neckline}`);
  if (typeof a.neck === "string") out.push(`Neck: ${a.neck}`);
  if (typeof a.trim === "string" && a.trim !== "none") out.push(`Trim: ${String(a.trim).replace("-", " ")}`);
  if (labelOrigin) out.push(`Made in: ${labelOrigin}`);
  return out;
}

function expand(d: ProductDef, rank: number): Product {
  const label = labelById[d.label];
  const r = rng(d.id);
  const sizes = SIZE_SETS[d.sizes];
  const oosSizes = new Set((d.oosSizes ?? "").split(",").map((s) => s.trim()).filter(Boolean));
  const lowSizes = new Set((d.low ?? "").split(",").map((s) => s.trim()).filter(Boolean));
  const variants: Variant[] = d.v.map(([colorName, colorHex, family], i) => {
    const stock: Record<string, number> = {};
    for (const s of sizes) {
      if (d.oos || oosSizes.has(s)) stock[s] = 0;
      else if (lowSizes.has(s)) stock[s] = 1 + Math.floor(r() * 3);
      else stock[s] = 4 + Math.floor(r() * 14);
    }
    // Make a second colour feel real: knock the largest size out of stock.
    if (i === 1 && !d.oos && sizes.length > 3) stock[sizes[sizes.length - 1]] = 0;
    return {
      id: `${d.id}-${i + 1}`,
      colorName,
      colorHex,
      family,
      // First colour gets the full set; further colours get front + alt (keeps the repo lean).
      images: (i === 0 ? ["front", "alt", "detail"] : ["front", "alt"]).map((shot) => `products/${d.id}/v${i + 1}-${shot}`),
      stock,
    };
  });
  const mrp = d.mrp && d.mrp > d.price ? d.mrp : d.price;
  const discount = mrp > d.price ? Math.round(((mrp - d.price) / mrp) * 100) : 0;
  const path = d.path.split("/");
  const tags = Array.from(new Set([...d.tags.split(/\s+/).filter(Boolean), ...path]));
  const soldOut = variants.every((v) => Object.values(v.stock).every((q) => q === 0));
  return {
    id: d.id,
    slug: slugify(d.name),
    name: d.name,
    labelId: d.label,
    categoryPath: path,
    price: d.price,
    mrp,
    discount,
    priceBand: priceBand(d.price),
    variants,
    sizes,
    fabric: d.fabric,
    fit: d.fit,
    care: careFor(d.fabric, d.path),
    description: d.d,
    details: detailsFor(d, label?.origin),
    modelNote: modelNoteFor(d.path),
    tags,
    responsible: !!d.resp || !!label?.flags.responsible,
    isNew: !!d.isNew,
    rank,
    rating: Math.round((3.9 + r() * 1.0) * 10) / 10,
    ratingCount: 14 + Math.floor(r() * r() * 1900),
    soldOut,
  };
}

// Curated order: round-robin across labels so neighbouring cards are rarely the same label.
function curatedOrder(list: ProductDef[]): ProductDef[] {
  const byLabel = new Map<string, ProductDef[]>();
  for (const d of list) byLabel.set(d.label, [...(byLabel.get(d.label) ?? []), d]);
  const queues = Array.from(byLabel.values());
  const out: ProductDef[] = [];
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const q of queues) {
      const next = q.shift();
      if (next) {
        out.push(next);
        progressed = true;
      }
    }
  }
  return out;
}

export const products: Product[] = curatedOrder(defs).map((d, i) => expand(d, i));

// De-duplicate slugs defensively.
{
  const seen = new Map<string, number>();
  for (const p of products) {
    const n = seen.get(p.slug) ?? 0;
    seen.set(p.slug, n + 1);
    if (n > 0) p.slug = `${p.slug}-${p.id}`;
  }
}

export const productById: Record<string, Product> = Object.fromEntries(products.map((p) => [p.id, p]));
export const productBySlug: Record<string, Product> = Object.fromEntries(products.map((p) => [p.slug, p]));
export const defById: Record<string, ProductDef> = Object.fromEntries(defs.map((d) => [d.id, d]));

export const categoryKey = (p: Product) => p.categoryPath.join("/");
export const heroImage = (p: Product, variant = 0, shot = 0) => p.variants[variant]?.images[shot] ?? p.variants[0].images[0];
export const inStockVariantIndex = (p: Product) => {
  const i = p.variants.findIndex((v) => Object.values(v.stock).some((q) => q > 0));
  return i < 0 ? 0 : i;
};
