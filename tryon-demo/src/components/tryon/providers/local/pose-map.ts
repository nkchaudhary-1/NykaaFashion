// Maps a garment rig onto a tracked body: where the torso's control points and each sleeve's bone should land.
// Pure functions over MediaPipe-style landmarks (33 points, normalised to the frame), unit-tested in Node.
//
// Orientation: the camera frame is NOT mirrored here (mirroring is a CSS flip on the output video). A person facing
// the camera has their RIGHT side on the frame's LEFT. The garment image is seen from the front, so its viewer-left
// sleeve is the wearer's right sleeve. Hence viewer-left anchors map to the person's right-side landmarks.
import type { Bone2 } from "./skin.ts";
import type { Pt } from "./tps.ts";

/** Fractions (0..1) of the full cutout. L/R = viewer's left/right. */
export type GarmentAnchors = {
  neck: Pt;
  shoulderL: Pt;
  shoulderR: Pt;
  sideL: Pt;
  sideR: Pt;
  hemL: Pt;
  hemR: Pt;
  sleeveTopL: Pt;
  sleeveTopR: Pt;
  elbowL: Pt;
  elbowR: Pt;
  cuffL: Pt;
  cuffR: Pt;
};

export type Sleeve = "long" | "short" | "none";

export type Landmark = { x: number; y: number; z: number; visibility: number };

export const LM = {
  nose: 0,
  lShoulder: 11,
  rShoulder: 12,
  lElbow: 13,
  rElbow: 14,
  lWrist: 15,
  rWrist: 16,
  lHip: 23,
  rHip: 24,
} as const;

/** Control points of the torso warp, in order. */
export const TORSO_ORDER = ["neck", "shoulderL", "shoulderR", "sideL", "sideR", "hemL", "hemR"] as const;

export type Hand = { x: number; y: number; r: number };

export type ArmTargets = {
  /** Shoulder → elbow → cuff, in garment image px. */
  src: Bone2;
  /** The same three points on the body, frame px. */
  dst: Bone2;
  /** wrist depth minus shoulder depth (MediaPipe z units; negative = closer to the camera). Null when the wrist is unseen. */
  depth: number | null;
  /** Convenience: depth < -0.1. The caller may add hysteresis. */
  front: boolean;
  /** Frame px per garment image px for this sleeve's width (body scale × sleeveBoost). */
  widthScale: number;
};

export type BodyTargets =
  | { ok: false; reason: "no-pose" | "shoulders-hidden" | "too-small" }
  | {
      ok: true;
      torso: { src: Pt[]; dst: Pt[] };
      arms: { L: ArmTargets; R: ArmTargets };
      shoulderWidth: number;
      /** Frame px per garment image px. */
      scale: number;
      /** Hands that are in front of the torso: draw the camera back on top there. */
      hands: Hand[];
    };

export type MapOptions = {
  sleeve: Sleeve;
  minVisibility?: number;
  /** How far outside the shoulder joint the garment's shoulder sits, as a fraction of shoulder width. */
  shoulderOut?: number;
  shoulderUp?: number;
  /** Neck anchor above the shoulder midpoint, as a fraction of shoulder width. */
  neckUp?: number;
  minShoulderPx?: number;
  /** Wrist depth (relative to the shoulders) below which a hand is "in front". */
  frontDepth?: number;
  /** Hem sits this far below the hip joints, as a fraction of shoulder width. */
  hemDown?: number;
  /** Extra width for sleeves on top of the body scale: fabric has volume around an arm. */
  sleeveBoost?: number;
};

const DEFAULTS = {
  minVisibility: 0.5,
  // Pose landmarks mark the shoulder JOINT; the visible shoulder, where a seam sits, is a good 12% of shoulder width further out.
  shoulderOut: 0.12,
  shoulderUp: 0.05,
  neckUp: 0.2,
  minShoulderPx: 40,
  frontDepth: -0.1,
  hemDown: 0.02,
  sleeveBoost: 1.25,
};

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Sleeve length relative to shoulder width in the garment: how far a sleeve should hang when the arm is not seen. */
export function sleeveRatio(anchors: GarmentAnchors, imageW: number, imageH: number): number {
  const px = (p: Pt): Pt => ({ x: p.x * imageW, y: p.y * imageH });
  const sw = dist(px(anchors.shoulderL), px(anchors.shoulderR)) || 1;
  const l = dist(px(anchors.sleeveTopL), px(anchors.elbowL)) + dist(px(anchors.elbowL), px(anchors.cuffL));
  const r = dist(px(anchors.sleeveTopR), px(anchors.elbowR)) + dist(px(anchors.elbowR), px(anchors.cuffR));
  return (l + r) / 2 / sw;
}

