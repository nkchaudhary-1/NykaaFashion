import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { skinPoint, skinSleeve, type Bone2 } from "../src/components/tryon/providers/local/skin.ts";
import { buildMesh } from "../src/components/tryon/providers/local/tps.ts";

const near = (a: { x: number; y: number }, b: { x: number; y: number }, eps = 1e-6) => Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;

// A sleeve hanging straight down in the image: shoulder (100,100) -> elbow (100,300) -> cuff (100,500)
const src: Bone2 = { s: { x: 100, y: 100 }, e: { x: 100, y: 300 }, c: { x: 100, y: 500 } };

describe("two-bone sleeve skinning", () => {
  it("is the identity when the arm matches the sleeve and scale is 1", () => {
    for (const p of [{ x: 100, y: 100 }, { x: 130, y: 200 }, { x: 70, y: 450 }, { x: 100, y: 520 }, { x: 90, y: 60 }]) {
      assert.ok(near(skinPoint(p, src, src, 1), p), `identity failed at ${JSON.stringify(p)}`);
    }
  });

  it("points on the bone axis land on the target axis at the same fraction", () => {
    // arm raised: horizontal, to the right, twice as long
    const dst: Bone2 = { s: { x: 500, y: 500 }, e: { x: 900, y: 500 }, c: { x: 1300, y: 500 } };
    assert.ok(near(skinPoint({ x: 100, y: 200 }, src, dst, 1), { x: 700, y: 500 })); // half-way up the upper arm
    assert.ok(near(skinPoint({ x: 100, y: 500 }, src, dst, 1), { x: 1300, y: 500 })); // the cuff
    assert.ok(near(skinPoint({ x: 100, y: 100 }, src, dst, 1), { x: 500, y: 500 })); // the shoulder
  });

  it("keeps side offsets perpendicular to the target bone, scaled by `scale`", () => {
    const dst: Bone2 = { s: { x: 500, y: 500 }, e: { x: 900, y: 500 }, c: { x: 1300, y: 500 } };
    // 30px to the side of the upper arm in the image -> 60px perpendicular (scale 2) to the horizontal target bone
    const q = skinPoint({ x: 130, y: 200 }, src, dst, 2);
    assert.ok(Math.abs(q.x - 700) < 1e-6);
    assert.ok(Math.abs(Math.abs(q.y - 500) - 60) < 1e-6);
    // the opposite side goes the opposite way
    const q2 = skinPoint({ x: 70, y: 200 }, src, dst, 2);
    assert.ok(Math.abs(q.y - 500 + (q2.y - 500)) < 1e-6);
  });

  it("the forearm follows its own bone when the elbow bends", () => {
    const dst: Bone2 = { s: { x: 500, y: 100 }, e: { x: 500, y: 300 }, c: { x: 700, y: 300 } }; // forearm turned 90° to the right
    const q = skinPoint({ x: 100, y: 450 }, src, dst, 1); // 3/4 down the forearm in the image
    assert.ok(near(q, { x: 650, y: 300 }, 1e-6));
  });

  it("blends smoothly across the elbow: no jump between the two bones", () => {
    const dst: Bone2 = { s: { x: 500, y: 100 }, e: { x: 500, y: 300 }, c: { x: 700, y: 300 } };
    let prev = skinPoint({ x: 120, y: 200 }, src, dst, 1);
    for (let y = 202; y <= 400; y += 2) {
      const q = skinPoint({ x: 120, y }, src, dst, 1);
      assert.ok(Math.hypot(q.x - prev.x, q.y - prev.y) < 12, `jump near y=${y}`);
      prev = q;
    }
  });

  it("extrapolates beyond the cuff and above the shoulder (the sleeve head and cuff edge still render)", () => {
    const dst: Bone2 = { s: { x: 500, y: 500 }, e: { x: 900, y: 500 }, c: { x: 1300, y: 500 } };
    assert.ok(near(skinPoint({ x: 100, y: 540 }, src, dst, 1), { x: 1380, y: 500 }));
    assert.ok(near(skinPoint({ x: 100, y: 80 }, src, dst, 1), { x: 460, y: 500 }));
  });

  it("skins a whole mesh in part coordinates", () => {
    const mesh = buildMesh(2, 4);
    const part = { origin: { x: 60, y: 80 }, w: 80, h: 460 }; // the sleeve's box in the image
    const dst: Bone2 = { s: { x: 500, y: 500 }, e: { x: 900, y: 500 }, c: { x: 1300, y: 500 } };
    skinSleeve(mesh, part, src, dst, 1);
    // top-left grid vertex is image (60,80): above the shoulder by 20, 40 to the side
    const q = skinPoint({ x: 60, y: 80 }, src, dst, 1);
    assert.ok(Math.abs(mesh.pos[0] - q.x) < 1e-6 && Math.abs(mesh.pos[1] - q.y) < 1e-6);
    for (const v of mesh.pos) assert.ok(Number.isFinite(v));
  });
});
