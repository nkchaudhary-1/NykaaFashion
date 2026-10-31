// Which picked photos feed which pictures on the site. Groups are in groups.mjs; photos in a group are ordered (the first is its primary) — see manifest.mjs.
// Scenes, launches and pop-ups are listed explicitly; products are routed by their kind (poolsOf) and share their pool's photos.
// A slot whose group has no photo yet is simply not built: the picture it has now stays.

/** Scene bases (the part of `scenes/<base>-<tall|wide|1|2>`) → [group, photo index, …]. Fewer photos than slots: the build reuses photos in turn, with a different window. */
export const SCENE_PHOTOS = {
  "cat-women": ["s-cat-women", 0],
  "auth-side": ["s-cat-women", 1],
  "cat-men": ["s-cat-men", 0],
  "cat-kids": ["s-cat-kids", 0],
  "cat-home": ["s-cat-home", 0],
  "edit-festive": ["s-festive", 0],
  "edit-hidden-gems": ["s-craft", 0],
  "edit-responsible": ["s-craft", 1],
  "edit-luxe": ["s-luxe", 0],
  "edit-house-of-nykaa": ["s-everyday", 0],
  "edit-new-in": ["s-everyday", 1],
  "edit-under-1500": ["s-everyday", 2],
  "edit-under-3000": ["s-everyday", 3],
  "edit-the-offer-edit": ["s-offers", 0],
  // stories: tall ← photo 0 · wide ← the first landscape photo · 1 ← photo 1 · 2 ← photo 2 (every one of the four carries shoppable pins, so each shows the garments or objects its pins stand for)
  "story-block-print": ["s-block-print", 0, 1, 2],
  "story-diwali": ["s-diwali", 0, 1, 2],
  "story-one-dress": ["s-one-dress", 0, 1, 2],
  "story-quiet-luxe": ["s-quiet-luxe", 0, 1, 2],
  "story-slow-home": ["s-slow-home", 0, 1, 2],
  "story-wear-less": ["s-wear-less", 0, 1, 2],
};

/** The home page's banners (placeholders/<subject>-<ratio>, the old two-photograph ratio set the hero and the Diwali band still draw) → [group, photo index]. */
export const PLACEHOLDER_PHOTOS = { "kurta-set": ["h-indian", 0], "boucle-suit": ["h-western", 0] };

/** New & Next brands (launches/<id>/<role>) → their group. Roles: hero-wide, hero-tall, g1…g4. */
export const LAUNCH_GROUP = { vrisa: "l-vrisa", halden: "l-halden", "kiln-and-linen": "l-kiln", hm: "l-hm", cider: "l-cider", "hearth-and-hue": "l-hearth" };

/** Pop-up pictures (promo/<id>) → [group, photo index]. promo/vrisa-teaser is the first frame of the video clip: scripts/placeholders/promo-video.mjs. */
export const PROMO_PHOTOS = { "first-order": ["l-vrisa", 1], "halden-preview": ["l-halden", 0], "delivery-notice": ["s-everyday", 0] };

// ── products ───────────────────────────────────────────────────────────────────────────────────────────────────
// A launch piece's art kind is "launch": its kind comes from its category instead.
const KIND_FROM_PATH = {
  "women/indianwear": "kurta-set", "women/jackets": "jacket", "women/bottoms": "trousers", "women/tops": "top", "women/knitwear": "sweater", "women/footwear": "heel", "women/jewellery": "earrings",
  "home/cushions": "cushion", "home/throws": "throw", "home/decor": "vase", "home/candles": "candle", "home/tableware": "bowl",
};
const POOL = {
  women: { "kurta-set": "p-kurta-set", kurta: "p-kurta-set", saree: "p-saree", dress: "p-dress", top: "p-top-w", tee: "p-top-w", shirt: "p-top-w", skirt: "p-bottoms-w", trousers: "p-bottoms-w", jacket: "p-jacket-w", sweater: "p-knit-w", boot: "p-heel-boot", heel: "p-heel-boot", flat: "p-heel-boot", sneaker: "p-sneaker", bag: "p-bag", earrings: "p-earrings", necklace: "p-necklace", bangles: "p-bangles" },
  men: { kurta: "p-kurta-m", jacket: "p-jacket-m", shirt: "p-shirt-m", tee: "p-tee-m", trousers: "p-trousers-m", sneaker: "p-sneaker", flat: "p-heel-boot" },
  kids: { sneaker: "p-sneaker" },
  home: { candle: "p-candle", cushion: "p-cushion", vase: "p-vase-bowl", bowl: "p-vase-bowl", throw: "p-throw", bedding: "p-throw" },
};
/** When a pool has no photos (yet), these stand in, in order. */
export const POOL_FALLBACK = {
  "p-saree": ["p-kurta-set", "p-dress"], "p-kurta-set": ["p-dress"], "p-kurta-m": ["p-shirt-m"], "p-tee-m": ["p-shirt-m"], "p-trousers-m": ["p-shirt-m"], "p-jacket-m": ["p-shirt-m"],
  "p-top-w": ["p-dress"], "p-bottoms-w": ["p-dress", "p-top-w"], "p-jacket-w": ["p-top-w", "p-dress"], "p-knit-w": ["p-top-w", "p-dress"], "p-kids": ["p-kurta-set"],
  "p-heel-boot": ["p-sneaker"], "p-necklace": ["p-earrings"], "p-bangles": ["p-earrings", "p-necklace"], "p-candle": ["p-vase-bowl"], "p-cushion": ["p-throw"], "p-throw": ["p-cushion"],
};

