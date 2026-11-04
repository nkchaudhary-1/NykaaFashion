import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LM,
  TORSO_ORDER,
  bodyTargets,
  sleeveRatio,
  smoothLandmarks,
  type GarmentAnchors,
  type Landmark,
} from "../src/components/tryon/providers/local/pose-map.ts";

// A boxy long-sleeve top, as fractions of a 1200x1000 cutout: sleeves hang beside the body.
const anchors: GarmentAnchors = {
  neck: { x: 0.5, y: 0.05 },
  shoulderL: { x: 0.28, y: 0.08 },
  shoulderR: { x: 0.72, y: 0.08 },
  sideL: { x: 0.3, y: 0.35 },
  sideR: { x: 0.7, y: 0.35 },
  hemL: { x: 0.3, y: 0.9 },
  hemR: { x: 0.7, y: 0.9 },
  sleeveTopL: { x: 0.24, y: 0.07 },
  sleeveTopR: { x: 0.76, y: 0.07 },
  elbowL: { x: 0.22, y: 0.5 },
  elbowR: { x: 0.78, y: 0.5 },
  cuffL: { x: 0.2, y: 0.92 },
  cuffR: { x: 0.8, y: 0.92 },
};
const IMG = { w: 1200, h: 1000 };
const FRAME = { w: 1280, h: 720 };

/** A person facing the camera, centred, arms down. Normalised coords; wearer's right side on the frame's left. */
function person(over: Partial<Record<number, Partial<Landmark>>> = {}): Landmark[] {
  const lm: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0 }));
  const set = (i: number, x: number, y: number, z = 0, visibility = 0.95) => (lm[i] = { x, y, z, visibility });
  set(LM.nose, 0.5, 0.2);
  set(LM.rShoulder, 0.4, 0.35); // frame-left
  set(LM.lShoulder, 0.6, 0.35); // frame-right
  set(LM.rElbow, 0.37, 0.52);
  set(LM.lElbow, 0.63, 0.52);
  set(LM.rWrist, 0.36, 0.68);
  set(LM.lWrist, 0.64, 0.68);
  set(LM.rHip, 0.43, 0.72);
  set(LM.lHip, 0.57, 0.72);
  for (const [i, patch] of Object.entries(over)) lm[+i] = { ...lm[+i], ...patch };
  return lm;
}

const tidx = (k: (typeof TORSO_ORDER)[number]) => TORSO_ORDER.indexOf(k);
const go = (lm: Landmark[] | null, sleeve: "long" | "short" | "none" = "long") => bodyTargets(anchors, IMG.w, IMG.h, lm, FRAME.w, FRAME.h, { sleeve });