export function bodyTargets(
  anchors: GarmentAnchors,
  imageW: number,
  imageH: number,
  landmarks: readonly Landmark[] | null | undefined,
  frameW: number,
  frameH: number,
  options: MapOptions,
): BodyTargets {
  const o = { ...DEFAULTS, ...options };
  if (!landmarks || landmarks.length < 25) return { ok: false, reason: "no-pose" };

  const seen = (i: number) => landmarks[i].visibility >= o.minVisibility;
  const at = (i: number): Pt => ({ x: landmarks[i].x * frameW, y: landmarks[i].y * frameH });
  const img = (p: Pt): Pt => ({ x: p.x * imageW, y: p.y * imageH });

  if (!seen(LM.lShoulder) || !seen(LM.rShoulder)) return { ok: false, reason: "shoulders-hidden" };

  // Person's right side is on the frame's left (unmirrored frame).
  const rSh = at(LM.rShoulder); // frame-left
  const lSh = at(LM.lShoulder); // frame-right
  const sw = dist(lSh, rSh);
  if (sw < o.minShoulderPx) return { ok: false, reason: "too-small" };

  // Unit vectors along the shoulder line and toward the head, so offsets follow a tilted body.
  const ax = (lSh.x - rSh.x) / sw;
  const ay = (lSh.y - rSh.y) / sw;
  let upx = -ay;
  let upy = ax;
  if (upy > 0) {
    upx = -upx;
    upy = -upy;
  }

  const mid: Pt = { x: (lSh.x + rSh.x) / 2, y: (lSh.y + rSh.y) / 2 };
  const neck: Pt = { x: mid.x + upx * o.neckUp * sw, y: mid.y + upy * o.neckUp * sw };
  const shoulderOut = (p: Pt, side: -1 | 1): Pt => ({
    x: p.x + side * ax * o.shoulderOut * sw + upx * o.shoulderUp * sw,
    y: p.y + side * ay * o.shoulderOut * sw + upy * o.shoulderUp * sw,
  });
  const shL = shoulderOut(rSh, -1); // garment viewer-left = wearer's right
  const shR = shoulderOut(lSh, 1);

  const imgShoulderW = dist(img(anchors.shoulderL), img(anchors.shoulderR)) || 1;
  const scale = dist(shL, shR) / imgShoulderW;

  // Torso: the body says WHERE (shoulders, hips, lean); the garment says HOW WIDE (its own hem and side widths,
  // scaled). Pinning the hem to the hip joints would turn every boxy top into a tank top.
  const hipFallback = (sh: Pt): Pt => ({ x: sh.x - upx * 1.1 * sw, y: sh.y - upy * 1.1 * sw });
  const rHip = seen(LM.rHip) ? at(LM.rHip) : hipFallback(rSh);
  const lHip = seen(LM.lHip) ? at(LM.lHip) : hipFallback(lSh);
  const hipMid: Pt = { x: (rHip.x + lHip.x) / 2, y: (rHip.y + lHip.y) / 2 };
  const hemMid: Pt = { x: hipMid.x - upx * o.hemDown * sw, y: hipMid.y - upy * o.hemDown * sw };
  const shMid: Pt = { x: (shL.x + shR.x) / 2, y: (shL.y + shR.y) / 2 };
  const halfHem = (dist(img(anchors.hemL), img(anchors.hemR)) / 2) * scale;
  const halfSide = (dist(img(anchors.sideL), img(anchors.sideR)) / 2) * scale;
  const imgLen = Math.max(1e-6, (anchors.hemL.y + anchors.hemR.y) / 2 - (anchors.shoulderL.y + anchors.shoulderR.y) / 2);
  const sideFrac = ((anchors.sideL.y + anchors.sideR.y) / 2 - (anchors.shoulderL.y + anchors.shoulderR.y) / 2) / imgLen;
  const sideMid = lerp(shMid, hemMid, Math.min(0.9, Math.max(0.1, sideFrac)));
  const hemL: Pt = { x: hemMid.x - ax * halfHem, y: hemMid.y - ay * halfHem };
  const hemR: Pt = { x: hemMid.x + ax * halfHem, y: hemMid.y + ay * halfHem };
  const sideL: Pt = { x: sideMid.x - ax * halfSide, y: sideMid.y - ay * halfSide };
  const sideR: Pt = { x: sideMid.x + ax * halfSide, y: sideMid.y + ay * halfSide };

  // Sleeves. Long: elbow and wrist. Short: points part-way down the upper arm. None: tucked at the shoulder.
  const hang = sleeveRatio(anchors, imageW, imageH) * sw;
  const shoulderZ = Math.min(landmarks[LM.lShoulder].z, landmarks[LM.rShoulder].z);
  const arm = (sh: Pt, elbowI: number, wristI: number, srcBone: Bone2): ArmTargets => {
    const elbow = seen(elbowI) ? at(elbowI) : null;
    const wrist = seen(wristI) ? at(wristI) : null;
    const depth = wrist ? landmarks[wristI].z - shoulderZ : null;
    const front = depth !== null && depth < o.frontDepth;
    const down = { x: -upx, y: -upy };
    let e: Pt;
    let c: Pt;
    if (o.sleeve === "none") {
      const dir = elbow ?? { x: sh.x + down.x * sw, y: sh.y + down.y * sw };
      e = lerp(sh, dir, 0.12);
      c = lerp(sh, dir, 0.22);
    } else if (o.sleeve === "short") {
      const dir = elbow ?? { x: sh.x + down.x * 0.9 * sw, y: sh.y + down.y * 0.9 * sw };
      e = lerp(sh, dir, 0.25);
      c = lerp(sh, dir, 0.5);
    } else if (elbow && wrist) {
      e = elbow;
      c = wrist;
    } else if (elbow) {
      // forearm not seen: continue the upper arm's direction for the rest of the sleeve
      const upper = dist(sh, elbow) || 1;
      const t = Math.max(0, hang - upper);
      e = elbow;
      c = { x: elbow.x + ((elbow.x - sh.x) / upper) * t, y: elbow.y + ((elbow.y - sh.y) / upper) * t };
    } else {
      // arm not seen at all: the sleeve hangs straight down from the shoulder
      e = { x: sh.x + down.x * hang * 0.5, y: sh.y + down.y * hang * 0.5 };
      c = { x: sh.x + down.x * hang, y: sh.y + down.y * hang };
    }
    return { src: srcBone, dst: { s: sh, e, c }, depth, front, widthScale: scale * o.sleeveBoost };
  };
  // Each sleeve pivots at its own cap apex, placed relative to the body's shoulder exactly as it sits in the garment image.
  const pivot = (seamT: Pt, seam: Pt, tip: Pt): Pt => {
    const dx = (tip.x - seam.x) * scale; // along the shoulder line (+ = toward the garment's right)
    const dy = (tip.y - seam.y) * scale; // down the body
    return { x: seamT.x + ax * dx - upx * dy, y: seamT.y + ay * dx - upy * dy };
  };
  const armL = arm(pivot(shL, img(anchors.shoulderL), img(anchors.sleeveTopL)), LM.rElbow, LM.rWrist, {
    s: img(anchors.sleeveTopL),
    e: img(anchors.elbowL),
    c: img(anchors.cuffL),
  });
  const armR = arm(pivot(shR, img(anchors.shoulderR), img(anchors.sleeveTopR)), LM.lElbow, LM.lWrist, {
    s: img(anchors.sleeveTopR),
    e: img(anchors.elbowR),
    c: img(anchors.cuffR),
  });

  // Hands in front of the torso: the wrist is markedly closer to the camera than the shoulders and sits over the body.
  const hands: Hand[] = [];
  const torsoTop = Math.min(shL.y, shR.y) - 0.1 * sw;
  const torsoBottom = Math.max(hemL.y, hemR.y) + 0.1 * sw;
  const torsoLeft = Math.min(shL.x, hemL.x) - 0.05 * sw;
  const torsoRight = Math.max(shR.x, hemR.x) + 0.05 * sw;
  for (const [a, elbowI, wristI] of [
    [armL, LM.rElbow, LM.rWrist],
    [armR, LM.lElbow, LM.lWrist],
  ] as const) {
    if (!seen(wristI)) continue;
    const w = at(wristI);
    const overTorso = w.x > torsoLeft && w.x < torsoRight && w.y > torsoTop && w.y < torsoBottom;
    if (a.front && overTorso) {
      const forearm = seen(elbowI) ? dist(at(elbowI), w) : 0.5 * sw;
      hands.push({ x: w.x, y: w.y, r: Math.max(20, 0.55 * forearm) });
    }
  }

  const torsoSrc = TORSO_ORDER.map((k) => img(anchors[k]));
  const torsoDst: Pt[] = [neck, shL, shR, sideL, sideR, hemL, hemR];
  return { ok: true, torso: { src: torsoSrc, dst: torsoDst }, arms: { L: armL, R: armR }, shoulderWidth: sw, scale, hands };
}

/** Exponential smoothing of a landmark set, in place on `prev`. Visibility is smoothed too so arms don't flicker in and out. */
export function smoothLandmarks(prev: Landmark[] | null, next: readonly Landmark[], alpha: number): Landmark[] {
  if (!prev || prev.length !== next.length) return next.map((l) => ({ ...l }));
  for (let i = 0; i < next.length; i++) {
    const p = prev[i];
    const n = next[i];
    // Low-visibility points carry no position information: hold the previous position, decay the visibility.
    const a = n.visibility >= 0.3 ? alpha : 0;
    p.x += (n.x - p.x) * a;
    p.y += (n.y - p.y) * a;
    p.z += (n.z - p.z) * a;
    p.visibility += (n.visibility - p.visibility) * alpha;
  }
  return prev;
}
