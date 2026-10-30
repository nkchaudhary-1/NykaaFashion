import type { SceneDef, SceneItem } from "./types.ts";

// Editorial scenes (edit covers, story covers, shoppable look-boards).
// Each scene composes real catalogue products so shoppable pins always resolve to a product.
// Rendered by scripts/art → /public/img/scenes/<key>.webp (+ pin coordinates in image-meta.json).

type Slot = { cx: number; cy: number; h: number; rot?: number };
type Format = "wide" | "tall" | "land";

const SIZE: Record<Format, [number, number]> = { wide: [1600, 900], tall: [1000, 1250], land: [1500, 1000] };

const SLOTS: Record<Format, Record<number, Slot[]>> = {
  wide: {
    1: [{ cx: 0.74, cy: 0.5, h: 0.86 }],
    2: [{ cx: 0.62, cy: 0.5, h: 0.84 }, { cx: 0.84, cy: 0.5, h: 0.8 }],
    3: [{ cx: 0.55, cy: 0.5, h: 0.78 }, { cx: 0.73, cy: 0.48, h: 0.88, rot: -1 }, { cx: 0.91, cy: 0.5, h: 0.76 }],
    4: [{ cx: 0.5, cy: 0.5, h: 0.72 }, { cx: 0.65, cy: 0.48, h: 0.84 }, { cx: 0.8, cy: 0.5, h: 0.8 }, { cx: 0.94, cy: 0.52, h: 0.66 }],
  },
  tall: {
    1: [{ cx: 0.5, cy: 0.5, h: 0.86 }],
    2: [{ cx: 0.3, cy: 0.5, h: 0.8 }, { cx: 0.7, cy: 0.52, h: 0.76 }],
    3: [{ cx: 0.2, cy: 0.52, h: 0.66 }, { cx: 0.5, cy: 0.48, h: 0.84 }, { cx: 0.8, cy: 0.52, h: 0.66 }],
    4: [{ cx: 0.17, cy: 0.5, h: 0.58 }, { cx: 0.39, cy: 0.47, h: 0.76 }, { cx: 0.62, cy: 0.5, h: 0.76 }, { cx: 0.84, cy: 0.52, h: 0.58 }],
  },
  land: {
    2: [{ cx: 0.33, cy: 0.5, h: 0.86 }, { cx: 0.67, cy: 0.5, h: 0.8 }],
    3: [{ cx: 0.2, cy: 0.5, h: 0.8 }, { cx: 0.5, cy: 0.48, h: 0.9 }, { cx: 0.8, cy: 0.5, h: 0.8 }],
    4: [{ cx: 0.14, cy: 0.5, h: 0.72 }, { cx: 0.38, cy: 0.48, h: 0.86 }, { cx: 0.62, cy: 0.5, h: 0.86 }, { cx: 0.86, cy: 0.5, h: 0.72 }],
  },
};

type Entry = string | [string, number];
interface Opts {
  safe?: "left" | "right" | "none";
  motifColor?: string;
  bg2?: string;
  /** every item carries a shoppable pin */
  pins?: boolean;
}

function scene(key: string, format: Format, bg: string, motif: SceneDef["motif"], entries: Entry[], opts: Opts = {}): SceneDef {
  const [w, h] = SIZE[format];
  const slots = SLOTS[format][entries.length];
  if (!slots) throw new Error(`scene ${key}: no layout for ${entries.length} items in ${format}`);
  const safe = opts.safe ?? (format === "wide" ? "left" : "none");
  const items: SceneItem[] = entries.map((e, i) => {
    const [product, v] = Array.isArray(e) ? e : [e, 1];
    const s = slots[i];
    const cx = format === "wide" && safe === "right" ? 1 - s.cx : s.cx;
    return { product, v, cx, cy: s.cy, height: s.h, rot: s.rot, pin: !!opts.pins, z: i };
  });
  return { key, w, h, bg, bg2: opts.bg2, motif, motifColor: opts.motifColor, safe, items };
}

// Backdrop palette per edit identity.
const BG = {
  gem: "#e8d1c0",
  luxe: "#2b2520",
  resp: "#d7dfcb",
  festive: "#efd3c6",
  hon: "#f4dcdc",
  sand: "#e9e0d3",
  ink: "#2a241e",
  home: "#e6dccb",
  mist: "#d6dee0",
};

