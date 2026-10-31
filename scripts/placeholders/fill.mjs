// Every image the site draws — product shots, gallery views, category / edit / story scenes, auth panel — cut from the two supplied
// photographs and from nothing else. Keys, sizes and the metadata the UI reads (average colour, blur preview, wall/floor edge colours,
// shoppable pins) are unchanged, so no component needs to know.
//   node scripts/placeholders/fill.mjs [--only prefix]
//
// How the two photographs stand in for a whole catalogue:
//  • A key's size picks the ratio; its name picks the photograph and the window: Indian wear and kids show the kurta set, western wear the
//    suit, footwear the juttis / sneakers, jewellery the earrings, soft furnishings the bouclé chair, decor the vases. Front / alt / detail
//    shots of one product are three different windows (and mirrored for colour variants), so a gallery has something to flip through.
//  • Windows are plain crops (and mirrors) of the photograph; where a portrait window reaches past the photo's edge, the seamless studio
//    backdrop is extended (lib.mjs) — the figure is never altered, nothing is recoloured, nothing is added.
//  • Shoppable pins sit on the garment, jewellery or footwear that is actually visible in each scene's window.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { productById } from "../../src/data/catalog.ts";
import { PAD, SUBJECTS, extendCanvas, hex, regionHex, rng, root } from "./lib.mjs";

const SRC = join(root, "scripts/placeholders/source");
const IMG = join(root, "public/img");
const META = join(root, "src/data/generated/image-meta.json");
const onlyIdx = process.argv.indexOf("--only");
const ONLY = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

// ── Windows onto each photograph (source pixels; the photographs are 1536×1024) ────────────────────────────────
const K = {
  full: { cx: 800, cy: 575, sw: 980 },
  torso: { cx: 800, cy: 590, sw: 700 },
  face: { cx: 790, cy: 430, sw: 560 },
  hem: { cx: 1010, cy: 800, sw: 580 },
  jutti: { cx: 690, cy: 720, sw: 600 },
  vases: { cx: 500, cy: 620, sw: 640 },
  drape: { cx: 1090, cy: 760, sw: 620 },
};
const B = {
  full: { cx: 762, cy: 575, sw: 720 },
  blazer: { cx: 750, cy: 520, sw: 640 },
  face: { cx: 745, cy: 420, sw: 520 },
  hands: { cx: 760, cy: 650, sw: 600 },
  trousers: { cx: 720, cy: 740, sw: 640 },
  sneakers: { cx: 740, cy: 650, sw: 600 },
  chair: { cx: 740, cy: 690, sw: 760 },
  chairTex: { cx: 740, cy: 740, sw: 580 },
};
// What a visitor can point at in each photograph (source pixels), most useful first — shoppable pins land on these.
const ANCHORS = {
  "kurta-set": [[800, 560], [803, 383], [690, 868], [1010, 790], [500, 650], [1130, 760]],
  "boucle-suit": [[735, 470], [700, 730], [650, 820], [830, 850], [760, 520], [700, 640]],
};
const MAX_SCALE = 1.8; // output px per source px — beyond this a window turns soft

const H = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
};
const j = (key, salt, amp) => (H(key + salt) * 2 - 1) * amp;

// ── Which photograph and window each key gets ─────────────────────────────────────────────────────────────────
function groupOf(p) {
  const [top, sub] = p.categoryPath;
  if (top === "home") return ["cushions", "throws"].includes(sub) ? "homeSoft" : "homeHard";
  if (sub === "footwear") return "footwear";
  if (sub === "jewellery") return "jewellery";
  if (sub === "bags") return "bags";
  if (top === "kids" || sub === "indianwear" || sub === "ethnic") return "ethnic";
  return "western";
}
const SHOTS = {
  ethnic: { front: ["kurta-set", K.full], alt: ["kurta-set", K.torso], detail: ["kurta-set", K.hem] },
  western: { front: ["boucle-suit", B.full], alt: ["boucle-suit", B.blazer], detail: ["boucle-suit", B.trousers] },
  footwear: { front: ["boucle-suit", B.sneakers], alt: ["kurta-set", K.jutti], detail: ["boucle-suit", B.sneakers] },
  jewellery: { front: ["kurta-set", K.face], alt: ["boucle-suit", B.face], detail: ["kurta-set", K.face] },
  bags: { front: ["boucle-suit", B.blazer], alt: ["kurta-set", K.torso], detail: ["boucle-suit", B.hands] },
  homeSoft: { front: ["boucle-suit", B.chair], alt: ["boucle-suit", B.chair], detail: ["boucle-suit", B.chairTex] },
  homeHard: { front: ["kurta-set", K.vases], alt: ["kurta-set", K.vases], detail: ["kurta-set", K.drape] },
};