describe("bodyTargets", () => {
  it("fails cleanly with no pose, hidden shoulders, or a person too far away", () => {
    assert.deepEqual(go(null), { ok: false, reason: "no-pose" });
    assert.deepEqual(go(person({ [LM.lShoulder]: { visibility: 0.1 } })), { ok: false, reason: "shoulders-hidden" });
    assert.deepEqual(go(person({ [LM.rShoulder]: { x: 0.49 }, [LM.lShoulder]: { x: 0.51 } })), { ok: false, reason: "too-small" });
  });

  it("maps the garment's viewer-left side onto the wearer's RIGHT side (frame-left), unmirrored", () => {
    const t = go(person());
    assert.ok(t.ok);
    const shL = t.torso.dst[tidx("shoulderL")];
    const shR = t.torso.dst[tidx("shoulderR")];
    assert.ok(shL.x < shR.x, "garment left shoulder must land on the frame's left");
    assert.ok(shL.x < 0.4 * FRAME.w && shL.x > 0.4 * FRAME.w - 0.2 * t.shoulderWidth, "garment shoulder sits a little outside the joint");
    assert.ok(shR.x > 0.6 * FRAME.w);
    assert.ok(shL.y < 0.35 * FRAME.h, "and slightly above it");
    assert.equal(t.torso.src.length, TORSO_ORDER.length);
    assert.equal(t.torso.dst.length, TORSO_ORDER.length);
    assert.deepEqual(t.torso.src[tidx("neck")], { x: 0.5 * IMG.w, y: 0.05 * IMG.h });
    // each sleeve pivots at its cap apex, placed relative to the body's shoulder as it sits in the garment image
    assert.deepEqual(t.arms.L.src.s, { x: 0.24 * IMG.w, y: 0.07 * IMG.h });
    const dx = (0.24 - 0.28) * IMG.w * t.scale;
    const dy = (0.07 - 0.08) * IMG.h * t.scale;
    assert.ok(Math.abs(t.arms.L.dst.s.x - (shL.x + dx)) < 1e-6 && Math.abs(t.arms.L.dst.s.y - (shL.y + dy)) < 1e-6, "left pivot offset");
    assert.ok(Math.abs(t.arms.R.dst.s.x - (shR.x - dx)) < 1e-6 && Math.abs(t.arms.R.dst.s.y - (shR.y + dy)) < 1e-6, "right pivot offset");
  });

  it("scale is frame px per image px, from shoulder width", () => {
    const t = go(person());
    assert.ok(t.ok);
    const imgSw = (0.72 - 0.28) * IMG.w;
    const targetSw = Math.hypot(t.torso.dst[tidx("shoulderR")].x - t.torso.dst[tidx("shoulderL")].x, 0);
    assert.ok(Math.abs(t.scale - targetSw / imgSw) < 1e-9);
  });

  it("long sleeves follow the elbows and wrists when they are seen", () => {
    const t = go(person());
    assert.ok(t.ok);
    assert.deepEqual(t.arms.L.dst.c, { x: 0.36 * FRAME.w, y: 0.68 * FRAME.h });
    assert.deepEqual(t.arms.R.dst.c, { x: 0.64 * FRAME.w, y: 0.68 * FRAME.h });
    assert.deepEqual(t.arms.L.dst.e, { x: 0.37 * FRAME.w, y: 0.52 * FRAME.h });
  });

  it("a raised arm pulls its sleeve up with it, the other still hangs", () => {
    const t = go(person({ [LM.lElbow]: { x: 0.72, y: 0.22 }, [LM.lWrist]: { x: 0.8, y: 0.05 } }));
    assert.ok(t.ok);
    assert.ok(t.arms.R.dst.c.y < t.arms.R.dst.s.y, "cuff above the shoulder");
    assert.ok(t.arms.L.dst.c.y > t.arms.L.dst.s.y, "the other sleeve still hangs");
  });

  it("an unseen arm lets the sleeve hang straight down from the shoulder, scaled to the body", () => {
    const t = go(person({ [LM.rElbow]: { visibility: 0.1 }, [LM.rWrist]: { visibility: 0.1 } }));
    assert.ok(t.ok);
    const { s, e, c } = t.arms.L.dst;
    assert.ok(Math.abs(c.x - s.x) < 1e-9, "hangs straight down");
    const expected = sleeveRatio(anchors, IMG.w, IMG.h) * t.shoulderWidth;
    assert.ok(Math.abs(c.y - s.y - expected) < 1e-6, "hang length follows the garment's own proportions");
    assert.ok(Math.abs(e.y - (s.y + expected / 2)) < 1e-6);
    assert.equal(t.arms.L.depth, null);
    assert.equal(t.arms.L.front, false);
  });

  it("an unseen wrist continues the upper arm's direction", () => {
    const t = go(person({ [LM.lWrist]: { visibility: 0.2 } }));
    assert.ok(t.ok);
    const { s, e, c } = t.arms.R.dst;
    const d1 = Math.atan2(e.y - s.y, e.x - s.x);
    const d2 = Math.atan2(c.y - e.y, c.x - e.x);
    assert.ok(Math.abs(d1 - d2) < 1e-6, "cuff continues along the upper arm");
  });

  it("short sleeves stop part-way down the upper arm; no sleeves tuck at the shoulder", () => {
    const short = go(person(), "short");
    assert.ok(short.ok);
    const el = { x: 0.37 * FRAME.w, y: 0.52 * FRAME.h };
    assert.ok(short.arms.L.dst.c.y > short.arms.L.dst.s.y && short.arms.L.dst.c.y < el.y);
    const none = go(person(), "none");
    assert.ok(none.ok);
    assert.ok(none.arms.L.dst.c.y < short.arms.L.dst.c.y, "sleeveless cuff anchor stays closer to the shoulder");
  });

  it("the body places the hem (just below the hips) but the garment keeps its own width; missing hips fall back", () => {
    const t = go(person());
    assert.ok(t.ok);
    const hemL = t.torso.dst[tidx("hemL")];
    const hemR = t.torso.dst[tidx("hemR")];
    const shL = t.torso.dst[tidx("shoulderL")];
    const shR = t.torso.dst[tidx("shoulderR")];
    const sideL = t.torso.dst[tidx("sideL")];
    // vertical: a touch below the hip joints
    assert.ok(hemL.y > 0.72 * FRAME.h && hemL.y < 0.72 * FRAME.h + 0.05 * t.shoulderWidth);
    // width: the garment's hem/shoulder ratio (0.4 / 0.44 in these anchors), NOT the narrow hip joints
    const ratio = (hemR.x - hemL.x) / (shR.x - shL.x);
    assert.ok(Math.abs(ratio - 0.4 / 0.44) < 1e-6, `hem/shoulder ratio ${ratio}`);
    assert.ok(hemR.x - hemL.x > (0.57 - 0.43) * FRAME.w, "wider than the hip joints");
    assert.ok(sideL.y > shL.y && sideL.y < hemL.y);
    const t2 = go(person({ [LM.rHip]: { visibility: 0 }, [LM.lHip]: { visibility: 0 } }));
    assert.ok(t2.ok);
    assert.ok(t2.torso.dst[tidx("hemL")].y > t2.torso.dst[tidx("shoulderL")].y + t2.shoulderWidth, "hem well below the shoulders");
  });

  it("sleeves get the body scale plus a volume boost", () => {
    const t = go(person());
    assert.ok(t.ok);
    assert.ok(Math.abs(t.arms.L.widthScale - t.scale * 1.25) < 1e-9);
  });

  it("flags a hand as in front only when the wrist is closer to the camera AND over the torso; reports depth for hysteresis", () => {
    const behind = go(person());
    assert.ok(behind.ok && behind.hands.length === 0, "arms down beside the body: no overlay");
    assert.equal(behind.arms.L.depth, 0);
    const crossed = go(person({ [LM.lWrist]: { x: 0.45, y: 0.5, z: -0.4 }, [LM.lElbow]: { x: 0.6, y: 0.5, z: -0.2 } }));
    assert.ok(crossed.ok && crossed.hands.length === 1);
    assert.ok(Math.abs(crossed.hands[0].x - 0.45 * FRAME.w) < 1e-6);
    assert.ok(crossed.hands[0].r >= 20);
    assert.equal(crossed.arms.R.front, true);
    assert.ok(Math.abs((crossed.arms.R.depth ?? 0) + 0.4) < 1e-9);
    const overButNotInFront = go(person({ [LM.lWrist]: { x: 0.45, y: 0.5, z: 0.05 } }));
    assert.ok(overButNotInFront.ok && overButNotInFront.hands.length === 0 && overButNotInFront.arms.R.front === false);
  });

  it("follows a tilted shoulder line (offsets rotate with the body)", () => {
    const t = go(person({ [LM.rShoulder]: { x: 0.4, y: 0.3 }, [LM.lShoulder]: { x: 0.6, y: 0.4 } }));
    assert.ok(t.ok);
    const neck = t.torso.dst[tidx("neck")];
    const mid = { x: 0.5 * FRAME.w, y: 0.35 * FRAME.h };
    assert.ok(neck.y < mid.y, "neck is above the shoulder midpoint");
    assert.ok(neck.x > mid.x, "and shifted the way the head tilts (perpendicular to the shoulder line)");
  });
});

describe("smoothLandmarks", () => {
  it("eases toward new positions and holds position while a point is unseen", () => {
    const prev = smoothLandmarks(null, person(), 0.5);
    const s = smoothLandmarks(prev, person({ [LM.lWrist]: { x: 0.9, y: 0.1 } }), 0.5);
    assert.ok(Math.abs(s[LM.lWrist].x - 0.77) < 1e-9); // halfway from 0.64 to 0.9
    const s2 = smoothLandmarks(s, person({ [LM.lWrist]: { x: 0.1, y: 0.1, visibility: 0.05 } }), 0.5);
    assert.ok(Math.abs(s2[LM.lWrist].x - 0.77) < 1e-9, "position held while unseen");
    assert.ok(s2[LM.lWrist].visibility < 0.95 && s2[LM.lWrist].visibility > 0.05, "visibility decays rather than snapping");
  });
});