export const scenes: SceneDef[] = [
  // ── Edit covers ─────────────────────────────────────────────
  scene("edit-hidden-gems-tall", "tall", BG.gem, "arch", ["aja-01", "maa-03"], { motifColor: "#d9b79f" }),
  scene("edit-hidden-gems-wide", "wide", BG.gem, "arch", ["aja-01", "maa-01", "saa-01"], { motifColor: "#d9b79f" }),
  scene("edit-luxe-tall", "tall", BG.luxe, "window", ["mau-01", "ves-01"], { motifColor: "#3a322b" }),
  scene("edit-luxe-wide", "wide", BG.luxe, "window", ["mau-01", "mau-02", "ves-03"], { motifColor: "#3a322b" }),
  scene("edit-responsible-tall", "tall", BG.resp, "circle", ["loo-04", "jun-05"], { motifColor: "#c4cfb5" }),
  scene("edit-responsible-wide", "wide", BG.resp, "circle", ["loo-04", "jun-05", "loo-01"], { motifColor: "#c4cfb5" }),
  scene("edit-festive-tall", "tall", BG.festive, "circle", ["lik-03", "gaj-01"], { motifColor: "#e3a31a" }),
  scene("edit-festive-wide", "wide", BG.festive, "circle", ["lik-03", "til-01", "gaj-01"], { motifColor: "#e3b34a" }),
  scene("edit-house-of-nykaa-tall", "tall", BG.hon, "steps", ["twd-01", "pip-03"], { motifColor: "#ecc7cc" }),
  scene("edit-house-of-nykaa-wide", "wide", BG.hon, "steps", ["twd-01", "rsv-01", "pip-03"], { motifColor: "#ecc7cc" }),
  scene("edit-new-in-tall", "tall", BG.sand, "stripe", ["twd-01", "mit-03"], { motifColor: "#ddd1bf" }),
  scene("edit-new-in-wide", "wide", BG.sand, "stripe", ["aja-02", "nor-04", "mit-03"], { motifColor: "#ddd1bf" }),
  scene("edit-under-1500-tall", "tall", BG.sand, "stripe", ["nyk-01", "pip-01"], { motifColor: "#ddd1bf" }),
  scene("edit-under-1500-wide", "wide", BG.sand, "stripe", ["nyk-01", "nor-05", "pip-01"], { motifColor: "#ddd1bf" }),
  scene("edit-under-3000-tall", "tall", BG.mist, "arch", ["jun-01", "nyk-03"], { motifColor: "#c8d3d6" }),
  scene("edit-under-3000-wide", "wide", BG.mist, "arch", ["twd-05", "jun-01", "nyk-03"], { motifColor: "#c8d3d6" }),
  scene("edit-the-offer-edit-tall", "tall", BG.ink, "circle", ["rsv-01", "hav-03"], { motifColor: "#3a3027" }),
  scene("edit-the-offer-edit-wide", "wide", BG.ink, "circle", ["rsv-01", "hav-03", "str-01"], { motifColor: "#3a3027" }),

  // ── Category tiles ──────────────────────────────────────────
  scene("cat-women", "tall", "#ecd9cf", "arch", ["twd-02", "lik-02"], { motifColor: "#dfc3b5" }),
  scene("cat-men", "tall", "#d9dcd2", "window", ["nor-02", "ora-03"], { motifColor: "#c9cdc0" }),
  scene("cat-kids", "tall", "#f2e2b9", "circle", ["lit-01", "lit-02"], { motifColor: "#ecd08a" }),
  scene("cat-home", "tall", BG.home, "steps", ["ran-01", "mit-02", "hea-01"], { motifColor: "#d9c9b0" }),
  scene("auth-side", "tall", "#e8d3c4", "arch", ["maa-03", "gaj-01"], { motifColor: "#d9b79f" }),

  // ── Story: The Block-Print Revival ──────────────────────────
  scene("story-block-print-wide", "wide", BG.gem, "arch", ["aja-01", "aja-03", "ran-01"], { pins: true, motifColor: "#d9b79f" }),
  scene("story-block-print-tall", "tall", BG.gem, "arch", ["aja-01", "aja-04"], { pins: true, motifColor: "#d9b79f" }),
  scene("story-block-print-1", "land", "#e9d6c5", "window", ["aja-01", "aja-03", "aja-04"], { pins: true, motifColor: "#dcc3ad" }),
  scene("story-block-print-2", "land", "#e3d3c2", "steps", ["ran-01", "ind-04", "ran-04"], { pins: true, motifColor: "#d5bea6" }),

  // ── Story: Diwali, Dressed Slowly ───────────────────────────
  scene("story-diwali-wide", "wide", BG.festive, "circle", ["lik-03", "til-01", "gaj-01"], { pins: true, motifColor: "#e3b34a" }),
  scene("story-diwali-tall", "tall", BG.festive, "circle", ["lik-01", "til-01"], { pins: true, motifColor: "#e3b34a" }),
  scene("story-diwali-1", "land", "#efd9cd", "circle", ["lik-01", "lik-03", "gaj-01"], { pins: true, motifColor: "#e6bf6a" }),
  scene("story-diwali-2", "land", "#ecd4c6", "arch", ["til-03", "gaj-02", "gaj-03"], { pins: true, motifColor: "#e0b99f" }),

  // ── Story: Quiet Luxe ───────────────────────────────────────
  scene("story-quiet-luxe-wide", "wide", BG.luxe, "window", ["mau-01", "mau-03", "ves-01"], { pins: true, motifColor: "#3a322b" }),
  scene("story-quiet-luxe-tall", "tall", BG.luxe, "window", ["mau-02", "ves-03"], { pins: true, motifColor: "#3a322b" }),
  scene("story-quiet-luxe-1", "land", "#2f2923", "window", ["mau-01", "mau-03", "ves-04"], { pins: true, motifColor: "#40372f" }),
  scene("story-quiet-luxe-2", "land", "#2b2a24", "steps", ["ora-01", "ora-02", "ves-05"], { pins: true, motifColor: "#3b392f" }),

  // ── Story: One Dress, Five Ways ─────────────────────────────
  scene("story-one-dress-wide", "wide", BG.hon, "steps", [["twd-02", 1], ["twd-02", 2], "pip-03"], { pins: true, motifColor: "#ecc7cc" }),
  scene("story-one-dress-tall", "tall", BG.hon, "steps", [["twd-02", 1], "str-01"], { pins: true, motifColor: "#ecc7cc" }),
  scene("story-one-dress-1", "land", "#f2dcda", "arch", [["twd-02", 1], "str-01", "pip-03"], { pins: true, motifColor: "#e8c4c3" }),
  scene("story-one-dress-2", "land", "#eed5d3", "circle", [["twd-02", 2], "ves-04", "pip-02"], { pins: true, motifColor: "#e3bbb9" }),

  // ── Story: Wear Less, Better ────────────────────────────────
  scene("story-wear-less-wide", "wide", BG.resp, "circle", ["loo-04", "jun-05", "loo-01"], { pins: true, motifColor: "#c4cfb5" }),
  scene("story-wear-less-tall", "tall", BG.resp, "circle", ["loo-04", "jun-05"], { pins: true, motifColor: "#c4cfb5" }),
  scene("story-wear-less-1", "land", "#dde4d1", "window", ["loo-01", "jun-05", "loo-04"], { pins: true, motifColor: "#cdd8c0" }),
  scene("story-wear-less-2", "land", "#d9e0cd", "stripe", ["mir-03", "jun-03", "str-04"], { pins: true, motifColor: "#c9d3bb" }),

  // ── Story: The Slow Home ────────────────────────────────────
  scene("story-slow-home-wide", "wide", BG.home, "steps", ["ran-02", "mit-03", "hea-01"], { pins: true, motifColor: "#d9c9b0" }),
  scene("story-slow-home-tall", "tall", BG.home, "steps", ["ran-03", "mit-02"], { pins: true, motifColor: "#d9c9b0" }),
  scene("story-slow-home-1", "land", "#eadfcd", "arch", ["ran-01", "mit-01", "hea-01"], { pins: true, motifColor: "#dccbb0" }),
  scene("story-slow-home-2", "land", "#e6dac7", "window", ["hea-03", "mit-04", "hea-04"], { pins: true, motifColor: "#d6c4a8" }),
];

export const sceneByKey: Record<string, SceneDef> = Object.fromEntries(scenes.map((s) => [s.key, s]));