function productSpec(key) {
  const m = /^products\/([^/]+)\/v(\d+)-(\w+)$/.exec(key);
  const p = m && productById[m[1]];
  if (!p) return null;
  const variant = Number(m[2]);
  const shot = m[3];
  const group = groupOf(p);
  const set = SHOTS[group];
  let [subject, win] = set[shot] ?? set.front;
  // about a third of the Indian / western pieces lead with the closer crop, so a row of cards is not one picture repeated
  if ((group === "ethnic" || group === "western") && H(p.id + "close") < 0.34 && shot !== "detail") [subject, win] = shot === "front" ? set.alt : set.front;
  // mirrored per product, per colour variant and for the second view, so neighbouring cards differ and swapping a swatch or thumbnail changes the picture
  const flip = ((variant % 2 === 0) !== (shot === "alt")) !== H(p.id + "flip") < 0.5;
  return { subject, win: { ...win, sw: win.sw * (shot === "detail" ? 0.86 : 1) }, flip, jitter: 0.09 + 0.02 * (variant - 1) };
}

const SCENE_SUBJECT = {
  "cat-women": "kurta-set", "cat-men": "boucle-suit", "cat-kids": "kurta-set", "cat-home": "boucle-suit", "auth-side": "kurta-set",
  "edit-festive": "kurta-set", "edit-hidden-gems": "kurta-set", "edit-house-of-nykaa": "kurta-set", "edit-luxe": "boucle-suit",
  "edit-responsible": "boucle-suit", "edit-new-in": "boucle-suit", "edit-the-offer-edit": "kurta-set", "edit-under-1500": "boucle-suit", "edit-under-3000": "kurta-set",
  "story-block-print": "kurta-set", "story-diwali": "kurta-set", "story-one-dress": "boucle-suit", "story-quiet-luxe": "boucle-suit", "story-slow-home": "boucle-suit", "story-wear-less": "boucle-suit",
};
const MIRROR_SCENE = new Set(["cat-kids", "edit-hidden-gems", "edit-responsible", "edit-under-3000", "story-wear-less", "story-one-dress"]);