/** The groups that may serve a product, best first. `def` is a ProductDef (id, path, art.kind). */
export function poolsOf(def) {
  const [top] = def.path.split("/");
  const kind = def.art?.kind === "launch" ? KIND_FROM_PATH[def.path] : def.art?.kind;
  const main = top === "kids" ? (POOL.kids[kind] ?? "p-kids") : POOL[top]?.[kind];
  const out = [];
  if (def.id.startsWith("vri-") && def.path === "women/indianwear") out.push("l-vrisa"); // a brand's own launch pictures first
  if (def.id.startsWith("hal-") && ["women/jackets", "women/bottoms", "women/tops", "women/knitwear"].includes(def.path)) out.push("l-halden");
  if (def.id.startsWith("kil-") && ["home/decor", "home/tableware"].includes(def.path)) out.push("l-kiln");
  if (main) out.push(main, ...(POOL_FALLBACK[main] ?? []));
  return out;
}

/** How a pool's photos are framed and whether they may be mirrored. Indian wear is never mirrored (drape, pallu, asymmetric hems); neither are jewellery pairs. */
const OBJECT = { kind: "object", flip: true };
export const POOL_STYLE = {
  "p-kurta-set": { kind: "figure", flip: false }, "p-saree": { kind: "figure", flip: false }, "p-kurta-m": { kind: "figure", flip: false }, "p-kids": { kind: "figure", flip: false },
  "p-dress": { kind: "figure", flip: true }, "p-top-w": { kind: "figure", flip: true }, "p-bottoms-w": { kind: "figure", flip: true }, "p-jacket-w": { kind: "figure", flip: true }, "p-knit-w": { kind: "figure", flip: true },
  "p-shirt-m": { kind: "figure", flip: true }, "p-tee-m": { kind: "figure", flip: true }, "p-trousers-m": { kind: "figure", flip: true }, "p-jacket-m": { kind: "figure", flip: true },
  "l-vrisa": { kind: "figure", flip: false }, "l-halden": { kind: "figure", flip: true }, "l-kiln": OBJECT,
  "p-sneaker": OBJECT, "p-heel-boot": OBJECT, "p-bag": OBJECT, "p-earrings": { kind: "object", flip: false }, "p-necklace": { kind: "object", flip: false }, "p-bangles": { kind: "object", flip: false },
  "p-candle": OBJECT, "p-cushion": OBJECT, "p-vase-bowl": OBJECT, "p-throw": OBJECT,
};
export const styleOf = (group) => POOL_STYLE[group] ?? OBJECT;

/** The three views of a product, as windows around the photo's focus point: dy moves the middle of the window up (−) or down (+) as a fraction of the photo's height. */
export const FRAMING = {
  figure: { front: { zoom: 1, dy: 0 }, alt: { zoom: 1.5, dy: -0.12 }, detail: { zoom: 2.3, dy: 0.2 } },
  object: { front: { zoom: 1, dy: 0 }, alt: { zoom: 1.4, dy: 0 }, detail: { zoom: 2.1, dy: 0.03 } },
};

/** Largest file size (KB) per kind of picture; the build lowers the webp quality until it fits (never below 62). */
export const BUDGET_KB = { product: 130, tall: 200, wide: 260, land: 220, promo: 70 };

/** Where the text of a wide banner sits (fractions of the picture): top left. This area must be calm and its colour is what the heading's colour is chosen from. */
export const COPY_AREA = { x0: 0.03, x1: 0.5, y0: 0.06, y1: 0.62 };
/** Where the subject sits in a wide banner (fraction of its width): right of centre, clear of the copy. */
export const WIDE_SUBJECT_AT = 0.68;

/** What a picture is used for, in words, for the credits page. */
export function usedFor(key, def) {
  const [top, a, b] = key.split("/");
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  if (top === "products" && def) return `Product pictures · ${def.path.split("/").map((s) => cap(s)).join(" › ")}`;
  if (top === "launches") return `New & Next · ${a.split("-").map(cap).join(" ")}`;
  if (top === "promo") return "Pop-ups";
  if (top === "placeholders") return "Home page banners";
  if (top === "scenes") return /^(cat-|auth-)/.test(a) ? "Category pictures" : a.startsWith("edit-") ? "Edits" : a.startsWith("story-") ? "Style Files stories" : "Editorial";
  return "Site pictures";
}
