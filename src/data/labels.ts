import type { Label } from "./types.ts";

// Brand names mirror the live Nykaa Fashion homepage and its House of Nykaa labels (PRD §1, §2.2). Hidden Gems, Luxe and the
// remaining labels are fictional. Every product, price and description is SAMPLE content — the prototype never implies a real
// listing, price or availability (the footer says so on every page).
export const labels: Label[] = [
  // ── House of Nykaa ──────────────────────────────────────────
  { id: "twenty-dresses", name: "Twenty Dresses", tagline: "Dresses and western wear.", story: "Twenty Dresses by Nykaa Fashion — the house label for dresses and everyday western wear. Product details in this prototype are sample content.", flags: { houseOfNykaa: true }, tone: { bg: "#f2d9d3", fg: "#6e2a2a" } },
  { id: "nykd", name: "Nykd by Nykaa", tagline: "Loungewear and innerwear.", story: "Nykd by Nykaa — the house label for loungewear, innerwear and soft basics. Product details in this prototype are sample content.", flags: { houseOfNykaa: true }, tone: { bg: "#e7e0d4", fg: "#3d3730" } },
  { id: "rsvp", name: "RSVP", tagline: "Occasionwear.", story: "RSVP by Nykaa Fashion — the house label for occasionwear: party, evening and wedding-season dressing. Product details in this prototype are sample content.", flags: { houseOfNykaa: true }, tone: { bg: "#3a1f2b", fg: "#f1d9c0" } },
  { id: "pipa-bella", name: "Pipa Bella", tagline: "Jewellery and bags.", story: "Pipa Bella by Nykaa Fashion — the house label for jewellery, bags and accessories. Product details in this prototype are sample content.", flags: { houseOfNykaa: true }, tone: { bg: "#efe3cf", fg: "#6a4d1c" } },
  { id: "gajra-gang", name: "Gajra Gang", tagline: "Festive accessories.", story: "Gajra Gang — a Nykaa Fashion house label for festive jewellery and accessories. Product details in this prototype are sample content.", flags: { houseOfNykaa: true }, tone: { bg: "#1f4d3a", fg: "#f3e2b8" } },
  { id: "likha", name: "Likha", tagline: "Indianwear.", story: "Likha by Nykaa Fashion — the house label for indianwear: kurtas, sets and festive edits. Product details in this prototype are sample content.", flags: { houseOfNykaa: true }, tone: { bg: "#e9c9b3", fg: "#5a2c19" } },

  // ── Hidden Gems — independent artisan labels ────────────────
  { id: "ajrakh-and-ash", name: "Ajrakh & Ash", tagline: "Block-printed in Kutch, dyed in the river.", story: "A family studio in Ajrakhpur printing with hand-carved teak blocks and natural indigo, madder and iron. Every metre is printed twice, rested for days, and washed in the river before it ever becomes a garment.", origin: "Kutch, Gujarat", founded: 2011, flags: { hiddenGem: true, responsible: true }, tone: { bg: "#27345f", fg: "#efe3d0" } },
  { id: "maati-loom", name: "Maati Loom", tagline: "Handwoven sarees from the Nadia delta.", story: "Forty weavers across three villages, working on pit looms that have not changed in a century. Maati Loom pays by the saree, not the hour — and documents each weaver on the tag.", origin: "Nadia, West Bengal", founded: 2014, flags: { hiddenGem: true, responsible: true }, tone: { bg: "#d9b25a", fg: "#3b2a08" } },
  { id: "indigo-hour", name: "Indigo Hour", tagline: "Shibori, folded by hand and left to the dye.", story: "Indigo Hour ties, clamps and dips every piece individually, so no two shirts match. The vats are fed with natural indigo and the water is treated and reused.", origin: "Jaipur, Rajasthan", founded: 2016, flags: { hiddenGem: true, responsible: true }, tone: { bg: "#2d4a7a", fg: "#e9eef6" } },
  { id: "kora-kala", name: "Kora Kala", tagline: "Chikankari, one stitch at a time.", story: "Women-led embroidery units in Lucknow working shadow-work, jaali and murri on mulmul and georgette. A single kurta can take three weeks of stitching.", origin: "Lucknow, Uttar Pradesh", founded: 2013, flags: { hiddenGem: true }, tone: { bg: "#efe9de", fg: "#4b3f2f" } },
  { id: "tilla-and-thread", name: "Tilla & Thread", tagline: "Zari that catches the lamp light.", story: "Banarasi brocade and real-zari borders, woven in Varanasi workshops and finished into festive kurtas, waistcoats and potlis.", origin: "Varanasi, Uttar Pradesh", founded: 2010, flags: { hiddenGem: true }, tone: { bg: "#6a1f2f", fg: "#f1d6a0" } },
  { id: "saanjh-silver", name: "Saanjh Silver", tagline: "Oxidised silver, hammered not cast.", story: "Third-generation silversmiths from Bikaner, hammering and oxidising 92.5 sterling into jewellery that gets better with wear.", origin: "Bikaner, Rajasthan", founded: 2009, flags: { hiddenGem: true }, tone: { bg: "#d9d6d0", fg: "#2c2a27" } },
  { id: "rangrez-home", name: "Rangrez Home", tagline: "Block-printed home textiles from Sanganer.", story: "The dyers of Sanganer have printed cloth for six centuries. Rangrez Home takes their patterns off the saree and puts them on cushions, throws and bedding.", origin: "Sanganer, Rajasthan", founded: 2015, flags: { hiddenGem: true, responsible: true }, tone: { bg: "#c8553d", fg: "#fbeedd" } },
  { id: "mitti-and-co", name: "Mitti & Co.", tagline: "Stoneware and terracotta from Khurja.", story: "Wheel-thrown, glazed once, fired in a wood kiln. Mitti & Co. works with Khurja potters to turn everyday ceramics into small objects of attention.", origin: "Khurja, Uttar Pradesh", founded: 2017, flags: { hiddenGem: true, responsible: true }, tone: { bg: "#b9704a", fg: "#fbefe3" } },

  // ── Luxe ────────────────────────────────────────────────────
  { id: "maison-aurelle", name: "Maison Aurelle", tagline: "Silk, cut on the bias.", story: "Maison Aurelle is a Mumbai–Paris atelier known for liquid silks and quiet tailoring. Each pattern is draped on a form before it is ever drawn.", origin: "Mumbai × Paris", founded: 2012, flags: { luxe: true }, tone: { bg: "#1c1814", fg: "#d9c08a" } },
  { id: "atelier-noor", name: "Atelier Noor", tagline: "Couture embroidery, made to be inherited.", story: "Zardozi, resham and pearl-work executed by master karigars in Delhi. Atelier Noor produces fewer than two hundred pieces a season.", origin: "New Delhi", founded: 2008, flags: { luxe: true }, tone: { bg: "#241a22", fg: "#e7c9a1" } },
  { id: "studio-vesper", name: "Studio Vesper", tagline: "Leather goods, built to age.", story: "Vegetable-tanned leather, hand-burnished edges and hardware cast in solid brass. Studio Vesper repairs every piece for life.", origin: "Chennai", founded: 2013, flags: { luxe: true }, tone: { bg: "#2a211a", fg: "#cda776" } },
  { id: "orsay-and-rao", name: "Orsay & Rao", tagline: "Tailoring for the unhurried.", story: "Menswear cut with soft shoulders and honest linings, finished by hand in a Bengaluru workroom. Made-to-measure on request.", origin: "Bengaluru", founded: 2011, flags: { luxe: true }, tone: { bg: "#232620", fg: "#d6cfb8" } },

  // ── Mainstream & everyday ───────────────────────────────────
  { id: "little-orchard", name: "Little Orchard", tagline: "Kidswear that survives playgrounds.", story: "Soft cottons, smocking and print, with extra-deep hems that grow with the child. Tested by actual toddlers.", origin: "Chennai", founded: 2018, flags: { responsible: true }, tone: { bg: "#f2d3a4", fg: "#5a3512" } },
  { id: "hearth-and-hue", name: "Hearth & Hue", tagline: "Objects for slow evenings.", story: "Candles, vases and soft furnishings in amber, clay and oat. Poured and made in small batches.", origin: "Goa", founded: 2018, flags: {}, tone: { bg: "#e7d6bd", fg: "#4c3a1f" } },
  { id: "loom-and-leaf", name: "Loom & Leaf", tagline: "Organic basics, no compromises.", story: "GOTS-certified cotton, hemp and recycled yarns — made into the tees, shirts and trousers that anchor a responsible wardrobe.", origin: "Coimbatore", founded: 2015, flags: { responsible: true }, tone: { bg: "#c9d4bc", fg: "#2c3a25" } },
  // ── Brands (names as on the live homepage; sample listings) ──
  { id: "vero-moda", name: "Vero Moda", tagline: "Western wear for every day.", story: "Sample listings in the Vero Moda range — product details on this page are illustrative.", flags: {}, tone: { bg: "#f4f4f6", fg: "#001325" } },
  { id: "us-polo", name: "U.S. Polo Assn.", tagline: "Everyday menswear.", story: "Sample listings in the U.S. Polo Assn. range — product details on this page are illustrative.", flags: {}, tone: { bg: "#e8edf5", fg: "#12263b" } },
  { id: "hm", name: "H&M", tagline: "Denim and everyday basics.", story: "Sample listings in the H&M range — product details on this page are illustrative.", flags: {}, tone: { bg: "#fde4e4", fg: "#5a1515" } },
  { id: "puma", name: "Puma", tagline: "Sport-inspired footwear.", story: "Sample listings in the Puma range — product details on this page are illustrative.", flags: {}, tone: { bg: "#eceef1", fg: "#1c2430" } },
  { id: "cider", name: "Cider", tagline: "Trend-led knitwear.", story: "Sample listings in the Cider range — product details on this page are illustrative.", flags: {}, tone: { bg: "#fff0f6", fg: "#7a1a47" } },
];

export const labelById: Record<string, Label> = Object.fromEntries(labels.map((l) => [l.id, l]));

export const hiddenGemLabels = labels.filter((l) => l.flags.hiddenGem);
export const luxeLabels = labels.filter((l) => l.flags.luxe);
export const hon = labels.filter((l) => l.flags.houseOfNykaa);