function sceneSpec(key, W, H_) {
  const m = /^scenes\/(.+?)(?:-(tall|wide|1|2))?$/.exec(key);
  if (!m) return null;
  const base = key.replace(/^scenes\//, "").replace(/-(tall|wide|1|2)$/, "");
  const kind = m[2] ?? "tall";
  const subject = SCENE_SUBJECT[base];
  if (!subject) return null;
  const k = subject === "kurta-set";
  const mirror = MIRROR_SCENE.has(base);
  const ratio = W / H_;
  if (ratio > 1.7) {
    // wide banner: the subject sits just right of centre — copy goes on the calm wall to its left, and a centred crop still keeps it in frame
    const sw = Math.round(W / 1.15);
    return { subject, win: { cx: k ? 688 : 650, cy: 536, sw }, flip: false, jitter: 0 };
  }
  if (ratio > 1.3) {
    // 3:2 — the photograph itself, or a closer look at the figure
    return kind === "2" ? { subject, win: k ? { cx: 800, cy: 540, sw: 1000 } : { cx: 760, cy: 560, sw: 900 }, flip: true, jitter: 0 } : { subject, win: { cx: 768, cy: 512, sw: 1536 }, flip: false, jitter: 0 };
  }
  if (base === "cat-home") return { subject, win: B.chair, flip: true, jitter: 0 };
  if (base === "cat-kids") return { subject, win: K.torso, flip: true, jitter: 0 };
  if (base === "auth-side") return { subject, win: { cx: 790, cy: 470, sw: 760 }, flip: false, jitter: 0 };
  return { subject, win: k ? K.full : B.full, flip: mirror, jitter: 0.02 };
}

// ── Launch campaign pictures (src/data/launches.ts): the hero pair and the gallery of each brand, cut from the same two photographs ──
// Which photograph a brand's campaign uses, and — for home brands — whether it frames objects (the chair, the vases) rather than the model.
const LAUNCH_SUBJECT = { vrisa: "kurta-set", halden: "boucle-suit", "kiln-and-linen": "boucle-suit", hm: "boucle-suit", cider: "kurta-set", "hearth-and-hue": "kurta-set" };
const LAUNCH_HOME = new Set(["kiln-and-linen", "hearth-and-hue"]);
function launchSpec(key) {
  const m = /^launches\/([^/]+)\/([\w-]+)$/.exec(key);
  const subject = m && LAUNCH_SUBJECT[m[1]];
  if (!subject) return null;
  const [, id, role] = m;
  const k = subject === "kurta-set";
  const home = LAUNCH_HOME.has(id);
  const flip = H(key) < 0.5;
  // copy goes on the calm wall to the left of the figure, so the banner never mirrors; the framing varies a little per brand so two brands on one photograph do not share a picture
  if (role === "hero-wide") { const t = H(key + "w"); return { subject, win: { cx: (k ? 688 : 650) + Math.round((t - 0.5) * 50), cy: 536 + Math.round((t - 0.5) * 30), sw: 1330 + Math.round(t * 160) }, flip: false, jitter: 0 }; }
  if (role === "g4") return { subject, win: { cx: 768, cy: 512, sw: 1536 }, flip, jitter: 0 }; // the whole photograph, 3:2
  const vases = { cx: 415, cy: 650, sw: 450 }; // the vases and the dried flowers, without the model
  const frames = home ? (k ? { "hero-tall": vases, g1: { cx: 430, cy: 700, sw: 420 }, g2: K.drape, g3: { cx: 410, cy: 610, sw: 400 } } : { "hero-tall": B.chair, g1: B.chair, g2: B.chairTex, g3: B.chair }) : k ? { "hero-tall": K.full, g1: K.torso, g2: K.face, g3: { cx: 975, cy: 735, sw: 520 } } : { "hero-tall": B.full, g1: B.blazer, g2: B.face, g3: B.trousers };
  return { subject, win: frames[role] ?? (k ? K.full : B.full), flip: role === "g2" ? !flip : flip, jitter: role === "hero-tall" ? 0.03 : 0.05 };
}

// ── Pop-up (PiP) pictures (src/data/promos.ts): 4:3 windows onto the same two photographs. The video poster promo/vrisa-teaser is made with its clip (promo-video.mjs). ──
const PROMO = { "first-order": ["kurta-set", { cx: 800, cy: 540, sw: 1000 }, false], "halden-preview": ["boucle-suit", { cx: 762, cy: 540, sw: 1060 }, false], "delivery-notice": ["boucle-suit", { cx: 770, cy: 560, sw: 1200 }, true] };
function promoSpec(key) {
  const e = /^promo\/([\w-]+)$/.exec(key) && PROMO[/^promo\/([\w-]+)$/.exec(key)[1]];
  return e ? { subject: e[0], win: e[1], flip: e[2], jitter: 0.02 } : null;
}

// ── Canvas per photograph (decoded once) ──────────────────────────────────────────────────────────────────────
const CANVAS = {};
for (const [name, subj] of Object.entries(SUBJECTS)) {
  const { data, info } = await sharp(join(SRC, subj.file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const ext = extendCanvas(Float32Array.from(data), info.width, info.height, 0.5, rng(name.length * 7919 + 17));
  CANVAS[name] = { raw: Buffer.from(Uint8ClampedArray.from(ext.data).buffer), w: ext.w, h: ext.h };
}

async function cut({ subject, win, flip, jitter }, key, W, H_) {
  const c = CANVAS[subject];
  let sw = Math.max(W / MAX_SCALE, win.sw * (1 + j(key, "z", jitter)));
  const sh = (sw * H_) / W;
  const cx = win.cx + j(key, "x", sw * jitter * 0.7);
  const cy = win.cy + j(key, "y", sh * jitter * 0.5);
  let left = Math.round(cx - sw / 2 + PAD);
  let top = Math.round(cy - sh / 2 + PAD);
  const width = Math.min(Math.round(sw), c.w);
  const height = Math.min(Math.round(sh), c.h);
  left = Math.max(0, Math.min(c.w - width, left));
  top = Math.max(0, Math.min(c.h - height, top));
  let img = sharp(c.raw, { raw: { width: c.w, height: c.h, channels: 3 } }).extract({ left, top, width, height }).resize(W, H_, { kernel: "lanczos3" });
  if (flip) img = img.flop();
  if (W / width > 1.05) img = img.sharpen({ sigma: 0.6, m1: 0.5, m2: 0.8 });
  const png = await img.png().toBuffer();
  // where the window really sits (source px), for pin placement
  return { png, x0: left - PAD, y0: top - PAD, sw: width, sh: height };
}

/** Pins on the most useful anchors that are comfortably inside the window, kept apart from one another. */
function placePins(spec, ids, view) {
  const out = [];
  const inside = (x, y) => x > 0.12 && x < 0.88 && y > 0.12 && y < 0.88;
  for (const [ax, ay] of ANCHORS[spec.subject]) {
    if (out.length === ids.length) break;
    let x = (ax - view.x0) / view.sw;
    const y = (ay - view.y0) / view.sh;
    if (spec.flip) x = 1 - x;
    if (!inside(x, y)) continue;
    if (out.some((p) => Math.hypot((p.x - x) * 1.6, p.y - y) < 0.16)) continue;
    out.push({ x, y });
  }
  // a window with fewer visible anchors than pins: fill from a fixed spread across the figure
  const spread = [[0.5, 0.42], [0.42, 0.66], [0.6, 0.7]];
  for (const [x, y] of spread) if (out.length < ids.length && !out.some((p) => Math.hypot((p.x - x) * 1.6, p.y - y) < 0.12)) out.push({ x, y });
  return ids.map((id, i) => ({ id, x: +out[i].x.toFixed(4), y: +out[i].y.toFixed(4) }));
}

// ── Run ───────────────────────────────────────────────────────────────────────────────────────────────────────
const meta = JSON.parse(readFileSync(META, "utf8"));
// pictures cut from Unsplash photographs (scripts/unsplash/build.mjs) are not this script's to overwrite
const OWNED = (() => {
  try {
    return new Set(Object.keys(JSON.parse(readFileSync(join(root, "src/data/generated/photo-assignments.json"), "utf8"))));
  } catch {
    return new Set();
  }
})();
let done = 0;
const skipped = [];
for (const key of Object.keys(meta)) {
  if (key.startsWith("placeholders/")) continue; // the ratio variants are build.mjs's
  if (key === "promo/vrisa-teaser") continue; // the first frame of the clip — promo-video.mjs makes it
  if (ONLY && !key.startsWith(ONLY)) continue;
  if (OWNED.has(key)) continue;
  const old = meta[key];
  const W = old.w, H_ = old.h;
  const spec = productSpec(key) ?? sceneSpec(key, W, H_) ?? launchSpec(key) ?? promoSpec(key);
  if (!spec) {
    skipped.push(key);
    continue;
  }
  const view = await cut(spec, key, W, H_);
  const quality = key.startsWith("products/") ? 78 : 86;
  mkdirSync(dirname(join(IMG, `${key}.webp`)), { recursive: true }); // a brand-new key (a launch, a new product) has no folder yet
  writeFileSync(join(IMG, `${key}.webp`), await sharp(view.png).webp({ quality, effort: 5 }).toBuffer());
  const st = await sharp(view.png).stats();
  const m = { w: W, h: H_, avg: hex(st.channels[0].mean, st.channels[1].mean, st.channels[2].mean) };
  if (old.pins?.length) m.pins = placePins(spec, old.pins.map((p) => p.id), view);
  if (old.edge) {
    m.edge = {
      wall: [await regionHex(view.png, 0, H_ * 0.3, W * 0.04, H_ * 0.2), await regionHex(view.png, W * 0.96, H_ * 0.3, W * 0.04, H_ * 0.2)],
      floor: [await regionHex(view.png, 0, H_ * 0.9, W * 0.04, H_ * 0.08), await regionHex(view.png, W * 0.96, H_ * 0.9, W * 0.04, H_ * 0.08)],
      floorY: 0.82,
    };
  }
  if (old.blur) m.blur = `data:image/webp;base64,${(await sharp(view.png).resize(16, Math.max(2, Math.round((16 * H_) / W))).webp({ quality: 25 }).toBuffer()).toString("base64")}`;
  meta[key] = m;
  done++;
  if (done % 100 === 0) console.log(`… ${done}`);
}
const sorted = Object.fromEntries(Object.entries(meta).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(META, JSON.stringify(sorted, null, 1) + "\n");
console.log(`${done} images cut from the two photographs${skipped.length ? `; no rule for: ${skipped.join(", ")}` : ""}`);
